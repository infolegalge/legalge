import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import SpecialistEditForm from "@/components/admin/SpecialistEditForm";
import MultiLanguageSpecialistEditForm from "@/components/admin/MultiLanguageSpecialistEditForm";

function normalizeTeachingWritingInput(raw: FormDataEntryValue | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim();

  if (!value) {
    return "";
  }

  try {
    JSON.parse(value);
    return value;
  } catch {
    const entries = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (entries.length === 0) {
      return "";
    }

    return JSON.stringify({ entries });
  }
}

function normalizeStringListInput(raw: FormDataEntryValue | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;

  const value = String(raw).trim();
  if (!value) {
    return "";
  }

  try {
    JSON.parse(value);
    return value;
  } catch {
    const entries = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (entries.length === 0) {
      return "";
    }

    return JSON.stringify(entries);
  }
}

type SessionUserCompany = NonNullable<Session["user"]> & {
  role?: "SUPER_ADMIN" | "COMPANY" | "SPECIALIST" | "SUBSCRIBER";
  companyId?: string;
  companySlug?: string | null;
  id: string;
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
    const section = String(formData.get("section") || "basic");
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim();
    const role = String(formData.get("role") || "").trim() || null;
    const bio = String(formData.get("bio") || "").trim() || null;
    const contactEmail = String(formData.get("contactEmail") || "").trim() || null;
    const contactPhone = String(formData.get("contactPhone") || "").trim() || null;
    const avatarUrl = String(formData.get("avatarUrl") || "").trim() || null;
    const philosophy = String(formData.get("philosophy") || "").trim() || null;
    const focusAreasText = String(formData.get("focusAreas") || "").trim();
    const focusAreas = focusAreasText
      ? JSON.stringify(
          focusAreasText
            .split("\n")
            .filter((line) => line.trim()),
        )
      : null;
    const representativeMattersText = String(formData.get("representativeMatters") || "").trim();
    const representativeMatters = (() => {
      if (!representativeMattersText) return null;
      try {
        JSON.parse(representativeMattersText);
        return representativeMattersText;
      } catch {
        const entries = representativeMattersText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        return entries.length > 0 ? JSON.stringify(entries) : "";
      }
    })();
    const teachingWriting = normalizeTeachingWritingInput(formData.get("teachingWriting"));
    const credentials = normalizeStringListInput(formData.get("credentials"));
    const languagesArray = formData.getAll("languages") as string[];
    const languages = JSON.stringify(languagesArray);
    const specializationsArray = formData.getAll("specializations") as string[];
    const specializations = JSON.stringify(specializationsArray);
    
    if (!id) {
      return { error: "Specialist ID is required" };
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
    
    const updateData: Parameters<typeof prisma.specialistProfile.update>[0]["data"] = {};

    if (section === "basic") {
      if (!name || !slug) {
        return { error: "Name and slug are required" };
      }

      const existingSpecialist = await prisma.specialistProfile.findFirst({
        where: {
          slug,
          NOT: { id }
        }
      });

      if (existingSpecialist) {
        return { error: `A specialist with slug "${slug}" already exists. Please choose a different slug.` };
      }

      Object.assign(updateData, {
        name,
        slug,
        role: role || undefined,
        bio: bio || undefined,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        avatarUrl: avatarUrl || undefined,
        languages,
        specializations,
      });
    } else if (section === "enhanced") {
      Object.assign(updateData, {
        philosophy: philosophy || undefined,
        focusAreas: focusAreas || undefined,
        representativeMatters: representativeMatters || undefined,
        teachingWriting: teachingWriting || undefined,
        credentials: credentials || undefined,
      });
    } else {
      return { error: "Unsupported section" };
    }
    
    // Only super admin can change company
    if (user.role === "SUPER_ADMIN" && section === "basic") {
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

async function updateTranslation(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  "use server";
  try {
    const user = await requireCompanyAdmin();

    const translationId = String(formData.get("translationId") || "").trim();
    const specialistProfileId = String(formData.get("specialistProfileId") || "").trim();
    const locale = String(formData.get("locale") || "").trim() as Locale;
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim();
    const role = String(formData.get("role") || "").trim() || null;
    const bio = String(formData.get("bio") || "").trim() || null;
    const metaTitle = String(formData.get("metaTitle") || "").trim() || null;
    const metaDescription = String(formData.get("metaDescription") || "").trim() || null;
    const philosophy = String(formData.get("philosophy") || "").trim() || null;
    const focusAreas = String(formData.get("focusAreas") || "").trim() || null;
    const representativeMattersText = String(formData.get("representativeMatters") || "").trim();
    const representativeMattersValue = (() => {
      if (!representativeMattersText) return null;
      const trimmed = representativeMattersText.trim();
      if (!trimmed) return null;
      try {
        JSON.parse(trimmed);
        return trimmed;
      } catch {
        const entries = trimmed
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        return entries.length > 0 ? JSON.stringify(entries) : "";
      }
    })();
    const teachingWriting = String(formData.get("teachingWriting") || "").trim() || null;
    const credentials = normalizeStringListInput(formData.get("credentials"));

    if (!specialistProfileId || !locale || !name || !slug) {
      return { error: "Missing required translation fields" };
    }

    const specialist = await prisma.specialistProfile.findUnique({
      where: { id: specialistProfileId },
      select: { companyId: true },
    });

    if (!specialist) {
      return { error: "Specialist not found" };
    }

    if (user.role === "COMPANY" && specialist.companyId && specialist.companyId !== user.companyId) {
      return { error: "You can only edit specialists from your own company" };
    }

    const sanitized = <T extends string | null>(value: T) => {
      if (!value) return null;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    };

    const sanitizeJson = (value: string | null) => {
      if (!value) return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      try {
        JSON.parse(trimmed);
        return trimmed;
      } catch {
        return null;
      }
    };

    const data = {
      name,
      slug,
      role: sanitized(role),
      bio: sanitized(bio),
      metaTitle: sanitized(metaTitle),
      metaDescription: sanitized(metaDescription),
      philosophy: sanitized(philosophy),
      focusAreas: sanitizeJson(focusAreas),
      representativeMatters: sanitizeJson(representativeMattersValue),
      teachingWriting: sanitizeJson(teachingWriting),
      credentials: sanitizeJson(credentials),
    };

    if (translationId) {
      await prisma.specialistProfileTranslation.update({
        where: { id: translationId },
        data,
      });
    } else {
      await prisma.specialistProfileTranslation.upsert({
        where: {
          specialistProfileId_locale: {
            specialistProfileId,
            locale,
          },
        },
        update: data,
        create: {
          specialistProfileId,
          locale,
          ...data,
        },
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating specialist translation:", error);
    return { error: "Failed to update translation" };
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
        company: true,
        translations: true
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
      <MultiLanguageSpecialistEditForm 
        specialist={specialist}
        services={services}
        companies={companies}
        translations={translations}
        updateAction={updateSpecialist}
        updateTranslationAction={updateTranslation}
        assignServicesAction={assignServices}
        isCompanyAdmin={user.role === "COMPANY"}
        canAssignCompany={user.role === "SUPER_ADMIN"}
      />
    </div>
  );
}
