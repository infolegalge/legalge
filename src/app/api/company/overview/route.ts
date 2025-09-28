import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

interface SessionUser {
  id: string;
  role?: 'SUPER_ADMIN' | 'COMPANY' | 'SPECIALIST' | 'SUBSCRIBER';
  companyId?: string | null;
  companySlug?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as {
      id: string;
      role?: 'SUPER_ADMIN' | 'COMPANY' | 'SPECIALIST' | 'SUBSCRIBER';
      companyId?: string | null;
      companySlug?: string | null;
    };
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = user.role;
    let companyId = user.companyId ?? null;

    // Fallback: resolve companyId from DB if COMPANY and not present on session
    if (!companyId && role === 'COMPANY') {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { companyId: true },
      });
      companyId = dbUser?.companyId ?? null;
    }

    // Fallback: resolve by session companySlug if still missing
    if (!companyId && user.companySlug) {
      const c = await prisma.company.findUnique({ where: { slug: user.companySlug }, select: { id: true } });
      companyId = c?.id ?? null;
    }

    // Allow explicit selection via query params
    const queryCompanySlug = request.nextUrl.searchParams.get('companySlug');
    const queryCompanyId = request.nextUrl.searchParams.get('companyId');
    if (!companyId) {
      if (queryCompanyId) {
        // COMPANY can only use their own company; SUPER_ADMIN can use any
        if (role === 'COMPANY') {
          // If we can resolve their slug to an id, ensure match
          if (user.companySlug) {
            const own = await prisma.company.findUnique({ where: { slug: user.companySlug }, select: { id: true } });
            if (own?.id === queryCompanyId) companyId = queryCompanyId;
          }
        } else if (role === 'SUPER_ADMIN') {
          companyId = queryCompanyId;
        }
      } else if (queryCompanySlug) {
        const c = await prisma.company.findUnique({ where: { slug: queryCompanySlug }, select: { id: true } });
        if (c?.id) {
          if (role === 'COMPANY') {
            // Only allow if matches the user's own company
            if (user.companySlug === queryCompanySlug) companyId = c.id;
          } else if (role === 'SUPER_ADMIN') {
            companyId = c.id;
          }
        }
      }
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const summaryPromise = prisma.$transaction(async (tx) => {
      const [totalPosts, publishedPosts, draftPosts, pendingRequests, specialists] = await Promise.all([
        tx.post.count({ where: { companyId } }),
        tx.post.count({ where: { companyId, status: 'PUBLISHED' } }),
        tx.post.count({ where: { companyId, status: 'DRAFT' } }),
        tx.request.count({ where: { companyId, status: 'PENDING' } }),
        tx.specialistProfile.findMany({ where: { companyId }, select: { status: true } }),
      ]);

      const activeSpecialists = specialists.filter((s) => s.status === 'ACTIVE').length;
      const suspendedSpecialists = specialists.filter((s) => s.status !== 'ACTIVE').length;

      const lastPublished = await tx.post.findFirst({
        where: { companyId, status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        select: { publishedAt: true },
      });

      return {
        totalPosts,
        publishedPosts,
        draftPosts,
        pendingRequests,
        activeSpecialists,
        suspendedSpecialists,
        lastPublishedAt: lastPublished?.publishedAt?.toISOString() ?? null,
      };
    });

    const recentPostsPromise = prisma.post.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, status: true, updatedAt: true },
    });

    const recentRequestsPromise = prisma.request.findMany({
      where: { companyId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, status: true, email: true, updatedAt: true },
    });

    const [summary, recentPosts, recentRequests] = await Promise.all([
      summaryPromise,
      recentPostsPromise,
      recentRequestsPromise,
    ]);

    const alerts: Array<{ id: string; message: string; severity: 'info' | 'warning' | 'critical' }> = [];
    if (summary.pendingRequests > 0) {
      alerts.push({
        id: 'requests',
        severity: 'warning',
        message: summary.pendingRequests === 1
          ? 'You have 1 pending specialist request to review.'
          : `You have ${summary.pendingRequests} pending specialist requests to review.`,
      });
    }
    if (summary.draftPosts > summary.publishedPosts) {
      alerts.push({
        id: 'drafts',
        severity: 'info',
        message: 'You have more drafts than published posts. Consider publishing fresh content.',
      });
    }
    if (summary.activeSpecialists === 0) {
      alerts.push({
        id: 'no-specialists',
        severity: 'critical',
        message: 'No active specialists are linked to your company. Invite or approve a specialist to show them on your profile.',
      });
    }

    const recentActivity = [
      ...recentPosts.map((post) => ({
        id: `post-${post.id}`,
        type: post.status,
        title: post.title,
        createdAt: post.updatedAt.toISOString(),
        actor: null,
        link: `/company/posts/${post.id}/edit`,
      })),
      ...recentRequests.map((request) => ({
        id: `request-${request.id}`,
        type: request.status,
        title: `Request from ${request.email}`,
        createdAt: request.updatedAt.toISOString(),
        actor: null,
        link: `/company/requests`,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);

    return NextResponse.json({
      summary,
      alerts,
      recentActivity,
    });
  } catch (error) {
    console.error('Company overview error:', error);
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 });
  }
}


