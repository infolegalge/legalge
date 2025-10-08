import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { fetchCompany } from "@/lib/specialists";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import CompanyLandingPageSimple from "@/components/CompanyLandingPageSimple";
import { createLocaleRouteMetadata } from "@/lib/metadata";

interface CompanyPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const company = await fetchCompany(slug);
  
  if (!company) {
    return createLocaleRouteMetadata(locale, ["companies", slug], {
      title: "Company Not Found",
    });
  }

  const title = `${company.name} – Legal Partner`;
  const description = (company.shortDesc || company.description || `Meet ${company.name}, a trusted legal partner in Georgia.`).slice(0, 160);

  return createLocaleRouteMetadata(locale, ["companies", company.slug], {
    title,
    description,
    openGraph: {
      title,
      description,
      images: company.logoUrl ? [{ url: company.logoUrl, alt: company.logoAlt || company.name }] : [],
    },
  });
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  
  const company = await fetchCompany(slug);
  
  if (!company) {
    notFound();
  }

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": company.name,
            "description": company.shortDesc || company.description,
            "url": company.website,
            "logo": company.logoUrl ? {
              "@type": "ImageObject",
              "url": company.logoUrl,
              "description": company.logoAlt || company.name
            } : undefined,
            "telephone": company.phone,
            "email": company.email,
            "address": company.address ? {
              "@type": "PostalAddress",
              "streetAddress": company.address
            } : undefined,
            "employee": company.specialists.map(specialist => ({
              "@type": "Person",
              "name": specialist.name,
              "jobTitle": specialist.role,
              "url": `https://legal.ge/${locale}/specialists/${specialist.slug}`
            }))
          })
        }}
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-foreground">
            {t("common.home")}
          </Link>
          <span>/</span>
          <Link href={`/${locale}/specialists`} className="hover:text-foreground">
            {t("nav.specialists")}
          </Link>
          <span>/</span>
          <span className="text-foreground">{company.name}</span>
        </nav>

        {/* Back button */}
        <Link
          href={`/${locale}/specialists`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back_to_specialists")}
        </Link>

        {/* Company Landing Page */}
        <CompanyLandingPageSimple company={company} locale={locale} t={t} />
      </div>
    </>
  );
}