import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import "../globals.css";
import { isLocale, Locale, defaultLocale } from "@/i18n/locales";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthSessionProvider from "@/components/AuthSessionProvider";


export const metadata: Metadata = {
  title: "Legal Sandbox Georgia",
  description: "Innovating legal services in Georgia",
};

export function generateStaticParams() {
  return [{ locale: "ka" }, { locale: "en" }, { locale: "ru" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  let messages: AbstractIntlMessages;
  switch (locale) {
    case "ka":
      messages = (await import("@/i18n/messages/ka.json")).default as AbstractIntlMessages;
      break;
    case "en":
      messages = (await import("@/i18n/messages/en.json")).default as AbstractIntlMessages;
      break;
    case "ru":
      messages = (await import("@/i18n/messages/ru.json")).default as AbstractIntlMessages;
      break;
    default:
      messages = {} as AbstractIntlMessages;
  }

  return (
    <NextIntlClientProvider locale={(locale as Locale) ?? defaultLocale} messages={messages}>
      <AuthSessionProvider>
        <Header />
        <main className="min-h-[calc(100vh-7rem)]">{children}</main>
        <Footer />
      </AuthSessionProvider>
    </NextIntlClientProvider>
  );
}


