'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users2, BarChart3, PieChart } from 'lucide-react';

interface CompanyAnalyticsProps {
  locale: string;
}

type RangeOption = '7d' | '30d' | '90d' | 'custom';

interface AnalyticsResponse {
  summary: {
    totalViews: number;
    uniqueVisitors: number;
    avgReadTime: number;
    topCategory?: {
      name: string;
      views: number;
    } | null;
    topPost?: {
      id: string;
      title: string;
      views: number;
    } | null;
  };
  trends: Array<{
    date: string;
    views: number;
    visitors: number;
  }>;
  categories: Array<{
    id: string;
    name: string;
    views: number;
    publishedPosts: number;
  }>;
  posts: Array<{
    id: string;
    title: string;
    views: number;
    avgReadTime: number;
    publishedAt: string | null;
    status: string;
  }>;
  visitors: Array<{
    locale: string;
    percentage: number;
  }>;
}

const rangeLabels: Record<RangeOption, { ka: string; ru: string; en: string }> = {
  '7d': { ka: '7 დღე', ru: '7 дней', en: 'Last 7 days' },
  '30d': { ka: '30 დღე', ru: '30 дней', en: 'Last 30 days' },
  '90d': { ka: '90 დღე', ru: '90 дней', en: 'Last 90 days' },
  custom: { ka: 'პირადი', ru: 'Период', en: 'Custom' },
};

