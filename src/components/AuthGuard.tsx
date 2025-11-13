"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Public routes that don't require authentication
  const publicRoutes = ['/sign-in', '/sign-up'];
  // Setup routes that require authentication but not setup completion
  const setupRoutes = ['/SignInSetUp', '/interests', '/FinishSetup'];
  // Protected routes that require both authentication and setup completion
  const protectedRoutes = ['/home', '/profile', '/messaging', '/messeging'];

  const isPublicRoute = publicRoutes.includes(pathname);
  const isSetupRoute = setupRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    // Wait for auth to initialize
    if (isLoading) {
      setIsChecking(true);
      return;
    }

    console.log('AuthGuard Debug:', {
      isAuthenticated,
      isLoading,
      user: user ? { id: user.id, isSetupComplete: user.isSetupComplete } : null,
      pathname,
      isPublicRoute,
      isSetupRoute,
      isProtectedRoute
    });

    // If not authenticated and trying to access protected routes
    if (!isAuthenticated) {
      if (!isPublicRoute && !isSetupRoute) {
        // Add a small delay to allow login state to propagate
        const redirectTimer = setTimeout(() => {
          // Double-check auth state before redirecting
          if (!isAuthenticated && !user) {
            console.log('AuthGuard: Not authenticated after delay, redirecting to sign-up');
            router.replace('/sign-up');
          }
        }, 300);
        
        return () => clearTimeout(redirectTimer);
      }
    } else {
      // User is authenticated
      if (isPublicRoute) {
        // Redirect away from auth pages if already authenticated
        const redirectPath = user?.isSetupComplete ? '/home' : '/SignInSetUp';
        console.log('AuthGuard: Authenticated on auth page, redirecting to:', redirectPath);
        router.replace(redirectPath);
        return;
      }

      if (isProtectedRoute && !user?.isSetupComplete) {
        console.log('AuthGuard: Trying to access protected route without setup, redirecting to setup');
        router.replace('/SignInSetUp');
        return;
      }

      if (isSetupRoute && user?.isSetupComplete) {
        console.log('AuthGuard: Setup complete but on setup page, redirecting to home');
        router.replace('/home');
        return;
      }
    }

    // All checks passed, allow access
    setIsChecking(false);
  }, [isAuthenticated, isLoading, user, pathname, router, isPublicRoute, isSetupRoute, isProtectedRoute]);

  // Show loading while checking auth
  if (isLoading || isChecking) {
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