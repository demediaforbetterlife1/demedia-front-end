"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string | null;
  coverPhoto?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  dateOfBirth?: string | null;
  isSetupComplete?: boolean;
  createdAt?: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
}

export interface RegisterData {
  name: string;
  username: string;
  phoneNumber: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<boolean>;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initComplete, setInitComplete] = useState<boolean>(false);

  const isAuthenticated = !!(user && initComplete);

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const fetchUser = useCallback(async (): Promise<boolean> => {
    try {
      // call /api/auth/me which should read the server cookie and return user if session exists
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        // treat 401 or other errors as not authenticated
        setUser(null);
        return false;
      }

      const body = await res.json().catch(() => null);
      const u = body?.user ?? body ?? null;
      if (u && (u as any).id) {
        setUser(u);
        return true;
      }
      setUser(null);
      return false;
    } catch (err) {
      console.error("[Auth] fetchUser error", err);
      setUser(null);
      return false;
    }
  }, []);

  // Initialization: try to read session from cookie via /me
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const ok = await fetchUser();
        if (!mounted) return;
        setInitComplete(true);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fetchUser]);

  const login = async (phoneNumber: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.message || data?.error || `Login failed (${res.status})`;
        return { success: false, message };
      }

      // Important: do NOT rely on reading cookies client-side here.
      // Instead, call fetchUser which will validate session via the cookie that the server set.
      const ok = await fetchUser();
      if (!ok) {
        return { success: false, message: "Login succeeded but failed to load user" };
      }

      // Broadcast login event for other listeners
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:login"));
      }

      return { success: true };
    } catch (err: any) {
      console.error("[Auth] login error", err);
      return { success: false, message: err?.message || "Login error" };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (dataIn: RegisterData): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataIn),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.message || data?.error || `Registration failed (${res.status})`;
        return { success: false, message };
      }

      // after successful signup, load user session
      const ok = await fetchUser();
      if (!ok) return { success: false, message: "Signed up but failed to load user" };

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:login"));
      }

      return { success: true };
    } catch (err: any) {
      console.error("[Auth] register error", err);
      return { success: false, message: err?.message || "Registration error" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Ask server to clear cookie (recommended). If backend doesn't have endpoint,
      // ensure server-side cookie expiry is handled.
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => null);
    } catch (err) {
      console.error("[Auth] logout error", err);
    }

    setUser(null);
    setIsLoading(false);
    setInitComplete(true);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }

    // safe client redirect
    try {
      router.replace("/sign-in");
    } catch (e) {
      // ignore in non-router contexts
    }
  };

  const refreshUser = async (): Promise<boolean> => await fetchUser();

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};


/* ==================================================================================
   File: src/components/AuthGuard.tsx
   Purpose: Simplified, robust AuthGuard for App Router.
   - Normalizes pathname checks
   - Waits for initialization (isLoading) before redirecting
   - Avoids race conditions by relying on login() promise and fetchUser
================================================================================== */

"use client";

import React, { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const pathname = (usePathname() || "/").toLowerCase();
  const router = useRouter();
  const lastRedirect = useRef<number>(0);

  useEffect(() => {
    // don't do anything until init finished
    if (isLoading) return;

    const now = Date.now();
    if (now - lastRedirect.current < 700) return; // simple debounce

    const authPages = ["/sign-in", "/sign-up", "/signin", "/signup"];
    const setupPages = ["/signinsetup", "/interests", "/finishsetup"];
    const protectedPrefixes = ["/home", "/profile", "/messaging", "/messenger", "/app"];

    const isAuthPage = authPages.includes(pathname);
    const isSetupPage = setupPages.includes(pathname);
    const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

    // not authenticated -> go to sign-in (unless already there)
    if (!isAuthenticated) {
      if (!isAuthPage) {
        lastRedirect.current = now;
        router.replace("/sign-in");
      }
      return;
    }

    // authenticated
    if (isAuthPage) {
      // redirect away from auth pages
      lastRedirect.current = now;
      if (user?.isSetupComplete) router.replace("/home");
      else router.replace("/signinsetup");
      return;
    }

    // if on protected page but setup not complete
    if (isProtected && !user?.isSetupComplete) {
      lastRedirect.current = now;
      router.replace("/signinsetup");
      return;
    }

    // otherwise allow
  }, [isAuthenticated, isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"></div>
          <p>Connecting securely…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};


/* ==================================================================================
   File: src/app/sign-in/page.tsx (Client component)
   Purpose: Example login page that uses the AuthContext and only redirects after login() resolves.
================================================================================== */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function SignInPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(phone, password);
    setLoading(false);

    if (!res.success) {
      setError(res.message || "Login failed");
      return;
    }

    // login() already awaited fetchUser and set user in context.
    // Now we can safely redirect based on user info
    const isSetup = (user && user.isSetupComplete) ?? true; // fallback true
    if (isSetup) router.replace("/home");
    else router.replace("/signinsetup");
  };

  return (
    <div className="max-w-md mx-auto py-20">
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          className="w-full p-3 border rounded"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="w-full p-3 border rounded"
        />
        <button disabled={loading} className="w-full p-3 bg-blue-600 text-white rounded">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}


/* ==================================================================================
   File: src/app/sign-up/page.tsx (Client component)
   Purpose: Example signup page that uses register() then redirects safely.
================================================================================== */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function SignUpPage() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await register({ name, username, phoneNumber: phone, password });
    setLoading(false);

    if (!res.success) {
      setError(res.message || "Registration failed");
      return;
    }

    const isSetup = (user && user.isSetupComplete) ?? false;
    if (isSetup) router.replace("/home");
    else router.replace("/signinsetup");
  };

  return (
    <div className="max-w-md mx-auto py-20">
      <h1 className="text-2xl font-bold mb-6">Create account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full p-3 border rounded" />
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full p-3 border rounded" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="w-full p-3 border rounded" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-3 border rounded" />
        <button disabled={loading} className="w-full p-3 bg-green-600 text-white rounded">{loading ? 'Creating…' : 'Create account'}</button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}


