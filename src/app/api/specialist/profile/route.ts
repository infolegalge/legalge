import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Specialist profile API - Session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: (session?.user as any)?.id,
      userEmail: (session?.user as any)?.email,
      userRole: (session?.user as any)?.role
    });
    
    if (!session || !session.user) {
      console.log('No session or user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((session.user as any)?.role !== 'SPECIALIST') {
      console.log('User role is not SPECIALIST:', (session.user as any)?.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // First get the user to check bio approval status
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id as string }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const specialist = await prisma.specialistProfile.findFirst({
      where: {
        contactEmail: (session.user as any).email || undefined,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        services: {
          select: {
            id: true,
            title: true,
            slug: true,
            practiceArea: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!specialist) {
      return NextResponse.json({ error: 'Specialist profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: specialist.id,
      slug: specialist.slug,
      name: specialist.name,
      role: specialist.role,
      bio: specialist.bio,
      avatarUrl: specialist.avatarUrl,
      specializations: specialist.specializations || "[]",
      languages: specialist.languages || "[]",
      contactEmail: (session.user as any).email || null,
      contactPhone: null,
      city: specialist.city,
      company: specialist.company,
      philosophy: specialist.philosophy,
      focusAreas: specialist.focusAreas,
      representativeMatters: specialist.representativeMatters,
      teachingWriting: specialist.teachingWriting,
      credentials: specialist.credentials,
      values: specialist.values,
      services: specialist.services,
      bioApproved: null,
      bioApprovedBy: null,
      bioApprovedAt: null,
    });
  } catch (error) {
    console.error('Error fetching specialist profile:', error);
    console.error('Error details:', {
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      name: (error as any)?.name
    });
    return NextResponse.json({ 
      error: 'Failed to fetch profile',
      details: (error as any)?.message 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((session.user as any)?.role !== 'SPECIALIST') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, role, bio, city, specializations, languages } = body;

    const specialist = await prisma.specialistProfile.findFirst({
      where: {
        contactEmail: (session.user as any).email || undefined,
      },
    });

    if (!specialist) {
      return NextResponse.json({ error: 'Specialist profile not found' }, { status: 404 });
    }

    const updatedSpecialist = await prisma.specialistProfile.update({
      where: { id: specialist.id },
      data: {
        name,
        role,
        bio,
        contactEmail: (session.user as any).email || undefined,
        city,
        specializations: JSON.stringify(specializations || []),
        languages: JSON.stringify(languages || []),
      },
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
      id: updatedSpecialist.id,
      name: updatedSpecialist.name,
      role: updatedSpecialist.role,
      bio: updatedSpecialist.bio,
      avatarUrl: updatedSpecialist.avatarUrl,
      specializations: JSON.parse(updatedSpecialist.specializations || "[]"),
      languages: JSON.parse(updatedSpecialist.languages || "[]"),
      contactEmail: (session.user as any).email || null,
      contactPhone: null,
      city: updatedSpecialist.city,
      company: updatedSpecialist.company,
    });
  } catch (error) {
    console.error('Error updating specialist profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

