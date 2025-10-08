import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { fetchLawyer, fetchLawyers } from "@/lib/wp";
import RichText from "@/components/RichText";
import Image from "next/image";
import { createLocaleRouteMetadata } from "@/lib/metadata";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const items = await fetchLawyers();
    return items.map((i) => ({ slug: i.slug }));
  } catch {
    return [] as Array<{ slug: string }>;
  }
}

export async function generateMetadata({ params }: { params: { locale: Locale; slug: string } }): Promise<Metadata> {
  try {
    const item = await fetchLawyer(params.slug);
    if (!item) return createLocaleRouteMetadata(params.locale, ["lawyers", params.slug], { title: "Lawyer" });
    const title = `${item.name} – Lawyer`;
    const description = item.role ? `${item.role} providing legal guidance in Georgia.` : `Profile of ${item.name}, legal counsel in Georgia.`;
    return createLocaleRouteMetadata(params.locale, ["lawyers", params.slug], {
      title,
      description,
      openGraph: { title, description },
    });
  } catch {
    return createLocaleRouteMetadata(params.locale, ["lawyers", params.slug], { title: "Lawyer" });
  }
}

export default async function LawyerDetail({
  params,
}: {
  params: { locale: Locale; slug: string };
}) {
  setRequestLocale(params.locale);
  const item = await fetchLawyer(params.slug);
  if (!item) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-start gap-6">
        {item.avatar?.src ? (
          <Image src={item.avatar.src} alt={item.avatar.alt} width={128} height={128} className="rounded" />
        ) : null}
        <div>
          <h1 className="text-3xl font-semibold">{item.name}</h1>
          {item.role ? <div className="text-foreground/70">{item.role}</div> : null}
        </div>
      </div>
      <div className="mt-6">
        <RichText html={item.bio ?? ""} />
      </div>
    </div>
  );
}


