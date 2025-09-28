import { PrismaClient, type Locale } from '@prisma/client';
import { makeSlug } from '@/lib/utils';

const prisma = new PrismaClient();

async function ensureUniqueBaseSlugForPracticeArea(candidate: string, id: string): Promise<string> {
  let slug = candidate || 'practice';
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.practiceArea.findFirst({ where: { slug, NOT: { id } }, select: { id: true } });
    if (!exists) return slug;
    suffix += 1;
    slug = `${candidate}-${suffix}`;
  }
}

async function ensureUniqueBaseSlugForService(candidate: string, id: string): Promise<string> {
  let slug = candidate || 'service';
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.service.findFirst({ where: { slug, NOT: { id } }, select: { id: true } });
    if (!exists) return slug;
    suffix += 1;
    slug = `${candidate}-${suffix}`;
  }
}

async function ensureUniqueTranslationSlugForPractice(locale: Locale, candidate: string, id: string): Promise<string> {
  let slug = candidate || 'practice';
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.practiceAreaTranslation.findFirst({ where: { locale, slug, NOT: { id } }, select: { id: true } });
    if (!exists) return slug;
    suffix += 1;
    slug = `${candidate}-${suffix}`;
  }
}

async function ensureUniqueTranslationSlugForService(locale: Locale, candidate: string, id: string): Promise<string> {
  let slug = candidate || 'service';
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.serviceTranslation.findFirst({ where: { locale, slug, NOT: { id } }, select: { id: true } });
    if (!exists) return slug;
    suffix += 1;
    slug = `${candidate}-${suffix}`;
  }
}

async function refreshPracticeAreaSlugs() {
  const areas = await prisma.practiceArea.findMany({ include: { translations: true } });
  let updatedBase = 0;
  let updatedTrans = 0;
  for (const pa of areas) {
    // Base slug from default title
    const baseSlug = makeSlug(pa.title);
    if (baseSlug && baseSlug !== pa.slug) {
      const unique = await ensureUniqueBaseSlugForPracticeArea(baseSlug, pa.id);
      await prisma.practiceArea.update({ where: { id: pa.id }, data: { slug: unique } });
      updatedBase++;
    }
    // Translation slugs by locale
    for (const t of pa.translations) {
      if (!t.title) continue;
      const tSlug = makeSlug(t.title, t.locale as Locale);
      if (!tSlug) continue;
      if (tSlug !== t.slug) {
        const unique = await ensureUniqueTranslationSlugForPractice(t.locale as Locale, tSlug, t.id);
        await prisma.practiceAreaTranslation.update({ where: { id: t.id }, data: { slug: unique } });
        updatedTrans++;
      }
    }
  }
  console.log(`PracticeAreas: updated base=${updatedBase}, translations=${updatedTrans}`);
}

async function refreshServiceSlugs() {
  const services = await prisma.service.findMany({ include: { translations: true } });
  let updatedBase = 0;
  let updatedTrans = 0;
  for (const s of services) {
    const baseSlug = makeSlug(s.title);
    if (baseSlug && baseSlug !== s.slug) {
      const unique = await ensureUniqueBaseSlugForService(baseSlug, s.id);
      await prisma.service.update({ where: { id: s.id }, data: { slug: unique } });
      updatedBase++;
    }
    for (const t of s.translations) {
      if (!t.title) continue;
      const tSlug = makeSlug(t.title, t.locale as Locale);
      if (!tSlug) continue;
      if (tSlug !== t.slug) {
        const unique = await ensureUniqueTranslationSlugForService(t.locale as Locale, tSlug, t.id);
        await prisma.serviceTranslation.update({ where: { id: t.id }, data: { slug: unique } });
        updatedTrans++;
      }
    }
  }
  console.log(`Services: updated base=${updatedBase}, translations=${updatedTrans}`);
}

async function main() {
  await refreshPracticeAreaSlugs();
  await refreshServiceSlugs();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






