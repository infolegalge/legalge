import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

function slugify(input: string, locale?: string): string {
  const isUnicode = locale === "ka" || locale === "ru";
  
  if (isUnicode) {
    const base = (input || "").toString().trim();
    if (!base) return "";
    const lowered = base.toLocaleLowerCase(locale);
    return lowered
      .normalize("NFKC")
      .replace(/["'']/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  }
  
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function readExcelTranslations() {
  const translations = {
    ka: new Map<string, { practice: string; services: Map<string, string> }>(),
    ru: new Map<string, { practice: string; services: Map<string, string> }>(),
  };

  // Read Georgian translations
  const geoPath = join(process.cwd(), "data", "Practice-areas", "GEO.xlsx");
  const geoBuf = await fs.readFile(geoPath);
  const geoWb = XLSX.read(geoBuf, { type: "buffer" });
  const geoSheet = geoWb.Sheets[geoWb.SheetNames[0]];
  const geoRows: Record<string, any>[] = XLSX.utils.sheet_to_json(geoSheet, { defval: "" });

  for (const row of geoRows) {
    const practiceTitle = String(row["Practice Area"] ?? "").trim();
    const serviceTitle = String(row["Service"] ?? "").trim();
    
    if (!practiceTitle) continue;

    const practiceSlug = slugify(practiceTitle, "en"); // Use English slug as key
    
    if (!translations.ka.has(practiceSlug)) {
      translations.ka.set(practiceSlug, {
        practice: practiceTitle,
        services: new Map(),
      });
    }

    if (serviceTitle) {
      const serviceSlug = slugify(serviceTitle, "en"); // Use English slug as key
      translations.ka.get(practiceSlug)!.services.set(serviceSlug, serviceTitle);
    }
  }

  // Read Russian translations
  const ruPath = join(process.cwd(), "data", "Practice-areas", "RUS.xlsx");
  const ruBuf = await fs.readFile(ruPath);
  const ruWb = XLSX.read(ruBuf, { type: "buffer" });
  const ruSheet = ruWb.Sheets[ruWb.SheetNames[0]];
  const ruRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ruSheet, { defval: "" });

  for (const row of ruRows) {
    const practiceTitle = String(row["Practice Area"] ?? "").trim();
    const serviceTitle = String(row["Service"] ?? "").trim();
    
    if (!practiceTitle) continue;

    const practiceSlug = slugify(practiceTitle, "en"); // Use English slug as key
    
    if (!translations.ru.has(practiceSlug)) {
      translations.ru.set(practiceSlug, {
        practice: practiceTitle,
        services: new Map(),
      });
    }

    if (serviceTitle) {
      const serviceSlug = slugify(serviceTitle, "en"); // Use English slug as key
      translations.ru.get(practiceSlug)!.services.set(serviceSlug, serviceTitle);
    }
  }

  return translations;
}

async function main() {
  try {
    console.log("🌐 Fixing translations with proper Georgian and Russian names...\n");

    // Read correct translations from Excel files
    const translations = await readExcelTranslations();

    let updatedPractices = 0;
    let updatedServices = 0;

    // Update practice area translations
    console.log("📋 Updating practice area translations...");
    const practices = await prisma.practiceArea.findMany();

    for (const practice of practices) {
      // Update Georgian translation
      const geoTranslation = translations.ka.get(practice.slug);
      if (geoTranslation) {
        const geoSlug = slugify(geoTranslation.practice, "ka");
        await prisma.practiceAreaTranslation.upsert({
          where: { practiceAreaId_locale: { practiceAreaId: practice.id, locale: "ka" } },
          create: {
            practiceAreaId: practice.id,
            locale: "ka",
            title: geoTranslation.practice,
            slug: geoSlug,
          },
          update: {
            title: geoTranslation.practice,
            slug: geoSlug,
          },
        });
        console.log(`✅ Georgian: "${geoTranslation.practice}"`);
      }

      // Update Russian translation
      const ruTranslation = translations.ru.get(practice.slug);
      if (ruTranslation) {
        const ruSlug = slugify(ruTranslation.practice, "ru");
        await prisma.practiceAreaTranslation.upsert({
          where: { practiceAreaId_locale: { practiceAreaId: practice.id, locale: "ru" } },
          create: {
            practiceAreaId: practice.id,
            locale: "ru",
            title: ruTranslation.practice,
            slug: ruSlug,
          },
          update: {
            title: ruTranslation.practice,
            slug: ruSlug,
          },
        });
        console.log(`✅ Russian: "${ruTranslation.practice}"`);
      }

      updatedPractices++;
    }

    // Update service translations
    console.log("\n🔧 Updating service translations...");
    const services = await prisma.service.findMany({
      include: { practiceArea: true },
    });

    for (const service of services) {
      const practiceTranslations = translations.ka.get(service.practiceArea.slug);
      
      // Update Georgian service translation
      const geoServiceTitle = practiceTranslations?.services.get(service.slug);
      if (geoServiceTitle) {
        const geoSlug = slugify(geoServiceTitle, "ka");
        await prisma.serviceTranslation.upsert({
          where: { serviceId_locale: { serviceId: service.id, locale: "ka" } },
          create: {
            serviceId: service.id,
            locale: "ka",
            title: geoServiceTitle,
            slug: geoSlug,
          },
          update: {
            title: geoServiceTitle,
            slug: geoSlug,
          },
        });
        console.log(`✅ Georgian Service: "${geoServiceTitle}"`);
      }

      // Update Russian service translation
      const ruTranslations = translations.ru.get(service.practiceArea.slug);
      const ruServiceTitle = ruTranslations?.services.get(service.slug);
      if (ruServiceTitle) {
        const ruSlug = slugify(ruServiceTitle, "ru");
        await prisma.serviceTranslation.upsert({
          where: { serviceId_locale: { serviceId: service.id, locale: "ru" } },
          create: {
            serviceId: service.id,
            locale: "ru",
            title: ruServiceTitle,
            slug: ruSlug,
          },
          update: {
            title: ruServiceTitle,
            slug: ruSlug,
          },
        });
        console.log(`✅ Russian Service: "${ruServiceTitle}"`);
      }

      updatedServices++;
    }

    console.log("\n✅ Translation fixing complete!\n");
    console.log(`📊 Summary:`);
    console.log(`   Practice areas updated: ${updatedPractices}`);
    console.log(`   Services updated: ${updatedServices}`);

    // Verify the results
    console.log("\n🔍 Verification - Sample translations:");
    const samplePractice = await prisma.practiceAreaTranslation.findFirst({
      where: { locale: "ka" },
      include: { practiceArea: true },
    });

    if (samplePractice) {
      console.log(`Practice Area: ${samplePractice.practiceArea.title}`);
      console.log(`  Georgian: "${samplePractice.title}" (slug: ${samplePractice.slug})`);
      
      const ruTranslation = await prisma.practiceAreaTranslation.findFirst({
        where: { practiceAreaId: samplePractice.practiceAreaId, locale: "ru" },
      });
      if (ruTranslation) {
        console.log(`  Russian: "${ruTranslation.title}" (slug: ${ruTranslation.slug})`);
      }
    }

  } catch (error) {
    console.error("❌ Error fixing translations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
