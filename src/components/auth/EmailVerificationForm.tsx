"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle } from 'lucide-react';

interface EmailVerificationFormProps {
  email: string;
  onSuccess: () => void;
  onResend: () => void;
}

export default function EmailVerificationForm({ email, onSuccess, onResend }: EmailVerificationFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(code)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, code }),
        });

        const data = await response.json();

        if (response.ok) {
          onSuccess();
        } else {
          setError(data.error || 'Verification failed');
        }
      } catch (error) {
        setError('Network error. Please try again.');
      }
    });
  };

  const handleResend = () => {
    setError('');
    setCode('');
    onResend();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Verify Email</CardTitle>
        <CardDescription className="text-center">
          We have sent a 6-digit code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="pl-10 text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckCircle className="mr-2 h-4 w-4" />
            Verify Email
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <p className="text-muted-foreground mb-2">
            Didn&#39;t receive the code?
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={isPending}
            className="w-full"
          >
            Resend Code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
