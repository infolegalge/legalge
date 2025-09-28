import { PrismaClient, type Locale } from '@prisma/client';
import { makeSlug } from '@/lib/utils';

const prisma = new PrismaClient();

type LocaleCode = 'ka' | 'en' | 'ru';
const locales: LocaleCode[] = ['ka', 'en', 'ru'];

async function ensureUniqueBaseSlug(candidate: string, id: string): Promise<string> {
  let slug = candidate || 'service';
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.service.findFirst({ where: { slug, NOT: { id } }, select: { id: true } });
    if (!exists) return slug;
    suffix += 1;
    slug = `${candidate}-${suffix}`;
  }
}

async function ensureUniqueTranslationSlug(locale: Locale, candidate: string, id: string): Promise<string> {
  let slug = candidate || 'service';
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.serviceTranslation.findFirst({ where: { locale, slug, NOT: { id } }, select: { id: true } });
    if (!exists) return slug;
    suffix += 1;
    slug = `${candidate}-${suffix}`;
  }
}

async function validateResolvable(locale: LocaleCode, slug: string): Promise<boolean> {
  const hit = await prisma.service.findFirst({
    where: {
      OR: [
        { slug },
        { translations: { some: { locale, slug } } },
      ],
    },
    select: { id: true },
  });
  return !!hit;
}

async function auditAndFix() {
  const services = await prisma.service.findMany({ include: { translations: true } });

  const report: string[] = [];
  let fixes = 0;
  let unresolved = 0;

  for (const s of services) {
    // Fix base slug by autoslug(title)
    const baseCandidate = makeSlug(s.title);
    if (baseCandidate && baseCandidate !== s.slug) {
      const unique = await ensureUniqueBaseSlug(baseCandidate, s.id);
      await prisma.service.update({ where: { id: s.id }, data: { slug: unique } });
      report.push(`Base slug fixed: ${s.slug} -> ${unique} [${s.title}]`);
      fixes++;
      s.slug = unique;
    }

    // Fix translation slugs by autoslug(title, locale)
    for (const t of s.translations) {
      if (!t.title) continue;
      const candidate = makeSlug(t.title, t.locale as Locale);
      if (candidate && candidate !== t.slug) {
        const unique = await ensureUniqueTranslationSlug(t.locale as Locale, candidate, t.id);
        await prisma.serviceTranslation.update({ where: { id: t.id }, data: { slug: unique } });
        report.push(`Translation slug fixed [${t.locale}]: ${t.slug} -> ${unique} [${t.title}]`);
        fixes++;
        t.slug = unique as any;
      }
    }

    // Validate all locale entry points resolve
    for (const loc of locales) {
      const t = s.translations.find((x) => x.locale === loc);
      const slug = t?.slug || s.slug;
      const ok = await validateResolvable(loc, slug);
      if (!ok) {
        unresolved++;
        report.push(`Unresolved link: /${loc}/services/${slug} (service: ${s.title})`);
      }
    }
  }

  // Print concise summary
  console.log(`Service slug audit complete. fixes=${fixes}, unresolved=${unresolved}, total=${services.length}`);
  if (report.length) {
    console.log('\nDetailed report:');
    for (const line of report) console.log('-', line);
  }
}

async function main() {
  await auditAndFix();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





