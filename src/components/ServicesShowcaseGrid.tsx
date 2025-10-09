"use client";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/i18n/locales";

type ShowcaseItem = {
  id: string;
  title: string;
  slug: string;
  practice: { title: string; slug: string };
  heroImageUrl: string | null;
  heroImageAlt: string | null;
};

export default function ServicesShowcaseGrid({ locale, items }: { locale: Locale; items: ShowcaseItem[] }) {
  if (!items.length) {
    return (
      <section className="snap-start">
        <div className="mx-auto w-full px-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="relative h-64 w-full overflow-hidden rounded-lg border bg-muted">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/60 to-muted" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="snap-start">
      <div className="mx-auto w-full px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s) => (
            <Link key={s.id} href={`/${locale}/services/${s.slug}`} className="group relative block h-64 w-full overflow-hidden border">
              <div className="absolute inset-0">
                <div className="relative h-full w-full">
                  {s.heroImageUrl ? (
                    <Image
                      src={s.heroImageUrl}
                      alt={s.heroImageAlt || s.title}
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      placeholder="empty"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                </div>
              </div>
              <div className="relative z-10 flex h-full flex-col justify-end p-4">
                <div className="text-xs text-white/80">{s.practice.title}</div>
                <div className="text-lg font-semibold text-white drop-shadow-sm">{s.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
