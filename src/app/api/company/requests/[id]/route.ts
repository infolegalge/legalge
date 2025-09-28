import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (!['COMPANY', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!['PENDING', 'APPROVED', 'DENIED', 'HANGING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const requestRecord = await prisma.request.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!requestRecord) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (requestRecord.requestType !== 'SPECIALIST') {
      return NextResponse.json({ error: 'Forbidden: Can only manage specialist requests' }, { status: 403 });
    }

    if (userRole === 'COMPANY') {
      let companyId = (session.user as any)?.companyId as string | null | undefined;
      if (!companyId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: (session.user as any).id },
          select: { companyId: true },
        });
        companyId = dbUser?.companyId ?? null;
      }

      if (!companyId || requestRecord.companyId !== companyId) {
        return NextResponse.json({ error: 'Forbidden: Request does not belong to your company' }, { status: 403 });
      }
    }

    // Update request status first
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: { status },
      include: {
        company: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // If approved, ensure the user is promoted to SPECIALIST and has a SpecialistProfile
    if (status === 'APPROVED' && updatedRequest.user) {
      // Determine which company to attach: prefer request.companyId; fallback to approver's company
      let effectiveCompanyId: string | undefined = updatedRequest.companyId || undefined;
      if (!effectiveCompanyId && userRole === 'COMPANY') {
        let approverCompanyId = (session.user as any)?.companyId as string | undefined;
        if (!approverCompanyId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: (session.user as any).id },
            select: { companyId: true, companySlug: true as any },
          }) as any;
          approverCompanyId = dbUser?.companyId ?? undefined;
          if (!approverCompanyId && dbUser?.companySlug) {
            const approverCompany = await prisma.company.findUnique({ where: { slug: dbUser.companySlug }, select: { id: true } });
            approverCompanyId = approverCompany?.id ?? undefined;
          }
        }
        effectiveCompanyId = approverCompanyId;
      }

      const userId = updatedRequest.user.id;
      // Promote role to SPECIALIST
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'SPECIALIST', ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}) },
      });

      // Ensure specialist profile exists, create if missing
      const email = updatedRequest.user.email as string | null;
      const existing = await prisma.specialistProfile.findFirst({
        where: email ? { contactEmail: email } : { userId: userId as any },
      } as any);

      if (!existing) {
        const baseName = updatedRequest.user.name || (email || 'specialist').split('@')[0] || 'specialist';
        // naive slug, will be adjusted later by UI
        const slugBase = baseName.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
        let slug = slugBase || `specialist-${userId.slice(0,6)}`;
        // ensure uniqueness of slug
        let counter = 1;
        while (await prisma.specialistProfile.findUnique({ where: { slug } })) {
          slug = `${slugBase}-${counter++}`;
        }
        await prisma.specialistProfile.create({
          data: {
            name: baseName,
            slug,
            contactEmail: email || undefined,
            companyId: effectiveCompanyId || undefined,
            status: 'ACTIVE',
          },
        });
      } else if (effectiveCompanyId && existing.companyId !== effectiveCompanyId) {
        // Attach to company if provided
        await prisma.specialistProfile.update({
          where: { id: existing.id },
          data: { companyId: effectiveCompanyId },
        });
      }
    }

    return NextResponse.json(updatedRequest);

  } catch (error) {
    console.error('Update request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (!['COMPANY', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const requestRecord = await prisma.request.findUnique({
      where: { id },
    });

    if (!requestRecord) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (requestRecord.requestType !== 'SPECIALIST') {
      return NextResponse.json({ error: 'Forbidden: Can only delete specialist requests' }, { status: 403 });
    }

    if (userRole === 'COMPANY') {
      let companyId = (session.user as any)?.companyId as string | null | undefined;
      if (!companyId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: (session.user as any).id },
          select: { companyId: true },
        });
        companyId = dbUser?.companyId ?? null;
      }

      if (!companyId || requestRecord.companyId !== companyId) {
        return NextResponse.json({ error: 'Forbidden: Request does not belong to your company' }, { status: 403 });
      }
    }

    await prisma.request.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
