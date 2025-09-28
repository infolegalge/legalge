'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, Trash2, Bell, BellOff, Eye, EyeOff, Shield, ShieldOff } from "lucide-react";

export default function SettingsClient() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    serviceUpdates: true,
    marketingCommunications: false,
    profileVisibility: false,
    dataAnalytics: true,
  });

  const handleSettingChange = async (setting: string, value: boolean) => {
    setLoading(setting);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettings(prev => ({ ...prev, [setting]: value }));
      setMessage({ type: 'success', text: 'Setting updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update setting. Please try again.' });
    } finally {
      setLoading(null);
    }
  };

  const handleExportData = async () => {
    setLoading('export');
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would trigger a download
      setMessage({ type: 'success', text: 'Data export started. You will receive an email when ready.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data. Please try again.' });
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your data. Type "DELETE" to confirm.')) {
      return;
    }

    setLoading('delete');
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage({ type: 'success', text: 'Account deletion initiated. You will receive a confirmation email.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Choose how you want to be notified about updates and changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about your account
                </p>
              </div>
              <Button 
                variant={settings.emailNotifications ? "default" : "outline"} 
                size="sm"
                onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                disabled={loading === 'emailNotifications'}
              >
                {loading === 'emailNotifications' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : settings.emailNotifications ? (
                  <>
                    <Bell className="h-4 w-4 mr-1" />
                    Enabled
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 mr-1" />
                    Disabled
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Service Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new legal services and features
                </p>
              </div>
              <Button 
                variant={settings.serviceUpdates ? "default" : "outline"} 
                size="sm"
                onClick={() => handleSettingChange('serviceUpdates', !settings.serviceUpdates)}
                disabled={loading === 'serviceUpdates'}
              >
                {loading === 'serviceUpdates' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : settings.serviceUpdates ? (
                  <>
                    <Bell className="h-4 w-4 mr-1" />
                    Enabled
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 mr-1" />
                    Disabled
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Communications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive promotional emails and newsletters
                </p>
              </div>
              <Button 
                variant={settings.marketingCommunications ? "default" : "outline"} 
                size="sm"
                onClick={() => handleSettingChange('marketingCommunications', !settings.marketingCommunications)}
                disabled={loading === 'marketingCommunications'}
              >
                {loading === 'marketingCommunications' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : settings.marketingCommunications ? (
                  <>
                    <Bell className="h-4 w-4 mr-1" />
                    Enabled
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 mr-1" />
                    Disabled
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>
            Control your privacy and data sharing preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  Make your profile visible to other users
                </p>
              </div>
              <Button 
                variant={settings.profileVisibility ? "default" : "outline"} 
                size="sm"
                onClick={() => handleSettingChange('profileVisibility', !settings.profileVisibility)}
                disabled={loading === 'profileVisibility'}
              >
                {loading === 'profileVisibility' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : settings.profileVisibility ? (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Public
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Private
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to use your data for improving our services
                </p>
              </div>
              <Button 
                variant={settings.dataAnalytics ? "default" : "outline"} 
                size="sm"
                onClick={() => handleSettingChange('dataAnalytics', !settings.dataAnalytics)}
                disabled={loading === 'dataAnalytics'}
              >
                {loading === 'dataAnalytics' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : settings.dataAnalytics ? (
                  <>
                    <Shield className="h-4 w-4 mr-1" />
                    Allow
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-4 w-4 mr-1" />
                    Deny
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>
            Manage your account and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Export Data</Label>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your account data
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportData}
                disabled={loading === 'export'}
              >
                {loading === 'export' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Delete Account</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteAccount}
                disabled={loading === 'delete'}
              >
                {loading === 'delete' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




