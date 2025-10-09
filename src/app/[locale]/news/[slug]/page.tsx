import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, User, Building2, ArrowLeft, Facebook, Linkedin, Twitter } from 'lucide-react';
import prisma from '@/lib/prisma';
import type { Locale } from '@/i18n/locales';
import RichText from '@/components/RichText';
import type { Metadata } from 'next';
import { createLocaleRouteMetadata, LocalePathMap } from "@/lib/metadata";
import { stripHtml } from "@/lib/utils";
import { buildArticleLd, buildBreadcrumbLd } from '@/lib/structuredData';

interface PostPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

async function getPost(slug: string, locale: Locale) {
  // Decode percent-encoded slug to support Georgian/Unicode slugs copied from address bar
  try {
    slug = decodeURIComponent(slug);
  } catch {}

  // First try to match a base post by the current locale/slug. If not found,
  // resolve through translations so /en/news/<translated-slug> works.
  let post = await prisma.post.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      categories: {
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          }
        }
      },
      tags: {
        select: { tag: true }
      },
      author: {
        select: {
          id: true,
          name: true,
          company: { select: { id: true, name: true, slug: true } }
        }
      }
    }
  });

  if (!post) {
    // Look up by translation slug
    try {
      const t = await (prisma as any).postTranslation.findFirst({
        where: { locale, slug },
        select: { postId: true },
      });
      if (t?.postId) {
        post = await prisma.post.findUnique({
          where: { id: t.postId },
          include: {
            categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
            tags: { select: { tag: true } },
            author: { select: { id: true, name: true, company: { select: { id: true, name: true, slug: true } } } },
          },
        });
      }
    } catch {}
  }

  if (!post) return null;

  // Prefer translation if available for requested locale
  let t: any = null;
  try {
    const client: any = prisma as any;
    if (client.postTranslation && typeof client.postTranslation.findUnique === 'function') {
      t = await client.postTranslation.findUnique({
        where: { postId_locale: { postId: post.id, locale } },
        select: { title: true, excerpt: true, body: true },
      });
    }
  } catch {}
  if (t) {
    (post as any).title = t.title || post.title;
    (post as any).excerpt = t.excerpt || post.excerpt;
    (post as any).body = t.body || post.body;
  }

  // View count not implemented in current schema
  // await prisma.post.update({
  //   where: { id: post.id },
  //   data: { viewCount: { increment: 1 } }
  // });

  return post;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const resolvedSlug = decodeURIComponent(slug);
    const post = await prisma.post.findFirst({
      where: { slug: resolvedSlug, status: 'PUBLISHED' },
      select: {
        title: true,
        excerpt: true,
        coverImage: true,
        coverImageAlt: true,
        slug: true,
        id: true,
        publishedAt: true,
        updatedAt: true,
        author: { select: { name: true } },
      },
    });
    if (!post) return createLocaleRouteMetadata(locale, ["news", slug], { title: 'News' });

    const translations: LocalePathMap = {};
    let localizedTitle = post.title;
    let localizedExcerpt = post.excerpt ?? '';
    let translatedSlug: string | null = null;
    try {
      const client: any = prisma as any;
      if (client.postTranslation && typeof client.postTranslation.findMany === 'function') {
        const allTranslations = await client.postTranslation.findMany({
          where: { postId: post.id },
          select: { locale: true, slug: true, title: true, excerpt: true },
        });
        for (const translation of allTranslations) {
          if (translation.slug) {
            translations[translation.locale as Locale] = ["news", translation.slug];
          }
          if (translation.locale === locale) {
            translatedSlug = translation.slug || null;
            localizedTitle = translation.title || localizedTitle;
            localizedExcerpt = translation.excerpt ?? localizedExcerpt;
          }
        }
      } else {
        const t = await client.postTranslation.findUnique({
          where: { postId_locale: { postId: post.id, locale } },
          select: { slug: true, title: true, excerpt: true },
        });
        translatedSlug = t?.slug || null;
        localizedTitle = t?.title || localizedTitle;
        localizedExcerpt = t?.excerpt ?? localizedExcerpt;
      }
    } catch {}
    const canonicalSlug = translatedSlug || post.slug;
    const rawDescription = stripHtml(localizedExcerpt || '') || '';
    const description = rawDescription ? rawDescription.slice(0, 160) : `Latest legal insight on ${canonicalSlug.replace(/-/g, ' ')}.`;

    if (!translations[locale]) {
      translations[locale] = ["news", canonicalSlug];
    }

    const metadata = createLocaleRouteMetadata(locale, ["news", canonicalSlug], {
      title: localizedTitle,
      description,
    }, translations);

    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.legal.ge';
    const img = post.coverImage ? (post.coverImage.startsWith('http') ? post.coverImage : `${site}${post.coverImage}`) : undefined;
    const imgAlt = post.coverImageAlt || post.title;

    const previousOpenGraph = metadata.openGraph ?? {};
    metadata.openGraph = {
      ...previousOpenGraph,
      type: 'article',
      title: localizedTitle,
      description,
      locale,
      url: `${site}/${locale}/news/${canonicalSlug}`,
      siteName: 'Legal Sandbox Georgia',
      publishedTime: post.publishedAt ? post.publishedAt.toISOString() : undefined,
      modifiedTime: post.updatedAt ? post.updatedAt.toISOString() : undefined,
      images: img
        ? [{ url: img, width: 1200, height: 630, alt: imgAlt }]
        : previousOpenGraph.images,
    };

    const previousTwitter = metadata.twitter ?? {};
    metadata.twitter = {
      ...previousTwitter,
      card: 'summary_large_image',
      title: localizedTitle,
      description,
      images: img ? [img] : previousTwitter.images,
    };

    const publishedISO = post.publishedAt ? post.publishedAt.toISOString() : undefined;
    const modifiedISO = post.updatedAt ? post.updatedAt.toISOString() : undefined;
    const existingOtherEntries = metadata.other
      ? Object.entries(metadata.other).filter(([, value]) => value !== undefined && value !== null)
      : [];
    const filteredOther = Object.fromEntries(existingOtherEntries) as Record<string, string | number | (string | number)[]>;
    if (publishedISO) {
      filteredOther['article:published_time'] = publishedISO;
    }
    if (modifiedISO) {
      filteredOther['article:modified_time'] = modifiedISO;
    }
    if (post.author?.name) {
      filteredOther['article:author'] = post.author.name;
    }
    metadata.other = filteredOther;

    return metadata;
  } catch {
    return createLocaleRouteMetadata(locale, ["news", slug], { title: 'News' });
  }
}

