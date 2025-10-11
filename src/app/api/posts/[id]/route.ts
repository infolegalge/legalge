import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        body: true,
        coverImage: true,
        metaTitle: true,
        metaDescription: true,
        status: true,
        publishedAt: true,
        authorType: true,
        authorId: true,
        companyId: true,
        locale: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
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

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      coverImageAlt,
      status,
      date,
      categoryIds,
      metaTitle,
      metaDescription,
      translations,
      coverImageAltTranslations,
    } = body as {
      title?: string;
      slug?: string;
      excerpt?: string | null;
      content?: string;
      coverImage?: string | null;
      coverImageAlt?: string | null;
      status?: 'DRAFT' | 'PUBLISHED';
      date?: string | null;
      categoryIds?: string[];
      metaTitle?: string | null;
      metaDescription?: string | null;
      translations?: Array<{
        locale: 'en' | 'ru' | 'ka';
        title?: string;
        slug?: string;
        excerpt?: string | null;
        body?: string | null;
        metaTitle?: string | null;
        metaDescription?: string | null;
      }>;
      coverImageAltTranslations?: Array<{ locale: 'ka' | 'en' | 'ru'; alt?: string | null }>;
    };

    // Check if post exists and user has permission
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        body: true,
        excerpt: true,
        coverImage: true,
        coverImageAlt: true,
        status: true,
        authorId: true,
        companyId: true,
        locale: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check permissions based on new role system
    const userRole = (session.user as any)?.role;
    const isAuthor = existingPost.authorId === (session.user as any).id;
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const isCompany = userRole === 'COMPANY';
    const isSpecialist = userRole === 'SPECIALIST';
    
    // Get user's company if they have one
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { companyId: true },
    });

    let effectiveCompanyId = existingPost.companyId ?? user?.companyId ?? null;

    // Check if user's company matches post's company
    const isSameCompany = user?.companyId && existingPost.companyId && user.companyId === existingPost.companyId;
    
    // Permission logic
    const canEdit = isSuperAdmin || 
                   isAuthor || 
                   (isCompany && isSameCompany) ||
                   (isSpecialist && isAuthor) ||
                   (existingPost.authorId === null && (isSpecialist || isCompany));
    
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.body = content;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (coverImageAlt !== undefined) updateData.coverImageAlt = coverImageAlt;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED') {
        updateData.publishedAt = new Date();
      }
    }
    if (date !== undefined) {
      updateData.publishedAt = date ? new Date(date) : null;
    }

    // If post has no author and current user has appropriate role, assign them as author
    if (existingPost.authorId === null && (isSpecialist || isCompany)) {
      updateData.authorId = (session.user as any).id;
    }

    // Update slug if title changed
    if (slug) {
      updateData.slug = slug;
    } else if (title && title !== existingPost.title) {
      const newSlugBase = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Ensure uniqueness per locale by checking compound unique [slug, locale]
      let finalSlug = newSlugBase;
      let counter = 1;
      while (true) {
        const exists = await prisma.post.findFirst({
          where: { slug: finalSlug },
          select: { id: true },
        });
        if (!exists) break;
        finalSlug = `${newSlugBase}-${counter++}`;
      }
      updateData.slug = finalSlug;
    }

    let finalCompanyId: string | null = null;

    if (Array.isArray(categoryIds)) {
      if (!finalCompanyId && existingPost.companyId) {
        finalCompanyId = existingPost.companyId;
      }

      if (!finalCompanyId && user?.companyId) {
        finalCompanyId = user.companyId;
      }

      const dbCategories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, type: true, companyId: true },
      });

      if (dbCategories.length !== categoryIds.length) {
        return NextResponse.json({ error: 'One or more categories are invalid.' }, { status: 400 });
      }

      for (const category of dbCategories) {
        if (category.type === 'GLOBAL') {
          continue;
        }

        if (category.type === 'COMPANY') {
          if (!finalCompanyId || category.companyId !== finalCompanyId) {
            return NextResponse.json({ error: 'You cannot use categories that belong to another company.' }, { status: 403 });
          }
          continue;
        }

        return NextResponse.json({ error: 'Unsupported category type.' }, { status: 400 });
      }
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...updateData,
        ...(Array.isArray(categoryIds)
          ? {
              categories: {
                deleteMany: {},
                create: categoryIds.map((cid) => ({ categoryId: cid })),
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        body: true,
        coverImage: true,
        coverImageAlt: true,
        metaTitle: true,
        metaDescription: true,
        status: true,
        publishedAt: true,
        authorId: true,
        companyId: true,
      },
    });

    // Upsert translations if provided
    if (Array.isArray(translations)) {
      for (const t of translations) {
        if (!t?.locale) continue;
        const existing = await prisma.postTranslation.findUnique({
          where: { postId_locale: { postId: id, locale: t.locale as any } },
        });
        const baseTitle = title ?? post.title;
        const baseSlug = post.slug;
        const translationAlt = coverImageAltTranslations?.find((alt) => alt.locale === t.locale)?.alt;
        const payload = {
          postId: id,
          locale: t.locale as any,
          title: t.title || baseTitle,
          slug: t.slug || baseSlug,
          excerpt: t.excerpt ?? null,
          body: t.body ?? null,
          metaTitle: t.metaTitle ?? null,
          metaDescription: t.metaDescription ?? null,
          coverImageAlt:
            translationAlt !== undefined
              ? translationAlt || null
              : coverImageAlt !== undefined
              ? coverImageAlt
              : existingPost.coverImageAlt ?? null,
        };
        if (existing) {
          await prisma.postTranslation.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.postTranslation.create({ data: payload });
        }
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
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

    const { id } = await params;

    // Check if post exists and user has permission
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true, companyId: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check permissions based on new role system
    const userRole = (session.user as any)?.role;
    const isAuthor = existingPost.authorId === (session.user as any).id;
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const isCompany = userRole === 'COMPANY';
    const isSpecialist = userRole === 'SPECIALIST';
    
    // Get user's company if they have one
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { companyId: true },
    });
    
    // Check if user's company matches post's company
    const isSameCompany = user?.companyId && existingPost.companyId && user.companyId === existingPost.companyId;
    
    const canEdit = isSuperAdmin || 
                   isAuthor || 
                   (isCompany && isSameCompany) ||
                   (isSpecialist && isAuthor) ||
                   (existingPost.authorId === null && (isSpecialist || isCompany));
    
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

