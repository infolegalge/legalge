import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect, notFound } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import prisma from "@/lib/prisma";
import SpecialistEditPostForm from "./SpecialistEditPostForm";

export default async function SpecialistEditPostPage({ 
  params 
}: { 
  params: Promise<{ locale: Locale; id: string }> 
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/');
  }

  const { locale, id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      body: true,
      coverImage: true,
      status: true,
      publishedAt: true,
      locale: true,
      authorId: true,
      metaTitle: true,
      metaDescription: true,
      ogTitle: true,
      ogDescription: true,
      categories: {
        select: {
          categoryId: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  // Check if the current user is allowed to edit this post
  const userRole = (session.user as any)?.role;
  const isAuthor = post.authorId === (session.user as any)?.id;
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  if (!isAuthor && !isSuperAdmin) {
    redirect('/');
  }

  // Fetch translations for language tabs
  const translations = await prisma.postTranslation.findMany({
    where: { postId: id },
    select: {
      locale: true,
      title: true,
      excerpt: true,
      body: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      ogTitle: true,
      ogDescription: true,
    },
  });

  const mapped = { 
    ...post, 
    date: post.publishedAt ? post.publishedAt.toISOString() : null,
    content: post.body,
    coverImageUrl: post.coverImage,
    categories: post.categories?.map((c) => ({ id: c.categoryId, name: c.category?.name ?? '' })) ?? [],
    translations,
  } as any;

  return <SpecialistEditPostForm locale={locale} post={mapped} />;
}

export const dynamic = "force-dynamic";
