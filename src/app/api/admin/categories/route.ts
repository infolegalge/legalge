import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !['SUPER_ADMIN', 'COMPANY', 'SPECIALIST'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    const where: any = {};
    if (role !== 'SUPER_ADMIN') {
      where.type = 'GLOBAL';
    }
    const categories = await prisma.category.findMany({ where, orderBy: { name: 'asc' }, select: { id: true, name: true } });
    let postCategoryIds: string[] = [];
    if (postId) {
      const pcs = await prisma.postCategory.findMany({ where: { postId }, select: { categoryId: true } });
      postCategoryIds = pcs.map((p) => p.categoryId);
    }
    return NextResponse.json({ categories, postCategoryIds });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { name, slug } = body as { name: string; slug?: string };
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const safeSlug = (slug || name)
      .toLowerCase()
      .normalize('NFKC')
      .replace(/["'’`]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
    const created = await prisma.category.create({ data: { name, slug: safeSlug, type: 'GLOBAL' } });
    return NextResponse.json({ category: created });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}






