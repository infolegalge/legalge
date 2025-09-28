import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CompanyCreateForm from "@/components/admin/CompanyCreateForm";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  type AppUser = NonNullable<Session["user"]> & { role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "AUTHOR" };
  const role = (session?.user as AppUser)?.role;
  if (role !== "SUPER_ADMIN") throw new Error("Forbidden");
}

async function createCompany(formData: FormData) {
  "use server";
  try {
    await requireSuperAdmin();
    
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim();
    const description = String(formData.get("description") || "").trim() || null;
    const shortDesc = String(formData.get("shortDesc") || "").trim() || null;
    const longDesc = String(formData.get("longDesc") || "").trim() || null;
    const logoUrl = String(formData.get("logoUrl") || "").trim() || null;
    const website = String(formData.get("website") || "").trim() || null;
    const phone = String(formData.get("phone") || "").trim() || null;
    const email = String(formData.get("email") || "").trim() || null;
    const address = String(formData.get("address") || "").trim() || null;
    const mapLink = String(formData.get("mapLink") || "").trim() || null;
    
    if (!name || !slug) {
      return { error: "Name and slug are required" };
    }
    
    // Check if slug already exists
    const existingCompany = await prisma.company.findUnique({
      where: { slug }
    });
    
    if (existingCompany) {
      return { error: `A company with slug "${slug}" already exists. Please choose a different slug.` };
    }
    
    // Create the company
    const company = await prisma.company.create({
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
        mapLink: mapLink || undefined
      } 
    });
    
    revalidatePath("/");
    return { success: true, company: { id: company.id, name: company.name, slug: company.slug } };
  } catch (error) {
    console.error("Error creating company:", error);
    return { error: "Failed to create company. Please try again." };
  }
}


export default async function NewCompany({ 
  params 
}: { 
  params: Promise<{ locale: Locale }> 
}) {
  const { locale } = await params;

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
          <h1 className="text-2xl font-bold">Create New Company</h1>
          <p className="text-muted-foreground">Add a new legal company to the platform</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <CompanyCreateForm createAction={createCompany} />
      </div>
    </div>
  );
}
