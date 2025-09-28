import prisma from "@/lib/prisma";

async function main() {
  const p = await prisma.practiceArea.findFirst({
    where: { slug: "legallaunch-for-startups" },
    include: { translations: true },
  });
  console.log({ base: { slug: p?.slug, heroImageUrl: p?.heroImageUrl }, translations: p?.translations.map(t => ({ locale: t.locale, slug: t.slug, title: t.title, heroImageAlt: t.heroImageAlt })) });
}

main().catch((e) => { console.error(e); process.exit(1); });


