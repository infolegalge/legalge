import { PrismaClient } from '@prisma/client';
import { makeSlug } from '@/lib/utils';

const prisma = new PrismaClient();

async function ensureUser(email: string, name: string, role: 'SUPER_ADMIN'|'COMPANY'|'SPECIALIST'|'AUTHOR'|'SUBSCRIBER' = 'AUTHOR') {
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: { email, name, role },
  });
  return user;
}

async function ensureCategory(name: string) {
  const slug = makeSlug(name, 'en' as any) || 'category';
  const existing = await prisma.category.findFirst({ where: { slug } });
  if (existing) return existing;
  return prisma.category.create({ data: { name, slug, isPublic: true, type: 'GLOBAL' } });
}

async function createPost(opts: { title: string; excerpt: string; body: string; authorEmail: string; categoryNames: string[]; locale: 'ka'|'en'|'ru'; status?: 'DRAFT'|'PUBLISHED' }) {
  const author = await ensureUser(opts.authorEmail, opts.authorEmail.split('@')[0], 'AUTHOR');
  const slug = makeSlug(opts.title, opts.locale as any);
  const post = await prisma.post.create({
    data: {
      title: opts.title,
      slug,
      excerpt: opts.excerpt,
      body: opts.body,
      status: opts.status || 'PUBLISHED',
      publishedAt: new Date(),
      authorType: 'USER',
      locale: opts.locale,
      author: { connect: { id: author.id } },
    },
    select: { id: true },
  });
  for (const name of opts.categoryNames) {
    const cat = await ensureCategory(name);
    await prisma.postCategory.create({ data: { postId: post.id, categoryId: cat.id } });
  }
}

async function main() {
  // Authors
  const alice = 'alice@example.com';
  const bob = 'bob@example.com';
  const nina = 'nina@example.com';
  await Promise.all([
    ensureUser(alice, 'Alice Author', 'AUTHOR'),
    ensureUser(bob, 'Bob Writer', 'AUTHOR'),
    ensureUser(nina, 'Nina Reporter', 'AUTHOR'),
  ]);

  // Categories
  const catNews = await ensureCategory('Legal Sandbox NEWS');
  const catMigration = await ensureCategory('Migration Issues');
  const catAI = await ensureCategory('AI NEWS');

  // Sample posts across locales and categories
  await createPost({
    title: 'Court adopts new data protection guidelines',
    excerpt: 'A quick look at the updated personal data framework.',
    body: '<p>The national authority has adopted comprehensive guidelines...</p>',
    authorEmail: alice,
    categoryNames: [catNews.name, catAI.name],
    locale: 'en',
  });

  await createPost({
    title: 'მიგრაციის პროცედურებში ცვლილებები',
    excerpt: 'ახალი წესები ბინადრობის ნებართვებზე.',
    body: '<p>განახლდა წესები, რომელიც შეეხება...</p>',
    authorEmail: bob,
    categoryNames: [catMigration.name],
    locale: 'ka',
  });

  await createPost({
    title: 'Новый пилот по цифровым визам',
    excerpt: 'Проверяем как работает цифровая виза для удаленщиков.',
    body: '<p>Министерство запустило пилот для цифровых виз...</p>',
    authorEmail: nina,
    categoryNames: [catMigration.name, catNews.name],
    locale: 'ru',
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