export default function CompanyAnalytics({ locale }: CompanyAnalyticsProps) {
  const [range, setRange] = useState<RangeOption>('30d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'posts' | 'visitors'>('overview');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('range', range);
        if (range === 'custom' && startDate && endDate) {
          params.set('start', startDate);
          params.set('end', endDate);
        }

        const res = await fetch(`/api/company/analytics?${params.toString()}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || res.statusText);
        }
        const payload = (await res.json()) as AnalyticsResponse;
        if (active) {
          setData(payload);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load analytics');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [range, startDate, endDate]);

  const summaryCards = useMemo(() => {
    if (!data?.summary) return [];
    return [
      {
        label: locale === 'ka' ? 'სულ ნახვები' : locale === 'ru' ? 'Всего просмотров' : 'Total Views',
        value: data.summary.totalViews.toLocaleString(),
        icon: TrendingUp,
        color: 'text-blue-500',
      },
      {
        label: locale === 'ka' ? 'უნიკალური ვიზიტები' : locale === 'ru' ? 'Уникальные визиты' : 'Unique Visitors',
        value: data.summary.uniqueVisitors.toLocaleString(),
        icon: Users2,
        color: 'text-green-500',
      },
      {
        label: locale === 'ka' ? 'საშ. წაკითხვის დრო' : locale === 'ru' ? 'Среднее время чтения' : 'Avg. Read Time',
        value: `${data.summary.avgReadTime.toFixed(1)} min`,
        icon: BarChart3,
        color: 'text-purple-500',
      },
      data.summary.topCategory
        ? {
            label: locale === 'ka' ? 'ტოპ კატეგორია' : locale === 'ru' ? 'Топ категория' : 'Top Category',
            value: data.summary.topCategory.name,
            sub: `${data.summary.topCategory.views.toLocaleString()} views`,
            icon: PieChart,
            color: 'text-amber-500',
          }
        : null,
    ].filter(Boolean) as Array<{
      label: string;
      value: string;
      sub?: string;
      icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
      color: string;
    }>;
  }, [data, locale]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {locale === 'ka' ? 'ანალიტიკა' : locale === 'ru' ? 'Аналитика' : 'Analytics'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'ka'
              ? 'განახლებადი ხედები თქვენი კომპანიის პოსტებზე'
              : locale === 'ru'
              ? 'Актуальные метрики по постам вашей компании'
              : 'Live metrics across your company posts'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={range}
            onValueChange={(value) => setRange(value as RangeOption)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(rangeLabels) as RangeOption[]).map((option) => (
                <SelectItem key={option} value={option}>
                  {rangeLabels[option][locale as 'ka' | 'ru' | 'en'] ?? rangeLabels[option].en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {range === 'custom' && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
              <span>—</span>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setRange('30d');
            }}
          >
            {locale === 'ka' ? 'გადატვირთვა' : locale === 'ru' ? 'Сбросить' : 'Reset'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-md border py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm text-muted-foreground">
              {locale === 'ka' ? 'ანალიტიკა იტვირთება...' : locale === 'ru' ? 'Загрузка аналитики...' : 'Loading analytics...'}
            </p>
          </div>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
              <Card key={card.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="text-2xl font-semibold">{card.value}</p>
                      {card.sub && <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>}
                    </div>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="overview">
                {locale === 'ka' ? 'დიაგრამები' : locale === 'ru' ? 'Диаграммы' : 'Overview'}
              </TabsTrigger>
              <TabsTrigger value="categories">
                {locale === 'ka' ? 'კატეგორიები' : locale === 'ru' ? 'Категории' : 'Categories'}
              </TabsTrigger>
              <TabsTrigger value="posts">
                {locale === 'ka' ? 'პოსტები' : locale === 'ru' ? 'Посты' : 'Posts'}
              </TabsTrigger>
              <TabsTrigger value="visitors">
                {locale === 'ka' ? 'მნახველები' : locale === 'ru' ? 'Аудитория' : 'Audience'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {locale === 'ka' ? 'ხედვის ტენდენცია' : locale === 'ru' ? 'Тренд просмотров' : 'Views trend'}
                  </CardTitle>
                  <CardDescription>
                    {locale === 'ka'
                      ? 'სქემატურად აჩვენებს ნახვების დინამიკას არჩეულ პერიოდში'
                      : locale === 'ru'
                      ? 'Схематично показывает динамику просмотров за выбранный период'
                      : 'Timeline of views and visitors for the selected range'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded border border-dashed p-10 text-center text-sm text-muted-foreground">
                    {locale === 'ka'
                      ? 'ჩარტი ჯერ არ არის ხელმისაწვდომი. მონაცემები ზუსტად იტვირთება API-დან.'
                      : locale === 'ru'
                      ? 'Диаграмма пока не доступна. Данные приходят корректно.'
                      : 'Chart rendering placeholder. Data is loading correctly from the API.'}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {locale === 'ka' ? 'კატეგორიის მიხედვით' : locale === 'ru' ? 'По категориям' : 'By category'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {locale === 'ka' ? 'კატეგორიის მონაცემი არაა.' : locale === 'ru' ? 'Нет данных по категориям.' : 'No category data yet.'}
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {data.categories.map((category) => (
                        <Card key={category.id}>
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{category.name}</h4>
                              <Badge variant="secondary">{category.views.toLocaleString()} views</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {locale === 'ka'
                                ? `${category.publishedPosts} გამოქვეყნებული პოსტი`
                                : locale === 'ru'
                                ? `${category.publishedPosts} опубликованных`
                                : `${category.publishedPosts} published posts`}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="posts" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {locale === 'ka' ? 'პოსტების ტოპ-10' : locale === 'ru' ? 'Топ-10 постов' : 'Top posts'}
                  </CardTitle>
                  <CardDescription>
                    {locale === 'ka'
                      ? 'რაოდენობრივი გადმოსახედი ნახვების მიხედვით'
                      : locale === 'ru'
                      ? 'Ранжирование по просмотрам'
                      : 'Ranked by views within the selected window'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.posts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {locale === 'ka' ? 'პოსტების ანალიტიკა ჯერ არაა.' : locale === 'ru' ? 'Пока нет аналитики по постам.' : 'No post analytics yet.'}
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {data.posts.map((post) => (
                        <li key={post.id} className="py-3 flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className="font-medium leading-tight">{post.title}</span>
                            <div className="text-xs text-muted-foreground flex items-center gap-3">
                              <span>{post.views.toLocaleString()} views</span>
                              <span>·</span>
                              <span>
                                {locale === 'ka'
                                  ? `${post.avgReadTime.toFixed(1)} წთ`
                                  : locale === 'ru'
                                  ? `${post.avgReadTime.toFixed(1)} мин`
                                  : `${post.avgReadTime.toFixed(1)} min`}
                              </span>
                              {post.publishedAt ? (
                                <span>· {new Date(post.publishedAt).toLocaleDateString()}</span>
                              ) : null}
                              <span className="uppercase text-[10px] tracking-wide">
                                {post.status}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {locale === 'ka' ? 'ნახე' : locale === 'ru' ? 'Открыть' : 'View'}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visitors" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {locale === 'ka' ? 'ენის მიხედვით' : locale === 'ru' ? 'По языкам' : 'By locale'}
                  </CardTitle>
                  <CardDescription>
                    {locale === 'ka'
                      ? 'სულ ვიზიტორების პროპორცია ენების მიხედვით'
                      : locale === 'ru'
                      ? 'Распределение визитов по языкам'
                      : 'Audience share by content language'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.visitors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {locale === 'ka' ? 'მნახველების მონაცემი ჯერ არაა.' : locale === 'ru' ? 'Нет данных о посетителях.' : 'No audience data yet.'}
                    </p>
                  ) : (
                    data.visitors.map((item) => (
                      <div key={item.locale} className="flex items-center justify-between rounded border bg-muted/40 px-3 py-2 text-sm">
                        <span className="uppercase">{item.locale}</span>
                        <span>{item.percentage}%</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}


