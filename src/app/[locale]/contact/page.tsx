import type { Metadata } from "next";
import { createLocaleRouteMetadata } from "@/lib/metadata";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import ContactInfo from "@/components/ContactInfo";
import OpenStreetMap from "@/components/OpenStreetMap";
import ContactForm from "./ContactForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return createLocaleRouteMetadata(locale, "contact", {
    title: "Contact Our Legal Team",
    description: "Speak with Legal Sandbox Georgia for tailored legal guidance, consultations, and service inquiries.",
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  const formTranslations = {
    name: t("name"),
    email: t("email"),
    message: t("message"),
    submit: t("submit"),
    submitting: t("submitting"),
  };

  const officeLocation = {
    latitude: 41.80594854658469,
    longitude: 44.767832572133464,
    address: "Georgia, Tbilisi, Agmashnebeli alley N240, 0159",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-foreground/70">{t("description")}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-xl font-semibold">{t("form_heading", { defaultValue: t("description") })}</h2>
            <ContactForm locale={locale} t={formTranslations} />
          </div>
        </div>

        <div className="space-y-6">
          <ContactInfo />

          <div>
            <OpenStreetMap
              latitude={officeLocation.latitude}
              longitude={officeLocation.longitude}
              address={officeLocation.address}
              companyName="LLC Legal Sandbox Georgia"
              getDirectionsText={t("get_directions")}
              viewOnOsmText={t("view_on_osm")}
              className="h-80 w-full rounded-lg border"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
