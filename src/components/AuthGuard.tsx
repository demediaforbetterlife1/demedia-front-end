"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Add a small delay to prevent rapid redirects
    const timeoutId = setTimeout(() => {
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

      // If not authenticated, redirect to sign-up unless on auth pages
      if (!isAuthenticated) {
        console.log('AuthGuard: Not authenticated, checking if should redirect');
        if (!isAuthPage && !hasRedirected) {
          console.log('AuthGuard: Redirecting to sign-up');
          setHasRedirected(true);
          router.push('/sign-up');
        } else {
          console.log('AuthGuard: On auth page or already redirected, allowing access');
        }
        return;
      }
    }, 100); // Small delay to prevent rapid redirects

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isLoading, user, pathname, router, hasRedirected]);

  // Reset redirect state when pathname changes
  useEffect(() => {
    setHasRedirected(false);
  }, [pathname]);

  // Separate useEffect for authenticated user routing
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    const authPages = ['/sign-in', '/sign-up'];
    const setupPages = ['/SignInSetUp', '/interests', '/FinishSetup'];
    const protectedPrefixes = ['/home', '/profile', '/messaging', '/messeging'];

    const isAuthPage = authPages.includes(pathname);
    const isSetupPage = setupPages.includes(pathname);
    const isProtectedPage = protectedPrefixes.some(p => pathname.startsWith(p));

    console.log('AuthGuard: Authenticated, checking setup status:', { 
      isSetupComplete: user.isSetupComplete,
      pathname
    });
    
    // If on auth pages but already authenticated, redirect appropriately
    if (isAuthPage) {
      console.log('AuthGuard: On auth page but authenticated, redirecting based on setup status');
      if (user.isSetupComplete) {
        console.log('AuthGuard: Setup complete, redirecting to home');
        router.push('/home');
      } else {
        console.log('AuthGuard: Setup not complete, redirecting to SignInSetUp');
        router.push('/SignInSetUp');
      }
      return;
    }

    // If trying to access protected pages without completing setup
    if (isProtectedPage && !user.isSetupComplete) {
      console.log('AuthGuard: Trying to access protected page without setup, redirecting to SignInSetUp');
      router.push('/SignInSetUp');
      return;
    }

    // If setup is complete but on setup pages, redirect to home
    if (isSetupPage && user.isSetupComplete) {
      console.log('AuthGuard: Setup complete but on setup page, redirecting to home');
      router.push('/home');
      return;
    }

    // If user is on root path and authenticated, redirect to home
    if (pathname === '/') {
      console.log('AuthGuard: On root path, redirecting to home');
      router.push('/home');
      return;
    }

    console.log('AuthGuard: All checks passed, allowing access to:', pathname);
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