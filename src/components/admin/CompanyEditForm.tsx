"use client";

import { useState, useTransition } from "react";
import { makeSlug } from "@/lib/utils";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { Input } from "@/components/ui/input";
import { OFFICIAL_PHONE } from "@/config/contact";

const SOCIAL_NETWORKS = ["facebook", "instagram", "linkedin", "x"] as const;
type SocialNetwork = typeof SOCIAL_NETWORKS[number];

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
};

function parseSocialLinksValue(raw?: string | null): Record<SocialNetwork, string> {
  const base = {
    facebook: "",
    instagram: "",
    linkedin: "",
    x: "",
  } satisfies Record<SocialNetwork, string>;

  if (!raw) {
    return base;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const entry of parsed) {
        if (!entry || typeof entry !== "object") continue;
        const url = typeof entry.url === "string" ? entry.url.trim() : "";
        if (!url) continue;
        const label = typeof entry.label === "string" ? entry.label.toLowerCase() : "";
        const key = SOCIAL_NETWORKS.find((network) =>
          label.includes(network) || url.toLowerCase().includes(network)
        );
        if (key) {
          base[key] = url;
        }
      }
    }
  } catch (err) {
    console.warn("Failed to parse social links", err);
  }

  return base;
}

function buildSocialLinksValue(socials: Record<SocialNetwork, string>): string {
  const entries = SOCIAL_NETWORKS
    .map((network) => {
      const value = socials[network].trim();
      if (!value) return null;
      return {
        label: SOCIAL_LABELS[network],
        url: value,
      };
    })
    .filter(Boolean) as Array<{ label: string; url: string }>;

  return entries.length > 0 ? JSON.stringify(entries) : "";
}

interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDesc?: string | null;
  longDesc?: string | null;
  logoUrl?: string | null;
  logoAlt?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  mapLink?: string | null;
  mission?: string | null;
  vision?: string | null;
  history?: string | null;
  contactPrompt?: string | null;
  socialLinks?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
}

type UpdateResult = {
  success?: boolean;
  error?: string;
  company?: { id: string; name: string; slug: string };
};

interface CompanyEditFormProps {
  company: Company;
  translations?: Array<{
    locale: 'ka'|'en'|'ru';
    name: string;
    slug: string;
    description?: string | null;
    shortDesc?: string | null;
    longDesc?: string | null;
    mission?: string | null;
    vision?: string | null;
    history?: string | null;
    contactPrompt?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    logoAlt?: string | null;
  }>;
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
  const kaTranslation = tMap.get('ka');

  // Controlled per-locale state for fields that must persist per locale (name, slug)
  const [loc, setLoc] = useState<Record<'ka'|'en'|'ru', { name: string; slug: string }>>({
    ka: { name: company.name || '', slug: company.slug || '' },
    en: { name: tMap.get('en')?.name || '', slug: tMap.get('en')?.slug || '' },
    ru: { name: tMap.get('ru')?.name || '', slug: tMap.get('ru')?.slug || '' },
  });

