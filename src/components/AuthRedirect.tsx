'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [hasCheckedRole, setHasCheckedRole] = useState(false);
  type SessionUserWithRole = { email: string; role: 'SUBSCRIBER' | 'SPECIALIST' | 'COMPANY' | 'SUPER_ADMIN' };

  // Check if user's role has changed in database
  const checkUserRole = async (userEmail: string, sessionRole: string) => {
    try {
      const response = await fetch('/api/auth/check-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      
      if (response.ok) {
        const data = await response.json();
        const dbRole = data.role;
        
        if (dbRole !== sessionRole) {
          console.log(`AuthRedirect: Role mismatch! Session: ${sessionRole}, DB: ${dbRole}`);
          console.log('AuthRedirect: Forcing session refresh...');
          await signOut({ redirect: false });
          window.location.reload();
          return;
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (status === 'authenticated' && session?.user && !hasCheckedRole) {
      const user = session.user as SessionUserWithRole;
      console.log('AuthRedirect: User authenticated, role:', user.role);
      
      // Check if role has changed in database
      checkUserRole(user.email, user.role);
      setHasCheckedRole(true);
      
      // Extract locale from current pathname
      const locale = pathname.split('/')[1] || 'en';
      console.log('AuthRedirect: Current locale:', locale);
      
      // Only redirect to dashboards if user is on the homepage (root path)
      // Allow users to navigate freely to other pages without forced redirects
      const isOnHomepage = pathname === `/${locale}` || pathname === `/${locale}/`;
      
      if (isOnHomepage) {
        // Check if we've already redirected this user in this session
        const redirectKey = `auth_redirect_${user.email}_${user.role}`;
        const hasRedirected = sessionStorage.getItem(redirectKey);
        
        if (!hasRedirected) {
          // Mark that we've redirected this user
          sessionStorage.setItem(redirectKey, 'true');
          
          // Role-based redirects to appropriate dashboards only from homepage
          if (user.role === 'SPECIALIST') {
            console.log('AuthRedirect: Redirecting specialist from homepage to dashboard');
            router.push(`/${locale}/specialist`);
          } else if (user.role === 'COMPANY') {
            console.log('AuthRedirect: Redirecting company from homepage to dashboard');
            router.push(`/${locale}/company`);
          } else if (user.role === 'SUPER_ADMIN') {
            console.log('AuthRedirect: Redirecting admin from homepage to dashboard');
            router.push(`/${locale}/admin`);
          } else if (user.role === 'SUBSCRIBER') {
            console.log('AuthRedirect: Redirecting subscriber from homepage to dashboard');
            router.push(`/${locale}/subscriber`);
          }
        } else {
          console.log('AuthRedirect: User already redirected in this session, allowing homepage access');
        }
      }
    }
  }, [session, status, router, pathname, hasCheckedRole]);

  return null; // This component doesn't render anything
}
