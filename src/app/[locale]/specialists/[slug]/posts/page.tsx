import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import prisma from "@/lib/prisma";
import { createLocaleRouteMetadata, LocalePathMap } from "@/lib/metadata";

interface SpecialistPostsPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<{
    category?: string;
    search?: string;
    cursor?: string;
  }>;
}

async function getSpecialistPosts(locale: Locale, specialistSlug: string, searchParams: any) {
  const { category, search, cursor } = searchParams;
  
  // First get the specialist
  const specialist = await prisma.specialistProfile.findUnique({
    where: { slug: specialistSlug },
    select: { 
      id: true, 
      name: true, 
      slug: true, 
      role: true,
      contactEmail: true,
      translations: {
        select: {
          locale: true,
          slug: true,
        },
      },
      company: {
        select: { id: true, name: true, slug: true }
      }
    }
  });

  if (!specialist) {
    return null;
  }

  // Get the user associated with this specialist by matching contact email
  const user = specialist.contactEmail 
    ? await prisma.user.findFirst({
        where: { 
          role: 'SPECIALIST',
          email: specialist.contactEmail
        },
        select: { id: true }
      })
    : null;

  if (!user) {
    return null;
  }

  // Build where clause for posts
  const where: any = {
    status: 'PUBLISHED',
    locale: locale,
    authorType: 'SPECIALIST',
    authorId: user.id
  };

  // Add category filter
  if (category) {
    where.categories = {
      some: {
        category: {
          slug: category
        }
      }
    };
  }

  // Add search filter
  if (search) {
    const searchConditions = [
      { title: { contains: search } },
      { excerpt: { contains: search } },
      { body: { contains: search } }
    ];

    where.OR = searchConditions;
  }

  // Pagination
  const limit = 20;
  const skip = cursor ? parseInt(cursor) : 0;

  // Get posts with pagination
  const [posts, totalPosts, categories] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, slug: true, logoUrl: true } },
        categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
        tags: { select: { tag: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.post.count({ where }),
    prisma.category.findMany({
      where: { isPublic: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' }
    })
  ]);

  return {
    specialist,
    posts,
    totalPosts,
    categories,
    hasMore: skip + limit < totalPosts,
    nextCursor: skip + limit < totalPosts ? (skip + limit).toString() : null
  };
}

export async function generateMetadata({ params }: SpecialistPostsPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getSpecialistPosts(locale, slug, {});
  
  if (!data) {
    return createLocaleRouteMetadata(locale, ["specialists", slug, "posts"], {
      title: "Specialist Not Found",
    });
  }

  const { specialist } = data;
  const languagesOverrides: LocalePathMap | undefined = specialist.translations
    ? specialist.translations.reduce((acc, translation) => {
        if (translation.slug) {
          acc[translation.locale as Locale] = ["specialists", translation.slug, "posts"];
        }
        return acc;
      }, {} as LocalePathMap)
    : undefined;

  return createLocaleRouteMetadata(locale, ["specialists", specialist.slug, "posts"], {
    title: `${specialist.name} - Posts`,
    description: `All posts and articles by ${specialist.name}, ${specialist.role}.`,
    openGraph: {
      title: `${specialist.name} - Posts`,
      description: `All posts and articles by ${specialist.name}, ${specialist.role}.`,
    },
  }, languagesOverrides);
}

export default async function SpecialistPostsPage({ params, searchParams }: SpecialistPostsPageProps) {
  const { locale, slug } = await params;
  const searchParamsData = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  
  const data = await getSpecialistPosts(locale, slug, searchParamsData);
  
  if (!data) {
    notFound();
  }

  const { specialist, posts, totalPosts, categories, hasMore, nextCursor } = data;

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    
    const monthNames = {
      ka: ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 
           'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'],
      en: ['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December'],
      ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
           'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
    };
    
    const monthName = monthNames[locale as keyof typeof monthNames]?.[month] || monthNames.en[month];
    
    if (locale === 'ka') {
      return `${day} ${monthName}, ${year}`;
    } else if (locale === 'ru') {
      return `${day} ${monthName}, ${year}`;
    } else {
      return `${monthName} ${day}, ${year}`;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-foreground">
          {t("common.home")}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/specialists`} className="hover:text-foreground">
          {t("nav.specialists")}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/specialists/${specialist.slug}`} className="hover:text-foreground">
          {specialist.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">
          {locale === 'ka' ? 'პოსტები' : locale === 'ru' ? 'Посты' : 'Posts'}
        </span>
      </nav>

      {/* Back button */}
      <Link
        href={`/${locale}/specialists/${specialist.slug}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === 'ka' ? 'სპეციალისტზე დაბრუნება' : locale === 'ru' ? 'Назад к специалисту' : 'Back to Specialist'}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            {locale === 'ka' 
              ? `${specialist.name} - პოსტები`
              : locale === 'ru'
              ? `${specialist.name} - Посты`
              : `${specialist.name} - Posts`
            }
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          {locale === 'ka' 
            ? `ყველა სტატია და პოსტი ${specialist.name}-ის მიერ, ${specialist.role}`
            : locale === 'ru'
            ? `Все статьи и посты от ${specialist.name}, ${specialist.role}`
            : `All articles and posts by ${specialist.name}, ${specialist.role}`
          }
        </p>
        {specialist.company && (
          <p className="text-sm text-gray-500 mt-2">
            {locale === 'ka' 
              ? `${specialist.company.name}-ში`
              : locale === 'ru'
              ? `в ${specialist.company.name}`
              : `at ${specialist.company.name}`
            }
          </p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          {totalPosts} {locale === 'ka' ? 'პოსტი' : locale === 'ru' ? 'постов' : 'posts'}
        </p>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {locale === 'ka' 
              ? 'პოსტები ჯერ არ არის ხელმისაწვდომი'
              : locale === 'ru'
              ? 'Посты пока недоступны'
              : 'No posts available yet'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Categories */}
                {post.categories && post.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.categories.map(({ category }) => (
                      <Link
                        key={category.id}
                        href={`/${locale}/news/category/${category.slug}`}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  <Link 
                    href={`/${locale}/news/${post.slug}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {post.title}
                  </Link>
                </h2>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                )}

                {/* Meta Information */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    {/* Author */}
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{specialist.name}</span>
                    </div>

                    {/* Date */}
                    {post.publishedAt && (
                      <div className="flex items-center space-x-1">
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                    )}

                    {/* Reading Time */}
                    {post.readingTime && (
                      <div className="flex items-center space-x-1">
                        <span>{post.readingTime} {locale === 'ka' ? 'წუთი' : locale === 'ru' ? 'мин' : 'min'}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    {post.viewCount} {locale === 'ka' ? 'ნახვა' : locale === 'ru' ? 'просмотров' : 'views'}
                  </div>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {post.tags.map(({ tag }, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/specialists/${specialist.slug}/posts?cursor=${nextCursor}`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {locale === 'ka' ? 'მეტი პოსტის ნახვა' : locale === 'ru' ? 'Показать больше постов' : 'Load More Posts'}
          </Link>
        </div>
      )}
    </div>
  );
}
