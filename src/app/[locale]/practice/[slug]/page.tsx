import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { listServicesForPracticeForLocale, findPracticeBySlugForLocale } from "@/lib/db";
import prisma from "@/lib/prisma";
import Image from "next/image";
import RichText from "@/components/RichText";
import ServicesSidebar from "@/components/ServicesSidebar";

export const revalidate = 3600;

export async function generateStaticParams() {
  return [] as Array<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: Locale }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  try {
    const item = await findPracticeBySlugForLocale(locale, slug);
    if (!item) return { title: "Practice area" };
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://legal.ge";
    const canonical = `${base}/${locale}/practice/${item.slug}`;
    let languages: Record<string, string> | undefined;
    try {
      const p = await prisma.practiceArea.findFirst({
        where: { OR: [{ slug }, { translations: { some: { slug } } }, { translations: { some: { locale, slug } } }] },
        include: { translations: true },
      });
      if (p) {
        const locales: Array<Locale> = ["ka", "en", "ru"] as unknown as Array<Locale>;
        languages = Object.fromEntries(
          locales.map((loc) => {
            const t = p.translations.find((x) => x.locale === loc);
            const s = t?.slug || p.slug;
            return [loc, `${base}/${loc}/practice/${s}`];
          }),
        );
      }
    } catch {}
    return {
      title: item.metaTitle?.slice(0, 60) || item.title?.slice(0, 60),
      description: item.metaDescription || (item.description ? item.description.replace(/<[^>]+>/g, "").slice(0, 155) : undefined),
      alternates: { canonical, languages },
      openGraph: { title: item.title, url: canonical },
      twitter: { title: item.title },
    };
  } catch {
    return { title: "Practice area" };
  }
}

export default async function PracticeDetail({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const item = await findPracticeBySlugForLocale(locale, slug);
  if (!item) notFound();
  const children = await listServicesForPracticeForLocale(item.id, locale);

  // const imageForService = (practiceSlug: string, serviceSlug: string): string | undefined => {
  //   if (practiceSlug !== "migration-to-georgia") return undefined;
  //   // Match by service slug against provided filenames (case-insensitive, hyphen/space tolerant)
  //   const candidates = [
  //     "VISA-and-residency-applications.webp",
  //     "work-permits.webp",
  //     "CITIZENSHIP-acqusition.webp",
  //     "family-reunification.webp",
  //     "immigration-compliance.webp",
  //     "Business-Investment-migration.webp",
  //     "asylum-and-refugee.webp",
  //     "translation-interpretation.webp",
  //     "Migration-General.webp",
  //   ];
  //   const normalized = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  //   const match = candidates.find((f) => normalized(f).includes(normalized(serviceSlug)));
  //   return match ? `/practice/migration-to-georgia/${match}` : undefined;
  // };
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold">{item.title}</h1>
      <div className="mt-8 grid gap-12 lg:grid-cols-3">
        <aside className="lg:col-span-1 lg:border-r lg:pr-6">
          <ServicesSidebar 
            locale={locale} 
            services={children} 
            title="Services"
          />
        </aside>
        <section className="lg:col-span-2 lg:pl-6">
          
          <div className="mt-3">
            {item.heroImageUrl ? (
              <figure className="relative mx-auto w-[90%] overflow-hidden rounded-lg border" style={{ aspectRatio: "4/3" }}>
                <Image src={`${item.heroImageUrl}`} alt={item.heroImageAlt || item.title} fill className="object-cover" />
                {item.heroImageAlt ? (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1 text-xs text-white">
                    {item.heroImageAlt}
                  </figcaption>
                ) : null}
              </figure>
            ) : null}
            <article className="mt-6">
              {item.description ? (
                <RichText html={item.description} />
              ) : (
                <p className="text-foreground/60">Content coming soon.</p>
              )}
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}


