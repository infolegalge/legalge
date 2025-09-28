'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Loader2, Save, ArrowLeft, FileText } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { makeSlug } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const RichEditor = dynamic(() => import('@/components/admin/RichEditor'), { ssr: false, loading: () => null });

interface CompanyNewPostFormProps {
  locale: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

export default function CompanyNewPostForm({ locale }: CompanyNewPostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [activeLocale, setActiveLocale] = useState<'ka'|'en'|'ru'>(locale as 'ka'|'en'|'ru');

  const [tData, setTData] = useState<Record<'ka'|'en'|'ru', { title: string; slug: string; excerpt: string; body: string }>>({
    ka: { title: '', slug: '', excerpt: '', body: '' },
    en: { title: '', slug: '', excerpt: '', body: '' },
    ru: { title: '', slug: '', excerpt: '', body: '' },
  });

  const updateLocaleField = (loc: 'ka'|'en'|'ru', key: 'title'|'slug'|'excerpt'|'body', value: string) => {
    setTData((prev) => ({ ...prev, [loc]: { ...prev[loc], [key]: value } }));
  };

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/company/categories?includeGlobal=true', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    })();
  }, []);

  const hasBaseContent = tData[activeLocale].title.trim().length > 0 && tData[activeLocale].body.trim().length > 0;

  const ensureSlug = (value: string, title: string, loc: 'ka'|'en'|'ru') => {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
    return makeSlug(title || tData.ka.title, loc as any);
  };

  const cleanBodyText = useMemo(() => tData[activeLocale].body.replace(/<[^>]+>/g, ' ').trim(), [tData, activeLocale]);
  const wordCount = useMemo(() => (cleanBodyText ? cleanBodyText.split(/\s+/).filter(Boolean).length : 0), [cleanBodyText]);

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    setLoading(true);
    setMessage(null);

    try {
      const baseLoc = activeLocale; // use the currently active locale as base
      const base = tData[baseLoc];
      if (!base.title.trim() || !base.body.trim()) {
        setMessage({ type: 'error', text: 'Title and content are required.' });
        setLoading(false);
        return;
      }

      const translationsPayload = (['ka','en','ru'] as const)
        .filter((loc) => loc !== baseLoc)
        .map((loc) => ({ loc, data: tData[loc] }))
        .filter(({ data }) => data.title.trim() || data.body.trim())
        .map(({ loc, data }) => ({
          locale: loc,
          title: data.title,
          slug: ensureSlug(data.slug, data.title, loc),
          excerpt: data.excerpt,
          body: data.body,
        }));

      const payload = {
        title: base.title,
        slug: ensureSlug(base.slug, base.title, baseLoc),
        excerpt: base.excerpt,
        body: base.body,
        coverImage: '',
        status,
        locale: baseLoc,
        authorType: 'COMPANY',
        scope: 'company',
        categoryIds: selectedCategoryIds,
        translations: translationsPayload,
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error('Company post create failed', { status: res.status, statusText: res.statusText, data });
        setMessage({ type: 'error', text: `Failed to save post: ${data?.error || res.statusText}` });
        return;
      }

      setMessage({
        type: 'success',
        text: status === 'PUBLISHED' ? 'Post published successfully!' : 'Post saved as draft!',
      });

      setTimeout(() => {
        router.push(`/${locale}/company/posts`);
      }, 1200);
    } catch (error) {
      console.error('Company post create error', error);
      setMessage({ type: 'error', text: 'Failed to save post. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploaded = (imageData: { id: string; url: string; webpUrl: string; filename: string; width: number; height: number; alt: string; }) => {
    setMessage({ type: 'success', text: 'Image uploaded successfully!' });
  };

  const handleImageError = (error: string) => {
    setMessage({ type: 'error', text: error });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/company/posts`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Posts
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Create Company Post</h1>
            <p className="text-muted-foreground">Share your organisation&apos;s expertise with the audience.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={() => handleSave('DRAFT')} disabled={loading || !hasBaseContent}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Draft
          </Button>
          <Button onClick={() => handleSave('PUBLISHED')} disabled={loading || !hasBaseContent}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Publish
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
              <CardDescription>Write your post content and set the basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue={activeLocale} onValueChange={(v) => setActiveLocale(v as 'ka'|'en'|'ru')}>
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="ka">KA</TabsTrigger>
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="ru">RU</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label>Post Title ({activeLocale.toUpperCase()}) *</Label>
                <Input
                  value={tData[activeLocale].title}
                  onChange={(e) => updateLocaleField(activeLocale, 'title', e.target.value)}
                  placeholder="Enter a compelling title"
                  required
                />
                <p className="text-xs text-muted-foreground">Slug: /posts/{ensureSlug(tData[activeLocale].slug, tData[activeLocale].title, activeLocale)}</p>
              </div>

              <div className="space-y-2">
                <Label>Excerpt ({activeLocale.toUpperCase()})</Label>
                <Textarea
                  value={tData[activeLocale].excerpt}
                  onChange={(e) => updateLocaleField(activeLocale, 'excerpt', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Slug ({activeLocale.toUpperCase()})</Label>
                <div className="flex gap-2">
                  <Input
                    value={tData[activeLocale].slug}
                    onChange={(e) => updateLocaleField(activeLocale, 'slug', e.target.value)}
                    placeholder="custom-slug"
                  />
                  <Button type="button" variant="outline" onClick={() => updateLocaleField(activeLocale, 'slug', makeSlug(tData[activeLocale].title, activeLocale))}>Auto</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content *</Label>
                {previewMode ? (
                  <div className="min-h-[300px] rounded-md border p-3 text-sm text-muted-foreground">Preview not implemented</div>
                ) : (
                  <RichEditor
                    key={`editor-${activeLocale}`}
                    name={`content-${activeLocale}`}
                    initialHTML={tData[activeLocale].body}
                    label="Content"
                    onChange={(html) => updateLocaleField(activeLocale, 'body', html)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Settings</CardTitle>
              <CardDescription>Configure your post settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Publication Status</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="radio" name="status" value="DRAFT" checked={true} onChange={() => {}} className="rounded border-gray-300" />
                    <span className="text-sm">Save as Draft</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((c) => {
                    const checked = selectedCategoryIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={checked} onChange={(e) => setSelectedCategoryIds((prev) => e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id))} />
                        <span>{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">Words: {wordCount}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


