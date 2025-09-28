### URL Canonicalization and Locale-aware Slugs

This document describes how canonical URLs and translated slugs are resolved across the app, and what guarantees the system provides. It covers both Services and News detail pages.

---

## Goals

- Ensure one canonical URL per resource per locale
- Avoid redirect loops and broken links when users paste percent-encoded slugs
- Preserve SEO-friendly, language-correct slugs (KA/EN/RU)
- Provide consistent behavior for manual locale switches and deep links

---

## Core Principles

- Slugs are stored in DB as raw strings per entity:
  - Base record has a base slug (typically KA in our content model)
  - Translations may have localized slugs per `locale`
- Routing accepts percent-encoded slugs; server decodes for comparisons
- Client navigation always encodes slugs for the URL path segment
- If the incoming slug is not the canonical slug for the active locale, the page redirects to the canonical one

---

## Client Locale Switching

Component: `src/components/LocaleSwitcher.tsx`

- Detects when the current path is a detail page:
  - `/${locale}/services/${slug}`
  - `/${locale}/news/${slug}`
- Calls a slug-translation API to obtain target-locale slug, then navigates:
  - `GET /api/slugs/services?slug=<current>&from=<currLocale>&to=<targetLocale>`
  - `GET /api/slugs/news?slug=<current>&from=<currLocale>&to=<targetLocale>`
- Falls back to the current slug if no translation exists

---

## Slug Translation API Contracts

- `GET /api/slugs/services` → `{ slug: string }`
  - Finds the Service by the `from` locale slug or base slug
  - Returns the `to` locale slug if available, else KA/base slug

- `GET /api/slugs/news` → `{ slug: string }`
  - Finds the Post by the base slug or by translation slug in `from`
  - Returns the `to` locale slug if available
  - If a translation exists but its slug is empty, auto-generates a unique slug from the translation title, persists it, then returns it
  - Falls back to the base post slug if no translation is found

Notes
- Both endpoints decode incoming slugs and return canonical slug strings suitable for `encodeURIComponent` before push

---

## Page-level Canonicalization (SSR)

These redirects guarantee canonical URLs even when users navigate via old links or manually alter URLs.

- Services: `src/app/[locale]/services/[slug]/page.tsx`
  - Decodes the incoming slug
  - Resolves the Service for the active locale
  - If the canonical slug differs, issues a redirect to `/${locale}/services/${encodeURIComponent(canonicalSlug)}`

- News: `src/app/[locale]/news/[slug]/page.tsx`
  - Decodes the incoming slug
  - Resolves the Post via base or translation!
  - If a translation exists for the active locale, canonicalizes to that translated slug; otherwise the base slug
  - If the incoming slug differs from canonical, performs a redirect

---

## Metadata Canonical URLs

Page: `src/app/[locale]/news/[slug]/page.tsx` → `generateMetadata`

- Prefers the locale-specific translated slug for canonical URL when available
- Otherwise uses the base slug

Result: search engines see the correct canonical per-locale path.

---

## Slug Generation Rules (Summary)

Used in multiple places including auto-generation for News translations.

- Normalize: NFKC
- Lowercase
- Strip quotes `"'’``
- Replace non-letter/digit (Unicode) with `-`
- Trim leading/trailing `-`
- Collapse multiple `-` into one
- Ensure uniqueness within its context (locale + model); append `-1`, `-2`, … on collision

---

## Edge Cases and Fallbacks

- Missing translation record → fall back to base slug
- Translation exists but no slug:
  - For News, system auto-generates from translation title and persists (via `/api/slugs/news`)
  - For Services, system currently falls back to the KA/base slug
- Percent-encoded incoming paths are decoded before DB lookup to avoid duplicate or broken links

---

## Testing Checklist

1) Manual paste of percent-encoded KA slug → page renders and URL remains percent-encoded canonical
2) Switch RU → KA on a News post with localized slug → URL changes to KA slug
3) If News translation had no slug but has a title → first RU → KA switch generates, persists, and uses KA slug
4) Switch across all languages repeatedly → URL always matches the active locale’s canonical slug
5) Services locale switch behaves similarly (falls back to base if no localized slug)

---

## Future Improvements

- Apply the “auto-generate and persist missing slug” behavior to Services as well for complete parity with News
- Add unit tests for slug resolvers and page canonicalization redirects


