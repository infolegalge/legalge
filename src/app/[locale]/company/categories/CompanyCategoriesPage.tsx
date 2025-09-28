'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, RefreshCw, Search, Shield, Tag, Trash2, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';

type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  type: 'GLOBAL' | 'COMPANY';
  isPublic: boolean;
  companyId: string | null;
  postCount: number;
  createdAt: string;
  translations?: Array<{ locale: 'ka'|'en'|'ru'; name: string; slug: string }>;
};

interface CompanyCategoriesPageProps {
  locale: string;
  companyName?: string;
}

const searchPlaceholderByLocale: Record<string, string> = {
  ka: 'კატეგორიების ძიება...',
  ru: 'Поиск категорий...',
  en: 'Search categories...',
};

const namePlaceholderByLocale: Record<string, string> = {
  ka: 'მაგ. სამართლებრივი სიახლეები',
  ru: 'Например, Правовые новости',
  en: 'e.g. Legal News',
};

const slugPlaceholderByLocale: Record<string, string> = {
  ka: 'Auto from name',
  ru: 'Авто из названия',
  en: 'Auto from name',
};

const emptyStateCopy: Record<string, { title: string; body: string; action: string }> = {
  ka: {
    title: 'კატეგორიები ჯერ არ არსებობს',
    body: 'დაწესეთ თემები, რათა დახარისხოთ პოსტები და გამარტივდეს ძებნა.',
    action: 'შექმენი პირველი კატეგორია',
  },
  ru: {
    title: 'Категории еще не созданы',
    body: 'Настройте темы, чтобы упорядочить посты и упростить навигацию.',
    action: 'Создать первую категорию',
  },
  en: {
    title: 'No categories yet',
    body: 'Define topics to keep posts organised and easy to browse.',
    action: 'Create first category',
  },
};

const labelByLocale = {
  headerTitle: {
    ka: 'კატეგორიები',
    ru: 'Категории',
    en: 'Categories',
  },
  headerSubtitle: {
    ka: 'მართე კომპანიის პოსტების თემატური კატეგორიები',
    ru: 'Управляйте тематическими категориями постов компании',
    en: 'Manage thematic categories for company posts',
  },
  includeGlobalToggle: {
    ka: 'გლობალური კატეგორიების ჩვენება',
    ru: 'Показывать глобальные категории',
    en: 'Show global categories',
  },
  globalBadge: {
    ka: 'გლობალური',
    ru: 'Глобальная',
    en: 'Global',
  },
  companyBadge: {
    ka: 'კომპანიის',
    ru: 'Компания',
    en: 'Company',
  },
  postCount: {
    ka: 'პოსტები',
    ru: 'Постов',
    en: 'Posts',
  },
  infoGlobal: {
    ka: 'გლობალური კატეგორიები იყოფა ყველა ორგანიზაციას შორის და შეუძლებელია რედაქცია.',
    ru: 'Глобальные категории совместно используются всеми организациями и не подлежат редактированию.',
    en: 'Global categories are shared across all organisations and cannot be edited.',
  },
  infoCompany: {
    ka: 'კომპანიის კატეგორიებს ხედავს მხოლოდ თქვენი გუნდი და აისახება თქვენს პოსტებზე.',
    ru: 'Категории компании видимы только вашей команде и применяются к вашим постам.',
    en: 'Company categories are private to your team and appear on your posts.',
  },
  newCategoryTitle: {
    ka: 'ახალი კატეგორია',
    ru: 'Новая категория',
    en: 'New Category',
  },
  newCategoryDescription: {
    ka: 'დაამატე ახალი თემა კომპანიას',
    ru: 'Добавьте новую тему для компании',
    en: 'Create a new topic for your company',
  },
  createButton: {
    ka: 'კატეგორიის დამატება',
    ru: 'Добавить категорию',
    en: 'Create Category',
  },
  deleteButton: {
    ka: 'წაშლა',
    ru: 'Удалить',
    en: 'Delete',
  },
  deleteConfirm: {
    ka: 'დარწმუნებული ხარ რომ გინდა წაშლა? პოსტებს კატეგორია მოეხსნებათ.',
    ru: 'Удалить категорию? Посты потеряют эту привязку.',
    en: 'Delete category? Posts will lose this category.',
  },
  refresh: {
    ka: 'განახლება',
    ru: 'Обновить',
    en: 'Refresh',
  },
  searchLabel: {
    ka: 'ძიება',
    ru: 'Поиск',
    en: 'Search',
  },
  slugLabel: {
    ka: 'სლაგი',
    ru: 'Слаг',
    en: 'Slug',
  },
  visibilityLabel: {
    ka: 'საჯაროობა',
    ru: 'Видимость',
    en: 'Visibility',
  },
  visibilityDescription: {
    ka: 'თუ გამორთულია, კატეგორია ხილულია მხოლოდ თქვენს გუნდში.',
    ru: 'Если выключено, категория видна только вашей команде.',
    en: 'When disabled the category remains private to your team.',
  },
};

