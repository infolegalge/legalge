import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const statusParam = searchParams.get('status');
    const category = searchParams.get('category');
    const author = searchParams.get('author');
    const company = searchParams.get('company');
    const companySlugParam = searchParams.get('companySlug');
    const search = searchParams.get('search');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const scope = searchParams.get('scope');
    const locale = (searchParams.get('locale') || 'ka') as 'ka' | 'en' | 'ru';
    
    // Build where clause
    const userSession = await getServerSession(authOptions);

    const where: any = {};
    // For safe debug
    let dbgCompanyId: string | null | undefined = null;
    let dbgCompanySlug: string | null | undefined = null;

    // Add category filter (disabled - categories not implemented in current schema)
    // if (category) {
    //   where.categories = {
    //     some: {
    //       category: {
    //         slug: category
    //       }
    //     }
    //   };
    // }

    // Add author filter (simplified - authorType not in current schema)
    if (author) {
      where.company = {
        slug: author
      };
    }

    // Add company filter
    if (company) {
      where.company = {
        slug: company
      };
    }

    // Scope-based filtering
    if (scope === 'specialist') {
      if (!userSession || (userSession.user as any)?.role !== 'SPECIALIST') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (statusParam) {
        where.status = statusParam as any;
      }
      where.authorId = (userSession.user as any).id;
    } else if (scope === 'company') {
      if (!userSession || !['COMPANY', 'SUPER_ADMIN'].includes((userSession.user as any)?.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      let companyId = (userSession.user as any).companyId || (userSession.user as any).company?.id;
      let companySlug = companySlugParam || (userSession.user as any).companySlug || (userSession.user as any).company?.slug;
      // Fallback to DB user if session is missing linkage
      if (!companyId && !companySlug) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: (userSession.user as any).id },
            select: { companyId: true, companySlug: true },
          });
          companyId = dbUser?.companyId || companyId;
          companySlug = dbUser?.companySlug || companySlug;
        } catch {}
      }
      if (!companyId && companySlug) {
        const c = await prisma.company.findUnique({ where: { slug: companySlug }, select: { id: true } });
        companyId = c?.id || null;
      }
      dbgCompanyId = companyId;
      dbgCompanySlug = companySlug;
      if ((userSession.user as any)?.role !== 'SUPER_ADMIN') {
        if (companyId || companySlug) {
          where.OR = [
            ...(companyId ? [{ companyId }] : []),
            ...(companyId ? [{ author: { companyId } }] : []),
            ...(companySlug && !companyId ? [{ company: { slug: companySlug } }] : []),
            // Also include posts authored by the current company user even if companyId wasn't connected at creation
            { authorId: (userSession.user as any).id },
          ];
        } else {
          // Fallback: show posts authored by the current company user
          where.authorId = (userSession.user as any).id;
        }
      }
      // For specialists working at this company: include posts with author.companyId = companyId (already covered) and posts where authorId is any user in this company
      if (companyId) {
        const companyUserIds = await prisma.user.findMany({ where: { companyId }, select: { id: true } });
        const ids = companyUserIds.map(u => u.id);
        if (ids.length) {
          where.OR = Array.isArray(where.OR) ? [...where.OR, { authorId: { in: ids } }] : [{ authorId: { in: ids } }];
        }
        // Include posts authored by users whose emails match specialists linked to this company
        try {
          const specialists = await prisma.specialistProfile.findMany({
            where: { companyId },
            select: { contactEmail: true },
          });
          const emails = specialists.map(s => s.contactEmail).filter((e): e is string => !!e);
          if (emails.length) {
            // Match by author email
            where.OR = Array.isArray(where.OR) ? [...where.OR, { author: { email: { in: emails } } }] : [{ author: { email: { in: emails } } }];
            // Also resolve user IDs by email as some authors may have null companyId
            const emailUsers = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
            const emailUserIds = emailUsers.map(u => u.id);
            if (emailUserIds.length) {
              where.OR = Array.isArray(where.OR) ? [...where.OR, { authorId: { in: emailUserIds } }] : [{ authorId: { in: emailUserIds } }];
            }
          }
        } catch {}
      }
      // For company scope, default to ALL statuses unless explicitly requested
      if (statusParam) {
        where.status = statusParam as any;
      }
    }
    // For public/non-scoped queries default to PUBLISHED if status not provided
    if (!scope && !where.status) {
      where.status = (statusParam || 'PUBLISHED') as any;
    }

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { body: { contains: search } }
      ];
    }

    // Get posts with pagination
    const basePosts = await prisma.post.findMany({
      where,
      include: {
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } }
          }
        },
        tags: { select: { tag: true } },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            companyId: true,
            company: { select: { id: true, name: true, slug: true } }
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit,
      skip: cursor ? 1 : 0,
      ...(cursor && {
        cursor: {
          id: cursor
        }
      })
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('[company posts debug]', {
        scope,
        locale,
        resolvedCompany: { companyId: dbgCompanyId, companySlug: dbgCompanySlug },
        where,
        resultCount: basePosts.length,
        authorIds: basePosts.map(p => p.authorId),
        authorEmails: basePosts.map(p => p.author?.email),
      });
    }

    // Check if there are more posts
    const hasMore = basePosts.length === limit;
    const nextCursor = hasMore ? basePosts[basePosts.length - 1].id : null;

    if (!basePosts.length && process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        posts: [],
        hasMore: false,
        nextCursor: null,
        total: 0,
        debug: {
          scope,
          locale,
          where,
          resolvedCompany: { companyId: dbgCompanyId, companySlug: dbgCompanySlug },
          note: 'No posts matched the filters'
        }
      });
    }

    const ids = basePosts.map((p) => p.id);
    let translations: Array<{ postId: string; title: string; excerpt: string | null; body: string | null; slug: string }>; 
    translations = [];
    if (ids.length) {
      translations = await prisma.postTranslation.findMany({
        where: { postId: { in: ids }, locale },
        select: { postId: true, title: true, excerpt: true, body: true, slug: true },
      });
    }
    const tById = new Map(translations.map((t) => [t.postId, t]));
    const posts = basePosts.map((post) => {
      const tr = tById.get(post.id);
      if (!tr) return post;
      return {
        ...post,
        title: tr.title || post.title,
        excerpt: tr.excerpt ?? post.excerpt,
        slug: tr.slug || post.slug,
      };
    });

    return NextResponse.json({
      posts,
      hasMore,
      nextCursor,
      total: posts.length,
      debug: process.env.NODE_ENV !== 'production' ? {
        scope,
        locale,
        where,
        resolvedCompany: { companyId: dbgCompanyId, companySlug: dbgCompanySlug }
      } : undefined,
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      excerpt, 
      body: contentBody, 
      coverImage, 
      coverImageAlt,
      status = 'DRAFT',
      companyId,
      locale = 'ka',
      authorType = 'COMPANY',
      slug,
      categoryIds,
      translations,
      scope,
      date,
      metaTitle,
      metaDescription,
      coverImageAltTranslations,
    } = body;

    if (!title || !contentBody) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const userRole = (session.user as any)?.role;

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { companyId: true },
    });

    let finalCompanyId = companyId;
    if (userRole === 'COMPANY' && user?.companyId) {
      finalCompanyId = user.companyId;
    } else if (userRole === 'SPECIALIST' && user?.companyId) {
      finalCompanyId = user.companyId;
    }

    if (scope === 'specialist' && !['SPECIALIST', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (scope === 'company' && !['COMPANY', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ensure slug uniqueness per locale
    let finalSlug = slug;
    try {
      let counter = 1;
      // If slug is empty whitespace (shouldn't happen due to earlier check), fallback to title
      if (!finalSlug || !finalSlug.trim()) {
        finalSlug = title
          .toString()
          .toLowerCase()
          .normalize('NFKC')
          .replace(/["'’`]/g, '')
          .replace(/[^\p{L}\p{N}]+/gu, '-')
          .replace(/^-+|-+$/g, '')
          .replace(/-{2,}/g, '-');
      }
      // make unique within locale
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const exists = await prisma.post.findFirst({ where: { slug: finalSlug, locale } });
        if (!exists) break;
        finalSlug = `${finalSlug}-${counter++}`;
      }
    } catch {}

    // Ensure the author user exists (DB was reset). Upsert by ID from session.
    try {
      await prisma.user.upsert({
        where: { id: (session.user as any).id },
        update: {},
        create: {
          id: (session.user as any).id,
          email: (session.user as any).email ?? undefined,
          name: (session.user as any).name ?? undefined,
          role: ((session.user as any).role as any) ?? 'SUBSCRIBER',
        },
      });
    } catch {}

    // Calculate reading time from KA/base content
    const wordCount = String(contentBody || '')
      .replace(/<[^>]+>/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const readingTime = Math.max(1, Math.round(wordCount / 200));

    const post = await prisma.post.create({
      data: {
        title,
        slug: finalSlug,
        excerpt: excerpt || null,
        body: contentBody,
        coverImage: coverImage || null,
        coverImageAlt: coverImageAlt || null,
        status: status as any,
        authorType: userRole === 'SUPER_ADMIN' && !authorType ? ('SUPER_ADMIN' as any) : authorType,
        locale,
        publishedAt: status === 'PUBLISHED' ? (date ? new Date(date) : new Date()) : null,
        metaTitle: metaTitle ?? null,
        metaDescription: metaDescription ?? null,
        readingTime,
        author: { connect: { id: (session.user as any).id } },
        ...(finalCompanyId
          ? { company: { connect: { id: finalCompanyId } } }
          : {}),
        ...(Array.isArray(categoryIds) && categoryIds.length
          ? { categories: { create: categoryIds.map((cid: string) => ({ categoryId: cid })) } }
          : {}),
        ...(Array.isArray(translations) && translations.length
          ? {
              translations: {
                create: translations
                  .filter((t: any) => t?.locale && (t.title || t.body || t.excerpt))
                  .map((t: any) => ({
                    locale: t.locale,
                    title: t.title || title,
                    slug: t.slug || slug,
                    excerpt: t.excerpt ?? null,
                    body: t.body ?? null,
                    metaTitle: t.metaTitle ?? null,
                    metaDescription: t.metaDescription ?? null,
                    coverImageAlt:
                      (coverImageAltTranslations || []).find((alt: any) => alt?.locale === t.locale)?.alt ??
                      coverImageAlt ??
                      null,
                  })),
              },
            }
          : {}),
      },
      select: { id: true },
    });

    return NextResponse.json({ message: 'Post created successfully', post }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    const message = (error as any)?.message || 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
