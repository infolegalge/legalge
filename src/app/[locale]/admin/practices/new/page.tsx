import type { Locale } from "@/i18n/locales";
import PracticeCreateClient from "./PracticeCreateClient";

export default async function PracticeCreatePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <PracticeCreateClient locale={locale} />;
}
