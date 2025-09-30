import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CompanyEditForm from "@/components/admin/CompanyEditForm";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  type AppUser = NonNullable<Session["user"]> & { role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "AUTHOR" };
  const role = (session?.user as AppUser)?.role;
  if (role !== "SUPER_ADMIN") throw new Error("Forbidden");
}

async function updateCompany(formData: FormData) {
  "use server";
  try {
    await requireSuperAdmin();
    
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim();
    const description = String(formData.get("description") || "").trim() || null;
    const shortDesc = String(formData.get("shortDesc") || "").trim() || null;
    const longDesc = String(formData.get("longDesc") || "").trim() || null;
    // Translations
    const name_en = String(formData.get('name_en') || '').trim();
    const name_ru = String(formData.get('name_ru') || '').trim();
    const slug_en = String(formData.get('slug_en') || '').trim();
    const slug_ru = String(formData.get('slug_ru') || '').trim();
    const description_en = String(formData.get('description_en') || '').trim() || null;
    const description_ru = String(formData.get('description_ru') || '').trim() || null;
    const shortDesc_en = String(formData.get('shortDesc_en') || '').trim() || null;
    const shortDesc_ru = String(formData.get('shortDesc_ru') || '').trim() || null;
    const longDesc_en = String(formData.get('longDesc_en') || '').trim() || null;
    const longDesc_ru = String(formData.get('longDesc_ru') || '').trim() || null;
    const logoUrl = String(formData.get("logoUrl") || "").trim() || null;
    const website = String(formData.get("website") || "").trim() || null;
    const phone = String(formData.get("phone") || "").trim() || null;
    const email = String(formData.get("email") || "").trim() || null;
    const address = String(formData.get("address") || "").trim() || null;
    const mapLink = String(formData.get("mapLink") || "").trim() || null;
    const metaTitle = String(formData.get("metaTitle") || "").trim() || null;
    const metaTitle_en = String(formData.get("metaTitle_en") || "").trim() || null;
    const metaTitle_ru = String(formData.get("metaTitle_ru") || "").trim() || null;
    const metaDescription = String(formData.get("metaDescription") || "").trim() || null;
    const metaDescription_en = String(formData.get("metaDescription_en") || "").trim() || null;
    const metaDescription_ru = String(formData.get("metaDescription_ru") || "").trim() || null;
    const ogTitle = String(formData.get("ogTitle") || "").trim() || null;
    const ogTitle_en = String(formData.get("ogTitle_en") || "").trim() || null;
    const ogTitle_ru = String(formData.get("ogTitle_ru") || "").trim() || null;
    const ogDescription = String(formData.get("ogDescription") || "").trim() || null;
    const ogDescription_en = String(formData.get("ogDescription_en") || "").trim() || null;
    const ogDescription_ru = String(formData.get("ogDescription_ru") || "").trim() || null;
    
    if (!id || !name || !slug) {
      return { error: "ID, name and slug are required" };
    }
    
    // Check if slug already exists (excluding current company)
    const existingCompany = await prisma.company.findFirst({
      where: { 
        slug,
        NOT: { id: id }
      }
    });
    
    if (existingCompany) {
      return { error: `A company with slug "${slug}" already exists. Please choose a different slug.` };
    }
    
    // Update the company
    await prisma.company.update({
      where: { id },
      data: { 
        name, 
        slug, 
        description: description || undefined,
        shortDesc: shortDesc || undefined,
        longDesc: longDesc || undefined,
        logoUrl: logoUrl || undefined,
        website: website || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        mapLink: mapLink || undefined,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        ogTitle: ogTitle || undefined,
        ogDescription: ogDescription || undefined
      } 
    });

    // Upsert EN/RU translations using separate calls (harmonized with company dashboard)
    const client: any = prisma as any;
    if (client.companyTranslation) {
      await client.companyTranslation.upsert({
        where: { companyId_locale: { companyId: id, locale: 'en' } },
        create: { companyId: id, locale: 'en', name: name_en || name, slug: slug_en || (slug + '-en'), description: description_en, shortDesc: shortDesc_en, longDesc: longDesc_en, metaTitle: metaTitle_en || metaTitle, metaDescription: metaDescription_en || metaDescription, ogTitle: ogTitle_en || ogTitle, ogDescription: ogDescription_en || ogDescription },
        update: { name: name_en || name, slug: slug_en || (slug + '-en'), description: description_en, shortDesc: shortDesc_en, longDesc: longDesc_en, metaTitle: metaTitle_en || metaTitle, metaDescription: metaDescription_en || metaDescription, ogTitle: ogTitle_en || ogTitle, ogDescription: ogDescription_en || ogDescription },
      });
      await client.companyTranslation.upsert({
        where: { companyId_locale: { companyId: id, locale: 'ru' } },
        create: { companyId: id, locale: 'ru', name: name_ru || name, slug: slug_ru || (slug + '-ru'), description: description_ru, shortDesc: shortDesc_ru, longDesc: longDesc_ru, metaTitle: metaTitle_ru || metaTitle, metaDescription: metaDescription_ru || metaDescription, ogTitle: ogTitle_ru || ogTitle, ogDescription: ogDescription_ru || ogDescription },
        update: { name: name_ru || name, slug: slug_ru || (slug + '-ru'), description: description_ru, shortDesc: shortDesc_ru, longDesc: longDesc_ru, metaTitle: metaTitle_ru || metaTitle, metaDescription: metaDescription_ru || metaDescription, ogTitle: ogTitle_ru || ogTitle, ogDescription: ogDescription_ru || ogDescription },
      });
    }
    
    revalidatePath("/");
    return { success: true, company: { id, name, slug } };
  } catch (error) {
    console.error("Error updating company:", error);
    return { error: "Failed to update company. Please try again." };
  }
}

export default async function EditCompany({ 
  params 
}: { 
  params: Promise<{ locale: Locale; id: string }> 
}) {
  const { locale, id } = await params;
  
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          specialists: true,
          posts: true
        }
      }
    }
  });

  if (!company) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link 
            href={`/${locale}/admin/companies`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Companies
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-800">Company Not Found</h2>
          <p className="text-red-600">The company you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/${locale}/admin/companies`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Company</h1>
          <p className="text-muted-foreground">Update {company.name}&apos;s profile</p>
        </div>
      </div>

      {/* Company Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-medium">Specialists</p>
              <p className="text-2xl font-bold">{company._count.specialists}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-sm font-medium">Posts</p>
              <p className="text-2xl font-bold">{company._count.posts}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        {/** Load and pass translations so the form initializes EN/RU tabs */}
        {/** eslint-disable-next-line react/jsx-no-undef */}
        <CompanyEditForm 
          company={company}
          translations={(await prisma.companyTranslation.findMany({ where: { companyId: id }, select: { locale: true, name: true, slug: true, description: true, shortDesc: true, longDesc: true } })) as any}
          updateAction={updateCompany}
        />
      </div>
    </div>
  );
}
