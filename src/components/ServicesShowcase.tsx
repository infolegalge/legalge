"use client";

import useSWR from "swr";
import type { Locale } from "@/i18n/locales";
import ServicesShowcaseGrid from "./ServicesShowcaseGrid";

type ShowcaseItem = {
  id: string;
  title: string;
  slug: string;
  practice: { title: string; slug: string };
  heroImageUrl: string | null;
  heroImageAlt: string | null;
};

async function fetchFeaturedServices(locale: Locale): Promise<ShowcaseItem[]> {
  const res = await fetch(`/api/services/featured?locale=${locale}&take=4`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load services showcase");
  }
  return (await res.json()) as ShowcaseItem[];
}

export default function ServicesShowcase({ locale }: { locale: Locale }) {
  const { data } = useSWR(["services-featured", locale], () => fetchFeaturedServices(locale), {
    revalidateOnFocus: false,
  });

  if (!data) {
    return <ServicesShowcaseGrid locale={locale} items={[]} />;
  }

  return <ServicesShowcaseGrid locale={locale} items={data} />;
}


