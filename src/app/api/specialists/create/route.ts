import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (!['SUPER_ADMIN', 'COMPANY'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      email: contactEmail, 
      phone: contactPhone, 
      bio, 
      specialties, 
      experience, 
      education, 
      languages, 
      companyId,
      slug 
    } = body;

    if (!name || !contactEmail || !companyId) {
      return NextResponse.json({ error: 'Name, email, and company are required' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (userRole === 'COMPANY') {
      const userCompany = await prisma.company.findFirst({
        where: { 
          id: companyId,
          users: { some: { id: (session.user as any).id } },
        },
      });
      if (!userCompany) {
        return NextResponse.json({ error: 'You can only create specialists for your own company' }, { status: 403 });
      }
    }

    const existingProfile = await prisma.specialistProfile.findFirst({
      where: { contactEmail }
    });
    if (existingProfile) {
      return NextResponse.json({ error: 'Specialist with this email already exists' }, { status: 400 });
    }

    const specialist = await prisma.specialistProfile.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        contactEmail,
        contactPhone: contactPhone || null,
        bio: bio || null,
        languages: Array.isArray(languages) ? JSON.stringify(languages) : JSON.stringify([]),
        specializations: Array.isArray(specialties) ? JSON.stringify(specialties) : JSON.stringify([]),
        companyId,
        status: 'ACTIVE',
        translations: {
          create: {
            locale: 'ka',
            name,
            slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
            bio: bio || null,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        company: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ 
      message: 'Specialist created successfully',
      specialist 
    }, { status: 201 });

  } catch (error) {
    console.error('Create specialist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
