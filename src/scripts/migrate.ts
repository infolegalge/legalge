/*
  Fetch WordPress REST content and write JSON files for local dev.
  Run with: npx tsx src/scripts/migrate.ts
*/
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fetchPracticeAreas, fetchLawyers, fetchPosts } from "@/lib/wp";

async function main() {
  const outDir = join(process.cwd(), "data");
  await mkdir(outDir, { recursive: true });

  const [areas, lawyers, posts] = await Promise.all([
    fetchPracticeAreas(),
    fetchLawyers(),
    fetchPosts(),
  ]);

  await Promise.all([
    writeFile(join(outDir, "practice-areas.json"), JSON.stringify(areas, null, 2)),
    writeFile(join(outDir, "lawyers.json"), JSON.stringify(lawyers, null, 2)),
    writeFile(join(outDir, "posts.json"), JSON.stringify(posts, null, 2)),
  ]);

  console.log("Wrote data JSON files to:", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


