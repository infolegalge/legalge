'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Edit, 
  FileText, 
  Plus,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar
} from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";

interface SpecialistProfile {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  avatarUrl?: string;
  specializations: string[];
  languages: string[];
  contactEmail?: string;
  contactPhone?: string;
  city?: string;
  company?: {
    id: string;
    name: string;
    city?: string;
  };
}

interface SpecialistDashboardProps {
  locale: Locale;
}

export default function SpecialistDashboard({ locale }: SpecialistDashboardProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, you would fetch the specialist's profile
    // For now, we'll use session data
    if (session?.user) {
      setProfile({
        id: 'temp-id',
        name: session.user.name || 'Specialist',
        role: 'Legal Specialist',
        bio: 'Your professional bio will appear here once you complete your profile.',
        specializations: ['Corporate Law', 'Contract Law'],
        languages: ['English', 'Georgian'],
        contactEmail: session.user.email || '',
        contactPhone: '+995 XXX XXX XXX',
        city: 'Tbilisi'
      });
    }
    setLoading(false);
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Specialist Dashboard</h1>
          <p className="text-muted-foreground">Manage your professional profile and content</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/specialist/profile`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
          <Link href={`/${locale}/specialist/posts/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Overview
          </CardTitle>
          <CardDescription>
            Your professional information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              {profile?.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.name}
                  className="w-16 h-16 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-lg font-semibold">{profile?.name}</h3>
                <p className="text-muted-foreground">{profile?.role}</p>
              </div>
              
              {profile?.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.company.name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile?.city || 'Location not set'}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{profile?.contactEmail || 'Email not set'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{profile?.contactPhone || 'Phone not set'}</span>
            </div>
          </div>

          {profile?.bio && (
            <div>
              <h4 className="font-medium mb-2">Bio</h4>
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium">Specializations</h4>
            <div className="flex flex-wrap gap-2">
              {profile?.specializations.map((spec, index) => (
                <Badge key={index} variant="secondary">{spec}</Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Languages</h4>
            <div className="flex flex-wrap gap-2">
              {profile?.languages.map((lang, index) => (
                <Badge key={index} variant="outline">{lang}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Profile Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Update your professional information, specializations, and contact details.
            </p>
            <Link href={`/${locale}/specialist/profile`}>
              <Button variant="outline" size="sm" className="w-full">
                Manage Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Create and manage your blog posts and articles.
            </p>
            <Link href={`/${locale}/specialist/posts`}>
              <Button variant="outline" size="sm" className="w-full">
                Manage Posts
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              View your recent activity and engagement metrics.
            </p>
            <Button variant="outline" size="sm" className="w-full" disabled>
              View Activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Posts
            </CardTitle>
            <Link href={`/${locale}/specialist/posts`}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No posts yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start sharing your expertise by creating your first post.
            </p>
            <Link href={`/${locale}/specialist/posts/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Post
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




