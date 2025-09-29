"use client";

import { useState, useTransition } from "react";
import { makeSlug } from "@/lib/utils";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDesc?: string | null;
  longDesc?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  mapLink?: string | null;
}

type UpdateResult = {
  success?: boolean;
  error?: string;
  company?: { id: string; name: string; slug: string };
};

interface CompanyEditFormProps {
  company: Company;
  translations?: Array<{ locale: 'ka'|'en'|'ru'; name: string; slug: string; description?: string | null; shortDesc?: string | null; longDesc?: string | null }>;
  updateAction: (formData: FormData) => Promise<UpdateResult | void>;
}

export default function CompanyEditForm({ 
  company, 
  translations = [],
  updateAction 
}: CompanyEditFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeLocale, setActiveLocale] = useState<'ka'|'en'|'ru'>('ka');
  const [logoUrl, setLogoUrl] = useState<string>(company.logoUrl || "");

  const tMap = new Map(translations.map(t => [t.locale, t] as const));

  // Controlled per-locale state for fields that must persist per locale (name, slug)
  const [loc, setLoc] = useState<Record<'ka'|'en'|'ru', { name: string; slug: string }>>({
    ka: { name: company.name || '', slug: company.slug || '' },
    en: { name: tMap.get('en')?.name || '', slug: tMap.get('en')?.slug || '' },
    ru: { name: tMap.get('ru')?.name || '', slug: tMap.get('ru')?.slug || '' },
  });

  // Controlled per-locale copy fields so switching tabs doesn't lose edits
  const [copy, setCopy] = useState<Record<'ka'|'en'|'ru', { description: string; shortDesc: string; longDesc: string }>>({
    ka: {
      description: (company.description || ''),
      shortDesc: (company.shortDesc || ''),
      longDesc: (company.longDesc || ''),
    },
    en: {
      description: (tMap.get('en')?.description || ''),
      shortDesc: (tMap.get('en')?.shortDesc || ''),
      longDesc: (tMap.get('en')?.longDesc || ''),
    },
    ru: {
      description: (tMap.get('ru')?.description || ''),
      shortDesc: (tMap.get('ru')?.shortDesc || ''),
      longDesc: (tMap.get('ru')?.longDesc || ''),
    },
  });

  const handleUpdate = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        // Augment form data with all locales and controlled fields to avoid hidden mirrors
        // KA (default)
        formData.set('name', loc.ka.name);
        formData.set('slug', loc.ka.slug);
        formData.set('description', copy.ka.description);
        formData.set('shortDesc', copy.ka.shortDesc);
        formData.set('longDesc', copy.ka.longDesc);
        // EN
        formData.set('name_en', loc.en.name);
        formData.set('slug_en', loc.en.slug);
        formData.set('description_en', copy.en.description);
        formData.set('shortDesc_en', copy.en.shortDesc);
        formData.set('longDesc_en', copy.en.longDesc);
        // RU
        formData.set('name_ru', loc.ru.name);
        formData.set('slug_ru', loc.ru.slug);
        formData.set('description_ru', copy.ru.description);
        formData.set('shortDesc_ru', copy.ru.shortDesc);
        formData.set('longDesc_ru', copy.ru.longDesc);
        // Controlled logo value
        formData.set('logoUrl', logoUrl || '');
        
        const result = await updateAction(formData);

        if (result && typeof result === 'object') {
          if (result.error) {
            setError(result.error);
            setSuccess(null);
            return;
          }

          if (result.success) {
            setSuccess('Company updated successfully!');
            return;
          }
        }

        setSuccess('Company updated successfully!');
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">{success}</span>
        </div>
      )}
      
      <form action={handleUpdate} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="id" value={company.id} />
        {/* locale tabs */}
        <div className="md:col-span-2 -mb-2 flex gap-2">
          {(['ka','en','ru'] as const).map(loc => (
            <button
              key={loc}
              type="button"
              onClick={() => setActiveLocale(loc)}
              className={`rounded px-3 py-1.5 text-sm ${activeLocale===loc? 'border bg-muted' : 'hover:bg-muted'}`}
            >
              {loc.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Company Name *</label>
          <input 
            name={activeLocale==='ka' ? 'name' : `name_${activeLocale}`}
            value={loc[activeLocale].name}
            className="w-full rounded border px-3 py-2" 
            required 
            onChange={(e) => {
              const value = e.currentTarget.value;
              setLoc(prev => {
                const next = { ...prev };
                const cur = { ...next[activeLocale], name: value } as { name: string; slug: string };
                if (!cur.slug.trim()) {
                  cur.slug = makeSlug(value, activeLocale as any);
                }
                next[activeLocale] = cur;
                return next;
              });
            }}
          />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Slug *</label>
          <div className="flex gap-2">
            <input 
              name={activeLocale==='ka' ? 'slug' : `slug_${activeLocale}`}
              value={loc[activeLocale].slug}
              onChange={(e) => setLoc(prev => ({ ...prev, [activeLocale]: { ...prev[activeLocale], slug: e.currentTarget.value } }))}
              className="w-full rounded border px-3 py-2" 
              required 
            />
            <button
              type="button"
              className="rounded border px-3 py-2 text-sm"
              onClick={() => {
                setLoc(prev => ({ ...prev, [activeLocale]: { ...prev[activeLocale], slug: makeSlug(prev[activeLocale].name, activeLocale as any) } }));
              }}
            >
              Auto
            </button>
          </div>
        </div>

        {/* Hidden mirrors ensure all locales submit together without cross-locale overwrites */}
        {(['ka','en','ru'] as const)
          .filter((locKey) => locKey !== activeLocale)
          .map((locKey) => (
            <div key={`hidden-${locKey}`} className="hidden">
              <input name={locKey==='ka' ? 'name' : `name_${locKey}`} value={loc[locKey].name} readOnly />
              <input name={locKey==='ka' ? 'slug' : `slug_${locKey}`} value={loc[locKey].slug} readOnly />
            </div>
          ))}
        
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea 
            name={activeLocale==='ka' ? 'description' : `description_${activeLocale}`}
            rows={3}
            value={copy[activeLocale].description}
            onChange={(e) => setCopy(prev => ({ ...prev, [activeLocale]: { ...prev[activeLocale], description: e.currentTarget.value } }))}
            className="w-full rounded border px-3 py-2" 
            placeholder="Brief company description..."
          ></textarea>
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Short Description</label>
          <input 
            name={activeLocale==='ka' ? 'shortDesc' : `shortDesc_${activeLocale}`}
            value={copy[activeLocale].shortDesc}
            onChange={(e) => setCopy(prev => ({ ...prev, [activeLocale]: { ...prev[activeLocale], shortDesc: e.currentTarget.value } }))}
            className="w-full rounded border px-3 py-2" 
            placeholder="One-line description for cards"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Company Logo</label>
          <div className="space-y-3">
            <ImageUpload
              onImageUploaded={(img) => {
                // Update controlled hidden field via React state
                const nextValue = img.webpUrl || img.url;
                setLogoUrl(nextValue);
              }}
              onError={() => {}}
              maxSize={10 * 1024 * 1024}
            />
            <input type="hidden" name="logoUrl" value={logoUrl} readOnly />
            {company.logoUrl && (
              <div className="text-xs text-muted-foreground">Current: {company.logoUrl}</div>
            )}
          </div>
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Website</label>
          <input 
            name="website" 
            type="url"
            defaultValue={company.website || ""}
            className="w-full rounded border px-3 py-2" 
            placeholder="https://example.com"
          />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <input 
            name="phone" 
            type="tel"
            defaultValue={company.phone || ""}
            className="w-full rounded border px-3 py-2" 
            placeholder="+995 598 295 429"
          />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input 
            name="email" 
            type="email"
            defaultValue={company.email || ""}
            className="w-full rounded border px-3 py-2" 
            placeholder="contact@company.com"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Address</label>
          <input 
            name="address" 
            defaultValue={company.address || ""}
            className="w-full rounded border px-3 py-2" 
            placeholder="Georgia, Tbilisi, Agmashnebeli alley N240, 0159"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Map Link</label>
          <input 
            name="mapLink" 
            type="url"
            defaultValue={company.mapLink || ""}
            className="w-full rounded border px-3 py-2" 
            placeholder="https://maps.google.com/..."
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Long Description</label>
          <textarea 
            name={activeLocale==='ka' ? 'longDesc' : `longDesc_${activeLocale}`}
            rows={6}
            value={copy[activeLocale].longDesc}
            onChange={(e) => setCopy(prev => ({ ...prev, [activeLocale]: { ...prev[activeLocale], longDesc: e.currentTarget.value } }))}
            className="w-full rounded border px-3 py-2" 
            placeholder="Detailed company information, history, values, etc..."
          ></textarea>
        </div>

        {/* Hidden mirrors for non-active locales so all translations submit */}
        {(['ka','en','ru'] as const)
          .filter((locKey) => locKey !== activeLocale)
          .map((locKey) => (
            <div key={`hidden-copy-${locKey}`} className="hidden">
              <input name={locKey==='ka' ? 'description' : `description_${locKey}`} value={copy[locKey].description} readOnly />
              <input name={locKey==='ka' ? 'shortDesc' : `shortDesc_${locKey}`} value={copy[locKey].shortDesc} readOnly />
              <input name={locKey==='ka' ? 'longDesc' : `longDesc_${locKey}`} value={copy[locKey].longDesc} readOnly />
            </div>
          ))}
        
        <div className="md:col-span-2">
          <button 
            type="submit" 
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Updating..." : "Update Company"}
          </button>
        </div>
      </form>
    </div>
  );
}
