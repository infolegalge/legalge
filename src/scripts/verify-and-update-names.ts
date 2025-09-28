import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function readExcelData() {
  const excelPath = join(process.cwd(), "data", "Practice-areas", "Legal_Service_Catalog_Full.xlsx");
  const buf = await fs.readFile(excelPath);
  const wb = XLSX.read(buf, { type: "buffer" });

  const sheetName = wb.SheetNames.find((n) => /practice|services?/i.test(n)) ?? wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const practiceKey = Object.keys(rows[0] ?? {}).find((k) => /practice/i.test(k)) ?? "Practice Area";
  const serviceKey = Object.keys(rows[0] ?? {}).find((k) => /service/i.test(k)) ?? "Service";

  const correctData = new Map<string, { title: string; services: string[] }>();

  for (const row of rows) {
    const practiceTitle: string = String(row[practiceKey] ?? "").trim();
    const serviceTitle: string = String(row[serviceKey] ?? "").trim();
    
    if (!practiceTitle) continue;

    const practiceSlug = slugify(practiceTitle);
    
    if (!correctData.has(practiceSlug)) {
      correctData.set(practiceSlug, { title: practiceTitle, services: [] });
    }

    if (serviceTitle) {
      const area = correctData.get(practiceSlug)!;
      if (!area.services.includes(serviceTitle)) {
        area.services.push(serviceTitle);
      }
    }
  }

  return correctData;
}

async function main() {
  try {
    console.log("🔍 Verifying practice area and service names against Excel data...\n");

    // Read correct data from Excel
    const correctData = await readExcelData();

    // Get current database data
    const dbPractices = await prisma.practiceArea.findMany({
      include: { services: true },
    });

    let updatedPractices = 0;
    let updatedServices = 0;
    let totalIssues = 0;

    console.log("📋 Checking practice areas...\n");

    for (const dbPractice of dbPractices) {
      const correctPractice = correctData.get(dbPractice.slug);
      
      if (!correctPractice) {
        console.log(`⚠️  Practice area not found in Excel: ${dbPractice.title} (${dbPractice.slug})`);
        totalIssues++;
        continue;
      }

      // Check practice area title
      if (dbPractice.title !== correctPractice.title) {
        console.log(`🔄 Updating practice area title:`);
        console.log(`   From: "${dbPractice.title}"`);
        console.log(`   To:   "${correctPractice.title}"`);
        
        await prisma.practiceArea.update({
          where: { id: dbPractice.id },
          data: { title: correctPractice.title },
        });
        updatedPractices++;
      }

      // Check services
      const dbServiceTitles = dbPractice.services.map(s => s.title);
      const correctServiceTitles = correctPractice.services;

      for (const service of dbPractice.services) {
        const correctTitle = correctServiceTitles.find(t => slugify(t) === service.slug);
        
        if (correctTitle && service.title !== correctTitle) {
          console.log(`🔄 Updating service title:`);
          console.log(`   Practice: ${correctPractice.title}`);
          console.log(`   Service: "${service.title}" → "${correctTitle}"`);
          
          await prisma.service.update({
            where: { id: service.id },
            data: { title: correctTitle },
          });
          updatedServices++;
        }
      }
    }

    // Update translations to match the corrected English titles
    console.log("\n🌐 Updating translations...\n");

    for (const dbPractice of dbPractices) {
      const correctPractice = correctData.get(dbPractice.slug);
      
      if (correctPractice) {
        // Update practice area translations
        await prisma.practiceAreaTranslation.updateMany({
          where: { practiceAreaId: dbPractice.id },
          data: { title: correctPractice.title },
        });

        // Update service translations
        for (const service of dbPractice.services) {
          const correctTitle = correctPractice.services.find(t => slugify(t) === service.slug);
          
          if (correctTitle) {
            await prisma.serviceTranslation.updateMany({
              where: { serviceId: service.id },
              data: { title: correctTitle },
            });
          }
        }
      }
    }

    console.log("✅ Verification and update complete!\n");
    console.log(`📊 Summary:`);
    console.log(`   Practice areas updated: ${updatedPractices}`);
    console.log(`   Services updated: ${updatedServices}`);
    console.log(`   Total issues found: ${totalIssues}`);
    
    if (updatedPractices === 0 && updatedServices === 0) {
      console.log("\n🎉 All names are already correct and match Excel data!");
    }

  } catch (error) {
    console.error("❌ Error during verification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
