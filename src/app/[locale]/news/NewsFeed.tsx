'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, User, Building2 } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  readingTime: number | null;
  authorType: 'COMPANY' | 'SPECIALIST' | string;
  author?: {
    id: string;
    name: string | null;
    company?: { id: string; name: string; slug: string } | null;
  };
  categories?: {
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  tags?: {
    tag: string;
  }[];
}

interface NewsFeedProps {
  initialPosts: Post[];
  hasMore: boolean;
  nextCursor: string | null;
  locale: string;
  searchParams: any;
}

export default function NewsFeed({ 
  initialPosts, 
  hasMore: initialHasMore, 
  nextCursor: initialNextCursor, 
  locale,
  searchParams 
}: NewsFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);

  // Re-fetch data when search parameters change
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ ...searchParams, locale });

        const response = await fetch(`/api/posts?${params}`);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts);
          setHasMore(data.hasMore);
          setNextCursor(data.nextCursor);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [searchParams, locale]);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...searchParams,
        cursor: nextCursor || '',
      });

      const response = await fetch(`/api/posts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(prev => [...prev, ...data.posts]);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      }
    } catch (error) {
      console.error('Failed to load more posts:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getAuthorDisplay = (post: Post) => {
    if (!post.author) return null;
    const name = post.author.name || '—';
    const company = post.author.company?.name;
    return company ? `${name} · ${company}` : name;
  };

  if (loading && posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground text-lg">
          {locale === 'ka' 
            ? 'სიახლეების ძებნა...'
            : locale === 'ru'
            ? 'Поиск новостей...'
            : 'Searching news...'
          }
        </p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          {locale === 'ka' 
            ? 'სიახლეები ჯერ არ არის ხელმისაწვდომი'
            : locale === 'ru'
            ? 'Новости пока недоступны'
            : 'No news available yet'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {posts.map((post) => {
        const author = getAuthorDisplay(post);
        
        return (
          <article key={post.id} className="group bg-card rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            {post.coverImage && (
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={post.coverImage}
                  alt={(post as any).coverImageAlt || post.title}
                  fill
                  className="object-cover"
                  priority={false}
                />
                <div className="pointer-events-none absolute inset-0 bg-white/35 transition-opacity duration-300 dark:bg-black/25 group-hover:opacity-0" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/20 to-transparent" />
              </div>
            )}
            <div className="p-6">
              {/* Categories */}
              {post.categories && post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.categories.map(({ category }) => (
                    <Link
                      key={category.id}
                      href={`/${locale}/news/category/${category.slug}`}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Title */}
              <h2 className="text-xl font-semibold text-card-foreground mb-3">
                <Link 
                  href={`/${locale}/news/${post.slug}`}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {post.title}
                </Link>
              </h2>

              {/* Author */}
              {getAuthorDisplay(post) && (
                <div className="text-xs text-muted-foreground mb-2">
                  {getAuthorDisplay(post)}
                </div>
              )}

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
              )}

              {/* Meta Information */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  {post.publishedAt && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                  )}
                  {post.readingTime && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{post.readingTime} {locale === 'ka' ? 'წუთი' : locale === 'ru' ? 'мин' : 'min'}</span>
                    </div>
                  )}
                </div>
                <div />
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-4">
                  {post.tags.map(({ tag }, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        );
      })}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center py-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {locale === 'ka' ? 'იტვირთება...' : locale === 'ru' ? 'Загрузка...' : 'Loading...'}
              </>
            ) : (
              locale === 'ka' ? 'მეტი სიახლე' : locale === 'ru' ? 'Больше новостей' : 'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
