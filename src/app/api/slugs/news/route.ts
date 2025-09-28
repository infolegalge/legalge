import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const from = searchParams.get('from') as 'ka' | 'en' | 'ru' | null;
  const to = searchParams.get('to') as 'ka' | 'en' | 'ru' | null;
  if (!slug || !from || !to) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  try {
    const decoded = decodeURIComponent(slug);
    // Find base post by base slug or translation in 'from' locale
    let post = await prisma.post.findFirst({ where: { slug: decoded }, select: { id: true, slug: true } });
    if (!post) {
      try {
        const t = await (prisma as any).postTranslation.findFirst({ where: { locale: from, slug: decoded }, select: { postId: true } });
        if (t?.postId) {
          post = await prisma.post.findUnique({ where: { id: t.postId }, select: { id: true, slug: true } });
        }
      } catch {}
    }
    if (!post) return NextResponse.json({ slug: decoded });

    // Resolve target locale slug (for any locale). If the translation exists
    // but its slug is empty, auto-generate from the translation title, persist,
    // and return it so the URL can be canonical in one switch.
    try {
      const tTo = await (prisma as any).postTranslation.findUnique({
        where: { postId_locale: { postId: post.id, locale: to } },
        select: { id: true, slug: true, title: true },
      });
      if (tTo?.slug && tTo.slug.trim()) {
        return NextResponse.json({ slug: tTo.slug });
      }
      if (tTo && tTo.title && tTo.title.trim()) {
        const makeSlug = (title: string) => title
          .toString()
          .toLowerCase()
          .normalize('NFKC')
          .replace(/["'’`]/g, '')
          .replace(/[^\p{L}\p{N}]+/gu, '-')
          .replace(/^-+|-+$/g, '')
          .replace(/-{2,}/g, '-');
        let final = makeSlug(tTo.title);
        let counter = 1;
        // Ensure uniqueness across translations for the same locale
        // and also not colliding with base post slug.
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const exists = await (prisma as any).postTranslation.findFirst({ where: { locale: to, slug: final }, select: { id: true } });
          if (!exists && post.slug !== final) break;
          final = `${final}-${counter++}`;
        }
        await (prisma as any).postTranslation.update({ where: { id: tTo.id }, data: { slug: final } });
        return NextResponse.json({ slug: final });
      }
      return NextResponse.json({ slug: post.slug });
    } catch {
      return NextResponse.json({ slug: post.slug });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed to translate slug' }, { status: 500 });
  }
}


