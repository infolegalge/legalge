import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";

const filePath = "/Users/doc/Documents/01.WebppAPPS/legal-ge/legalge/data/Practice-areas/GEO.xlsx";

function toRows(sheet: XLSX.WorkSheet): any[][] {
  return XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" }) as any[][];
}

function isText(val: unknown): boolean {
  if (typeof val === "string") return val.trim().length > 0;
  const s = String(val ?? "").trim();
  return s.length > 0 && !/^\d+[\.,\d]*$/.test(s);
}

function main() {
  const buf = readFileSync(filePath);
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = toRows(sheet);
  const header = rows[0] || [];

  const stats = [] as Array<{ col: number; header: string; unique: number; nonEmpty: number }>;
  for (let c = 0; c < header.length; c++) {
    const seen = new Set<string>();
    let nonEmpty = 0;
    for (let r = 1; r < rows.length; r++) {
      const v = rows[r]?.[c];
      if (!isText(v)) continue;
      nonEmpty++;
      seen.add(String(v).trim());
    }
    stats.push({ col: c, header: String(header[c] || ""), unique: seen.size, nonEmpty });
  }

  // Heuristic: practice column has relatively low unique count but many non-empty rows
  const totalRows = Math.max(rows.length - 1, 1);
  const ranked = stats
    .filter((s) => s.unique > 0)
    .map((s) => ({ ...s, score: s.unique / totalRows }))
    .sort((a, b) => a.score - b.score || b.nonEmpty - a.nonEmpty);
  const practiceCol = ranked[0]?.col ?? 0;
  const practiceHeader = String(header[practiceCol] || "").trim();

  const practicesOrdered: string[] = [];
  const seenPractice = new Set<string>();
  for (let r = 1; r < rows.length; r++) {
    const v = String(rows[r]?.[practiceCol] || "").trim();
    if (!v || seenPractice.has(v)) continue;
    seenPractice.add(v);
    practicesOrdered.push(v);
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ sheetName, practiceHeader, count: practicesOrdered.length, practices: practicesOrdered }, null, 2));
}

main();


