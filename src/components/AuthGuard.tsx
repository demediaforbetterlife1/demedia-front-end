"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Cookie helper functions
const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRedirectTime = useRef<number>(0);

  useEffect(() => {
    // Only redirect if not loading and not already redirected
    if (isLoading || hasRedirected) return;

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

    // If not authenticated, redirect to sign-up unless on auth pages or setup pages
    if (!isAuthenticated) {
      console.log('AuthGuard: Not authenticated, checking if should redirect');
      // Check if there's a token in cookies - if so, wait a bit for auth to initialize
      const token = getCookie('token');
      if (token) {
        // Token exists but not authenticated yet - allow access to setup pages while auth initializes
        if (isSetupPage) {
          console.log('AuthGuard: Token exists, allowing access to setup page while auth initializes');
          return;
        }
        if (!isAuthPage) {
          // Token exists but not on auth page - wait a bit more for auth to initialize
          return;
        }
      }
      
      // No token or on protected page - redirect to sign-up
      if (!isAuthPage && !isSetupPage) {
        const now = Date.now();
        if (now - lastRedirectTime.current > 1000) { // Debounce redirects
          console.log('AuthGuard: Redirecting to sign-up');
          setHasRedirected(true);
          lastRedirectTime.current = now;
          router.replace('/sign-up');
        }
      }
      return;
    }
  }, [isAuthenticated, isLoading, user, pathname, router, hasRedirected]);

  // Reset redirect state when pathname changes, but with a small delay
  // to prevent immediate re-redirects
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasRedirected(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Separate useEffect for authenticated user routing
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user || hasRedirected) return;

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
    // Add a small delay to allow page-level redirects to happen first
    if (isAuthPage) {
      const now = Date.now();
      if (now - lastRedirectTime.current > 1500) { // Increased debounce to allow page redirects
        console.log('AuthGuard: On auth page but authenticated, redirecting based on setup status');
        setHasRedirected(true);
        lastRedirectTime.current = now;
        
        // Use setTimeout to allow any page-level redirects to complete first
        setTimeout(() => {
          if (user.isSetupComplete) {
            console.log('AuthGuard: Setup complete, redirecting to home');
            router.replace('/home');
          } else {
            console.log('AuthGuard: Setup not complete, redirecting to SignInSetUp');
            router.replace('/SignInSetUp');
          }
        }, 300);
      }
      return;
    }

    // If trying to access protected pages without completing setup
    if (isProtectedPage && !user.isSetupComplete) {
      const now = Date.now();
      if (now - lastRedirectTime.current > 1000) { // Debounce redirects
        console.log('AuthGuard: Trying to access protected page without setup, redirecting to SignInSetUp');
        setHasRedirected(true);
        lastRedirectTime.current = now;
        router.replace('/SignInSetUp');
      }
      return;
    }

    // If setup is complete but on setup pages, redirect to home
    if (isSetupPage && user.isSetupComplete) {
      const now = Date.now();
      if (now - lastRedirectTime.current > 1000) { // Debounce redirects
        console.log('AuthGuard: Setup complete but on setup page, redirecting to home');
        setHasRedirected(true);
        lastRedirectTime.current = now;
        router.replace('/home');
      }
      return;
    }

    // If user is on root path and authenticated, redirect to home
    // Note: Root page also handles this, but AuthGuard is a backup
    if (pathname === '/') {
      const now = Date.now();
      if (now - lastRedirectTime.current > 1000) { // Debounce redirects
        console.log('AuthGuard: On root path, redirecting to home');
        setHasRedirected(true);
        lastRedirectTime.current = now;
        router.replace('/home');
      }
      return;
    }

    console.log('AuthGuard: All checks passed, allowing access to:', pathname);
  }, [isAuthenticated, isLoading, user, pathname, router, hasRedirected]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400 text-lg">Connecting to DeMedia...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we establish a secure connection</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};