import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

async function resolveCompanyContext(session: any) {
  const role = session?.user?.role as string | undefined;
  let companyId = session?.user?.companyId as string | null | undefined;

  if (!companyId && role === 'COMPANY') {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });
    companyId = user?.companyId ?? null;
  }

  return { role, companyId };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, companyId } = await resolveCompanyContext(session);
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Category ID required' }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true, type: true, companyId: true },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.type === 'GLOBAL') {
      return NextResponse.json({ error: 'Cannot delete global category' }, { status: 400 });
    }

    if (category.companyId !== companyId && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.postCategory.deleteMany({ where: { categoryId: id } });
    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete company category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, companyId } = await resolveCompanyContext(session);
    const { id } = await params;
    const body = await request.json();
    const { name, slug, isPublic, translations } = body as { name?: string; slug?: string; isPublic?: boolean; translations?: Array<{ locale: 'ka'|'en'|'ru'; name?: string; slug?: string }> };

    const category = await prisma.category.findUnique({
      where: { id },
      select: { id: true, type: true, companyId: true, slug: true, name: true, isPublic: true },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.type === 'GLOBAL' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (category.type === 'COMPANY' && role !== 'SUPER_ADMIN' && category.companyId !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (typeof name === 'string' && name.trim() && name.trim() !== category.name) {
      updateData.name = name.trim();
    }
    if (typeof isPublic === 'boolean' && isPublic !== category.isPublic) {
      updateData.isPublic = isPublic;
    }
    if (typeof slug === 'string' && slug.trim() && slug.trim() !== category.slug) {
      // Ensure slug uniqueness globally (schema has unique on slug)
      let base = slug.trim().toLowerCase().normalize('NFKC').replace(/["'’`]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
      if (!base) {
        base = category.slug;
      }
      let final = base;
      let counter = 1;
      while (true) {
        const exists = await prisma.category.findUnique({ where: { slug: final } });
        if (!exists || exists.id === category.id) break;
        final = `${base}-${counter++}`;
      }
      updateData.slug = final;
    }

    if (!Object.keys(updateData).length) {
      return NextResponse.json({
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          type: category.type,
          isPublic: category.isPublic,
          companyId: category.companyId,
        },
      });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, slug: true, type: true, isPublic: true, companyId: true,
        translations: { select: { locale: true, name: true, slug: true } },
      },
    });

    // Upsert translations if provided and model exists
    const ctModel = (prisma as any).categoryTranslation;
    if (Array.isArray(translations) && ctModel?.findFirst && ctModel?.create && ctModel?.update) {
      for (const t of translations) {
        if (!t?.locale) continue;
        const nameT = (t.name || name || updated.name).trim();
        // slug per-locale, unique across that locale
        let base = (t.slug || nameT)
          .toLowerCase()
          .normalize('NFKC')
          .replace(/["'’`]/g, '')
          .replace(/[^\p{L}\p{N}]+/gu, '-')
          .replace(/^-+|-+$/g, '')
          .replace(/-{2,}/g, '-');
        if (!base) base = updated.slug;
        let finalSlug = base;
        let counter = 1;
        while (true) {
          const exists = await ctModel.findFirst({ where: { locale: t.locale as any, slug: finalSlug } });
          if (!exists || exists.categoryId === id) break;
          finalSlug = `${base}-${counter++}`;
        }
        const existing = await ctModel.findFirst({ where: { categoryId: id, locale: t.locale as any } });
        if (existing) {
          await ctModel.update({ where: { id: existing.id }, data: { name: nameT, slug: finalSlug } });
        } else {
          await ctModel.create({ data: { categoryId: id, locale: t.locale as any, name: nameT, slug: finalSlug } });
        }
      }
    }

    // Post connections remain intact automatically (we're not touching postCategory rows)
    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error('Update company category error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}