async function getRelatedPosts(postId: string, categoryIds: string[], companyId: string | null, locale: Locale) {
  const where: any = {
    id: { not: postId },
    status: 'PUBLISHED'
  };

  // Get posts from same company (categories not implemented in current schema)
  // Company relation usage omitted

  return await prisma.post.findMany({
    where,
    include: {
    },
    orderBy: {
      publishedAt: 'desc'
    },
    take: 3
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { locale, slug } = await params;
  
  const post = await getPost(slug, locale);
  
  if (!post) {
    notFound();
  }

  const canonicalUrl = `https://www.legal.ge/${locale}/news/${post.slug}`;
  const articleLd = buildArticleLd({
    title: post.title,
    description: post.excerpt || undefined,
    url: canonicalUrl,
    image: post.coverImage ? (post.coverImage.startsWith('http') ? post.coverImage : `https://www.legal.ge${post.coverImage}`) : undefined,
    datePublished: post.publishedAt?.toISOString() ?? null,
    dateModified: post.updatedAt?.toISOString() ?? null,
    authorName: post.author?.name ?? null,
    locale,
  });
  const breadcrumbLd = buildBreadcrumbLd([
    { name: 'Home', url: 'https://www.legal.ge' },
    { name: locale.toUpperCase(), url: `https://www.legal.ge/${locale}` },
    { name: 'News', url: `https://www.legal.ge/${locale}/news` },
    { name: post.title, url: canonicalUrl },
  ]);

  // Canonicalize URL slug per locale: if a translated slug exists for the
  // requested locale (or base slug differs from the incoming one) redirect.
  try {
    const currentSlug = decodeURIComponent(slug);
    let translated: any = null;
    try {
      const client: any = prisma as any;
      if (client.postTranslation && typeof client.postTranslation.findUnique === 'function') {
        translated = await client.postTranslation.findUnique({
          where: { postId_locale: { postId: post.id, locale } },
          select: { slug: true },
        });
      }
    } catch {}
    const canonicalSlug = translated?.slug || post.slug;
    if (canonicalSlug && currentSlug !== canonicalSlug) {
      const next = `/${locale}/news/${encodeURIComponent(canonicalSlug)}`;
      redirect(next);
    }
  } catch {}

  const categoryIds = post.categories ? post.categories.map(pc => pc.category.id) : [];
  const relatedPosts = await getRelatedPosts(post.id, categoryIds, null, locale);

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

  const getAuthorDisplay = () => null;

  const author = getAuthorDisplay();
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
  const shareUrl = `${site}/${locale}/news/${post.slug}`;
  const shareLabel = locale === 'ka' ? 'გაზიარება' : locale === 'ru' ? 'Поделиться' : 'Share';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link href={`/${locale}`} className="hover:text-foreground">
            {locale === 'ka' ? 'მთავარი' : locale === 'ru' ? 'Главная' : 'Home'}
          </Link>
          <span>/</span>
          <Link href={`/${locale}/news`} className="hover:text-foreground">
            {locale === 'ka' ? 'სიახლეები' : locale === 'ru' ? 'Новости' : 'News'}
          </Link>
          {post.categories && post.categories.length > 0 && (
            <>
              <span>/</span>
              <Link 
                href={`/${locale}/news/category/${post.categories[0].category.slug}`}
                className="hover:text-foreground"
              >
                {post.categories[0].category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900">{post.title}</span>
        </nav>

        {/* Back Button */}
        <Link
          href={`/${locale}/news`}
          className="inline-flex items-center text-sm text-primary hover:text-primary/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {locale === 'ka' ? 'სიახლეებზე დაბრუნება' : locale === 'ru' ? 'Вернуться к новостям' : 'Back to News'}
        </Link>

        <article className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          {/* Cover Image */}
          {post.coverImage && (
            <div className="aspect-video w-full overflow-hidden">
              <div className="relative h-full w-full">
                <img
                  src={post.coverImage}
                  alt={post.coverImageAlt || post.title}
                  className="h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                <div className="pointer-events-none absolute inset-0 bg-white/35 transition-opacity duration-300 dark:bg-black/25" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
              </div>
            </div>
          )}

          <div className="p-8">
            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.map(({ category }) => (
                  <Link
                    key={category.id}
                    href={`/${locale}/news/category/${category.slug}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex items-center justify-between gap-4 flex-wrap text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
              <div className="flex items-center space-x-6">
                {/* Author */}
                {post.author && (
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>
                      {post.author.name}
                      {post.author.company ? ` · ${post.author.company.name}` : ''}
                    </span>
                  </div>
                )}

                {/* Date */}
                {post.publishedAt && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                )}

                {/* Reading Time */}
                {post.readingTime && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.readingTime} {locale === 'ka' ? 'წუთი' : locale === 'ru' ? 'мин' : 'min'}</span>
                  </div>
                )}
              </div>

              {/* Share */}
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs">{shareLabel}:</span>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted/50"
                  aria-label="Share on Facebook"
                >
                  <Facebook className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Facebook</span>
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted/50"
                  aria-label="Share on LinkedIn"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">LinkedIn</span>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted/50"
                  aria-label="Share on Twitter"
                >
                  <Twitter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Twitter</span>
                </a>
              </div>
            </div>

            {/* Excerpt */}
            {post.excerpt && (
              <div className="-mx-8 px-8 py-6 mb-8 bg-muted/30 border-y border-border">
                <p className="text-lg md:text-xl leading-relaxed tracking-wide text-foreground/90 has-text-align-justify">
                  {post.excerpt}
                </p>
              </div>
            )}

            {/* Content */}
            <RichText html={post.body} />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  {locale === 'ka' ? 'ტეგები' : locale === 'ru' ? 'Теги' : 'Tags'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(({ tag }, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {locale === 'ka' ? 'მსგავსი სიახლეები' : locale === 'ru' ? 'Похожие новости' : 'Related Posts'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/${locale}/news/${relatedPost.slug}`}
                  className="bg-card rounded-lg shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow"
                >
                  {relatedPost.coverImage && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={relatedPost.coverImage}
                        alt={(relatedPost as any).coverImageAlt || relatedPost.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    {relatedPost.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {relatedPost.excerpt}
                      </p>
                    )}
                    <div className="mt-3 flex items-center text-xs text-gray-500">
                  {relatedPost.publishedAt && (
                        <span>{formatDate(relatedPost.publishedAt)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';