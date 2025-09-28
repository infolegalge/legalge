import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";
import { Edit, Trash2, Building2, Users, Briefcase } from "lucide-react";
import CollapsibleSpecialistCreateForm from "@/components/admin/CollapsibleSpecialistCreateForm";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  type AppUser = NonNullable<Session["user"]> & { role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "AUTHOR" };
  const role = (session?.user as AppUser)?.role;
  if (role !== "SUPER_ADMIN") throw new Error("Forbidden");
}

async function createSpecialist(formData: FormData) {
  "use server";
  try {
    await requireSuperAdmin();
    
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim();
    const role = String(formData.get("role") || "").trim() || null;
    const bio = String(formData.get("bio") || "").trim() || null;
    const contactEmail = String(formData.get("contactEmail") || "").trim() || null;
    const contactPhone = String(formData.get("contactPhone") || "").trim() || null;
    const avatarUrl = String(formData.get("avatarUrl") || "").trim() || null;
    const philosophy = String(formData.get("philosophy") || "").trim() || null;
    const focusAreasText = String(formData.get("focusAreas") || "").trim();
    const focusAreas = focusAreasText ? JSON.stringify(focusAreasText.split('\n').filter(line => line.trim())) : null;
    const representativeMattersText = String(formData.get("representativeMatters") || "").trim();
    const representativeMatters = representativeMattersText ? JSON.stringify(representativeMattersText.split('\n').filter(line => line.trim())) : null;
    const teachingWriting = String(formData.get("teachingWriting") || "").trim() || null;
    const credentials = String(formData.get("credentials") || "").trim() || null;
    const values = String(formData.get("values") || "").trim() || null;
    const languagesArray = formData.getAll("languages") as string[];
    const languages = JSON.stringify(languagesArray);
    const specializationsArray = formData.getAll("specializations") as string[];
    const specializations = JSON.stringify(specializationsArray);
    const companyId = String(formData.get("companyId") || "").trim() || null;
    const metaTitle = String(formData.get("metaTitle") || "").trim() || null;
    const metaDescription = String(formData.get("metaDescription") || "").trim() || null;
    
    if (!name || !slug) {
      return { error: "Name and slug are required" };
    }
    
    // Check if slug already exists
    const existingSpecialist = await prisma.specialistProfile.findUnique({
      where: { slug }
    });
    
    if (existingSpecialist) {
      return { error: `A specialist with slug "${slug}" already exists. Please choose a different slug.` };
    }
    
    // Create the specialist
    const specialist = await prisma.specialistProfile.create({ 
      data: { 
        name, 
        slug, 
        role: role || undefined,
        bio: bio || undefined,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        avatarUrl: avatarUrl || undefined,
        philosophy: philosophy || undefined,
        focusAreas: focusAreas || undefined,
        representativeMatters: representativeMatters || undefined,
        teachingWriting: teachingWriting || undefined,
        credentials: credentials || undefined,
        values: values || undefined,
        languages: languages,
        specializations: specializations,
        companyId: companyId || undefined
      } 
    });

    // Create translations in all 3 languages
    const locales = ["en", "ka", "ru"] as const;
    for (const locale of locales) {
      await prisma.specialistProfileTranslation.create({
        data: {
          specialistProfileId: specialist.id,
          locale,
          name: name, // Use the same name for all languages initially
          slug: slug, // Use the same slug for all languages initially
          role: role || undefined,
          bio: bio || undefined,
          metaTitle: metaTitle || `${name} - Legal Specialist`,
          metaDescription: metaDescription || bio || `Professional legal services by ${name}`
        }
      });
    }
    
    revalidatePath("/");
    return { success: true, specialist: { id: specialist.id, name: specialist.name, slug: specialist.slug } };
  } catch (error) {
    console.error("Error creating specialist:", error);
    return { error: "Failed to create specialist. Please try again." };
  }
}


async function deleteSpecialist(id: string) {
  "use server";
  await requireSuperAdmin();
  await prisma.specialistProfile.delete({ where: { id } });
  revalidatePath("/");
}

async function deleteSpecialistAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (id) {
    await deleteSpecialist(id);
  }
}

export default async function SpecialistsAdmin({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const [specialists, services, companies] = await Promise.all([
    prisma.specialistProfile.findMany({ 
      orderBy: { createdAt: "desc" }, 
      include: { 
        services: true,
        company: true
      } 
    }),
    prisma.service.findMany({ 
      orderBy: { title: "asc" },
      include: { practiceArea: true }
    }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Specialist Management</h2>
          <p className="text-muted-foreground">Manage legal specialists, their practice areas, and company relationships</p>
        </div>
        <div className="flex gap-2">
          <Link 
            href={`/${locale}/admin/lawyers/translations`}
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            Translations
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Specialists</p>
              <p className="text-2xl font-bold">{specialists.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Company Specialists</p>
              <p className="text-2xl font-bold">{specialists.filter(s => s.companyId).length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Solo Practitioners</p>
              <p className="text-2xl font-bold">{specialists.filter(s => !s.companyId).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create New Specialist Form */}
      <CollapsibleSpecialistCreateForm services={services} companies={companies} createAction={createSpecialist} />

      {/* Specialists List */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h3 className="text-lg font-semibold">All Specialists</h3>
        </div>
        <div className="divide-y">
          {specialists.map((specialist) => (
            <div key={specialist.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-semibold">{specialist.name}</h4>
                      <p className="text-sm text-muted-foreground">{specialist.role || "Legal Specialist"}</p>
                    </div>
                    {specialist.company ? (
                      <div className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        <Building2 className="h-3 w-3" />
                        {specialist.company.name}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                        <Users className="h-3 w-3" />
                        Solo Practitioner
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>/{locale}/specialists/{specialist.slug}</span>
                    {specialist.contactEmail && <span>• {specialist.contactEmail}</span>}
                    {specialist.contactPhone && <span>• {specialist.contactPhone}</span>}
                    <span>• {specialist.services.length} services</span>
                  </div>

                  {specialist.bio && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{specialist.bio}</p>
                  )}

                  {specialist.services.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground">Practice Areas:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {specialist.services.slice(0, 3).map((service) => (
                          <span key={service.id} className="rounded bg-gray-100 px-2 py-1 text-xs">
                            {service.title}
                          </span>
                        ))}
                        {specialist.services.length > 3 && (
                          <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                            +{specialist.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/${locale}/admin/lawyers/${specialist.id}/edit`}
                    className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Link>
                  <form action={deleteSpecialistAction}>
                    <input type="hidden" name="id" value={specialist.id} />
                    <button type="submit" className="inline-flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
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


