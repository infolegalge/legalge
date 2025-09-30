import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect, notFound } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import prisma from "@/lib/prisma";
import AdminEditPostForm from "./AdminEditPostForm";

export default async function AdminEditPostPage({ 
  params 
}: { 
  params: Promise<{ locale: Locale; id: string }> 
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
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
    },
  });

  if (!post) {
    notFound();
  }

  // Fetch translations separately to avoid Prisma select issues when schema changes
  let translations: any[] = [];
  try {
    const client: any = prisma as any;
    if (client.postTranslation && typeof client.postTranslation.findMany === 'function') {
      translations = await client.postTranslation.findMany({
        where: { postId: id },
        select: {
          id: true,
          locale: true,
          title: true,
          slug: true,
          excerpt: true,
          body: true,
          metaTitle: true,
          metaDescription: true,
          ogTitle: true,
          ogDescription: true,
        },
      });
    }
  } catch {}

  const mapped = {
    ...post,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
  } as any;

  return <AdminEditPostForm locale={locale} post={mapped} translations={translations} />;
}

export const dynamic = "force-dynamic";




