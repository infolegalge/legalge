import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Locale } from "@/i18n/locales";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const serviceId = String(formData.get("serviceId") || "");
    const locale = String(formData.get("locale") || "") as Locale;
    const title = String(formData.get("t_title") || "").trim();
    const slug = String(formData.get("t_slug") || "").trim();
    const description = String(formData.get("t_description") || "").trim() || null;
    const metaTitle = String(formData.get("t_meta_title") || "").trim() || null;
    const metaDescription = String(formData.get("t_meta_description") || "").trim() || null;

    // Debug: Log the description being saved
    console.log("Service translation save - Description:", description);

    if (!serviceId || !locale || !title || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get base service for fallbacks
    const baseService = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { title: true, slug: true, description: true },
    });

    const nextTitle = title || baseService?.title || "";
    const nextSlug = slug || baseService?.slug || `${serviceId}-${locale}`;

    await prisma.serviceTranslation.upsert({
      where: { serviceId_locale: { serviceId, locale } },
      create: {
        serviceId,
        locale,
        title: nextTitle,
        slug: nextSlug,
        description: description || undefined,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
      },
      update: {
        title: nextTitle,
        slug: nextSlug,
        description: description || undefined,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
      },
    });

    // Revalidate relevant paths
    revalidatePath(`/${locale}/services/${nextSlug}`);
    revalidatePath(`/${locale}/practice`);
    revalidatePath("/");

    return NextResponse.json({ success: true, message: `Translation for ${locale.toUpperCase()} updated successfully` });
  } catch (error) {
    console.error("Error updating service translation:", error);
    return NextResponse.json({ error: "Failed to update translation" }, { status: 500 });
  }
}
