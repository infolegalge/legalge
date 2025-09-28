import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  type AppUser = NonNullable<Session["user"]> & { role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "AUTHOR" };
  const role = (session?.user as AppUser)?.role;
  if (role !== "SUPER_ADMIN") throw new Error("Forbidden");
}

async function createTranslation(formData: FormData) {
  "use server";
  await requireSuperAdmin();
  
  const specialistProfileId = String(formData.get("specialistProfileId") || "");
  const locale = String(formData.get("locale") || "") as Locale;
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const role = String(formData.get("role") || "").trim() || null;
  const bio = String(formData.get("bio") || "").trim() || null;
  const metaTitle = String(formData.get("metaTitle") || "").trim() || null;
  const metaDescription = String(formData.get("metaDescription") || "").trim() || null;
  const philosophy = String(formData.get("philosophy") || "").trim() || null;
  const focusAreas = String(formData.get("focusAreas") || "").trim() || null;
  const representativeMatters = String(formData.get("representativeMatters") || "").trim() || null;
  const teachingWriting = String(formData.get("teachingWriting") || "").trim() || null;
  const credentials = String(formData.get("credentials") || "").trim() || null;
  const values = String(formData.get("values") || "").trim() || null;
  
  if (!specialistProfileId || !locale || !name || !slug) return;
  
  await prisma.specialistProfileTranslation.create({
    data: {
      specialistProfileId,
      locale,
      name,
      slug,
      role: role || undefined,
      bio: bio || undefined,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      philosophy: philosophy || undefined,
      focusAreas: focusAreas || undefined,
      representativeMatters: representativeMatters || undefined,
      teachingWriting: teachingWriting || undefined,
      credentials: credentials || undefined,
      values: values || undefined,
    }
  });
  revalidatePath("/");
}

async function updateTranslation(formData: FormData) {
  "use server";
  await requireSuperAdmin();
  
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const role = String(formData.get("role") || "").trim() || null;
  const bio = String(formData.get("bio") || "").trim() || null;
  const metaTitle = String(formData.get("metaTitle") || "").trim() || null;
  const metaDescription = String(formData.get("metaDescription") || "").trim() || null;
  const philosophy = String(formData.get("philosophy") || "").trim() || null;
  const focusAreas = String(formData.get("focusAreas") || "").trim() || null;
  const representativeMatters = String(formData.get("representativeMatters") || "").trim() || null;
  const teachingWriting = String(formData.get("teachingWriting") || "").trim() || null;
  const credentials = String(formData.get("credentials") || "").trim() || null;
  const values = String(formData.get("values") || "").trim() || null;
  
  if (!id || !name || !slug) return;
  
  await prisma.specialistProfileTranslation.update({
    where: { id },
    data: {
      name,
      slug,
      role: role || undefined,
      bio: bio || undefined,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      philosophy: philosophy || undefined,
      focusAreas: focusAreas || undefined,
      representativeMatters: representativeMatters || undefined,
      teachingWriting: teachingWriting || undefined,
      credentials: credentials || undefined,
      values: values || undefined,
    }
  });
  revalidatePath("/");
}

async function deleteTranslation(id: string) {
  "use server";
  await requireSuperAdmin();
  await prisma.specialistProfileTranslation.delete({ where: { id } });
  revalidatePath("/");
}

async function deleteTranslationAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (id) {
    await deleteTranslation(id);
  }
}

