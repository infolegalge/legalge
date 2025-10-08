"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { locales, Locale } from "@/i18n/locales";
import { trackEvent } from "@/lib/analytics";

export default function LocaleSwitcher() {
  const t = useTranslations();
  const current = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  async function switchTo(locale: Locale) {
    try {
      setSwitching(true);
      const segments = pathname.split("/").filter(Boolean);
      const isServiceDetail = segments.length >= 3 && segments[1] === "services";
      const isNewsDetail = segments.length >= 3 && segments[1] === "news";
      if (isServiceDetail) {
        const currentSlug = decodeURIComponent(segments[2] || "");
        const res = await fetch(`/api/slugs/services?slug=${encodeURIComponent(currentSlug)}&from=${encodeURIComponent(current)}&to=${encodeURIComponent(locale)}`, { cache: "no-store" });
        const data = await res.json();
        const targetSlug = data?.slug || currentSlug;
        segments[0] = locale;
        segments[2] = encodeURIComponent(targetSlug);
        const nextPath = "/" + segments.join("/");
        router.push(nextPath);
      } else if (isNewsDetail) {
        const currentSlug = decodeURIComponent(segments[2] || "");
        const res = await fetch(`/api/slugs/news?slug=${encodeURIComponent(currentSlug)}&from=${encodeURIComponent(current)}&to=${encodeURIComponent(locale)}`, { cache: "no-store" });
        const data = await res.json();
        const targetSlug = data?.slug || currentSlug;
        segments[0] = locale;
        segments[2] = encodeURIComponent(targetSlug);
        const nextPath = "/" + segments.join("/");
        router.push(nextPath);
      } else {
        segments[0] = locale;
        const nextPath = "/" + segments.join("/");
        router.push(nextPath);
      }
      trackEvent("language_switch", { from_locale: current, to_locale: locale });
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="ml-2 flex items-center gap-2" aria-label={t("site.title")}>
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchTo(locale)}
          aria-current={current === locale ? "true" : undefined}
          className={
            current === locale
              ? "rounded border px-2 py-1 text-xs"
              : "rounded px-2 py-1 text-xs text-foreground/70 hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          }
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}


