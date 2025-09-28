import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { fetchSpecialists } from "@/lib/specialists";
import SpecialistsClient from "./SpecialistsClient";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return {
    title: "Specialists",
    description: "Meet our legal specialists and experts",
  };
}

export default async function SpecialistsIndex({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  let specialists: Awaited<ReturnType<typeof fetchSpecialists>> = [];
  try {
    specialists = await fetchSpecialists();
  } catch {
    specialists = [];
  }

  return <SpecialistsClient initialSpecialists={specialists} locale={locale} />;
}