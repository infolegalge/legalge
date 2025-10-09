"use client";

import { useMemo, useState, useTransition } from "react";
import { Save, AlertCircle, CheckCircle, Globe } from "lucide-react";
import ImageUpload from "./ImageUpload";
import ServiceSelector from "./ServiceSelector";
import AutoSlug from "@/components/admin/AutoSlug";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Service {
  id: string;
  title: string;
  practiceArea: {
    title: string;
  };
}

interface Company {
  id: string;
  name: string;
}

interface SpecialistTranslation {
  id: string;
  specialistProfileId: string;
  locale: "ka" | "en" | "ru";
  name: string;
  slug: string;
  role?: string | null;
  bio?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  philosophy?: string | null;
  focusAreas?: string | null;
  representativeMatters?: string | null;
  teachingWriting?: string | null;
  credentials?: string | null;
  values?: string | null;
}

interface Specialist {
  id: string;
  name: string;
  slug: string;
  role?: string | null;
  bio?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  avatarUrl?: string | null;
  languages: string;
  specializations: string;
  philosophy?: string | null;
  focusAreas?: string | null;
  representativeMatters?: string | null;
  teachingWriting?: string | null;
  credentials?: string | null;
  values?: string | null;
  companyId?: string | null;
  company?: {
    id: string;
    name: string;
  } | null;
  services: Array<{
    id: string;
    title: string;
  }>;
  translations?: SpecialistTranslation[];
}

type ActionResult<T extends Record<string, unknown> = Record<string, unknown>> = {
  success?: boolean;
  error?: string;
} & T;

interface SpecialistEditFormProps {
  specialist: Specialist;
  services: Service[];
  companies: Company[];
  updateAction: (formData: FormData) => Promise<ActionResult<{ specialist?: { id: string; name: string; slug: string } }> | void>;
  assignServicesAction: (formData: FormData) => Promise<ActionResult | void>;
  updateTranslationAction: (formData: FormData) => Promise<void>;
  isCompanyAdmin?: boolean;
}

