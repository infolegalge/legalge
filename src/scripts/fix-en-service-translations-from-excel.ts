import { PrismaClient } from '@prisma/client';
import { join } from 'node:path';
import { promises as fs } from 'node:fs';
import * as XLSX from 'xlsx';
import { makeSlug } from '@/lib/utils';

const prisma = new PrismaClient();

type Row = { practice: string; service: string };

function normalize(value: string): string {
  return (value || '')
    .toString()
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

async function readEnRows(): Promise<Row[]> {
  const filePath = join(process.cwd(), 'data', 'Practice-areas', 'Legal_Service_Catalog_Full.xlsx');
  const buf = await fs.readFile(filePath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const raw: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (raw.length === 0) return [];
  // Try to pick the two most likely columns (practice, service)
  const keys = Object.keys(raw[0]);
  const practiceKey = keys[0];
  const serviceKey = keys[1] ?? keys[0];
  const rows: Row[] = [];
  for (const r of raw) {
    const practice = String(r[practiceKey] ?? '').trim();
    const service = String(r[serviceKey] ?? '').trim();
    if (!practice || !service) continue;
    rows.push({ practice, service });
  }
  return rows;
}

async function ensureUniqueTranslationSlug(candidate: string, id: string) {
  let slug = candidate || 'service';
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.serviceTranslation.findFirst({ where: { locale: 'en', slug, NOT: { id } }, select: { id: true } });
    if (!exists) return slug;
    suffix += 1;
    slug = `${candidate}-${suffix}`;
  }
}

async function main() {
  const rows = await readEnRows();
  const mapByPractice = new Map<string, string[]>();
  for (const { practice, service } of rows) {
    const key = normalize(practice);
    const arr = mapByPractice.get(key) || [];
    arr.push(service);
    mapByPractice.set(key, arr);
  }

  const services = await prisma.service.findMany({ include: { practiceArea: true, translations: true } });
  let updated = 0;
  let missing = 0;

  for (const s of services) {
    const practiceKey = normalize(s.practiceArea.title);
    const candidates = mapByPractice.get(practiceKey) || [];
    if (candidates.length === 0) {
      missing++;
      continue;
    }
    // Try to match by slug generated from DB English title
    const dbSlug = makeSlug(s.title, 'en' as any);
    let match = candidates.find((name) => makeSlug(name, 'en' as any) === dbSlug) || null;
    if (!match) {
      // Fallback: exact normalized title match
      match = candidates.find((name) => normalize(name) === normalize(s.title)) || null;
    }
    if (!match) {
      // No confident match; skip
      continue;
    }

    const t = s.translations.find((x) => x.locale === 'en');
    const desiredTitle = match;
    const desiredSlug = makeSlug(match, 'en' as any);
    if (t) {
      const finalSlug = await ensureUniqueTranslationSlug(desiredSlug, t.id);
      if (t.title !== desiredTitle || t.slug !== finalSlug) {
        await prisma.serviceTranslation.update({ where: { id: t.id }, data: { title: desiredTitle, slug: finalSlug } });
        updated++;
      }
    } else {
      const finalSlug = await ensureUniqueTranslationSlug(desiredSlug, '');
      await prisma.serviceTranslation.create({ data: { serviceId: s.id, locale: 'en', title: desiredTitle, slug: finalSlug } });
      updated++;
    }
  }

  console.log(`EN service translations updated: ${updated}. Services without sheet mapping: ${missing}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





