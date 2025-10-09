import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = (searchParams.get("locale") || "ka") as Locale;
  const take = Number(searchParams.get("take") || 4);

  try {
    const services = await prisma.service.findMany({
      take,
      orderBy: { updatedAt: "desc" },
      include: {
        translations: true,
        practiceArea: { include: { translations: true } },
      },
    });

    const localized = services.map((service) => {
      const translation = service.translations.find((t) => t.locale === locale) ?? service.translations.find((t) => t.locale === "ka");
      const practiceTranslation = service.practiceArea.translations.find((t) => t.locale === locale) ?? service.practiceArea.translations.find((t) => t.locale === "ka");

      return {
        id: service.id,
        title: translation?.title ?? service.title,
        slug: translation?.slug ?? service.slug,
        practice: {
          title: practiceTranslation?.title ?? service.practiceArea.title,
          slug: practiceTranslation?.slug ?? service.practiceArea.slug,
        },
        heroImageUrl: service.heroImageUrl ?? service.practiceArea.heroImageUrl ?? null,
        heroImageAlt: translation?.heroImageAlt ?? service.heroImageAlt ?? practiceTranslation?.heroImageAlt ?? null,
      } satisfies {
        id: string;
        title: string;
        slug: string;
        practice: { title: string; slug: string };
        heroImageUrl: string | null;
        heroImageAlt: string | null;
      };
    });

    return NextResponse.json(localized, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[services.featured]", error);
    return NextResponse.json([], { status: 200 });
  }
}

