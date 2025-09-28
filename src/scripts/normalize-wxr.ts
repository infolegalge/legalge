/*
  Normalize WXR-derived JSON into headless data:
  - Companies (from rtcl_listing)
  - Lawyers (from team)
  - PracticeAreas (from rtcl_category parent term)
  - Services (rtcl_category children)
  Relations:
  - Company -> lawyers[] (by matching mentions in content or later manual mapping placeholder)
  - Service -> lawyers[] (by tag/category nicename matches)
  - PracticeArea -> services[] (by parent term)
  - Company -> services[] (union of its lawyers' services)
  - Lawyer -> services[]

  Run: npx tsx src/scripts/normalize-wxr.ts data/legal
*/
import { promises as fs } from "node:fs";
import { join } from "node:path";

type SimpleItem = {
  id: string;
  title: string;
  slug: string;
  link: string;
  content: string;
  excerpt: string;
  categories: Array<{ domain: string; nicename: string; name: string }>;
};

type Term = { id: string; taxonomy: string; slug: string; name: string; parent: string };

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await fs.readFile(path, "utf8")) as T;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function main() {
  const dataDir = process.argv[2] ?? "data";
  await readJson<SimpleItem[]>(join(dataDir, "legal.page.json")).catch(() => []);
  await readJson<SimpleItem[]>(join(dataDir, "legal.post.json")).catch(() => []);
  const listings = await readJson<SimpleItem[]>(join(dataDir, "legal.rtcl_listing.json")).catch(() => []);
  const team = await readJson<SimpleItem[]>(join(dataDir, "legal.team.json")).catch(() => []);
  const terms = await readJson<Term[]>(join(dataDir, "legal.terms.json")).catch(() => []);

  // Build rtcl_category hierarchy -> PracticeAreas (parents) and Services (children)
  const rtclTerms = terms.filter((t) => t.taxonomy === "rtcl_category");
  const byId = new Map(rtclTerms.map((t) => [t.id, t] as const));
  const childrenOf = new Map<string, Term[]>();
  for (const t of rtclTerms) {
    const p = t.parent || "";
    if (!childrenOf.has(p)) childrenOf.set(p, []);
    childrenOf.get(p)!.push(t);
  }
  const rootAreas = childrenOf.get("") ?? [];

  const practiceAreas = rootAreas.map((pa) => ({ id: pa.id, slug: pa.slug || slugify(pa.name), title: pa.name }));
  const services = rtclTerms
    .filter((t) => t.parent && byId.has(t.parent))
    .map((s) => ({ id: s.id, slug: s.slug || slugify(s.name), title: s.name, parentId: s.parent }));

  // Map lawyers from team
  const lawyers = team.map((l) => ({
    id: l.id,
    slug: l.slug || slugify(l.title),
    name: l.title,
    services: [] as string[],
    companyId: "",
  }));

  // Naive service attachment: match category nicenames to service slugs
  const serviceSlugSet = new Set(services.map((s) => s.slug));
  function matchServicesFromCategories(cats: SimpleItem["categories"]) {
    const matches = new Set<string>();
    for (const c of cats) {
      const s = slugify(c.name || c.nicename || "");
      if (serviceSlugSet.has(s)) matches.add(s);
    }
    return [...matches];
  }

  // Companies from rtcl_listing
  const companies = listings.map((c) => ({
    id: c.id,
    slug: c.slug || slugify(c.title),
    name: c.title,
    services: matchServicesFromCategories(c.categories),
    lawyers: [] as string[],
  }));

  // Attach lawyer services by scanning categories too (if present). If not, later refine via content or manual mapping.
  for (const l of lawyers) {
    // Attempt to derive from categories (if exported). If empty, leave [] for now.
    const src = team.find((t) => t.id === l.id);
    const matched = src ? matchServicesFromCategories(src.categories) : [];
    l.services = matched;
  }

  // Company -> lawyers: heuristic match by company name mention in team content; fallback none.
  for (const comp of companies) {
    const compName = comp.name.toLowerCase();
    for (const l of lawyers) {
      const src = team.find((t) => t.id === l.id);
      const text = (src?.content || "").toLowerCase();
      if (text.includes(compName)) {
        comp.lawyers.push(l.id);
        l.companyId = comp.id;
      }
    }
  }

  // Company services = union of lawyer services
  for (const comp of companies) {
    const set = new Set(comp.services);
    for (const lid of comp.lawyers) {
      const l = lawyers.find((x) => x.id === lid);
      l?.services.forEach((s) => set.add(s));
    }
    comp.services = [...set];
  }

  // PracticeArea -> services[]
  const areaServices = practiceAreas.map((pa) => ({
    id: pa.id,
    slug: pa.slug,
    title: pa.title,
    services: services.filter((s) => s.parentId === pa.id).map((s) => s.slug),
  }));

  await fs.writeFile(join(dataDir, "normalized.practice-areas.json"), JSON.stringify(areaServices, null, 2));
  await fs.writeFile(join(dataDir, "normalized.services.json"), JSON.stringify(services, null, 2));
  await fs.writeFile(join(dataDir, "normalized.lawyers.json"), JSON.stringify(lawyers, null, 2));
  await fs.writeFile(join(dataDir, "normalized.companies.json"), JSON.stringify(companies, null, 2));

  console.log("Normalized files written to", dataDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


