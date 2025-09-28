import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { Locale, defaultLocale, isLocale } from "./locales";

export default getRequestConfig(async ({ locale }) => {
  const requested = typeof locale === "string" ? locale : defaultLocale;
  const current: Locale = isLocale(requested) ? (requested as Locale) : defaultLocale;
  try {
    const messages = (await import(`./messages/${current}.json`)).default;
    return { locale: current, messages };
  } catch {
    notFound();
  }
});


