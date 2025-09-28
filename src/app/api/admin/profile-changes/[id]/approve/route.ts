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
    
    if (!session || !['SUPER_ADMIN', 'COMPANY'].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json(); // 'APPROVED' or 'DENIED'

    if (!status || !['APPROVED', 'DENIED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the profile change request
    const profileChangeRequest = await prisma.request.findUnique({
      where: { id }
    });

    if (!profileChangeRequest || profileChangeRequest.requestType !== 'PROFILE_CHANGE') {
      return NextResponse.json({ error: 'Profile change request not found' }, { status: 404 });
    }

    // Parse the request message to get the changes
    let requestData;
    try {
      requestData = JSON.parse(profileChangeRequest.message);
    } catch {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const { specialistId, changes, isSoloSpecialist, approverRole } = requestData;

    // Check authorization
    const userRole = (session.user as any)?.role;
    if (approverRole === 'SUPER_ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admin can approve this request' }, { status: 403 });
    }

    if (approverRole === 'COMPANY' && userRole !== 'COMPANY') {
      return NextResponse.json({ error: 'Only Company Admin can approve this request' }, { status: 403 });
    }

    // If approved, apply the changes to the specialist profile
    if (status === 'APPROVED') {
      const updateData: any = {
        name: changes.name,
        slug: changes.slug,
        role: changes.role,
        bio: changes.bio,
        avatarUrl: changes.avatarUrl,
        contactEmail: changes.contactEmail,
        contactPhone: changes.contactPhone,
        city: changes.city,
        philosophy: changes.philosophy,
        focusAreas: changes.focusAreas,
        representativeMatters: changes.representativeMatters,
        teachingWriting: changes.teachingWriting,
        credentials: changes.credentials,
        values: changes.values,
        languages: changes.languages,
        specializations: changes.specializations
      };

      // Update the specialist profile
      await prisma.specialistProfile.update({
        where: { id: specialistId },
        data: updateData
      });

      // Update services if provided
      if (changes.services && Array.isArray(changes.services)) {
        // Remove existing service connections
        await prisma.service.updateMany({
          where: {
            specialists: {
              some: { id: specialistId }
            }
          },
          data: {}
        });

        // Add new service connections
        await prisma.service.updateMany({
          where: {
            id: { in: changes.services }
          },
          data: {}
        });
      }
    }

    // Update the request status
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: { status }
    });

    const actionText = status === 'APPROVED' ? 'approved' : 'denied';
    const message = status === 'APPROVED' 
      ? 'Profile changes approved and applied successfully'
      : 'Profile changes denied';

    return NextResponse.json({
      message,
      request: updatedRequest
    });

  } catch (error) {
    console.error('Profile change approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
