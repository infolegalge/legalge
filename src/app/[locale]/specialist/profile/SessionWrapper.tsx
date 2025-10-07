'use client';

import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import MultiLanguageSpecialistEditor from './MultiLanguageSpecialistEditor';

export default function SessionWrapper() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading session...</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center py-8">
        <span>Please log in to access your profile</span>
      </div>
    );
  }

  return <MultiLanguageSpecialistEditor />;
}
