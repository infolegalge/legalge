'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from 'next/dynamic';
import slugify from 'slugify';
const RichEditor = dynamic(() => import('@/components/admin/RichEditor'), { ssr: false, loading: () => null });
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Save, 
  Eye, 
  Upload, 
  Loader2,
  ArrowLeft,
  FileText,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Post {
  id: string;
  title: string;
  excerpt?: string | null;
  body: string;
  coverImage?: string | null;
  publishedAt: string | null;
  status: string;
  slug: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  translations?: Array<{
    id: string;
    locale: 'ka' | 'en' | 'ru';
    title: string;
    slug: string;
    excerpt?: string | null;
    body?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
  }>;
}

interface AdminEditPostFormProps {
  locale: string;
  post: Post;
  translations?: Array<{
    id: string;
    locale: 'ka' | 'en' | 'ru';
    title: string;
    slug: string;
    excerpt?: string | null;
    body?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
  }>;
}

export default function AdminEditPostForm({ locale, post, translations = [] }: AdminEditPostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    title: post.title,
    excerpt: post.excerpt || '',
    content: post.body,
    coverImageUrl: post.coverImage || '',
    status: post.status as 'DRAFT' | 'PUBLISHED',
    date: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : ''
  });

  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [activeLocale, setActiveLocale] = useState<'ka'|'en'|'ru'>('ka');
  const [tData, setTData] = useState<
    Record<
      'ka' | 'en' | 'ru',
      {
        title: string;
        slug: string;
        excerpt: string;
        body: string;
        metaTitle: string;
        metaDescription: string;
      }
    >
  >({
    ka: {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      body: post.body,
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
    },
    en: {
      title: translations.find((t) => t.locale === 'en')?.title || '',
      slug: translations.find((t) => t.locale === 'en')?.slug || '',
      excerpt: translations.find((t) => t.locale === 'en')?.excerpt || '',
      body: translations.find((t) => t.locale === 'en')?.body || '',
      metaTitle: translations.find((t) => t.locale === 'en')?.metaTitle || '',
      metaDescription: translations.find((t) => t.locale === 'en')?.metaDescription || '',
    },
    ru: {
      title: translations.find((t) => t.locale === 'ru')?.title || '',
      slug: translations.find((t) => t.locale === 'ru')?.slug || '',
      excerpt: translations.find((t) => t.locale === 'ru')?.excerpt || '',
      body: translations.find((t) => t.locale === 'ru')?.body || '',
      metaTitle: translations.find((t) => t.locale === 'ru')?.metaTitle || '',
      metaDescription: translations.find((t) => t.locale === 'ru')?.metaDescription || '',
    },
  });

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/services/base'); // placeholder fetch to keep SSR happy if no route; we will fetch categories below
    })().catch(()=>{});
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/services/translation', { method: 'HEAD' }).catch(()=>null);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setAllCategories(data.categories || []);
          setSelectedCategoryIds(data.postCategoryIds || []);
        }
      } catch {}
    })();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          coverImageUrl: data.image.url
        }));
        setMessage({ type: 'success', text: 'Image uploaded successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to upload image' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    setLoading(true);
    setMessage(null);

    try {
      const prepared = {
        ka: {
          ...tData.ka,
          slug: ensureSlug(tData.ka.slug, tData.ka.title, "ka"),
        },
        en: {
          ...tData.en,
          slug: ensureSlug(tData.en.slug, tData.en.title, "en"),
        },
        ru: {
          ...tData.ru,
          slug: ensureSlug(tData.ru.slug, tData.ru.title, "ru"),
        },
      };

      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: prepared.ka.title,
          slug: prepared.ka.slug,
          excerpt: prepared.ka.excerpt,
          content: prepared.ka.body,
          coverImage: formData.coverImageUrl,
          status,
          date: formData.date ? new Date(formData.date).toISOString() : null,
          categoryIds: selectedCategoryIds,
          metaTitle: normalizeMeta(prepared.ka.metaTitle),
          metaDescription: normalizeMeta(prepared.ka.metaDescription),
          translations: [
            {
              locale: 'en',
              title: prepared.en.title,
              slug: prepared.en.slug,
              excerpt: prepared.en.excerpt,
              body: prepared.en.body,
              metaTitle: normalizeMeta(prepared.en.metaTitle),
              metaDescription: normalizeMeta(prepared.en.metaDescription),
            },
            {
              locale: 'ru',
              title: prepared.ru.title,
              slug: prepared.ru.slug,
              excerpt: prepared.ru.excerpt,
              body: prepared.ru.body,
              metaTitle: normalizeMeta(prepared.ru.metaTitle),
              metaDescription: normalizeMeta(prepared.ru.metaDescription),
            },
          ],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: status === 'PUBLISHED' 
            ? 'Post updated and published successfully!' 
            : 'Post updated and saved as draft!' 
        });
        
        // Redirect to admin posts list after a short delay
        setTimeout(() => {
          router.push(`/${locale}/admin/posts`);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update post. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update post. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Post deleted successfully!' });
        setTimeout(() => {
          router.push(`/${locale}/admin/posts`);
        }, 1500);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete post. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete post. Please try again.' });
    } finally {
      setDeleting(false);
    }
  };

  const slugFromTitle = (title: string, locale: 'ka' | 'en' | 'ru') => {
    const base = title.trim();
    if (!base) return '';
    if (locale === 'ka' || locale === 'ru') {
      return base
        .toLocaleLowerCase(locale)
        .normalize('NFKC')
        .replace(/["'’`]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
    }
    return slugify(base, { lower: true, strict: true, locale: 'en' });
  };

  const normalizeMeta = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  const ensureSlug = (value: string, title: string, locale: 'ka' | 'en' | 'ru') => {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
    return slugFromTitle(title, locale);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/admin/posts`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Posts
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Edit Post (Admin)</h1>
            <p className="text-muted-foreground">Edit and manage this post</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting || loading}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
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
            disabled={loading || !tData.ka.title}
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
            disabled={loading || !tData.ka.title || !tData.ka.body}
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
                Edit your post content and basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Switcher Tabs */}
              <Tabs defaultValue={activeLocale} onValueChange={(v) => setActiveLocale(v as 'ka'|'en'|'ru')}>
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="ka">ქართული</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="ru">Русский</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Localized Title/Excerpt */}
              <div className="space-y-2">
                <Label>Post Title ({activeLocale.toUpperCase()})</Label>
                <Input
                  value={tData[activeLocale].title}
                  onChange={(e) =>
                    setTData((prev) => {
                      const nextTitle = e.target.value;
                      const prevData = prev[activeLocale];
                      const autoSlug = slugFromTitle(prevData.title, activeLocale);
                      const slugWasAuto = !prevData.slug || prevData.slug === autoSlug;
                      return {
                        ...prev,
                        [activeLocale]: {
                          ...prevData,
                          title: nextTitle,
                          slug: slugWasAuto ? slugFromTitle(nextTitle, activeLocale) : prevData.slug,
                        },
                      };
                    })
                  }
                  placeholder="Enter title"
                  required={activeLocale === "ka"}
                />
              </div>
              <div className="space-y-2">
                <Label>Excerpt ({activeLocale.toUpperCase()})</Label>
                <Textarea
                  value={tData[activeLocale].excerpt}
                  onChange={(e) =>
                    setTData((prev) => ({
                      ...prev,
                      [activeLocale]: { ...prev[activeLocale], excerpt: e.target.value },
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Slug ({activeLocale.toUpperCase()})</Label>
                <div className="flex gap-2">
                  <Input
                    value={tData[activeLocale].slug}
                    onChange={(e) =>
                      setTData((prev) => ({
                        ...prev,
                        [activeLocale]: { ...prev[activeLocale], slug: e.target.value.trim() },
                      }))
                    }
                    placeholder="custom-slug"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setTData((prev) => ({
                        ...prev,
                        [activeLocale]: {
                          ...prev[activeLocale],
                          slug: slugFromTitle(prev[activeLocale].title, activeLocale),
                        },
                      }))
                    }
                  >
                    Auto
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use lowercase letters, numbers and hyphens. Leave blank to auto-generate when saving.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Content ({activeLocale.toUpperCase()})</Label>
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
                    onChange={(html) =>
                      setTData((prev) => ({
                        ...prev,
                        [activeLocale]: { ...prev[activeLocale], body: html },
                      }))
                    }
                  />
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Meta Title ({activeLocale.toUpperCase()})</Label>
                  <Input
                    value={tData[activeLocale].metaTitle}
                    maxLength={60}
                    placeholder="Custom SEO title"
                    onChange={(e) =>
                      setTData((prev) => ({
                        ...prev,
                        [activeLocale]: { ...prev[activeLocale], metaTitle: e.target.value },
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">{tData[activeLocale].metaTitle.length}/60</p>
                </div>
                <div className="space-y-2">
                  <Label>Meta Description ({activeLocale.toUpperCase()})</Label>
                  <Textarea
                    value={tData[activeLocale].metaDescription}
                    maxLength={155}
                    rows={3}
                    placeholder="Custom SEO description"
                    onChange={(e) =>
                      setTData((prev) => ({
                        ...prev,
                        [activeLocale]: { ...prev[activeLocale], metaDescription: e.target.value },
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">{tData[activeLocale].metaDescription.length}/155</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Post Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Settings</CardTitle>
              <CardDescription>
                Configure your post settings and metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Categories */}
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="grid gap-2">
                  {allCategories.map((c) => {
                    const checked = selectedCategoryIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
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
                <div className="text-xs text-muted-foreground">Manage categories in Admin → Categories.</div>
              </div>
              {/* Categories (tags) */}
              <div className="space-y-2">
                <Label htmlFor="categories">Categories</Label>
                <p className="text-xs text-muted-foreground">Assign categories on the post detail page (coming soon). For now, categories display based on linked PostCategory records.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Publication Date (optional)</Label>
                <Input
                  id="date"
                  name="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">Set a past or future date. Leaving empty keeps current behavior.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                <Input
                  id="coverImageUrl"
                  name="coverImageUrl"
                  value={formData.coverImageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="image-upload">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full cursor-pointer"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Image
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
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
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Publication Status</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="status"
                      value="DRAFT"
                      checked={formData.status === 'DRAFT'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'DRAFT' | 'PUBLISHED' }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'DRAFT' | 'PUBLISHED' }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Publish Immediately</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Post Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Post ID:</span>
                <span className="font-mono">{post.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug:</span>
                <span className="font-mono">{post.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Published:</span>
                <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Status:</span>
                <span className="capitalize">{post.status}</span>
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
                <span className="text-muted-foreground">KA Content:</span>
                <span>{tData.ka.body.length} characters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Word Count:</span>
                <span>{tData.ka.body.split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

