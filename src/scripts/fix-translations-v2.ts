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

async function createTranslationMappings() {
  // Read all three Excel files to create proper mappings
  const mappings = {
    en: new Map<string, { practice: string; services: Map<string, string> }>(),
    ka: new Map<string, { practice: string; services: Map<string, string> }>(),
    ru: new Map<string, { practice: string; services: Map<string, string> }>(),
  };

  // Read English data
  const enPath = join(process.cwd(), "data", "Practice-areas", "Legal_Service_Catalog_Full.xlsx");
  const enBuf = await fs.readFile(enPath);
  const enWb = XLSX.read(enBuf, { type: "buffer" });
  const enSheet = enWb.Sheets[enWb.SheetNames[0]];
  const enRows: Record<string, any>[] = XLSX.utils.sheet_to_json(enSheet, { defval: "" });

  for (const row of enRows) {
    const practiceTitle = String(row["Practice Area"] ?? "").trim();
    const serviceTitle = String(row["Service"] ?? "").trim();
    
    if (!practiceTitle) continue;

    const practiceSlug = slugify(practiceTitle, "en");
    
    if (!mappings.en.has(practiceSlug)) {
      mappings.en.set(practiceSlug, {
        practice: practiceTitle,
        services: new Map(),
      });
    }

    if (serviceTitle) {
      const serviceSlug = slugify(serviceTitle, "en");
      mappings.en.get(practiceSlug)!.services.set(serviceSlug, serviceTitle);
    }
  }

  // Read Georgian data with same order as English
  const geoPath = join(process.cwd(), "data", "Practice-areas", "GEO.xlsx");
  const geoBuf = await fs.readFile(geoPath);
  const geoWb = XLSX.read(geoBuf, { type: "buffer" });
  const geoSheet = geoWb.Sheets[geoWb.SheetNames[0]];
  const geoRows: Record<string, any>[] = XLSX.utils.sheet_to_json(geoSheet, { defval: "" });

  // Create mapping by row index since the files should have the same structure
  const enPracticeOrder = Array.from(mappings.en.keys());
  let practiceIndex = 0;
  let currentPracticeSlug = enPracticeOrder[practiceIndex];

  for (const row of geoRows) {
    const practiceTitle = String(row["Practice Area"] ?? "").trim();
    const serviceTitle = String(row["Service"] ?? "").trim();
    
    if (!practiceTitle) continue;

    // If we hit a new practice area, move to next
    if (practiceTitle && practiceTitle !== mappings.ka.get(currentPracticeSlug)?.practice) {
      practiceIndex++;
      if (practiceIndex < enPracticeOrder.length) {
        currentPracticeSlug = enPracticeOrder[practiceIndex];
      }
    }

    if (!mappings.ka.has(currentPracticeSlug)) {
      mappings.ka.set(currentPracticeSlug, {
        practice: practiceTitle,
        services: new Map(),
      });
    }

    if (serviceTitle) {
      const enServices = mappings.en.get(currentPracticeSlug)?.services;
      if (enServices) {
        // Find the corresponding English service by position
        const enServiceTitles = Array.from(enServices.values());
        const geoServiceIndex = mappings.ka.get(currentPracticeSlug)!.services.size;
        
        if (geoServiceIndex < enServiceTitles.length) {
          const enServiceTitle = enServiceTitles[geoServiceIndex];
          const enServiceSlug = slugify(enServiceTitle, "en");
          mappings.ka.get(currentPracticeSlug)!.services.set(enServiceSlug, serviceTitle);
        }
      }
    }
  }

  // Read Russian data with same approach
  const ruPath = join(process.cwd(), "data", "Practice-areas", "RUS.xlsx");
  const ruBuf = await fs.readFile(ruPath);
  const ruWb = XLSX.read(ruBuf, { type: "buffer" });
  const ruSheet = ruWb.Sheets[ruWb.SheetNames[0]];
  const ruRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ruSheet, { defval: "" });

  practiceIndex = 0;
  currentPracticeSlug = enPracticeOrder[practiceIndex];

  for (const row of ruRows) {
    const practiceTitle = String(row["Practice Area"] ?? "").trim();
    const serviceTitle = String(row["Service"] ?? "").trim();
    
    if (!practiceTitle) continue;

    // If we hit a new practice area, move to next
    if (practiceTitle && practiceTitle !== mappings.ru.get(currentPracticeSlug)?.practice) {
      practiceIndex++;
      if (practiceIndex < enPracticeOrder.length) {
        currentPracticeSlug = enPracticeOrder[practiceIndex];
      }
    }

    if (!mappings.ru.has(currentPracticeSlug)) {
      mappings.ru.set(currentPracticeSlug, {
        practice: practiceTitle,
        services: new Map(),
      });
    }

    if (serviceTitle) {
      const enServices = mappings.en.get(currentPracticeSlug)?.services;
      if (enServices) {
        // Find the corresponding English service by position
        const enServiceTitles = Array.from(enServices.values());
        const ruServiceIndex = mappings.ru.get(currentPracticeSlug)!.services.size;
        
        if (ruServiceIndex < enServiceTitles.length) {
          const enServiceTitle = enServiceTitles[ruServiceIndex];
          const enServiceSlug = slugify(enServiceTitle, "en");
          mappings.ru.get(currentPracticeSlug)!.services.set(enServiceSlug, serviceTitle);
        }
      }
    }
  }

  return mappings;
}

async function main() {
  try {
    console.log("🌐 Creating proper translation mappings and updating database...\n");

    // Create mappings
    const mappings = await createTranslationMappings();

    // Show sample mappings
    console.log("📋 Sample mappings:");
    const firstPracticeSlug = Array.from(mappings.en.keys())[0];
    console.log(`Practice: ${firstPracticeSlug}`);
    console.log(`  EN: "${mappings.en.get(firstPracticeSlug)?.practice}"`);
    console.log(`  KA: "${mappings.ka.get(firstPracticeSlug)?.practice}"`);
    console.log(`  RU: "${mappings.ru.get(firstPracticeSlug)?.practice}"`);

    let updatedPractices = 0;
    let updatedServices = 0;

    // Update practice area translations
    console.log("\n📋 Updating practice area translations...");
    const practices = await prisma.practiceArea.findMany();

    for (const practice of practices) {
      // Update Georgian translation
      const geoTranslation = mappings.ka.get(practice.slug);
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
      const ruTranslation = mappings.ru.get(practice.slug);
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
      // Update Georgian service translation
      const geoTranslation = mappings.ka.get(service.practiceArea.slug);
      const geoServiceTitle = geoTranslation?.services.get(service.slug);
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
      const ruTranslation = mappings.ru.get(service.practiceArea.slug);
      const ruServiceTitle = ruTranslation?.services.get(service.slug);
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

  } catch (error) {
    console.error("❌ Error fixing translations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
