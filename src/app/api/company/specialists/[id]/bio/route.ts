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
    
    if (!session || (session.user as any)?.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { approved } = body;

    // Get the current user's company
    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    });

    if (!currentUser?.companyId) {
      return NextResponse.json({ error: 'User not associated with a company' }, { status: 400 });
    }

    // Get the specialist to update
    const specialist = await prisma.user.findUnique({
      where: { id },
    });

    if (!specialist) {
      return NextResponse.json({ error: 'Specialist not found' }, { status: 404 });
    }

    // Check if the specialist belongs to the current user's company
    if (specialist.companyId !== currentUser.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the bio approval status
    const updateData: any = {
      bioApproved: approved
    };

    if (approved) {
      updateData.bioApprovedBy = (session.user as any).id;
      updateData.bioApprovedAt = new Date();
    } else {
      updateData.bioApprovedBy = null;
      updateData.bioApprovedAt = null;
    }

    const updatedSpecialist = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, bioApproved: true, bioApprovedAt: true, bioApprovedBy: true }
    });

    return NextResponse.json(updatedSpecialist);

  } catch (error) {
    console.error('Error updating bio approval:', error);
    return NextResponse.json({ error: 'Failed to update bio approval' }, { status: 500 });
  }
}
