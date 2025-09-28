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
  Pause, 
  Trash2, 
  Mail, 
  Phone, 
  Building2, 
  User,
  Loader2,
  RefreshCw,
  Eye
} from "lucide-react";
import type { Locale } from "@/i18n/locales";

interface Request {
  id: string;
  email: string;
  phone: string;
  message: string;
  requestType: string;
  status: string;
  createdAt: string;
  company?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface CompanyRequestsManagementProps {
  locale: Locale;
}

export default function CompanyRequestsManagement({ locale }: CompanyRequestsManagementProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);



  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/company/requests', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(Array.isArray(data?.requests) ? data.requests : []);
      } else {
        let errorMessage = 'Failed to fetch requests';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {}
        setError(errorMessage);
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const refreshRequests = fetchRequests;

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      setUpdating(requestId);
      const response = await fetch(`/api/company/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const updatedRequest = await response.json();
        setRequests(prev => prev.map(req => 
          req.id === requestId ? updatedRequest : req
        ));
        setError(''); // Clear any previous errors
      } else {
        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        setError(data.error || 'Failed to update request');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setUpdating(null);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      setUpdating(requestId);
      const response = await fetch(`/api/company/requests/${requestId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setRequests(prev => prev.filter(req => req.id !== requestId));
        setError(''); // Clear any previous errors
      } else {
        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        setError(data.error || 'Failed to delete request');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'DENIED': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'HANGING': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'DENIED': return <XCircle className="h-4 w-4" />;
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'HANGING': return <Pause className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredRequests = requests.filter(request => {
    if (selectedStatus === 'all') return true;
    return request.status === selectedStatus;
  });

  const specialistRequests = filteredRequests.filter(r => r.requestType === 'SPECIALIST');
  const companyRequests = filteredRequests.filter(r => r.requestType === 'COMPANY');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Specialist Requests</h1>
          <p className="text-muted-foreground">Manage specialist requests to join your company</p>
        </div>
        <Button onClick={refreshRequests} variant="outline" size="sm">
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
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{specialistRequests.length}</div>
            <div className="text-sm text-muted-foreground">Total Specialist Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {specialistRequests.filter(r => r.status === 'PENDING').length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {specialistRequests.filter(r => r.status === 'APPROVED').length}
            </div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {specialistRequests.filter(r => r.status === 'DENIED').length}
            </div>
            <div className="text-sm text-muted-foreground">Denied</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        {['all', 'PENDING', 'APPROVED', 'DENIED', 'HANGING'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {/* Specialist Requests */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Specialist Requests</h2>
        {specialistRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No specialist requests</h3>
              <p className="text-sm text-muted-foreground">
                {selectedStatus === 'all' 
                  ? 'No specialists have requested to join your company yet'
                  : `No ${selectedStatus.toLowerCase()} specialist requests`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          specialistRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{request.phone}</span>
                      </div>
                    </div>
                    
                    {request.message && (
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-sm">{request.message}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {request.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'APPROVED')}
                          disabled={updating === request.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updating === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span className="ml-1">Approve</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateRequestStatus(request.id, 'DENIED')}
                          disabled={updating === request.id}
                        >
                          {updating === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <span className="ml-1">Deny</span>
                        </Button>
                      </>
                    )}
                    
                    {request.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequestStatus(request.id, 'HANGING')}
                        disabled={updating === request.id}
                      >
                        {updating === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                        <span className="ml-1">Suspend</span>
                      </Button>
                    )}
                    
                    {request.status === 'HANGING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequestStatus(request.id, 'PENDING')}
                        disabled={updating === request.id}
                      >
                        {updating === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-1">Call Back</span>
                      </Button>
                    )}
                    
                    {request.status === 'DENIED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequestStatus(request.id, 'PENDING')}
                        disabled={updating === request.id}
                      >
                        {updating === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-1">Reconsider</span>
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteRequest(request.id)}
                      disabled={updating === request.id}
                    >
                      {updating === request.id ? (
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
