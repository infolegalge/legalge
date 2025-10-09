"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { locales, Locale } from "@/i18n/locales";
import { trackEvent } from "@/lib/analytics";

export default function LocaleSwitcher() {
  const t = useTranslations();
  const current = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(() => locales.indexOf(current));

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
      setActiveIndex(locales.indexOf(locale));
    } finally {
      setSwitching(false);
    }
  }

  const focusLocale = useCallback((index: number) => {
    const total = locales.length;
    const normalized = ((index % total) + total) % total;
    setActiveIndex(normalized);
    const target = buttonsRef.current[normalized];
    if (target) target.focus();
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          focusLocale(index + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          focusLocale(index - 1);
          break;
        case "Home":
          event.preventDefault();
          focusLocale(0);
          break;
        case "End":
          event.preventDefault();
          focusLocale(locales.length - 1);
          break;
        default:
          break;
      }
    },
    [focusLocale],
  );

  return (
    <div className="ml-2 flex items-center gap-2" role="group" aria-label={t("site.title") + " language"}>
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchTo(locale)}
          aria-current={current === locale ? "true" : undefined}
          tabIndex={activeIndex === locales.indexOf(locale) ? 0 : -1}
          ref={(el) => {
            buttonsRef.current[locales.indexOf(locale)] = el;
          }}
          onFocus={() => setActiveIndex(locales.indexOf(locale))}
          onKeyDown={(event) => handleKeyDown(event, locales.indexOf(locale))}
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


