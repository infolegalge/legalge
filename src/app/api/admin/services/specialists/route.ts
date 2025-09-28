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
    const serviceId = String(formData.get("serviceId") || "");
    const selectedSpecialists = formData.getAll("specialists") as string[];

    if (!serviceId) {
      return NextResponse.json({ error: "Missing service ID" }, { status: 400 });
    }

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        specialists: {
          set: [],
          connect: selectedSpecialists.map((id) => ({ id })),
        },
      },
    });

    // Revalidate relevant paths
    const locales = ["ka", "en", "ru"];
    for (const locale of locales) {
      revalidatePath(`/${locale}/services`);
      revalidatePath(`/${locale}/practice`);
    }
    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Specialists updated successfully" });
  } catch (error) {
    console.error("Error updating specialists:", error);
    return NextResponse.json({ error: "Failed to update specialists" }, { status: 500 });
  }
}
