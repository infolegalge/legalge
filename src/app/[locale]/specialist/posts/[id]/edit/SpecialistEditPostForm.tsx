'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { makeSlug } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
const RichEditor = dynamic(() => import('@/components/admin/RichEditor'), { ssr: false, loading: () => null });

interface Post {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  date: string | null;
  status: string;
  slug: string;
  categories?: Array<{ id: string; name: string }>;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  translations?: Array<{
    locale: 'ka'|'en'|'ru';
    title?: string | null;
    excerpt?: string | null;
    body?: string | null;
    slug?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
  }>;
}

interface SpecialistEditPostFormProps {
  locale: string;
  post: Post;
}

export default function SpecialistEditPostForm({ locale, post }: SpecialistEditPostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(post.categories?.map((c) => c.id) ?? []);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch {}
    })();
  }, []);

  
  const [activeLocale, setActiveLocale] = useState<'ka'|'en'|'ru'>('ka');
  const [tData, setTData] = useState<Record<'ka'|'en'|'ru', { title: string; excerpt: string; body: string; slug: string; metaTitle: string; metaDescription: string; ogTitle: string; ogDescription: string }>>({
    ka: {
      title: post.title || '',
      excerpt: post.excerpt || '',
      body: post.content || '',
      slug: post.slug || '',
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      ogTitle: post.ogTitle || '',
      ogDescription: post.ogDescription || '',
    },
    en: {
      title: post.translations?.find((t) => t.locale === 'en')?.title || '',
      excerpt: post.translations?.find((t) => t.locale === 'en')?.excerpt || '',
      body: post.translations?.find((t) => t.locale === 'en')?.body || '',
      slug: post.translations?.find((t) => t.locale === 'en')?.slug || '',
      metaTitle: post.translations?.find((t) => t.locale === 'en')?.metaTitle || '',
      metaDescription: post.translations?.find((t) => t.locale === 'en')?.metaDescription || '',
      ogTitle: post.translations?.find((t) => t.locale === 'en')?.ogTitle || '',
      ogDescription: post.translations?.find((t) => t.locale === 'en')?.ogDescription || '',
    },
    ru: {
      title: post.translations?.find((t) => t.locale === 'ru')?.title || '',
      excerpt: post.translations?.find((t) => t.locale === 'ru')?.excerpt || '',
      body: post.translations?.find((t) => t.locale === 'ru')?.body || '',
      slug: post.translations?.find((t) => t.locale === 'ru')?.slug || '',
      metaTitle: post.translations?.find((t) => t.locale === 'ru')?.metaTitle || '',
      metaDescription: post.translations?.find((t) => t.locale === 'ru')?.metaDescription || '',
      ogTitle: post.translations?.find((t) => t.locale === 'ru')?.ogTitle || '',
      ogDescription: post.translations?.find((t) => t.locale === 'ru')?.ogDescription || '',
    },
  });
  const [formData, setFormData] = useState({
    coverImageUrl: post.coverImageUrl || '',
    status: (post.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, status: value as 'DRAFT' | 'PUBLISHED' }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: fd,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          coverImageUrl: data.image.url
        }));
        setMessage({ type: 'success', text: 'Image uploaded successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to upload image' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/posts/${post.id}?scope=specialist`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: tData.ka.title,
          slug: tData.ka.slug,
          excerpt: tData.ka.excerpt,
          content: tData.ka.body,
          coverImageUrl: formData.coverImageUrl,
          status: formData.status,
          categoryIds: selectedCategoryIds,
          metaTitle: normalizeOptional(tData.ka.metaTitle),
          metaDescription: normalizeOptional(tData.ka.metaDescription),
          ogTitle: normalizeOptional(tData.ka.ogTitle),
          ogDescription: normalizeOptional(tData.ka.ogDescription),
          translations: [
            {
              locale: 'en',
              title: tData.en.title,
              slug: tData.en.slug,
              excerpt: tData.en.excerpt,
              body: tData.en.body,
              metaTitle: normalizeOptional(tData.en.metaTitle),
              metaDescription: normalizeOptional(tData.en.metaDescription),
              ogTitle: normalizeOptional(tData.en.ogTitle),
              ogDescription: normalizeOptional(tData.en.ogDescription),
            },
            {
              locale: 'ru',
              title: tData.ru.title,
              slug: tData.ru.slug,
              excerpt: tData.ru.excerpt,
              body: tData.ru.body,
              metaTitle: normalizeOptional(tData.ru.metaTitle),
              metaDescription: normalizeOptional(tData.ru.metaDescription),
              ogTitle: normalizeOptional(tData.ru.ogTitle),
              ogDescription: normalizeOptional(tData.ru.ogDescription),
            },
          ],
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Post updated successfully!' });
        setTimeout(() => {
          router.push(`/${locale}/specialist/posts`);
        }, 1500);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to update post' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update post' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}?scope=specialist`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push(`/${locale}/specialist/posts`);
      } else {
        setMessage({ type: 'error', text: 'Failed to delete post' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete post' });
    } finally {
      setDeleting(false);
    }
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
            <h1 className="text-2xl font-semibold">Edit Post</h1>
            <p className="text-muted-foreground">Update your blog post or article</p>
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
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
                <CardDescription>Write and format your post content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Language tabs */}
                <div className="flex gap-2">
                  {(['ka','en','ru'] as const).map((code) => (
                    <Button key={code} type="button" variant={activeLocale===code?'default':'outline'} size="sm" onClick={()=>setActiveLocale(code)}>
                      {code.toUpperCase()}
                    </Button>
                  ))}
                </div>

                <div>
                  <Label>Title *</Label>
                  <Input
                    value={tData[activeLocale].title}
                    onChange={(e)=> setTData(prev=>({ ...prev, [activeLocale]: { ...prev[activeLocale], title: e.target.value } }))}
                    placeholder="Enter post title"
                    required={activeLocale==='ka'}
                  />
                </div>

                <div>
                  <Label>Slug ({activeLocale.toUpperCase()})</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tData[activeLocale].slug}
                      onChange={(e)=> setTData(prev=>({ ...prev, [activeLocale]: { ...prev[activeLocale], slug: e.target.value } }))}
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
                            slug: makeSlug(prev[activeLocale].title, activeLocale as any),
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

                <div>
                  <Label>Excerpt</Label>
                  <Textarea
                    value={tData[activeLocale].excerpt}
                    onChange={(e)=> setTData(prev=>({ ...prev, [activeLocale]: { ...prev[activeLocale], excerpt: e.target.value } }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Content *</Label>
                  <RichEditor
                    key={`editor-${activeLocale}`}
                    name={`content-${activeLocale}`}
                    initialHTML={tData[activeLocale].body}
                    label="Content"
                    onChange={(html)=> setTData(prev=>({ ...prev, [activeLocale]: { ...prev[activeLocale], body: html } }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Publish Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleStatusChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
                <CardDescription>
                  Upload a cover image for your post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.coverImageUrl && (
                  <div className="space-y-2">
                    <img
                      src={formData.coverImageUrl}
                      alt="Cover"
                      className="w-full h-32 object-cover rounded-md"
                      loading="lazy"
                      decoding="async"
                    />
                    <Input
                      value={formData.coverImageUrl}
                      onChange={handleInputChange}
                      name="coverImageUrl"
                      placeholder="Image URL"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="image-upload">Upload Image</Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Update Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
