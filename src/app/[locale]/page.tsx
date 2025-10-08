import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import Hero from "@/components/Hero";
import ServicesShowcase from "@/components/ServicesShowcase";
import AuthRedirect from "@/components/AuthRedirect";
import type { Metadata } from "next";
import { createLocaleRouteMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;

  return createLocaleRouteMetadata(locale, undefined, {
    title: "Home",
  });
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await getTranslations();
  return (
    <>
      <AuthRedirect />
      <div className="snap-y snap-mandatory h-screen overflow-y-auto">
        <Hero locale={locale} />
        <ServicesShowcase locale={locale} />
      </div>
    </>
  );
}


