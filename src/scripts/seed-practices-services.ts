/*
  Seed Practice Areas and Services with translations (KA base, EN/RU translations)
  Source: data/compiled.services.i18n.json
*/
import fs from 'node:fs';
import path from 'node:path';
import prisma from '@/lib/prisma';
import { makeSlug } from '@/lib/utils';

type Locale = 'ka' | 'en' | 'ru';

interface ServiceI18n {
  slug: string;
  en: string;
  ka: string;
  ru: string;
}

interface PracticeI18n {
  slug: string;
  en: string;
  ka: string;
  ru: string;
  services: ServiceI18n[];
}

interface I18nData {
  practices: PracticeI18n[];
}

async function ensureUniqueTranslationSlug(
  base: string,
  title: string,
  locale: Locale,
  table: 'practiceArea' | 'service',
): Promise<string> {
  let candidate = (title && title.trim()) ? makeSlug(title, locale) : base;
  if (!candidate || !candidate.trim()) candidate = base;
  let counter = 1;
  while (true) {
    const exists = table === 'practiceArea'
      ? await (prisma as any).practiceAreaTranslation.findFirst({ where: { locale, slug: candidate }, select: { id: true } })
      : await (prisma as any).serviceTranslation.findFirst({ where: { locale, slug: candidate }, select: { id: true } });
    if (!exists) break;
    candidate = `${candidate}-${counter++}`;
  }
  return candidate;
}

async function main() {
  const jsonPath = path.resolve(process.cwd(), 'data/compiled.services.i18n.json');
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw) as I18nData;

  console.log(`Seeding ${data.practices.length} practice areas ...`);

  for (const p of data.practices) {
    // Base (KA) as canonical in base model
    const baseSlug = p.slug;
    const baseTitle = p.ka || p.en || p.ru || p.slug;

    const practice = await prisma.practiceArea.upsert({
      where: { slug: baseSlug },
      update: { title: baseTitle },
      create: { slug: baseSlug, title: baseTitle },
      select: { id: true },
    });

    // Translations EN/RU
    for (const loc of ['en', 'ru'] as const) {
      const title = (p as any)[loc] as string | undefined;
      const tSlug = await ensureUniqueTranslationSlug(baseSlug, title || baseTitle, loc, 'practiceArea');
      const existing = await (prisma as any).practiceAreaTranslation.findUnique({
        where: { practiceAreaId_locale: { practiceAreaId: practice.id, locale: loc } },
        select: { id: true },
      });
      const payload = { practiceAreaId: practice.id, locale: loc, title: title || baseTitle, slug: tSlug } as any;
      if (existing) {
        await (prisma as any).practiceAreaTranslation.update({ where: { id: existing.id }, data: payload });
      } else {
        await (prisma as any).practiceAreaTranslation.create({ data: payload });
      }
    }

    // Services
    for (const s of p.services) {
      const sBaseSlug = s.slug;
      const sBaseTitle = s.ka || s.en || s.ru || s.slug;
      const service = await prisma.service.upsert({
        where: { slug: sBaseSlug },
        update: { title: sBaseTitle, practiceAreaId: practice.id },
        create: { slug: sBaseSlug, title: sBaseTitle, practiceAreaId: practice.id },
        select: { id: true },
      });
      for (const loc of ['en', 'ru'] as const) {
        const title = (s as any)[loc] as string | undefined;
        const tSlug = await ensureUniqueTranslationSlug(sBaseSlug, title || sBaseTitle, loc, 'service');
        const existing = await (prisma as any).serviceTranslation.findUnique({
          where: { serviceId_locale: { serviceId: service.id, locale: loc } },
          select: { id: true },
        });
        const payload = { serviceId: service.id, locale: loc, title: title || sBaseTitle, slug: tSlug } as any;
        if (existing) {
          await (prisma as any).serviceTranslation.update({ where: { id: existing.id }, data: payload });
        } else {
          await (prisma as any).serviceTranslation.create({ data: payload });
        }
      }
    }
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


