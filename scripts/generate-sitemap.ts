#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

const APP_ROOT = process.cwd();
const APP_DIR = path.join(APP_ROOT, 'src', 'app');
const OUTPUT_FILE = path.join(APP_ROOT, 'public', 'sitemap.xml');
const BASE_URL = process.env.SITEMAP_BASE_URL || 'https://www.legal.ge';
const LOCALE_SEGMENT = '[locale]';

const VALID_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const EXCLUDED_SINGLETONS = new Set(['_app', '_document', '_error']);
const EXCLUDED_DIRS = ['api', 'admin'];
const EXCLUDED_FILES = new Set(['favicon.ico']);

function isDirectory(filePath: string) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

function isFile(filePath: string) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function shouldSkipSegment(segment: string): boolean {
  if (!segment) return true;
  if (segment === LOCALE_SEGMENT) return false;
  if (segment.startsWith('(') && segment.endsWith(')')) return true; // parallel route folders
  if (segment.startsWith('@')) return true; // named slots
  if (EXCLUDED_DIRS.includes(segment)) return true;
  if (segment.startsWith('[')) return true;
  if (segment.startsWith('_')) return true;
  return false;
}

function shouldProcessFile(entry: string): boolean {
  if (EXCLUDED_FILES.has(entry)) return false;
  return true;
}

function isPageFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  if (!VALID_EXTS.has(ext)) return false;
  const base = path.basename(filePath, ext);
  if (EXCLUDED_SINGLETONS.has(base)) return false;
  return true;
}

interface PageEntry {
  loc: string;
  lastmod?: string;
}

function collectRoutes(): PageEntry[] {
  const results: PageEntry[] = [];

  if (!isDirectory(APP_DIR)) {
    console.warn(`[sitemap] app directory not found at ${APP_DIR}`);
    return results;
  }

  const entries = fs.readdirSync(APP_DIR);

  for (const entry of entries) {
    const abs = path.join(APP_DIR, entry);

    if (!isDirectory(abs) && !isFile(abs)) {
      continue;
    }

    if (entry === LOCALE_SEGMENT && isDirectory(abs)) {
      const localeRoutes = collectLocaleRoutes(abs);
      results.push(...localeRoutes);
      continue;
    }

    if (isDirectory(abs)) {
      if (shouldSkipSegment(entry)) {
        continue;
      }
      const entryRoutes = walkDirectory(abs, [entry]);
      results.push(...entryRoutes);
      continue;
    }

    if (!shouldProcessFile(entry) || !isPageFile(abs)) {
      continue;
    }

    // Handle top-level files like src/app/page.tsx
    const lastmod = fs.statSync(abs).mtime.toISOString();
    const loc = `${BASE_URL}/${entry === 'page.tsx' || entry === 'page.ts' ? '' : entry}`.replace(/\/+/g, '/').replace(/\/$/, '') || BASE_URL;
    results.push({ loc, lastmod });
  }

  return results;
}

function collectLocaleRoutes(localeDir: string): PageEntry[] {
  const locales = fs.readdirSync(localeDir).filter((entry) => isDirectory(path.join(localeDir, entry)));
  const pages: PageEntry[] = [];

  for (const locale of locales) {
    const localeRoot = path.join(localeDir, locale);
    const localePages = walkDirectory(localeRoot, [locale]);
    pages.push(...localePages);
  }

  return pages;
}

function walkDirectory(dir: string, segments: string[]): PageEntry[] {
  const entries = fs.readdirSync(dir);
  const pages: PageEntry[] = [];

  for (const entry of entries) {
    const absPath = path.join(dir, entry);
    const currentSegments = [...segments];

    if (!isDirectory(absPath) && !isFile(absPath)) {
      continue;
    }

    if (isDirectory(absPath)) {
      if (shouldSkipSegment(entry)) {
        continue;
      }
      currentSegments.push(entry);
      pages.push(...walkDirectory(absPath, currentSegments));
      continue;
    }

    if (!shouldProcessFile(entry)) {
      continue;
    }

    if (!isFile(absPath) || !isPageFile(absPath)) {
      continue;
    }

    const ext = path.extname(entry);
    const base = path.basename(entry, ext);

    let routeSegments = [...segments];
    if (base !== 'page') {
      routeSegments.push(base);
    }

    const routePath = '/' + routeSegments.filter(Boolean).join('/');
    // Exclude duplicate slashes, trim trailing slash (except root)
    const normalizedPath = routePath.replace(/\/+/, '/');
    const loc = `${BASE_URL}${normalizedPath}`.replace(/\/$/, '') || BASE_URL;

    const lastmod = fs.statSync(absPath).mtime.toISOString();

    pages.push({ loc, lastmod });
  }

  return pages;
}

function buildXml(pages: PageEntry[]): string {
  const header = '<?xml version="1.0" encoding="UTF-8"?>';
  const openTag = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const closeTag = '</urlset>';

  const body = pages
    .sort((a, b) => a.loc.localeCompare(b.loc))
    .map(({ loc, lastmod }) => {
      const tags = [
        '  <url>',
        `    <loc>${loc}</loc>`,
      ];
      if (lastmod) {
        tags.push(`    <lastmod>${lastmod}</lastmod>`);
      }
      tags.push('    <priority>0.5</priority>');
      tags.push('  </url>');
      return tags.join('\n');
    })
    .join('\n');

  return [header, openTag, body, closeTag].join('\n');
}

function writeSitemap(content: string) {
  const dir = path.dirname(OUTPUT_FILE);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
}

function main() {
  const pages = collectRoutes();
  const xml = buildXml(pages);
  writeSitemap(xml);
  console.log(`[sitemap] Generated ${pages.length} entries at ${OUTPUT_FILE}`);
}

main();
