import prisma from '@/lib/prisma';
import type { Locale } from '@/i18n/locales';

export interface AuthorOption {
  id: string;
  name: string;
}

export interface FetchNewsDataResult {
  posts: any[];
  categories: { id: string; slug: string; name: string; type: 'GLOBAL' | 'COMPANY' }[];
  authorOptions: AuthorOption[];
  hasMore: boolean;
  nextCursor: string | null;
}

function buildPostQuery(locale: Locale, rawSearchParams: Record<string, any> | undefined) {
  const { category, author, authorId, company, search } = rawSearchParams ?? {};
  const where: any = {
    status: 'PUBLISHED',
  };

  if (category) {
    where.categories = {
      some: {
        category: { slug: category },
      },
    };
  }

  if (authorId) {
    where.authorId = authorId;
  }

  if (author) {
    where.author = {
      company: { slug: author },
    };
  }

  if (company) {
    where.company = {
      slug: company,
    };
  }

  if (search) {
    const searchConditions = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
      { body: { contains: search, mode: 'insensitive' } },
    ];

    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchConditions }];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  return where;
}

export async function fetchNewsData(locale: Locale, rawSearchParams: Record<string, any>): Promise<FetchNewsDataResult> {
  const where = buildPostQuery(locale, rawSearchParams);
  const cursor = rawSearchParams?.cursor;
  const take = 20;

  const [authorRecords, categoryGroups, posts] = await Promise.all([
    prisma.post.findMany({
      where,
      distinct: ['authorId'],
      select: {
        authorId: true,
        author: {
          select: {
            id: true,
            name: true,
            company: { select: { name: true } },
          },
        },
      },
    }),
    prisma.postCategory.groupBy({
      by: ['categoryId'],
      where: {
        post: where,
      },
      _count: { categoryId: true },
      orderBy: {
        _count: { categoryId: 'desc' },
      },
      take: 12,
    }),
    prisma.post.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, slug: true, logoUrl: true } },
        author: {
          select: {
            id: true,
            name: true,
            company: { select: { id: true, name: true, slug: true } },
          },
        },
        categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
        tags: { select: { tag: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take,
      skip: cursor ? 1 : 0,
      ...(cursor
        ? {
            cursor: { id: cursor },
          }
        : {}),
    }),
  ]);

  const categoryIds = categoryGroups.map((group) => group.categoryId);
  const categories = categoryIds.length
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, slug: true, type: true },
        orderBy: { name: 'asc' },
      })
    : [];

  const postIds = posts.map((post) => post.id);
  const translations = postIds.length
    ? await prisma.postTranslation.findMany({
        where: { postId: { in: postIds }, locale },
        select: { postId: true, title: true, excerpt: true, slug: true },
      })
    : [];
  const translationMap = new Map(translations.map((translation) => [translation.postId, translation]));

  const mappedPosts = posts.map((post) => {
    const translation = translationMap.get(post.id);
    return {
      ...post,
      title: translation?.title || post.title,
      excerpt: translation?.excerpt ?? post.excerpt,
      translatedSlug: translation?.slug || post.slug,
    };
  });

  const hasMore = posts.length === take;
  const nextCursor = hasMore ? posts[posts.length - 1].id : null;

  const authorOptions: AuthorOption[] = [];
  const seen = new Set<string>();
  for (const record of authorRecords) {
    if (!record.authorId || !record.author?.name || seen.has(record.authorId)) continue;
    authorOptions.push({ id: record.authorId, name: record.author.name });
    seen.add(record.authorId);
  }

  authorOptions.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

  return {
    posts: mappedPosts,
    categories: categories.map((category) => ({
      ...category,
      type: (category.type ?? 'GLOBAL') as 'GLOBAL' | 'COMPANY',
    })),
    authorOptions,
    hasMore,
    nextCursor,
  };
}