export default function SpecialistEditForm({
  specialist,
  services,
  companies,
  updateAction,
  assignServicesAction,
  updateTranslationAction,
  isCompanyAdmin = false,
}: SpecialistEditFormProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>(
    specialist.services.map((service) => service.id),
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    JSON.parse(specialist.languages || "[]"),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const translations = useMemo(() => specialist.translations ?? [], [specialist.translations]);
  const locales = useMemo(
    () => [
      { code: "ka" as const, name: "ქართული", flag: "🇬🇪" },
      { code: "en" as const, name: "English", flag: "🇺🇸" },
      { code: "ru" as const, name: "Русский", flag: "🇷🇺" },
    ],
    [],
  );

  const getTranslation = (locale: string) => translations.find((t) => t.locale === locale) || null;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, (option) => option.value);
    setSelectedLanguages(values);
  };

  const handleUpdate = async (formData: FormData) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const result = await updateAction(formData);

        if (result && typeof result === "object") {
          if ("error" in result && result.error) {
            setError(result.error);
            setSuccess(null);
            return;
          }

          if ("success" in result && result.success) {
            setSuccess("Specialist updated successfully!");
            return;
          }
        }

        setSuccess("Specialist updated successfully!");
      } catch (err) {
        console.error(err);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  const handleTranslationUpdate = async (locale: string, formData: FormData) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const representativeMattersText = String(formData.get("representativeMatters") || "").trim();
        const teachingWritingText = String(formData.get("teachingWriting") || "").trim();
        const credentialsText = String(formData.get("credentials") || "");
        const valuesText = String(formData.get("values") || "");

        const toJsonArray = (value: string) =>
          JSON.stringify(
            value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          );

        const validateJson = (value: string | null | undefined, field: string) => {
          if (!value || !value.trim()) return;
          try {
            JSON.parse(value);
          } catch {
            throw new Error(`Invalid JSON provided for ${field}.`);
          }
        };

        if (representativeMattersText) {
          formData.set("representativeMatters", toJsonArray(representativeMattersText));
        } else {
          formData.set("representativeMatters", "");
        }

        validateJson(teachingWritingText, "Teaching & Writing");
        formData.set("credentials", toJsonArray(credentialsText));
        formData.set("values", toJsonArray(valuesText));

        const translationId = formData.get("translationId") as string | null;
        if (!translationId) {
          const existing = translations.find((t) => t.locale === locale);
          if (existing?.id) {
            formData.set("translationId", existing.id);
          }
        }

        await updateTranslationAction(formData);
        setSuccess(`${locale.toUpperCase()} translation updated successfully!`);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : `Failed to update ${locale.toUpperCase()} translation. Please ensure JSON fields are valid.`,
        );
      }
    });
  };

  const handleServiceAssignment = async (formData: FormData) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const result = await assignServicesAction(formData);

        if (result && typeof result === "object") {
          if ("error" in result && result.error) {
            setError(result.error);
            setSuccess(null);
            return;
          }

          if ("success" in result && result.success) {
            setSuccess("Services assigned successfully!");
            return;
          }
        }

        setSuccess("Services assigned successfully!");
      } catch (err) {
        console.error(err);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Base Profile
          </TabsTrigger>
          {locales.map((loc) => (
            <TabsTrigger key={loc.code} value={loc.code} className="flex items-center gap-2">
              <span>{loc.flag}</span>
              {loc.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core profile information shared across all languages.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={handleUpdate} className="grid gap-4 md:grid-cols-2">
                  <input type="hidden" name="id" value={specialist.id} />
                  <input type="hidden" name="section" value="basic" />
                  <AutoSlug titleName="name" slugName="slug" />

                  <div>
                    <label className="mb-1 block text-sm font-medium">Name *</label>
                    <input
                      name="name"
                      defaultValue={specialist.name}
                      className="w-full rounded border px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Slug *</label>
                    <input
                      name="slug"
                      defaultValue={specialist.slug}
                      className="w-full rounded border px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Role</label>
                    <input
                      name="role"
                      defaultValue={specialist.role || ""}
                      className="w-full rounded border px-3 py-2"
                      placeholder="e.g., Senior Legal Counsel"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Company</label>
                    {isCompanyAdmin ? (
                      <div className="w-full rounded border px-3 py-2 bg-muted text-muted-foreground">
                        {specialist.company?.name || "Solo Practitioner"}
                        <input type="hidden" name="companyId" value={specialist.companyId || ""} />
                      </div>
                    ) : (
                      <select
                        name="companyId"
                        className="w-full rounded border px-3 py-2"
                        defaultValue={specialist.companyId || ""}
                      >
                        <option value="">Solo Practitioner</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {isCompanyAdmin && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Company assignment can only be changed by super admins.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Contact Email</label>
                    <input
                      name="contactEmail"
                      type="email"
                      defaultValue={specialist.contactEmail || ""}
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Contact Phone</label>
                    <input
                      name="contactPhone"
                      defaultValue={specialist.contactPhone || ""}
                      className="w-full rounded border px-3 py-2"
                    />
                  </div>

                  <div>
                    <ImageUpload name="avatarUrl" value={specialist.avatarUrl || ""} placeholder="Upload specialist avatar..." />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Languages</label>
                    <select
                      name="languages"
                      multiple
                      className="h-24 w-full rounded border px-3 py-2"
                      value={selectedLanguages}
                      onChange={handleLanguageChange}
                    >
                      <option value="English">English</option>
                      <option value="Georgian">Georgian (ქართული)</option>
                      <option value="Russian">Russian (Русский)</option>
                      <option value="German">German (Deutsch)</option>
                      <option value="French">French (Français)</option>
                      <option value="Spanish">Spanish (Español)</option>
                      <option value="Italian">Italian (Italiano)</option>
                      <option value="Turkish">Turkish (Türkçe)</option>
                      <option value="Arabic">Arabic (العربية)</option>
                      <option value="Chinese">Chinese (中文)</option>
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple languages.</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Bio</label>
                    <textarea
                      name="bio"
                      rows={4}
                      defaultValue={specialist.bio || ""}
                      className="w-full rounded border px-3 py-2"
                      placeholder="Professional biography"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Philosophy</label>
                    <textarea
                      name="philosophy"
                      rows={3}
                      defaultValue={specialist.philosophy || ""}
                      className="w-full rounded border px-3 py-2"
                      placeholder="Professional philosophy and approach"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4" />
                      {isPending ? "Updating..." : "Update Specialist"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enhanced Profile Information</CardTitle>
                <CardDescription>Additional information displayed on the public profile.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={handleUpdate} className="grid gap-4 md:grid-cols-2">
                  <input type="hidden" name="id" value={specialist.id} />
                  <input type="hidden" name="section" value="enhanced" />
                  <input type="hidden" name="name" value={specialist.name} />
                  <input type="hidden" name="slug" value={specialist.slug} />

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Representative Matters</label>
                    <textarea
                      name="representativeMatters"
                      rows={6}
                      defaultValue={specialist.representativeMatters ? (() => {
                        try {
                          return JSON.parse(specialist.representativeMatters).join("\n");
                        } catch {
                          return specialist.representativeMatters;
                        }
                      })() : ""}
                      className="w-full rounded border px-3 py-2 text-sm"
                      placeholder="Enter each matter on a new line"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Each line becomes an item in the JSON array.</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Teaching, Writing & Speaking (JSON)</label>
                    <textarea
                      name="teachingWriting"
                      rows={6}
                      defaultValue={specialist.teachingWriting || ""}
                      className="w-full rounded border px-3 py-2 font-mono text-sm"
                      placeholder='{"courses": ["Course"], "workshops": ["Workshop"], "topics": ["Topic"]}'
                    />
                    <p className="mt-1 text-xs text-muted-foreground">JSON object with courses, workshops, and writing topics.</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Credentials & Memberships</label>
                    <textarea
                      name="credentials"
                      rows={4}
                      defaultValue={specialist.credentials ? (() => {
                        try {
                          return JSON.parse(specialist.credentials).join("\n");
                        } catch {
                          return specialist.credentials;
                        }
                      })() : ""}
                      className="w-full rounded border px-3 py-2 text-sm"
                      placeholder="Credential One\nCredential Two"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Enter one credential per line. Saved as a list.</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Values & How We Work</label>
                    <textarea
                      name="values"
                      rows={6}
                      defaultValue={specialist.values ? (() => {
                        try {
                          return JSON.parse(specialist.values).join("\n");
                        } catch {
                          return specialist.values;
                        }
                      })() : ""}
                      className="w-full rounded border px-3 py-2 text-sm"
                      placeholder="Value name: description\nAnother value: description"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Enter each value on a new line. Saved as a list.</p>
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4" />
                      {isPending ? "Updating..." : "Update Enhanced Profile"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Practice Areas & Services</CardTitle>
                <CardDescription>Assign services to map this specialist’s expertise.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={handleServiceAssignment} className="space-y-4">
                  <input type="hidden" name="specialistId" value={specialist.id} />

                  <ServiceSelector
                    services={services}
                    selectedServices={selectedServices}
                    onChange={setSelectedServices}
                    name="serviceIds"
                  />

                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    {isPending ? "Updating..." : "Update Practice Areas"}
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {locales.map((loc) => {
          const translation = getTranslation(loc.code);
          return (
            <TabsContent key={loc.code} value={loc.code}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>{loc.flag}</span>
                    {loc.name} Translation
                  </CardTitle>
                  <CardDescription>
                    Localize this specialist profile for {loc.name} speakers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={(formData) => handleTranslationUpdate(loc.code, formData)} className="grid gap-4">
                    <input type="hidden" name="specialistProfileId" value={specialist.id} />
                    <input type="hidden" name="locale" value={loc.code} />
                    <input type="hidden" name="translationId" value={translation?.id || ""} />
                    <AutoSlug titleName="name" slugName="slug" />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">Name *</label>
                        <input
                          name="name"
                          defaultValue={translation?.name || specialist.name}
                          className="w-full rounded border px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">Slug *</label>
                        <input
                          name="slug"
                          defaultValue={translation?.slug || specialist.slug}
                          className="w-full rounded border px-3 py-2"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Role</label>
                      <input
                        name="role"
                        defaultValue={translation?.role || specialist.role || ""}
                        className="w-full rounded border px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Bio</label>
                      <textarea
                        name="bio"
                        rows={4}
                        defaultValue={translation?.bio || specialist.bio || ""}
                        className="w-full rounded border px-3 py-2"
                        placeholder={`Professional biography in ${loc.name}...`}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Meta Title</label>
                      <input
                        name="metaTitle"
                        defaultValue={translation?.metaTitle || ""}
                        className="w-full rounded border px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Meta Description</label>
                      <textarea
                        name="metaDescription"
                        rows={2}
                        defaultValue={translation?.metaDescription || ""}
                        className="w-full rounded border px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Philosophy</label>
                      <textarea
                        name="philosophy"
                        rows={3}
                        defaultValue={translation?.philosophy || ""}
                        className="w-full rounded border px-3 py-2"
                        placeholder={`Professional philosophy in ${loc.name}...`}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Representative Matters</label>
                      <textarea
                        name="representativeMatters"
                        rows={4}
                        defaultValue={translation?.representativeMatters || ""}
                        className="w-full rounded border px-3 py-2 text-sm"
                        placeholder={`Enter each matter on a new line (${loc.name}).`}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Teaching, Writing & Speaking (JSON)</label>
                      <textarea
                        name="teachingWriting"
                        rows={4}
                        defaultValue={translation?.teachingWriting || specialist.teachingWriting || ""}
                        className="w-full rounded border px-3 py-2 font-mono text-sm"
                        placeholder='{"courses": ["Course"], "workshops": ["Workshop"], "topics": ["Topic"]}'
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Credentials & Memberships</label>
                      <textarea
                        name="credentials"
                        rows={3}
                        defaultValue={translation?.credentials || specialist.credentials || ""}
                        className="w-full rounded border px-3 py-2 text-sm"
                        placeholder={`Enter each credential on a new line (${loc.name}).`}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Values & How We Work</label>
                      <textarea
                        name="values"
                        rows={4}
                        defaultValue={translation?.values || specialist.values || ""}
                        className="w-full rounded border px-3 py-2 text-sm"
                        placeholder={`Enter each value on a new line (${loc.name}).`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4" />
                      {isPending ? "Updating..." : `Update ${loc.name} Translation`}
                    </button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
