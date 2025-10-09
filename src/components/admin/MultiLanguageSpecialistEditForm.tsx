"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Save, AlertCircle, CheckCircle, Globe } from "lucide-react";
import ImageUpload from "./ImageUpload";
import ServiceSelector from "./ServiceSelector";
import AutoSlug from "./AutoSlug";
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
}

interface SpecialistTranslation {
  id: string;
  specialistProfileId: string;
  locale: 'ka' | 'en' | 'ru';
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

interface MultiLanguageSpecialistEditFormProps {
  specialist: Specialist;
  services: Service[];
  companies: Company[];
  translations: SpecialistTranslation[];
  updateAction: (formData: FormData) => Promise<{ success?: boolean; error?: string; specialist?: { id: string; name: string; slug: string } }>;
  updateTranslationAction: (formData: FormData) => Promise<{ success?: boolean; error?: string }>;
  assignServicesAction: (formData: FormData) => Promise<{ success?: boolean; error?: string }>;
  isCompanyAdmin?: boolean;
}

const locales = [
  { code: 'ka', name: 'ქართული', flag: '🇬🇪' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
];

const formatTeachingWritingForTextarea = (value: string | null | undefined) => {
  if (!value) return "";

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.join("\n");
    }

    if (parsed && Array.isArray(parsed.entries)) {
      return parsed.entries.join("\n");
    }
  } catch (error) {
    // ignore parsing error and fall back to original value
  }

  return value;
};

const normalizeTeachingWriting = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    const entries = trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (entries.length === 0) {
      return "";
    }

    return JSON.stringify({ entries });
  }
};

