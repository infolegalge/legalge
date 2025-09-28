import Link from "next/link";
import type { Post } from "@/lib/wp";
import type { Locale } from "@/i18n/locales";

export default function PostList({ posts, locale }: { posts: Post[]; locale: Locale }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.id} className="rounded-lg border p-4">
            <Link href={`/${locale}/news/${p.slug}`} className="font-medium hover:underline">
              {p.title}
            </Link>
            {p.date ? <div className="text-xs text-foreground/60">{new Date(p.date).toDateString()}</div> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}


