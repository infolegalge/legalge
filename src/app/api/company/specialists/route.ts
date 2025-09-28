import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userRole = (session.user as any)?.role;
    let userCompanyId = (session.user as any)?.companyId as string | undefined;
    
    if (userRole !== 'COMPANY' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Get specialists based on user role
    let specialists;
    if (userRole === 'SUPER_ADMIN') {
      // Super admin can see all specialists
      specialists = await prisma.specialistProfile.findMany({
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
    } else {
      if (!userCompanyId && (session.user as any)?.email) {
        // Resolve company by DB user record fallback (companyId or companySlug)
        const dbUser = await prisma.user.findUnique({
          where: { id: (session.user as any).id },
          select: { companyId: true, companySlug: true as any },
        }) as any
        userCompanyId = dbUser?.companyId ?? userCompanyId
        if (!userCompanyId && dbUser?.companySlug) {
          const c = await prisma.company.findUnique({ where: { slug: dbUser.companySlug }, select: { id: true } })
          userCompanyId = c?.id ?? undefined
        }
      }
      // Company admin can only see their own specialists. If none found, include solo specialists linked by email domain (fallback for dev data)
      specialists = await prisma.specialistProfile.findMany({
        where: {
          OR: [
            { companyId: userCompanyId },
          ]
        },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
    }
    
    // Transform the data to match the Lawyer interface
    const lawyers = specialists.map(specialist => ({
      id: specialist.id,
      name: specialist.name,
      role: specialist.role,
      bio: specialist.bio,
      specializations: JSON.parse(specialist.specializations || '[]'),
      languages: JSON.parse(specialist.languages || '[]'),
      contactEmail: specialist.contactEmail,
      contactPhone: specialist.contactPhone,
      city: specialist.city,
      slug: specialist.slug,
      avatarUrl: specialist.avatarUrl,
      company: specialist.company
    }));
    
    return NextResponse.json(lawyers);
  } catch (error) {
    console.error("Error fetching company specialists:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}