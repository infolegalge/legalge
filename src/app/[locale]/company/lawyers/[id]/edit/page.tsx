import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";
import { ArrowLeft, Save, Globe } from "lucide-react";
import SpecialistEditForm from "@/components/admin/SpecialistEditForm";

type SessionUserCompany = NonNullable<Session["user"]> & {
  role?: "SUPER_ADMIN" | "COMPANY" | "SPECIALIST" | "SUBSCRIBER";
  companyId?: string;
  companySlug?: string | null;
};

async function requireCompanyAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUserCompany | undefined;
  if (!user || (user.role !== "COMPANY" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Forbidden");
  }
  // Resolve companyId for COMPANY users if missing (fallback to DB user/company by slug)
  if (user.role === "COMPANY" && !user.companyId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true, companySlug: true },
    });
    let resolvedCompanyId: string | undefined = dbUser?.companyId ?? undefined;
    if (!resolvedCompanyId && (dbUser?.companySlug || user.companySlug)) {
      const companyRecord = await prisma.company.findUnique({
        where: { slug: (dbUser?.companySlug || user.companySlug) ?? undefined },
        select: { id: true },
      });
      resolvedCompanyId = companyRecord?.id ?? undefined;
    }
    (user as { companyId?: string }).companyId = resolvedCompanyId;
  }
  return user;
}

async function updateSpecialist(formData: FormData) {
  "use server";
  try {
    const user = await requireCompanyAdmin();
    
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim();
    const role = String(formData.get("role") || "").trim() || null;
    const bio = String(formData.get("bio") || "").trim() || null;
    const contactEmail = String(formData.get("contactEmail") || "").trim() || null;
    const contactPhone = String(formData.get("contactPhone") || "").trim() || null;
    const avatarUrl = String(formData.get("avatarUrl") || "").trim() || null;
    const philosophy = String(formData.get("philosophy") || "").trim() || null;
    const focusAreasText = String(formData.get("focusAreas") || "").trim();
    const focusAreas = focusAreasText ? JSON.stringify(focusAreasText.split('\n').filter((line) => line.trim())) : null;
    const representativeMattersText = String(formData.get("representativeMatters") || "").trim();
    const representativeMatters = representativeMattersText ? JSON.stringify(representativeMattersText.split('\n').filter((line) => line.trim())) : null;
    const teachingWriting = String(formData.get("teachingWriting") || "").trim() || null;
    const credentials = String(formData.get("credentials") || "").trim() || null;
    const values = String(formData.get("values") || "").trim() || null;
    const languagesArray = formData.getAll("languages") as string[];
    const languages = JSON.stringify(languagesArray);
    const specializationsArray = formData.getAll("specializations") as string[];
    const specializations = JSON.stringify(specializationsArray);
    
    if (!id || !name || !slug) {
      return { error: "ID, name and slug are required" };
    }
    
    // Get the specialist to check company ownership
  const specialist = await prisma.specialistProfile.findUnique({
    where: { id },
    include: { company: true }
  });
    
    if (!specialist) {
      return { error: "Specialist not found" };
    }
    
    // Check if company admin can edit this specialist
    if (user.role === "COMPANY" && specialist.companyId !== user.companyId) {
      return { error: "You can only edit specialists from your own company" };
    }
    
    // Check if slug already exists (excluding current specialist)
    const existingSpecialist = await prisma.specialistProfile.findFirst({
      where: { 
        slug,
        NOT: { id: id }
      }
    });
    
    if (existingSpecialist) {
      return { error: `A specialist with slug "${slug}" already exists. Please choose a different slug.` };
    }
    
    // Update the specialist (company admins can't change companyId)
    const updateData = {
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
      languages,
      specializations,
    } satisfies Parameters<typeof prisma.specialistProfile.update>[0]["data"];
    
    // Only super admin can change company
    if (user.role === "SUPER_ADMIN") {
      const companyId = String(formData.get("companyId") || "").trim() || null;
      Object.assign(updateData, { companyId: companyId || undefined });
    }
    
    await prisma.specialistProfile.update({
      where: { id },
      data: updateData
    });
    
    revalidatePath("/");
    return { success: true, specialist: { id, name, slug } };
  } catch (error) {
    console.error("Error updating specialist:", error);
    return { error: "Failed to update specialist. Please try again." };
  }
}

