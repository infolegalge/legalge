import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  try {
    const { locale } = await params;
    
    // Get recent published posts
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 20
    });

    // Build RSS XML
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
    const rssUrl = `${siteUrl}/${locale}/news/rss`;
    const newsUrl = `${siteUrl}/${locale}/news`;
    
    // Get locale-specific titles
    const titles: Record<string, string> = {
      ka: 'Legal Sandbox Georgia - სიახლეები',
      en: 'Legal Sandbox Georgia - News',
      ru: 'Legal Sandbox Georgia - Новости'
    };
    
    const descriptions: Record<string, string> = {
      ka: 'უახლესი სამართლებრივი სიახლეები და ანალიზი',
      en: 'Latest legal news and analysis',
      ru: 'Последние правовые новости и анализ'
    };

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${titles[locale] ?? titles.en}</title>
    <description>${descriptions[locale] ?? descriptions.en}</description>
    <link>${newsUrl}</link>
    <atom:link href="${rssUrl}" rel="self" type="application/rss+xml"/>
    <language>${locale === 'ka' ? 'ka-GE' : locale === 'ru' ? 'ru-RU' : 'en-US'}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Legal Sandbox Georgia</generator>
    
    ${posts.map(post => {
      const postUrl = `${siteUrl}/${locale}/news/${post.slug}`;
      const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date().toUTCString();
      const author = 'Legal Sandbox Georgia';
      
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt || post.body?.substring(0, 300) + '...' || ''}]]></description>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author><![CDATA[${author}]]></author>
      ${post.coverImage ? `<enclosure url="${post.coverImage}" type="image/jpeg"/>` : ''}
    </item>`;
    }).join('')}
    
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('RSS feed error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
