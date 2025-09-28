import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== 'SPECIALIST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { changes, message } = await request.json();

    if (!changes) {
      return NextResponse.json({ error: 'Changes data is required' }, { status: 400 });
    }

    // Get the specialist profile
    const specialistProfile = await prisma.specialistProfile.findFirst({
      where: { contactEmail: (session.user as any).email },
      include: {
        company: {
          select: { id: true, name: true }
        }
      }
    });

    if (!specialistProfile) {
      return NextResponse.json({ error: 'Specialist profile not found' }, { status: 404 });
    }

    // Determine the approver
    const isSoloSpecialist = !specialistProfile.companyId;
    const approverRole = isSoloSpecialist ? 'SUPER_ADMIN' : 'COMPANY';
    const approverEmail = isSoloSpecialist 
      ? null // Will be handled by any SUPER_ADMIN
      : specialistProfile.company?.name; // Company name for reference

    // Create the profile change request
    const profileChangeRequest = await prisma.request.create({
      data: {
        email: (session.user as any).email || '',
        phone: '',
        message: JSON.stringify({
          type: 'PROFILE_CHANGE_REQUEST',
          specialistId: specialistProfile.id,
          specialistName: specialistProfile.name,
          changes: changes,
          originalMessage: message || 'Profile changes requested',
          isSoloSpecialist,
          approverRole,
          approverEmail
        }),
        requestType: 'PROFILE_CHANGE',
        status: 'PENDING',
        userId: (session.user as any).id,
        companyId: specialistProfile.companyId
      }
    });

    const successMessage = isSoloSpecialist 
      ? 'Profile changes submitted for approval by Super Admin'
      : `Profile changes submitted for approval by ${specialistProfile.company?.name} Admin`;

    return NextResponse.json({
      success: true,
      message: successMessage,
      requestId: profileChangeRequest.id
    });

  } catch (error) {
    console.error('Profile change request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
