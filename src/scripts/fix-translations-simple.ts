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
    ka: [] as Array<{ practice: string; service: string }>,
    ru: [] as Array<{ practice: string; service: string }>,
  };

  // Read Georgian data
  const geoPath = join(process.cwd(), "data", "Practice-areas", "GEO.xlsx");
  const geoBuf = await fs.readFile(geoPath);
  const geoWb = XLSX.read(geoBuf, { type: "buffer" });
  const geoSheet = geoWb.Sheets[geoWb.SheetNames[0]];
  const geoRows: Record<string, any>[] = XLSX.utils.sheet_to_json(geoSheet, { defval: "" });

  for (const row of geoRows) {
    const practiceTitle = String(row["Practice Area"] ?? "").trim();
    const serviceTitle = String(row["Service"] ?? "").trim();
    
    if (practiceTitle && serviceTitle) {
      translations.ka.push({ practice: practiceTitle, service: serviceTitle });
    }
  }

  // Read Russian data
  const ruPath = join(process.cwd(), "data", "Practice-areas", "RUS.xlsx");
  const ruBuf = await fs.readFile(ruPath);
  const ruWb = XLSX.read(ruBuf, { type: "buffer" });
  const ruSheet = ruWb.Sheets[ruWb.SheetNames[0]];
  const ruRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ruSheet, { defval: "" });

  for (const row of ruRows) {
    const practiceTitle = String(row["Practice Area"] ?? "").trim();
    const serviceTitle = String(row["Service"] ?? "").trim();
    
    if (practiceTitle && serviceTitle) {
      translations.ru.push({ practice: practiceTitle, service: serviceTitle });
    }
  }

  return translations;
}

async function main() {
  try {
    console.log("🌐 Fixing translations with simple approach...\n");

    // Read translations from Excel files
    const translations = await readExcelTranslations();

    let updatedPractices = 0;
    let updatedServices = 0;

    // Get all practice areas and services
    const practices = await prisma.practiceArea.findMany({
      include: { services: { orderBy: { title: 'asc' } } },
    });

    // Create mappings by order
    const practiceOrder = [
      "migration-to-georgia",
      "labor-law", 
      "legallaunch-for-startups",
      "crypto-law",
      "corporate-governance-and-business-compliance",
      "licenses",
      "permits",
      "tax-and-accounting",
      "banks-and-finances",
      "ip-trademark-inventions",
      "personal-data-protection",
      "property-law",
      "honor-reputation-protection",
      "international-law",
      "litigation-and-dispute-resolution",
      "family-law",
      "criminal-defense-and-white-collar-crime",
      "environmental-and-energy-law",
      "healthcare-and-pharmaceutical-law",
      "sports-media-entertainment-law",
      "aviation-and-maritime-law",
      "technology-and-ai-law",
      "education-law",
      "non-profit-and-ngo-law",
      "military-and-national-security-law"
    ];

    // Group translations by practice area
    const geoByPractice = new Map<string, string[]>();
    const ruByPractice = new Map<string, string[]>();

    let currentPractice = "";
    for (const item of translations.ka) {
      if (item.practice !== currentPractice) {
        currentPractice = item.practice;
        geoByPractice.set(currentPractice, []);
      }
      geoByPractice.get(currentPractice)!.push(item.service);
    }

    currentPractice = "";
    for (const item of translations.ru) {
      if (item.practice !== currentPractice) {
        currentPractice = item.practice;
        ruByPractice.set(currentPractice, []);
      }
      ruByPractice.get(currentPractice)!.push(item.service);
    }

    // Update practice area translations
    console.log("📋 Updating practice area translations...");
    for (let i = 0; i < practiceOrder.length; i++) {
      const practiceSlug = practiceOrder[i];
      const practice = practices.find(p => p.slug === practiceSlug);
      
      if (!practice) continue;

      // Get Georgian practice name (first occurrence)
      const geoPracticeName = Array.from(geoByPractice.keys())[i];
      if (geoPracticeName) {
        await prisma.practiceAreaTranslation.upsert({
          where: { practiceAreaId_locale: { practiceAreaId: practice.id, locale: "ka" } },
          create: {
            practiceAreaId: practice.id,
            locale: "ka",
            title: geoPracticeName,
            slug: slugify(geoPracticeName, "ka"),
          },
          update: {
            title: geoPracticeName,
            slug: slugify(geoPracticeName, "ka"),
          },
        });
        console.log(`✅ Georgian Practice: "${geoPracticeName}"`);
      }

      // Get Russian practice name
      const ruPracticeName = Array.from(ruByPractice.keys())[i];
      if (ruPracticeName) {
        await prisma.practiceAreaTranslation.upsert({
          where: { practiceAreaId_locale: { practiceAreaId: practice.id, locale: "ru" } },
          create: {
            practiceAreaId: practice.id,
            locale: "ru",
            title: ruPracticeName,
            slug: slugify(ruPracticeName, "ru"),
          },
          update: {
            title: ruPracticeName,
            slug: slugify(ruPracticeName, "ru"),
          },
        });
        console.log(`✅ Russian Practice: "${ruPracticeName}"`);
      }

      updatedPractices++;
    }

    // Update service translations
    console.log("\n🔧 Updating service translations...");
    for (let i = 0; i < practiceOrder.length; i++) {
      const practiceSlug = practiceOrder[i];
      const practice = practices.find(p => p.slug === practiceSlug);
      
      if (!practice) continue;

      const geoServices = Array.from(geoByPractice.values())[i] || [];
      const ruServices = Array.from(ruByPractice.values())[i] || [];

      // Update each service in this practice area
      for (let j = 0; j < practice.services.length; j++) {
        const service = practice.services[j];
        
        // Update Georgian service translation
        if (geoServices[j]) {
          await prisma.serviceTranslation.upsert({
            where: { serviceId_locale: { serviceId: service.id, locale: "ka" } },
            create: {
              serviceId: service.id,
              locale: "ka",
              title: geoServices[j],
              slug: slugify(geoServices[j], "ka"),
            },
            update: {
              title: geoServices[j],
              slug: slugify(geoServices[j], "ka"),
            },
          });
          console.log(`✅ Georgian Service: "${geoServices[j]}"`);
        }

        // Update Russian service translation
        if (ruServices[j]) {
          await prisma.serviceTranslation.upsert({
            where: { serviceId_locale: { serviceId: service.id, locale: "ru" } },
            create: {
              serviceId: service.id,
              locale: "ru",
              title: ruServices[j],
              slug: slugify(ruServices[j], "ru"),
            },
            update: {
              title: ruServices[j],
              slug: slugify(ruServices[j], "ru"),
            },
          });
          console.log(`✅ Russian Service: "${ruServices[j]}"`);
        }

        updatedServices++;
      }
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
