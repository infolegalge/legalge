import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

type RangeOption = '7d' | '30d' | '90d' | 'custom';

const RANGE_MAP: Record<Exclude<RangeOption, 'custom'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

function parseRange(params: URLSearchParams) {
  const range = (params.get('range') as RangeOption) || '30d';
  if (range === 'custom') {
    const start = params.get('start');
    const end = params.get('end');
    if (!start || !end) {
      return null;
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return null;
    }
    return { start: startDate, end: endDate };
  }
  const days = RANGE_MAP[range] ?? RANGE_MAP['30d'];
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as {
      id: string;
      role?: 'SUPER_ADMIN' | 'COMPANY' | 'SPECIALIST' | 'SUBSCRIBER';
      companyId?: string | null;
      companySlug?: string | null;
    };
    const role = user?.role;
    let companyId = user?.companyId ?? null;

    if (!companyId && role === 'COMPANY') {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { companyId: true },
      });
      companyId = dbUser?.companyId ?? null;
    }

    if (!companyId && user?.companySlug) {
      const c = await prisma.company.findUnique({ where: { slug: user.companySlug }, select: { id: true } });
      companyId = c?.id ?? null;
    }

    const qSlug = request.nextUrl.searchParams.get('companySlug');
    const qId = request.nextUrl.searchParams.get('companyId');
    if (!companyId) {
      if (qId) {
        if (role === 'SUPER_ADMIN') companyId = qId;
        if (role === 'COMPANY' && user?.companySlug) {
          const own = await prisma.company.findUnique({ where: { slug: user.companySlug }, select: { id: true } });
          if (own?.id === qId) companyId = qId;
        }
      } else if (qSlug) {
        const c = await prisma.company.findUnique({ where: { slug: qSlug }, select: { id: true } });
        if (c?.id) {
          if (role === 'SUPER_ADMIN') companyId = c.id;
          if (role === 'COMPANY' && user?.companySlug === qSlug) companyId = c.id;
        }
      }
    }

    if (!companyId && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    const range = parseRange(request.nextUrl.searchParams);
    if (!range) {
      return NextResponse.json({ error: 'Invalid range parameters' }, { status: 400 });
    }

    if (!companyId && role === 'SUPER_ADMIN') {
      const companySlug = request.nextUrl.searchParams.get('companySlug') || user?.companySlug;
      if (!companySlug) {
        return NextResponse.json({ error: 'Company not specified' }, { status: 400 });
      }
      const company = await prisma.company.findUnique({ where: { slug: companySlug }, select: { id: true } });
      companyId = company?.id ?? null;
      if (!companyId) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const startDate = range.start;
    const endDate = range.end;

    const posts = await prisma.post.findMany({
      where: {
        companyId,
        publishedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        status: true,
      },
    });

    // Placeholder analytics data
    const totalViews = posts.length * 128;
    const uniqueVisitors = Math.round(totalViews * 0.6);
    const avgReadTime = 3.2;

    const summary = {
      totalViews,
      uniqueVisitors,
      avgReadTime,
      topCategory: posts.length
        ? {
            name: 'General',
            views: Math.round(totalViews * 0.35),
          }
        : null,
      topPost: posts[0]
        ? {
            id: posts[0].id,
            title: posts[0].title,
            views: Math.round(totalViews * 0.2),
          }
        : null,
    };

    const trends = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(endDate);
      date.setDate(date.getDate() - (6 - index));
      return {
        date: date.toISOString(),
        views: Math.max(0, Math.round(totalViews / 7 + (Math.random() - 0.5) * 100)),
        visitors: Math.max(0, Math.round(uniqueVisitors / 7 + (Math.random() - 0.5) * 60)),
      };
    });

    const categories = posts.slice(0, 4).map((post, idx) => ({
      id: `category-${idx}`,
      name: `Category ${idx + 1}`,
      views: Math.round(totalViews / 4 + (Math.random() - 0.5) * 80),
      publishedPosts: Math.max(1, Math.round(posts.length / 4)),
    }));

    const postData = posts.slice(0, 10).map((post, idx) => ({
      id: post.id,
      title: post.title,
      views: Math.round(totalViews / (idx + 1)),
      avgReadTime: 3 + Math.random() * 2,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      status: post.status,
    }));

    const visitors = [
      { locale: 'ka', percentage: 58 },
      { locale: 'en', percentage: 27 },
      { locale: 'ru', percentage: 15 },
    ];

    return NextResponse.json({
      summary,
      trends,
      categories,
      posts: postData,
      visitors,
    });
  } catch (error) {
    console.error('Company analytics error:', error);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}


