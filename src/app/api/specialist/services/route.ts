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

    const formData = await request.formData();
    const specialistId = String(formData.get('specialistId') || '');
    const serviceIds = formData.getAll('serviceIds') as string[];

    if (!specialistId) {
      return NextResponse.json({ error: 'Specialist ID is required' }, { status: 400 });
    }

    // Verify the specialist profile belongs to the current user
    const specialistProfile = await prisma.specialistProfile.findFirst({
      where: {
        id: specialistId,
        contactEmail: (session.user as any).email
      }
    });

    if (!specialistProfile) {
      return NextResponse.json({ error: 'Specialist profile not found' }, { status: 404 });
    }

    // Connect the specialist to the selected services via explicit sync
    const disconnectExisting = prisma.specialistProfile.update({
      where: { id: specialistId },
      data: {
        services: {
          set: [],
        },
      },
    });

    const connectNew = serviceIds.length
      ? prisma.specialistProfile.update({
          where: { id: specialistId },
          data: {
            services: {
              connect: serviceIds.map((id) => ({ id })),
            },
          },
        })
      : null;

    await disconnectExisting;
    if (connectNew) {
      await connectNew;
    }

    const refreshed = await prisma.specialistProfile.findUnique({
      where: { id: specialistId },
      select: {
        id: true,
        services: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, specialist: refreshed });

  } catch (error) {
    console.error('Error assigning services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
