import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import slugifyLib from 'slugify';

const prisma = new PrismaClient();

type Row = { practice: string; service: string };

function normalizeHeaderKey(key: string): string {
  return key.trim().toLowerCase();
}

function pickColumns(rows: Record<string, any>[]) {
  const headers = Object.keys(rows[0] ?? {});
  if (headers.length < 2) return { practiceKey: headers[0], serviceKey: headers[1] };
  // Heuristic: practice column repeats a lot, service column is more unique
  let bestPracticeKey = headers[0];
  let bestServiceKey = headers[1];
  let bestPracticeScore = Infinity; // lower unique ratio is better
  let bestServiceScore = -1; // higher unique ratio is better
  for (const key of headers) {
    const values = rows.map((r) => String(r[key] ?? '').trim()).filter(Boolean);
    const total = values.length || 1;
    const unique = new Set(values).size;
    const ratio = unique / total;
    if (ratio < bestPracticeScore) {
      bestPracticeScore = ratio;
      bestPracticeKey = key;
    }
    if (ratio > bestServiceScore) {
      bestServiceScore = ratio;
      bestServiceKey = key;
    }
  }
  if (bestPracticeKey === bestServiceKey) {
    // Fallback to first/second
    bestPracticeKey = headers[0];
    bestServiceKey = headers[1] ?? headers[0];
  }
  return { practiceKey: bestPracticeKey, serviceKey: bestServiceKey };
}

async function readPracticeServiceRows(excelPath: string): Promise<Row[]> {
  const buf = await fs.readFile(excelPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (rawRows.length === 0) return [];
  const { practiceKey, serviceKey } = pickColumns(rawRows);
  const rows: Row[] = [];
  for (const r of rawRows) {
    const practice = String(r[practiceKey] ?? '').trim();
    const service = String(r[serviceKey] ?? '').trim();
    if (!practice || !service) continue;
    rows.push({ practice, service });
  }
  return rows;
}

function slugifyTitle(title: string, locale: 'en' | 'ka' | 'ru'): string {
  return slugifyLib(title, {
    lower: true,
    strict: true,
    locale,
    trim: true,
  });
}

async function buildEnMappingFromExcel(enExcelPath: string) {
  const rows = await readPracticeServiceRows(enExcelPath);
  // Group by practice in order
  const practiceOrder: string[] = [];
  const practiceToServices: Record<string, string[]> = {};
  for (const { practice, service } of rows) {
    const pSlug = slugifyTitle(practice, 'en');
    if (!practiceOrder.includes(pSlug)) practiceOrder.push(pSlug);
    const sSlug = slugifyTitle(service, 'en');
    if (!practiceToServices[pSlug]) practiceToServices[pSlug] = [];
    practiceToServices[pSlug].push(sSlug);
  }
  // Map to DB service IDs
  const serviceSlugToId: Record<string, string> = {};
  const allSlugs = Array.from(new Set(Object.values(practiceToServices).flat()));
  const dbServices = await prisma.service.findMany({ where: { slug: { in: allSlugs } }, select: { id: true, slug: true } });
  for (const s of dbServices) serviceSlugToId[s.slug] = s.id;
  return { practiceOrder, practiceToServices, serviceSlugToId };
}

function groupByPracticeInOrder(rows: Row[]) {
  const practiceOrder: string[] = [];
  const grouped: Record<string, string[]> = {};
  for (const { practice, service } of rows) {
    if (!practiceOrder.includes(practice)) practiceOrder.push(practice);
    if (!grouped[practice]) grouped[practice] = [];
    grouped[practice].push(service);
  }
  return { practiceOrder, grouped };
}

async function updateLocaleFromExcel(locale: 'ka' | 'ru', excelFilename: string) {
  const dataDir = join(process.cwd(), 'data', 'Practice-areas');
  const enExcelPath = join(dataDir, 'Legal_Service_Catalog_Full.xlsx');
  const localeExcelPath = join(dataDir, excelFilename);

  const { practiceOrder: enPracticeOrder, practiceToServices: enPToS, serviceSlugToId } = await buildEnMappingFromExcel(enExcelPath);
  const localeRows = await readPracticeServiceRows(localeExcelPath);
  const { practiceOrder: localePracticeOrder, grouped: localeGrouped } = groupByPracticeInOrder(localeRows);

  let updated = 0;
  let skipped = 0;

  // Assume practice order alignment between EN and locale files
  for (let pi = 0; pi < Math.min(enPracticeOrder.length, localePracticeOrder.length); pi++) {
    const enPracticeSlug = enPracticeOrder[pi];
    const localePractice = localePracticeOrder[pi];
    const enServices = enPToS[enPracticeSlug] || [];
    const localeServices = localeGrouped[localePractice] || [];
    const count = Math.min(enServices.length, localeServices.length);
    for (let si = 0; si < count; si++) {
      const enServiceSlug = enServices[si];
      const localeTitle = localeServices[si];
      const serviceId = serviceSlugToId[enServiceSlug];
      if (!serviceId) { skipped++; continue; }
      const localeSlug = slugifyTitle(localeTitle, locale);
      try {
        await prisma.serviceTranslation.upsert({
          where: { serviceId_locale: { serviceId, locale } },
          create: { serviceId, locale, title: localeTitle, slug: localeSlug },
          update: { title: localeTitle, slug: localeSlug },
        });
        updated++;
      } catch {
        skipped++;
      }
    }
  }
  console.log(`Locale ${locale}: Updated ${updated} services, skipped ${skipped}.`);
}

async function main() {
  await updateLocaleFromExcel('ka', 'GEO.xlsx');
  await updateLocaleFromExcel('ru', 'RUS.xlsx');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


