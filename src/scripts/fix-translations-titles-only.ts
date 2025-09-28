import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

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
    console.log("🌐 Updating translation titles only (keeping English slugs)...\n");

    // Read translations from Excel files
    const translations = await readExcelTranslations();

    let updatedPractices = 0;
    let updatedServices = 0;

    // Get all practice areas and services
    const practices = await prisma.practiceArea.findMany({
      include: { services: { orderBy: { title: 'asc' } } },
    });

    // Define the exact order to match Excel files
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

    // Update practice area translations (titles only)
    console.log("📋 Updating practice area translation titles...");
    for (let i = 0; i < practiceOrder.length; i++) {
      const practiceSlug = practiceOrder[i];
      const practice = practices.find(p => p.slug === practiceSlug);
      
      if (!practice) continue;

      // Get Georgian practice name
      const geoPracticeNames = Array.from(geoByPractice.keys());
      const geoPracticeName = geoPracticeNames[i];
      if (geoPracticeName) {
        await prisma.practiceAreaTranslation.upsert({
          where: { practiceAreaId_locale: { practiceAreaId: practice.id, locale: "ka" } },
          create: {
            practiceAreaId: practice.id,
            locale: "ka",
            title: geoPracticeName,
            slug: practice.slug, // Keep English slug
          },
          update: {
            title: geoPracticeName,
            // Keep existing slug to avoid unique constraint issues
          },
        });
        console.log(`✅ Georgian Practice: "${geoPracticeName}"`);
      }

      // Get Russian practice name
      const ruPracticeNames = Array.from(ruByPractice.keys());
      const ruPracticeName = ruPracticeNames[i];
      if (ruPracticeName) {
        await prisma.practiceAreaTranslation.upsert({
          where: { practiceAreaId_locale: { practiceAreaId: practice.id, locale: "ru" } },
          create: {
            practiceAreaId: practice.id,
            locale: "ru",
            title: ruPracticeName,
            slug: practice.slug, // Keep English slug
          },
          update: {
            title: ruPracticeName,
            // Keep existing slug to avoid unique constraint issues
          },
        });
        console.log(`✅ Russian Practice: "${ruPracticeName}"`);
      }

      updatedPractices++;
    }

    // Update service translations (titles only)
    console.log("\n🔧 Updating service translation titles...");
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
              slug: service.slug, // Keep English slug
            },
            update: {
              title: geoServices[j],
              // Keep existing slug to avoid unique constraint issues
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
              slug: service.slug, // Keep English slug
            },
            update: {
              title: ruServices[j],
              // Keep existing slug to avoid unique constraint issues
            },
          });
          console.log(`✅ Russian Service: "${ruServices[j]}"`);
        }

        updatedServices++;
      }
    }

    console.log("\n✅ Translation title updates complete!\n");
    console.log(`📊 Summary:`);
    console.log(`   Practice areas updated: ${updatedPractices}`);
    console.log(`   Services updated: ${updatedServices}`);

    // Verify the results
    console.log("\n🔍 Verification - Sample translations:");
    const sampleTranslations = await prisma.practiceAreaTranslation.findMany({
      where: { locale: { in: ["ka", "ru"] } },
      include: { practiceArea: true },
      take: 6,
    });

    for (const t of sampleTranslations) {
      console.log(`${t.locale.toUpperCase()}: ${t.practiceArea.title} -> "${t.title}"`);
    }

  } catch (error) {
    console.error("❌ Error updating translations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
