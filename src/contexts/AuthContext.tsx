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
// داخل AuthContextType


// داخل AuthProvider

// ثم نضيفها في قيمة الـ context


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
  const updateUser = (newData: Partial<User>) => {
  setUser(prev => (prev ? { ...prev, ...newData } : null));
};


  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!user && !!token;

  // Load token from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("token");
    if (saved) {
      setToken(saved);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch current user from backend
  const fetchUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          setToken(null);
        }
        setUser(null);
        return;
      }

      const body = await res.json().catch(() => null);
      const userObj: User | null = body?.user ?? body ?? null;
      setUser(userObj);
    } catch (err) {
      console.error("[Auth] fetchUser error:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchUser();
    else {
      setUser(null);
      setIsLoading(false);
    }
  }, [token, fetchUser]);

  const refreshUser = async () => {
    await fetchUser();
  };

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

      if (data?.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        return { success: true };
      }

      await fetchUser();
      return user ? { success: true } : { success: false, message: "Login succeeded but no token returned" };
    } catch (err: any) {
      console.error("[Auth] login error:", err);
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

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.message || data?.error || `Registration failed (${res.status})`;
        return { success: false, message: msg };
      }

      if (data?.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        return { success: true };
      }

      await fetchUser();
      return { success: true };
    } catch (err: any) {
      console.error("[Auth] register error:", err);
      return { success: false, message: err?.message || "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth:logout"));
    router.push("/sign-up");
  };

  // =======================
  // ✅ completeSetup
  // sets isSetupComplete = true in backend
  // =======================
  const completeSetup = async (): Promise<void> => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/complete-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        // refresh user after setup complete
        await fetchUser();
      } else {
        const errText = await res.text();
        console.error("[Auth] completeSetup failed:", res.status, errText);
      }
    } catch (err) {
      console.error("[Auth] completeSetup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};