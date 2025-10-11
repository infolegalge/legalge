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

export async function fetchNewsData(locale: Locale, rawSearchParams: Record<string, any>): Promise<FetchNewsDataResult> {
  const { category, author, authorId, company, search, cursor } = rawSearchParams ?? {};

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
      { title: { contains: search } },
      { excerpt: { contains: search } },
      { body: { contains: search } },
    ];

    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchConditions }];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  const take = 20;
  const posts = await prisma.post.findMany({
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
          cursor: {
            id: cursor,
          },
        }
      : {}),
  });

  const categoriesAgg = await prisma.postCategory.groupBy({
    by: ['categoryId'],
    _count: { categoryId: true },
    orderBy: { _count: { categoryId: 'desc' } },
    take: 4,
  });
  const categoryIds = categoriesAgg.map((c) => c.categoryId);
  const categories = categoryIds.length
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, slug: true, type: true },
      })
    : [];

  const postIds = posts.map((post) => post.id);
  let translations: Array<{ postId: string; title: string | null; excerpt: string | null; slug: string | null }> = [];
  if (postIds.length) {
    translations = await prisma.postTranslation.findMany({
      where: { postId: { in: postIds }, locale },
      select: { postId: true, title: true, excerpt: true, slug: true },
    });
  }
  const translationsMap = new Map(translations.map((t) => [t.postId, t]));

  const mappedPosts = posts.map((post) => {
    const translation = translationsMap.get(post.id);
    return {
      ...post,
      title: translation?.title || post.title,
      excerpt: translation?.excerpt ?? post.excerpt,
      translatedSlug: translation?.slug || post.slug,
    };
  });

  const hasMore = posts.length === take;
  const nextCursor = hasMore ? posts[posts.length - 1].id : null;

  const authors = await prisma.user.findMany({
    where: {
      posts: {
        some: {
          status: 'PUBLISHED',
        },
      },
    },
    select: {
      id: true,
      name: true,
      company: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  });

  const authorOptions: AuthorOption[] = [];
  const seenAuthorIds = new Set<string>();
  for (const authorRecord of authors) {
    if (!authorRecord.id || seenAuthorIds.has(authorRecord.id)) continue;
    const label = authorRecord.name || authorRecord.company?.name;
    if (!label) continue;
    authorOptions.push({ id: authorRecord.id, name: label });
    seenAuthorIds.add(authorRecord.id);
  }

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
