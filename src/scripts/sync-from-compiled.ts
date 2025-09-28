import prisma from "@/lib/prisma";
import { promises as fs } from "node:fs";
import { join } from "node:path";

type ServiceEntry = { slug: string; en: string; ka: string; ru: string };
type PracticeEntry = { slug: string; en: string; ka: string; ru: string; services: ServiceEntry[] };
type Compiled = { counts: { practices: number; services: number }; practices: PracticeEntry[] };

async function main() {
  const path = join(process.cwd(), "data", "compiled.services.i18n.json");
  const raw = await fs.readFile(path, "utf8");
  const compiled = JSON.parse(raw) as Compiled;

  // Keep existing hero image urls, alts if slugs match existing
  const existingPractices = await prisma.practiceArea.findMany({ include: { translations: true } });
  const existingServices = await prisma.service.findMany({ include: { translations: true, lawyers: { select: { id: true } } } });
  const practiceSlugToHero = new Map<string, { heroImageUrl: string | null; heroImageAltByLocale: Record<string, string | null> }>();
  for (const p of existingPractices) {
    const heroImageAltByLocale: Record<string, string | null> = {};
    for (const t of p.translations) heroImageAltByLocale[t.locale] = t.heroImageAlt ?? null;
    practiceSlugToHero.set(p.slug, { heroImageUrl: p.heroImageUrl ?? null, heroImageAltByLocale });
  }
  const serviceSlugToLawyerIds = new Map<string, string[]>();
  for (const s of existingServices) {
    serviceSlugToLawyerIds.set(s.slug, s.lawyers.map((l) => l.id));
  }
  const usedServiceSlugs = new Set<string>(existingServices.map((s) => s.slug));

  // Clear translations first to avoid fk constraints, then services and practices
  await prisma.serviceTranslation.deleteMany({});
  await prisma.practiceAreaTranslation.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.practiceArea.deleteMany({});

  // Insert practices
  for (const pr of compiled.practices) {
    const hero = practiceSlugToHero.get(pr.slug);
    const created = await prisma.practiceArea.create({
      data: {
        slug: pr.slug,
        title: pr.en,
        description: null,
        heroImageUrl: hero?.heroImageUrl ?? null,
      },
    });
    // translations
    await prisma.practiceAreaTranslation.createMany({
      data: [
        { practiceAreaId: created.id, locale: "en" as any, title: pr.en, slug: pr.slug, description: null, heroImageAlt: hero?.heroImageAltByLocale?.["en"] ?? null },
        { practiceAreaId: created.id, locale: "ka" as any, title: pr.ka, slug: pr.slug, description: null, heroImageAlt: hero?.heroImageAltByLocale?.["ka"] ?? null },
        { practiceAreaId: created.id, locale: "ru" as any, title: pr.ru, slug: pr.slug, description: null, heroImageAlt: hero?.heroImageAltByLocale?.["ru"] ?? null },
      ],
    });

    // Insert services under this practice
    for (const s of pr.services) {
      let uniqueSlug = s.slug;
      if (usedServiceSlugs.has(uniqueSlug)) {
        uniqueSlug = `${uniqueSlug}-${pr.slug}`;
      }
      usedServiceSlugs.add(uniqueSlug);
      const createdService = await prisma.service.create({
        data: {
          slug: uniqueSlug,
          title: s.en,
          description: null,
          practiceAreaId: created.id,
        },
      });
      await prisma.serviceTranslation.createMany({
        data: [
          { serviceId: createdService.id, locale: "en" as any, title: s.en, slug: uniqueSlug, description: null },
          { serviceId: createdService.id, locale: "ka" as any, title: s.ka, slug: uniqueSlug, description: null },
          { serviceId: createdService.id, locale: "ru" as any, title: s.ru, slug: uniqueSlug, description: null },
        ],
      });
      const lawyerIds = serviceSlugToLawyerIds.get(s.slug);
      if (lawyerIds && lawyerIds.length > 0) {
        await prisma.service.update({
          where: { id: createdService.id },
          data: { lawyers: { connect: lawyerIds.map((id) => ({ id })) } },
        });
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Synced ${compiled.practices.length} practices and ${compiled.practices.reduce((a, p) => a + p.services.length, 0)} services`);
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


