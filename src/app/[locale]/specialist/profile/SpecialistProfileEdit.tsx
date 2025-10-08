'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import SpecialistEditForm from "@/components/admin/SpecialistEditForm";

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

interface SpecialistProfileEditProps {
  locale: string;
}

export default function SpecialistProfileEdit({ locale }: SpecialistProfileEditProps) {
  const { data: session } = useSession();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [allServices, setAllServices] = useState<AllServices[]>([]);
  const [allCompanies, setAllCompanies] = useState<AllCompanies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Debug session information
        console.log('Session info:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: (session?.user as any)?.id,
          userEmail: session?.user?.email,
          userRole: (session?.user as any)?.role,
          sessionExpires: (session as any)?.expires,
        });

        // Check if session is expired
        if ((session as any)?.expires && new Date((session as any).expires) < new Date()) {
          console.error('Session is expired:', session.expires);
          setError('Your session has expired. Please log in again.');
          setLoading(false);
          return;
        }

        // Check if user has the right role
        if ((session?.user as any)?.role !== 'SPECIALIST') {
          console.error('User role is not SPECIALIST:', (session?.user as any)?.role);
          setError('You need to be a Specialist to access this page. Your current role is: ' + ((session?.user as any)?.role || 'Unknown'));
          setLoading(false);
          return;
        }

        // Load specialist profile
        console.log('Making API call to /api/specialist/profile...');
        const profileResponse = await fetch('/api/specialist/profile', {
          credentials: 'include'
        });

        console.log('Profile API response:', {
          status: profileResponse.status,
          statusText: profileResponse.statusText,
          headers: Object.fromEntries(profileResponse.headers.entries()),
          ok: profileResponse.ok
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('Profile data loaded successfully:', profileData);
          setSpecialist(profileData);
        } else {
          let errorData;
          try {
            // Try to parse as JSON first
            errorData = await profileResponse.json();
            console.log('Parsed error data from JSON:', errorData);
          } catch (e) {
            console.error('Failed to parse error response as JSON:', e);
            // If JSON parsing fails, try to get text
            try {
              const responseText = await profileResponse.text();
              console.log('Raw error response text:', responseText);
              errorData = { error: 'Failed to parse error response', rawResponse: responseText };
            } catch (textError) {
              console.error('Failed to get response text:', textError);
              errorData = { error: 'Failed to get error response' };
            }
          }
          
          console.error('Profile API error:', {
            status: profileResponse.status,
            statusText: profileResponse.statusText,
            error: errorData,
            errorType: typeof errorData,
            errorKeys: errorData ? Object.keys(errorData) : 'no keys'
          });
          
          if (profileResponse.status === 401) {
            setError('Please log in to access your profile. Click here to sign in.');
          } else if (profileResponse.status === 403) {
            setError('You do not have permission to access this profile. You need to be a Specialist to access this page.');
          } else if (profileResponse.status === 404) {
            setError('Specialist profile not found. Please contact support to create your profile.');
          } else {
            setError(`Failed to load profile: ${errorData.error || 'Unknown error'}`);
          }
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

  const updateAction = async (formData: FormData) => {
    try {
      const response = await fetch('/api/specialist/profile/update', {
        method: 'PATCH',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSpecialist(data.specialist);
        return { success: true, specialist: data.specialist };
      } else {
        const errorData = await response.json();
        return { error: errorData.error || 'Failed to update profile' };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: 'Failed to update profile' };
    }
  };

  const assignServicesAction = async (formData: FormData) => {
    try {
      const response = await fetch('/api/specialist/services', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { error: errorData.error || 'Failed to assign services' };
      }
    } catch (error) {
      console.error('Error assigning services:', error);
      return { error: 'Failed to assign services' };
    }
  };

  const updateTranslationAction = async (formData: FormData) => {
    try {
      const payload = Object.fromEntries(formData.entries());
      const response = await fetch('/api/specialist/translations', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update translation');
      }

      const data = await response.json();

      if (data.translation) {
        setSpecialist((prev) => {
          if (!prev) return prev;

          const existingTranslations = ((prev as any).translations || []) as any[];
          const otherTranslations = existingTranslations.filter((t) => t.locale !== data.translation.locale);

          return {
            ...prev,
            translations: [...otherTranslations, data.translation],
          } as Specialist;
        });
      }
    } catch (error) {
      console.error('Error updating translation:', error);
      throw error;
    }
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
        <AlertDescription>
          {error.includes('Please log in') ? (
            <div>
              <p>{error}</p>
              <Link
                href="/ka/auth/signin"
                className="mt-2 inline-block text-blue-600 hover:text-blue-800 underline"
              >
                Go to Sign In Page
              </Link>
            </div>
          ) : (
            error
          )}
        </AlertDescription>
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
        <h1 className="text-2xl font-semibold">Edit Specialist Profile</h1>
        <p className="text-muted-foreground">
          Update your professional profile information
        </p>
      </div>

      <SpecialistEditForm
        specialist={specialist}
        services={allServices}
        companies={allCompanies}
        updateAction={updateAction}
        assignServicesAction={assignServicesAction}
        updateTranslationAction={updateTranslationAction}
      />
    </div>
  );
}