  // Controlled per-locale copy fields so switching tabs doesn't lose edits
  const [copy, setCopy] = useState<Record<'ka'|'en'|'ru', {
    description: string;
    shortDesc: string;
    longDesc: string;
    mission: string;
    vision: string;
    history: string;
    contactPrompt: string;
    metaTitle: string;
    metaDescription: string;
    ogTitle: string;
    ogDescription: string;
    logoAlt: string;
  }>>({
    ka: {
      description: kaTranslation?.description ?? company.description ?? '',
      shortDesc: kaTranslation?.shortDesc ?? company.shortDesc ?? '',
      longDesc: kaTranslation?.longDesc ?? company.longDesc ?? '',
      mission: kaTranslation?.mission ?? company.mission ?? '',
      vision: kaTranslation?.vision ?? company.vision ?? '',
      history: kaTranslation?.history ?? company.history ?? '',
      contactPrompt: kaTranslation?.contactPrompt ?? company.contactPrompt ?? '',
      metaTitle: kaTranslation?.metaTitle ?? company.metaTitle ?? '',
      metaDescription: kaTranslation?.metaDescription ?? company.metaDescription ?? '',
      ogTitle: kaTranslation?.ogTitle ?? company.ogTitle ?? '',
      ogDescription: kaTranslation?.ogDescription ?? company.ogDescription ?? '',
      logoAlt: kaTranslation?.logoAlt ?? company.logoAlt ?? '',
    },
    en: {
      description: tMap.get('en')?.description || '',
      shortDesc: tMap.get('en')?.shortDesc || '',
      longDesc: tMap.get('en')?.longDesc || '',
      mission: tMap.get('en')?.mission || '',
      vision: tMap.get('en')?.vision || '',
      history: tMap.get('en')?.history || '',
      contactPrompt: tMap.get('en')?.contactPrompt || '',
      metaTitle: tMap.get('en')?.metaTitle || '',
      metaDescription: tMap.get('en')?.metaDescription || '',
      ogTitle: tMap.get('en')?.ogTitle || '',
      ogDescription: tMap.get('en')?.ogDescription || '',
      logoAlt: tMap.get('en')?.logoAlt || '',
    },
    ru: {
      description: tMap.get('ru')?.description || '',
      shortDesc: tMap.get('ru')?.shortDesc || '',
      longDesc: tMap.get('ru')?.longDesc || '',
      mission: tMap.get('ru')?.mission || '',
      vision: tMap.get('ru')?.vision || '',
      history: tMap.get('ru')?.history || '',
      contactPrompt: tMap.get('ru')?.contactPrompt || '',
      metaTitle: tMap.get('ru')?.metaTitle || '',
      metaDescription: tMap.get('ru')?.metaDescription || '',
      ogTitle: tMap.get('ru')?.ogTitle || '',
      ogDescription: tMap.get('ru')?.ogDescription || '',
      logoAlt: tMap.get('ru')?.logoAlt || '',
    },
  });

