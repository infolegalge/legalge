import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect, notFound } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import prisma from "@/lib/prisma";
import CompanyEditPostForm from "./CompanyEditPostForm";

export default async function CompanyEditPostPage({ 
  params 
}: { 
  params: Promise<{ locale: Locale; id: string }> 
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/auth/signin');
  }
  
  const userRole = (session.user as any)?.role;
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { companyId: true },
  });
  const userCompanyId = user?.companyId;
  
  if (userRole !== 'COMPANY' && userRole !== 'SUPER_ADMIN') {
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
      companyId: true,
      metaTitle: true,
      metaDescription: true,
      ogTitle: true,
      ogDescription: true,
      categories: {
        select: {
          categoryId: true,
          category: {
            select: { name: true }
          }
        }
      },
    },
  });

  if (!post) {
    notFound();
  }

  // Check if company admin can edit this post
  if (userRole === 'COMPANY' && post.companyId !== userCompanyId) {
    redirect('/company');
  }

  const mapped = {
    ...post,
    date: post.publishedAt ? post.publishedAt.toISOString() : null,
    content: post.body,
    coverImageUrl: post.coverImage,
    categories: post.categories?.map((c) => ({ id: c.categoryId, name: c.category?.name || '' })) ?? [],
  } as any;

  // Fetch translations for this post
  let translations: Array<{ locale: 'ka'|'en'|'ru'; title: string; slug: string; excerpt: string | null; body: string | null; metaTitle?: string | null | undefined; metaDescription?: string | null | undefined; ogTitle?: string | null | undefined; ogDescription?: string | null | undefined }> = [];
  try {
    translations = await prisma.postTranslation.findMany({
      where: { postId: id },
      select: {
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
    }) as any;
  } catch {}

  const normalizedTranslations = translations.map((t) => ({
    locale: t.locale,
    title: t.title,
    slug: t.slug,
    excerpt: t.excerpt,
    body: t.body,
    metaTitle: t.metaTitle ?? undefined,
    metaDescription: t.metaDescription ?? undefined,
    ogTitle: t.ogTitle ?? undefined,
    ogDescription: t.ogDescription ?? undefined,
  }));

  return <CompanyEditPostForm locale={locale} post={mapped} translations={normalizedTranslations} />;
}

export const dynamic = "force-dynamic";
