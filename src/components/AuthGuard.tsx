// src/components/AuthGuard.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";

/**
 * AuthGuard (complete)
 *
 * Responsibilities:
 * - Blocks access to protected areas when user is not authenticated.
 * - Redirects authenticated users off auth pages to home or setup depending on isSetupComplete.
 * - Prevents rapid/multiple redirects (debounce).
 * - Waits for AuthContext to finish loading user (isLoading) before making redirect decisions.
 *
 * Notes:
 * - AuthContext must expose: { isAuthenticated, isLoading, user }
 * - user.isSetupComplete is used to decide setup redirection.
 */

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // state to avoid multiple redirects in quick succession
  const [blocked, setBlocked] = useState(false);
  const lastRedirectTime = useRef<number>(0);

  // configuration: pages and protected prefixes
  const authPages = ["/sign-in", "/sign-up"];
  const setupPages = ["/SignInSetUp", "/interests", "/FinishSetup"];
  const protectedPrefixes = ["/home", "/profile", "/messaging", "/messeging"];

  // small helper to debounce navigation
  const safeReplace = (to: string) => {
    const now = Date.now();
    // skip if we redirected very recently
    if (now - lastRedirectTime.current < 700) return;
    lastRedirectTime.current = now;
    router.replace(to);
  };

  useEffect(() => {
    // Always wait until auth state finished initial loading
    // so we don't redirect prematurely while token/user is still being fetched.
    if (isLoading) {
      // keep blocked true while loading to show spinner in UI below
      setBlocked(true);
      return;
    }

    // no longer loading
    setBlocked(false);

    // Normalize flags
    const isAuthPage = authPages.includes(pathname);
    const isSetupPage = setupPages.includes(pathname);
    const isProtectedPage = protectedPrefixes.some((p) => pathname.startsWith(p));

    // If user not authenticated OR user object is missing: redirect to sign-up (unless on auth pages)
    if (!isAuthenticated || !user) {
      // If token exists in localStorage but user still null, we still wait (no redirect).
      // This prevents redirect loops on slow networks where token exists but user fetch hasn't completed.
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      // If token exists but we have no authenticated user — avoid redirect until AuthContext finishes.
      // However since isLoading is false here, AuthContext already finished; so this means user really not present.
      if (!isAuthPage) {
        // Redirect to sign-up if not on auth pages
        safeReplace("/sign-up");
      }
      return;
    }

    // If authenticated & on auth pages => send to appropriate place
    if (isAuthPage) {
      // If user completed setup -> home, else -> SignInSetUp
      if (user.isSetupComplete) {
        safeReplace("/home");
      } else {
        safeReplace("/SignInSetUp");
      }
      return;
    }

    // If user is authenticated but trying to access protected pages without completing setup
    if (isProtectedPage && !user.isSetupComplete) {
      safeReplace("/SignInSetUp");
      return;
    }

    // If user has completed setup but is on setup pages, send to home
    if (isSetupPage && user.isSetupComplete) {
      safeReplace("/home");
      return;
    }

    // If user is authenticated and on root path — redirect to home (backup)
    if (pathname === "/") {
      safeReplace("/home");
      return;
    }

    // Otherwise allow
  }, [isAuthenticated, isLoading, user, pathname, router]);

  // Loading UI while authenticating (keeps behaviour like your original spinner)
  if (isLoading || blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-400 text-lg">Connecting to DeMedia...</p>
          <p className="text-gray-400 text-sm mt-2">
            Please wait while we establish a secure connection
          </p>
        </div>
      </div>
    );
  }

  // All checks passed — render children
  return <>{children}</>;
};

export default AuthGuard;