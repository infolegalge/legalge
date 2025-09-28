import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is super admin
    type AppUser = typeof session.user & {
      role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "SPECIALIST" | "AUTHOR";
    };
    const user = session.user as AppUser;
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get pending requests count
    const pendingCount = await prisma.request.count({
      where: {
        status: "PENDING"
      }
    });

    return NextResponse.json({ 
      pendingCount,
      totalCount: await prisma.request.count()
    });

  } catch (error) {
    console.error("Error fetching request counts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