export default function CompanyCategoriesPage({ locale, companyName }: CompanyCategoriesPageProps) {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [includeGlobal, setIncludeGlobal] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({ includeGlobal: String(includeGlobal) });
      const res = await fetch(`/api/company/categories?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load company categories', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [includeGlobal]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) =>
      category.name.toLowerCase().includes(term) || category.slug.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setMessage({ type: 'error', text: 'Name is required' });
      return;
    }
    setCreating(true);
    setMessage(null);
    try {
      const response = await fetch('/api/company/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newCategoryName, slug: customSlug, isPublic }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || response.statusText);
      }

      setCategories((prev) => [data.category, ...prev]);
      setNewCategoryName('');
      setCustomSlug('');
      setIsPublic(true);
      setMessage({ type: 'success', text: 'Category created successfully' });
    } catch (error) {
      console.error('Create category failed', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to create category' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const confirmMessage = labelByLocale.deleteConfirm[locale as keyof typeof labelByLocale.deleteConfirm] ?? labelByLocale.deleteConfirm.en;
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/company/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || response.statusText);
      }
      setCategories((prev) => prev.filter((category) => category.id !== categoryId));
      setMessage({ type: 'success', text: 'Category deleted successfully' });
    } catch (error) {
      console.error('Delete category failed', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to delete category' });
    }
  };

  const localeStrings = useMemo(() => ({
    searchPlaceholder: searchPlaceholderByLocale[locale] ?? searchPlaceholderByLocale.en,
    namePlaceholder: namePlaceholderByLocale[locale] ?? namePlaceholderByLocale.en,
    slugPlaceholder: slugPlaceholderByLocale[locale] ?? slugPlaceholderByLocale.en,
    emptyState: emptyStateCopy[locale] ?? emptyStateCopy.en,
    labels: labelByLocale,
  }), [locale]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {localeStrings.labels.headerTitle[locale as keyof typeof labelByLocale.headerTitle] ?? labelByLocale.headerTitle.en}
          </h1>
          <p className="text-muted-foreground">
            {companyName ? `${companyName} · ` : ''}
            {localeStrings.labels.headerSubtitle[locale as keyof typeof labelByLocale.headerSubtitle] ?? labelByLocale.headerSubtitle.en}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="include-global"
            checked={includeGlobal}
            onCheckedChange={(checked) => setIncludeGlobal(Boolean(checked))}
          />
          <label className="text-sm" htmlFor="include-global">
            {localeStrings.labels.includeGlobalToggle[locale as keyof typeof labelByLocale.includeGlobalToggle] ?? labelByLocale.includeGlobalToggle.en}
          </label>
          <Button variant="outline" size="sm" onClick={loadCategories} className="ml-3">
            <RefreshCw className="h-4 w-4 mr-1" />
            {localeStrings.labels.refresh[locale as keyof typeof labelByLocale.refresh] ?? labelByLocale.refresh.en}
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                {localeStrings.labels.searchLabel[locale as keyof typeof labelByLocale.searchLabel] ?? labelByLocale.searchLabel.en}
              </CardTitle>
              <CardDescription>
                {localeStrings.labels.infoCompany[locale as keyof typeof labelByLocale.infoCompany] ?? labelByLocale.infoCompany.en}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={localeStrings.searchPlaceholder}
                className="max-w-md"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>
                  {localeStrings.labels.infoGlobal[locale as keyof typeof labelByLocale.infoGlobal] ?? labelByLocale.infoGlobal.en}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {locale === 'ka' ? 'კატეგორიების სია' : locale === 'ru' ? 'Список категорий' : 'Category List'}
              </CardTitle>
              <CardDescription>
                {locale === 'ka'
                  ? `${filteredCategories.length} კატეგორია`
                  : locale === 'ru'
                  ? `${filteredCategories.length} категорий`
                  : `${filteredCategories.length} total`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : fetchError ? (
                <Alert variant="destructive">
                  <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
              ) : filteredCategories.length === 0 ? (
                <div className="py-12 text-center">
                  <h3 className="text-lg font-semibold mb-2">{localeStrings.emptyState.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{localeStrings.emptyState.body}</p>
                  <Button onClick={() => router.push(`#create`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {localeStrings.emptyState.action}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex flex-col gap-3 rounded border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-base font-semibold">{category.name}</h4>
                          <span
                            className={`text-xs font-medium rounded px-2 py-1 ${
                              category.type === 'GLOBAL'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                            }`}
                          >
                            {category.type === 'GLOBAL'
                              ? localeStrings.labels.globalBadge[locale as keyof typeof labelByLocale.globalBadge] ?? labelByLocale.globalBadge.en
                              : localeStrings.labels.companyBadge[locale as keyof typeof labelByLocale.companyBadge] ?? labelByLocale.companyBadge.en}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">/{category.slug}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {localeStrings.labels.postCount[locale as keyof typeof labelByLocale.postCount] ?? labelByLocale.postCount.en}
                            : {category.postCount}
                          </span>
                          <span>
                            {new Date(category.createdAt).toLocaleDateString()}
                          </span>
                          {!category.isPublic && (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Shield className="h-3 w-3" />
                          {locale === 'ka' ? 'დაუსახელო' : locale === 'ru' ? 'Приватная' : 'Private'}
                        </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {category.type !== 'GLOBAL' && (
                          <InlineEditCategory
                            key={`edit-${category.id}`}
                            category={category}
                            locale={locale}
                            onUpdated={(updated) => {
                              setCategories((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
                              setMessage({ type: 'success', text: 'Category updated' });
                            }}
                          />
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={category.type === 'GLOBAL'}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-1">
                            {localeStrings.labels.deleteButton[locale as keyof typeof labelByLocale.deleteButton] ?? labelByLocale.deleteButton.en}
                          </span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6" id="create">
          <Card>
            <CardHeader>
              <CardTitle>
                {localeStrings.labels.newCategoryTitle[locale as keyof typeof labelByLocale.newCategoryTitle] ?? labelByLocale.newCategoryTitle.en}
              </CardTitle>
              <CardDescription>
                {localeStrings.labels.newCategoryDescription[locale as keyof typeof labelByLocale.newCategoryDescription] ?? labelByLocale.newCategoryDescription.en}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateCategory}>
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    placeholder={localeStrings.namePlaceholder}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {localeStrings.labels.slugLabel[locale as keyof typeof labelByLocale.slugLabel] ?? labelByLocale.slugLabel.en}
                  </label>
                  <Input
                    value={customSlug}
                    onChange={(event) => setCustomSlug(event.target.value)}
                    placeholder={localeStrings.slugPlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {localeStrings.labels.visibilityLabel[locale as keyof typeof labelByLocale.visibilityLabel] ?? labelByLocale.visibilityLabel.en}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {localeStrings.labels.visibilityDescription[locale as keyof typeof labelByLocale.visibilityDescription] ?? labelByLocale.visibilityDescription.en}
                      </p>
                    </div>
                    <Switch
                      checked={isPublic}
                      onCheckedChange={(checked) => setIsPublic(Boolean(checked))}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {locale === 'ka' ? 'შენახვა...' : locale === 'ru' ? 'Сохранение...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      {localeStrings.labels.createButton[locale as keyof typeof labelByLocale.createButton] ?? labelByLocale.createButton.en}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {locale === 'ka' ? 'რჩევები' : locale === 'ru' ? 'Рекомендации' : 'Guidance'}
              </CardTitle>
              <CardDescription>
                {locale === 'ka'
                  ? 'საუკეთესო პრაქტიკები კატეგორიებისთვის'
                  : locale === 'ru'
                  ? 'Лучшие практики для категорий'
                  : 'Best practices for category structure'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{locale === 'ka' ? '• დაარქვით მოკლე და ზუსტი სახელები (2–3 სიტყვა).' : locale === 'ru' ? '• Используйте короткие и понятные названия (2–3 слова).' : '• Keep names short and descriptive (2–3 words).'}</p>
              <p>{locale === 'ka' ? '• კატეგორიები გამოიყენეთ მუდმივ თემებზე, თეგები - ერთჯერადზე.' : locale === 'ru' ? '• Используйте категории для постоянных тем, теги — для разовых.' : '• Use categories for ongoing themes; tags for one-off topics.'}</p>
              <p>{locale === 'ka' ? '• შეინარჩუნეთ 3-6 აქტიური კატეგორია რათა არ დაიკარგოს გადმოსახედი.' : locale === 'ru' ? '• Держите 3–6 активных категорий, чтобы сохранить обзорность.' : '• Aim for 3–6 active categories to avoid over-segmentation.'}</p>
              <p>{locale === 'ka' ? '• ხილვადობა გამორთეთ, სანამ შიდა სამუშაოს ასრულებთ.' : locale === 'ru' ? '• Отключайте видимость, пока готовите внутренний контент.' : '• Hide visibility while drafting internally.'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InlineEditCategory({ category, locale, onUpdated }: { category: CategorySummary; locale: string; onUpdated: (c: any) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category.name as string);
  const [slug, setSlug] = useState(category.slug as string);
  const [isPublic, setIsPublic] = useState(Boolean(category.isPublic));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tKA, setTKA] = useState<{ name: string; slug: string }>(() => {
    const t = category.translations?.find((x) => x.locale === 'ka');
    return { name: t?.name || '', slug: t?.slug || '' };
  });
  const [tEN, setTEN] = useState<{ name: string; slug: string }>(() => {
    const t = category.translations?.find((x) => x.locale === 'en');
    return { name: t?.name || '', slug: t?.slug || '' };
  });
  const [tRU, setTRU] = useState<{ name: string; slug: string }>(() => {
    const t = category.translations?.find((x) => x.locale === 'ru');
    return { name: t?.name || '', slug: t?.slug || '' };
  });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/company/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, slug, isPublic, translations: [
          { locale: 'ka', name: tKA.name, slug: tKA.slug },
          { locale: 'en', name: tEN.name, slug: tEN.slug },
          { locale: 'ru', name: tRU.name, slug: tRU.slug },
        ] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      onUpdated(data.category);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <input className="w-56 rounded border px-2 py-1 text-sm" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name" />
            <input className="w-56 rounded border px-2 py-1 text-sm" value={slug} onChange={(e)=>setSlug(e.target.value)} placeholder="slug" />
            <label className="flex items-center gap-2 text-xs">
              <span>Public</span>
              <Switch checked={isPublic} onCheckedChange={(v)=>setIsPublic(Boolean(v))} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded border p-2">
              <div className="text-[10px] font-medium mb-1">KA</div>
              <input className="mb-1 w-full rounded border px-2 py-1 text-xs" value={tKA.name} onChange={(e)=>setTKA(s=>({...s, name: e.target.value}))} placeholder="KA name" />
              <div className="flex items-center gap-1">
                <input className="flex-1 rounded border px-2 py-1 text-xs" value={tKA.slug} onChange={(e)=>setTKA(s=>({...s, slug: e.target.value}))} placeholder="ka-slug" />
                <button type="button" className="rounded border px-2 py-1 text-[10px]" onClick={()=>{
                  const base = (tKA.name || name).trim();
                  const slug = base.toLowerCase().normalize('NFKC').replace(/["'’`]/g,'').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-');
                  setTKA((s)=>({ ...s, slug }));
                }} title="Auto from name"><Wand2 className="h-3 w-3" /></button>
              </div>
            </div>
            <div className="rounded border p-2">
              <div className="text-[10px] font-medium mb-1">EN</div>
              <input className="mb-1 w-full rounded border px-2 py-1 text-xs" value={tEN.name} onChange={(e)=>setTEN(s=>({...s, name: e.target.value}))} placeholder="EN name" />
              <div className="flex items-center gap-1">
                <input className="flex-1 rounded border px-2 py-1 text-xs" value={tEN.slug} onChange={(e)=>setTEN(s=>({...s, slug: e.target.value}))} placeholder="en-slug" />
                <button type="button" className="rounded border px-2 py-1 text-[10px]" onClick={()=>{
                  const base = (tEN.name || name).trim();
                  const slug = base.toLowerCase().normalize('NFKC').replace(/["'’`]/g,'').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-');
                  setTEN((s)=>({ ...s, slug }));
                }} title="Auto from name"><Wand2 className="h-3 w-3" /></button>
              </div>
            </div>
            <div className="rounded border p-2">
              <div className="text-[10px] font-medium mb-1">RU</div>
              <input className="mb-1 w-full rounded border px-2 py-1 text-xs" value={tRU.name} onChange={(e)=>setTRU(s=>({...s, name: e.target.value}))} placeholder="RU name" />
              <div className="flex items-center gap-1">
                <input className="flex-1 rounded border px-2 py-1 text-xs" value={tRU.slug} onChange={(e)=>setTRU(s=>({...s, slug: e.target.value}))} placeholder="ru-slug" />
                <button type="button" className="rounded border px-2 py-1 text-[10px]" onClick={()=>{
                  const base = (tRU.name || name).trim();
                  const slug = base.toLowerCase().normalize('NFKC').replace(/["'’`]/g,'').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-');
                  setTRU((s)=>({ ...s, slug }));
                }} title="Auto from name"><Wand2 className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


