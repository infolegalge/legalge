'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Loader2,
  RefreshCw,
  Eye,
  Edit
} from "lucide-react";
import type { Locale } from "@/i18n/locales";

interface Specialist {
  id: string;
  name: string;
  email: string;
  role: string;
  bioApproved: boolean;
  bioApprovedBy: string | null;
  bioApprovedAt: string | null;
  companyId: string | null;
  specialistProfile?: {
    id: string;
    name: string;
    bio: string | null;
    role: string | null;
    avatarUrl: string | null;
  };
}

interface CompanyBioApprovalProps {
  locale: Locale;
}

export default function CompanyBioApproval({ locale }: CompanyBioApprovalProps) {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchSpecialists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/company/specialists');
      if (response.ok) {
        const data = await response.json();
        setSpecialists(data);
      } else {
        setError('Failed to fetch specialists');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialists();
  }, []);

  const updateBioApproval = async (specialistId: string, approved: boolean) => {
    try {
      setUpdating(specialistId);
      const response = await fetch(`/api/company/specialists/${specialistId}/bio`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved }),
      });

      if (response.ok) {
        await fetchSpecialists(); // Refresh the list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update bio approval');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (approved: boolean) => {
    return approved 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  };

  const getStatusIcon = (approved: boolean) => {
    return approved ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  const filteredSpecialists = specialists.filter(specialist => {
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'approved') return specialist.bioApproved;
    if (selectedStatus === 'pending') return !specialist.bioApproved;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading specialists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Specialist Bio Approval</h1>
          <p className="text-muted-foreground">Review and approve specialist bios before they go public</p>
        </div>
        <Button onClick={fetchSpecialists} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{specialists.length}</div>
            <div className="text-sm text-muted-foreground">Total Specialists</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {specialists.filter(s => s.bioApproved).length}
            </div>
            <div className="text-sm text-muted-foreground">Approved Bios</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {specialists.filter(s => !s.bioApproved).length}
            </div>
            <div className="text-sm text-muted-foreground">Pending Approval</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        {['all', 'pending', 'approved'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Specialists List */}
      <div className="space-y-4">
        {filteredSpecialists.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No specialists found</h3>
              <p className="text-sm text-muted-foreground">
                {selectedStatus === 'all' 
                  ? 'No specialists are associated with your company yet'
                  : `No ${selectedStatus} specialist bios`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSpecialists.map((specialist) => (
            <Card key={specialist.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {specialist.specialistProfile?.avatarUrl ? (
                        <img
                          src={specialist.specialistProfile.avatarUrl}
                          alt={specialist.name}
                          className="h-12 w-12 rounded-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{specialist.name}</h3>
                        <p className="text-sm text-muted-foreground">{specialist.email}</p>
                        {specialist.specialistProfile?.role && (
                          <p className="text-sm text-muted-foreground">{specialist.specialistProfile.role}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(specialist.bioApproved)}>
                        {getStatusIcon(specialist.bioApproved)}
                        <span className="ml-1">{specialist.bioApproved ? 'Approved' : 'Pending'}</span>
                      </Badge>
                    </div>
                    
                    {specialist.specialistProfile?.bio && (
                      <div className="rounded-md bg-muted p-4">
                        <h4 className="font-medium mb-2">Bio Content:</h4>
                        <div 
                          className="prose prose-sm max-w-none text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: specialist.specialistProfile.bio }}
                        />
                      </div>
                    )}
                    
                    {specialist.bioApprovedAt && (
                      <div className="text-sm text-muted-foreground">
                        Approved on: {new Date(specialist.bioApprovedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {!specialist.bioApproved && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateBioApproval(specialist.id, true)}
                          disabled={updating === specialist.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updating === specialist.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span className="ml-1">Approve</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/${locale}/specialist/profile`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="ml-1">Review</span>
                        </Button>
                      </>
                    )}
                    
                    {specialist.bioApproved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateBioApproval(specialist.id, false)}
                        disabled={updating === specialist.id}
                      >
                        {updating === specialist.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span className="ml-1">Revoke</span>
                      </Button>
                    )}
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
