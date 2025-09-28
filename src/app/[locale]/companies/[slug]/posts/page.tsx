import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import { fetchCompany } from "@/lib/specialists";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import prisma from "@/lib/prisma";

interface CompanyPostsPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<{
    category?: string;
    search?: string;
    cursor?: string;
  }>;
}

async function getCompanyPosts(locale: Locale, companySlug: string, searchParams: any) {
  const { category, search, cursor } = searchParams;
  
  // First get the company
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, name: true, slug: true }
  });

  if (!company) {
    return null;
  }

  // Build where clause for posts
  const where: any = {
    status: 'PUBLISHED',
    locale: locale,
    OR: [
      // Posts authored by the company
      {
        authorType: 'COMPANY',
        companyId: company.id
      },
      // Posts authored by specialists in this company
      {
        authorType: 'SPECIALIST',
        companyId: company.id
      }
    ]
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

    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        { OR: searchConditions }
      ];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
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
    company,
    posts,
    totalPosts,
    categories,
    hasMore: skip + limit < totalPosts,
    nextCursor: skip + limit < totalPosts ? (skip + limit).toString() : null
  };
}

export async function generateMetadata({ params }: CompanyPostsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await fetchCompany(slug);
  
  if (!company) {
    return {
      title: "Company Not Found",
    };
  }

  return {
    title: `${company.name} - Posts`,
    description: `All posts and articles by ${company.name} and their legal specialists.`,
    openGraph: {
      title: `${company.name} - Posts`,
      description: `All posts and articles by ${company.name} and their legal specialists.`,
      images: company.logoUrl ? [{ url: company.logoUrl, alt: company.name }] : [],
    },
  };
}

export default async function CompanyPostsPage({ params, searchParams }: CompanyPostsPageProps) {
  const { locale, slug } = await params;
  const searchParamsData = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  
  const data = await getCompanyPosts(locale, slug, searchParamsData);
  
  if (!data) {
    notFound();
  }

  const { company, posts, totalPosts, categories, hasMore, nextCursor } = data;

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

  const getAuthorDisplay = (post: any) => {
    if (post.authorType === 'COMPANY' && post.company) {
      return {
        name: post.company.name,
        type: 'company',
        slug: post.company.slug
      };
    } else if (post.authorType === 'SPECIALIST') {
      // For specialists, we'll need to fetch the specialist data
      // For now, we'll show a generic specialist name
      return {
        name: 'Specialist',
        type: 'specialist',
        slug: null
      };
    }
    return null;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-foreground">
          {t("common.home")}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/companies`} className="hover:text-foreground">
          {t("companies.title")}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/companies/${company.slug}`} className="hover:text-foreground">
          {company.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">
          {locale === 'ka' ? 'პოსტები' : locale === 'ru' ? 'Посты' : 'Posts'}
        </span>
      </nav>

      {/* Back button */}
      <Link
        href={`/${locale}/companies/${company.slug}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === 'ka' ? 'კომპანიაზე დაბრუნება' : locale === 'ru' ? 'Назад к компании' : 'Back to Company'}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            {locale === 'ka' 
              ? `${company.name} - პოსტები`
              : locale === 'ru'
              ? `${company.name} - Посты`
              : `${company.name} - Posts`
            }
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          {locale === 'ka' 
            ? `ყველა სტატია და პოსტი ${company.name}-ის მიერ და მათი იურიდიული სპეციალისტების მიერ`
            : locale === 'ru'
            ? `Все статьи и посты от ${company.name} и их юридических специалистов`
            : `All articles and posts by ${company.name} and their legal specialists`
          }
        </p>
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
          {posts.map((post) => {
            const author = getAuthorDisplay(post);
            
            return (
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
                      {author && (
                        <div className="flex items-center space-x-1">
                          <Building2 className="h-4 w-4" />
                          <span className="font-medium">{author.name}</span>
                        </div>
                      )}

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
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/companies/${company.slug}/posts?cursor=${nextCursor}`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {locale === 'ka' ? 'მეტი პოსტის ნახვა' : locale === 'ru' ? 'Показать больше постов' : 'Load More Posts'}
          </Link>
        </div>
      )}
    </div>
  );
}
