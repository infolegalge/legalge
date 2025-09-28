import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import prisma from '@/lib/prisma';
import type { Locale } from '@/i18n/locales';
import NewsFeed from '../../NewsFeed';

interface CategoryPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<{
    cursor?: string;
  }>;
}

async function getCategoryData(slug: string, locale: Locale, cursor?: string) {
  // Get category
  const category = await prisma.category.findFirst({
    where: {
      slug,
      isPublic: true
    }
  });

  if (!category) {
    return null;
  }

  // Get posts in this category (show across locales; prefer translation in renderer)
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      categories: {
        some: {
          categoryId: category.id
        }
      }
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
        }
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        }
      },
      tags: {
        select: {
          tag: true
        }
      }
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

  // Get all categories for sidebar
  const categories = await prisma.category.findMany({
    where: {
      isPublic: true,
      OR: [
        { type: 'GLOBAL' },
        { companyId: null }
      ]
    },
    orderBy: {
      name: 'asc'
    }
  });

  return {
    category,
    posts,
    categories,
    hasMore: posts.length === 20,
    nextCursor: posts.length === 20 ? posts[posts.length - 1].id : null
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { locale, slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  const data = await getCategoryData(slug, locale, resolvedSearchParams.cursor);
  
  if (!data) {
    notFound();
  }

  const { category, posts, categories, hasMore, nextCursor } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link href={`/${locale}`} className="hover:text-foreground">
            {locale === 'ka' ? 'მთავარი' : locale === 'ru' ? 'Главная' : 'Home'}
          </Link>
          <span>/</span>
          <Link href={`/${locale}/news`} className="hover:text-foreground">
            {locale === 'ka' ? 'სიახლეები' : locale === 'ru' ? 'Новости' : 'News'}
          </Link>
          <span>/</span>
          <span className="text-foreground">{category.name}</span>
        </nav>

        {/* Back Button */}
        <Link
          href={`/${locale}/news`}
          className="inline-flex items-center text-sm text-primary hover:text-primary/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {locale === 'ka' ? 'სიახლეებზე დაბრუნება' : locale === 'ru' ? 'Вернуться к новостям' : 'Back to News'}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {category.name}
          </h1>
          <p className="mt-2 text-lg text-foreground/70">
            {locale === 'ka' 
              ? `ყველა სიახლე კატეგორიაში "${category.name}"`
              : locale === 'ru'
              ? `Все новости в категории "${category.name}"`
              : `All news in "${category.name}" category`
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <NewsFeed 
              initialPosts={posts}
              hasMore={hasMore}
              nextCursor={nextCursor}
              locale={locale}
              searchParams={{ category: slug }}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Categories */}
              <div className="bg-card rounded-lg shadow-sm border border-border p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {locale === 'ka' ? 'კატეგორიები' : locale === 'ru' ? 'Категории' : 'Categories'}
                </h3>
                
                <div className="space-y-2">
                  <Link
                    href={`/${locale}/news`}
                    className="block px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                  >
                    {locale === 'ka' ? 'ყველა' : locale === 'ru' ? 'Все' : 'All'}
                  </Link>
                  
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/${locale}/news/category/${cat.slug}`}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        cat.slug === slug
                          ? 'bg-primary/15 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* RSS Feed */}
              <div className="bg-card rounded-lg shadow-sm border border-border p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  RSS
                </h3>
                
                <div className="space-y-2">
                  <Link
                    href={`/${locale}/news/rss`}
                    className="block text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {locale === 'ka' ? 'ყველა სიახლე' : locale === 'ru' ? 'Все новости' : 'All News'}
                  </Link>
                  
                  <Link
                    href={`/${locale}/news/category/${category.slug}/rss`}
                    className="block text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {category.name}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
