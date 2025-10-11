import type { Locale } from '@/i18n/locales';
import { fetchNewsData } from '../../news/data';
import NewsFeed from '../../news/NewsFeed';
import NewsSidebar from '../../news/NewsSidebar';
import { notFound } from 'next/navigation';
import { buildBreadcrumbLd } from '@/lib/structuredData';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';

interface AuthorPostsPageProps {
  params: Promise<{ locale: Locale; id: string }>;
  searchParams: Promise<{ cursor?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;

  const author = await prisma.user.findUnique({
    where: { id },
    select: { name: true },
  });

  if (!author) {
    return {
      title: 'Author not found',
    };
  }

  return {
    title: `${author.name ?? 'Author'} · Posts`,
    description: `All posts written by ${author.name ?? 'this author'}.`,
  };
}

export default async function AuthorPostsPage({ params, searchParams }: AuthorPostsPageProps) {
  const { locale, id } = await params;
  const resolvedSearchParams = await searchParams;

  const author = await prisma.user.findUnique({
    where: { id },
    select: { name: true },
  });

  if (!author) {
    notFound();
  }

  const { posts, categories, authorOptions, hasMore, nextCursor } = await fetchNewsData(locale, {
    ...resolvedSearchParams,
    authorId: id,
  });

  const breadcrumbLd = buildBreadcrumbLd([
    { name: 'Home', url: 'https://www.legal.ge' },
    { name: locale.toUpperCase(), url: `https://www.legal.ge/${locale}` },
    { name: 'News', url: `https://www.legal.ge/${locale}/news` },
    { name: author.name ?? 'Author', url: `https://www.legal.ge/${locale}/authors/${id}` },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/${locale}`} className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <Link href={`/${locale}/news`} className="hover:text-foreground">
              News
            </Link>
            <span>/</span>
            <span className="text-foreground">{author.name ?? 'Author'}</span>
          </nav>
          <h1 className="text-3xl font-bold text-foreground">
            {author.name ?? 'Author'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            All posts written by {author.name ?? 'this author'}.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <NewsFeed
              initialPosts={posts}
              hasMore={hasMore}
              nextCursor={nextCursor}
              locale={locale}
              searchParams={{ ...resolvedSearchParams, authorId: id }}
            />
          </div>
          <div className="lg:col-span-1">
            <NewsSidebar
              categories={categories}
              locale={locale}
              searchParams={{ ...resolvedSearchParams, authorId: id }}
              authorOptions={authorOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