async function assignServices(formData: FormData) {
  "use server";
  try {
    const user = await requireCompanyAdmin();
    
    const specialistId = String(formData.get("specialistId") || "");
    const serviceIds = formData.getAll("serviceIds") as string[];
    
    if (!specialistId) {
      return { error: "Specialist ID is required" };
    }
    
    // Get the specialist to check company ownership
    const specialist = await prisma.specialistProfile.findUnique({
      where: { id: specialistId }
    });
    
    if (!specialist) {
      return { error: "Specialist not found" };
    }
    
    // Check if company admin can edit this specialist
    if (user.role === "COMPANY" && specialist.companyId !== user.companyId) {
      return { error: "You can only edit specialists from your own company" };
    }
    
    // First, disconnect all current services
    await prisma.specialistProfile.update({
      where: { id: specialistId },
      data: {
        services: {
          set: []
        }
      }
    });
    
    // Then connect the selected services
    if (serviceIds.length > 0) {
      await prisma.specialistProfile.update({
        where: { id: specialistId },
        data: {
          services: {
            connect: serviceIds.map(id => ({ id }))
          }
        }
      });
    }
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error assigning services:", error);
    return { error: "Failed to assign services. Please try again." };
  }
}

export default async function EditCompanySpecialist({ 
  params 
}: { 
  params: Promise<{ locale: Locale; id: string }> 
}) {
  const { locale, id } = await params;
  
  type AppUser = NonNullable<Session["user"]> & { 
    role?: "SUPER_ADMIN" | "COMPANY" | "SPECIALIST" | "SUBSCRIBER";
    companyId?: string;
  };
  let user: AppUser | null = null;
  try {
    user = await requireCompanyAdmin();
  } catch {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link 
            href={`/${locale}/company/lawyers`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Specialists
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-800">Access Denied</h2>
          <p className="text-red-600">You do not have permission to edit specialists.</p>
        </div>
      </div>
    );
  }
  
  const [specialist, services, companies, translations] = await Promise.all([
    prisma.specialistProfile.findUnique({
      where: { id },
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
    prisma.specialistProfileTranslation.findMany({
      where: { specialistProfileId: id }
    })
  ]);

  if (!specialist) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link 
            href={`/${locale}/company/lawyers`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Specialists
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-800">Specialist Not Found</h2>
          <p className="text-red-600">The specialist you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  // Check if company admin can edit this specialist (also allow if specialist has no company yet)
  if (
    user.role === "COMPANY" &&
    specialist.companyId &&
    user.companyId &&
    specialist.companyId !== user.companyId
  ) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link 
            href={`/${locale}/company/lawyers`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lawyers
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-800">Access Denied</h2>
          <p className="text-red-600">You can only edit specialists from your own company.</p>
        </div>
      </div>
    );
  }

  const locales: Locale[] = ["en", "ka", "ru"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/${locale}/company/lawyers`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Specialists
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Specialist</h1>
          <p className="text-muted-foreground">Update {specialist.name}&apos;s profile and translations</p>
        </div>
      </div>

      {/* Main Profile Information */}
      <SpecialistEditForm 
        specialist={specialist}
        services={services}
        companies={companies}
        updateAction={updateSpecialist}
        assignServicesAction={assignServices}
        isCompanyAdmin={user.role === "COMPANY"}
      />

      {/* Translations */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Translations</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Manage specialist profiles in different languages. Each language can have its own name, slug, and content.
        </p>
        
        <div className="grid gap-4 md:grid-cols-3">
          {locales.map((loc) => {
            const translation = translations.find(t => t.locale === loc);
            return (
              <div key={loc} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">{loc.toUpperCase()}</h3>
                  {translation ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                      Translated
                    </span>
                  ) : (
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                      Not translated
                    </span>
                  )}
                </div>
                
                {translation ? (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Name</label>
                      <input 
                        name="name" 
                        defaultValue={translation.name}
                        className="w-full rounded border px-2 py-1 text-sm" 
                        disabled
                      />
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-xs font-medium">Slug</label>
                      <input 
                        name="slug" 
                        defaultValue={translation.slug}
                        className="w-full rounded border px-2 py-1 text-sm" 
                        disabled
                      />
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-xs font-medium">Role</label>
                      <input 
                        name="role" 
                        defaultValue={translation.role || ""}
                        className="w-full rounded border px-2 py-1 text-sm" 
                        disabled
                      />
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-xs font-medium">Bio</label>
                      <textarea 
                        name="bio" 
                        rows={2}
                        defaultValue={translation.bio || ""}
                        className="w-full rounded border px-2 py-1 text-sm" 
                        disabled
                      ></textarea>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Translation editing is only available to super admins.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">No translation available</p>
                    <p className="text-xs text-muted-foreground">
                      Translation creation is only available to super admins.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
