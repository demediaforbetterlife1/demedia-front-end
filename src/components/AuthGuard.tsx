"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // state to avoid multiple redirects in quick succession
  const [blocked, setBlocked] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
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
    if (isLoading) {
      setBlocked(true);
      return;
    }

    // no longer loading
    setBlocked(false);
    setInitialCheckDone(true);

    // Normalize flags
    const isAuthPage = authPages.includes(pathname);
    const isSetupPage = setupPages.includes(pathname);
    const isProtectedPage = protectedPrefixes.some((p) => pathname.startsWith(p));

    // Get token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    console.log("[AuthGuard Debug]", {
      token: token ? "exists" : "null",
      user: user ? `exists (id: ${user.id})` : "null",
      isAuthenticated,
      pathname,
      isAuthPage,
      isSetupPage,
      isProtectedPage
    });

    // FIXED: More robust authentication check
    if (!token) {
      // No token at all - definitely not authenticated
      if (!isAuthPage && !isSetupPage) {
        console.log("[AuthGuard] No token, redirecting to sign-up");
        safeReplace("/sign-up");
      }
      return;
    }

    // We have a token, but no user data yet
    if (!user) {
      console.log("[AuthGuard] Token exists but no user data, waiting...");
      return;
    }

    // FIXED: Now we definitely have both token and user
    console.log("[AuthGuard] User authenticated:", user.id);

    // If authenticated & on auth pages => send to appropriate place
    if (isAuthPage) {
      if (user.isSetupComplete) {
        console.log("[AuthGuard] On auth page with completed setup, going home");
        safeReplace("/home");
      } else {
        console.log("[AuthGuard] On auth page without setup, going to setup");
        safeReplace("/SignInSetUp");
      }
      return;
    }

    // If user is authenticated but trying to access protected pages without completing setup
    if (isProtectedPage && !user.isSetupComplete) {
      console.log("[AuthGuard] Protected page without setup, redirecting to setup");
      safeReplace("/SignInSetUp");
      return;
    }

    // If user has completed setup but is on setup pages, send to home
    if (isSetupPage && user.isSetupComplete) {
      console.log("[AuthGuard] Setup page but setup complete, going home");
      safeReplace("/home");
      return;
    }

    // If user is authenticated and on root path — redirect to home (backup)
    if (pathname === "/") {
      console.log("[AuthGuard] Root path, going home");
      safeReplace("/home");
      return;
    }

    console.log("[AuthGuard] All checks passed, allowing access to:", pathname);
  }, [isAuthenticated, isLoading, user, pathname, router]);

  // FIXED: Better loading state handling
  if (isLoading || (blocked && !initialCheckDone)) {
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