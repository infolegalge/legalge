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

    // Check if user is super admin or company admin
    const userRole = (session.user as any)?.role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'COMPANY') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the specialist profile
    const specialist = await prisma.specialistProfile.findUnique({
      where: { id },
      include: { company: true }
    });

    if (!specialist) {
      return NextResponse.json({ error: 'Specialist not found' }, { status: 404 });
    }

    // If user is COMPANY, check if they own this specialist
    if (userRole === 'COMPANY') {
      const userCompanyId = (session.user as any)?.companyId;
      if (specialist.companyId !== userCompanyId) {
        return NextResponse.json({ error: 'Forbidden: Specialist does not belong to your company' }, { status: 403 });
      }
    }

    // Update the specialist status
    const updatedSpecialist = await prisma.specialistProfile.update({
      where: { id },
      data: { status },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      specialist: {
        id: updatedSpecialist.id,
        name: updatedSpecialist.name,
        status: (updatedSpecialist as any).status,
        company: updatedSpecialist.company,
      }
    });

  } catch (error) {
    console.error('Update specialist status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
