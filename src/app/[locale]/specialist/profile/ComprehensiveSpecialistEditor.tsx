'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Upload, User, Building2, MapPin, Mail, Phone, CheckCircle, Clock, Send } from "lucide-react";
import RichEditor from "@/components/admin/RichEditor";
import type { Locale } from "@/i18n/locales";

interface SpecialistProfile {
  id: string;
  name: string;
  slug: string;
  role?: string;
  bio?: string;
  avatarUrl?: string;
  languages: string;
  specializations: string;
  contactEmail?: string;
  contactPhone?: string;
  city?: string;
  companyId?: string;
  philosophy?: string;
  focusAreas?: string;
  representativeMatters?: string;
  teachingWriting?: string;
  credentials?: string;
  values?: string;
  company?: {
    id: string;
    name: string;
  };
  services: Array<{
    id: string;
    title: string;
    slug: string;
    practiceArea: {
      title: string;
    };
  }>;
}

interface AllServices {
  id: string;
  title: string;
  slug: string;
  practiceArea: {
    title: string;
  };
}

interface ComprehensiveSpecialistEditorProps {
  locale: Locale;
}

export default function ComprehensiveSpecialistEditor({ locale }: ComprehensiveSpecialistEditorProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [allServices, setAllServices] = useState<AllServices[]>([]);
  const [pendingChanges, setPendingChanges] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    role: '',
    bio: '',
    avatarUrl: '',
    city: '',
    philosophy: '',
    focusAreas: '',
    representativeMatters: '',
    teachingWriting: '',
    credentials: '',
    values: '',
    languages: '[]',
    specializations: '[]',
    services: [] as string[]
  });

  const accountEmail = (session?.user as any)?.email || '';

  // Load profile and services data
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        
        // Load specialist profile
        console.log('🔍 Fetching specialist profile...');
        const profileResponse = await fetch('/api/specialist/profile', {
          credentials: 'include'
        });
        console.log('📡 Profile response status:', profileResponse.status);
        console.log('📡 Profile response headers:', Object.fromEntries(profileResponse.headers.entries()));
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile(profileData);
          setFormData({
            name: profileData.name || '',
            slug: profileData.slug || '',
            role: profileData.role || '',
            bio: profileData.bio || '',
            avatarUrl: profileData.avatarUrl || '',
            city: profileData.city || '',
            philosophy: profileData.philosophy || '',
            focusAreas: profileData.focusAreas || '',
            representativeMatters: profileData.representativeMatters || '',
            teachingWriting: profileData.teachingWriting || '',
            credentials: profileData.credentials || '',
            values: profileData.values || '',
            languages: profileData.languages || '[]',
            specializations: profileData.specializations || '[]',
            services: profileData.services?.map((s: any) => s.id) || []
          });
        } else {
          console.log('❌ Profile API failed with status:', profileResponse.status);
          let errorData;
          try {
            errorData = await profileResponse.json();
            console.log('📋 Error response data:', errorData);
          } catch (parseError) {
            console.error('❌ Failed to parse error response:', parseError);
            errorData = { error: 'Failed to parse error response' };
          }
          console.error('Profile API error:', errorData);
          setMessage({ type: 'error', text: `Failed to load profile: ${errorData.error || 'Unknown error'}` });
        }

        // Load all available services
        const servicesResponse = await fetch('/api/admin/services', {
          credentials: 'include'
        });
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setAllServices(servicesData.services || []);
        } else {
          const errorData = await servicesResponse.json();
          console.error('Services API error:', errorData);
          setMessage({ type: 'error', text: `Failed to load services: ${errorData.error || 'Unknown error'}` });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setPendingChanges(true);
  };

  const handleServicesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      services: selectedOptions
    }));
    setPendingChanges(true);
  };

  const handleSubmitForApproval = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Create a profile change request
      const response = await fetch('/api/specialist/profile-change-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          changes: formData,
          message: 'Requesting approval for profile changes'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Profile changes submitted for approval. ${data.message}` 
        });
        setPendingChanges(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit changes for approval' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit changes for approval' });
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile data...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground">Unable to load your specialist profile. Please contact support.</p>
        </div>
      </div>
    );
  }

  const isSoloSpecialist = !profile.companyId;
  const approverText = isSoloSpecialist 
    ? 'Super Admin' 
    : `Company Admin (${profile.company?.name})`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Comprehensive Profile Editor</h1>
          <p className="text-muted-foreground">
            Edit your complete professional profile. Changes require approval from {approverText}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              <Clock className="h-3 w-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
          <Button onClick={handleSubmitForApproval} disabled={loading || !pendingChanges}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </>
            )}
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Approval Workflow Info */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Approval Workflow:</strong> Your profile changes will be sent to {approverText} for review and approval. 
          Once approved, the changes will be published to your public profile.
        </AlertDescription>
      </Alert>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Your fundamental profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Profile URL Slug *</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="your-profile-slug"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Professional Role</Label>
            <Input
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              placeholder="e.g., Senior Legal Counsel, Partner"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Professional Bio</Label>
            <RichEditor 
              name="bio" 
              initialHTML={formData.bio} 
              label="Bio"
              onChange={(html) => {
                setFormData(prev => ({ ...prev, bio: html }));
                setPendingChanges(true);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/your-photo.jpg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Contact details are coordinated centrally by Legal Sandbox Georgia. The public site displays a single contact channel:<br />
            <strong>Email:</strong> {accountEmail || '—'}<br />
            <strong>Phone:</strong> +995 598 295 429 (Central Number)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lockedEmail">Profile Email</Label>
            <Input
              id="lockedEmail"
              value={accountEmail || 'Not available'}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="e.g., Tbilisi, Batumi"
            />
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Professional Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Professional Information</CardTitle>
          <CardDescription>Detailed professional background and expertise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="philosophy">Professional Philosophy</Label>
            <RichEditor 
              name="philosophy" 
              initialHTML={formData.philosophy} 
              label="Philosophy"
              onChange={(html) => {
                setFormData(prev => ({ ...prev, philosophy: html }));
                setPendingChanges(true);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="focusAreas">Focus Areas</Label>
            <RichEditor 
              name="focusAreas" 
              initialHTML={formData.focusAreas} 
              label="Focus Areas"
              onChange={(html) => {
                setFormData(prev => ({ ...prev, focusAreas: html }));
                setPendingChanges(true);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="representativeMatters">Representative Matters</Label>
            <RichEditor 
              name="representativeMatters" 
              initialHTML={formData.representativeMatters} 
              label="Representative Matters"
              onChange={(html) => {
                setFormData(prev => ({ ...prev, representativeMatters: html }));
                setPendingChanges(true);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teachingWriting">Teaching & Writing</Label>
            <RichEditor 
              name="teachingWriting" 
              initialHTML={formData.teachingWriting} 
              label="Teaching & Writing"
              onChange={(html) => {
                setFormData(prev => ({ ...prev, teachingWriting: html }));
                setPendingChanges(true);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="credentials">Credentials & Memberships</Label>
            <RichEditor 
              name="credentials" 
              initialHTML={formData.credentials} 
              label="Credentials"
              onChange={(html) => {
                setFormData(prev => ({ ...prev, credentials: html }));
                setPendingChanges(true);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="values">Values & Work Approach</Label>
            <RichEditor 
              name="values" 
              initialHTML={formData.values} 
              label="Values"
              onChange={(html) => {
                setFormData(prev => ({ ...prev, values: html }));
                setPendingChanges(true);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Services Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Services Assignment</CardTitle>
          <CardDescription>Select the services you offer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="services">Available Services</Label>
            <select 
              id="services"
              name="services" 
              multiple 
              className="h-40 w-full rounded border px-2 py-1"
              value={formData.services}
              onChange={handleServicesChange}
            >
              {allServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title} ({service.practiceArea.title})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Hold Ctrl/Cmd to select multiple services
            </p>
          </div>

          {formData.services.length > 0 && (
            <div className="rounded border p-3">
              <h4 className="font-medium mb-2">Selected Services ({formData.services.length})</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {formData.services.map((serviceId) => {
                  const service = allServices.find(s => s.id === serviceId);
                  return service ? (
                    <div key={serviceId} className="rounded bg-muted/50 p-2 text-sm">
                      <div className="font-medium">{service.title}</div>
                      <div className="text-xs text-muted-foreground">{service.practiceArea.title}</div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Status</CardTitle>
          <CardDescription>Current profile information and company affiliation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {isSoloSpecialist ? 'Solo Specialist' : `Company: ${profile.company?.name}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Profile Active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
