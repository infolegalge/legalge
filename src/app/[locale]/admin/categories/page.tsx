import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type SessionUserWithRole = { role?: string };

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as SessionUserWithRole | undefined)?.role;
  if (!session || role !== "SUPER_ADMIN") redirect("/");
}

function makeSlug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKC")
    .replace(/["'’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function createCategory(formData: FormData) {
  "use server";
  await requireSuperAdmin();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const slugBase = String(formData.get("slug") || "").trim() || makeSlug(name);
  let slug = slugBase;
  let i = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${i++}`;
  }
  const created = await prisma.category.create({ data: { name, slug, type: "GLOBAL" } });
  // Initialize translations for KA/EN/RU with autoslug (if model exists in current client)
  interface CategoryTranslationDelegate {
    create(args: { data: { categoryId: string; locale: Locale; name: string; slug: string } }): Promise<unknown>;
    findFirst(args: { where: Record<string, unknown> }): Promise<unknown | null>;
  }
  const maybeCT = (prisma as unknown as { categoryTranslation?: CategoryTranslationDelegate }).categoryTranslation;
  if (maybeCT?.create && maybeCT?.findFirst) {
    const locales: Array<{ loc: Locale; n?: string; s?: string }> = [
      { loc: "ka" as Locale, n: String(formData.get("name_ka") || ""), s: String(formData.get("slug_ka") || "") },
      { loc: "en" as Locale, n: String(formData.get("name_en") || ""), s: String(formData.get("slug_en") || "") },
      { loc: "ru" as Locale, n: String(formData.get("name_ru") || ""), s: String(formData.get("slug_ru") || "") },
    ];
    for (const { loc, n, s } of locales) {
      const nameLoc = n?.trim() || name;
      const tSlugBase = (s?.trim() || makeSlug(nameLoc));
      let tSlug = tSlugBase;
      let i = 1;
      while (await maybeCT.findFirst({ where: { locale: loc, slug: tSlug } })) {
        tSlug = `${tSlugBase}-${i++}`;
      }
      await maybeCT.create({ data: { categoryId: created.id, locale: loc, name: nameLoc, slug: tSlug } });
    }
  }
  const loc = String(formData.get("locale") || "");
  if (loc) revalidatePath(`/${loc}/admin/categories`);
  else revalidatePath("/");
}

async function deleteCategoryAction(formData: FormData) {
  "use server";
  await requireSuperAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.postCategory.deleteMany({ where: { categoryId: id } });
  await prisma.category.delete({ where: { id } });
  const loc = String(formData.get("locale") || "");
  if (loc) revalidatePath(`/${loc}/admin/categories`);
  else revalidatePath("/");
}

async function updateCategory(formData: FormData) {
  "use server";
  await requireSuperAdmin();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) return;
  const slugInput = String(formData.get("slug") || "").trim();
  const slugBase = slugInput || makeSlug(name);
  let slug = slugBase;
  let i = 1;
  while (await prisma.category.findFirst({ where: { slug, NOT: { id } }, select: { id: true } })) {
    slug = `${slugBase}-${i++}`;
  }
  await prisma.category.update({ where: { id }, data: { name, slug } });
  // Update translations' names and slugs for all locales if model exists
  interface CategoryTranslationUpdateDelegate {
    findMany(args: { where: { categoryId: string | { in: string[] } } }): Promise<Array<{ id: string; locale: Locale; name: string; slug: string }>>;
    findFirst(args: { where: Record<string, unknown> }): Promise<unknown | null>;
    update(args: { where: { id: string }; data: { name?: string; slug?: string } }): Promise<unknown>;
  }
  const maybeCT = (prisma as unknown as { categoryTranslation?: CategoryTranslationUpdateDelegate }).categoryTranslation;
  if (maybeCT?.findMany && maybeCT?.findFirst && maybeCT?.update) {
    const translations = await maybeCT.findMany({ where: { categoryId: id } });
    for (const t of translations) {
      const providedName = String(formData.get(`name_${t.locale}`) || "").trim();
      const providedSlug = String(formData.get(`slug_${t.locale}`) || "").trim();
      const newName = providedName || name;
      const tSlugInput = providedSlug || newName;
      const tSlugBase = makeSlug(tSlugInput as string);
      let tSlug = tSlugBase;
      let i = 1;
      while (await maybeCT.findFirst({ where: { locale: t.locale, slug: tSlug, NOT: { id: t.id } } })) {
        tSlug = `${tSlugBase}-${i++}`;
      }
      await maybeCT.update({ where: { id: t.id }, data: { name: newName, slug: tSlug } });
    }
  }
  const loc = String(formData.get("locale") || "");
  if (loc) revalidatePath(`/${loc}/admin/categories`);
  else revalidatePath("/");
}

export default async function CategoriesAdminPage({ params }: { params: Promise<{ locale: Locale }> }) {
  await requireSuperAdmin();
  const { locale } = await params;
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { posts: true },
  });

  // Fetch translations if model exists
  interface CategoryTranslationReadDelegate {
    findMany(args: { where: { categoryId: { in: string[] } } }): Promise<Array<{ categoryId: string; locale: Locale; name: string; slug: string }>>;
  }
  const ctModel = (prisma as unknown as { categoryTranslation?: CategoryTranslationReadDelegate }).categoryTranslation;
  const tMap: Record<string, Array<{ locale: Locale; name: string; slug: string }>> = {};
  if (ctModel?.findMany) {
    const ids = categories.map((c) => c.id);
    const trs = await ctModel.findMany({ where: { categoryId: { in: ids } } });
    for (const t of trs) {
      const arr = (tMap[t.categoryId] ||= []);
      arr.push({ locale: t.locale, name: t.name, slug: t.slug });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Post Categories</h1>
          <p className="text-sm text-muted-foreground">Create and manage categories used for News posts</p>
        </div>
        <Link href={`/${locale}/admin/posts`} className="text-sm underline">Back to Posts</Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Category</CardTitle>
            <CardDescription>Global categories visible site-wide</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCategory} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-sm mb-1">Default Name</label>
                  <input name="name" className="w-full rounded border px-3 py-2" placeholder="e.g. Law & Policy" required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Default Slug (optional)</label>
                  <input name="slug" className="w-full rounded border px-3 py-2" placeholder="law-and-policy" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Localized Names (optional)</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="block text-xs mb-1">KA Name</label>
                    <input name="name_ka" className="w-full rounded border px-3 py-2" placeholder="ქართული სახელი" />
                    <label className="block text-xs mt-2 mb-1">KA Slug</label>
                    <input name="slug_ka" className="w-full rounded border px-3 py-2" placeholder="auto from name" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">EN Name</label>
                    <input name="name_en" className="w-full rounded border px-3 py-2" placeholder="English name" />
                    <label className="block text-xs mt-2 mb-1">EN Slug</label>
                    <input name="slug_en" className="w-full rounded border px-3 py-2" placeholder="auto from name" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">RU Name</label>
                    <input name="name_ru" className="w-full rounded border px-3 py-2" placeholder="Русское название" />
                    <label className="block text-xs mt-2 mb-1">RU Slug</label>
                    <input name="slug_ru" className="w-full rounded border px-3 py-2" placeholder="auto from name" />
                  </div>
                </div>
              </div>

              <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Create</button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Categories</CardTitle>
            <CardDescription>Delete a category if not needed</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {categories.map((c) => (
                <li key={c.id} className="py-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
                    {/* Edit form */}
                    <form action={updateCategory} className="flex-1">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="id" value={c.id} />
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Name</label>
                          <input name="name" defaultValue={c.name} className="w-full rounded border px-3 py-2" />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Slug</label>
                          <input name="slug" defaultValue={c.slug} className="w-full rounded border px-3 py-2" />
                          <p className="text-[11px] text-muted-foreground mt-1">Auto-generated from name if left empty.</p>
                        </div>
                      </div>
                      {/* Locale fields */}
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        {(['ka','en','ru'] as const).map((loc) => {
                          const tArr = tMap[c.id] || [];
                          const t = tArr.find((x)=>x.locale===loc);
                          return (
                            <div key={loc}>
                              <div className="text-xs font-medium mb-1">{loc.toUpperCase()} Translation</div>
                              <label className="block text-[11px] text-muted-foreground mb-1">Name</label>
                              <input name={`name_${loc}`} defaultValue={t?.name || ''} className="w-full rounded border px-3 py-2" />
                              <label className="block text-[11px] text-muted-foreground mt-2 mb-1">Slug</label>
                              <input name={`slug_${loc}`} defaultValue={t?.slug || ''} className="w-full rounded border px-3 py-2" />
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3">
                        <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Save</button>
                      </div>
                    </form>
                    {/* Delete button */}
                    <form action={deleteCategoryAction} className="md:self-end">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="rounded bg-red-600 px-4 py-2 text-sm text-white">Delete</button>
                    </form>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">/{c.slug} · {c.posts.length} posts</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";


