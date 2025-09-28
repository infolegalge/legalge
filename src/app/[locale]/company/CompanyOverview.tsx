'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, CalendarDays, FileText, Loader2, Plus, ShieldAlert, Users } from 'lucide-react';

interface OverviewProps {
  locale: string;
  company?: {
    id: string;
    slug: string;
    name: string;
    city: string | null;
  } | null;
}

interface OverviewResponse {
  summary: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    pendingRequests: number;
    activeSpecialists: number;
    suspendedSpecialists: number;
    lastPublishedAt: string | null;
  };
  alerts: Array<{ id: string; message: string; severity: 'info' | 'warning' | 'critical' }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    createdAt: string;
    actor?: string | null;
    link?: string | null;
  }>;
}

function formatDate(date: string | null, locale: string) {
  if (!date) return locale === 'ka' ? 'არ არის' : locale === 'ru' ? 'Нет' : 'None';
  return new Date(date).toLocaleString(locale === 'ka' ? 'ka-GE' : locale === 'ru' ? 'ru-RU' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function CompanyOverview({ locale, company }: OverviewProps) {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/company/overview${company ? `?companyId=${encodeURIComponent(company.id)}` : ''}`, { credentials: 'include' });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || res.statusText);
        }
        const payload = (await res.json()) as OverviewResponse;
        if (active) {
          setData(payload);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'Failed to load overview');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const publishRatio = useMemo(() => {
    if (!data?.summary) return 0;
    const total = data.summary.totalPosts || 0;
    if (!total) return 0;
    return Math.round((data.summary.publishedPosts / total) * 100);
  }, [data]);

  if (!company) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'ka' ? 'კომპანია არ მოიძებნა' : locale === 'ru' ? 'Компания не найдена' : 'Company not found'}</CardTitle>
          <CardDescription>
            {locale === 'ka'
              ? 'გთხოვთ დაუკავშირდეთ ადმინისტრატორს კომპანიის დაკავშირებისთვის.'
              : locale === 'ru'
              ? 'Свяжитесь с администратором, чтобы связать учетную запись с компанией.'
              : 'Please contact support to attach your account to a company.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          <p className="text-muted-foreground">
            {company.city ? `${company.city} · ` : ''}
            {locale === 'ka' ? 'კომპანიის მიმოხილვა' : locale === 'ru' ? 'Обзор компании' : 'Company overview'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push(`/${locale}/company/profile`)}>
            <Users className="h-4 w-4 mr-2" />
            {locale === 'ka' ? 'პროფილი' : locale === 'ru' ? 'Профиль' : 'Profile'}
          </Button>
          <Button onClick={() => router.push(`/${locale}/company/posts/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            {locale === 'ka' ? 'ახალი პოსტი' : locale === 'ru' ? 'Новый пост' : 'New Post'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-md border py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm text-muted-foreground">
              {locale === 'ka' ? 'ინფორმაციის ჩატვირთვა...' : locale === 'ru' ? 'Загрузка данных...' : 'Loading overview...'}
            </p>
          </div>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : data ? (
        <>
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {locale === 'ka' ? 'სულ პოსტები' : locale === 'ru' ? 'Всего постов' : 'Total Posts'}
                    </p>
                    <p className="text-2xl font-semibold">{data.summary.totalPosts}</p>
                  </div>
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{locale === 'ka' ? 'გამოქვეყნებული' : locale === 'ru' ? 'Опубликовано' : 'Published'}</span>
                    <span>{data.summary.publishedPosts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{locale === 'ka' ? 'მონაწერი' : locale === 'ru' ? 'Черновики' : 'Drafts'}</span>
                    <span>{data.summary.draftPosts}</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{locale === 'ka' ? 'გამოქვეყნების წილი' : locale === 'ru' ? 'Доля публикаций' : 'Publish ratio'}</span>
                    <span>{publishRatio}%</span>
                  </div>
                  <Progress value={publishRatio} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {locale === 'ka' ? 'სპეციალისტები' : locale === 'ru' ? 'Специалисты' : 'Specialists'}
                    </p>
                    <p className="text-2xl font-semibold">{data.summary.activeSpecialists}</p>
                  </div>
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{locale === 'ka' ? 'აქტიური' : locale === 'ru' ? 'Активные' : 'Active'}</span>
                    <span>{data.summary.activeSpecialists}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{locale === 'ka' ? 'სუსპ.' : locale === 'ru' ? 'Приост.' : 'Suspended'}</span>
                    <span>{data.summary.suspendedSpecialists}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="ghost" size="sm" className="pl-0" onClick={() => router.push(`/${locale}/company/lawyers`)}>
                    {locale === 'ka' ? 'ნახე გუნდი' : locale === 'ru' ? 'Управлять командой' : 'Manage team'}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {locale === 'ka' ? 'მოთხოვნები' : locale === 'ru' ? 'Запросы' : 'Requests'}
                    </p>
                    <p className="text-2xl font-semibold">{data.summary.pendingRequests}</p>
                  </div>
                  <ShieldAlert className="h-6 w-6 text-amber-500" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {locale === 'ka'
                    ? 'მოთხოვნებს გადაამოწმებს ადმინისტრატორი'
                    : locale === 'ru'
                    ? 'Требуется решение администратора'
                    : 'Requests awaiting action'}
                </p>
                <div className="mt-4">
                  <Button variant="ghost" size="sm" className="pl-0" onClick={() => router.push(`/${locale}/company/requests`)}>
                    {locale === 'ka' ? 'ნახე მოთხოვნები' : locale === 'ru' ? 'К списку запросов' : 'View queue'}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {locale === 'ka' ? 'ბოლო პოსტი' : locale === 'ru' ? 'Последняя публикация' : 'Last publish'}
                    </p>
                    <p className="text-2xl font-semibold whitespace-nowrap">{formatDate(data.summary.lastPublishedAt, locale)}</p>
                  </div>
                  <CalendarDays className="h-6 w-6 text-purple-500" />
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {locale === 'ka'
                    ? 'განახლებულ კონტენტს ზრდის ჩართულობა.'
                    : locale === 'ru'
                    ? 'Регулярный контент повышает вовлеченность.'
                    : 'Fresh content keeps your audience engaged.'}
                </p>
                <div className="mt-4">
                  <Button variant="ghost" size="sm" className="pl-0" onClick={() => router.push(`/${locale}/company/posts`)}>
                    {locale === 'ka' ? 'ნახე პოსტები' : locale === 'ru' ? 'К постам' : 'Open posts'}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {data.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {locale === 'ka' ? 'შეტყობინებები' : locale === 'ru' ? 'Уведомления' : 'Alerts'}
                </CardTitle>
                <CardDescription>
                  {locale === 'ka'
                    ? 'აქტიური საკითხები, რომლებსაც ყურადღება სჭირდება'
                    : locale === 'ru'
                    ? 'Активные вопросы, требующие внимания'
                    : 'Active issues that need attention'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.alerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                    className={alert.severity === 'warning' ? 'border-amber-400 bg-amber-50 text-amber-900' : undefined}
                  >
                    <AlertDescription>{alert.message}</AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === 'ka' ? 'ბოლო აქტივობა' : locale === 'ru' ? 'Последняя активность' : 'Recent activity'}
              </CardTitle>
              <CardDescription>
                {locale === 'ka'
                  ? 'მსუბუქი მიმოხილვა ბოლო ცვლილებების'
                  : locale === 'ru'
                  ? 'Краткий обзор последних изменений'
                  : 'A quick summary of your latest changes'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {locale === 'ka' ? 'აქტივობა ჯერ არ არის.' : locale === 'ru' ? 'Активности пока нет.' : 'No activity yet.'}
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.recentActivity.map((item) => (
                    <li key={item.id} className="rounded border bg-card px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="uppercase tracking-wide text-[10px]">
                              {item.type}
                            </Badge>
                            <span className="text-sm font-medium">{item.title}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.actor && (
                              <span className="mr-2">
                                {locale === 'ka' ? 'ავტორი' : locale === 'ru' ? 'Автор' : 'Actor'}: {item.actor}
                              </span>
                            )}
                            <span>{formatDate(item.createdAt, locale)}</span>
                          </div>
                        </div>
                        {item.link ? (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={item.link}>
                              {locale === 'ka' ? 'გახსენი' : locale === 'ru' ? 'Открыть' : 'Open'}
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}


