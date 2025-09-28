import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; locale: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as { role?: string })?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, locale } = await params;
    const body = await request.json();
    const { title, slug, content, metaTitle, metaDescription } = body;

    // Validate locale
    if (!['ka', 'en', 'ru'].includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;

    const translation = await prisma.legalPageTranslation.upsert({
      where: {
        legalPageId_locale: {
          legalPageId: id,
          locale: locale as any
        }
      },
      update: updateData,
      create: {
        legalPageId: id,
        locale: locale as any,
        title: title || '',
        slug: slug || '',
        content: content || '',
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null
      }
    });

    return NextResponse.json(translation);
  } catch (error) {
    console.error('Error updating legal page translation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
