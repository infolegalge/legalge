"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Globe, Languages, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AutoSlug from '@/components/admin/AutoSlug';
import type { Locale } from '@/i18n/locales';

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  lastUpdated: string;
  translations: LegalPageTranslation[];
}

interface LegalPageTranslation {
  id: string;
  locale: string;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface LegalPagesManagementProps {
  initialLegalPages: LegalPage[];
  locale: Locale;
}

export default function LegalPagesManagement({ initialLegalPages }: LegalPagesManagementProps) {
  const [legalPages, setLegalPages] = useState<LegalPage[]>(initialLegalPages);
  const [selectedPage, setSelectedPage] = useState<LegalPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('base');

  // Form states
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: ''
  });

  const [translations, setTranslations] = useState<Record<string, {
    title: string;
    slug: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
  }>>({
    ka: { title: '', slug: '', content: '', metaTitle: '', metaDescription: '' },
    en: { title: '', slug: '', content: '', metaTitle: '', metaDescription: '' },
    ru: { title: '', slug: '', content: '', metaTitle: '', metaDescription: '' }
  });

  // const loadLegalPages = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await fetch('/api/admin/legal-pages', {
  //       credentials: 'include'
  //     });
      
  //     if (response.ok) {
  //       const data = await response.json();
  //       setLegalPages(data);
  //     } else {
  //       setError('Failed to load legal pages');
  //     }
  //   } catch {
  //     setError('Failed to load legal pages');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleCreatePage = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/legal-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newPage = await response.json();
        setLegalPages(prev => [newPage, ...prev]);
        setSuccess('Legal page created successfully!');
        setIsCreating(false);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create legal page');
      }
    } catch {
      setError('Failed to create legal page');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePage = async () => {
    if (!selectedPage) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/legal-pages/${selectedPage.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          lastUpdated: new Date().toISOString()
        })
      });

      if (response.ok) {
        const updatedPage = await response.json();
        setLegalPages(prev => prev.map(p => p.id === selectedPage.id ? updatedPage : p));
        setSelectedPage(updatedPage);
        setSuccess('Legal page updated successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update legal page');
      }
    } catch {
      setError('Failed to update legal page');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTranslation = async (locale: string) => {
    if (!selectedPage) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/legal-pages/${selectedPage.id}/translations/${locale}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(translations[locale])
      });

      if (response.ok) {
        const updatedTranslation = await response.json();
        setSelectedPage(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            translations: prev.translations.map(t => 
              t.locale === locale ? updatedTranslation : t
            )
          };
        });
        setSuccess(`${locale.toUpperCase()} translation updated successfully!`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to update ${locale.toUpperCase()} translation`);
      }
    } catch {
      setError(`Failed to update ${locale.toUpperCase()} translation`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this legal page? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/legal-pages/${pageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setLegalPages(prev => prev.filter(p => p.id !== pageId));
        if (selectedPage?.id === pageId) {
          setSelectedPage(null);
        }
        setSuccess('Legal page deleted successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete legal page');
      }
    } catch {
      setError('Failed to delete legal page');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ slug: '', title: '', content: '' });
    setTranslations({
      ka: { title: '', slug: '', content: '', metaTitle: '', metaDescription: '' },
      en: { title: '', slug: '', content: '', metaTitle: '', metaDescription: '' },
      ru: { title: '', slug: '', content: '', metaTitle: '', metaDescription: '' }
    });
    setActiveTab('base');
  };

  const editPage = (page: LegalPage) => {
    setSelectedPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content
    });

    // Load translations
    const translationData: Record<string, { title: string; slug: string; content: string; metaTitle: string; metaDescription: string }> = {
      ka: { title: '', slug: '', content: '', metaTitle: '', metaDescription: '' },
      en: { title: '', slug: '', content: '', metaTitle: '', metaDescription: '' },
      ru: { title: '', slug: '', content: '', metaTitle: '', metaDescription: '' }
    };

    page.translations.forEach(translation => {
      translationData[translation.locale] = {
        title: translation.title,
        slug: translation.slug,
        content: translation.content,
        metaTitle: translation.metaTitle || '',
        metaDescription: translation.metaDescription || ''
      };
    });

    setTranslations(translationData);
    setIsCreating(false);
    setActiveTab('base');
  };

  const startCreating = () => {
    setSelectedPage(null);
    resetForm();
    setIsCreating(true);
    setActiveTab('base');
  };

  const cancelEditing = () => {
    setSelectedPage(null);
    setIsCreating(false);
    resetForm();
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Legal Pages ({legalPages.length})</h3>
          <p className="text-sm text-muted-foreground">Manage your legal pages and their translations</p>
        </div>
        <Button onClick={startCreating} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Page
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Legal Pages List */}
        <div className="space-y-4">
          {legalPages.map((page) => (
            <Card key={page.id} className={`cursor-pointer transition-colors ${
              selectedPage?.id === page.id ? 'ring-2 ring-primary' : ''
            }`} onClick={() => editPage(page)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>/{page.slug}</span>
                      <span>•</span>
                      <span>Last updated: {new Date(page.lastUpdated).toLocaleDateString()}</span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePage(page.id);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Languages className="h-3 w-3" />
                  <span>{page.translations.length} translations</span>
                  {page.translations.map(t => (
                    <span key={t.locale} className="px-1.5 py-0.5 bg-muted rounded text-xs">
                      {t.locale.toUpperCase()}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Form */}
        {(selectedPage || isCreating) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {isCreating ? (
                    <>
                      <Plus className="h-5 w-5" />
                      Create Legal Page
                    </>
                  ) : (
                    <>
                      <Edit className="h-5 w-5" />
                      Edit Legal Page
                    </>
                  )}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={cancelEditing}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="base" className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    Base
                  </TabsTrigger>
                  <TabsTrigger value="ka" className="flex items-center gap-2">
                    🇬🇪 KA
                  </TabsTrigger>
                  <TabsTrigger value="en" className="flex items-center gap-2">
                    🇺🇸 EN
                  </TabsTrigger>
                  <TabsTrigger value="ru" className="flex items-center gap-2">
                    🇷🇺 RU
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="base" className="space-y-4">
                  <AutoSlug titleName="title" slugName="slug" />
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded border px-3 py-2"
                      placeholder="Terms of Service"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full rounded border px-3 py-2"
                      placeholder="terms"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Content</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={12}
                      className="w-full rounded border px-3 py-2"
                      placeholder="Enter the legal page content..."
                    />
                  </div>

                  <Button 
                    onClick={isCreating ? handleCreatePage : handleUpdatePage}
                    disabled={loading}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : (isCreating ? 'Create Page' : 'Update Page')}
                  </Button>
                </TabsContent>

                {['ka', 'en', 'ru'].map((lang) => (
                  <TabsContent key={lang} value={lang} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title ({lang.toUpperCase()})</label>
                      <input
                        type="text"
                        value={translations[lang].title}
                        onChange={(e) => setTranslations(prev => ({
                          ...prev,
                          [lang]: { ...prev[lang], title: e.target.value }
                        }))}
                        className="w-full rounded border px-3 py-2"
                        placeholder={`Title in ${lang.toUpperCase()}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Slug ({lang.toUpperCase()})</label>
                      <input
                        type="text"
                        value={translations[lang].slug}
                        onChange={(e) => setTranslations(prev => ({
                          ...prev,
                          [lang]: { ...prev[lang], slug: e.target.value }
                        }))}
                        className="w-full rounded border px-3 py-2"
                        placeholder={`slug-in-${lang}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Meta Title ({lang.toUpperCase()})</label>
                      <input
                        type="text"
                        value={translations[lang].metaTitle}
                        onChange={(e) => setTranslations(prev => ({
                          ...prev,
                          [lang]: { ...prev[lang], metaTitle: e.target.value }
                        }))}
                        className="w-full rounded border px-3 py-2"
                        placeholder={`SEO title in ${lang.toUpperCase()}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Meta Description ({lang.toUpperCase()})</label>
                      <textarea
                        value={translations[lang].metaDescription}
                        onChange={(e) => setTranslations(prev => ({
                          ...prev,
                          [lang]: { ...prev[lang], metaDescription: e.target.value }
                        }))}
                        rows={2}
                        className="w-full rounded border px-3 py-2"
                        placeholder={`SEO description in ${lang.toUpperCase()}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Content ({lang.toUpperCase()})</label>
                      <textarea
                        value={translations[lang].content}
                        onChange={(e) => setTranslations(prev => ({
                          ...prev,
                          [lang]: { ...prev[lang], content: e.target.value }
                        }))}
                        rows={12}
                        className="w-full rounded border px-3 py-2"
                        placeholder={`Content in ${lang.toUpperCase()}`}
                      />
                    </div>

                    <Button 
                      onClick={() => handleUpdateTranslation(lang)}
                      disabled={loading}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : `Update ${lang.toUpperCase()} Translation`}
                    </Button>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
