"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, authStatus } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const hasRedirected = useRef(false);

  const authPages = ["/sign-in", "/sign-up"];
  const setupPages = ["/SignInSetUp", "/interests", "/FinishSetup"];
  const protectedPrefixes = ["/home", "/profile", "/messaging", "/messeging"];

  const safeReplace = (to: string) => {
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(to);
    }
  };

  useEffect(() => {
    if (authStatus === "loading") return;

    const isAuthPage = authPages.includes(pathname);
    const isSetupPage = setupPages.includes(pathname);
    const isProtectedPage = protectedPrefixes.some(p => pathname.startsWith(p));

    // User not authenticated
    if (authStatus === "unauthenticated" && !isAuthPage && !isSetupPage) {
      safeReplace("/sign-up");
      setInitialCheckDone(true);
      return;
    }

    // User authenticated
    if (authStatus === "authenticated") {
      if (isAuthPage) {
        if (user?.isSetupComplete) safeReplace("/home");
        else safeReplace("/SignInSetUp");
        setInitialCheckDone(true);
        return;
      }

      if (isSetupPage && user?.isSetupComplete) {
        safeReplace("/home");
        setInitialCheckDone(true);
        return;
      }

      if (isProtectedPage && !user?.isSetupComplete) {
        safeReplace("/SignInSetUp");
        setInitialCheckDone(true);
        return;
      }

      if (pathname === "/") {
        safeReplace("/home");
        setInitialCheckDone(true);
        return;
      }
    }

    // If all checks passed
    setInitialCheckDone(true);
  }, [authStatus, user, pathname, router]);

  if (!initialCheckDone || authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-400 text-lg">Connecting to DeMedia...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we establish a secure connection</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;