import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const specialistId = String(formData.get("specialistId"));
    const selectedServices = (formData.getAll("services") as string[]) || [];

    // Update the specialist's services (this automatically handles the bidirectional relationship)
    await prisma.specialistProfile.update({
      where: { id: specialistId },
      data: {
        services: {
          set: [], // Disconnect all existing services
          connect: selectedServices.map((serviceId) => ({ id: serviceId })), // Connect selected services
        },
      },
    });

    // Revalidate paths for affected locales and specialists
    const locales = ["en", "ka", "ru"]; 
    for (const locale of locales) {
      revalidatePath(`/${locale}/specialists`);
      revalidatePath(`/${locale}/admin/specialists`);
      // Also revalidate service pages that might be affected
      for (const serviceId of selectedServices) {
        revalidatePath(`/${locale}/services/${serviceId}`);
      }
    }
    revalidatePath("/"); 

    return NextResponse.json({ success: true, message: "Services updated successfully!" });
  } catch (error: any) {
    console.error("Error assigning services to specialist:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to assign services" }, { status: 500 });
  }
}
