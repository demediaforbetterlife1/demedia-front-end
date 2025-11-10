// src/contexts/AuthContext.tsx
"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

/* =======================
   ✅ Types
   ======================= */
export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  phoneNumber: string;
  profilePicture?: string;
  coverPhoto?: string;
  bio?: string;
  location?: string;
  website?: string;
  dateOfBirth?: string;
  dob?: string;
  age?: number;
  language?: string;
  preferredLang?: string;
  privacy?: string;
  interests?: string[];
  isSetupComplete?: boolean;
  createdAt?: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
}

export interface LoginCredentials {
  phoneNumber: string;
  password: string;
}

export interface RegisterData {
  name: string;
  username: string;
  phoneNumber: string;
  password: string;
}

/* =======================
   ✅ Context Type
   ======================= */
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string, password: string) => Promise<AuthResult>;
  register: (userData: RegisterData) => Promise<AuthResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  completeSetup: () => Promise<void>;
  updateUser: (newData: Partial<User>) => void;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  validateToken: (token: string | null) => Promise<boolean>;
}

/* =======================
   ✅ Context init
   ======================= */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* =======================
   ✅ Provider
   ======================= */
interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = "token";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);

  const isAuthenticated = !!user && !!token;

  const updateUser = (newData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...newData } : prev));
  };

  /* =======================
     JWT Helpers
     - basic structure check
     - decode payload and check exp claim
     ======================= */
  const isValidTokenStructure = (t: string | null) => {
    if (!t) return false;
    const parts = t.split(".");
    return parts.length === 3 && t.length > 30;
  };

  const decodeJwtPayload = (t: string) => {
    try {
      const payload = t.split(".")[1];
      // add padding if needed
      const safeB64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const pad = safeB64.length % 4 === 0 ? safeB64 : safeB64 + "=".repeat(4 - (safeB64.length % 4));
      const json = atob(pad);
      return JSON.parse(json);
    } catch (err) {
      return null;
    }
  };

  const isTokenExpired = (t: string) => {
    const payload = decodeJwtPayload(t);
    if (!payload) return true;
    // exp in seconds since epoch
    if (typeof payload.exp === "number") {
      const nowSec = Math.floor(Date.now() / 1000);
      return payload.exp <= nowSec;
    }
    return false;
  };

  /**
   * validateToken:
   * - checks structure + expiry
   * - optionally checks server by calling /api/auth/me (safe, non-mutating)
   */
  const validateToken = useCallback(async (t: string | null): Promise<boolean> => {
    if (!t) return false;
    if (!isValidTokenStructure(t)) return false;
    if (isTokenExpired(t)) return false;

    // quick server-side check (non mutating) to ensure server recognizes token
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
        },
      });
      return res.ok;
    } catch (err) {
      // network error => treat as invalid for safety (caller can retry)
      return false;
    }
  }, []);

  /* =======================
     fetchUser: fetches /api/auth/me and sets user state
     returns boolean success
     ======================= */
  const fetchUser = useCallback(
    async (authToken: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            // invalid token on server
            console.warn("[Auth] fetchUser: 401 invalid token");
            localStorage.removeItem(TOKEN_KEY);
            setToken(null);
            setUser(null);
          }
          return false;
        }

        const data = await res.json();
        const fetchedUser = data?.user ?? data;
        if (fetchedUser?.id) {
          setUser(fetchedUser);
          return true;
        }

        return false;
      } catch (err) {
        console.error("[Auth] fetchUser failed:", err);
        return false;
      }
    },
    []
  );

  /* =======================
     initAuth: run on mount
     - read token
     - validate quickly
     - fetch user if valid
     ======================= */
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const savedToken = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
        if (!savedToken) {
          if (!mounted) return;
          setIsLoading(false);
          setInitialized(true);
          return;
        }

        // quick local checks
        if (!isValidTokenStructure(savedToken) || isTokenExpired(savedToken)) {
          localStorage.removeItem(TOKEN_KEY);
          if (!mounted) return;
          setIsLoading(false);
          setInitialized(true);
          return;
        }

        // set token state early so other hooks can access it
        if (!mounted) return;
        setToken(savedToken);

        // server-side verify & fetch user
        const ok = await fetchUser(savedToken);

        if (!mounted) return;
        if (!ok) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error("[Auth] initAuth error:", err);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
        setInitialized(true);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [fetchUser]);

  /* =======================
     authFetch: wrapper around fetch that:
     - attaches Authorization header if token exists
     - if response 401 => clears auth state (no redirect)
     - returns original response for caller to handle
     ======================= */
  const authFetch = useCallback(
    async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
      const finalInit: RequestInit = { ...(init || {}) };

      // attach headers safely
      const headers = new Headers(finalInit.headers || {});
      headers.set("Content-Type", headers.get("Content-Type") || "application/json");

      const currentToken = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : token;
      if (currentToken) {
        headers.set("Authorization", `Bearer ${currentToken}`);
      }

      finalInit.headers = headers;

      try {
        const res = await fetch(input, finalInit);

        if (res.status === 401) {
          // centralized handling: clear local auth state, but DO NOT force redirect
          console.warn("[Auth] authFetch received 401 — clearing token and user");
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }

        return res;
      } catch (err) {
        // network error — rethrow so caller can handle
        throw err;
      }
    },
    [token]
  );

  /* =======================
     login / register / logout / refreshUser / completeSetup
     - only these functions perform router.replace navigation
     - prevents unexpected redirects on arbitrary state changes
     ======================= */
  const login = useCallback(
    async (phoneNumber: string, password: string): Promise<AuthResult> => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber, password }),
        });

        const data = await res.json();
        if (!res.ok) return { success: false, message: data?.message || "Login failed" };

        const newToken = data?.token;
        if (!newToken || !isValidTokenStructure(newToken) || isTokenExpired(newToken)) {
          return { success: false, message: "Invalid token received" };
        }

        // persist token & set state
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);

        // fetch user immediately (and wait)
        const userFetched = await fetchUser(newToken);
        if (!userFetched) {
          // if server didn't accept token, clear it
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setIsLoading(false);
          return { success: false, message: "Failed to fetch user after login" };
        }

        // navigate based on setup
        if (user && user.isSetupComplete) {
          router.replace("/home");
        } else {
          // we fetched user in fetchUser; get latest user
          const u = (await (async () => {
            // safe read current user state
            return user;
          })()) as User | null;
          if (u && u.isSetupComplete) router.replace("/home");
          else router.replace("/SignInSetUp");
        }

        return { success: true };
      } catch (err: any) {
        console.error("[Auth] login error:", err);
        return { success: false, message: err?.message || "Login failed" };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchUser, router, user]
  );

  const register = useCallback(
    async (userData: RegisterData): Promise<AuthResult> => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });

        const data = await res.json();
        if (!res.ok) return { success: false, message: data?.message || "Registration failed" };

        const newToken = data?.token;
        if (!newToken || !isValidTokenStructure(newToken) || isTokenExpired(newToken)) {
          return { success: false, message: "Invalid token received" };
        }

        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);

        const userFetched = await fetchUser(newToken);
        if (!userFetched) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setIsLoading(false);
          return { success: false, message: "Failed to fetch user after registration" };
        }

        // after successful registration, go to setup
        router.replace("/SignInSetUp");
        return { success: true };
      } catch (err: any) {
        console.error("[Auth] register error:", err);
        return { success: false, message: err?.message || "Registration failed" };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchUser, router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    // keep explicit redirect on logout only
    router.replace("/sign-up");
  }, [router]);

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!token) return;
    await fetchUser(token);
  }, [token, fetchUser]);

  const completeSetup = useCallback(async (): Promise<void> => {
    if (!token) return;
    try {
      const res = await fetch("/api/auth/complete-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setUser((prev) => (prev ? { ...prev, isSetupComplete: true } : prev));
        router.replace("/home");
      } else {
        console.error("[Auth] Failed to complete setup:", res.status);
      }
    } catch (err) {
      console.error("[Auth] completeSetup error:", err);
    }
  }, [token, router]);

  /* =======================
     Expose context value
     ======================= */
  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    completeSetup,
    updateUser,
    authFetch,
    validateToken,
  };

  /* =======================
     Render
     ======================= */
  // We keep provider rendering even if not initialized — components can read isLoading/initialized if they need.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};