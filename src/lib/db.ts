import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";

const localeMap: Record<string, Locale> = {
  ka: "ka",
  en: "en",
  ru: "ru",
};

function normalizeLocale(input: Locale): Locale {
  const base = String(input).split("-")[0]?.toLowerCase() || "";
  return localeMap[base] ?? ("ka" as Locale);
}

export type PracticeAreaForLocale = {
  id: string;
  slug: string;
  title: string;
  servicesCount: number;
  searchTitles?: string[];
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  baseSlug: string;
};

export async function listPracticeAreasForLocale(locale: Locale): Promise<PracticeAreaForLocale[]> {
  const items = await prisma.practiceArea.findMany({
    include: { translations: true, services: true },
  });
  // Canonical English order by base slug
  const orderedSlugs = [
    "migration-to-georgia",
    "labor-law",
    "legallaunch-for-startups",
    "crypto-law",
    "corporate-governance-and-business-compliance",
    "licenses",
    "permits",
    "tax-and-accounting",
    "banks-and-finances",
    "ip-trademark-inventions",
    "personal-data-protection",
    "property-law",
    "honor-reputation-protection",
    "international-law",
    "litigation-and-dispute-resolution",
    "family-law",
    "criminal-defense-and-white-collar-crime",
    "environmental-and-energy-law",
    "healthcare-and-pharmaceutical-law",
    "sports-media-entertainment-law",
    "aviation-and-maritime-law",
    "technology-and-ai-law",
    "education-law",
    "non-profit-and-ngo-law",
    "military-and-national-security-law",
  ];
  const orderIndex = new Map<string, number>(orderedSlugs.map((s, i) => [s, i]));
  items.sort((a, b) => {
    const ai = orderIndex.has(a.slug) ? (orderIndex.get(a.slug) as number) : Number.MAX_SAFE_INTEGER;
    const bi = orderIndex.has(b.slug) ? (orderIndex.get(b.slug) as number) : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    // stable fallback: English title
    return a.title.localeCompare(b.title);
  });
  return items.map((p) => {
    const t = p.translations.find((x) => x.locale === locale);
    const allTitles = Array.from(
      new Set([
        p.title,
        ...p.translations.map((tr) => tr.title).filter(Boolean),
      ]),
    );
    return {
      id: p.id,
      slug: t?.slug || p.slug,
      title: t?.title || p.title,
      servicesCount: p.services.length,
      searchTitles: allTitles,
      heroImageUrl: p.pageHeroImageUrl || p.heroImageUrl || null,
      heroImageAlt: t?.heroImageAlt || null,
      baseSlug: p.slug,
    };
  });
}

export type ServiceForLocale = {
  id: string;
  slug: string;
  title: string;
  parentId: string;
  searchTitles?: string[];
};

export async function listServicesForLocale(locale: Locale): Promise<ServiceForLocale[]> {
  const items = await prisma.service.findMany({
    include: { translations: true },
    orderBy: { title: "asc" },
  });
  return items.map((s) => {
    const t = s.translations.find((x) => x.locale === locale);
    const allTitles = Array.from(
      new Set([
        s.title,
        ...s.translations.map((tr) => tr.title).filter(Boolean),
      ]),
    );
    return {
      id: s.id,
      slug: t?.slug || s.slug,
      title: t?.title || s.title,
      parentId: s.practiceAreaId,
      searchTitles: allTitles,
    };
  });
}

export async function findPracticeBySlugForLocale(locale: Locale, slug: string) {
  // Decode percent-encoded input to support Unicode slugs copied from the address bar
  try {
    slug = decodeURIComponent(slug);
  } catch {}
  const p = await prisma.practiceArea.findFirst({
    where: {
      OR: [
        { slug },
        { translations: { some: { slug } } },
        { translations: { some: { locale, slug } } },
      ],
    },
    include: { translations: true },
  });
  if (!p) return null;
  const t = p.translations.find((x) => x.locale === locale);
  const ka = p.translations.find((x) => x.locale === ("ka" as Locale));
  const fallbackDesc = t?.description ?? ka?.description ?? p.description ?? null;
  return {
    id: p.id,
    slug: t?.slug || ka?.slug || p.slug,
    title: t?.title || ka?.title || p.title,
    description: fallbackDesc,
    metaTitle: t?.metaTitle || ka?.metaTitle || (t?.title || ka?.title || p.title),
    metaDescription:
      t?.metaDescription ||
      ka?.metaDescription ||
      (fallbackDesc ? fallbackDesc.replace(/<[^>]+>/g, "").slice(0, 155) : null),
    heroImageUrl: p.pageHeroImageUrl || p.heroImageUrl || null,
    heroImageAlt: t?.pageHeroImageAlt || t?.heroImageAlt || ka?.pageHeroImageAlt || ka?.heroImageAlt || null,
    heroVersion: Number(new Date(p.updatedAt).getTime()),
  };
}

export async function listServicesForPracticeForLocale(practiceAreaId: string, locale: Locale) {
  const items = await prisma.service.findMany({
    where: { practiceAreaId },
    include: { translations: true },
    orderBy: { title: "asc" },
  });
  return items.map((s) => {
    const t = s.translations.find((x) => x.locale === locale);
    const allTitles = Array.from(
      new Set([
        s.title,
        ...s.translations.map((tr) => tr.title).filter(Boolean),
      ]),
    );
    return {
      id: s.id,
      slug: t?.slug || s.slug,
      title: t?.title || s.title,
      searchTitles: allTitles,
    };
  });
}

export async function findServiceBySlugForLocale(locale: Locale, slug: string) {
  const queryLocale = normalizeLocale(locale);
  try {
    slug = decodeURIComponent(slug);
  } catch {}
  const s = await prisma.service.findFirst({
    where: {
      OR: [
        { slug },
        { translations: { some: { locale: queryLocale, slug } } },
        ...(queryLocale !== ("ka" as Locale)
          ? [{ translations: { some: { locale: ("ka" as Locale), slug } } }]
          : []),
      ],
    },
    include: {
      translations: true,
      practiceArea: { include: { translations: true } },
      specialists: true,
    },
  });
  if (!s) return null;
  const t = s.translations.find((x) => x.locale === queryLocale);
  const pt = s.practiceArea.translations.find((x) => x.locale === queryLocale);
  const ka = s.translations.find((x) => x.locale === ("ka" as Locale));
  const fallbackDesc = t?.description ?? ka?.description ?? s.description ?? null;
  return {
    id: s.id,
    slug: t?.slug || ka?.slug || s.slug,
    title: t?.title || ka?.title || s.title,
    description: fallbackDesc,
    metaTitle: t?.metaTitle || ka?.metaTitle || (t?.title || ka?.title || s.title),
    metaDescription:
      t?.metaDescription || ka?.metaDescription || (fallbackDesc ? fallbackDesc.replace(/<[^>]+>/g, "").slice(0, 155) : null),
    heroImageUrl: s.heroImageUrl || null,
    heroImageAlt: t?.heroImageAlt || s.heroImageAlt || ka?.heroImageAlt || null,
    specialists: s.specialists || [],
    practice: {
      id: s.practiceAreaId,
      slug: pt?.slug || s.practiceArea.translations.find((x) => x.locale === ("ka" as Locale))?.slug || s.practiceArea.slug,
      title: pt?.title || s.practiceArea.translations.find((x) => x.locale === ("ka" as Locale))?.title || s.practiceArea.title,
    },
  };
}


