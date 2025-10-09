"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/locales";
import { useEffect, useState } from "react";
import useSWR from "swr";
import Image from "next/image";

type Slide = {
  light: string;
  dark: string;
  lightAvif?: string | null;
  darkAvif?: string | null;
  lightAlt?: string | null;
  darkAlt?: string | null;
};

export default function Hero({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const [index, setIndex] = useState(0);

  const fallbackSlides: Slide[] = [
    { light: "/slider/01lightmtkvari.webp", dark: "/slider/01darkmtkvari.webp" },
    { light: "/slider/02lighcity.webp", dark: "/slider/02darkcity.webp" },
  ];

  const { data } = useSWR("/api/slider", async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed slider fetch");
    return (await res.json()) as Slide[];
  }, { suspense: false, revalidateOnFocus: false });

  const slides = Array.isArray(data) && data.length > 0 ? data : fallbackSlides;

  useEffect(() => {
    // Reset index if data size shrinks
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (slides.length < 2) return; // no rotation needed
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <section className="relative h-screen snap-start overflow-hidden">
      <div className="absolute inset-0">
        {slides[index] ? (
          <>
            <Image
              key={`light-${slides[index].light}`}
              src={slides[index].light}
              alt={slides[index].lightAlt || t("site.title")}
              fill
              className="object-cover dark:hidden"
              priority={index === 0}
              loading={index === 0 ? "eager" : "lazy"}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
              placeholder="empty"
            />
            <Image
              key={`dark-${slides[index].dark || slides[index].light}`}
              src={slides[index].dark || slides[index].light}
              alt={slides[index].darkAlt || slides[index].lightAlt || t("site.title")}
              fill
              className="hidden object-cover dark:block"
              priority={index === 0}
              loading={index === 0 ? "eager" : "lazy"}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
              placeholder="empty"
            />
          </>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-background dark:from-black/30" aria-hidden />
      </div>

      <div className="relative mx-auto flex h-full max-w-6xl items-center px-4 sm:px-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold sm:text-4xl">{t("site.title")}</h1>
          <p className="mt-3 text-foreground/80">{t("site.tagline")}</p>
          <div className="mt-6 flex gap-3">
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow transition-colors hover:opacity-90"
            >
              {t("hero.cta_primary")}
            </Link>
            <Link
              href={`/${locale}/practice`}
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm backdrop-blur-sm hover:bg-muted/50"
            >
              {t("hero.cta_secondary")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}


