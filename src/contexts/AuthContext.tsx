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

  const updateUser = (newData: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...newData } : null));
  };

  // Fetch current user from backend
  const fetchUser = useCallback(async (authToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
        throw new Error(`Failed to fetch user: ${res.status}`);
      }

      const body = await res.json();
      const userObj: User | null = body?.user ?? body ?? null;
      
      if (userObj) {
        setUser(userObj);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("[Auth] fetchUser error:", err);
      setUser(null);
    }
  }, []);

  // Load token from localStorage and fetch user
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      const savedToken = localStorage.getItem("token");
      
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      setToken(savedToken);
      
      try {
        await fetchUser(savedToken);
      } catch (error) {
        console.error("[Auth] Initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [fetchUser]);

  const refreshUser = async () => {
    if (token) {
      await fetchUser(token);
    }
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
        // Fetch user data with the new token
        await fetchUser(data.token);
        return { success: true };
      }

      return { success: false, message: "Login succeeded but no token returned" };
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
        // Fetch user data with the new token
        await fetchUser(data.token);
        return { success: true };
      }

      return { success: false, message: "Registration succeeded but no token returned" };
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
    setIsLoading(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
    // Use replace to avoid adding logout to history
    router.replace("/sign-up");
  };

  const completeSetup = async (): Promise<void> => {
    if (!token || !user) return;
    
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
        // Update local state immediately for better UX
        setUser(prev => prev ? { ...prev, isSetupComplete: true } : null);
        // Then refresh from backend to ensure consistency
        await refreshUser();
      } else {
        const errText = await res.text();
        console.error("[Auth] completeSetup failed:", res.status, errText);
        throw new Error(`Setup completion failed: ${res.status}`);
      }
    } catch (err) {
      console.error("[Auth] completeSetup error:", err);
      throw err;
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
      {children}
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