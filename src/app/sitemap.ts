import { locales } from "@/i18n/locales";
import prisma from "@/lib/prisma";

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://legal.ge";
  const staticPaths = [
    "", 
    "/practice", 
    "/specialists", 
    "/news", 
    "/contact", 
    "/request",
    "/privacy",
    "/terms"
  ]; // localized

  const entries = [] as Array<{ url: string; lastModified?: string }>;
  
  // Simplified sitemap for now to avoid database issues
  for (const locale of locales) {
    for (const p of staticPaths) {
      entries.push({ url: `${base}/${locale}${p}` });
    }
  }
  
  return entries;
}

export const revalidate = 3600;


