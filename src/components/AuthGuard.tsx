"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const authPages = ['/sign-in', '/sign-up'];
    const setupPages = ['/SignInSetUp', '/interests', '/FinishSetup'];
    const protectedPrefixes = ['/home', '/profile', '/messaging', '/messeging'];

    const isAuthPage = authPages.includes(pathname);
    const isSetupPage = setupPages.includes(pathname);
    const isProtectedPage = protectedPrefixes.some(p => pathname.startsWith(p));

    if (!isAuthenticated) {
      // Not authenticated - redirect to sign-up unless on auth pages
      if (!isAuthPage) {
        router.push('/sign-up');
      }
    } else if (isAuthenticated && user) {
      // Authenticated - check setup status
      if (isAuthPage) {
        // Already authenticated, redirect to appropriate page
        if (user.isSetupComplete) {
          router.push('/home');
        } else {
          router.push('/SignInSetUp');
        }
      } else if (isProtectedPage && !user.isSetupComplete) {
        // Trying to access protected pages without completing setup
        router.push('/SignInSetUp');
      } else if (isSetupPage && user.isSetupComplete) {
        // Setup already complete, redirect to home
        router.push('/home');
      }
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg-primary">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return <>{children}</>;
};
