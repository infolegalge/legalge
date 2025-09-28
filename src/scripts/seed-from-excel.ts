import { promises as fs } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import { PrismaClient, Locale } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function main() {
  const excelPath = join(process.cwd(), "data", "Practice-areas", "Legal_Service_Catalog_Full.xlsx");
  const buf = await fs.readFile(excelPath);
  const wb = XLSX.read(buf, { type: "buffer" });

  const sheetName = wb.SheetNames.find((n) => /practice|services?/i.test(n)) ?? wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const practiceKey = Object.keys(rows[0] ?? {}).find((k) => /practice/i.test(k)) ?? "Practice";
  const serviceKey = Object.keys(rows[0] ?? {}).find((k) => /service/i.test(k)) ?? "Service";

  const paSlugToId = new Map<string, string>();
  let createdAreas = 0;
  let createdServices = 0;

  for (const row of rows) {
    const practiceTitle: string = String(row[practiceKey] ?? "").trim();
    const serviceTitle: string = String(row[serviceKey] ?? "").trim();
    if (!practiceTitle) continue;

    const practiceSlug = slugify(practiceTitle);

    let practiceId = paSlugToId.get(practiceSlug);
    if (!practiceId) {
      // Upsert practice area by slug
      const pa = await prisma.practiceArea.upsert({
        where: { slug: practiceSlug },
        create: { slug: practiceSlug, title: practiceTitle },
        update: {},
      });
      practiceId = pa.id;
      paSlugToId.set(practiceSlug, practiceId);
      createdAreas++;

      // Ensure translations exist for all locales (initially copy EN across)
      const locales: Locale[] = ["en", "ka", "ru"] as unknown as Locale[];
      for (const loc of locales) {
        const tSlug = slugify(practiceTitle);
        // Ensure uniqueness per (locale, slug) by suffixing if needed
        let finalSlug = tSlug;
        let i = 1;
        while (await prisma.practiceAreaTranslation.findFirst({ where: { locale: loc, slug: finalSlug, NOT: { practiceAreaId: practiceId } } })) {
          finalSlug = `${tSlug}-${i++}`;
        }
        await prisma.practiceAreaTranslation.upsert({
          where: { practiceAreaId_locale: { practiceAreaId: practiceId, locale: loc } },
          create: { practiceAreaId: practiceId, locale: loc, title: practiceTitle, slug: finalSlug },
          update: { title: practiceTitle, slug: finalSlug },
        });
      }
    }

    if (serviceTitle) {
      const serviceSlug = slugify(serviceTitle);
      const service = await prisma.service.upsert({
        where: { slug: serviceSlug },
        create: { slug: serviceSlug, title: serviceTitle, practiceAreaId: practiceId },
        update: { practiceAreaId: practiceId },
      });
      createdServices++;

      const locales: Locale[] = ["en", "ka", "ru"] as unknown as Locale[];
      for (const loc of locales) {
        const tSlug = slugify(serviceTitle);
        let finalSlug = tSlug;
        let i = 1;
        while (await prisma.serviceTranslation.findFirst({ where: { locale: loc, slug: finalSlug, NOT: { serviceId: service.id } } })) {
          finalSlug = `${tSlug}-${i++}`;
        }
        await prisma.serviceTranslation.upsert({
          where: { serviceId_locale: { serviceId: service.id, locale: loc } },
          create: { serviceId: service.id, locale: loc, title: serviceTitle, slug: finalSlug },
          update: { title: serviceTitle, slug: finalSlug },
        });
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${createdAreas} practice areas and ${createdServices} services (with translations).`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
