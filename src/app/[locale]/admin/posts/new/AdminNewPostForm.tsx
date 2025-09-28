'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from 'next/dynamic';
const RichEditor = dynamic(() => import('@/components/admin/RichEditor'), { ssr: false, loading: () => null });
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Save, 
  Eye, 
  Loader2,
  ArrowLeft,
  FileText
} from "lucide-react";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";
import { makeSlug } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminNewPostFormProps {
  locale: string;
}

export default function AdminNewPostForm({ locale }: AdminNewPostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [activeLocale, setActiveLocale] = useState<'ka'|'en'|'ru'>('ka');
  const [tData, setTData] = useState<Record<'ka'|'en'|'ru', { title: string; slug: string; excerpt: string; body: string }>>({
    ka: { title: '', slug: '', excerpt: '', body: '' },
    en: { title: '', slug: '', excerpt: '', body: '' },
    ru: { title: '', slug: '', excerpt: '', body: '' },
  });

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

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImageUrl: '',
    coverImageId: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: tData.ka.title,
          excerpt: tData.ka.excerpt,
          // API expects 'body' field name
          body: tData.ka.body,
          // API expects 'coverImage'
          coverImage: formData.coverImageUrl || null,
          status: status,
          // provide locale and slug explicitly
          locale: locale,
          slug: makeSlug(tData.ka.title as string, locale as any),
          categoryIds: selectedCategoryIds,
          translations: [
            { locale: 'en', title: tData.en.title, slug: makeSlug(tData.en.title || tData.ka.title, 'en' as any), excerpt: tData.en.excerpt, body: tData.en.body },
            { locale: 'ru', title: tData.ru.title, slug: makeSlug(tData.ru.title || tData.ka.title, 'ru' as any), excerpt: tData.ru.excerpt, body: tData.ru.body },
          ],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: status === 'PUBLISHED' 
            ? 'Post published successfully!' 
            : 'Post saved as draft!' 
        });
        
        // Redirect to admin posts list after a short delay
        setTimeout(() => {
          router.push(`/${locale}/admin/posts`);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save post. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save post. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
            <h1 className="text-2xl font-semibold">Create New Post (Admin)</h1>
            <p className="text-muted-foreground">Write and publish posts as an administrator</p>
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
                Write your post content and set the basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue={activeLocale} onValueChange={(v) => setActiveLocale(v as 'ka'|'en'|'ru')}>
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="ka">ქართული</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="ru">Русский</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label>Post Title ({activeLocale.toUpperCase()}) *</Label>
                <Input
                  value={tData[activeLocale].title}
                  onChange={(e)=> setTData(prev=>({ ...prev, [activeLocale]: { ...prev[activeLocale], title: e.target.value } }))}
                  placeholder="Enter a compelling title for your post"
                  required={activeLocale==='ka'}
                />
                {tData[activeLocale].title && (
                  <p className="text-xs text-muted-foreground">
                    URL: /news/{generateSlug(tData[activeLocale].title)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Excerpt ({activeLocale.toUpperCase()})</Label>
                <Textarea
                  value={tData[activeLocale].excerpt}
                  onChange={(e)=> setTData(prev=>({ ...prev, [activeLocale]: { ...prev[activeLocale], excerpt: e.target.value } }))}
                  placeholder="Write a brief summary (optional)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Content ({activeLocale.toUpperCase()}) *</Label>
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
                  <RichEditor name="content" initialHTML={tData[activeLocale].body} label="Content" onChange={(html)=> setTData(prev=>({ ...prev, [activeLocale]: { ...prev[activeLocale], body: html } }))} />
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
              <CardDescription>
                Configure your post settings and metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <ImageUpload
                  onImageUploaded={handleImageUploaded}
                  onError={handleImageError}
                  maxSize={10 * 1024 * 1024} // 10MB
                  disabled={loading}
                />
                {formData.coverImageUrl && (
                  <div className="text-xs text-muted-foreground">
                    Current image: {formData.coverImageUrl}
                  </div>
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
                <span className="text-muted-foreground">KA Content (chars):</span>
                <span>{tData.ka.body.replace(/<[^>]+>/g, '').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">KA Word Count:</span>
                <span>{tData.ka.body.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
