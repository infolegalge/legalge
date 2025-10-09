import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';
import type { Locale } from '@/i18n/locales';
import NewsFeed from './NewsFeed';
import NewsSidebar from './NewsSidebar';
import type { Metadata } from 'next';
import { createLocaleRouteMetadata } from '@/lib/metadata';
import { buildBreadcrumbLd } from '@/lib/structuredData';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  
  const titles = {
    ka: 'სიახლეები და სამართლებრივი ანალიზი',
    en: 'Legal News and Insights',
    ru: 'Правовые новости и аналитика'
  };
  
  const descriptions = {
    ka: 'მიიღეთ უახლესი სამართლებრივი სიახლეები, მიგრაციის, ბიზნესისა და საგადასახადო ცვლილებების აქცენტები.',
    en: 'Stay updated on Georgian legal reforms, investment rules, and migration policy changes.',
    ru: 'Следите за правовыми реформами Грузии, инвестиционными правилами и изменениями миграционной политики.'
  };

  const metadata = createLocaleRouteMetadata(locale, 'news', {
    title: titles[locale],
    description: descriptions[locale],
  });

  metadata.alternates = {
    ...(metadata.alternates ?? {}),
    types: {
      ...(metadata.alternates?.types ?? {}),
      'application/rss+xml': `/${locale}/news/rss`,
    },
  };

  return metadata;
}

interface NewsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    category?: string;
    author?: string;
    company?: string;
    search?: string;
    cursor?: string;
  }>;
}

async function getNewsData(locale: Locale, searchParams: any) {
  const { category, author, company, search, cursor } = searchParams;
  
  // Build where clause
  const where: any = {
    status: 'PUBLISHED',
  };

  // Category filter
  if (category) {
    where.categories = { some: { category: { slug: category } } };
  }

  // Add author filter
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

  // Add search filter
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { excerpt: { contains: search } },
      { content: { contains: search } }
    ];
  }

  // Get posts with pagination
  const posts = await prisma.post.findMany({
    where,
    include: {
      categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
      tags: { select: { tag: true } },
      author: { select: { id: true, name: true, company: { select: { id: true, name: true, slug: true } } } }
    },
    orderBy: {
      publishedAt: 'desc'
    },
    take: 20,
    skip: cursor ? 1 : 0,
    ...(cursor && {
      cursor: {
        id: cursor
      }
    })
  });

  // Get top 4 categories by post count for the sidebar block
  const categoriesAgg = await prisma.postCategory.groupBy({
    by: ['categoryId'],
    _count: { categoryId: true },
    orderBy: { _count: { categoryId: 'desc' } },
    take: 4,
  });
  const categoryIds = categoriesAgg.map(c => c.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, slug: true, type: true },
  });

  // Fetch translations for these posts for requested locale and map
  const postIds = posts.map((p) => p.id);
  let translations: any[] = [];
  try {
    const client: any = prisma as any;
    if (postIds.length && client.postTranslation && typeof client.postTranslation.findMany === 'function') {
      translations = await client.postTranslation.findMany({
        where: { postId: { in: postIds }, locale },
        select: { postId: true, title: true, excerpt: true },
      });
    }
  } catch {}
  const tByPostId = new Map<string, any>(translations.map((t: any) => [t.postId, t]));
  const mappedPosts = posts.map((p: any) => {
    const t = tByPostId.get(p.id);
    return t ? { ...p, title: t.title || p.title, excerpt: t.excerpt || p.excerpt } : p;
  });

  return {
    posts: mappedPosts,
    categories: categories.map((category) => ({
      ...category,
      type: (category.type ?? 'GLOBAL') as 'GLOBAL' | 'COMPANY',
    })),
    hasMore: posts.length === 20,
    nextCursor: posts.length === 20 ? posts[posts.length - 1].id : null
  };
}

export default async function NewsPage({ params, searchParams }: NewsPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  
  const { posts, categories, hasMore, nextCursor } = await getNewsData(locale, resolvedSearchParams);

  const breadcrumbLd = buildBreadcrumbLd([
    { name: 'Home', url: 'https://www.legal.ge' },
    { name: locale.toUpperCase(), url: `https://www.legal.ge/${locale}` },
    { name: 'News', url: `https://www.legal.ge/${locale}/news` },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {locale === 'ka' ? 'სიახლეები' : locale === 'ru' ? 'Новости' : 'News'}
              </h1>
              <p className="mt-2 text-lg text-foreground/70">
                {locale === 'ka' 
                  ? 'უახლესი სამართლებრივი სიახლეები და ანალიზი'
                  : locale === 'ru'
                  ? 'Последние правовые новости и анализ'
                  : 'Latest legal news and analysis'
                }
              </p>
            </div>
            <a
              href={`/${locale}/news/rss`}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              title={locale === 'ka' ? 'RSS ფიდზე გამოწერა' : locale === 'ru' ? 'Подписаться на RSS' : 'Subscribe to RSS'}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.75 3a.75.75 0 00-.75.75v.75c0 .414.336.75.75.75H4c6.075 0 11 4.925 11 11v.75c0 .414.336.75.75.75h.75a.75.75 0 00.75-.75v-.75A13.5 13.5 0 0010.5 3.75H11a.75.75 0 00.75-.75v-.75a.75.75 0 00-.75-.75h-.75zM3.75 9a.75.75 0 00-.75.75v.75c0 .414.336.75.75.75H4a7.5 7.5 0 017.5 7.5v.75c0 .414.336.75.75.75h.75a.75.75 0 00.75-.75v-.75a9 9 0 00-9-9h-.25zM4 12a1 1 0 100 2 1 1 0 000-2zm3 0a1 1 0 100 2 1 1 0 000-2zm3 0a1 1 0 100 2 1 1 0 000-2z"/>
              </svg>
              RSS
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Suspense fallback={<div>Loading news...</div>}>
              <NewsFeed 
                initialPosts={posts}
                hasMore={hasMore}
                nextCursor={nextCursor}
                locale={locale}
                searchParams={resolvedSearchParams}
              />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Suspense fallback={<div>Loading sidebar...</div>}>
              <NewsSidebar 
                categories={categories}
                locale={locale}
                searchParams={resolvedSearchParams}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';