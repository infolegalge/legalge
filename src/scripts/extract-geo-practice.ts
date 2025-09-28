import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";

const filePath = "/Users/doc/Documents/01.WebppAPPS/legal-ge/legalge/data/Practice-areas/GEO.xlsx";

function toRows(sheet: XLSX.WorkSheet): any[][] {
  return XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" }) as any[][];
}

function pickLikelyNameColumn(rows: any[][]): number {
  const colCounts = new Map<number, number>();
  for (let c = 0; c < (rows[0]?.length ?? 0); c++) {
    const values = new Set<string>();
    for (let r = 1; r < rows.length; r++) {
      const raw = rows[r]?.[c];
      const val = typeof raw === "string" ? raw.trim() : String(raw || "").trim();
      if (!val) continue;
      // Skip obvious numeric-like strings
      if (/^\d+[\.,\d]*$/.test(val)) continue;
      values.add(val);
    }
    colCounts.set(c, values.size);
  }
  const sorted = [...colCounts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? 0;
}

function main() {
  const buf = readFileSync(filePath);
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = toRows(sheet);

  const nameCol = pickLikelyNameColumn(rows);
  const header = String(rows[0]?.[nameCol] || "").trim();
  const values: string[] = [];
  const set = new Set<string>();
  for (let r = 1; r < rows.length; r++) {
    const val = String(rows[r]?.[nameCol] || "").trim();
    if (!val) continue;
    if (set.has(val)) continue;
    set.add(val);
    values.push(val);
  }

  // Print header, count, and values
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ sheetName, header, count: values.length, values }, null, 2));
}

main();


