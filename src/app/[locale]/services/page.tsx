import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { stripHtml } from "@/lib/utils";
import { createLocaleRouteMetadata } from "@/lib/metadata";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;

  return createLocaleRouteMetadata(locale, "services", {
    title: "Services",
    description: "All legal services",
  });
}

export default async function ServicesIndex({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const all = await prisma.service.findMany({
    include: {
      translations: true,
    },
    orderBy: { title: "asc" },
  });
  const services = all.map((s) => {
    const t = s.translations.find((x) => x.locale === locale);
    return {
      slug: t?.slug || s.slug,
      title: t?.title || s.title,
      heroImageUrl: s.heroImageUrl || null,
      heroImageAlt: t?.heroImageAlt || s.heroImageAlt || t?.title || s.title,
      description: t?.metaDescription || t?.description || s.description || null,
    };
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold">Services</h1>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Link
            key={s.slug}
            href={`/${locale}/services/${s.slug}`}
            className="group block overflow-hidden rounded-lg border"
          >
            <div className="relative">
              {s.heroImageUrl ? (
                <div className="relative aspect-square w-full">
                  <Image
                    src={s.heroImageUrl}
                    alt={s.heroImageAlt || s.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
              ) : (
                <div className="relative aspect-square w-full bg-muted" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-white/35 transition-opacity duration-300 group-hover:opacity-0 dark:bg-black/25" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="font-medium text-white drop-shadow-sm">{s.title}</div>
                {s.description && (
                  <p className="mt-1 text-xs text-white/90 line-clamp-2 drop-shadow-sm">
                    {stripHtml(s.description)}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


