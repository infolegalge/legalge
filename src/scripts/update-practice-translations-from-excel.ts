import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import slugifyLib from 'slugify';

const prisma = new PrismaClient();

function slugifyTitle(title: string, locale: 'en' | 'ka' | 'ru'): string {
  return slugifyLib(title, {
    lower: true,
    strict: true,
    locale,
    trim: true,
  });
}

function pickPracticeColumn(rows: Record<string, any>[]) {
  const headers = Object.keys(rows[0] ?? {});
  if (headers.length === 0) return undefined;
  // Heuristic: choose the column with lowest unique ratio (practice often repeats across many rows)
  let bestKey = headers[0];
  let bestScore = Infinity;
  for (const key of headers) {
    const values = rows.map((r) => String(r[key] ?? '').trim()).filter(Boolean);
    const total = values.length || 1;
    const unique = new Set(values).size;
    const ratio = unique / total;
    if (ratio < bestScore) {
      bestScore = ratio;
      bestKey = key;
    }
  }
  return bestKey;
}

async function readPracticeTitles(excelPath: string): Promise<string[]> {
  const buf = await fs.readFile(excelPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (rawRows.length === 0) return [];
  const practiceKey = pickPracticeColumn(rawRows) ?? Object.keys(rawRows[0])[0];
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const r of rawRows) {
    const practice = String(r[practiceKey] ?? '').trim();
    if (!practice) continue;
    if (!seen.has(practice)) {
      seen.add(practice);
      ordered.push(practice);
    }
  }
  return ordered;
}

async function buildEnPracticeMapping(enExcelPath: string) {
  const enTitles = await readPracticeTitles(enExcelPath);
  const enSlugs = enTitles.map((t) => slugifyTitle(t, 'en'));
  const dbAreas = await prisma.practiceArea.findMany({
    where: { slug: { in: enSlugs } },
    select: { id: true, slug: true },
  });
  const slugToId = new Map<string, string>();
  for (const a of dbAreas) slugToId.set(a.slug, a.id);
  return { enTitles, enSlugs, slugToId };
}

async function updateLocaleFromExcel(locale: 'ka' | 'ru', excelFilename: string) {
  const dataDir = join(process.cwd(), 'data', 'Practice-areas');
  const enExcelPath = join(dataDir, 'Legal_Service_Catalog_Full.xlsx');
  const localeExcelPath = join(dataDir, excelFilename);

  const { enTitles, enSlugs, slugToId } = await buildEnPracticeMapping(enExcelPath);
  const localeTitles = await readPracticeTitles(localeExcelPath);

  let updated = 0;
  let skipped = 0;

  const count = Math.min(enTitles.length, localeTitles.length);
  for (let i = 0; i < count; i++) {
    const enSlug = enSlugs[i];
    const areaId = slugToId.get(enSlug);
    if (!areaId) { skipped++; continue; }
    const localeTitle = localeTitles[i];
    const localeSlug = slugifyTitle(localeTitle, locale);
    try {
      await prisma.practiceAreaTranslation.upsert({
        where: { practiceAreaId_locale: { practiceAreaId: areaId, locale } },
        create: { practiceAreaId: areaId, locale, title: localeTitle, slug: localeSlug },
        update: { title: localeTitle, slug: localeSlug },
      });
      updated++;
    } catch {
      skipped++;
    }
  }
  console.log(`Practice areas ${locale}: Updated ${updated}, skipped ${skipped}.`);
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






