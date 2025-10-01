"use client";

import { useEffect, useRef, useState } from "react";
import slugify from "slugify";
import type { Locale } from "@/i18n/locales";

function toSlug(text: string, locale?: Locale): string {
  const isUnicode = locale === ("ka" as Locale) || locale === ("ru" as Locale);
  if (isUnicode) {
    const base = (text || "").toString().trim();
    return base
      .toLocaleLowerCase(locale)
      .normalize("NFKC")
      .replace(/["'’`]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  }
  return slugify(text || "", { lower: true, strict: true, locale: "en" });
}

export default function AutoSlug({ titleName, slugName, localeField }: { titleName: string; slugName: string; localeField?: string }) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const form = formRef.current || (anchorRef.current?.closest("form") as HTMLFormElement | null);
    const realForm = form || (document.activeElement && (document.activeElement as HTMLElement).closest("form"));
    if (!realForm) return;
    formRef.current = realForm;
    const title = realForm.querySelector<HTMLInputElement>(`input[name='${titleName}']`);
    const slug = realForm.querySelector<HTMLInputElement>(`input[name='${slugName}']`);
    if (!title || !slug) return;

    const onTitle = () => {
      if (locked) return;
      const localeSelector = localeField ? `input[name='${localeField}']` : "input[name='locale']";
      const currentLocale = (realForm.querySelector(localeSelector) as HTMLInputElement | null)?.value as Locale | undefined;
      // Update whenever user hasn't explicitly edited the slug (i.e., not locked)
      if (slug.dataset.autofill !== "false") {
        slug.value = toSlug(title.value, currentLocale);
        slug.dataset.autofill = "true";
      }
    };
    const onSlug = () => {
      // User edited slug manually; stop auto updates
      slug.dataset.autofill = "false";
      setLocked(true);
    };
    title.addEventListener("input", onTitle);
    slug.addEventListener("input", onSlug);
    // Prime once
    onTitle();
    return () => {
      title.removeEventListener("input", onTitle);
      slug.removeEventListener("input", onSlug);
    };
  }, [titleName, slugName, locked, localeField]);

  return <div ref={anchorRef} />;
}


