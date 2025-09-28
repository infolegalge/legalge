import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { fetchCompanies } from "@/lib/specialists";
import RequestForm from "./RequestForm";

export const revalidate = 0; // Disable caching for now

export function generateMetadata(): Metadata {
  return {
    title: "Request Specialist/Company Access",
    description: "Apply to become a legal specialist or company on our platform",
  };
}

export default async function RequestPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  let companies: Awaited<ReturnType<typeof fetchCompanies>> = [];
  try {
    companies = await fetchCompanies();
  } catch {
    companies = [];
  }

  return <RequestForm companies={companies} locale={locale} />;
}

