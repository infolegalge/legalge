'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Save, 
  Eye, 
  Loader2,
  ArrowLeft,
  FileText
} from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';
const RichEditor = dynamic(() => import('@/components/admin/RichEditor'), { ssr: false, loading: () => null });
import ImageUpload from "@/components/ImageUpload";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { makeSlug } from "@/lib/utils";

interface NewPostFormProps {
  locale: string;
}

export default function NewPostForm({ locale }: NewPostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    coverImageUrl: '',
    coverImageId: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  });
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [activeLocale, setActiveLocale] = useState<'ka'|'en'|'ru'>(['ka', 'en', 'ru'].includes(locale) ? (locale as 'ka'|'en'|'ru') : 'ka');
  const [tData, setTData] = useState<Record<'ka'|'en'|'ru', { title: string; slug: string; excerpt: string; body: string }>>({
    ka: { title: '', slug: '', excerpt: '', body: '' },
    en: { title: '', slug: '', excerpt: '', body: '' },
    ru: { title: '', slug: '', excerpt: '', body: '' },
  });

  const localeOptions: Array<{ code: 'ka' | 'en' | 'ru'; label: string }> = [
    { code: 'ka', label: 'ქართული' },
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setAllCategories(data.categories || []);
        }
      } catch {}
    })();
  }, []);

  const updateLocaleField = (loc: 'ka'|'en'|'ru', key: keyof typeof tData['ka'], value: string) => {
    setTData((prev) => ({
      ...prev,
      [loc]: {
        ...prev[loc],
        [key]: value,
      },
    }));
  };

  const hasBaseContent = tData.ka.title.trim().length > 0 && tData.ka.body.trim().length > 0;

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    setLoading(true);
    setMessage(null);

    try {
    const base = tData.ka;
    if (!base.title.trim() || !base.body.trim()) {
      setMessage({ type: 'error', text: 'Georgian title and content are required.' });
      setLoading(false);
      return;
    }

    const slug = ensureSlug(base.slug, base.title, 'ka');

    const translationsPayload = ['en', 'ru']
      .map((loc) => ({
        locale: loc,
        data: tData[loc],
      }))
      .filter(({ data }) => data.title.trim() || data.body.trim());

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: base.title,
          excerpt: base.excerpt,
          body: base.body,
          coverImage: formData.coverImageUrl || null,
          status,
          slug,
          locale,
          authorType: 'SPECIALIST',
          scope: 'specialist',
          categoryIds: selectedCategoryIds,
        translations: translationsPayload.map(({ locale: loc, data }) => ({
          locale: loc,
          title: data.title,
          slug: ensureSlug(data.slug, data.title, loc as 'en' | 'ru'),
          excerpt: data.excerpt,
          body: data.body,
        })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Create post failed', { status: response.status, statusText: response.statusText, data });
      }

      if (response.ok) {
        setMessage({
          type: 'success',
          text: status === 'PUBLISHED' ? 'Post published successfully!' : 'Post saved as draft!',
        });

        setTimeout(() => {
          router.push(`/${locale}/specialist/posts`);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save post. Please try again.' });
      }
    } catch (error) {
      console.error('Create post request error', error);
      setMessage({ type: 'error', text: 'Failed to save post. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploaded = (imageData: {
    id: string;
    url: string;
    webpUrl: string;
    filename: string;
    width: number;
    height: number;
    alt: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      coverImageUrl: imageData.url,
      coverImageId: imageData.id
    }));
    setMessage({ type: 'success', text: 'Image uploaded successfully!' });
  };

  const handleImageError = (error: string) => {
    setMessage({ type: 'error', text: error });
  };

  const handleFormDataChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const baseBodyText = useMemo(() => {
    const plain = tData.ka.body.replace(/<[^>]+>/g, ' ');
    return plain.replace(/\s+/g, ' ').trim();
  }, [tData.ka.body]);


  const normalizeMeta = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  const ensureSlug = (value: string, title: string, loc: 'ka' | 'en' | 'ru') => {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
    const baseTitle = title || tData.ka.title;
    return makeSlug(baseTitle, loc as any);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/specialist/posts`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Posts
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Create New Post</h1>
            <p className="text-muted-foreground">Write and publish your latest article</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSave('DRAFT')}
            disabled={loading || !hasBaseContent}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSave('PUBLISHED')}
            disabled={loading || !hasBaseContent}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
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
        {/* Post Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
              <CardDescription>
                Write your post content and set the basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <Tabs defaultValue={activeLocale} onValueChange={(v) => setActiveLocale(v as 'ka'|'en'|'ru')}>
              <TabsList className="grid w-full max-w-md grid-cols-3">
                {localeOptions.map((option) => (
                  <TabsTrigger key={option.code} value={option.code}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label>Post Title ({activeLocale.toUpperCase()}) *</Label>
              <Input
                value={tData[activeLocale].title}
                onChange={(e) => updateLocaleField(activeLocale, 'title', e.target.value)}
                placeholder="Enter a compelling title"
                required={activeLocale === 'ka'}
              />
              <p className="text-xs text-muted-foreground">
                Slug: /posts/{ensureSlug(tData[activeLocale].slug, tData[activeLocale].title, activeLocale)}
              </p>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => updateLocaleField(activeLocale, 'slug', makeSlug(tData[activeLocale].title, activeLocale))}
                >
                  Auto
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Leave blank to auto-generate from the title.</p>
            </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                {previewMode ? (
                  <div className="min-h-[400px] rounded-md border border-input bg-background p-4">
                    <div className="prose prose-sm max-w-none">
                      <h1>{tData[activeLocale].title || 'Untitled Post'}</h1>
                      {tData[activeLocale].excerpt && (
                        <p className="text-muted-foreground italic">{tData[activeLocale].excerpt}</p>
                      )}
                      <div className="whitespace-pre-wrap">
                        {tData[activeLocale].body || 'No content yet...'}
                      </div>
                    </div>
                  </div>
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

        {/* Post Settings */}
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
                    <input
                      type="radio"
                      name="status"
                      value="DRAFT"
                      checked={formData.status === 'DRAFT'}
                      onChange={(e) => handleFormDataChange('status', e.target.value)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Save as Draft</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="status"
                      value="PUBLISHED"
                      checked={formData.status === 'PUBLISHED'}
                      onChange={(e) => handleFormDataChange('status', e.target.value)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Publish Immediately</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cover Image</Label>
                <ImageUpload
                  onImageUploaded={handleImageUploaded}
                  onError={handleImageError}
                  maxSize={10 * 1024 * 1024}
                  disabled={loading}
                />
                {formData.coverImageUrl && (
                  <div className="text-xs text-muted-foreground">Current image: {formData.coverImageUrl}</div>
                )}
              </div>

              {formData.coverImageUrl && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="aspect-video rounded-md border bg-muted overflow-hidden">
                    <img
                      src={formData.coverImageUrl}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="grid grid-cols-2 gap-2">
                  {allCategories.map((c) => {
                    const checked = selectedCategoryIds.includes(c.id);
                    return (
                      <label key={c.id} className={`flex items-center gap-2 rounded border px-3 py-2 text-sm ${checked ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={(e) => {
                            setSelectedCategoryIds((prev) =>
                              e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)
                            );
                          }}
                        />
                        <span>{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Post Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">KA Title:</span>
                <span>{tData.ka.title.length} characters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">KA Excerpt:</span>
                <span>{tData.ka.excerpt.length} characters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Word Count:</span>
                <span>{tData.ka.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
