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
  phoneNumber: string;
  profilePicture?: string;
  coverPhoto?: string;
  bio?: string;
  isSetupComplete?: boolean;
}

interface AuthResult {
  success: boolean;
  message?: string;
}

interface RegisterData {
  name: string;
  username: string;
  phoneNumber: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, pass: string) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const isAuthenticated = !!(user && token);

  // ✅ Validate token structure
  const isValidToken = (token: string | null) => {
    if (!token) return false;
    const parts = token.split(".");
    return parts.length === 3 && token.length > 20;
  };

  // ✅ Fetch user from backend
  const fetchUser = useCallback(async (authToken: string): Promise<User | null> => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.user || data;
    } catch {
      return null;
    }
  }, []);

  // ✅ Initialize authentication
  useEffect(() => {
    (async () => {
      const saved = localStorage.getItem("token");
      if (!saved || !isValidToken(saved)) {
        setIsLoading(false);
        setReady(true);
        return;
      }

      setToken(saved);
      const userData = await fetchUser(saved);
      if (userData) {
        setUser(userData);
      } else {
        localStorage.removeItem("token");
        setToken(null);
      }
      setIsLoading(false);
      setReady(true);
    })();
  }, [fetchUser]);

  const login = async (phoneNumber: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.token) throw new Error(data?.message);
      localStorage.setItem("token", data.token);
      setToken(data.token);
      const userData = await fetchUser(data.token);
      setUser(userData);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok || !body?.token) throw new Error(body?.message);
      localStorage.setItem("token", body.token);
      setToken(body.token);
      const userData = await fetchUser(body.token);
      setUser(userData);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    router.replace("/sign-up");
  };

  const refreshUser = async () => {
    if (token) {
      const userData = await fetchUser(token);
      setUser(userData);
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  };

  if (!ready)
    return (
      <div className="h-screen flex flex-col justify-center items-center text-cyan-400">
        <div className="animate-spin border-2 border-cyan-400 w-14 h-14 rounded-full mb-4"></div>
        <p>Connecting to DeMedia...</p>
      </div>
    );

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isAuthenticated, login, register, logout, refreshUser, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};