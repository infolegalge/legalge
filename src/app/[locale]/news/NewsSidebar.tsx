'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, Calendar } from 'lucide-react';

interface Category {
  id: string;
  slug: string;
  name: string;
  type: 'GLOBAL' | 'COMPANY';
}

interface AuthorOption {
  id: string;
  name: string;
}

interface NewsSidebarProps {
  categories: Category[];
  locale: string;
  searchParams: any;
  authorOptions: AuthorOption[];
}

export default function NewsSidebar({ categories, locale, searchParams, authorOptions }: NewsSidebarProps) {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.search || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.category || '');
  const [selectedAuthor, setSelectedAuthor] = useState(searchParams.authorId || '');
  const [dateFrom, setDateFrom] = useState(searchParams.dateFrom || '');
  const [dateTo, setDateTo] = useState(searchParams.dateTo || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedAuthor) params.set('authorId', selectedAuthor);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    
    router.push(`/${locale}/news?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedAuthor('');
    setDateFrom('');
    setDateTo('');
    router.push(`/${locale}/news`);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedAuthor || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-card rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
          <Search className="h-5 w-5 mr-2" />
          {locale === 'ka' ? 'ძებნა' : locale === 'ru' ? 'Поиск' : 'Search'}
        </h3>
        
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'ka' ? 'ძებნა სიახლეებში...' : locale === 'ru' ? 'Поиск в новостях...' : 'Search news...'}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {locale === 'ka' ? 'ძებნა' : locale === 'ru' ? 'Поиск' : 'Search'}
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          {locale === 'ka' ? 'ფილტრები' : locale === 'ru' ? 'Фильтры' : 'Filters'}
        </h3>
        
        <div className="space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {locale === 'ka' ? 'კატეგორია' : locale === 'ru' ? 'Категория' : 'Category'}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
            >
              <option value="">
                {locale === 'ka' ? 'ყველა კატეგორია' : locale === 'ru' ? 'Все категории' : 'All Categories'}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Author Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {locale === 'ka' ? 'ავტორი' : locale === 'ru' ? 'Автор' : 'Author'}
            </label>
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
            >
              <option value="">
                {locale === 'ka' ? 'ყველა ავტორი' : locale === 'ru' ? 'Все авторы' : 'All Authors'}
              </option>
              {authorOptions.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {locale === 'ka' ? 'თარიღი' : locale === 'ru' ? 'Дата' : 'Date'}
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                placeholder={locale === 'ka' ? 'დან' : locale === 'ru' ? 'От' : 'From'}
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                placeholder={locale === 'ka' ? 'მდე' : locale === 'ru' ? 'До' : 'To'}
              />
            </div>
          </div>

          {/* Apply Filters */}
          <div className="space-y-2">
            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {locale === 'ka' ? 'ფილტრის გამოყენება' : locale === 'ru' ? 'Применить фильтр' : 'Apply Filters'}
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
              >
                {locale === 'ka' ? 'ფილტრების გასუფთავება' : locale === 'ru' ? 'Очистить фильтры' : 'Clear Filters'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {locale === 'ka' ? 'კატეგორიები' : locale === 'ru' ? 'Категории' : 'Categories'}
        </h3>
        
        <div className="space-y-2">
          <Link
            href={`/${locale}/news`}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              !selectedCategory
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {locale === 'ka' ? 'ყველა' : locale === 'ru' ? 'Все' : 'All'}
          </Link>
          
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/news/category/${category.slug}`}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                selectedCategory === category.slug
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {/* RSS Feed */}
      <div className="bg-card rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          RSS
        </h3>
        
        <div className="space-y-2">
          <Link
            href={`/${locale}/news/rss`}
            className="block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            {locale === 'ka' ? 'ყველა სიახლე' : locale === 'ru' ? 'Все новости' : 'All News'}
          </Link>
          
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/news/category/${category.slug}/rss`}
              className="block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