export default async function SpecialistTranslations({ 
  params 
}: { 
  params: Promise<{ locale: Locale }> 
}) {
  const { locale } = await params;
  
  const [specialists, translations] = await Promise.all([
    prisma.specialistProfile.findMany({ 
      orderBy: { name: "asc" },
      include: { translations: true }
    }),
    prisma.specialistProfileTranslation.findMany({
      orderBy: [{ specialistProfile: { name: "asc" } }, { locale: "asc" }],
      include: { specialistProfile: true }
    })
  ]);

  const locales: Locale[] = ["en", "ka", "ru"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/${locale}/admin/lawyers`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Specialists
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Specialist Translations</h1>
          <p className="text-muted-foreground">Manage specialist profiles in multiple languages</p>
        </div>
      </div>

      {/* Create New Translation */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Create New Translation</h2>
        <form action={createTranslation} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Specialist *</label>
            <select name="specialistProfileId" className="w-full rounded border px-3 py-2" required>
              <option value="">Select a specialist</option>
              {specialists.map((specialist) => (
                <option key={specialist.id} value={specialist.id}>
                  {specialist.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium">Language *</label>
            <select name="locale" className="w-full rounded border px-3 py-2" required>
              <option value="">Select language</option>
              {locales.map((loc) => (
                <option key={loc} value={loc}>
                  {loc.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium">Name *</label>
            <input name="name" className="w-full rounded border px-3 py-2" required />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium">Slug *</label>
            <input name="slug" className="w-full rounded border px-3 py-2" required />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <input name="role" className="w-full rounded border px-3 py-2" />
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium">Meta Title</label>
            <input name="metaTitle" className="w-full rounded border px-3 py-2" />
          </div>
          
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Bio</label>
            <textarea name="bio" rows={3} className="w-full rounded border px-3 py-2"></textarea>
          </div>
          
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Meta Description</label>
            <textarea name="metaDescription" rows={2} className="w-full rounded border px-3 py-2"></textarea>
          </div>
          
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Philosophy</label>
            <textarea name="philosophy" rows={3} className="w-full rounded border px-3 py-2" placeholder="Professional philosophy and approach"></textarea>
          </div>
          
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Focus Areas</label>
            <textarea name="focusAreas" rows={4} className="w-full rounded border px-3 py-2" placeholder="Enter each focus area on a new line. They will be automatically formatted as a JSON array."></textarea>
          </div>
          
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Representative Matters</label>
            <textarea name="representativeMatters" rows={4} className="w-full rounded border px-3 py-2" placeholder="Enter each matter on a new line. They will be automatically formatted as a JSON array."></textarea>
          </div>
          
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Teaching, Writing & Speaking</label>
            <textarea name="teachingWriting" rows={4} className="w-full rounded border px-3 py-2" placeholder="JSON format: {&quot;courses&quot;: [&quot;Course 1&quot;], &quot;workshops&quot;: [&quot;Workshop 1&quot;], &quot;topics&quot;: [&quot;Topic 1&quot;]}"></textarea>
          </div>
          
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Credentials & Memberships</label>
            <textarea name="credentials" rows={3} className="w-full rounded border px-3 py-2" placeholder="Enter each credential on a new line. They will be automatically formatted as a JSON array."></textarea>
          </div>
          
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Values & How We Work</label>
            <textarea name="values" rows={4} className="w-full rounded border px-3 py-2" placeholder="JSON format: {&quot;Clarity first&quot;: &quot;Description&quot;, &quot;Speed with rigor&quot;: &quot;Description&quot;}"></textarea>
          </div>
          
          <div className="md:col-span-2">
            <button 
              type="submit" 
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Translation
            </button>
          </div>
        </form>
      </div>

      {/* Existing Translations */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Existing Translations</h2>
        </div>
        <div className="divide-y">
          {translations.map((translation) => (
            <div key={translation.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{translation.name}</h3>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      {translation.locale.toUpperCase()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {translation.specialistProfile.name}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>/{translation.locale}/specialists/{translation.slug}</span>
                    {translation.role && <span>• {translation.role}</span>}
                  </div>
                  
                  {translation.bio && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {translation.bio}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <form action={updateTranslation} className="flex gap-2">
                    <input type="hidden" name="id" value={translation.id} />
                    <input type="hidden" name="name" value={translation.name} />
                    <input type="hidden" name="slug" value={translation.slug} />
                    <input type="hidden" name="role" value={translation.role || ""} />
                    <input type="hidden" name="bio" value={translation.bio || ""} />
                    <input type="hidden" name="metaTitle" value={translation.metaTitle || ""} />
                    <input type="hidden" name="metaDescription" value={translation.metaDescription || ""} />
                    <input type="hidden" name="philosophy" value={translation.philosophy || ""} />
                    <input type="hidden" name="focusAreas" value={translation.focusAreas || ""} />
                    <input type="hidden" name="representativeMatters" value={translation.representativeMatters || ""} />
                    <input type="hidden" name="teachingWriting" value={translation.teachingWriting || ""} />
                    <input type="hidden" name="credentials" value={translation.credentials || ""} />
                    <input type="hidden" name="values" value={translation.values || ""} />
                    <button 
                      type="submit" 
                      className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm hover:bg-muted"
                    >
                      <Save className="h-3 w-3" />
                      Update
                    </button>
                  </form>
                  
                  <form action={deleteTranslationAction}>
                    <input type="hidden" name="id" value={translation.id} />
                    <button 
                      type="submit" 
                      className="inline-flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
