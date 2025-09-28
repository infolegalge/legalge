'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  User,
  Loader2,
  Search,
  Building2
} from "lucide-react";

interface Lawyer {
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
  slug: string;
}

interface CompanyLawyersManagementProps {
  locale: string;
}

export default function CompanyLawyersManagement({ locale }: CompanyLawyersManagementProps) {
  const { data: session } = useSession();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch real specialists from API
  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const response = await fetch('/api/company/specialists', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setLawyers(Array.isArray(data) ? data : Array.isArray((data as any)?.specialists) ? (data as any).specialists : []);
        } else {
          const text = await response.text().catch(() => '');
          console.error('Failed to fetch specialists', response.status, response.statusText, text);
        }
      } catch (error) {
        console.error('Error fetching specialists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLawyers();
  }, []);

  const filteredLawyers = lawyers.filter(lawyer =>
    lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lawyer.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lawyer.specializations.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDeleteLawyer = async (lawyerId: string) => {
    if (!confirm('Are you sure you want to remove this lawyer from your company? This action cannot be undone.')) {
      return;
    }

    setDeleting(lawyerId);
    try {
      const response = await fetch(`/api/specialists/${lawyerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'INACTIVE' })
      });
      
      if (response.ok) {
        // Remove from local state
        setLawyers(prev => prev.filter(lawyer => lawyer.id !== lawyerId));
      } else {
        const errorData = await response.json();
        console.error('Failed to delete lawyer:', errorData.error);
        alert('Failed to remove lawyer. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete lawyer:', error);
      alert('Failed to remove lawyer. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading lawyers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manage Specialists</h1>
          <p className="text-muted-foreground">Manage your team of legal specialists</p>
        </div>
        <Link href={`/${locale}/company/lawyers/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Lawyer
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search lawyers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{lawyers.length}</div>
            <div className="text-sm text-muted-foreground">Total Lawyers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {lawyers.filter(l => l.role?.includes('Partner')).length}
            </div>
            <div className="text-sm text-muted-foreground">Partners</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {lawyers.filter(l => l.role?.includes('Associate')).length}
            </div>
            <div className="text-sm text-muted-foreground">Associates</div>
          </CardContent>
        </Card>
      </div>

      {/* Lawyers List */}
      <div className="space-y-4">
        {filteredLawyers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">
                {searchQuery ? 'No lawyers found' : 'No lawyers yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search criteria'
                  : 'Start building your legal team by adding your first lawyer'
                }
              </p>
              {!searchQuery && (
                <Link href={`/${locale}/company/lawyers/new`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Lawyer
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredLawyers.map((lawyer) => (
            <Card key={lawyer.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        {lawyer.avatarUrl ? (
                          <img 
                            src={lawyer.avatarUrl} 
                            alt={lawyer.name}
                            className="w-12 h-12 rounded-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <User className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{lawyer.name}</h3>
                        {lawyer.role && (
                          <p className="text-sm text-muted-foreground">{lawyer.role}</p>
                        )}
                      </div>
                    </div>
                    
                    {lawyer.bio && (
                      <p className="text-sm text-muted-foreground">{lawyer.bio}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {lawyer.specializations.map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {lawyer.city || 'Location not set'}
                      </div>
                      {lawyer.contactEmail && (
                        <div className="flex items-center gap-1">
                          <span>📧</span>
                          {lawyer.contactEmail}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${locale}/specialists/${lawyer.slug}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${locale}/company/lawyers/${lawyer.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteLawyer(lawyer.id)}
                      disabled={deleting === lawyer.id}
                    >
                      {deleting === lawyer.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

