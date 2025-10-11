'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Eye, Loader2, ArrowLeft, FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { makeSlug } from '@/lib/utils';
import { Textarea } from "@/components/ui/textarea"
const RichEditor = dynamic(() => import('@/components/admin/RichEditor'), { ssr: false, loading: () => null });
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUpload from '@/components/ImageUpload';

type SupportedLocale = 'ka' | 'en' | 'ru';

type LocalePayload = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  coverImageAlt: string;
};

type LocaleFieldKey = keyof LocalePayload;

interface Post {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  coverImageAlt?: string | null;
  date: string | null;
  status: string;
  slug: string;
  author?: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    companyId?: string | null;
  };
  categories?: Array<{ id: string; name: string }>;
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
}

interface CompanyEditPostFormProps {
  locale: string;
  post: Post;
  translations?: Array<{
    locale: 'ka' | 'en' | 'ru';
    title: string;
    slug: string;
    excerpt: string | null;
    body: string | null;
    metaTitle?: string;
    metaDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
    coverImageAlt?: string | null;
  }>;
}

export default function CompanyEditPostForm({ locale, post, translations = [] }: CompanyEditPostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [activeLocale, setActiveLocale] = useState<SupportedLocale>(locale as SupportedLocale);
  const blankLocale: LocalePayload = {
    title: '',
    slug: '',
    excerpt: '',
    body: '',
    metaTitle: '',
    metaDescription: '',
    ogTitle: '',
    ogDescription: '',
    coverImageAlt: '',
  };
 
  const [tData, setTData] = useState<Record<SupportedLocale, LocalePayload>>({
    ka: {
      ...blankLocale,
      title: locale === 'ka' ? post.title : (translations.find(t => t.locale === 'ka')?.title || ''),
      slug: locale === 'ka' ? post.slug : (translations.find(t => t.locale === 'ka')?.slug || ''),
      excerpt: locale === 'ka' ? (post.excerpt || '') : (translations.find(t => t.locale === 'ka')?.excerpt || ''),
      body: locale === 'ka' ? post.content : (translations.find(t => t.locale === 'ka')?.body || ''),
      metaTitle: locale === 'ka' ? (post.metaTitle || '') : (translations.find(t => t.locale === 'ka')?.metaTitle || ''),
      metaDescription: locale === 'ka' ? (post.metaDescription || '') : (translations.find(t => t.locale === 'ka')?.metaDescription || ''),
      ogTitle: locale === 'ka' ? (post.ogTitle || '') : (translations.find(t => t.locale === 'ka')?.ogTitle || ''),
      ogDescription: locale === 'ka' ? (post.ogDescription || '') : (translations.find(t => t.locale === 'ka')?.ogDescription || ''),
      coverImageAlt: '',
    },
    en: {
      ...blankLocale,
      title: locale === 'en' ? post.title : (translations.find(t => t.locale === 'en')?.title || ''),
      slug: locale === 'en' ? post.slug : (translations.find(t => t.locale === 'en')?.slug || ''),
      excerpt: locale === 'en' ? (post.excerpt || '') : (translations.find(t => t.locale === 'en')?.excerpt || ''),
      body: locale === 'en' ? post.content : (translations.find(t => t.locale === 'en')?.body || ''),
      metaTitle: locale === 'en' ? (post.metaTitle || '') : (translations.find(t => t.locale === 'en')?.metaTitle || ''),
      metaDescription: locale === 'en' ? (post.metaDescription || '') : (translations.find(t => t.locale === 'en')?.metaDescription || ''),
      ogTitle: locale === 'en' ? (post.ogTitle || '') : (translations.find(t => t.locale === 'en')?.ogTitle || ''),
      ogDescription: locale === 'en' ? (post.ogDescription || '') : (translations.find(t => t.locale === 'en')?.ogDescription || ''),
      coverImageAlt: '',
    },
    ru: {
      ...blankLocale,
      title: locale === 'ru' ? post.title : (translations.find(t => t.locale === 'ru')?.title || ''),
      slug: locale === 'ru' ? post.slug : (translations.find(t => t.locale === 'ru')?.slug || ''),
      excerpt: locale === 'ru' ? (post.excerpt || '') : (translations.find(t => t.locale === 'ru')?.excerpt || ''),
      body: locale === 'ru' ? post.content : (translations.find(t => t.locale === 'ru')?.body || ''),
      metaTitle: locale === 'ru' ? (post.metaTitle || '') : (translations.find(t => t.locale === 'ru')?.metaTitle || ''),
      metaDescription: locale === 'ru' ? (post.metaDescription || '') : (translations.find(t => t.locale === 'ru')?.metaDescription || ''),
      ogTitle: locale === 'ru' ? (post.ogTitle || '') : (translations.find(t => t.locale === 'ru')?.ogTitle || ''),
      ogDescription: locale === 'ru' ? (post.ogDescription || '') : (translations.find(t => t.locale === 'ru')?.ogDescription || ''),
      coverImageAlt: '',
    },
  });
  const updateLocaleField = (loc: SupportedLocale, key: LocaleFieldKey, value: string) => {
    setTData(prev => ({ ...prev, [loc]: { ...prev[loc], [key]: value } }));
  };
  const [coverImageUrl, setCoverImageUrl] = useState(post.coverImageUrl || '');
  const [statusValue, setStatusValue] = useState(post.status);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(post.categories?.map((c) => c.id) ?? []);
  const [coverImageAlt, setCoverImageAlt] = useState(post.coverImageAlt || '');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTData(prev => ({ ...prev, [activeLocale]: { ...prev[activeLocale], [name as any]: value } }));
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
    setCoverImageUrl(imageData.url);
    if (imageData.alt && imageData.alt.trim()) {
      setCoverImageAlt(imageData.alt.trim());
    }
    setMessage({ type: 'success', text: 'Image uploaded successfully!' });
  };

  const handleImageError = (error: string) => {
    setMessage({ type: 'error', text: error });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/posts/${post.id}?scope=company`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: tData[activeLocale].title,
          slug: tData[activeLocale].slug || makeSlug(tData[activeLocale].title, activeLocale as any),
          excerpt: tData[activeLocale].excerpt,
          content: tData[activeLocale].body,
          coverImage: coverImageUrl,
          coverImageAlt: coverImageAlt.trim() || null,
          status: statusValue,
          categoryIds: selectedCategoryIds,
          metaTitle: tData[activeLocale].metaTitle,
          metaDescription: tData[activeLocale].metaDescription,
          ogTitle: tData[activeLocale].ogTitle,
          ogDescription: tData[activeLocale].ogDescription,
          translations: (['ka','en','ru'] as const)
            .filter((loc) => loc !== activeLocale)
            .map((loc) => ({
              locale: loc,
              title: tData[loc].title,
              slug: tData[loc].slug || makeSlug(tData[loc].title, loc as any),
              excerpt: tData[loc].excerpt,
              body: tData[loc].body,
              metaTitle: tData[loc].metaTitle,
              metaDescription: tData[loc].metaDescription,
              ogTitle: tData[loc].ogTitle,
              ogDescription: tData[loc].ogDescription,
            })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update post');
      }

      setMessage({ type: 'success', text: 'Post updated successfully!' });
      setTimeout(() => {
        router.push(`/${locale}/company/posts`);
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update post' });
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
      const response = await fetch(`/api/posts/${post.id}?scope=company`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete post');
      }

      setMessage({ type: 'success', text: 'Post deleted successfully!' });
      setTimeout(() => {
        router.push(`/${locale}/company/posts`);
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to delete post' });
    } finally {
      setDeleting(false);
    }
  };

  const generateSlug = (title: string) => makeSlug(title, activeLocale as any);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setTData(prev => ({
      ...prev,
      [activeLocale]: {
        ...prev[activeLocale],
        title,
        slug: (prev[activeLocale].slug?.trim() ? prev[activeLocale].slug : makeSlug(title, activeLocale as any))
      }
    }));
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/company/categories?postId=' + encodeURIComponent(post.id), { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
          if (!post.categories?.length) {
            setSelectedCategoryIds(data.postCategoryIds || []);
          }
        }
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    })();
  }, [post.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href={`/${locale}/company/posts`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Posts
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Post</h1>
          <p className="text-muted-foreground">Update your company post</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Post Content
              </CardTitle>
              <CardDescription>
                Update your post content and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Tabs value={activeLocale} onValueChange={(value) => setActiveLocale(value as SupportedLocale)}>
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="ka">KA</TabsTrigger>
                    <TabsTrigger value="en">EN</TabsTrigger>
                    <TabsTrigger value="ru">RU</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={tData[activeLocale].title}
                    onChange={(e) => updateLocaleField(activeLocale, 'title', e.target.value)}
                    placeholder="Enter post title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={tData[activeLocale].slug}
                    onChange={(e) => updateLocaleField(activeLocale, 'slug', e.target.value)}
                    placeholder="post-url-slug"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={tData[activeLocale].excerpt}
                    onChange={(e) => updateLocaleField(activeLocale, 'excerpt', e.target.value)}
                    placeholder="Brief description of the post"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    name="metaTitle"
                    value={tData[activeLocale].metaTitle}
                    onChange={(e) => updateLocaleField(activeLocale, 'metaTitle', e.target.value)}
                    placeholder="SEO title for search results"
                  />
                </div>

                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={tData[activeLocale].metaDescription}
                    onChange={(e) => updateLocaleField(activeLocale, 'metaDescription', e.target.value)}
                    placeholder="Short summary for search or previews"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="ogTitle">OG Title</Label>
                  <Input
                    id="ogTitle"
                    name="ogTitle"
                    value={tData[activeLocale].ogTitle}
                    onChange={(e) => updateLocaleField(activeLocale, 'ogTitle', e.target.value)}
                    placeholder="Title for social sharing"
                  />
                </div>

                <div>
                  <Label htmlFor="ogDescription">OG Description</Label>
                  <Textarea
                    id="ogDescription"
                    name="ogDescription"
                    value={tData[activeLocale].ogDescription}
                    onChange={(e) => updateLocaleField(activeLocale, 'ogDescription', e.target.value)}
                    placeholder="Description for social sharing"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <RichEditor
                    key={`editor-${activeLocale}`}
                    name={`content-${activeLocale}`}
                    initialHTML={tData[activeLocale].body}
                    label="Content"
                    onChange={(html) => updateLocaleField(activeLocale, 'body', html)}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value)}
                    className="w-full rounded border px-3 py-2"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Categories</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => {
                      const checked = selectedCategoryIds.includes(category.id);
                      return (
                        <label
                          key={category.id}
                          className={`flex items-center gap-2 rounded border px-3 py-2 text-sm ${checked ? 'border-primary bg-primary/5' : 'border-muted'}`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            onChange={(e) => {
                              setSelectedCategoryIds((prev) =>
                                e.target.checked ? [...prev, category.id] : prev.filter((id) => id !== category.id)
                              );
                            }}
                          />
                          <span>{category.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Post
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
              <CardDescription>
                Upload a cover image for your post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                onError={handleImageError}
                maxSize={10 * 1024 * 1024}
                disabled={loading}
                defaultAlt={coverImageAlt}
                altValue={coverImageAlt}
                onAltChange={(value) => setCoverImageAlt(value)}
                altLabel="Cover image alt"
              />
              {coverImageUrl && (
                <div className="space-y-2">
                  <img
                    src={coverImageUrl}
                    alt={coverImageAlt || 'Cover'}
                    className="w-full rounded-lg border"
                    loading="lazy"
                    decoding="async"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCoverImageUrl('')}
                  >
                    Remove Image
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Post Info */}
          <Card>
            <CardHeader>
              <CardTitle>Post Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">ID:</span> {post.id}
              </div>
              <div>
                <span className="font-medium">Author:</span> {post.author?.name || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Created:</span> {post.date ? new Date(post.date).toLocaleDateString() : 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Status:</span> {post.status}
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                {previewMode ? 'Hide Preview' : 'Show Preview'}
              </Button>
              
              {previewMode && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold">{tData[activeLocale].title}</h3>
                  {tData[activeLocale].excerpt && (
                    <p className="text-sm text-muted-foreground">{tData[activeLocale].excerpt}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    URL: /{locale}/news/{tData[activeLocale].slug}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
