import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const id = String(formData.get("id"));
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim();
    const role = String(formData.get("role") || "").trim() || null;
    const bio = String(formData.get("bio") || "").trim() || null;
    const avatarUrl = String(formData.get("avatarUrl") || "").trim() || null;
    const contactEmail = String(formData.get("contactEmail") || "").trim() || null;
    const contactPhone = String(formData.get("contactPhone") || "").trim() || null;
    const city = String(formData.get("city") || "").trim() || null;

    await prisma.specialistProfile.update({ 
      where: { id }, 
      data: { 
        name, 
        slug, 
        role,
        bio,
        avatarUrl,
        contactEmail,
        contactPhone,
        city,
      } 
    });

    // Revalidate paths for affected locales and specialists
    const locales = ["en", "ka", "ru"]; 
    for (const locale of locales) {
      revalidatePath(`/${locale}/specialists/${slug}`);
      revalidatePath(`/${locale}/admin/specialists`);
    }
    revalidatePath("/"); 

    return NextResponse.json({ success: true, message: "Basic information updated successfully!" });
  } catch (error: any) {
    console.error("Error updating specialist basic info:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update specialist" }, { status: 500 });
  }
}
