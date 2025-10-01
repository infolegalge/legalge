import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { composeSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { Locale } from "@/i18n/locales";

const locales: Locale[] = ["ka", "en", "ru"];

function ensureUniqueSlug(base: string, slugSet: Set<string>, locale?: Locale) {
  let candidate = composeSlug(base, locale);
  if (!candidate) {
    candidate = `${Date.now()}`;
  }
  let finalSlug = candidate;
  let counter = 1;
  while (slugSet.has(finalSlug)) {
    finalSlug = `${candidate}-${counter++}`;
  }
  slugSet.add(finalSlug);
  return finalSlug;
}

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !role || !ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const baseTitle = String(formData.get("base_title") || "").trim();
    const baseSlugInput = String(formData.get("base_slug") || "").trim();
    if (!baseTitle) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const slugSet = new Set<string>();
    const baseSlug = ensureUniqueSlug(baseSlugInput || baseTitle, slugSet, "ka");
    const baseDescription = String(formData.get("base_description") || "");
    const heroImageUrl = String(formData.get("heroImageUrl") || "").trim() || null;
    const pageHeroImageUrl = String(formData.get("pageHeroImageUrl") || "").trim() || null;

    const translationsPayload = locales.map((locale) => {
      const title = String(formData.get(`title_${locale}`) || baseTitle).trim();
      const slugValue = String(formData.get(`slug_${locale}`) || "").trim();
      const slug = ensureUniqueSlug(slugValue || title || baseTitle, slugSet, locale);
      return {
        locale,
        title,
        slug,
        description: String(formData.get(`description_${locale}`) || "") || undefined,
        metaTitle: String(formData.get(`metaTitle_${locale}`) || "").trim() || undefined,
        metaDescription: String(formData.get(`metaDescription_${locale}`) || "").trim() || undefined,
        ogTitle: String(formData.get(`ogTitle_${locale}`) || "").trim() || undefined,
        ogDescription: String(formData.get(`ogDescription_${locale}`) || "").trim() || undefined,
        heroImageAlt: String(formData.get(`heroImageAlt_${locale}`) || "").trim() || undefined,
        pageHeroImageAlt: String(formData.get(`pageHeroImageAlt_${locale}`) || "").trim() || undefined,
      };
    });

    const created = await prisma.practiceArea.create({
      data: {
        title: baseTitle,
        slug: baseSlug,
        description: baseDescription,
        heroImageUrl: heroImageUrl || undefined,
        pageHeroImageUrl: pageHeroImageUrl || undefined,
        translations: {
          create: translationsPayload,
        },
      },
      include: {
        translations: true,
      },
    });

    const adminLocale = String(formData.get("adminLocale") || "");

    locales.forEach((loc) => {
      revalidatePath(`/${loc}/practice`);
      const translation = created.translations.find((t) => t.locale === loc);
      const detailSlug = translation?.slug || created.slug;
      revalidatePath(`/${loc}/practice/${detailSlug}`);
    });
    revalidatePath(`/ka/practice/${created.slug}`);
    if (adminLocale) {
      revalidatePath(`/${adminLocale}/admin/practices`);
    }

    return NextResponse.json({ success: true, id: created.id });
  } catch (error) {
    console.error("Failed to create practice area", error);
    return NextResponse.json({ error: "Failed to create practice area" }, { status: 500 });
  }
}
