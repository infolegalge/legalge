'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, Upload, User, Building2, MapPin, Mail, Phone } from "lucide-react";

interface SpecialistProfile {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  avatarUrl?: string;
  specializations: string[];
  languages: string[];
  city?: string;
  company?: {
    id: string;
    name: string;
    city?: string;
  };
  bioApproved?: boolean;
  bioApprovedBy?: string | null;
  bioApprovedAt?: string | null;
}

interface SpecialistProfileManagementProps {
  locale: string;
}

export default function SpecialistProfileManagement({ locale }: SpecialistProfileManagementProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [profile, setProfile] = useState<SpecialistProfile>({
    id: 'temp-id',
    name: session?.user?.name || '',
    role: 'Legal Specialist',
    bio: '',
    specializations: [],
    languages: [],
    city: ''
  });

  const [formData, setFormData] = useState({
    name: profile.name,
    role: profile.role || '',
    bio: profile.bio || '',
    city: profile.city || '',
    specializations: profile.specializations.join(', '),
    languages: profile.languages.join(', ')
  });

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/specialist/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setFormData({
            name: data.name,
            role: data.role || '',
            bio: data.bio || '',
            city: data.city || '',
            specializations: data.specializations.join(', '),
            languages: data.languages.join(', ')
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/specialist/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          bio: formData.bio,
          city: formData.city,
          specializations: formData.specializations.split(',').map(s => s.trim()).filter(Boolean),
          languages: formData.languages.split(',').map(s => s.trim()).filter(Boolean)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profile Management</h1>
          <p className="text-muted-foreground">Manage your professional profile and information</p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>

              {profile.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.company.name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile.city || 'Location not set'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your basic profile information
              </CardDescription>
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
                  <Label htmlFor="role">Professional Role</Label>
                  <Input
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    placeholder="e.g., Senior Legal Counsel"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about your professional background, experience, and expertise..."
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {profile.bioApproved !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      profile.bioApproved 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {profile.bioApproved ? '✓ Bio Approved' : '⏳ Bio Pending Approval'}
                    </span>
                    {profile.bioApprovedAt && (
                      <span className="text-muted-foreground">
                        Approved on {new Date(profile.bioApprovedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Contact details are centrally managed. The public profile shows your registered email and the Legal Sandbox central number.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Profile Email</Label>
                  <Input value={session?.user?.email || 'Not available'} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Central Phone</Label>
                  <Input value="+995 551 911 961" disabled className="bg-muted" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g., Tbilisi"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
              <CardDescription>
                Specify your specializations and languages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specializations">Specializations</Label>
                <Input
                  id="specializations"
                  name="specializations"
                  value={formData.specializations}
                  onChange={handleInputChange}
                  placeholder="e.g., Corporate Law, Contract Law, Tax Law"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple specializations with commas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="languages">Languages</Label>
                <Input
                  id="languages"
                  name="languages"
                  value={formData.languages}
                  onChange={handleInputChange}
                  placeholder="e.g., English, Georgian, Russian"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple languages with commas
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
