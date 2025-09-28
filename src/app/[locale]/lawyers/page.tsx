import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { fetchLawyers } from "@/lib/wp";
import LawyerCard from "@/components/LawyerCard";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return {
    title: "Lawyers",
    description: "Meet our team",
  };
}

export default async function LawyersIndex({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  let lawyers: Awaited<ReturnType<typeof fetchLawyers>> = [];
  try {
    lawyers = await fetchLawyers();
  } catch {
    lawyers = [];
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold">{t("lawyers.title")}</h1>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lawyers.length === 0 ? (
          <p className="text-foreground/70">{t("lawyers.description")}</p>
        ) : (
          lawyers.map((l) => <LawyerCard key={l.id} lawyer={l} locale={locale} />)
        )}
      </div>
    </div>
  );
}


