"use client";

import { useState, useTransition } from "react";
import { Save, AlertCircle, CheckCircle } from "lucide-react";

interface CompanyCreateFormProps {
  createAction: (formData: FormData) => Promise<{ success?: boolean; error?: string; company?: { id: string; name: string; slug: string } }>;
}

export default function CompanyCreateForm({ createAction }: CompanyCreateFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    
    startTransition(async () => {
      try {
        await createAction(formData);
        // Server action now returns void, so we assume success if no error
        setSuccess('Company created successfully!');
        // Reset form
        const form = document.getElementById('company-form') as HTMLFormElement;
        if (form) form.reset();
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">{success}</span>
        </div>
      )}
      
      <form id="company-form" action={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Company Name *</label>
          <input 
            name="name" 
            className="w-full rounded border px-3 py-2" 
            required 
            placeholder="e.g., Legal Sandbox Georgia"
          />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Slug *</label>
          <input 
            name="slug" 
            className="w-full rounded border px-3 py-2" 
            required 
            placeholder="e.g., legal-sandbox-georgia"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea 
            name="description" 
            rows={3}
            className="w-full rounded border px-3 py-2" 
            placeholder="Brief company description..."
          ></textarea>
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Short Description</label>
          <input 
            name="shortDesc" 
            className="w-full rounded border px-3 py-2" 
            placeholder="One-line description for cards"
          />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Logo URL</label>
          <input 
            name="logoUrl" 
            type="url"
            className="w-full rounded border px-3 py-2" 
            placeholder="https://example.com/logo.png"
          />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Website</label>
          <input 
            name="website" 
            type="url"
            className="w-full rounded border px-3 py-2" 
            placeholder="https://example.com"
          />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <input 
            name="phone" 
            type="tel"
            className="w-full rounded border px-3 py-2" 
            placeholder="+995 551 911 961"
          />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input 
            name="email" 
            type="email"
            className="w-full rounded border px-3 py-2" 
            placeholder="contact@company.com"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Address</label>
          <input 
            name="address" 
            className="w-full rounded border px-3 py-2" 
            placeholder="Georgia, Tbilisi, Agmashnebeli alley N240, 0159"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Map Link</label>
          <input 
            name="mapLink" 
            type="url"
            className="w-full rounded border px-3 py-2" 
            placeholder="https://maps.google.com/..."
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Long Description</label>
          <textarea 
            name="longDesc" 
            rows={6}
            className="w-full rounded border px-3 py-2" 
            placeholder="Detailed company information, history, values, etc..."
          ></textarea>
        </div>
        
        <div className="md:col-span-2">
          <button 
            type="submit" 
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Creating..." : "Create Company"}
          </button>
        </div>
      </form>
    </div>
  );
}
