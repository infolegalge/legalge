import prisma from '@/lib/prisma'
import Link from 'next/link'
import type { Locale } from '@/i18n/locales'

export default async function AdminPostsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params

  const posts = await prisma.post.findMany({
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      status: true,
      locale: true,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Link href={`/${locale}/admin/posts/new`} className="underline">
          New Post
        </Link>
      </div>
      <ul className="divide-y">
        {posts.map((p) => (
          <li key={p.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-sm text-muted-foreground">/{p.locale}/news/{p.slug}</div>
            </div>
            <Link href={`/${locale}/admin/posts/${p.id}`}>Edit</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}