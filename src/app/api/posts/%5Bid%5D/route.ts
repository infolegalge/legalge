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
        coverImageAlt: true,
        status: true,
        publishedAt: true,
        authorType: true,
        authorId: true,
        companyId: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      excerpt,
      body: contentBody,
      coverImage,
      coverImageAlt,
      status,
      slug,
      translations,
      coverImageAltTranslations,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (contentBody !== undefined) updateData.body = contentBody;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (coverImageAlt !== undefined) updateData.coverImageAlt = coverImageAlt;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.post.update({
      where: { id },
      data: updateData,
      select: { id: true, coverImageAlt: true },
    });

    if (Array.isArray(translations)) {
      for (const t of translations) {
        if (!t?.locale) continue;
        const existing = await prisma.postTranslation.findUnique({
          where: { postId_locale: { postId: id, locale: t.locale as any } },
        });
        const payload = {
          postId: id,
          locale: t.locale as any,
          title: t.title ?? null,
          slug: t.slug ?? null,
          excerpt: t.excerpt ?? null,
          body: t.body ?? null,
          coverImageAlt:
            coverImageAltTranslations?.find((item: any) => item.locale === t.locale)?.alt ??
            (coverImageAlt !== undefined ? coverImageAlt : updated.coverImageAlt) ??
            null,
        };
        if (existing) {
          await prisma.postTranslation.update({ where: { id: existing.id }, data: payload });
        } else {
          await prisma.postTranslation.create({ data: payload });
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
