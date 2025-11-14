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
    // Wait for auth to initialize completely
    if (isLoading || !initComplete) {
      console.log('AuthGuard: Waiting for auth initialization...', { isLoading, initComplete });
      setIsChecking(true);
      return;
    }

    console.log('AuthGuard Debug:', {
      isAuthenticated,
      isLoading,
      initComplete,
      user: user ? { id: user.id, isSetupComplete: user.isSetupComplete } : null,
      pathname,
      isPublicRoute,
      isSetupRoute,
      isProtectedRoute
    });

    // FIX: Simplified logic - handle unauthenticated users first
    if (!isAuthenticated) {
      if (isPublicRoute) {
        // Allow access to public routes
        console.log('AuthGuard: Allowing access to public route');
        setIsChecking(false);
      } else {
        // Redirect to sign-up for non-public routes
        console.log('AuthGuard: Not authenticated, redirecting to sign-up');
        router.replace('/sign-up');
      }
      return;
    }

    // From this point, user is definitely authenticated
    console.log('AuthGuard: User is authenticated, checking route permissions');

    // Redirect away from auth pages if already authenticated
    if (isPublicRoute) {
      const redirectPath = user?.isSetupComplete ? '/home' : '/SignInSetUp';
      console.log('AuthGuard: Authenticated on auth page, redirecting to:', redirectPath);
      router.replace(redirectPath);
      return;
    }

    // Check setup completion for protected routes
    if (isProtectedRoute && !user?.isSetupComplete) {
      console.log('AuthGuard: Setup not complete for protected route, redirecting to setup');
      router.replace('/SignInSetUp');
      return;
    }

    // Redirect away from setup pages if setup is already complete
    if (isSetupRoute && user?.isSetupComplete) {
      console.log('AuthGuard: Setup already complete, redirecting to home');
      router.replace('/home');
      return;
    }

    // All checks passed - allow access
    console.log('AuthGuard: All checks passed, allowing access');
    setIsChecking(false);
  }, [isAuthenticated, isLoading, initComplete, user, pathname, router, isPublicRoute, isSetupRoute, isProtectedRoute]);

  // Show loading while checking auth
  if (isLoading || !initComplete || isChecking) {
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