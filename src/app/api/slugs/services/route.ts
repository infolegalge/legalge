import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawSlug = searchParams.get("slug") || "";
    const from = (searchParams.get("from") || "") as Locale;
    const to = (searchParams.get("to") || "") as Locale;

    if (!rawSlug || !to) {
      return NextResponse.json({ error: "Missing required params" }, { status: 400 });
    }

    let slug = rawSlug;
    try {
      slug = decodeURIComponent(rawSlug);
    } catch {}

    const service = await prisma.service.findFirst({
      where: {
        OR: [
          { slug },
          { translations: { some: { slug } } },
        ],
      },
      include: { translations: true },
    });

    if (!service) {
      return NextResponse.json({ slug: slug });
    }

    const target = service.translations.find((t) => t.locale === to);
    const ka = service.translations.find((t) => t.locale === ("ka" as Locale));
    const mappedSlug = target?.slug || ka?.slug || service.slug;

    return NextResponse.json({ slug: mappedSlug });
  } catch (err) {
    return NextResponse.json({ error: "Failed to translate slug" }, { status: 500 });
  }
}



