"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, initComplete, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Public routes that don't require authentication
  const publicRoutes = ['/sign-in', '/sign-up'];
  // Setup routes that require authentication but not setup completion
  const setupRoutes = ['/SignInSetUp', '/interests', '/FinishSetup'];
  // Protected routes that require both authentication and setup completion
  const protectedRoutes = ['/home', '/profile', '/messeging'];

  const isPublicRoute = publicRoutes.includes(pathname);
  const isSetupRoute = setupRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    // Only wait for initial auth initialization, not ongoing auth operations
    if (!initComplete) {
      console.log('AuthGuard: Auth initialization not complete, waiting...', { 
        isLoading, 
        initComplete, 
        pathname 
      });
      return;
    }

    // If we're in the middle of auth initialization (not user operations), wait
    if (isLoading && !user) {
      console.log('AuthGuard: Auth still initializing user state, waiting...', { 
        isLoading, 
        initComplete, 
        user: user ? 'exists' : 'null',
        pathname 
      });
      return;
    }

    console.log('AuthGuard: Auth initialized, processing route...', {
      isAuthenticated,
      user: user ? { id: user.id, isSetupComplete: user.isSetupComplete } : null,
      pathname,
      isPublicRoute,
      isSetupRoute,
      isProtectedRoute
    });

    // Handle unauthenticated users
    if (!isAuthenticated || !user) {
      if (isPublicRoute) {
        console.log('AuthGuard: Unauthenticated user on public route - allowing access');
        return;
      } else {
        console.log('AuthGuard: Unauthenticated user on protected route - redirecting to sign-in');
        router.replace('/sign-in');
        return;
      }
    }

    // Handle authenticated users
    console.log('AuthGuard: User authenticated, checking route permissions');

    // Redirect authenticated users away from auth pages
    if (isPublicRoute) {
      const redirectPath = user.isSetupComplete ? '/home' : '/SignInSetUp';
      console.log('AuthGuard: Authenticated user on auth page - redirecting to:', redirectPath);
      router.replace(redirectPath);
      return;
    }

    // Check setup completion for protected routes
    if (isProtectedRoute && !user.isSetupComplete) {
      console.log('AuthGuard: Authenticated user needs setup - redirecting to SignInSetUp');
      router.replace('/SignInSetUp');
      return;
    }

    // Redirect away from setup pages if setup is complete
    if (isSetupRoute && user.isSetupComplete) {
      console.log('AuthGuard: Setup complete user on setup page - redirecting to home');
      router.replace('/home');
      return;
    }

    console.log('AuthGuard: All checks passed - allowing access to:', pathname);
  }, [isAuthenticated, isLoading, initComplete, user, pathname, router, isPublicRoute, isSetupRoute, isProtectedRoute]);

  // Show loading while auth is initializing
  if (isLoading || !initComplete) {
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
