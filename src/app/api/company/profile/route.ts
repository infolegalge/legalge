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
    
    const userRole = (session.user as { role?: string; companyId?: string } | null)?.role;
    const sessionCompanyId = (session.user as { role?: string; companyId?: string } | null)?.companyId as string | undefined;
    
    if (userRole !== 'COMPANY' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Get company profile
    let company;
    if (userRole === 'SUPER_ADMIN') {
      // Super admin can access any company - get from query params
      const { searchParams } = new URL(request.url);
      const companyId = searchParams.get('companyId');
      
      if (!companyId) {
        return NextResponse.json({ error: "Company ID required for super admin" }, { status: 400 });
      }
      
      company = await prisma.company.findUnique({
        where: { id: companyId }
      });
    } else {
      // Company admin can only access their own company
      // Resolve companyId from session or DB (session may not include companyId)
      let resolvedCompanyId = sessionCompanyId;
      if (!resolvedCompanyId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: (session.user as { id?: string } | null)?.id as string },
          select: { companyId: true, companySlug: true },
        });
        resolvedCompanyId = dbUser?.companyId ?? undefined;
        if (!resolvedCompanyId && dbUser?.companySlug) {
          const c = await prisma.company.findUnique({ where: { slug: dbUser.companySlug }, select: { id: true } });
          resolvedCompanyId = c?.id ?? undefined;
        }
      }
      if (!resolvedCompanyId) {
        return NextResponse.json({ error: "User is not associated with a company" }, { status: 400 });
      }
      company = await prisma.company.findUnique({
        where: { id: resolvedCompanyId }
      });
    }
    
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    
    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userRole = (session.user as { role?: string; companyId?: string } | null)?.role;
    const sessionCompanyId = (session.user as { role?: string; companyId?: string } | null)?.companyId as string | undefined;
    
    if (userRole !== 'COMPANY' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const body = await request.json();
    const {
      name,
      description,
      shortDesc,
      longDesc,
      email,
      phone,
      website,
      address,
      city,
      mapLink,
      logoUrl
    } = body;
    
    // Determine which company to update
    let companyId: string | undefined;
    if (userRole === 'SUPER_ADMIN') {
      // Super admin can update any company - get from body
      companyId = body.companyId;
      if (!companyId) {
        return NextResponse.json({ error: "Company ID required for super admin" }, { status: 400 });
      }
    } else {
      // Company admin can only update their own company
      companyId = sessionCompanyId;
      if (!companyId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: (session.user as { id?: string } | null)?.id as string },
          select: { companyId: true, companySlug: true },
        });
        companyId = dbUser?.companyId ?? undefined;
        if (!companyId && dbUser?.companySlug) {
          const c = await prisma.company.findUnique({ where: { slug: dbUser.companySlug }, select: { id: true } });
          companyId = c?.id ?? undefined;
        }
      }
      if (!companyId) {
        return NextResponse.json({ error: "User is not associated with a company" }, { status: 400 });
      }
    }
    
    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId }
    });
    
    if (!existingCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    
    // Update company profile
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: name || undefined,
        description: description || undefined,
        shortDesc: shortDesc || undefined,
        longDesc: longDesc || undefined,
        email: email || undefined,
        phone: phone || undefined,
        website: website || undefined,
        address: address || undefined,
        city: city || undefined,
        mapLink: mapLink || undefined,
        logoUrl: logoUrl || undefined,
      }
    });
    
    return NextResponse.json({
      success: true,
      company: updatedCompany
    });
  } catch (error) {
    console.error("Error updating company profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
