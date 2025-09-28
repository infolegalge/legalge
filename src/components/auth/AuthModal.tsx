"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import RegistrationForm from './RegistrationForm';
import LoginForm from './LoginForm';
import EmailVerificationForm from './EmailVerificationForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthStep = 'login' | 'register' | 'verify' | 'success';

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>('login');
  const [userEmail, setUserEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegistrationSuccess = (email: string) => {
    setUserEmail(email);
    setStep('verify');
  };

  const handleVerificationSuccess = () => {
    setSuccessMessage('Email verified successfully! You can now sign in.');
    setStep('success');
  };

  const handleResendCode = async () => {
    // This would trigger a resend of the verification code
    // For now, we'll just show a message
    setSuccessMessage('Verification code resent to your email.');
  };

  const handleLoginSuccess = () => {
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    setStep('login');
    setUserEmail('');
    setSuccessMessage('');
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 'login':
        return (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setStep('register')}
          />
        );
      case 'register':
        return (
          <RegistrationForm
            onSuccess={handleRegistrationSuccess}
            onSwitchToLogin={() => setStep('login')}
          />
        );
      case 'verify':
        return (
          <EmailVerificationForm
            email={userEmail}
            onSuccess={handleVerificationSuccess}
            onResend={handleResendCode}
          />
        );
      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold">Success!</h3>
            <Alert>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <button
                onClick={() => setStep('login')}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Continue to Sign In
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'login':
        return 'Sign In';
      case 'register':
        return 'Create Account';
      case 'verify':
        return 'Verify Email';
      case 'success':
        return 'Success';
      default:
        return 'Authentication';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{getTitle()}</DialogTitle>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
