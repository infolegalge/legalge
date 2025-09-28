import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== 'SPECIALIST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    const id = String(formData.get('id') || '');
    const name = String(formData.get('name') || '').trim();
    const slug = String(formData.get('slug') || '').trim();
    const role = String(formData.get('role') || '').trim() || null;
    const bio = String(formData.get('bio') || '').trim() || null;
    const avatarUrl = String(formData.get('avatarUrl') || '').trim() || null;
    const philosophy = String(formData.get('philosophy') || '').trim() || null;
    const focusAreasText = String(formData.get('focusAreas') || '').trim();
    const focusAreas = focusAreasText ? JSON.stringify(focusAreasText.split('\n').filter(line => line.trim())) : null;
    const representativeMattersText = String(formData.get('representativeMatters') || '').trim();
    const representativeMatters = representativeMattersText ? JSON.stringify(representativeMattersText.split('\n').filter(line => line.trim())) : null;
    const teachingWriting = String(formData.get('teachingWriting') || '').trim() || null;
    const credentials = String(formData.get('credentials') || '').trim() || null;
    const values = String(formData.get('values') || '').trim() || null;
    const languagesArray = formData.getAll('languages') as string[];
    const languages = JSON.stringify(languagesArray);
    const specializationsArray = formData.getAll('specializations') as string[];
    const specializations = JSON.stringify(specializationsArray);
    const companyId = String(formData.get('companyId') || '').trim() || null;

    if (!id || !name || !slug) {
      return NextResponse.json({ error: 'ID, name and slug are required' }, { status: 400 });
    }

    // Verify the specialist profile belongs to the current user
    const specialistProfile = await prisma.specialistProfile.findFirst({
      where: {
        id,
        contactEmail: (session.user as any).email
      }
    });

    if (!specialistProfile) {
      return NextResponse.json({ error: 'Specialist profile not found' }, { status: 404 });
    }

    // Check if slug already exists (excluding current specialist)
    const existingSpecialist = await prisma.specialistProfile.findFirst({
      where: { 
        slug,
        id: { not: id }
      }
    });

    if (existingSpecialist) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // Update the specialist profile
    const updatedSpecialist = await prisma.specialistProfile.update({
      where: { id },
      data: {
        name,
        slug,
        role,
        bio,
        contactEmail: (session.user as any).email,
        contactPhone: null,
        avatarUrl,
        philosophy,
        focusAreas,
        representativeMatters,
        teachingWriting,
        credentials,
        values,
        languages,
        specializations,
        companyId: companyId || null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        services: {
          select: {
            id: true,
            title: true,
            slug: true,
            practiceArea: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      specialist: updatedSpecialist
    });

  } catch (error) {
    console.error('Error updating specialist profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
