import { promises as fs } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

type PracticeArea = { id: string; slug: string; title: string; services: string[] };
type Service = { id: string; slug: string; title: string; parentId: string };

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

  // Heuristic: look for sheet names containing "practice" or take first
  const sheetName = wb.SheetNames.find((n) => /practice|services?/i.test(n)) ?? wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  // Expect columns like: Practice, Service
  const practiceKey = Object.keys(rows[0] ?? {}).find((k) => /practice/i.test(k)) ?? "Practice";
  const serviceKey = Object.keys(rows[0] ?? {}).find((k) => /service/i.test(k)) ?? "Service";

  const areasMap = new Map<string, PracticeArea>();
  const services: Service[] = [];

  for (const row of rows) {
    const practiceTitle: string = String(row[practiceKey] ?? "").trim();
    const serviceTitle: string = String(row[serviceKey] ?? "").trim();
    if (!practiceTitle) continue;

    const practiceSlug = slugify(practiceTitle);
    if (!areasMap.has(practiceSlug)) {
      areasMap.set(practiceSlug, {
        id: `practice_${practiceSlug}`,
        slug: practiceSlug,
        title: practiceTitle,
        services: [],
      });
    }

    if (serviceTitle) {
      const serviceSlug = slugify(serviceTitle);
      services.push({
        id: `service_${practiceSlug}_${serviceSlug}`,
        slug: serviceSlug,
        title: serviceTitle,
        parentId: `practice_${practiceSlug}`,
      });
      const area = areasMap.get(practiceSlug)!;
      if (!area.services.includes(serviceSlug)) area.services.push(serviceSlug);
    }
  }

  const areas = Array.from(areasMap.values());

  await fs.writeFile(
    join(process.cwd(), "data", "normalized.practice-areas.json"),
    JSON.stringify(areas, null, 2),
    "utf8",
  );
  await fs.writeFile(
    join(process.cwd(), "data", "normalized.services.json"),
    JSON.stringify(services, null, 2),
    "utf8",
  );
  // eslint-disable-next-line no-console
  console.log(`Wrote ${areas.length} practice areas and ${services.length} services.`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


