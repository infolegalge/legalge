import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';
import { makeSlug } from '@/lib/utils';

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

async function ensureUniqueSlug(baseSlug: string) {
  if (!baseSlug) return baseSlug;
  let finalSlug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug: finalSlug } });
    if (!existing) break;
    finalSlug = `${baseSlug}-${counter++}`;
  }
  return finalSlug;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, companyId } = await resolveCompanyContext(session);
    const searchParams = request.nextUrl.searchParams;
    const includeGlobal = searchParams.get('includeGlobal') !== 'false';

    let effectiveCompanyId = companyId ?? null;
    if (role === 'SUPER_ADMIN') {
      const queryCompanyId = searchParams.get('companyId');
      if (queryCompanyId) {
        effectiveCompanyId = queryCompanyId;
      }
    }

    if (!effectiveCompanyId && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    const orConditions: any[] = [];
    if (includeGlobal) {
      orConditions.push({ type: 'GLOBAL' });
    }
    if (effectiveCompanyId) {
      orConditions.push({ type: 'COMPANY', companyId: effectiveCompanyId });
    }

    if (!orConditions.length) {
      return NextResponse.json({ categories: [] });
    }

    const categories = await prisma.category.findMany({
      where: { OR: orConditions },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { posts: true } },
        translations: {
          select: { locale: true, name: true, slug: true }
        },
      },
    });

    const postId = searchParams.get('postId');
    let postCategoryIds: string[] = [];
    if (postId) {
      const pcs = await prisma.postCategory.findMany({
        where: { postId },
        select: { categoryId: true },
      });
      postCategoryIds = pcs.map((p) => p.categoryId);
    }

    return NextResponse.json({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        type: category.type,
        isPublic: category.isPublic,
        companyId: category.companyId,
        postCount: category._count.posts,
        createdAt: category.createdAt,
        translations: (category as any).translations || [],
      })),
      postCategoryIds,
    });
  } catch (error) {
    console.error('Company categories GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, companyId } = await resolveCompanyContext(session);
    const body = await request.json();
    const { name, slug, isPublic = true } = body as {
      name?: string;
      slug?: string;
      isPublic?: boolean;
    };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    let targetCompanyId = companyId ?? null;
    if (role === 'SUPER_ADMIN') {
      targetCompanyId = body.companyId || targetCompanyId;
    }

    if (!targetCompanyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    const baseSlug = makeSlug(slug?.trim() || name, 'en' as any) || makeSlug(name, 'en' as any);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    const created = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: uniqueSlug,
        type: 'COMPANY',
        isPublic: Boolean(isPublic),
        company: { connect: { id: targetCompanyId } },
      },
      include: {
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({
      category: {
        id: created.id,
        name: created.name,
        slug: created.slug,
        type: created.type,
        isPublic: created.isPublic,
        companyId: created.companyId,
        postCount: created._count.posts,
        createdAt: created.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Company categories POST error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}


