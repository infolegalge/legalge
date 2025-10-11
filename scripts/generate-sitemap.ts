#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

type Locale = 'ka' | 'en' | 'ru';

type RouteInfo = {
  pathname: string;
  filePath: string;
};

const APP_ROOT = process.cwd();
const APP_DIR = path.join(APP_ROOT, 'src', 'app');
const OUTPUT_FILE = path.join(APP_ROOT, 'public', 'sitemap.xml');
const BASE_URL = process.env.SITEMAP_BASE_URL || 'https://www.legal.ge';

const LOCALES: Locale[] = ['ka', 'en', 'ru'];
const LOCALE_SEGMENT = '[locale]';
const PUBLIC_SEGMENTS = ['practice', 'specialists', 'news', 'contact'] as const;
const KA_ONLY_SEGMENTS = ['privacy', 'terms'] as const;
const PAGE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

type Segments = string | string[];

function resolvePageFile(...segments: Segments[]): string | null {
  const flattened: string[] = [];
  for (const segment of segments) {
    if (Array.isArray(segment)) {
      flattened.push(...segment);
    } else if (segment) {
      flattened.push(segment);
    }
  }

  for (const ext of PAGE_EXTENSIONS) {
    const candidate = path.join(APP_DIR, ...flattened, `page${ext}`);
    try {
      if (fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

function toAbsoluteUrl(pathname: string): string {
  const normalized = normalizePath(pathname);
  const base = BASE_URL.replace(/\/$/, '');
  return normalized === '/' ? base : `${base}${normalized}`;
}

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  const prefixed = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const deduped = prefixed.replace(/\/+/g, '/');
  if (deduped !== '/' && deduped.endsWith('/')) {
    return deduped.slice(0, -1);
  }
  return deduped || '/';
}

function gatherRoutes(): RouteInfo[] {
  const routes: RouteInfo[] = [];

  const rootFile = resolvePageFile();
  if (rootFile) {
    routes.push({ pathname: '/', filePath: rootFile });
  }

  const localeRootFile = resolvePageFile(LOCALE_SEGMENT);
  if (!localeRootFile) {
    console.warn('[sitemap] Missing base locale page');
  }

  for (const locale of LOCALES) {
    if (localeRootFile) {
      routes.push({ pathname: `/${locale}`, filePath: localeRootFile });
    }

    for (const segment of PUBLIC_SEGMENTS) {
      const segmentFile = resolvePageFile([LOCALE_SEGMENT, segment as string]);
      if (segmentFile) {
        routes.push({ pathname: `/${locale}/${segment}`, filePath: segmentFile });
      }
    }

    if (locale === 'ka') {
      for (const slug of KA_ONLY_SEGMENTS) {
        const slugFile = resolvePageFile([LOCALE_SEGMENT, slug as string]);
        if (slugFile) {
          routes.push({ pathname: `/${locale}/${slug}`, filePath: slugFile });
        }
      }
    }
  }

  const seen = new Map<string, RouteInfo>();
  for (const route of routes) {
    seen.set(route.pathname, route);
  }
  return Array.from(seen.values());
}

function buildXml(routes: RouteInfo[]): string {
  const header = '<?xml version="1.0" encoding="UTF-8"?>';
  const openTag = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const closeTag = '</urlset>';

  const body = routes
    .sort((a, b) => a.pathname.localeCompare(b.pathname))
    .map(({ pathname, filePath }) => {
      const loc = toAbsoluteUrl(pathname);
      const lastmod = fs.statSync(filePath).mtime.toISOString();
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        '    <priority>0.5</priority>',
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return [header, openTag, body, closeTag].join('\n');
}

function writeSitemap(content: string) {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
}

function main() {
  const routes = gatherRoutes();
  const xml = buildXml(routes);
  writeSitemap(xml);
  console.log(`[sitemap] Generated ${routes.length} entries at ${OUTPUT_FILE}`);
}

main();
