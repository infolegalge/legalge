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

  const categoryFilterWhere = { ...where };
  delete categoryFilterWhere.categories;

  const authorFilterWhere = { ...where };
  delete authorFilterWhere.authorId;

  const [posts, categoriesRaw, authorsRaw] = await Promise.all([
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
        categories: { include: { category: { select: { id: true, name: true, slug: true, type: true } } } },
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
    prisma.category.findMany({
      where: {
        posts: {
          some: {
            post: categoryFilterWhere,
          },
        },
      },
      select: { id: true, name: true, slug: true, type: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: {
        posts: {
          some: authorFilterWhere,
        },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

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

  const categories = categoriesRaw.map((category) => ({
    ...category,
    type: (category.type ?? 'GLOBAL') as 'GLOBAL' | 'COMPANY',
  }));

  const authorOptions: AuthorOption[] = authorsRaw
    .filter((author) => author.id && author.name)
    .map((author) => ({ id: author.id, name: author.name! }));

  return {
    posts: mappedPosts,
    categories,
    authorOptions,
    hasMore,
    nextCursor,
  };
}
