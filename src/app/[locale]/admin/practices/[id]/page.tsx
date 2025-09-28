import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Locale } from "@/i18n/locales";
import path from "node:path";
import { promises as fs } from "node:fs";
import RichEditor from "@/components/admin/RichEditor";
import DropzoneInput from "@/components/admin/DropzoneInput";
import Image from "next/image";
import { makeSlug } from "@/lib/utils";
import AutoSlug from "@/components/admin/AutoSlug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PracticeEdit({ params, searchParams }: { params: Promise<{ locale: Locale; id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { locale, id } = await params;
  const { tab } = await searchParams;
  const item = await prisma.practiceArea.findUnique({ where: { id }, include: { translations: true } });
  if (!item) return <div className="p-4">Not found</div>;
  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 12 });

  // Base block becomes informational only; keep endpoint to persist title/slug if desired
  async function saveBase(formData: FormData) {
    "use server";
    const title = String(formData.get("title") || "").trim();
    const slugInput = String(formData.get("slug") || "").trim();
    const slug = slugInput || makeSlug(title, locale);
    const description = String(formData.get("description") || "").trim() || null;
    await prisma.practiceArea.update({ where: { id }, data: { title, slug, description: description || undefined } });
    const adminLocale = String(formData.get("adminLocale") || "");
    for (const loc of ["ka", "en", "ru"]) {
      revalidatePath(`/${loc}/practice/${slug}`);
      revalidatePath(`/${loc}/practice`);
    }
    if (adminLocale) {
      revalidatePath(`/${adminLocale}/admin/practices/${id}`);
    }
  }

  async function saveTranslation(formData: FormData) {
    "use server";
    const tLocale = String(formData.get("locale") || "") as Locale;
    const tTitle = String(formData.get("t_title") || "").trim();
    const tSlugInput = String(formData.get("t_slug") || "").trim();
    const tSlug = tSlugInput || makeSlug(tTitle, tLocale);
    const tDesc = String(formData.get("t_description") || "").trim() || null;
    const tAlt = String(formData.get("t_alt") || "").trim() || null; // may be set from hero form
    const tMetaTitle = String(formData.get("t_meta_title") || "").trim() || null;
    const tMetaDescription = String(formData.get("t_meta_description") || "").trim() || null;
    const baseInfo = await prisma.practiceArea.findUnique({ where: { id }, select: { title: true, slug: true } });
    const nextTitle = tTitle || baseInfo?.title || "";
    const nextSlug = tSlug || baseInfo?.slug || `${id}-${tLocale}`;
    await prisma.practiceAreaTranslation.upsert({
      where: { practiceAreaId_locale: { practiceAreaId: id, locale: tLocale } },
      create: { practiceAreaId: id, locale: tLocale, title: nextTitle, slug: nextSlug, description: tDesc || undefined, heroImageAlt: tAlt || undefined, metaTitle: tMetaTitle || undefined, metaDescription: tMetaDescription || undefined },
      update: { title: nextTitle, slug: nextSlug, description: tDesc || undefined, heroImageAlt: tAlt || undefined, metaTitle: tMetaTitle || undefined, metaDescription: tMetaDescription || undefined },
    });
    revalidatePath(`/${tLocale}/practice`);
    revalidatePath(`/${tLocale}/practice/${nextSlug}`);
    const baseSlug = await prisma.practiceArea.findUnique({ where: { id }, select: { slug: true } });
    if (baseSlug?.slug) revalidatePath(`/${tLocale}/practice/${baseSlug.slug}`);
    const adminLocale = String(formData.get("adminLocale") || "");
    if (adminLocale) revalidatePath(`/${adminLocale}/admin/practices/${id}?tab=${tLocale}`);
  }

  async function setHero(formData: FormData) {
    "use server";
    try {
      const hero = String(formData.get("heroImageUrl") || "").trim() || null;
      const file = formData.get("file") as File | null;
      const tAlt = String(formData.get("t_alt") || "").trim() || null;
      const tLocale = String(formData.get("locale") || "") as Locale;
      let finalUrl = hero;
      if (file && typeof file === "object" && typeof file.arrayBuffer === "function" && (file.size ?? 0) > 0) {
        const buf = Buffer.from(await file.arrayBuffer());
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        const filename = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");
        const filepath = path.join(uploadsDir, filename);
        await fs.writeFile(filepath, buf);
        finalUrl = `/uploads/${filename}`;
      }
      await prisma.practiceArea.update({ where: { id }, data: { heroImageUrl: finalUrl || undefined } });
      if (tLocale) {
        const base = await prisma.practiceArea.findUnique({ where: { id }, select: { slug: true, title: true } });
        await prisma.practiceAreaTranslation.upsert({
          where: { practiceAreaId_locale: { practiceAreaId: id, locale: tLocale } },
          create: { practiceAreaId: id, locale: tLocale, title: base?.title || "", slug: base?.slug || `${id}-${tLocale}`, heroImageAlt: tAlt || undefined },
          update: { heroImageAlt: tAlt || undefined },
        });
      }
      const allLocales: Locale[] = ["ka", "en", "ru"] as unknown as Locale[];
      const translations = await prisma.practiceAreaTranslation.findMany({
        where: { practiceAreaId: id },
        select: { locale: true, slug: true },
      });
      for (const loc of allLocales) {
        revalidatePath(`/${loc}/practice`);
        const ts = translations.find((x) => x.locale === loc);
        if (ts?.slug) revalidatePath(`/${loc}/practice/${ts.slug}`);
      }
    } catch (err) {
      console.error("setHero failed", err);
    }
  }

  async function setPageHero(formData: FormData) {
    "use server";
    try {
      const hero = String(formData.get("pageHeroImageUrl") || "").trim() || null;
      const file = formData.get("file") as File | null;
      const tAlt = String(formData.get("page_t_alt") || "").trim() || null;
      const tLocale = String(formData.get("locale") || "") as Locale;
      let finalUrl = hero;
      if (file && typeof file === "object" && typeof file.arrayBuffer === "function" && (file.size ?? 0) > 0) {
        const buf = Buffer.from(await file.arrayBuffer());
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        const filename = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");
        const filepath = path.join(uploadsDir, filename);
        await fs.writeFile(filepath, buf);
        finalUrl = `/uploads/${filename}`;
      }
      await prisma.practiceArea.update({ where: { id }, data: { pageHeroImageUrl: finalUrl || undefined } });
      if (tLocale) {
        await prisma.practiceAreaTranslation.upsert({
          where: { practiceAreaId_locale: { practiceAreaId: id, locale: tLocale } },
          update: { pageHeroImageAlt: tAlt || undefined },
          create: { practiceAreaId: id, locale: tLocale, title: "", slug: `${id}-${tLocale}`, pageHeroImageAlt: tAlt || undefined },
        });
      }
      const allLocales: Locale[] = ["ka", "en", "ru"] as unknown as Locale[];
      const translations = await prisma.practiceAreaTranslation.findMany({
        where: { practiceAreaId: id },
        select: { locale: true, slug: true },
      });
      for (const loc of allLocales) {
        revalidatePath(`/${loc}/practice`);
        const ts = translations.find((x) => x.locale === loc);
        if (ts?.slug) revalidatePath(`/${loc}/practice/${ts.slug}`);
      }
    } catch (err) {
      console.error("setPageHero failed", err);
    }
  }

  const locales: Locale[] = ["ka", "en", "ru"] as unknown as Locale[];
  const tabs = locales;
  const active = (tabs as string[]).includes(tab || "") ? (tab as Locale) : (locales.includes(locale) ? locale : ("en" as Locale));
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Edit Practice</h2>

      <form action={saveBase} className="grid gap-3 rounded border p-4">
        <AutoSlug titleName="title" slugName="slug" />
        <div>
          <label className="mb-1 block text-sm">Title (Default, used if locale empty)</label>
          <input name="title" defaultValue={item.title} className="w-full rounded border px-3 py-2" required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Slug (Default)</label>
          <input name="slug" defaultValue={item.slug} className="w-full rounded border px-3 py-2" required />
        </div>
        <RichEditor name="description" initialHTML={typeof item.description === 'string' ? item.description : ""} label="Description (Default, used if locale empty)" />
        <input type="hidden" name="adminLocale" value={locale} />
        <button className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground">Save</button>
      </form>

      <div className="rounded border">
        <div className="flex gap-2 border-b p-2 text-sm">
          {tabs.map((loc) => (
            <a key={loc} href={`/${locale}/admin/practices/${id}?tab=${loc}`} className={loc === active ? "rounded bg-muted px-2 py-1" : "rounded px-2 py-1 hover:bg-muted"}>
              {String(loc).toUpperCase()}
            </a>
          ))}
        </div>
        <div className="p-3">
          {(tabs as string[]).map((loc) => {
            const t = item.translations.find((x) => x.locale === loc);
            if (loc !== active) return null;
            return (
              <form key={loc} action={saveTranslation} className="grid gap-2 text-sm">
                <AutoSlug titleName="t_title" slugName="t_slug" />
                <input type="hidden" name="locale" value={loc} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs">Title</label>
                    <input name="t_title" defaultValue={t?.title || ""} className="w-full rounded border px-2 py-1" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs">Slug (SEO)</label>
                    <input name="t_slug" defaultValue={t?.slug || ""} className="w-full rounded border px-2 py-1" required />
                  </div>
                </div>
                <RichEditor name="t_description" initialHTML={typeof t?.description === 'string' ? t.description : ""} label="Description (localized)" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs">Meta title (≤ 60)</label>
                    <input name="t_meta_title" defaultValue={t?.metaTitle || ""} maxLength={60} className="w-full rounded border px-2 py-1" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs">Meta description (≤ 155)</label>
                    <input name="t_meta_description" defaultValue={t?.metaDescription || ""} maxLength={155} className="w-full rounded border px-2 py-1" />
                  </div>
                </div>
                <input type="hidden" name="adminLocale" value={locale} />
                {/* SEO fields can be re-added later once Prisma client is regenerated */}
                <button className="mt-2 w-max rounded bg-primary px-2 py-1 text-primary-foreground">Save {String(active).toUpperCase()}</button>
              </form>
            );
          })}
        </div>
      </div>

      <form action={setHero} className="grid gap-2 rounded border p-3 text-sm">
        <div className="font-medium">Hero image URL</div>
        <input name="heroImageUrl" defaultValue={item.heroImageUrl || ""} placeholder="/uploads/..." className="rounded border px-2 py-1" />
        <div>
          <label className="mb-1 block text-xs">Hero image alt (localized)</label>
          {(tabs as string[]).map((loc) => {
            const t = item.translations.find((x) => x.locale === loc);
            if (loc !== active) return null;
            return <input key={loc} name="t_alt" defaultValue={t?.heroImageAlt || ""} className="w-full rounded border px-2 py-1" />;
          })}
        </div>
        <div>
          <label className="mb-1 block text-xs">Or upload new image</label>
          <DropzoneInput name="file" />
        </div>
        <input type="hidden" name="locale" value={active} />
        <button className="rounded border px-2 py-1 hover:bg-muted">Save</button>
      </form>

      <form action={setPageHero} className="grid gap-2 rounded border p-3 text-sm">
        <div className="font-medium">Page hero image URL (detail page)</div>
        <input name="pageHeroImageUrl" defaultValue={item.pageHeroImageUrl || ""} placeholder="/uploads/..." className="rounded border px-2 py-1" />
        <div>
          <label className="mb-1 block text-xs">Page hero image alt (localized)</label>
          {(tabs as string[]).map((loc) => {
            const t = item.translations.find((x) => x.locale === loc);
            if (loc !== active) return null;
            return <input key={loc} name="page_t_alt" defaultValue={t?.pageHeroImageAlt || ""} className="w-full rounded border px-2 py-1" />;
          })}
        </div>
        <div>
          <label className="mb-1 block text-xs">Or upload new image</label>
          <DropzoneInput name="file" />
        </div>
        <input type="hidden" name="locale" value={active} />
        <button className="rounded border px-2 py-1 hover:bg-muted">Save</button>
      </form>

      {media.length > 0 ? (
        <div className="rounded border p-3 text-sm">
          <div className="mb-2 font-medium">Or pick from media</div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((m) => (
              <li key={m.id} className="overflow-hidden rounded border">
                <div className="relative h-32 w-full">
                  <Image src={m.url} alt={m.alt} fill className="object-cover" />
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="truncate text-xs">{m.url}</span>
                  <form action={setHero} className="flex items-center gap-2">
                    <input type="hidden" name="heroImageUrl" value={m.url} />
                    <input type="hidden" name="locale" value={active} />
                    <button className="rounded border px-2 py-1 text-xs hover:bg-muted">Use</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}


