import type { Metadata } from "next";
import type { Locale } from "@/i18n/locales";
import { createLocaleRouteMetadata } from "@/lib/metadata";
import SettingsClient from "./SettingsClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return createLocaleRouteMetadata(locale, ["subscriber", "settings"], {
    title: "Subscriber Settings",
    description: "Manage your subscriber preferences and notifications.",
  });
}

export default function SubscriberSettings() {
  return <SettingsClient />;
}
