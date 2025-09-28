/*
  Improve a WordPress WXR XML: pretty-print and export JSON for core types.
  Usage: npx tsx src/scripts/improve-xml.ts data/legal.xml
*/
import { promises as fs } from "node:fs";
import { basename, dirname, join } from "node:path";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

async function main() {
  const input = process.argv[2] ?? "data/legal.xml";
  const xml = await fs.readFile(input, "utf8");

  // Detect WXR via <rss ... xmlns:wp>
  const isWXR = /xmlns:wp=/.test(xml) && /<rss\b/.test(xml);
  if (!isWXR) {
    throw new Error("This XML does not look like a WordPress WXR export.");
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    allowBooleanAttributes: true,
  });
  const doc = parser.parse(xml);

  // Pretty print
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    suppressEmptyNode: true,
  });
  const pretty = builder.build(doc);
  const outDir = dirname(input);
  const base = basename(input, ".xml");
  await fs.writeFile(join(outDir, `${base}.pretty.xml`), pretty, "utf8");

  // Extract channel items
  const channel = doc?.rss?.channel;
  const rawItems = Array.isArray(channel?.item) ? channel.item : channel?.item ? [channel.item] : [];

  type Item = Record<string, unknown> & {
    title?: string | { [k: string]: unknown };
    link?: string;
    "dc:creator"?: string;
    "content:encoded"?: string;
    "excerpt:encoded"?: string;
    "wp:post_type"?: string;
    "wp:post_name"?: string; // slug
    "wp:post_id"?: string | number;
    "wp:post_date"?: string | number;
    category?:
      | Array<{ "@_domain"?: string; "@_nicename"?: string; "#text"?: string }>
      | { "@_domain"?: string; "@_nicename"?: string; "#text"?: string };
  };

  const items: Item[] = rawItems as Item[];

  // Group by post_type
  const byType: Record<string, Item[]> = {};
  for (const it of items) {
    const type = String(it["wp:post_type"] ?? "unknown");
    if (!byType[type]) byType[type] = [];
    byType[type].push(it);
  }

  // Write JSON per type
  for (const [type, list] of Object.entries(byType)) {
    await fs.writeFile(
      join(outDir, `${base}.${type}.json`),
      JSON.stringify(
        list.map((i) => ({
          id: String(i["wp:post_id"] ?? ""),
          title: typeof i.title === "string" ? i.title : "",
          slug: i["wp:post_name"] ?? "",
          link: i.link ?? "",
          content: i["content:encoded"] ?? "",
          excerpt: i["excerpt:encoded"] ?? "",
          creator: i["dc:creator"] ?? "",
          date: i["wp:post_date"] ?? "",
          categories: (Array.isArray(i.category) ? i.category : i.category ? [i.category] : [])
            .filter(Boolean)
            .map((c) => ({ domain: c["@_domain"] ?? "", nicename: c["@_nicename"] ?? "", name: c["#text"] ?? "" })),
        })),
        null,
        2,
      ),
      "utf8",
    );
  }

  // Extract terms
  type Term = {
    id: string;
    taxonomy: string;
    slug: string;
    name: string;
    parent: string;
  };
  const termsSrc = Array.isArray(channel?.["wp:term"]) ? channel["wp:term"] : channel?.["wp:term"] ? [channel["wp:term"]] : [];
  const terms: Term[] = termsSrc.map((t: any) => ({
    id: String(t["wp:term_id"] ?? ""),
    taxonomy: String(t["wp:term_taxonomy"] ?? ""),
    slug: String(t["wp:term_slug"] ?? ""),
    name: String(t["wp:term_name"] ?? ""),
    parent: String(t["wp:term_parent"] ?? ""),
  }));
  await fs.writeFile(join(outDir, `${base}.terms.json`), JSON.stringify(terms, null, 2), "utf8");

  console.log(
    "Wrote:",
    join(outDir, `${base}.pretty.xml`),
    "and",
    Object.keys(byType).length,
    "post-type JSON files + terms.json",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


