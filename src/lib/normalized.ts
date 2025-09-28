import { promises as fs } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const CompanySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  services: z.array(z.string()),
  lawyers: z.array(z.string()),
});
export type Company = z.infer<typeof CompanySchema>;

const LawyerSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  services: z.array(z.string()),
  companyId: z.string(),
});
export type Lawyer = z.infer<typeof LawyerSchema>;

const PracticeAreaSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  services: z.array(z.string()),
});
export type PracticeArea = z.infer<typeof PracticeAreaSchema>;

const ServiceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  parentId: z.string(),
});
export type Service = z.infer<typeof ServiceSchema>;

const NewsSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  excerpt: z.string(),
  creator: z.string().optional(),
  date: z.string().optional(),
  categories: z.array(z.object({ domain: z.string(), nicename: z.string(), name: z.string() })),
  authorType: z.enum(["company", "lawyer", "user"]).default("user"),
  authorRef: z.string().optional(),
});
export type News = z.infer<typeof NewsSchema>;

async function readJson<T>(file: string, schema: z.ZodType<T>): Promise<T> {
  const path = join(process.cwd(), "data", file);
  const raw = await fs.readFile(path, "utf8");
  const json = JSON.parse(raw);
  return schema.parse(json);
}

export async function getCompanies(): Promise<Company[]> {
  const arr = await readJson("normalized.companies.json", z.array(CompanySchema));
  return arr;
}

export async function getLawyers(): Promise<Lawyer[]> {
  const arr = await readJson("normalized.lawyers.json", z.array(LawyerSchema));
  return arr;
}

export async function getPracticeAreas(): Promise<PracticeArea[]> {
  const arr = await readJson("normalized.practice-areas.json", z.array(PracticeAreaSchema));
  return arr;
}

export async function getServices(): Promise<Service[]> {
  const arr = await readJson("normalized.services.json", z.array(ServiceSchema));
  return arr;
}

export async function getNewsRaw(): Promise<News[]> {
  const arr = await readJson("legal.post.json", z.array(NewsSchema.omit({ authorType: true, authorRef: true } as any)) as any);
  return arr as unknown as News[];
}

export async function getNewsResolved(): Promise<News[]> {
  const [news, companies, lawyers] = await Promise.all([
    readJson("legal.post.json", z.array(NewsSchema.omit({ authorType: true, authorRef: true } as any)) as any),
    getCompanies(),
    getLawyers(),
  ]);
  return (news as any[]).map((n) => {
    const text = (n.content as string).toLowerCase();
    let authorType: "company" | "lawyer" | "user" = "user";
    let authorRef: string | undefined = undefined;
    const comp = companies.find((c) => text.includes(c.name.toLowerCase()));
    if (comp) {
      authorType = "company";
      authorRef = comp.id;
    } else {
      const lw = lawyers.find((l) => text.includes(l.name.toLowerCase()));
      if (lw) {
        authorType = "lawyer";
        authorRef = lw.id;
      }
    }
    return { ...n, authorType, authorRef } as News;
  });
}

export function lawyersForService(lawyers: Lawyer[], serviceSlug: string): Lawyer[] {
  return lawyers.filter((l) => l.services.includes(serviceSlug));
}

export function servicesForCompany(comp: Company, services: Service[]): Service[] {
  const set = new Set(comp.services);
  return services.filter((s) => set.has(s.slug));
}

export function servicesForLawyer(lawyer: Lawyer, services: Service[]): Service[] {
  const set = new Set(lawyer.services);
  return services.filter((s) => set.has(s.slug));
}


