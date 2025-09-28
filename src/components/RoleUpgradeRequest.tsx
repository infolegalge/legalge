'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Building2, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Locale } from "@/i18n/locales";

interface Company {
  id: string;
  name: string;
}

interface RoleUpgradeRequest {
  id: string;
  requestedRole: string;
  currentRole: string;
  status: string;
  message: string;
  company?: Company;
  createdAt: string;
  updatedAt: string;
}

export default function RoleUpgradeRequest() {
  const [requestedRole, setRequestedRole] = useState<string>('');
  const [targetCompanyId, setTargetCompanyId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [requests, setRequests] = useState<RoleUpgradeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch companies and existing requests
  useEffect(() => {
    fetchCompanies();
    fetchRequests();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/role-upgrade');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!requestedRole) {
      setError('Please select a role to request');
      return;
    }

    // Company selection is optional for specialists (can be solo)
    // No validation needed for targetCompanyId

    setLoading(true);

    try {
      const response = await fetch('/api/role-upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestedRole,
          targetCompanyId: targetCompanyId || null,
          message: message || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setRequestedRole('');
        setTargetCompanyId('');
        setMessage('');
        fetchRequests(); // Refresh requests
      } else {
        setError(data.error || 'Failed to submit request');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'DENIED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'HANGING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'DENIED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'HANGING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Request Role Upgrade
          </CardTitle>
          <CardDescription>
            Request to upgrade your role from Subscriber to Specialist or Company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Requested Role
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRequestedRole('SPECIALIST')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    requestedRole === 'SPECIALIST'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Specialist</h3>
                      <p className="text-sm text-muted-foreground">Provide legal services</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestedRole('COMPANY')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    requestedRole === 'COMPANY'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                      <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">Company</h3>
                      <p className="text-sm text-muted-foreground">Legal company profile</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Specialist Type Selection - Only show if Specialist is selected */}
            {requestedRole === 'SPECIALIST' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Specialist Type
                </label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setTargetCompanyId('')}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      targetCompanyId === ''
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                        <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium">Solo Specialist</h3>
                        <p className="text-sm text-muted-foreground">Independent legal practitioner</p>
                      </div>
                    </div>
                  </button>

                  {companies.length > 0 && (
                    <>
                      <div className="text-sm text-muted-foreground font-medium">
                        Or join an existing company:
                      </div>
                      {companies.map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => setTargetCompanyId(company.id)}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                            targetCompanyId === company.id
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-medium">Join {company.name}</h3>
                              <p className="text-sm text-muted-foreground">Become part of this company</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Message (Optional)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us why you want to upgrade your role..."
                rows={3}
              />
            </div>

            {/* Error/Success Messages */}
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

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting Request...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Requests */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Role Upgrade Requests</CardTitle>
            <CardDescription>
              Track the status of your role upgrade requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className="font-medium">
                        {request.currentRole} → {request.requestedRole}
                      </span>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                  
                  {request.requestedRole === 'SPECIALIST' && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {request.company ? (
                        <>
                          <Building2 className="h-4 w-4 inline mr-1" />
                          Joining: {request.company.name}
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 inline mr-1" />
                          Solo Specialist (Independent)
                        </>
                      )}
                    </p>
                  )}
                  
                  {request.requestedRole === 'COMPANY' && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <Building2 className="h-4 w-4 inline mr-1" />
                      Company Request
                    </p>
                  )}
                  
                  {request.message && (
                    <p className="text-sm mb-2">{request.message}</p>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Submitted: {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}