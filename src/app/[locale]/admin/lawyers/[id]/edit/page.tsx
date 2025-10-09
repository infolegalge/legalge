import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type { Locale } from "@/i18n/locales";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MultiLanguageSpecialistEditForm from "@/components/admin/MultiLanguageSpecialistEditForm";

function normalizeTeachingWritingInput(raw: FormDataEntryValue | null | undefined): string | undefined {
  if (raw === null || raw === undefined) return undefined;
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

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  type AppUser = NonNullable<Session["user"]> & { role?: "SUPER_ADMIN" | "COMPANY" | "LAWYER" | "AUTHOR" };
  const role = (session?.user as AppUser)?.role;
  if (role !== "SUPER_ADMIN") throw new Error("Forbidden");
}

async function updateSpecialist(formData: FormData) {
  "use server";
  try {
    await requireSuperAdmin();
    
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
      : undefined;
    const representativeMattersText = String(formData.get("representativeMatters") || "").trim();
    const representativeMatters = representativeMattersText
      ? JSON.stringify(
          representativeMattersText
            .split("\n")
            .filter((line) => line.trim()),
        )
      : undefined;
    const teachingWriting = normalizeTeachingWritingInput(formData.get("teachingWriting"));
    const credentials = String(formData.get("credentials") || "").trim() || undefined;
    const values = String(formData.get("values") || "").trim() || undefined;
    const languagesArray = formData.getAll("languages") as string[];
    const languages = JSON.stringify(languagesArray);
    const specializationsArray = formData.getAll("specializations") as string[];
    const specializations = JSON.stringify(specializationsArray);
    const companyId = String(formData.get("companyId") || "").trim() || null;
    
    if (!id) {
      return { error: "Specialist ID is required" };
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
        companyId: companyId || undefined
      });
    } else if (section === "enhanced") {
      Object.assign(updateData, {
        ...(philosophy ? { philosophy } : {}),
        ...(focusAreas ? { focusAreas } : {}),
        ...(representativeMatters ? { representativeMatters } : {}),
        ...(teachingWriting !== undefined ? { teachingWriting } : {}),
        ...(credentials ? { credentials } : {}),
        ...(values ? { values } : {}),
      });
    } else {
      return { error: "Unsupported section" };
    }

    if (Object.keys(updateData).length === 0) {
      return { error: "No changes detected" };
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
    await requireSuperAdmin();
    
    const id = String(formData.get("id") || "");
    const locale = String(formData.get("locale") || "") as Locale;
    const translationId = String(formData.get("translationId") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim();
    const role = String(formData.get("role") || "").trim() || null;
    const bio = String(formData.get("bio") || "").trim() || null;
    const metaTitle = String(formData.get("metaTitle") || "").trim() || null;
    const metaDescription = String(formData.get("metaDescription") || "").trim() || null;
    const philosophy = String(formData.get("philosophy") || "").trim() || null;
    const focusAreasText = String(formData.get("focusAreas") || "").trim();
    const focusAreas = focusAreasText ? JSON.stringify(focusAreasText.split('\n').map((line) => line.trim()).filter(Boolean)) : undefined;
    const representativeMattersText = String(formData.get("representativeMatters") || "").trim();
    const representativeMatters = representativeMattersText ? JSON.stringify(representativeMattersText.split('\n').map((line) => line.trim()).filter(Boolean)) : undefined;
    const teachingWriting = normalizeTeachingWritingInput(formData.get("teachingWriting"));
    const credentials = String(formData.get("credentials") || "").trim() || undefined;
    const values = String(formData.get("values") || "").trim() || undefined;
    
    if (!id || !locale || !name || !slug) {
      return { error: "Missing required translation fields" };
    }
    
    // Check if slug already exists in this locale (excluding current translation)
    const existingTranslation = await prisma.specialistProfileTranslation.findFirst({
      where: {
        locale,
        slug,
        NOT: { id: translationId || undefined },
      },
    });

    if (existingTranslation) {
      return { error: "Slug already in use for this locale" };
    }

    const existing = translationId
      ? await prisma.specialistProfileTranslation.findUnique({ where: { id: translationId } })
      : await prisma.specialistProfileTranslation.findUnique({
          where: { specialistProfileId_locale: { specialistProfileId: id, locale } },
        });

    const toEmptyString = (
      incoming: string | null | undefined,
      current: string | null | undefined,
    ): string | undefined => {
      if (incoming && incoming.trim()) return incoming;
      if (incoming === "" && current && current.length > 0) {
        return "";
      }
      return undefined;
    };

    const toJsonString = (
      incoming: string | null | undefined,
      current: string | null | undefined,
    ): string | undefined => {
      if (incoming && incoming.trim()) return incoming;
      if (incoming === "" && current && current.length > 0) {
        return "";
      }
      return undefined;
    };

    const data: Parameters<typeof prisma.specialistProfileTranslation.upsert>[0]["create"] = {
      specialistProfileId: id,
      locale,
      name,
      slug,
      ...(toEmptyString(role, existing?.role) !== undefined ? { role: toEmptyString(role, existing?.role) } : {}),
      ...(toEmptyString(bio, existing?.bio) !== undefined ? { bio: toEmptyString(bio, existing?.bio) } : {}),
      ...(toEmptyString(metaTitle, existing?.metaTitle) !== undefined
        ? { metaTitle: toEmptyString(metaTitle, existing?.metaTitle) }
        : {}),
      ...(toEmptyString(metaDescription, existing?.metaDescription) !== undefined
        ? { metaDescription: toEmptyString(metaDescription, existing?.metaDescription) }
        : {}),
      ...(toEmptyString(philosophy, existing?.philosophy) !== undefined
        ? { philosophy: toEmptyString(philosophy, existing?.philosophy) }
        : {}),
      ...(toJsonString(focusAreas, existing?.focusAreas) !== undefined
        ? { focusAreas: toJsonString(focusAreas, existing?.focusAreas) }
        : {}),
      ...(toJsonString(representativeMatters, existing?.representativeMatters) !== undefined
        ? { representativeMatters: toJsonString(representativeMatters, existing?.representativeMatters) }
        : {}),
      ...(toJsonString(teachingWriting, existing?.teachingWriting) !== undefined
        ? { teachingWriting: toJsonString(teachingWriting, existing?.teachingWriting) }
        : {}),
      ...(toJsonString(credentials, existing?.credentials) !== undefined
        ? { credentials: toJsonString(credentials, existing?.credentials) }
        : {}),
      ...(toJsonString(values, existing?.values) !== undefined
        ? { values: toJsonString(values, existing?.values) }
        : {}),
    };

    await prisma.specialistProfileTranslation.upsert({
      where: translationId
        ? { id: translationId }
        : { specialistProfileId_locale: { specialistProfileId: id, locale } },
      create: data,
      update: data,
    });
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating translation:", error);
    return { error: "Failed to update translation" };
  }
}

async function assignServices(formData: FormData) {
  "use server";
  try {
    await requireSuperAdmin();
    
    const specialistId = String(formData.get("specialistId") || "");
    const serviceIds = formData.getAll("serviceIds") as string[];
    
    if (!specialistId) {
      return { error: "Specialist ID is required" };
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

export default async function EditSpecialist({ 
  params 
}: { 
  params: Promise<{ locale: Locale; id: string }> 
}) {
  const { locale, id } = await params;
  
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
            href={`/${locale}/admin/lawyers`}
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
          <h1 className="text-2xl font-bold">Edit Specialist</h1>
          <p className="text-muted-foreground">Update {specialist.name}&apos;s profile and translations</p>
        </div>
      </div>

      {/* Multi-Language Profile Editor */}
      <MultiLanguageSpecialistEditForm 
        specialist={specialist}
        services={services}
        companies={companies}
        translations={translations}
        updateAction={updateSpecialist}
        updateTranslationAction={updateTranslation}
        assignServicesAction={assignServices}
      />

    </div>
  );
}