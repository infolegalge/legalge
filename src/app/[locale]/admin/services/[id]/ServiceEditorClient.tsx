"use client";

import { useState } from "react";
import RichEditor from "@/components/admin/RichEditor";
import AutoSlug from "@/components/admin/AutoSlug";
import ImageUpload from "@/components/admin/ImageUpload";
import type { Locale } from "@/i18n/locales";

type ServiceTranslation = {
  id?: string;
  locale: Locale;
  title: string;
  slug: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
};

type Service = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  heroImageUrl: string | null;
  heroImageAlt?: string | null;
  practiceAreaId: string;
  translations: ServiceTranslation[];
  specialists: Array<{ id: string; name: string }>;
};

type ServiceEditorClientProps = {
  service: Service;
  practices: Array<{ id: string; title: string }>;
  allSpecialists: Array<{ id: string; name: string }>;
  locale: Locale;
};

const locales: Locale[] = ["ka", "en", "ru"] as unknown as Locale[];

export default function ServiceEditorClient({ service, practices, allSpecialists, locale }: ServiceEditorClientProps) {
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const currentTranslation = service.translations.find(t => t.locale === selectedLocale) || {
    locale: selectedLocale,
    title: service.title,
    slug: service.slug,
    description: service.description,
    metaTitle: null,
    metaDescription: null,
    ogTitle: null,
    ogDescription: null,
  };

  const handleFormSubmit = async (formData: FormData, endpoint: string, successMessage: string) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: successMessage });
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'An error occurred' });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Edit Service</h2>
      
      {/* Loading, Success/Error Message */}
      {isLoading && (
        <div className="rounded-lg p-3 bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving...
        </div>
      )}
      
      {message && !isLoading && (
        <div className={`rounded-lg p-3 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Base Service Form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        handleFormSubmit(formData, '/api/admin/services/base', 'Base service updated successfully!');
      }} className="grid gap-3 rounded border p-4">
        <input type="hidden" name="id" value={service.id} />
        <input type="hidden" name="locale" value={locale} />
        
        <AutoSlug titleName="title" slugName="slug" />
        <div>
          <label className="mb-1 block text-sm">Title</label>
          <input 
            name="title" 
            defaultValue={service.title} 
            className="w-full rounded border px-3 py-2" 
            required 
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Slug</label>
          <input 
            name="slug" 
            defaultValue={service.slug} 
            className="w-full rounded border px-3 py-2" 
            required 
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Practice Area</label>
          <select 
            name="practiceAreaId" 
            defaultValue={service.practiceAreaId} 
            className="w-full rounded border px-3 py-2" 
            required
          >
            {practices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        
        {/* Image Upload */}
        <div>
          <label className="mb-1 block text-sm">Hero Image</label>
          <ImageUpload
            name="heroImage"
            value={service.heroImageUrl || ""}
            className="w-full"
          />
        </div>
        
        <RichEditor name="description" initialHTML={typeof service.description === 'string' ? service.description : ""} label="Description" />
        <button 
          type="submit" 
          disabled={isLoading}
          className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          Save Base
        </button>
      </form>

      {/* Language Switcher and Translation Editor */}
      <div className="rounded border p-4">
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm font-medium">Language:</label>
          <div className="flex gap-1">
            {locales.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setSelectedLocale(loc)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedLocale === loc
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <form key={selectedLocale} onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleFormSubmit(formData, '/api/admin/services/translation', `${selectedLocale.toUpperCase()} translation updated successfully!`);
        }} className="grid gap-3">
          <input type="hidden" name="serviceId" value={service.id} />
          <input type="hidden" name="locale" value={selectedLocale} />
          
          <AutoSlug titleName="t_title" slugName="t_slug" />
          <div>
            <label className="mb-1 block text-sm">Title ({selectedLocale.toUpperCase()})</label>
            <input 
              name="t_title" 
              defaultValue={currentTranslation.title} 
              className="w-full rounded border px-3 py-2" 
              required 
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Slug ({selectedLocale.toUpperCase()})</label>
            <input 
              name="t_slug" 
              defaultValue={currentTranslation.slug} 
              className="w-full rounded border px-3 py-2" 
              required 
            />
          </div>
          
          <RichEditor 
            key={`desc-${selectedLocale}`}
            name="t_description" 
            initialHTML={typeof currentTranslation.description === 'string' ? currentTranslation.description : ""} 
            label={`Description (${selectedLocale.toUpperCase()})`} 
          />
          
          {/* SEO Fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Meta Title (≤ 60 chars)</label>
              <input 
                name="t_meta_title" 
                defaultValue={currentTranslation.metaTitle || ""} 
                maxLength={60}
                className="w-full rounded border px-3 py-2" 
                placeholder="SEO title for search engines"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {currentTranslation.metaTitle?.length || 0}/60 characters
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm">Meta Description (≤ 155 chars)</label>
              <textarea 
                name="t_meta_description" 
                defaultValue={currentTranslation.metaDescription || ""} 
                maxLength={155}
                rows={3}
                className="w-full rounded border px-3 py-2" 
                placeholder="SEO description for search engines"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {currentTranslation.metaDescription?.length || 0}/155 characters
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">OG Title</label>
              <input
                name="t_og_title"
                defaultValue={currentTranslation.ogTitle || ""}
                className="w-full rounded border px-3 py-2"
                placeholder="Title for social sharing"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">OG Description</label>
              <textarea
                name="t_og_description"
                defaultValue={currentTranslation.ogDescription || ""}
                rows={2}
                className="w-full rounded border px-3 py-2"
                placeholder="Description for social previews"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Save {selectedLocale.toUpperCase()}
          </button>
        </form>
      </div>

      {/* Specialists Assignment */}
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        handleFormSubmit(formData, '/api/admin/services/specialists', 'Specialists updated successfully!');
      }} className="grid gap-2 rounded border p-3 text-sm">
        <input type="hidden" name="serviceId" value={service.id} />
        <div className="font-medium">Assign Specialists</div>
        <select 
          name="specialists" 
          multiple 
          className="h-32 w-full rounded border px-2 py-1"
          defaultValue={service.specialists.map((s) => s.id)}
        >
          {allSpecialists.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button className="rounded border px-2 py-1 hover:bg-muted">Save Specialists</button>
      </form>
    </div>
  );
}
