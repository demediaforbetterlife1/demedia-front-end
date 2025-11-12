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





