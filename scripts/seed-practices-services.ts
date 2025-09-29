import fs from "fs";
import path from "path";
import slugify from "slugify";
import { PrismaClient } from "@prisma/client";

type Locale = "ka" | "en" | "ru";

interface PracticeSnapshot {
  id: string;
  slug: string;
  title: string;
  services: string[];
}

interface TranslationSnapshot {
  slug: string;
  en: string;
  ka: string;
  ru: string;
  services: Array<{
    slug: string;
    en: string;
    ka: string;
    ru: string;
  }>;
}

const locales: Locale[] = ["ka", "en", "ru"];

function loadJSON<T>(relativePath: string): T {
  const filePath = path.join(process.cwd(), relativePath);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function getLocaleValue<T extends { en: string; ka: string; ru: string }>(
  entry: T,
  locale: Locale,
) {
  return entry[locale];
}

function getLocalizedSlug(baseSlug: string, locale: Locale) {
  if (locale === "ka") return baseSlug;
  return slugify(baseSlug, { lower: true, strict: true });
}

const prisma = new PrismaClient();

async function main() {
  const practiceSnapshot = loadJSON<PracticeSnapshot[]>(
    "data/normalized.practice-areas.json",
  );

  const translationsSnapshot = loadJSON<{
    practices: TranslationSnapshot[];
  }>("data/compiled.services.i18n.json");

  const translationsByPracticeSlug = new Map(
    translationsSnapshot.practices.map((p) => [p.slug, p]),
  );

  const serviceTranslationMap = new Map(
    translationsSnapshot.practices.flatMap((practice) =>
      practice.services.map((service) => [service.slug, service] as const),
    ),
  );

  console.log("Seeding practice areas (upsert)…");

  for (const practice of practiceSnapshot) {
    const translation = translationsByPracticeSlug.get(practice.slug);
    if (!translation) {
      console.warn(
        `⚠️  Missing translation entry for practice "${practice.slug}"`,
      );
      continue;
    }

    const createdPractice = await prisma.practiceArea.upsert({
      where: { slug: practice.slug },
      update: {
        title: translation.en,
        translations: {
          deleteMany: {},
          create: locales.map((locale) => ({
            locale,
            title: getLocaleValue(translation, locale),
            slug: getLocalizedSlug(practice.slug, locale),
          })),
        },
      },
      create: {
        slug: practice.slug,
        title: translation.en,
        translations: {
          create: locales.map((locale) => ({
            locale,
            title: getLocaleValue(translation, locale),
            slug: getLocalizedSlug(practice.slug, locale),
          })),
        },
      },
    });

    console.log(` • ${createdPractice.slug}`);

    for (const serviceSlug of practice.services) {
      const serviceTranslation = serviceTranslationMap.get(serviceSlug);

      if (!serviceTranslation) {
        console.warn(
          `   ⚠️  Missing translation entry for service "${serviceSlug}"`,
        );
        continue;
      }

      await prisma.service.upsert({
        where: { slug: serviceSlug },
        update: {
          title: serviceTranslation.en,
          practiceAreaId: createdPractice.id,
          translations: {
            deleteMany: {},
            create: locales.map((locale) => ({
              locale,
              title: getLocaleValue(serviceTranslation, locale),
              slug: getLocalizedSlug(serviceSlug, locale),
            })),
          },
        },
        create: {
          slug: serviceSlug,
          title: serviceTranslation.en,
          practiceAreaId: createdPractice.id,
          translations: {
            create: locales.map((locale) => ({
              locale,
              title: getLocaleValue(serviceTranslation, locale),
              slug: getLocalizedSlug(serviceSlug, locale),
            })),
          },
        },
      });

      console.log(`   • ${serviceSlug}`);
    }
  }

  console.log("✅ Practice areas and services seeded successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Failed to seed practice areas/services", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

