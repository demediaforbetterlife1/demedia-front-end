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

/**
 * AuthContext (TypeScript) — نسخة متكاملة
 *
 * - البيانات (user) تأتي من الباك-اند فقط (/api/auth/me).
 * - الـ JWT مخزن في localStorage فقط (token).
 * - لا يوجد منطق تحقق بالهاتف هنا (phone verification) — تمت إزالته حسب طلبك.
 * - هذا ملف Client Component (use client).
 */

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
  isPhoneVerified?: boolean;
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
  token: string | null; // token exposed (matching النسخة القديمة)
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string, password: string) => Promise<AuthResult>;
  register: (userData: RegisterData) => Promise<AuthResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

/* =======================
   ✅ Context init
   ======================= */
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

/* =======================
   ✅ Provider
   ======================= */
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!user && !!token;

  // Load token from localStorage on mount (only token)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const saved = localStorage.getItem("token");
      if (saved) {
        setToken(saved);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("[Auth] failed to read token:", err);
      setIsLoading(false);
    }
  }, []);

  // Fetch current user from backend (source of truth)
  const fetchUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // do not rely on cached user
        cache: "no-store",
      });

      if (!res.ok) {
        // if unauthorized, remove token
        if (res.status === 401) {
          console.warn("[Auth] token invalid/expired, clearing token");
          localStorage.removeItem("token");
          setToken(null);
        }
        setUser(null);
        return;
      }

      const body = await res.json().catch(() => null);
      // backend may return either { user: {...} } or user object directly
      const userObj: User | null = body?.user ?? body ?? null;
      if (userObj) {
        setUser(userObj);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("[Auth] fetchUser error:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // When token changes (e.g. login/register), fetch the user
  useEffect(() => {
    if (token) {
      // immediate fetch
      fetchUser();
    } else {
      // no token -> not authenticated
      setUser(null);
      setIsLoading(false);
    }
  }, [token, fetchUser]);

  // Refresh user helper (exposed)
  const refreshUser = async () => {
    await fetchUser();
  };

  /* =======================
     ✅ login (phoneNumber + password)
     - Save token only in localStorage
     - Fetch user from backend (source of truth)
     ======================= */
  const login = async (
    phoneNumber: string,
    password: string
  ): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.message || data?.error || `Login failed (${res.status})`;
        return { success: false, message: msg };
      }

      // expect { token: "...", user?: {...} } but we fetch user from /api/auth/me to be safe
      if (data?.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        // fetchUser will run due to token change
        return { success: true };
      }

      // If no token returned but success (rare), fallback: try to fetch user
      await fetchUser();
      if (user) return { success: true };
      return { success: false, message: "Login succeeded but no token returned" };
    } catch (err: any) {
      console.error("[Auth] login error:", err);
      return { success: false, message: err?.message || "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================
     ✅ register (phoneNumber signup)
     - store token if backend returns it
     - load user from backend
     ======================= */
  const register = async (userData: RegisterData): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.message || data?.error || `Registration failed (${res.status})`;
        return { success: false, message: msg };
      }

      if (data?.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        // user will be fetched automatically by fetchUser
        return { success: true };
      }

      // if backend didn't return token, still try to fetch user
      await fetchUser();
      if (user) return { success: true };
      return { success: true };
    } catch (err: any) {
      console.error("[Auth] register error:", err);
      return { success: false, message: err?.message || "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================
     ✅ logout
     ======================= */
  const logout = (): void => {
    try {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      // optional: notify other tabs
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth:logout"));
      router.push("/sign-up");
    } catch (err) {
      console.error("[Auth] logout error:", err);
    }
  };

  /* =======================
     Context value
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

/* =======================
   ✅ Custom hook
   ======================= */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};