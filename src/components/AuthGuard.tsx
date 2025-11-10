// src/components/AuthGuard.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, token, isLoading, validateToken } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const lastRedirectTime = useRef<number>(0);

  // configuration: pages and protected prefixes
  const authPages = ["/sign-in", "/sign-up"];
  const setupPages = ["/SignInSetUp", "/interests", "/FinishSetup"];
  const protectedPrefixes = ["/home", "/profile", "/messaging", "/messeging"];

  const safeReplace = (to: string) => {
    const now = Date.now();
    if (now - lastRedirectTime.current < 700) return;
    lastRedirectTime.current = now;
    router.replace(to);
  };

  const hasRedirected = useRef(false);

useEffect(() => {
  let mounted = true;

  const checkAuth = async () => {
    if (isLoading) return;

    // determine page type
    const isAuthPage = authPages.includes(pathname);
    const isSetupPage = setupPages.includes(pathname);
    const isProtectedPage = protectedPrefixes.some((p) => pathname.startsWith(p));

    const tokenValid = await validateToken(token);

    console.log("[AuthGuard Debug]", {
      pathname,
      token: token ? "exists" : "null",
      tokenValid,
      user: user ? `exists (id: ${user.id})` : "null",
      isAuthPage,
      isSetupPage,
      isProtectedPage,
    });

    if (!tokenValid) {
      if (!isAuthPage && !isSetupPage && !hasRedirected.current && mounted) {
        safeReplace("/sign-up");
        hasRedirected.current = true;
      }
      setInitialCheckDone(true);
      return;
    }

    if (!user) {
      console.log("[AuthGuard] Token valid but no user data yet, waiting...");
      return;
    }

    // User authenticated
    console.log("[AuthGuard] User authenticated:", user.id);

    // Auth pages
    if (isAuthPage && !hasRedirected.current) {
      if (user.isSetupComplete) safeReplace("/home");
      else safeReplace("/SignInSetUp");
      hasRedirected.current = true;
      setInitialCheckDone(true);
      return;
    }

    // Setup pages
    if (isSetupPage && user.isSetupComplete && !hasRedirected.current) {
      safeReplace("/home");
      hasRedirected.current = true;
      setInitialCheckDone(true);
      return;
    }

    // Protected pages
    if (isProtectedPage && !user.isSetupComplete && !hasRedirected.current) {
      safeReplace("/SignInSetUp");
      hasRedirected.current = true;
      setInitialCheckDone(true);
      return;
    }

    // Root fallback
    if (pathname === "/" && !hasRedirected.current) {
      safeReplace("/home");
      hasRedirected.current = true;
      setInitialCheckDone(true);
      return;
    }

    // All checks passed
    setInitialCheckDone(true);
  };

  checkAuth();

  return () => {
    mounted = false;
  };
}, [user, token, isLoading, pathname, router, validateToken]);
  // show loading spinner while waiting for auth state
  if (isLoading || !initialCheckDone) {
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

  return <>{children}</>;
};

export default AuthGuard;