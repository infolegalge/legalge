"use client";

import { useState } from "react";
import AutoSlug from "@/components/admin/AutoSlug";
import RichEditor from "@/components/admin/RichEditor";
import ImageUpload from "@/components/ImageUpload";
import type { Locale } from "@/i18n/locales";

const locales: Locale[] = ["ka", "en", "ru"];
const baseLocale: Locale = "ka";

const emptyLocalePayload = () => ({
  title: "",
  slug: "",
  description: "",
  metaTitle: "",
  metaDescription: "",
  ogTitle: "",
  ogDescription: "",
  heroImageAlt: "",
  pageHeroImageAlt: "",
});

type LocalePayload = ReturnType<typeof emptyLocalePayload>;

type LocaleState = Record<Locale, LocalePayload>;

function cloneState(state: LocaleState): LocaleState {
  const copy = {} as LocaleState;
  locales.forEach((loc) => {
    copy[loc] = { ...state[loc] };
  });
  return copy;
}

export default function PracticeCreateClient({ locale }: { locale: Locale }) {
  const [creating, setCreating] = useState(false);
  const [activeLocale, setActiveLocale] = useState<Locale>(locale);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [pageHeroImageUrl, setPageHeroImageUrl] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [localesState, setLocalesState] = useState<LocaleState>(() => {
    const next = {} as LocaleState;
    locales.forEach((loc) => {
      next[loc] = emptyLocalePayload();
    });
    return next;
  });

  const updateLocaleValue = (targetLocale: Locale, key: keyof LocalePayload, value: string) => {
    setLocalesState((prev) => {
      const next = cloneState(prev);
      next[targetLocale][key] = value;
      if (targetLocale === baseLocale) {
        // ensure base fields stay populated for fallback content
        next[baseLocale][key] = value;
      }
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setMessage(null);

    const formData = new FormData();
    const basePayload = localesState[baseLocale];

    if (!basePayload.title.trim()) {
      setMessage({ type: "error", text: "Default title is required" });
      setCreating(false);
      return;
    }

    formData.set("base_title", basePayload.title.trim());
    formData.set("base_slug", basePayload.slug.trim());
    formData.set("base_description", basePayload.description);
    formData.set("heroImageUrl", heroImageUrl.trim());
    formData.set("pageHeroImageUrl", pageHeroImageUrl.trim());
    formData.set("adminLocale", locale);

    locales.forEach((loc) => {
      const data = localesState[loc];
      formData.append(`title_${loc}`, data.title.trim());
      formData.append(`slug_${loc}`, data.slug.trim());
      formData.append(`description_${loc}`, data.description);
      formData.append(`metaTitle_${loc}`, data.metaTitle.trim());
      formData.append(`metaDescription_${loc}`, data.metaDescription.trim());
      formData.append(`ogTitle_${loc}`, data.ogTitle.trim());
      formData.append(`ogDescription_${loc}`, data.ogDescription.trim());
      formData.append(`heroImageAlt_${loc}`, data.heroImageAlt.trim());
      formData.append(`pageHeroImageAlt_${loc}`, data.pageHeroImageAlt.trim());
    });

    try {
      const response = await fetch("/api/admin/practices", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create practice area");
      }

      setMessage({ type: "success", text: "Practice area created! Redirecting..." });
      setTimeout(() => {
        window.location.href = `/${locale}/admin/practices/${result.id}`;
      }, 1200);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to create practice area" });
      setCreating(false);
    }
  };

  const baseData = localesState[baseLocale];
  const currentData = localesState[activeLocale];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">New Practice Area</h1>
          <p className="text-muted-foreground">Create a practice area and localize it for every supported language.</p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded border px-3 py-2 text-sm ${
            message.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 border rounded p-4" noValidate>
        <fieldset className="grid gap-3" disabled={creating}>
          <legend className="text-lg font-medium">Default (fallback) content</legend>
          <AutoSlug titleName="base_title" slugName="base_slug" localeField="base_locale" />
          <input type="hidden" name="base_locale" value={baseLocale} />
          <div>
            <label className="mb-1 block text-sm">Title</label>
            <input
              className="w-full rounded border px-3 py-2"
              name="base_title"
              value={baseData.title}
              onChange={(event) => updateLocaleValue(baseLocale, "title", event.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Slug</label>
            <input
              className="w-full rounded border px-3 py-2"
              name="base_slug"
              value={baseData.slug}
              onChange={(event) => updateLocaleValue(baseLocale, "slug", event.target.value)}
              required
            />
          </div>
          <RichEditor
            name="base_description"
            label="Default description"
            initialHTML={baseData.description}
            onChange={(value) => updateLocaleValue(baseLocale, "description", value)}
          />
        </fieldset>

        <div className="rounded border">
          <div className="flex gap-2 border-b p-2 text-sm">
            {locales.map((loc) => (
              <button
                key={loc}
                type="button"
                className={`rounded px-2 py-1 ${loc === activeLocale ? "bg-muted" : "hover:bg-muted"}`}
                onClick={() => setActiveLocale(loc)}
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
                  value={currentData.title}
                  onChange={(event) => updateLocaleValue(activeLocale, "title", event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Slug ({activeLocale.toUpperCase()})</label>
                <input
                  className="w-full rounded border px-2 py-1"
                  value={currentData.slug}
                  onChange={(event) => updateLocaleValue(activeLocale, "slug", event.target.value)}
                  required
                />
              </div>
            </div>
            <RichEditor
              name="t_description"
              label={`Description (${activeLocale.toUpperCase()})`}
              initialHTML={currentData.description}
              onChange={(value) => updateLocaleValue(activeLocale, "description", value)}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs mb-1">Meta Title</label>
                <input
                  className="w-full rounded border px-2 py-1"
                  value={currentData.metaTitle}
                  onChange={(event) => updateLocaleValue(activeLocale, "metaTitle", event.target.value)}
                  maxLength={60}
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Meta Description</label>
                <input
                  className="w-full rounded border px-2 py-1"
                  value={currentData.metaDescription}
                  onChange={(event) => updateLocaleValue(activeLocale, "metaDescription", event.target.value)}
                  maxLength={155}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs mb-1">OG Title</label>
                <input
                  className="w-full rounded border px-2 py-1"
                  value={currentData.ogTitle}
                  onChange={(event) => updateLocaleValue(activeLocale, "ogTitle", event.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs mb-1">OG Description</label>
                <textarea
                  className="w-full rounded border px-2 py-1"
                  value={currentData.ogDescription}
                  onChange={(event) => updateLocaleValue(activeLocale, "ogDescription", event.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1">Hero image alt ({activeLocale.toUpperCase()})</label>
              <input
                className="w-full rounded border px-2 py-1"
                value={currentData.heroImageAlt}
                onChange={(event) => updateLocaleValue(activeLocale, "heroImageAlt", event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Page hero image alt ({activeLocale.toUpperCase()})</label>
              <input
                className="w-full rounded border px-2 py-1"
                value={currentData.pageHeroImageAlt}
                onChange={(event) => updateLocaleValue(activeLocale, "pageHeroImageAlt", event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Hero image (list)</h3>
            <ImageUpload
              disabled={creating}
              defaultAlt={currentData.heroImageAlt}
              altValue={currentData.heroImageAlt}
              onAltChange={(value) => updateLocaleValue(activeLocale, "heroImageAlt", value)}
              onImageUploaded={(img) => {
                setHeroImageUrl(img.webpUrl || img.url);
                if (!currentData.heroImageAlt) {
                  updateLocaleValue(activeLocale, "heroImageAlt", img.alt);
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Page hero image (detail page)</h3>
            <ImageUpload
              disabled={creating}
              defaultAlt={currentData.pageHeroImageAlt}
              altValue={currentData.pageHeroImageAlt}
              onAltChange={(value) => updateLocaleValue(activeLocale, "pageHeroImageAlt", value)}
              onImageUploaded={(img) => {
                setPageHeroImageUrl(img.webpUrl || img.url);
                if (!currentData.pageHeroImageAlt) {
                  updateLocaleValue(activeLocale, "pageHeroImageAlt", img.alt);
                }
              }}
            />
            <input type="hidden" name="pageHeroImageUrl" value={pageHeroImageUrl} readOnly />
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Practice"}
        </button>
      </form>
    </div>
  );
}
