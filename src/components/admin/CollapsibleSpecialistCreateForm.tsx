"use client";

import { useState, useTransition } from "react";
import { Plus, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import ImageUpload from "./ImageUpload";
import ServiceSelector from "./ServiceSelector";
import AutoSlug from "./AutoSlug";
import { Button } from "@/components/ui/button";
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

interface CollapsibleSpecialistCreateFormProps {
  services: Service[];
  companies: Company[];
  createAction: (formData: FormData) => Promise<{ success?: boolean; error?: string; specialist?: { id: string; name: string; slug: string } }>;
}

export default function CollapsibleSpecialistCreateForm({ services, companies, createAction }: CollapsibleSpecialistCreateFormProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedLanguages(values);
  };

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        const result = await createAction(formData);
        
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess('Specialist created successfully!');
          // Reset form
          const form = document.querySelector('form') as HTMLFormElement;
          if (form) form.reset();
          setSelectedServices([]);
          setSelectedLanguages([]);
          // Collapse the form after successful creation
          setIsExpanded(false);
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Specialist
            </CardTitle>
            <CardDescription>
              Add a new legal specialist to the platform
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide Form
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show Form
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">{success}</span>
            </div>
          )}

          <form action={handleSubmit} className="space-y-6">
            <AutoSlug titleName="name" slugName="slug" />
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <input 
                  name="name" 
                  className="w-full rounded border px-3 py-2" 
                  required 
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">Slug *</label>
                <input 
                  name="slug" 
                  className="w-full rounded border px-3 py-2" 
                  required 
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">Role</label>
                <input 
                  name="role" 
                  className="w-full rounded border px-3 py-2" 
                  placeholder="e.g., Senior Legal Counsel" 
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">Company</label>
                <select 
                  name="companyId" 
                  className="w-full rounded border px-3 py-2"
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
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">Contact Email</label>
                <input 
                  name="contactEmail" 
                  type="email" 
                  className="w-full rounded border px-3 py-2" 
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">Contact Phone</label>
                <input 
                  name="contactPhone" 
                  className="w-full rounded border px-3 py-2" 
                />
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
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium">Bio</label>
              <textarea 
                name="bio" 
                rows={3} 
                className="w-full rounded border px-3 py-2" 
                placeholder="Brief professional biography..."
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium">Philosophy</label>
              <textarea 
                name="philosophy" 
                rows={3} 
                className="w-full rounded border px-3 py-2" 
                placeholder="Professional philosophy and approach..."
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium">Focus Areas</label>
              <textarea 
                name="focusAreas" 
                rows={4} 
                className="w-full rounded border px-3 py-2 text-sm" 
                placeholder="Startup & Corporate&#10;Employment & Incentives&#10;Privacy & Data Protection&#10;Disputes, ADR & Litigation Strategy"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter each focus area on a new line. They will be automatically formatted as a JSON array.
              </p>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium">Representative Matters</label>
              <textarea 
                name="representativeMatters" 
                rows={4} 
                className="w-full rounded border px-3 py-2 text-sm" 
                placeholder="Prepared founder and contractor IP assignments to secure a clean cap table before a seed round.&#10;Converted long‑term contractors to employees with compliant agreements and proper classification."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter each representative matter on a new line. They will be automatically formatted as a JSON array.
              </p>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium">Teaching, Writing & Speaking (JSON)</label>
              <textarea 
                name="teachingWriting" 
                rows={4} 
                className="w-full rounded border px-3 py-2 font-mono text-sm" 
                placeholder='{"courses": ["Cryptocurrency & Blockchain Law", "Practical Private Law"], "workshops": ["Founder legal fundamentals", "Hiring & compliance"], "topics": ["SAFEs in Georgia", "Contractor classification"]}'
              />
              <p className="mt-1 text-xs text-muted-foreground">
                JSON object with courses, workshops, and writing topics.
              </p>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium">Credentials & Memberships (JSON)</label>
              <textarea 
                name="credentials" 
                rows={3} 
                className="w-full rounded border px-3 py-2 font-mono text-sm" 
                placeholder='["Georgian Bar Association (Attorney‑at‑Law)", "Arbitrator, Tbilisi International Tribunal", "Lecturer, Sulkhan‑Saba University"]'
              />
              <p className="mt-1 text-xs text-muted-foreground">
                JSON array of professional credentials and memberships.
              </p>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium">Values & How We Work (JSON)</label>
              <textarea 
                name="values" 
                rows={4} 
                className="w-full rounded border px-3 py-2 font-mono text-sm" 
                placeholder='{"Clarity first": "Scope, timelines, and pricing are agreed before work starts.", "Speed with rigor": "Fast drafts (typically 3–5 business days) without cutting corners."}'
              />
              <p className="mt-1 text-xs text-muted-foreground">
                JSON object with value names as keys and descriptions as values.
              </p>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium">Practice Areas</label>
              <ServiceSelector
                services={services}
                selectedServices={selectedServices}
                onChange={setSelectedServices}
                name="specializations"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isPending}
                className="inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {isPending ? "Creating..." : "Create Specialist"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsExpanded(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
