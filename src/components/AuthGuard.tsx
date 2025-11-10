"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user, validateToken } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const lastRedirectTime = useRef<number>(0);

  // Pages config
  const authPages = ["/sign-in", "/sign-up"];
  const setupPages = ["/SignInSetUp", "/interests", "/FinishSetup"];
  const protectedPrefixes = ["/home", "/profile", "/messaging"];

  const safeRedirect = (to: string) => {
    const now = Date.now();
    if (now - lastRedirectTime.current < 700) return;
    lastRedirectTime.current = now;
    router.replace(to);
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoading) return; // wait for auth state

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      // If no token, redirect to sign-up (unless already on auth pages)
      if (!token && !authPages.includes(pathname) && !setupPages.includes(pathname)) {
        safeRedirect("/sign-up");
        return;
      }

      // Optional: validate token with backend
      const isValid = token ? await validateToken(token) : false;
      if (token && !isValid) {
        localStorage.removeItem("token");
        safeRedirect("/sign-up");
        return;
      }

      // If user data not loaded yet, wait
      if (!user && token) return;

      // Authenticated user logic
      if (user) {
        const isAuthPage = authPages.includes(pathname);
        const isSetupPage = setupPages.includes(pathname);
        const isProtectedPage = protectedPrefixes.some((p) => pathname.startsWith(p));

        if (isAuthPage) {
          safeRedirect(user.isSetupComplete ? "/home" : "/SignInSetUp");
          return;
        }

        if (isProtectedPage && !user.isSetupComplete) {
          safeRedirect("/SignInSetUp");
          return;
        }

        if (isSetupPage && user.isSetupComplete) {
          safeRedirect("/home");
          return;
        }

        if (pathname === "/") {
          safeRedirect("/home");
          return;
        }
      }

      setReady(true); // all checks passed
    };

    checkAuth();
  }, [isAuthenticated, isLoading, user, pathname, router]);

  // Loading screen
  if (!ready || isLoading) {
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