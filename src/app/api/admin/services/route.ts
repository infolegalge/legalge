import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow SPECIALIST, COMPANY, and SUPER_ADMIN to access services
    const userRole = (session.user as any)?.role;
    if (!['SPECIALIST', 'COMPANY', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const services = await prisma.service.findMany({
      include: {
        practiceArea: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        translations: {
          select: {
            locale: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    return NextResponse.json({
      services: services.map(service => ({
        id: service.id,
        title: service.title,
        slug: service.slug,
        practiceArea: service.practiceArea,
        translations: service.translations
      }))
    });

  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
