"use client";

import { useState, useTransition } from "react";
import { Plus, AlertCircle, CheckCircle } from "lucide-react";
import ImageUpload from "./ImageUpload";
import ServiceSelector from "./ServiceSelector";

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

interface SpecialistCreateFormProps {
  services: Service[];
  companies: Company[];
  createAction: (formData: FormData) => Promise<{ success?: boolean; error?: string; specialist?: { id: string; name: string; slug: string } }>;
}

export default function SpecialistCreateForm({ services, companies, createAction }: SpecialistCreateFormProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedLanguages(values);
  };

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        await createAction(formData);
        // Server action now returns void, so we assume success if no error
        setSuccess('Specialist created successfully!');
        // Reset form
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) form.reset();
        setSelectedServices([]);
        setSelectedLanguages([]);
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Create New Specialist</h3>
      
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
      
      <form action={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Name *</label>
          <input name="name" className="w-full rounded border px-3 py-2" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Slug *</label>
          <input name="slug" className="w-full rounded border px-3 py-2" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Role</label>
          <input name="role" className="w-full rounded border px-3 py-2" placeholder="e.g., Senior Legal Counsel" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Company</label>
          <select name="companyId" className="w-full rounded border px-3 py-2">
            <option value="">Solo Practitioner</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Contact Email</label>
          <input name="contactEmail" type="email" className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Contact Phone</label>
          <input name="contactPhone" className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <ImageUpload 
            name="avatarUrl" 
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
          <ServiceSelector
            services={services}
            selectedServices={selectedServices}
            onChange={setSelectedServices}
            name="specializations"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Bio</label>
          <textarea name="bio" rows={3} className="w-full rounded border px-3 py-2" placeholder="Brief professional biography..."></textarea>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Philosophy</label>
          <textarea name="philosophy" rows={3} className="w-full rounded border px-3 py-2" placeholder="Professional philosophy and approach..."></textarea>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Focus Areas</label>
          <textarea name="focusAreas" rows={4} className="w-full rounded border px-3 py-2 text-sm" placeholder="Startup & Corporate&#10;Employment & Incentives&#10;Privacy & Data Protection&#10;Disputes, ADR & Litigation Strategy"></textarea>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter each focus area on a new line. They will be automatically formatted as a JSON array.
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Representative Matters</label>
          <textarea name="representativeMatters" rows={4} className="w-full rounded border px-3 py-2 text-sm" placeholder="Prepared founder and contractor IP assignments to secure a clean cap table before a seed round.&#10;Converted long‑term contractors to employees with compliant agreements."></textarea>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter each representative matter on a new line. They will be automatically formatted as a JSON array.
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Teaching, Writing & Speaking (JSON)</label>
          <textarea name="teachingWriting" rows={4} className="w-full rounded border px-3 py-2 font-mono text-sm" placeholder='{"courses": ["Cryptocurrency & Blockchain Law"], "workshops": ["Founder legal fundamentals"], "topics": ["SAFEs in Georgia"]}'></textarea>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Credentials & Memberships (JSON)</label>
          <textarea name="credentials" rows={3} className="w-full rounded border px-3 py-2 font-mono text-sm" placeholder='["Georgian Bar Association (Attorney‑at‑Law)", "Arbitrator, Tbilisi International Tribunal"]'></textarea>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Values & How We Work (JSON)</label>
          <textarea name="values" rows={4} className="w-full rounded border px-3 py-2 font-mono text-sm" placeholder='{"Clarity first": "Scope, timelines, and pricing are agreed before work starts.", "Speed with rigor": "Fast drafts without cutting corners."}'></textarea>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Meta Title (SEO)</label>
          <input name="metaTitle" className="w-full rounded border px-3 py-2" placeholder="SEO title for search engines" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Meta Description (SEO)</label>
          <textarea name="metaDescription" rows={2} className="w-full rounded border px-3 py-2" placeholder="SEO description for search engines"></textarea>
        </div>
        <div className="md:col-span-2">
          <button 
            type="submit" 
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            {isPending ? "Creating..." : "Create Specialist"}
          </button>
        </div>
      </form>
    </div>
  );
}
