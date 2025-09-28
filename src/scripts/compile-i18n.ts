import * as XLSX from "xlsx";
import { promises as fs } from "node:fs";
import { join } from "node:path";

type Locale = "en" | "ka" | "ru";

const FILES: Record<Locale, string> = {
  en: "/Users/doc/Documents/01.WebppAPPS/legal-ge/legalge/data/Practice-areas/Legal_Service_Catalog_Full.xlsx",
  ka: "/Users/doc/Documents/01.WebppAPPS/legal-ge/legalge/data/Practice-areas/GEO.xlsx",
  ru: "/Users/doc/Documents/01.WebppAPPS/legal-ge/legalge/data/Practice-areas/RUS.xlsx",
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toRows(sheet: XLSX.WorkSheet): any[][] {
  return XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" }) as any[][];
}

function detectColumns(rows: any[][]): { practiceCol: number; serviceCol: number } {
  const header = rows[0] || [];
  const lower = header.map((h) => String(h || "").toLowerCase());
  let practiceCol = lower.findIndex((h) => /practice/.test(h));
  let serviceCol = lower.findIndex((h) => /service/.test(h));
  // Heuristic fallback if not found
  if (practiceCol < 0 || serviceCol < 0) {
    const counts = header.map((_h, c) => {
      const seen = new Set<string>();
      let nonEmpty = 0;
      for (let r = 1; r < rows.length; r++) {
        const v = String(rows[r]?.[c] ?? "").trim();
        if (!v) continue;
        nonEmpty++;
        seen.add(v);
      }
      return { c, unique: seen.size, nonEmpty };
    });
    // Service typically has the largest unique count
    serviceCol = counts.reduce((m, x) => (x.unique > (counts[m]?.unique ?? -1) ? x.c : m), 0);
    // Practice typically has smaller unique count but many non-empty
    practiceCol = counts
      .filter((x) => x.c !== serviceCol)
      .reduce((best, x) => {
        if (best === -1) return x.c;
        const bx = counts[best]!;
        // Prefer fewer uniques but high nonEmpty
        if (x.unique < bx.unique) return x.c;
        if (x.unique === bx.unique && x.nonEmpty > bx.nonEmpty) return x.c;
        return best;
      }, -1);
    if (practiceCol < 0) practiceCol = 0;
  }
  return { practiceCol, serviceCol };
}

function readPairs(filePath: string): Array<{ practice: string; service: string }> {
  const buf = XLSX.readFile(filePath);
  const sheetName = buf.SheetNames[0];
  const sheet = buf.Sheets[sheetName];
  const rows = toRows(sheet);
  const { practiceCol, serviceCol } = detectColumns(rows);
  const pairs: Array<{ practice: string; service: string }> = [];
  for (let r = 1; r < rows.length; r++) {
    const practice = String(rows[r]?.[practiceCol] ?? "").trim();
    const service = String(rows[r]?.[serviceCol] ?? "").trim();
    if (!practice) continue;
    pairs.push({ practice, service });
  }
  return pairs;
}

async function main() {
  const enPairs = readPairs(FILES.en);
  const kaPairs = readPairs(FILES.ka);
  const ruPairs = readPairs(FILES.ru);

  const minLen = Math.min(enPairs.length, kaPairs.length, ruPairs.length);
  if (enPairs.length !== kaPairs.length || enPairs.length !== ruPairs.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `Row count mismatch: en=${enPairs.length} ka=${kaPairs.length} ru=${ruPairs.length}. Will align by row index up to ${minLen}.`,
    );
  }

  type ServiceEntry = { slug: string; en: string; ka: string; ru: string };
  type PracticeEntry = { slug: string; en: string; ka: string; ru: string; services: ServiceEntry[] };

  const practiceSlugToEntry = new Map<string, PracticeEntry>();

  for (let i = 0; i < minLen; i++) {
    const en = enPairs[i]!;
    const ka = kaPairs[i]!;
    const ru = ruPairs[i]!;

    const practiceSlug = slugify(en.practice);
    const serviceSlug = en.service ? slugify(en.service) : "";

    let p = practiceSlugToEntry.get(practiceSlug);
    if (!p) {
      p = { slug: practiceSlug, en: en.practice, ka: ka.practice, ru: ru.practice, services: [] };
      practiceSlugToEntry.set(practiceSlug, p);
    }

    if (en.service) {
      // avoid duplicates
      if (!p.services.some((s) => s.slug === serviceSlug)) {
        p.services.push({ slug: serviceSlug, en: en.service, ka: ka.service, ru: ru.service });
      }
    }
  }

  const practices = Array.from(practiceSlugToEntry.values());
  // Stable sort by English title
  practices.sort((a, b) => a.en.localeCompare(b.en));
  for (const pr of practices) pr.services.sort((a, b) => a.en.localeCompare(b.en));

  const out = {
    counts: {
      practices: practices.length,
      services: practices.reduce((acc, p) => acc + p.services.length, 0),
    },
    practices,
  };

  const outPath = join(process.cwd(), "data", "compiled.services.i18n.json");
  await fs.writeFile(outPath, JSON.stringify(out, null, 2), "utf8");
  // eslint-disable-next-line no-console
  console.log(`Wrote ${out.counts.practices} practices and ${out.counts.services} services -> ${outPath}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