export default function MultiLanguageSpecialistEditForm({ 
  specialist, 
  services, 
  companies,
  translations,
  updateAction,
  updateTranslationAction,
  assignServicesAction,
  isCompanyAdmin = false
}: MultiLanguageSpecialistEditFormProps) {
  
  const [selectedServices, setSelectedServices] = useState<string[]>(
    specialist.services.map(s => s.id)
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    JSON.parse(specialist.languages || "[]")
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const enhancedFormRef = useRef<HTMLFormElement | null>(null);
  const normalizedTranslations = useMemo(
    () =>
      translations.map((translation) => ({
        ...translation,
        focusAreas: translation.focusAreas
          ? (() => {
              try {
                return JSON.parse(translation.focusAreas).join("\n");
              } catch {
                return translation.focusAreas ?? "";
              }
            })()
          : "",
        representativeMatters: translation.representativeMatters
          ? (() => {
              try {
                return JSON.parse(translation.representativeMatters).join("\n");
              } catch {
                return translation.representativeMatters ?? "";
              }
            })()
          : "",
        teachingWriting: formatTeachingWritingForTextarea(translation.teachingWriting),
        credentials: translation.credentials || "",
        values: translation.values || "",
        philosophy: translation.philosophy || "",
      })),
    [translations],
  );

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedLanguages(values);
  };

  const handleUpdate = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    if (isPending) {
      return;
    }
    
    startTransition(async () => {
      try {
        const result = await updateAction(formData);
        
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess('Specialist updated successfully!');
          if (formData.get("section") === "enhanced") {
            enhancedFormRef.current?.reset();
          }
        }
      } catch (error) {
        console.error(error);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  const handleTranslationUpdate = async (locale: string, formData: FormData) => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        const focusAreasText = String(formData.get("focusAreas") || "").trim();
        const representativeMattersText = String(formData.get("representativeMatters") || "").trim();
        const teachingWritingText = String(formData.get("teachingWriting") || "");
        const credentialsText = String(formData.get("credentials") || "").trim();
        const valuesText = String(formData.get("values") || "").trim();

        if (focusAreasText) {
          formData.set(
            "focusAreas",
            JSON.stringify(
              focusAreasText
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            ),
          );
        } else {
          formData.set("focusAreas", "");
        }

        if (representativeMattersText) {
          formData.set(
            "representativeMatters",
            JSON.stringify(
              representativeMattersText
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            ),
          );
        } else {
          formData.set("representativeMatters", "");
        }

        const normalizedTeachingWriting = normalizeTeachingWriting(teachingWritingText);
        formData.set("teachingWriting", normalizedTeachingWriting);

        if (credentialsText) {
          try {
            JSON.parse(credentialsText);
            formData.set("credentials", credentialsText);
          } catch {
            throw new Error("Invalid JSON in Credentials field");
          }
        }

        if (valuesText) {
          try {
            JSON.parse(valuesText);
            formData.set("values", valuesText);
          } catch {
            throw new Error("Invalid JSON in Values field");
          }
        }

        const translationId = formData.get("translationId") as string | null;

        if (!translationId) {
          const existing = translations.find((t) => t.locale === locale);
          if (existing?.id) {
            formData.set("translationId", existing.id);
          }
        }

        const result = await updateTranslationAction(formData);
        if (result?.error) {
          setError(result.error);
        } else {
          setSuccess(`${locale.toUpperCase()} translation updated successfully!`);
        }
      } catch (error) {
        console.error(error);
        setError(`Failed to update ${locale.toUpperCase()} translation. Please try again.`);
      }
    });
  };

  const handleServiceAssignment = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        const result = await assignServicesAction(formData);
        
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess("Services assigned successfully!");
        }
      } catch (error) {
        console.error(error);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  const getTranslation = (locale: string) => {
    return normalizedTranslations.find((t) => t.locale === locale) || null;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800">{success}</span>
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
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Core profile information shared across all languages
                </CardDescription>
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
                      <div className="w-full rounded border px-3 py-2 bg-gray-50 text-gray-600">
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
                          <option 
                            key={company.id} 
                            value={company.id}
                          >
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
                    <ImageUpload 
                      name="avatarUrl" 
                      value={specialist.avatarUrl || ""}
                      placeholder="Upload specialist avatar..."
                    />
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
                    <p className="mt-1 text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple languages</p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Bio</label>
                    <textarea 
                      name="bio" 
                      rows={4} 
                      defaultValue={specialist.bio || ""}
                      className="w-full rounded border px-3 py-2" 
                      placeholder="Brief professional biography..."
                    ></textarea>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Philosophy</label>
                    <textarea 
                      name="philosophy" 
                      rows={3} 
                      defaultValue={specialist.philosophy || ""}
                      className="w-full rounded border px-3 py-2" 
                      placeholder="Professional philosophy and approach..."
                    ></textarea>
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

            {/* Enhanced Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Profile Information</CardTitle>
                <CardDescription>
                  Additional information that will be displayed on the specialist&apos;s public profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={handleUpdate} className="grid gap-4 md:grid-cols-2" ref={enhancedFormRef}>
                  <input type="hidden" name="id" value={specialist.id} />
                  <input type="hidden" name="section" value="enhanced" />
                  <input type="hidden" name="name" value={specialist.name} />
                  <input type="hidden" name="slug" value={specialist.slug} />
                  
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Focus Areas</label>
                    <textarea 
                      name="focusAreas" 
                      rows={6} 
                      defaultValue={specialist.focusAreas ? (() => {
                        try {
                          return JSON.parse(specialist.focusAreas).join('\n');
                        } catch {
                          return specialist.focusAreas;
                        }
                      })() : ""}
                      className="w-full rounded border px-3 py-2 text-sm" 
                      placeholder="Startup & Corporate&#10;Employment & Incentives&#10;Privacy & Data Protection&#10;Disputes, ADR & Litigation Strategy"
                    ></textarea>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter each focus area on a new line. They will be automatically formatted as a JSON array.
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Representative Matters</label>
                    <textarea 
                      name="representativeMatters" 
                      rows={6} 
                      defaultValue={specialist.representativeMatters ? (() => {
                        try {
                          return JSON.parse(specialist.representativeMatters).join('\n');
                        } catch {
                          return specialist.representativeMatters;
                        }
                      })() : ""}
                      className="w-full rounded border px-3 py-2 text-sm" 
                      placeholder="Prepared founder and contractor IP assignments to secure a clean cap table before a seed round.&#10;Converted long‑term contractors to employees with compliant agreements and proper classification."
                    ></textarea>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter each representative matter on a new line. They will be automatically formatted as a JSON array.
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Teaching, Writing & Speaking (JSON)</label>
                    <textarea 
                      name="teachingWriting" 
                      rows={6} 
                      defaultValue={formatTeachingWritingForTextarea(specialist.teachingWriting)}
                      className="w-full rounded border px-3 py-2 font-mono text-sm" 
                      placeholder='{"courses": ["Cryptocurrency & Blockchain Law", "Practical Private Law"], "workshops": ["Founder legal fundamentals", "Hiring & compliance"], "topics": ["SAFEs in Georgia", "Contractor classification"]}'
                    ></textarea>
                    <p className="mt-1 text-xs text-muted-foreground">
                      JSON object with courses, workshops, and writing topics.
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Credentials & Memberships (JSON)</label>
                    <textarea 
                      name="credentials" 
                      rows={4} 
                      defaultValue={specialist.credentials || ""}
                      className="w-full rounded border px-3 py-2 font-mono text-sm" 
                      placeholder='["Georgian Bar Association (Attorney‑at‑Law)", "Arbitrator, Tbilisi International Tribunal", "Lecturer, Sulkhan‑Saba University"]'
                    ></textarea>
                    <p className="mt-1 text-xs text-muted-foreground">
                      JSON array of professional credentials and memberships.
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Values & How We Work (JSON)</label>
                    <textarea 
                      name="values" 
                      rows={6} 
                      defaultValue={specialist.values || ""}
                      className="w-full rounded border px-3 py-2 font-mono text-sm" 
                      placeholder='{"Clarity first": "Scope, timelines, and pricing are agreed before work starts.", "Speed with rigor": "Fast drafts (typically 3–5 business days) without cutting corners."}'
                    ></textarea>
                    <p className="mt-1 text-xs text-muted-foreground">
                      JSON object with value names as keys and descriptions as values.
                    </p>
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

            {/* Practice Areas Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Practice Areas & Services</CardTitle>
                <CardDescription>
                  Assign services to this specialist. These will appear as their practice areas.
                </CardDescription>
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

            {/* Current Assignments */}
            {specialist.services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Practice Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2">
                    {specialist.services.map((service) => (
                      <div key={service.id} className="rounded border p-3">
                        <div className="font-medium">{service.title}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
                    Localized content for {loc.name} speakers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form 
                    action={(formData) => handleTranslationUpdate(loc.code, formData)}
                    className="grid gap-4"
                  >
                    <input type="hidden" name="id" value={specialist.id} />
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
                      <label className="mb-1 block text-sm font-medium">Professional Role</label>
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
                      <label className="mb-1 block text-sm font-medium">Meta Title (SEO)</label>
                      <input 
                        name="metaTitle" 
                        defaultValue={translation?.metaTitle || ""}
                        className="w-full rounded border px-3 py-2" 
                      />
                    </div>
                    
                    <div>
                      <label className="mb-1 block text-sm font-medium">Meta Description (SEO)</label>
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
                      <label className="mb-1 block text-sm font-medium">Focus Areas</label>
                      <textarea
                        name="focusAreas"
                        rows={4}
                        defaultValue={translation?.focusAreas || ""}
                        className="w-full rounded border px-3 py-2 text-sm"
                        placeholder={`Enter each focus area on a new line (${loc.name}).`}
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
                        defaultValue={translation?.teachingWriting || ""}
                        className="w-full rounded border px-3 py-2 font-mono text-sm"
                        placeholder='{"courses": ["Course"], "workshops": ["Workshop"], "topics": ["Topic"]}'
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Credentials & Memberships (JSON)</label>
                      <textarea
                        name="credentials"
                        rows={3}
                        defaultValue={translation?.credentials || ""}
                        className="w-full rounded border px-3 py-2 font-mono text-sm"
                        placeholder='["Credential 1", "Credential 2"]'
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Values & How We Work (JSON)</label>
                      <textarea
                        name="values"
                        rows={4}
                        defaultValue={translation?.values || ""}
                        className="w-full rounded border px-3 py-2 font-mono text-sm"
                        placeholder='{"Value": "Description"}'
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
