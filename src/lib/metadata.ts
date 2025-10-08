import type { Locale } from "@/i18n/locales";
import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://legal.ge";

export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

export const SUPPORTED_LOCALES: Locale[] = ["ka", "en", "ru"]; // maintain order for hreflang

export function getMetadataBase(): URL {
  try {
    return new URL(SITE_ORIGIN);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

function normalizeSegment(segment: string): string {
  return segment.replace(/^\/+/g, "").replace(/\/+/g, "/");
}

function joinPaths(segments: Array<string | null | undefined>): string {
  const cleaned = segments
    .filter((segment): segment is string => typeof segment === "string" && segment.trim().length > 0)
    .map((segment) => normalizeSegment(segment.trim()));

  if (cleaned.length === 0) {
    return "/";
  }

  return `/${cleaned.join("/")}`;
}

export function buildCanonicalPath(path: string | string[] | null | undefined): string {
  const segments = Array.isArray(path) ? path : [path];
  return joinPaths(segments);
}

export function buildLocaleCanonicalPath(locale: Locale, path?: string | string[] | null): string {
  if (!path) {
    return joinPaths([locale]);
  }

  const segments = Array.isArray(path) ? [locale, ...path] : [locale, path];
  return joinPaths(segments);
}

export type LocalePathMap = Partial<Record<Locale, string | string[] | null>>;

function buildLanguagesMap(defaultPath: string | string[] | null | undefined, overrides?: LocalePathMap): Record<string, string> {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => {
      const override = overrides?.[locale];
      const pathForLocale = override === undefined ? defaultPath : override;
      return [locale, buildLocaleCanonicalPath(locale, pathForLocale ?? null)];
    }),
  );
}

export function createRouteMetadata(
  path: string | string[] | null | undefined,
  overrides?: Metadata,
  languageOverrides?: LocalePathMap,
): Metadata {
  const { alternates, ...rest } = overrides ?? {};
  const canonical = buildCanonicalPath(path);
  const languages = buildLanguagesMap(path ?? null, languageOverrides);

  return {
    metadataBase: getMetadataBase(),
    alternates: {
      ...(alternates ?? {}),
      canonical,
      languages: {
        ...languages,
        ...(alternates?.languages ?? {}),
      },
    },
    ...rest,
  } satisfies Metadata;
}

export function createLocaleRouteMetadata(
  locale: Locale,
  path?: string | string[] | null,
  overrides?: Metadata,
  languageOverrides?: LocalePathMap,
): Metadata {
  const { alternates, ...rest } = overrides ?? {};
  const canonical = buildLocaleCanonicalPath(locale, path ?? null);
  const languages = buildLanguagesMap(path ?? null, languageOverrides);

  // ensure current locale canonical uses actual path for current override if provided
  languages[locale] = buildLocaleCanonicalPath(locale, (languageOverrides?.[locale] ?? path) ?? null);

  return {
    metadataBase: getMetadataBase(),
    alternates: {
      ...(alternates ?? {}),
      canonical,
      languages: {
        ...languages,
        ...(alternates?.languages ?? {}),
      },
    },
    ...rest,
  } satisfies Metadata;
}

export function createAlternatesWithLanguages(
  entries: Array<[Locale, string]>,
  path?: string | string[] | null,
): NonNullable<Metadata["alternates"]> {
  const metadataBase = getMetadataBase();

  const canonical = path ? buildCanonicalPath(path) : "/";
  const languages = Object.fromEntries(
    entries.map(([locale, slug]) => [locale, new URL(buildLocaleCanonicalPath(locale, slug), metadataBase).toString()]),
  );

  return {
    canonical,
    languages,
  } satisfies NonNullable<Metadata["alternates"]>;
}

