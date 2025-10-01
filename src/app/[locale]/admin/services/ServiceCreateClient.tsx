"use client";

import { useState } from "react";
import AutoSlug from "@/components/admin/AutoSlug";
import RichEditor from "@/components/admin/RichEditor";
import ImageUpload from "@/components/ImageUpload";
import type { Locale } from "@/i18n/locales";

interface PracticeOption {
  id: string;
  title: string;
}

interface ServiceCreateClientProps {
  practices: PracticeOption[];
  locale: Locale;
}

const locales: Locale[] = ["ka", "en", "ru"];
const baseLocale: Locale = "ka";

const emptyTranslation = () => ({
  title: "",
  slug: "",
  description: "",
  metaTitle: "",
  metaDescription: "",
  ogTitle: "",
  ogDescription: "",
  heroImageAlt: "",
});

type TranslationState = ReturnType<typeof emptyTranslation>;

type LocaleState = Record<Locale, TranslationState>;

function cloneTranslations(state: LocaleState): LocaleState {
  const next = {} as LocaleState;
  locales.forEach((loc) => {
    next[loc] = { ...state[loc] };
  });
  return next;
}

export default function ServiceCreateClient({ practices, locale }: ServiceCreateClientProps) {
  const [activeLocale, setActiveLocale] = useState<Locale>(locale);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [practiceAreaId, setPracticeAreaId] = useState(practices[0]?.id ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState<string>("");
  const [heroImageAlt, setHeroImageAlt] = useState<string>("");
  const [translations, setTranslations] = useState<LocaleState>(() => {
    const initial = {} as LocaleState;
    locales.forEach((loc) => {
      initial[loc] = emptyTranslation();
    });
    return initial;
  });

  const updateTranslation = (targetLocale: Locale, key: keyof TranslationState, value: string) => {
    setTranslations((prev) => {
      const next = cloneTranslations(prev);
      next[targetLocale][key] = value;
      if (targetLocale === baseLocale) {
        next[baseLocale][key] = value;
      }
      return next;
    });
  };

  const base = translations[baseLocale];
  const current = translations[activeLocale];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setMessage(null);

    if (!base.title.trim()) {
      setMessage({ type: "error", text: "Default title is required" });
      setCreating(false);
      return;
    }

    const formData = new FormData();
    formData.set("title", base.title.trim());
    formData.set("slug", base.slug.trim());
    formData.set("description", base.description);
    formData.set("heroImage", heroImageUrl.trim());
    formData.set("heroImageAlt", heroImageAlt.trim());
    formData.set("practiceAreaId", practiceAreaId);
    formData.set("adminLocale", locale);

    locales.forEach((loc) => {
      const data = translations[loc];
      formData.append(`title_${loc}`, data.title.trim());
      formData.append(`slug_${loc}`, data.slug.trim());
      formData.append(`description_${loc}`, data.description);
      formData.append(`metaTitle_${loc}`, data.metaTitle.trim());
      formData.append(`metaDescription_${loc}`, data.metaDescription.trim());
      formData.append(`ogTitle_${loc}`, data.ogTitle.trim());
      formData.append(`ogDescription_${loc}`, data.ogDescription.trim());
      formData.append(`heroImageAlt_${loc}`, data.heroImageAlt.trim());
    });

    try {
      const response = await fetch("/api/admin/services", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create service");
      }
      setMessage({ type: "success", text: "Service created! Redirecting to editor..." });
      setTimeout(() => {
        window.location.href = `/${locale}/admin/services/${result.id}`;
      }, 1200);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create service",
      });
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl, font-semibold">New Service</h1>
          <p className="text-muted-foreground">Create a service under a practice area with localized content.</p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded border px-3 py-2 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 border rounded p-4" noValidate>
        <fieldset className="grid gap-3" disabled={creating}>
          <legend className="text-lg font-medium">Base Content</legend>
          <AutoSlug titleName="base_title" slugName="base_slug" localeField="base_locale" />
          <input type="hidden" name="base_locale" value={baseLocale} />
          <div>
            <label className="block text-sm mb-1">Practice Area</label>
            <select
              value={practiceAreaId}
              onChange={(event) => setPracticeAreaId(event.target.value)}
              className="w-full rounded border px-3 py-2"
              required
            >
              {practices.map((practice) => (
                <option key={practice.id} value={practice.id}>
                  {practice.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input
              className="w-full rounded border px-3 py-2"
              name="base_title"
              value={base.title}
              onChange={(event) => updateTranslation(baseLocale, "title", event.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Slug</label>
            <input
              className="w-full rounded border px-3 py-2"
              name="base_slug"
              value={base.slug}
              onChange={(event) => updateTranslation(baseLocale, "slug", event.target.value)}
              required
            />
          </div>
          <RichEditor
            name="base_description"
            label="Default description"
            initialHTML={base.description}
            onChange={(value) => updateTranslation(baseLocale, "description", value)}
          />
        </fieldset>

        <div className="rounded border">
          <div className="flex gap-2 border-b p-2 text-sm">
            {locales.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setActiveLocale(loc)}
                className={`rounded px-2 py-1 ${loc === activeLocale ? "bg-muted" : "hover:bg-muted"}`}
                disabled={creating}
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="space-y-3 p-3">
            <AutoSlug titleName="t_title" slugName="t_slug" localeField="t_locale" />
            <input type="hidden" name="t_locale" value={activeLocale} />
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs mb-1">Title ({activeLocale.toUpperCase()})</label>
                <input
                  className="w-full rounded border px-2 py-1"
                  value={current.title}
                  onChange={(event) => updateTranslation(activeLocale, "title", event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Slug ({activeLocale.toUpperCase()})</label>
                <input
                  className="w-full rounded border px-2 py-1"
                  value={current.slug}
                  onChange={(event) => updateTranslation(activeLocale, "slug", event.target.value)}
                  required
                />
              </div>
            </div>
            <RichEditor
              name="t_description"
              label={`Description (${activeLocale.toUpperCase()})`}
              initialHTML={current.description}
              onChange={(value) => updateTranslation(activeLocale, "description", value)}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs mb-1">Meta Title</label>
                <input
                  className="w-full rounded border px-2 py-1"
                  value={current.metaTitle}
                  onChange={(event) => updateTranslation(activeLocale, "metaTitle", event.target.value)}
                  maxLength={60}
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Meta Description</label>
                <input
                  className="w-full rounded border px-2 py-1"
                  value={current.metaDescription}
                  onChange={(event) => updateTranslation(activeLocale, "metaDescription", event.target.value)}
                  maxLength={155}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs mb-1">OG Title</label>
                <input
                  className="w-full rounded border px-2 py-1"
                  value={current.ogTitle}
                  onChange={(event) => updateTranslation(activeLocale, "ogTitle", event.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs mb-1">OG Description</label>
                <textarea
                  className="w-full rounded border px-2 py-1"
                  value={current.ogDescription}
                  onChange={(event) => updateTranslation(activeLocale, "ogDescription", event.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1">Hero image alt ({activeLocale.toUpperCase()})</label>
              <input
                className="w-full rounded border px-2 py-1"
                value={current.heroImageAlt}
                onChange={(event) => updateTranslation(activeLocale, "heroImageAlt", event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Hero image</h3>
          <ImageUpload
            onImageUploaded={(image) => {
              setHeroImageUrl(image.webpUrl || image.url);
              if (!heroImageAlt) {
                setHeroImageAlt(image.alt);
              }
            }}
            defaultAlt={heroImageAlt}
            altValue={heroImageAlt}
            onAltChange={setHeroImageAlt}
            disabled={creating}
          />
          <input type="hidden" name="heroImage" value={heroImageUrl} readOnly />
          <input type="hidden" name="heroImageAlt" value={heroImageAlt} readOnly />
        </div>

        <button
          type="submit"
          disabled={creating}
          className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Service"}
        </button>
      </form>
    </div>
  );
}
