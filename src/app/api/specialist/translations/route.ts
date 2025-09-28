import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== 'SPECIALIST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the specialist profile for the current user
    const specialistProfile = await prisma.specialistProfile.findFirst({
      where: {
        contactEmail: (session.user as any).email
      }
    });

    if (!specialistProfile) {
      return NextResponse.json({ error: 'Specialist profile not found' }, { status: 404 });
    }

    // Get all translations for this specialist
    const translations = await prisma.specialistProfileTranslation.findMany({
      where: {
        specialistProfileId: specialistProfile.id
      }
    });

    return NextResponse.json({
      translations
    });

  } catch (error) {
    console.error('Error fetching specialist translations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== 'SPECIALIST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      specialistProfileId,
      locale,
      name,
      slug,
      role,
      bio,
      metaTitle,
      metaDescription,
      philosophy,
      focusAreas,
      representativeMatters,
      teachingWriting,
      credentials,
      values
    } = body;

    if (!specialistProfileId || !locale || !name || !slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the specialist profile belongs to the current user
    const specialistProfile = await prisma.specialistProfile.findFirst({
      where: {
        id: specialistProfileId,
        contactEmail: (session.user as any).email
      }
    });

    if (!specialistProfile) {
      return NextResponse.json({ error: 'Specialist profile not found' }, { status: 404 });
    }

    // Check if translation already exists
    const existingTranslation = await prisma.specialistProfileTranslation.findFirst({
      where: {
        specialistProfileId,
        locale
      }
    });

    let translation;

    const cleanText = (value: string | null | undefined) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    };

    const cleanJson = (value: string | null | undefined) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      try {
        JSON.parse(trimmed);
        return trimmed;
      } catch {
        return null;
      }
    };

    const data = {
      specialistProfileId,
      locale,
      name,
      slug,
      role: cleanText(role),
      bio: cleanText(bio),
      metaTitle: cleanText(metaTitle),
      metaDescription: cleanText(metaDescription),
      philosophy: cleanText(philosophy),
      focusAreas: cleanJson(focusAreas),
      representativeMatters: cleanJson(representativeMatters),
      teachingWriting: cleanJson(teachingWriting),
      credentials: cleanJson(credentials),
      values: cleanJson(values),
    };

    if (existingTranslation) {
      // Update existing translation
      translation = await prisma.specialistProfileTranslation.update({
        where: { id: existingTranslation.id },
        data,
      });
    } else {
      // Create new translation
      translation = await prisma.specialistProfileTranslation.create({
        data,
      });
    }

    return NextResponse.json({
      success: true,
      translation
    });

  } catch (error) {
    console.error('Error updating specialist translation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
