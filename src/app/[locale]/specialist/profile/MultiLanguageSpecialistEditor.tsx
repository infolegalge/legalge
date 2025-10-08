'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Save, Globe } from "lucide-react";
import { OFFICIAL_PHONE } from "@/config/contact";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AutoSlug from "@/components/admin/AutoSlug";
import ImageUpload from "@/components/admin/ImageUpload";
import ServiceSelector from "@/components/admin/ServiceSelector";

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

interface AllServices {
  id: string;
  title: string;
  practiceArea: {
    title: string;
  };
}

interface AllCompanies {
  id: string;
  name: string;
}

const locales = [
  { code: 'ka', name: 'ქართული', flag: '🇬🇪' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
];

export default function MultiLanguageSpecialistEditor() {
  const { data: session } = useSession();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [translations, setTranslations] = useState<SpecialistTranslation[]>([]);
  const [allServices, setAllServices] = useState<AllServices[]>([]);
  const [allCompanies, setAllCompanies] = useState<AllCompanies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is logged in
        if (!session || !session.user) {
          setError('Please log in to access your profile');
          setLoading(false);
          return;
        }

        // Load specialist profile
        const profileResponse = await fetch('/api/specialist/profile', {
          credentials: 'include'
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setSpecialist(profileData);
          
          // Initialize selected services and languages
        setSelectedServices(profileData.services.map((s: { id: string }) => s.id));
          setSelectedLanguages(JSON.parse(profileData.languages || "[]"));
        } else {
          const errorData = await profileResponse.json();
          setError(`Failed to load profile: ${errorData.error || 'Unknown error'}`);
        }

        // Load translations
        const translationsResponse = await fetch(`/api/specialist/translations`, {
          credentials: 'include'
        });

        if (translationsResponse.ok) {
          const translationsData = await translationsResponse.json();
          setTranslations(translationsData.translations || []);
        }

        // Load all services
        const servicesResponse = await fetch('/api/admin/services', {
          credentials: 'include'
        });

        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setAllServices(servicesData.services || []);
        }

        // Load all companies
        const companiesResponse = await fetch('/api/admin/companies', {
          credentials: 'include'
        });

        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json();
          setAllCompanies(companiesData.companies || []);
        }

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session]);

  const updateProfile = async (formData: FormData) => {
    try {
      const section = String(formData.get('section') || 'profile');
      setSaving(section === 'services' ? 'services' : section === 'enhanced' ? 'enhanced' : 'profile');
      const response = await fetch('/api/specialist/profile/update', {
        method: 'PATCH',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSpecialist(data.specialist);
        if (section === 'basic') {
          setSelectedLanguages(JSON.parse(data.specialist.languages || "[]"));
          setSelectedServices(data.specialist.services.map((s: { id: string }) => s.id));
        }
        setError(null);
        setSuccess(section === 'enhanced' ? 'Enhanced profile updated successfully!' : 'Profile updated successfully!');
      } else {
        const errorData = await response.json();
        setSuccess(null);
        setError(`Failed to update profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSuccess(null);
      setError('Failed to update profile');
    } finally {
      setSaving(null);
    }
  };

  const updateTranslation = async (locale: string, formData: FormData) => {
    try {
      setSaving(`translation-${locale}`);
      const rawEntries = Object.fromEntries(formData.entries()) as Record<string, string>;

      const listToJson = (value?: string | null) => {
        if (!value) return null;
        const items = value
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        if (!items.length) return null;
        return JSON.stringify(items);
      };

      const payload = {
        specialistProfileId: rawEntries.specialistProfileId,
        locale,
        name: rawEntries.name?.trim() || '',
        slug: rawEntries.slug?.trim() || '',
        role: rawEntries.role?.trim() || '',
        bio: rawEntries.bio?.trim() || '',
        metaTitle: rawEntries.metaTitle?.trim() || '',
        metaDescription: rawEntries.metaDescription?.trim() || '',
        philosophy: rawEntries.philosophy?.trim() || '',
        focusAreas: listToJson(rawEntries.focusAreas),
        representativeMatters: listToJson(rawEntries.representativeMatters),
        teachingWriting: rawEntries.teachingWriting?.trim() || '',
        credentials: rawEntries.credentials?.trim() || '',
                      values: rawEntries.values?.trim() || '',
      };

      const response = await fetch('/api/specialist/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTranslations((prev) => {
          const existingIndex = prev.findIndex((t) => t.locale === locale);
          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = data.translation;
            return next;
          }
          return [...prev, data.translation];
        });
      } else {
        const errorData = await response.json();
        setError(`Failed to update ${locale} translation: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error updating ${locale} translation:`, error);
      setError(`Failed to update ${locale} translation`);
    } finally {
      setSaving(null);
    }
  };

  const handleServiceAssignment = async (formData: FormData) => {
    try {
      setSaving('services');
      const response = await fetch('/api/specialist/services', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.specialist) {
          setSpecialist((prev) => prev ? { ...prev, services: data.specialist.services } : prev);
          setSelectedServices(data.specialist.services.map((s: any) => s.id));
        }
      } else {
        const errorData = await response.json();
        setError(`Failed to assign services: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error assigning services:', error);
      setError('Failed to assign services');
    } finally {
      setSaving(null);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedLanguages(values);
  };

  const getTranslation = (locale: string) => {
    return translations.find(t => t.locale === locale) || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!specialist) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Profile not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Globe className="h-6 w-6" />
          Multi-Language Profile Editor
        </h1>
        <p className="text-muted-foreground">
          Edit your professional profile in Georgian, English, and Russian
        </p>
      </div>

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
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
                <form action={updateProfile} className="grid gap-4 md:grid-cols-2">
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
                    <select 
                      name="companyId" 
                      className="w-full rounded border px-3 py-2"
                      defaultValue={specialist.companyId || ""}
                    >
                      <option value="">Solo Practitioner</option>
                      {allCompanies.map((company) => (
                        <option 
                          key={company.id} 
                          value={company.id}
                        >
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium">Contact Email</label>
                    <input 
                      value={specialist.contactEmail || (session?.user as any)?.email || ""}
                      disabled
                      className="w-full rounded border px-3 py-2 bg-muted text-muted-foreground"
                    />
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium">Contact Phone</label>
                    <input 
                      value={OFFICIAL_PHONE}
                      disabled
                      className="w-full rounded border px-3 py-2 bg-muted text-muted-foreground"
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
                    <Button 
                      type="submit" 
                      disabled={saving === 'profile'}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving === 'profile' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving === 'profile' ? "Updating..." : "Update Specialist"}
                    </Button>
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
                <form action={updateProfile} className="grid gap-4 md:grid-cols-2">
                  <input type="hidden" name="id" value={specialist.id} />
                  <input type="hidden" name="section" value="enhanced" />
                  
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
                      defaultValue={specialist.teachingWriting || ""}
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
                    <Button 
                      type="submit" 
                      disabled={saving === 'profile'}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving === 'profile' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving === 'profile' ? "Updating..." : "Update Enhanced Profile"}
                    </Button>
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
                    services={allServices}
                    selectedServices={selectedServices}
                    onChange={setSelectedServices}
                    name="serviceIds"
                  />
                  
                  <Button 
                    type="submit" 
                    disabled={saving === 'services'}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving === 'services' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving === 'services' ? "Updating..." : "Update Practice Areas"}
                  </Button>
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
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      updateTranslation(loc.code, formData);
                    }}
                    className="grid gap-4"
                  >
                    <input type="hidden" name="specialistProfileId" value={specialist.id} />
                    <input type="hidden" name="locale" value={loc.code} />
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
                        defaultValue={translation?.philosophy || specialist.philosophy || ""}
                        className="w-full rounded border px-3 py-2" 
                        placeholder={`Professional philosophy in ${loc.name}...`}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Focus Areas</label>
                      <textarea 
                        name="focusAreas" 
                        rows={5} 
                        defaultValue={(() => {
                          const source = translation?.focusAreas || specialist.focusAreas || "";
                          if (!source) return "";
                          try {
                            const parsed = JSON.parse(source);
                            return Array.isArray(parsed) ? parsed.join('\n') : source;
                          } catch {
                            return source;
                          }
                        })()}
                        className="w-full rounded border px-3 py-2 text-sm" 
                        placeholder={`One focus area per line in ${loc.name}`}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Enter each focus area on a separate line. They will be saved as a structured list.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Representative Matters</label>
                      <textarea 
                        name="representativeMatters" 
                        rows={5} 
                        defaultValue={(() => {
                          const source = translation?.representativeMatters || specialist.representativeMatters || "";
                          if (!source) return "";
                          try {
                            const parsed = JSON.parse(source);
                            return Array.isArray(parsed) ? parsed.join('\n') : source;
                          } catch {
                            return source;
                          }
                        })()}
                        className="w-full rounded border px-3 py-2 text-sm" 
                        placeholder={`One representative matter per line in ${loc.name}`}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Enter each matter on its own line. They will be saved as a structured list.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Teaching, Writing & Speaking (JSON)</label>
                      <textarea 
                        name="teachingWriting" 
                        rows={6} 
                        defaultValue={translation?.teachingWriting || specialist.teachingWriting || ""}
                        className="w-full rounded border px-3 py-2 font-mono text-sm" 
                        placeholder='{"courses": ["Course 1"], "topics": ["Topic"]}'
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Credentials & Memberships (JSON)</label>
                      <textarea 
                        name="credentials" 
                        rows={4} 
                        defaultValue={translation?.credentials || specialist.credentials || ""}
                        className="w-full rounded border px-3 py-2 font-mono text-sm" 
                        placeholder='["Membership 1", "Membership 2"]'
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Values & How We Work (JSON)</label>
                      <textarea 
                        name="values" 
                        rows={5} 
                        defaultValue={translation?.values || specialist.values || ""}
                        className="w-full rounded border px-3 py-2 font-mono text-sm" 
                        placeholder='{"Value": "Description"}'
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={saving === `translation-${loc.code}`}
                      className="flex items-center gap-2"
                    >
                      {saving === `translation-${loc.code}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Update {loc.name} Translation
                    </Button>
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
