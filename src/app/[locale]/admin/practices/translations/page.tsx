import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/auth";
import RichEditor from "@/components/admin/RichEditor";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  type AppUser = NonNullable<Session["user"]> & { role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "AUTHOR" };
  const role = (session?.user as AppUser)?.role;
  if (role !== "SUPER_ADMIN") throw new Error("Forbidden");
}

async function saveTranslation(formData: FormData) {
  "use server";
  await requireSuperAdmin();
  const practiceAreaId = String(formData.get("practiceAreaId") || "");
  const locale = String(formData.get("locale") || "") as Locale;
  const title = String(formData.get("title") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  if (!practiceAreaId || !title || !slug) return;
  await prisma.practiceAreaTranslation.upsert({
    where: { practiceAreaId_locale: { practiceAreaId, locale } },
    create: { practiceAreaId, locale, title, slug, description: description || undefined },
    update: { title, slug, description: description || undefined },
  });
  revalidatePath("/");
}

export default async function PracticeTranslationsAdmin({ params }: { params: Promise<{ locale: Locale }> }) {
  const items = await prisma.practiceArea.findMany({ include: { translations: true }, orderBy: { title: "asc" } });
  const locales: Locale[] = ["ka", "en", "ru"];
  return (
    <div>
      <h2 className="text-xl font-semibold">Practice Translations</h2>
      <div className="mt-4 space-y-6">
        {items.map((p) => (
          <div key={p.id} className="rounded border p-4">
            <div className="font-medium">{p.title}</div>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {locales.map((loc) => {
                const t = p.translations.find((x) => x.locale === loc);
                return (
                  <form key={loc} action={saveTranslation} className="grid gap-2 rounded border p-3">
                    <input type="hidden" name="practiceAreaId" value={p.id} />
                    <input type="hidden" name="locale" value={loc} />
                    <div className="text-sm text-foreground/70">{loc.toUpperCase()}</div>
                    <input name="title" defaultValue={t?.title || ""} placeholder="Title" className="w-full rounded border px-2 py-1.5" required />
                    <input name="slug" defaultValue={t?.slug || ""} placeholder="Slug" className="w-full rounded border px-2 py-1.5" required />
                    <RichEditor name="description" initialHTML={typeof t?.description === 'string' ? t.description : ""} label="Description" />
                    <button type="submit" className="rounded bg-primary px-2 py-1.5 text-xs text-primary-foreground">Save</button>
                  </form>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


