import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { createLocaleRouteMetadata } from "@/lib/metadata";
import { buildOrganizationLd, buildBreadcrumbLd } from "@/lib/structuredData";
import Hero from "@/components/Hero";
import AuthRedirect from "@/components/AuthRedirect";
const ServicesShowcase = dynamic(() => import("@/components/ServicesShowcase"), {
  ssr: false,
  loading: () => null,
});

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;

  return createLocaleRouteMetadata(locale, undefined, {
    title: "Legal Services in Georgia",
    description: "Plan investments, residency, and compliance in Georgia with multilingual lawyers and vetted partners.",
  });
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await getTranslations();
  const breadcrumbs = buildBreadcrumbLd([
    { name: locale.toUpperCase(), url: `https://www.legal.ge/${locale}` },
  ]);
  const organizationLd = buildOrganizationLd();
  return (
    <>
      <AuthRedirect />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <div className="snap-y snap-mandatory h-screen overflow-y-auto">
        <Hero locale={locale} />
        <ServicesShowcase locale={locale} />
      </div>
    </>
  );
}


