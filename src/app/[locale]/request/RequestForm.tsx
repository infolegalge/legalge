'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, Building2, User } from "lucide-react";
import type { Company } from "@/lib/specialists";
import type { Locale } from "@/i18n/locales";
import { makeSlug } from "@/lib/utils";

interface RequestFormProps {
  companies: Company[];
  locale: Locale;
}

export default function RequestForm({ companies, locale }: RequestFormProps) {
  const [formData, setFormData] = useState({
    phone: '',
    message: '',
    requestType: 'COMPANY' as 'SPECIALIST' | 'COMPANY',
    companyId: '',
    companyName: '',
    companySlug: ''
  });
  const [slugTouched, setSlugTouched] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Your request has been submitted successfully! We will review it and get back to you soon.');
        setFormData({
          phone: '',
          message: '',
          requestType: 'SPECIALIST',
          companyId: '',
          companyName: '',
          companySlug: ''
        });
        setSlugTouched(false);
      } else {
        setError(data.error || 'Failed to submit request. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      companyName: name,
      companySlug: slugTouched ? prev.companySlug : makeSlug(name, locale)
    }));
  };

  const handleCompanySlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    setFormData(prev => ({ ...prev, companySlug: e.target.value }));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">Request Access</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Apply to become a legal specialist or company on our platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Form</CardTitle>
          <CardDescription>
            Fill out the form below to request specialist or company access. We\u2019ll review your application and get back to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Request Type</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="relative">
                  <input
                    type="radio"
                    name="requestType"
                    value="SPECIALIST"
                    checked={formData.requestType === 'SPECIALIST'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    formData.requestType === 'SPECIALIST' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-input hover:bg-accent'
                  }`}>
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Solo Specialist</div>
                      <div className="text-sm text-muted-foreground">Individual legal practitioner</div>
                    </div>
                  </div>
                </label>
                
                <label className="relative">
                  <input
                    type="radio"
                    name="requestType"
                    value="COMPANY"
                    checked={formData.requestType === 'COMPANY'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    formData.requestType === 'COMPANY' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-input hover:bg-accent'
                  }`}>
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Company</div>
                      <div className="text-sm text-muted-foreground">Legal firm or company</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Company Selection (only for SPECIALIST requests) */}
            {formData.requestType === 'SPECIALIST' && companies.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="companyId">Join Existing Company (Optional)</Label>
                <select
                  id="companyId"
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a company (optional)</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Leave blank if you want to be a solo practitioner
                </p>
              </div>
            )}

            {/* Company Details (only for COMPANY requests) */}
            {formData.requestType === 'COMPANY' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleCompanyNameChange}
                    placeholder="Your legal company name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companySlug">Preferred Company Slug *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="companySlug"
                      name="companySlug"
                      value={formData.companySlug}
                      onChange={handleCompanySlugChange}
                      placeholder="company-name"
                      required
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        companySlug: makeSlug(prev.companyName || prev.companySlug, locale)
                      }))}
                    >
                      Auto
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">This becomes your public URL, e.g. /companies/company-name. Superadmin may adjust later.</p>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+995 XXX XXX XXX"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Tell us about yourself *</Label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder={"Please describe your legal background, experience, and why you\u2019d like to join our platform..."}
                required
                disabled={isSubmitting}
                rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Information */}
      <div className="mt-8 rounded-lg bg-muted/50 p-6">
        <h3 className="font-semibold mb-2">What happens next?</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• We\u2019ll review your application within 2-3 business days</li>
          <li>• If approved, you\u2019ll receive access to your personalized CMS</li>
          <li>• You\u2019ll be able to manage your profile and publish content</li>
          <li>• We\u2019ll contact you via email with the decision</li>
        </ul>
      </div>
    </div>
  );
}
