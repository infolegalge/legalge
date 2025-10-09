import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { getLawyers, lawyersForService } from "@/lib/normalized";
import { findServiceBySlugForLocale, listServicesForPracticeForLocale } from "@/lib/db";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import RichText from "@/components/RichText";
import ServicesSidebar from "@/components/ServicesSidebar";
import ReadingExperience from "@/components/ReadingExperience";
import { createLocaleRouteMetadata, buildLocaleCanonicalPath } from "@/lib/metadata";
import { buildServiceLd, buildBreadcrumbLd } from "@/lib/structuredData";

export const revalidate = 3600;

export async function generateStaticParams() {
  return [] as Array<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: Locale }> }): Promise<Metadata> {
  const { slug, locale } = await params;

  try {
    const item = await findServiceBySlugForLocale(locale, slug);
    if (!item) {
      return createLocaleRouteMetadata(locale, ["services", slug], {
        title: "Service",
      });
    }

    const mt = (item as unknown as { metaTitle?: string; metaDescription?: string }).metaTitle;
    const md = (item as unknown as { metaTitle?: string; metaDescription?: string }).metaDescription;

    let languages: Record<string, string> | undefined;

    try {
      const svc = await prisma.service.findFirst({
        where: { OR: [{ slug }, { translations: { some: { slug } } }, { translations: { some: { locale, slug } } }] },
        include: { translations: true },
      });

      if (svc) {
        const locales: Array<Locale> = ["ka", "en", "ru"] as unknown as Array<Locale>;
        languages = Object.fromEntries(
          locales.map((loc) => {
            const t = svc.translations.find((x) => x.locale === loc);
            const s = t?.slug || svc.slug;
            return [loc, buildLocaleCanonicalPath(loc, ["services", s])];
          }),
        );
      }
    } catch {}

    return createLocaleRouteMetadata(locale, ["services", item.slug], {
      title: mt?.slice(0, 60) || item.title?.slice(0, 60),
      description:
        md || (item.description ? item.description.replace(/<[^>]+>/g, "").slice(0, 155) : `Learn about ${item.title} services in Georgia.`),
      alternates: languages ? { languages } : undefined,
      openGraph: { title: item.title },
      twitter: { title: item.title },
    });
  } catch {
    return createLocaleRouteMetadata(locale, ["services", slug], {
      title: "Service",
    });
  }
}

export default async function ServiceDetail({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [item, lawyers] = await Promise.all([findServiceBySlugForLocale(locale, slug), getLawyers()]);
  if (!item) notFound();
  // Canonicalize URL safely: compare decoded slug and redirect to encoded canonical slug
  const incomingSlug = (() => {
    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  })();
  if (incomingSlug !== item.slug) {
    redirect(`/${locale}/services/${encodeURIComponent(item.slug)}`);
  }
  
  // Get sibling services from the same practice area for the sidebar
  const siblings = await listServicesForPracticeForLocale(item.practice.id, locale);

  // Use uploaded hero image if available, otherwise fall back to predefined images
  const getHeroImage = (service: typeof item): string | undefined => {
    // First priority: uploaded hero image from database
    if (service.heroImageUrl) {
      return service.heroImageUrl;
    }
    
    // Fallback: predefined images for migration services
    if (service.practice.slug !== "migration-to-georgia") return undefined;
    const candidates = [
      "VISA-and-residency-applications.webp",
      "work-permits.webp",
      "CITIZENSHIP-acqusition.webp",
      "family-reunification.webp",
      "immigration-compliance.webp",
      "Business-Investment-migration.webp",
      "asylum-and-refugee.webp",
      "translation-interpretation.webp",
      "Migration-General.webp",
    ];
    const normalized = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const match = candidates.find((f) => normalized(f).includes(normalized(service.slug)));
    return match ? `/practice/migration-to-georgia/${match}` : undefined;
  };
  const heroImg = getHeroImage(item);
  const canonicalPath = buildLocaleCanonicalPath(locale, ["services", item.slug]);
  const serviceLd = buildServiceLd({
    name: item.title,
    description: item.description ? item.description.replace(/<[^>]+>/g, "").slice(0, 180) : undefined,
    url: `https://www.legal.ge${canonicalPath}`,
  });
  const breadcrumbLd = buildBreadcrumbLd([
    { name: "Home", url: "https://www.legal.ge" },
    { name: locale.toUpperCase(), url: `https://www.legal.ge/${locale}` },
    { name: "Services", url: `https://www.legal.ge/${locale}/services` },
    { name: item.title, url: `https://www.legal.ge${canonicalPath}` },
  ]);
  
  // Use specialists assigned to the service instead of the old lawyersForService function
  const heroAlt = item.heroImageAlt || `${item.title} hero image`;
  const pros = item.specialists || [];
  
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-4">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
        {/* Sidebar - Sticky on large screens */}
        <aside className="lg:col-span-1 lg:sticky lg:top-8 lg:h-fit">
          <ServicesSidebar 
            locale={locale} 
            services={siblings} 
            title="Related Services"
            currentServiceSlug={item.slug}
          />
        </aside>
        
        {/* Main Content - Full width with proper text distribution */}
        <main className="lg:col-span-3" role="main" aria-label="Main content">
          {/* Hero Section */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold leading-tight text-foreground mb-6">
              {item.title}
            </h1>
            
            {/* Hero Image with lazy loading */}
            {heroImg ? (
              <div className="mb-8 overflow-hidden rounded-lg border shadow-sm">
                <div className="relative w-full aspect-[16/9] bg-muted">
                  <Image
                    src={heroImg}
                    alt={heroAlt}
                    fill
                    className="object-cover"
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
                    placeholder="empty"
                  />
                </div>
              </div>
            ) : null}
          </header>

          {/* Reading Experience Features */}
          {item.description && item.description.trim().length > 0 && (
            <ReadingExperience content={item.description} locale={locale} />
          )}

          {/* Main Content with improved text distribution */}
          <article className="prose prose-lg max-w-none" role="article">
            {item.description && item.description.trim().length > 0 && (
              <div className="text-base leading-relaxed text-foreground">
                <RichText html={item.description} />
              </div>
            )}
          </article>

          {/* Specialists Section */}
          <section className="mt-12 pt-8 border-t border-border" aria-labelledby="specialists-heading">
            <h2 id="specialists-heading" className="text-2xl font-semibold text-foreground mb-6">
              Specialists for this service
            </h2>
            {pros.length === 0 ? (
              <p className="text-muted-foreground leading-relaxed">
                No specialists listed yet.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
                {pros.map((specialist) => (
                  <Link 
                    key={specialist.id}
                    href={`/${locale}/specialists/${specialist.slug}`} 
                    className="group block"
                    aria-label={`View specialist profile for ${specialist.name}`}
                  >
                    <div className="aspect-square rounded-lg border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/20 hover:scale-105">
                      {/* Specialist Image */}
                      <div className="relative h-3/4 bg-muted">
                        {specialist.avatarUrl ? (
                          <Image
                            src={specialist.avatarUrl}
                            alt={specialist.name}
                            fill
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                            <div className="text-center">
                              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                                <span className="text-2xl font-bold text-primary">
                                  {specialist.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Specialist Info */}
                      <div className="flex h-1/4 flex-col justify-center p-4">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {specialist.name}
                        </h3>
                        {specialist.role && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {specialist.role}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}


