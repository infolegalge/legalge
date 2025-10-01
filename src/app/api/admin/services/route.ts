import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';
import type { Locale } from '@/i18n/locales';
import { composeSlug } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

const locales: Locale[] = ['ka', 'en', 'ru'];
const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

function ensureUniqueSlug(base: string, slugSet: Set<string>, locale?: Locale) {
  let candidate = composeSlug(base, locale);
  if (!candidate) candidate = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  let finalSlug = candidate;
  let counter = 1;
  while (slugSet.has(finalSlug)) {
    finalSlug = `${candidate}-${counter++}`;
  }
  slugSet.add(finalSlug);
  return finalSlug;
}

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !role || !ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const practiceAreaId = String(formData.get('practiceAreaId') || '').trim();
    const baseTitle = String(formData.get('title') || '').trim();
    const baseSlugInput = String(formData.get('slug') || '').trim();

    if (!practiceAreaId || !baseTitle) {
      return NextResponse.json({ error: 'Practice area and title are required' }, { status: 400 });
    }

    const slugSet = new Set<string>();
    const baseSlug = ensureUniqueSlug(baseSlugInput || baseTitle, slugSet, 'ka');
    const heroImageUrl = String(formData.get('heroImage') || '').trim() || null;
    const heroImageAlt = String(formData.get('heroImageAlt') || '').trim() || null;
    const baseDescription = String(formData.get('description') || '');

    const service = await prisma.service.create({
      data: {
        title: baseTitle,
        slug: baseSlug,
        description: baseDescription,
        practiceAreaId,
        heroImageUrl: heroImageUrl || undefined,
        heroImageAlt: heroImageAlt || undefined,
        translations: {
          create: locales.map((locale) => {
            const title = String(formData.get(`title_${locale}`) || baseTitle).trim();
            const slugValue = String(formData.get(`slug_${locale}`) || '').trim();
            const translationSlug = ensureUniqueSlug(slugValue || title || baseTitle, slugSet, locale);
            return {
              locale,
              title,
              slug: translationSlug,
              description: String(formData.get(`description_${locale}`) || ''),
              metaTitle: String(formData.get(`metaTitle_${locale}`) || '').trim() || null,
              metaDescription: String(formData.get(`metaDescription_${locale}`) || '').trim() || null,
              ogTitle: String(formData.get(`ogTitle_${locale}`) || '').trim() || null,
              ogDescription: String(formData.get(`ogDescription_${locale}`) || '').trim() || null,
              heroImageAlt: String(formData.get(`heroImageAlt_${locale}`) || '').trim() || null,
            };
          }),
        },
      },
    });

    locales.forEach((loc) => {
      revalidatePath(`/${loc}/services/${service.slug}`);
      revalidatePath(`/${loc}/services`);
    });
    revalidatePath(`/`);

    return NextResponse.json({ success: true, id: service.id });
  } catch (error) {
    console.error('Failed to create service', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
