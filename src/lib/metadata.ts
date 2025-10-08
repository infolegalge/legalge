import type { Locale } from "@/i18n/locales";
import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://legal.ge";

export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

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

export function createRouteMetadata(
  path: string | string[] | null | undefined,
  overrides?: Metadata,
): Metadata {
  const { alternates, ...rest } = overrides ?? {};

  return {
    metadataBase: getMetadataBase(),
    alternates: {
      ...(alternates ?? {}),
      canonical: buildCanonicalPath(path),
    },
    ...rest,
  } satisfies Metadata;
}

export function createLocaleRouteMetadata(
  locale: Locale,
  path?: string | string[] | null,
  overrides?: Metadata,
): Metadata {
  const { alternates, ...rest } = overrides ?? {};

  return {
    metadataBase: getMetadataBase(),
    alternates: {
      ...(alternates ?? {}),
      canonical: buildLocaleCanonicalPath(locale, path ?? null),
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

