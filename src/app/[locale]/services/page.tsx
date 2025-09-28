import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  return { title: "Services", description: "All legal services" };
}

export default async function ServicesIndex({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const all = await prisma.service.findMany({ include: { translations: true }, orderBy: { title: "asc" } });
  const services = all.map((s) => {
    const t = s.translations.find((x) => x.locale === locale);
    return { slug: t?.slug || s.slug, title: t?.title || s.title };
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold">Services</h1>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Card key={s.slug} className="hover:bg-muted/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-base">
                <Link href={`/${locale}/services/${s.slug}`} className="hover:underline">
                  {s.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </div>
  );
}


