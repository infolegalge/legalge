'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  RotateCcw,
  ChevronDown,
  Edit
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

interface RequestsManagementProps {
  locale: Locale;
}

export default function RequestsManagement({ locale }: RequestsManagementProps) {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [reverting, setReverting] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/check-role', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (active) setIsSuperAdmin(data.role === 'SUPER_ADMIN');
        } else {
          if (active) setIsSuperAdmin(((session?.user as any)?.role) === 'SUPER_ADMIN');
        }
      } catch {
        if (active) setIsSuperAdmin(((session?.user as any)?.role) === 'SUPER_ADMIN');
      }
    })();
    return () => { active = false };
  }, [session?.user]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        setError('Failed to fetch requests');
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

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      setUpdating(requestId);
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // If this was a role upgrade approval, show success message with redirect info
        if (data.redirectUrl) {
          setSuccess(`${data.message} The user will be redirected to their new dashboard.`);
        }
        
        await fetchRequests(); // Refresh the list
        try { await fetch('/api/auth/check-role', { cache: 'no-store', credentials: 'include' }); } catch {}
      } else {
        const data = await response.json();
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
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchRequests(); // Refresh the list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete request');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setUpdating(null);
    }
  };

  const changeUserRole = async (userId: string, currentRole: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role from ${currentRole} to ${newRole}?`)) return;

    try {
      setReverting(userId);
      const response = await fetch(`/api/admin/users/${userId}/revert-role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newRole }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        await fetchRequests(); // Refresh the list
      } else {
        const data = await response.json();
        console.error('Role change failed:', { status: response.status, error: data.error });
        
        if (response.status === 401) {
          setError('Unauthorized: Only Super Admin can change user roles');
        } else {
          setError(data.error || 'Failed to change user role');
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      
      // Check if it's a fetch error or network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Network error: Unable to connect to server');
      } else {
        setError('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } finally {
      setReverting(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'DENIED': return <XCircle className="h-4 w-4" />;
      case 'HANGING': return <Pause className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'APPROVED': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'DENIED': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'HANGING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const filteredRequests = selectedStatus === 'all' 
    ? requests 
    : requests.filter(req => req.status === selectedStatus);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    denied: requests.filter(r => r.status === 'DENIED').length,
    hanging: requests.filter(r => r.status === 'HANGING').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Request Management</h1>
          <p className="text-muted-foreground">Manage specialist and company applications</p>
        </div>
        <Button onClick={fetchRequests} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.denied}</div>
            <div className="text-sm text-muted-foreground">Denied</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.hanging}</div>
            <div className="text-sm text-muted-foreground">Hanging</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={selectedStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus('all')}
        >
          All ({stats.total})
        </Button>
        <Button
          variant={selectedStatus === 'PENDING' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus('PENDING')}
        >
          Pending ({stats.pending})
        </Button>
        <Button
          variant={selectedStatus === 'APPROVED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus('APPROVED')}
        >
          Approved ({stats.approved})
        </Button>
        <Button
          variant={selectedStatus === 'DENIED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus('DENIED')}
        >
          Denied ({stats.denied})
        </Button>
        <Button
          variant={selectedStatus === 'HANGING' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus('HANGING')}
        >
          Hanging ({stats.hanging})
        </Button>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No requests found</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {request.requestType === 'COMPANY' ? (
                        <Building2 className="h-5 w-5 text-primary" />
                      ) : request.requestType === 'PROFILE_CHANGE' ? (
                        <Edit className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                      <CardTitle className="text-lg">
                        {request.requestType === 'COMPANY' ? 'Company Request' : 
                         request.requestType === 'PROFILE_CHANGE' ? 'Profile Change Request' : 
                         'Specialist Request'}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {request.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request.id, 'APPROVED')}
                          disabled={updating === request.id}
                        >
                          {updating === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRequestStatus(request.id, 'HANGING')}
                          disabled={updating === request.id}
                        >
                          <Pause className="h-4 w-4" />
                          Hang
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateRequestStatus(request.id, 'DENIED')}
                          disabled={updating === request.id}
                        >
                          <XCircle className="h-4 w-4" />
                          Deny
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRequest(request.id)}
                      disabled={updating === request.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{request.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{request.phone}</span>
                  </div>
                </div>
                
                {request.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Requesting to join: <strong>{request.company.name}</strong></span>
                  </div>
                )}

                {request.user && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-green-800 dark:text-green-200">
                          <strong>Approved User:</strong> {request.user.name} ({request.user.email}) - Current Role: <Badge variant="secondary">{request.user.role}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSuperAdmin ? (
                          <>
                    <select
                      className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800"
                      onChange={(e) => {
                        const newRole = e.target.value;
                        if (newRole && newRole !== request.user!.role) {
                          changeUserRole(request.user!.id, request.user!.role, newRole);
                        }
                      }}
                      disabled={reverting === request.user!.id}
                      value={request.user.role}
                    >
                      <option value="SUBSCRIBER">SUBSCRIBER</option>
                      <option value="SPECIALIST">SPECIALIST</option>
                      <option value="COMPANY">COMPANY</option>
                    </select>
                            {reverting === request.user!.id && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Only Super Admin can change roles
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Message:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.message}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

