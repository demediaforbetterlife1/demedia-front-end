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

    console.log('AuthGuard Debug:', {
      isAuthenticated,
      isLoading,
      user: user ? { id: user.id, isSetupComplete: user.isSetupComplete } : null,
      pathname
    });

    const authPages = ['/sign-in', '/sign-up'];
    const setupPages = ['/SignInSetUp', '/interests', '/FinishSetup'];
    const protectedPrefixes = ['/home', '/profile', '/messaging', '/messeging'];

    const isAuthPage = authPages.includes(pathname);
    const isSetupPage = setupPages.includes(pathname);
    const isProtectedPage = protectedPrefixes.some(p => pathname.startsWith(p));

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to sign-up');
      // Not authenticated - redirect to sign-up unless on auth pages
      if (!isAuthPage) {
        router.push('/sign-up');
      }
    } else if (isAuthenticated && user) {
      console.log('Authenticated, checking setup status:', { 
        isSetupComplete: user.isSetupComplete 
      });
      
      // Check setup status
      if (isAuthPage) {
        // Already authenticated, redirect to appropriate page
        if (user.isSetupComplete) {
          console.log('Setup complete, redirecting to home');
          router.push('/home');
        } else {
          console.log('Setup not complete, redirecting to SignInSetUp');
          router.push('/SignInSetUp');
        }
      } else if (isProtectedPage && !user.isSetupComplete) {
        console.log('Trying to access protected page without setup, redirecting to SignInSetUp');
        // Trying to access protected pages without completing setup
        router.push('/SignInSetUp');
      } else if (isSetupPage && user.isSetupComplete) {
        console.log('Setup complete but on setup page, redirecting to home');
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
