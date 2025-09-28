import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/i18n/locales";
import prisma from "@/lib/prisma";

async function getRandomServices(locale: Locale, take = 4) {
  try {
    const all = await prisma.service.findMany({
      include: { translations: true, practiceArea: { include: { translations: true } } },
    });
    const localized = all.map((s) => {
      const t = s.translations.find((x) => x.locale === locale) || s.translations.find((x) => x.locale === ("ka" as Locale));
      const pt = s.practiceArea.translations.find((x) => x.locale === locale) || s.practiceArea.translations.find((x) => x.locale === ("ka" as Locale));
      return {
        id: s.id,
        title: t?.title || s.title,
        slug: t?.slug || s.slug,
        practice: { title: pt?.title || s.practiceArea.title, slug: pt?.slug || s.practiceArea.slug },
        heroImageUrl: s.heroImageUrl || s.practiceArea.heroImageUrl || null,
      };
    });
    const shuffled = localized.sort(() => Math.random() - 0.5).slice(0, take);
    return shuffled;
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}

export default async function ServicesShowcase({ locale }: { locale: Locale }) {
  const items = await getRandomServices(locale, 4);
  return (
    <section className="snap-start">
      <div className="mx-auto w-full px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s) => (
            <Link key={s.id} href={`/${locale}/services/${s.slug}`} className="group relative block h-64 w-full overflow-hidden border">
              <div className="absolute inset-0">
                <div className="relative h-full w-full">
                  {s.heroImageUrl ? (
                    <Image src={s.heroImageUrl} alt="" fill className="object-cover" />
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


