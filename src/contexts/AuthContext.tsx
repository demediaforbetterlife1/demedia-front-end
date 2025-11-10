"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  ReactNode,
  useRef,
} from "react";
import { useRouter } from "next/navigation";

/* ================= Types ================= */
export interface User {
  id: string;
  name: string;
  username: string;
  phoneNumber: string;
  isSetupComplete?: boolean;
  [key: string]: any;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  authStatus: "loading" | "authenticated" | "unauthenticated";
  login: (phoneNumber: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ================= Provider ================= */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  const isMounted = useRef(false);

  const fetchUser = useCallback(async (authToken: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        setAuthStatus("unauthenticated");
        return false;
      }
      const data = await res.json();
      setUser(data.user || data);
      setAuthStatus("authenticated");
      return true;
    } catch (err) {
      setToken(null);
      setUser(null);
      setAuthStatus("unauthenticated");
      return false;
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const initAuth = async () => {
      const savedToken = localStorage.getItem("token");
      if (!savedToken) {
        setAuthStatus("unauthenticated");
        return;
      }
      setToken(savedToken);
      await fetchUser(savedToken);
    };
    initAuth();
    return () => { isMounted.current = false; };
  }, [fetchUser]);

  const login = async (phoneNumber: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });
      const data = await res.json();
      if (!res.ok) return false;
      const newToken = data.token;
      if (!newToken) return false;
      localStorage.setItem("token", newToken);
      setToken(newToken);
      await fetchUser(newToken);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (data: any) => {
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok || !result.token) return false;
      localStorage.setItem("token", result.token);
      setToken(result.token);
      await fetchUser(result.token);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setAuthStatus("unauthenticated");
  };

  const refreshUser = async () => {
    if (token) await fetchUser(token);
  };

  return (
    <AuthContext.Provider value={{ user, token, authStatus, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};