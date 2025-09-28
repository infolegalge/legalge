import { promises as fs } from "node:fs";
import { join } from "node:path";
import mammoth from "mammoth";

export type PracticeGeneral = { html: string; image?: string | null };

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function findFolderName(baseNames: string[], practiceTitle: string): string | null {
  const normalized = (s: string) => s.replace(/&/g, "&").replace(/\s+/g, " ").trim().toLowerCase();
  const target = normalized(practiceTitle);
  let best: string | null = null;
  let bestScore = -1;
  for (const name of baseNames) {
    const n = normalized(name.replace(/^\d+\.\s*/, ""));
    let score = 0;
    if (n === target) score = 3;
    else if (n.includes(target) || target.includes(n)) score = 2;
    else if (n.split(" ").some((w) => target.includes(w))) score = 1;
    if (score > bestScore) {
      best = name;
      bestScore = score;
    }
  }
  return best;
}

export async function loadPracticeGeneral(practiceSlug: string): Promise<PracticeGeneral | null> {
  const baseDir = join(process.cwd(), "data", "Practice-areas", "Service-texts");
  let entries: string[] = [];
  try {
    entries = await fs.readdir(baseDir);
  } catch {
    return null;
  }
  const title = titleFromSlug(practiceSlug);
  const folder = findFolderName(entries, title);
  if (!folder) return null;

  const folderPath = join(baseDir, folder);
  let files: string[] = [];
  try {
    files = await fs.readdir(folderPath);
  } catch {
    return null;
  }

  // Look for a docx at the root or a subfolder named "General"
  const generalDocx = files.find((f) => /general.*\.docx$/i.test(f)) || files.find((f) => /overview.*\.docx$/i.test(f));
  let docPath: string | null = null;
  if (generalDocx) {
    docPath = join(folderPath, generalDocx);
  } else {
    // search subfolders
    for (const f of files) {
      const sub = join(folderPath, f);
      try {
        const stat = await fs.stat(sub);
        if (stat.isDirectory()) {
          const subs = await fs.readdir(sub);
          const cand = subs.find((x) => /general|overview/i.test(x) && x.toLowerCase().endsWith(".docx"));
          if (cand) {
            docPath = join(sub, cand);
            break;
          }
        }
      } catch {}
    }
  }

  if (!docPath) return null;
  const buffer = await fs.readFile(docPath);
  const { value: html } = await mammoth.convertToHtml({ buffer });
  // naive image lookup
  const image = files.find((f) => /\.(png|jpe?g|webp)$/i.test(f)) || null;
  return { html, image };
}


