import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import slugify from "slugify"
import type { Locale } from "@/i18n/locales"

function makeUnicodeSlug(input: string, locale: Locale = "en" as Locale): string {
  const base = (input || "").toString().trim()
  if (!base) return ""
  const lowered = base.toLocaleLowerCase(locale)
  return lowered
    .normalize("NFKC")
    .replace(/["'’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

export function makeSlug(input: string, locale?: Locale): string {
  const useUnicode = locale === ("ka" as Locale) || locale === ("ru" as Locale)
  if (useUnicode) return makeUnicodeSlug(input, locale)
  const base = (input || "").toString().trim()
  if (!base) return ""
  return slugify(base, { lower: true, strict: true, locale: "en" })
}

export function toTransliteratedSlug(input: string, locale: Locale = "en") {
  const text = input || "";
  if (!text.trim()) return "";
  if (locale === ("ka" as Locale) || locale === ("ru" as Locale)) {
    return text
      .toLocaleLowerCase(locale)
      .normalize("NFKC")
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}-]+/gu, "")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function randomSlugFragment(length = 6) {
  return Math.random().toString(36).substring(2, 2 + length);
}

export function composeSlug(base: string, locale?: Locale) {
  const slug = toTransliteratedSlug(base, locale);
  return slug || randomSlugFragment();
}

export function ensureUniqueSlug(base: string, existing: Set<string>, locale?: Locale) {
  let candidate = composeSlug(base, locale);
  let counter = 1;
  while (existing.has(candidate)) {
    candidate = `${composeSlug(base, locale)}-${counter++}`;
  }
  existing.add(candidate);
  return candidate;
}

export function formatCurrency(value: number, currency: string = "GEL") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
