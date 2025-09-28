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