  const handleUpdate = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        // Augment form data with all locales and controlled fields to avoid hidden mirrors
        (['ka','en','ru'] as const).forEach((key) => {
          const isBase = key === 'ka';
          const nameKey = isBase ? 'name' : `name_${key}`;
          const slugKey = isBase ? 'slug' : `slug_${key}`;
          const descKey = isBase ? 'description' : `description_${key}`;
          const shortKey = isBase ? 'shortDesc' : `shortDesc_${key}`;
          const longKey = isBase ? 'longDesc' : `longDesc_${key}`;
          const missionKey = isBase ? 'mission' : `mission_${key}`;
          const visionKey = isBase ? 'vision' : `vision_${key}`;
          const historyKey = isBase ? 'history' : `history_${key}`;
          const contactPromptKey = isBase ? 'contactPrompt' : `contactPrompt_${key}`;
          const metaTitleKey = isBase ? 'metaTitle' : `metaTitle_${key}`;
          const metaDescKey = isBase ? 'metaDescription' : `metaDescription_${key}`;
          const ogTitleKey = isBase ? 'ogTitle' : `ogTitle_${key}`;
          const ogDescKey = isBase ? 'ogDescription' : `ogDescription_${key}`;
          const logoAltKey = isBase ? 'logoAlt' : `logoAlt_${key}`;

          formData.set(nameKey, loc[key].name);
          formData.set(slugKey, loc[key].slug);
          formData.set(descKey, copy[key].description);
          formData.set(shortKey, copy[key].shortDesc);
          formData.set(longKey, copy[key].longDesc);
          formData.set(missionKey, copy[key].mission);
          formData.set(visionKey, copy[key].vision);
          formData.set(historyKey, copy[key].history);
          formData.set(contactPromptKey, copy[key].contactPrompt);
          formData.set(metaTitleKey, copy[key].metaTitle);
          formData.set(metaDescKey, copy[key].metaDescription);
          formData.set(ogTitleKey, copy[key].ogTitle);
          formData.set(ogDescKey, copy[key].ogDescription);
          formData.set(logoAltKey, copy[key].logoAlt.trim());
        });
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
            onChange={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLInputElement)) return;
              const value = target.value ?? "";
              setLoc((prev) => {
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
              onChange={(event) => {
                const target = event.target;
                if (!(target instanceof HTMLInputElement)) return;
                const value = target.value ?? "";
                setLoc((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], slug: value } }));
              }}
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
            onChange={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLTextAreaElement)) return;
              const value = target.value ?? "";
              setCopy((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], description: value } }));
            }}
            className="w-full rounded border px-3 py-2" 
            placeholder="Brief company description..."
          ></textarea>
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Short Description</label>
          <input 
            name={activeLocale==='ka' ? 'shortDesc' : `shortDesc_${activeLocale}`}
            value={copy[activeLocale].shortDesc}
            onChange={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLInputElement)) return;
              const value = target.value ?? "";
              setCopy((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], shortDesc: value } }));
            }}
            className="w-full rounded border px-3 py-2" 
            placeholder="One-line description for cards"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Mission Statement</label>
          <textarea
            name={activeLocale==='ka' ? 'mission' : `mission_${activeLocale}`}
            rows={3}
            value={copy[activeLocale].mission}
            onChange={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLTextAreaElement)) return;
              const value = target.value ?? "";
              setCopy((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], mission: value } }));
            }}
            className="w-full rounded border px-3 py-2"
            placeholder="Why your company exists and the impact you aim to make"
          ></textarea>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Vision / Values</label>
          <textarea
            name={activeLocale==='ka' ? 'vision' : `vision_${activeLocale}`}
            rows={3}
            value={copy[activeLocale].vision}
            onChange={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLTextAreaElement)) return;
              const value = target.value ?? "";
              setCopy((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], vision: value } }));
            }}
            className="w-full rounded border px-3 py-2"
            placeholder="What future you work toward and the values that guide you"
          ></textarea>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">History / Founding Story</label>
          <textarea
            name={activeLocale==='ka' ? 'history' : `history_${activeLocale}`}
            rows={4}
            value={copy[activeLocale].history}
            onChange={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLTextAreaElement)) return;
              const value = target.value ?? "";
              setCopy((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], history: value } }));
            }}
            className="w-full rounded border px-3 py-2"
            placeholder="Share origin details, milestones, or founding story"
          ></textarea>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Company Logo</label>
          <div className="space-y-3">
            <ImageUpload
              onImageUploaded={(img) => {
                const nextValue = img.webpUrl || img.url;
                setLogoUrl(nextValue);
              }}
              defaultAlt={copy[activeLocale].logoAlt}
              altValue={copy[activeLocale].logoAlt}
              onAltChange={(value) => {
                setCopy((prev) => ({
                  ...prev,
                  [activeLocale]: { ...prev[activeLocale], logoAlt: value },
                }));
              }}
              altLabel={`Logo alt (${activeLocale.toUpperCase()})`}
              onError={() => {}}
              maxSize={10 * 1024 * 1024}
            />
            <input type="hidden" name="logoUrl" value={logoUrl} readOnly />
            {company.logoUrl && (
              <div className="text-xs text-muted-foreground">Current: {company.logoUrl}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Provide a localized logo description for {activeLocale.toUpperCase()} users.
            </p>
          </div>
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Website</label>
          <input 
            name="website" 
            type="url"
            defaultValue={company.website || ""}
            className="w-full rounded border px-3 py-2 bg-muted/50" 
            placeholder="https://example.com"
            readOnly
            tabIndex={-1}
          />
          <p className="mt-1 text-xs text-muted-foreground">Website URL is managed by Legal Sandbox support.</p>
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <input 
            name="phone" 
            type="tel"
            defaultValue={company.phone || ""}
            className="w-full rounded border px-3 py-2 bg-muted/50" 
            placeholder={OFFICIAL_PHONE}
            readOnly
            tabIndex={-1}
          />
          <p className="mt-1 text-xs text-muted-foreground">Phone number is managed by Legal Sandbox support.</p>
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input 
            name="email" 
            type="email"
            defaultValue={company.email || ""}
            className="w-full rounded border px-3 py-2 bg-muted/50" 
            placeholder="contact@company.com"
            readOnly
            tabIndex={-1}
          />
          <p className="mt-1 text-xs text-muted-foreground">Email is managed by Legal Sandbox support.</p>
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
          <label className="mb-1 block text-sm font-medium">Social Links</label>
          <textarea
            name="socialLinks"
            defaultValue={company.socialLinks || ""}
            className="w-full rounded border px-3 py-2 text-sm font-mono"
            rows={4}
            placeholder="https://facebook.com/your-company\nhttps://instagram.com/your-company"
          ></textarea>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste one full URL per line (supports Facebook, Instagram, LinkedIn, X).
          </p>
        </div>
        
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Long Description</label>
          <textarea 
            name={activeLocale==='ka' ? 'longDesc' : `longDesc_${activeLocale}`}
            rows={6}
            value={copy[activeLocale].longDesc}
            onChange={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLTextAreaElement)) return;
              const value = target.value ?? "";
              setCopy((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], longDesc: value } }));
            }}
            className="w-full rounded border px-3 py-2" 
            placeholder="Detailed company information, history, values, etc..."
          ></textarea>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Client / Community Interaction Prompt</label>
          <textarea
            name={activeLocale==='ka' ? 'contactPrompt' : `contactPrompt_${activeLocale}`}
            rows={3}
            value={copy[activeLocale].contactPrompt}
            onChange={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLTextAreaElement)) return;
              const value = target.value ?? "";
              setCopy((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], contactPrompt: value } }));
            }}
            className="w-full rounded border px-3 py-2"
            placeholder="Encourage visitors to reach out, ask questions, or request services"
          ></textarea>
        </div>


        <div>
          <label className="mb-1 block text-sm font-medium">Meta Title (SEO)</label>
          <input
            name={activeLocale==='ka' ? 'metaTitle' : `metaTitle_${activeLocale}`}
            value={copy[activeLocale].metaTitle}
            onChange={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLInputElement)) return;
              const value = target.value ?? '';
              setCopy((prev) => ({
                ...prev,
                [activeLocale]: { ...prev[activeLocale], metaTitle: value },
              }));
            }}
            className="w-full rounded border px-3 py-2"
            placeholder="Optimized title for search engines"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Meta Description (SEO)</label>
          <textarea
            name={activeLocale==='ka' ? 'metaDescription' : `metaDescription_${activeLocale}`}
            rows={2}
            value={copy[activeLocale].metaDescription}
            onChange={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLTextAreaElement)) return;
              const value = target.value ?? '';
              setCopy((prev) => ({
                ...prev,
                [activeLocale]: { ...prev[activeLocale], metaDescription: value },
              }));
            }}
            className="w-full rounded border px-3 py-2"
            placeholder="Summary shown in search results"
          ></textarea>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">OG Title</label>
          <input
            name={activeLocale==='ka' ? 'ogTitle' : `ogTitle_${activeLocale}`}
            value={copy[activeLocale].ogTitle}
            onChange={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLInputElement)) return;
              const value = target.value ?? '';
              setCopy((prev) => ({
                ...prev,
                [activeLocale]: { ...prev[activeLocale], ogTitle: value },
              }));
            }}
            className="w-full rounded border px-3 py-2"
            placeholder="Title for social previews"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">OG Description</label>
          <textarea
            name={activeLocale==='ka' ? 'ogDescription' : `ogDescription_${activeLocale}`}
            rows={3}
            value={copy[activeLocale].ogDescription}
            onChange={(event) => {
              const target = event.target;
              if (!(target instanceof HTMLTextAreaElement)) return;
              const value = target.value ?? '';
              setCopy((prev) => ({
                ...prev,
                [activeLocale]: { ...prev[activeLocale], ogDescription: value },
              }));
            }}
            className="w-full rounded border px-3 py-2"
            placeholder="Description for social sharing previews"
          ></textarea>
        </div>

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
