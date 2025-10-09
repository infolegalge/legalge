import type { Metadata } from "next";
import { createLocaleRouteMetadata } from "@/lib/metadata";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { listPracticeAreasForLocale, listServicesForLocale } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import PracticeSearch from "@/components/PracticeSearch";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return createLocaleRouteMetadata(locale, "practice", {
    title: "Practice areas",
    description: "Explore legal practice areas",
  });
}

export default async function PracticeIndex({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const [areas, services] = await Promise.all([listPracticeAreasForLocale(locale), listServicesForLocale(locale)]);
  const imageFor = (title: string) => {
    const base = title
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const map: Record<string, string> = {
      migration: "1. Migration 1.webp",
      labor: "02. Labour.webp",
      startups: "3. Startups.webp",
      crypto: "4. Crypto.webp",
      business: "5. BUsiness.webp",
      licenses: "6. Licenses.webp",
      permits: "7. Permits.webp",
      tax: "8. Tax.webp",
      banks: "9. Banks.webp",
      ip: "10. IP.webp",
      "personal data": "11. Personal data.webp",
      property: "12. Property.webp",
      honor: "13. Honor and Business.webp",
      international: "14. International.webp",
      litigation: "15. Litigation.webp",
    };
    const key = Object.keys(map).find((k) => base.includes(k));
    return key ? `/practice/${map[key]}` : undefined;
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold">{t("practice.title")}</h1>
      <div className="mt-3">
        <PracticeSearch
          locale={locale}
          practices={areas}
          services={services}
          inputLabel={t("practice.search_label")}
          headingLabels={{
            practices: t("practice.search_practices"),
            services: t("practice.search_services"),
            noMatches: t("practice.search_no_matches"),
            practiceTag: t("practice.search_practice_tag"),
            serviceTag: t("practice.search_service_tag"),
            servicesCount: t("practice.search_services_count"),
            parentPractice: t("practice.parent_practice"),
          }}
        />
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {areas.length === 0 ? (
          <p className="text-foreground/70">{t("practice.description")}</p>
        ) : (
          areas.map((a) => {
            const img = imageFor(a.baseSlug || a.title);
            return (
              <Link
                key={a.id}
                href={`/${locale}/practice/${a.slug}`}
                className="group block overflow-hidden rounded-lg border"
              >
                <div className="relative">
                  {a.heroImageUrl ? (
                    <div className="relative w-full aspect-square">
                      <Image src={`${a.heroImageUrl}`} alt={a.heroImageAlt || a.title} fill className="object-cover" />
                    </div>
                  ) : img ? (
                    <div className="relative w-full aspect-square">
                      <Image src={img} alt={a.title} fill className="object-cover bg-muted" />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-muted" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-white/35 dark:bg-black/25 opacity-100 transition-opacity duration-300 group-hover:opacity-0" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="font-medium text-white drop-shadow-sm">{a.title}</div>
                    <div className="mt-1 text-xs text-white/90 drop-shadow-sm">
                      {t("practice.services_count", { count: a.servicesCount })}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}


