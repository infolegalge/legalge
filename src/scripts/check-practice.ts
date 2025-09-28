import { findPracticeBySlugForLocale } from "@/lib/db";

async function main() {
  for (const locale of ["en", "ka", "ru"] as const) {
    const slug = locale === "en" ? "legallaunch-for-startups-2" : locale === "ka" ? "legallaunch-სტარტაპებისთვის" : "legallaunch-для-стартапов";
    const item = await findPracticeBySlugForLocale(locale as any, slug);
    console.log(locale, slug, { heroImageUrl: item?.heroImageUrl, heroImageAlt: item?.heroImageAlt });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


