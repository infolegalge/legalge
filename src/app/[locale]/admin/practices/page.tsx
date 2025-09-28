import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import Link from "next/link";

export default async function PracticesAdmin({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const items = await prisma.practiceArea.findMany({ include: { translations: true } });
  const orderedSlugs = [
    "migration-to-georgia",
    "labor-law",
    "legallaunch-for-startups",
    "crypto-law",
    "corporate-governance-and-business-compliance",
    "licenses",
    "permits",
    "tax-and-accounting",
    "banks-and-finances",
    "ip-trademark-inventions",
    "personal-data-protection",
    "property-law",
    "honor-reputation-protection",
    "international-law",
    "litigation-and-dispute-resolution",
    "family-law",
    "criminal-defense-and-white-collar-crime",
    "environmental-and-energy-law",
    "healthcare-and-pharmaceutical-law",
    "sports-media-entertainment-law",
    "aviation-and-maritime-law",
    "technology-and-ai-law",
    "education-law",
    "non-profit-and-ngo-law",
    "military-and-national-security-law",
  ];
  const orderIndex = new Map<string, number>(orderedSlugs.map((s, i) => [s, i]));
  items.sort((a, b) => {
    const ai = orderIndex.has(a.slug) ? (orderIndex.get(a.slug) as number) : Number.MAX_SAFE_INTEGER;
    const bi = orderIndex.has(b.slug) ? (orderIndex.get(b.slug) as number) : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.title.localeCompare(b.title);
  });
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Practices</h2>
        <Link href={`/${locale}/admin/practices/new`} className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground">
          New Practice
        </Link>
      </div>
      <table className="w-full table-fixed border text-sm">
        <thead>
          <tr className="bg-muted text-left">
            <th className="w-1/3 p-2">Title</th>
            <th className="w-1/3 p-2">Slugs</th>
            <th className="w-1/3 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.title}</td>
              <td className="p-2">
                <div className="flex flex-wrap gap-1">
                  <span className="rounded bg-muted px-1.5 py-0.5">base:{p.slug}</span>
                  {p.translations.map((t) => (
                    <span key={t.id} className="rounded bg-muted px-1.5 py-0.5">
                      {t.locale}:{t.slug}
                    </span>
                  ))}
                </div>
              </td>
              <td className="p-2">
                <Link href={`/${locale}/admin/practices/${p.id}`} className="rounded border px-2 py-1 hover:bg-muted">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


