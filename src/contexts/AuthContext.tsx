"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  ReactNode,
} from "react";

// =======================
// ✅ Types
// =======================
export interface User {
  id: string;
  name: string;
  username: string;
  phoneNumber: string;
  profilePicture?: string;
  coverPhoto?: string;
  bio?: string;
  location?: string;
  website?: string;
  dateOfBirth?: string;
  age?: number;
  language?: string;
  privacy?: string;
  interests?: string[];
  isSetupComplete?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: {
    name: string;
    username: string;
    phoneNumber: string;
    password: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  completeSetup: () => void;
  verifyPhone: (token: string) => Promise<boolean>;
  resendPhoneVerification: (phoneNumber: string) => Promise<boolean>;
  sendVerificationCode: (phoneNumber: string, method: "whatsapp" | "sms") => Promise<boolean>;
}

// =======================
// ✅ Context Initialization
// =======================
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =======================
// ✅ Provider
// =======================
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user info
  const fetchUser = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data.user || data);
    } catch (error) {
      console.error("❌ Failed to load user:", error);
      setUser(null);
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchUser();
  }, [token, fetchUser]);

  // =======================
  // ✅ login
  // =======================
  const login = async (phoneNumber: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.message || "Login failed");

      localStorage.setItem("token", data.token);
      setToken(data.token);
      await fetchUser();

      return { success: true };
    } catch (error: any) {
      console.error("❌ Login error:", error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // ✅ register
  // =======================
  const register = async (info: { name: string; username: string; phoneNumber: string; password: string; }): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.message || "Registration failed");

      localStorage.setItem("token", data.token);
      setToken(data.token);
      await fetchUser();

      return { success: true };
    } catch (error: any) {
      console.error("❌ Register error:", error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // ✅ logout
  // =======================
  const logout = (): void => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // =======================
  // ✅ updateUser
  // =======================
  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : prev);
  };

  // =======================
  // ✅ completeSetup
  // =======================
  const completeSetup = () => {
    if (!user) return;
    setUser({ ...user, isSetupComplete: true });
  };

  // =======================
  // ✅ verifyPhone
  // =======================
  const verifyPhone = async (token: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token }),
      });
      return res.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // =======================
  // ✅ resendPhoneVerification
  // =======================
  const resendPhoneVerification = async (phoneNumber: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      return res.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // =======================
  // ✅ sendVerificationCode
  // =======================
  const sendVerificationCode = async (phoneNumber: string, method: "whatsapp" | "sms"): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, method }),
      });
      return res.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // =======================
  // ✅ Context Value
  // =======================
  const value: AuthContextType = {
    user,
    isLoading: loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    updateUser,
    completeSetup,
    verifyPhone,
    resendPhoneVerification,
    sendVerificationCode,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// =======================
// ✅ Custom Hook
// =======================
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};