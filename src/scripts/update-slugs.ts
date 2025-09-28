import prisma from "@/lib/prisma";
import { makeSlug } from "@/lib/utils";

type Locale = "ka" | "en" | "ru";

async function ensureUniqueSlug(base: string, existing: Set<string>): Promise<string> {
  let slug = base;
  let i = 2;
  while (existing.has(slug)) {
    slug = `${base}-${i}`;
    i++;
  }
  existing.add(slug);
  return slug;
}

async function main() {
  // Update PracticeArea slugs per locale
  const practices = await prisma.practiceArea.findMany({ include: { translations: true } });
  const usedPracticeSlugsByLocale: Record<Locale, Set<string>> = { ka: new Set(), en: new Set(), ru: new Set() };
  for (const p of practices) {
    // Base slug from EN
    const enTitle = p.translations.find((t) => t.locale === ("en" as any))?.title || p.title;
    const enSlug = await ensureUniqueSlug(makeSlug(enTitle, "en" as any), usedPracticeSlugsByLocale.en);
    await prisma.practiceArea.update({ where: { id: p.id }, data: { slug: enSlug } });
    // Localized slugs
    for (const loc of ["ka", "en", "ru"] as Locale[]) {
      const title = p.translations.find((t) => t.locale === (loc as any))?.title || enTitle;
      const localSlug = await ensureUniqueSlug(makeSlug(title, loc as any), usedPracticeSlugsByLocale[loc]);
      await prisma.practiceAreaTranslation.upsert({
        where: { practiceAreaId_locale: { practiceAreaId: p.id, locale: loc as any } },
        update: { slug: localSlug },
        create: { practiceAreaId: p.id, locale: loc as any, title, slug: localSlug },
      });
    }
  }

  // Update Service slugs per locale
  const services = await prisma.service.findMany({ include: { translations: true, practiceArea: { include: { translations: true } } } });
  const usedServiceSlugsByLocale: Record<Locale, Set<string>> = { ka: new Set(), en: new Set(), ru: new Set() };
  for (const s of services) {
    const enTitle = s.translations.find((t) => t.locale === ("en" as any))?.title || s.title;
    const enSlugBase = makeSlug(enTitle, "en" as any);
    const enSlug = await ensureUniqueSlug(enSlugBase, usedServiceSlugsByLocale.en);
    await prisma.service.update({ where: { id: s.id }, data: { slug: enSlug } });
    for (const loc of ["ka", "en", "ru"] as Locale[]) {
      const title = s.translations.find((t) => t.locale === (loc as any))?.title || enTitle;
      const localSlug = await ensureUniqueSlug(makeSlug(title, loc as any), usedServiceSlugsByLocale[loc]);
      await prisma.serviceTranslation.upsert({
        where: { serviceId_locale: { serviceId: s.id, locale: loc as any } },
        update: { slug: localSlug },
        create: { serviceId: s.id, locale: loc as any, title, slug: localSlug },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log("Updated localized slugs for practices and services.");
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


