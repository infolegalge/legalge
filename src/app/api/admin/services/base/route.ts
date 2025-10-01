import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const id = String(formData.get("id") || "");
    const title = String(formData.get("title") || "").trim();
    const slug = String(formData.get("slug") || "").trim();
    const description = String(formData.get("description") || "").trim() || null;
    const practiceAreaId = String(formData.get("practiceAreaId") || "");
    const heroImageUrl = String(formData.get("heroImage") || "").trim() || null;
    const heroImageAlt = String(formData.get("heroImageAlt") || "").trim() || null;

    if (!id || !title || !slug || !practiceAreaId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await prisma.service.update({
      where: { id },
      data: {
        title,
        slug,
        description: description || undefined,
        practiceAreaId,
        heroImageUrl: heroImageUrl || undefined,
        heroImageAlt: heroImageAlt || undefined,
      },
    });

    // Revalidate relevant paths
    const locales = ["ka", "en", "ru"];
    for (const locale of locales) {
      revalidatePath(`/${locale}/services/${slug}`);
      revalidatePath(`/${locale}/practice`);
    }
    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Service base updated successfully" });
  } catch (error) {
    console.error("Error updating service base:", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}
