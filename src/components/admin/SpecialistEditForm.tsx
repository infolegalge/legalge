"use client";

import { useState, useTransition } from "react";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import ImageUpload from "./ImageUpload";
import ServiceSelector from "./ServiceSelector";
import RichEditor from "./RichEditor";

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
  isCompanyAdmin?: boolean;
}

export default function SpecialistEditForm({ 
  specialist, 
  services, 
  companies,
  updateAction,
  assignServicesAction,
  isCompanyAdmin = false
}: SpecialistEditFormProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>(
    JSON.parse(specialist.specializations || "[]")
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    JSON.parse(specialist.languages || "[]")
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedLanguages(values);
  };

  const handleUpdate = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        const result = await updateAction(formData);

        if (result && typeof result === 'object') {
          if ('error' in result && result.error) {
            setError(result.error);
            setSuccess(null);
            return;
          }

          if ('success' in result && result.success) {
            setSuccess('Specialist updated successfully!');
            return;
          }
        }

        setSuccess('Specialist updated successfully!');
      } catch (error) {
        console.error(error);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  const handleServiceAssignment = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        const result = await assignServicesAction(formData);

        if (result && typeof result === 'object') {
          if ('error' in result && result.error) {
            setError(result.error);
            setSuccess(null);
            return;
          }

          if ('success' in result && result.success) {
            setSuccess('Services assigned successfully!');
            return;
          }
        }

        setSuccess("Services assigned successfully!");
      } catch (error) {
        console.error(error);
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {/* Success Message */}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">{success}</span>
          </div>
        )}
        
        <form action={handleUpdate} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={specialist.id} />
          <input type="hidden" name="name" value={specialist.name} />
          <input type="hidden" name="slug" value={specialist.slug} />
          <input type="hidden" name="section" value="basic" />
          
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
            <RichEditor 
              name="bio"
              initialHTML={specialist.bio || ""}
              label="Bio"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Philosophy</label>
            <RichEditor 
              name="philosophy"
              initialHTML={specialist.philosophy || ""}
              label="Philosophy"
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
      </div>

      {/* Enhanced Profile Information */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Enhanced Profile Information</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Additional information that will be displayed on the specialist&apos;s public profile.
        </p>
        
        <form action={handleUpdate} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={specialist.id} />
          <input type="hidden" name="name" value={specialist.name} />
          <input type="hidden" name="slug" value={specialist.slug} />
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
      </div>

      {/* Practice Areas Assignment */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Practice Areas & Services</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Assign services to this specialist. These will appear as their practice areas.
        </p>
        
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
      </div>

      {/* Current Assignments */}
      {specialist.services.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Current Practice Areas</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {specialist.services.map((service) => (
              <div key={service.id} className="rounded border p-3">
                <div className="font-medium">{service.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
