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

  const isValidToken = (token: string | null) => {
    if (!token) return false;
    const parts = token.split(".");
    return parts.length === 3 && token.length > 30;
  };

  const fetchUser = useCallback(async (authToken: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          console.warn("[Auth] Invalid token — clearing storage");
          localStorage.removeItem("token");
          setUser(null);
          setToken(null);
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
  }, []);

  // 🔹 Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("token");
      if (!savedToken || !isValidToken(savedToken)) {
        setIsLoading(false);
        setInitialized(true);
        return;
      }

      setToken(savedToken);
      const userFetched = await fetchUser(savedToken);

      setIsLoading(false);
      setInitialized(true);

      if (!userFetched) {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      }
    };

    initAuth();
  }, [fetchUser]);

  const refreshUser = async () => {
    if (token) await fetchUser(token);
  };

  const login = async (phoneNumber: string, password: string): Promise<AuthResult> => {
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
      if (isValidToken(newToken)) {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        const userFetched = await fetchUser(newToken);
        if (userFetched) {
          router.replace("/home");
        }
        return { success: true };
      }

      return { success: false, message: "Invalid token received" };
    } catch (err: any) {
      return { success: false, message: err?.message || "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<AuthResult> => {
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
      if (isValidToken(newToken)) {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        const userFetched = await fetchUser(newToken);
        if (userFetched) {
          router.replace("/SignInSetUp");
        }
        return { success: true };
      }

      return { success: false, message: "Invalid token received" };
    } catch (err: any) {
      return { success: false, message: err?.message || "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.replace("/sign-up");
  };

  const completeSetup = async (): Promise<void> => {
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
  };

  // 🔹 Auto redirect when user logs in or setup completes
  useEffect(() => {
    if (!initialized || isLoading) return;

    if (user && token) {
      if (user.isSetupComplete) {
        router.replace("/home");
      } else {
        router.replace("/SignInSetUp");
      }
    }
  }, [user, token, initialized, isLoading, router]);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};