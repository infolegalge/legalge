import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id },
      include: { translations: true, specialists: true }
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Delete related data first (due to foreign key constraints)
    await prisma.serviceTranslation.deleteMany({
      where: { serviceId: id }
    });

    // Disconnect specialists from this service
    await prisma.service.update({
      where: { id },
      data: {
        specialists: {
          set: []
        }
      }
    });

    // Delete the service
    await prisma.service.delete({
      where: { id }
    });

    // Revalidate relevant paths
    const locales = ["ka", "en", "ru"];
    for (const locale of locales) {
      revalidatePath(`/${locale}/services`);
      revalidatePath(`/${locale}/practice`);
      revalidatePath(`/${locale}/admin/services`);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Service "${service.title}" has been deleted successfully` 
    });

  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
