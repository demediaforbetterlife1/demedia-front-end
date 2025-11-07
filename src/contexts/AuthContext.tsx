// src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";
import axios from "axios";
import { notificationService } from "@/services/notificationService";

interface User {
  id: string;
  name: string;
  email?: string;
  username: string;
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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (phoneNumber: string, password: string) => Promise<User>;
  register: (data: Partial<User> & { password: string }) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  completeSetup: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const { setLanguage } = useI18n();

  const isAuthenticated = !!user;

  // helper to apply token to axios
  const applyAxiosToken = (tkn: string | null) => {
    if (tkn) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${tkn}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // ✅ Load token from localStorage on mount and fetch user
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    // لو الـ user متسجّل بالفعل من login، بلاش نجيب نفس البيانات تاني
    if (user) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    applyAxiosToken(storedToken);

    (async () => {
      try {
        const res = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        const userData: User = res.data.user || res.data;
        setUser(userData);
        if (userData?.language) setLanguage(userData.language);
      } catch (err) {
        console.warn("Failed to load user from token:", err);
        applyAxiosToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user]);

  // ✅ Login
  const login = async (phoneNumber: string, password: string): Promise<User> => {
  setIsLoading(true);
  try {
    const res = await axios.post("/api/auth/login", { phoneNumber, password });
    const newToken = res.data.token || (res.data.user && res.data.user.token) || null;
    const userData: User = res.data.user || res.data;

    if (!newToken) throw new Error("No token returned from server.");

    // ✅ خزّن التوكن فورًا قبل أي إعادة توجيه
    localStorage.setItem("token", newToken);
    setToken(newToken);
    applyAxiosToken(newToken);
    setUser(userData);

    if (userData.language) setLanguage(userData.language);
    if (userData.name) notificationService.showWelcomeNotification(userData.name);

    // ✅ استخدم router.push بدلاً من replace لتجنب مشاكل hydration
    const target = userData.isSetupComplete ? "/home" : "/SignInSetUp";
    setTimeout(() => router.push(target), 200); // تأخير بسيط عشان يضمن إن الـ state اتحفظت

    return userData;
  } catch (err: any) {
    console.error("Login failed:", err);
    throw err;
  } finally {
    setIsLoading(false);
  }
};
  // ✅ Register
  const register = async (formData: Partial<User> & { password: string }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/sign-up", formData);
      const newToken = res.data.token || (res.data.user && res.data.user.token) || null;
      const userData: User = res.data.user || res.data;

      if (newToken && typeof window !== "undefined") {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        applyAxiosToken(newToken);
      }

      setUser(userData);
      if (userData.language) setLanguage(userData.language);
      if (userData.name) notificationService.showWelcomeNotification(userData.name);

      router.replace(userData.isSetupComplete ? "/home" : "/SignInSetUp");

      return userData;
    } catch (err) {
      console.error("Register failed:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    applyAxiosToken(null);
    axios.post("/api/auth/logout").catch(() => {});
    router.push("/sign-in");
  };

  // ✅ Update user
  const updateUser = async (userData: Partial<User>) => {
    try {
      const res = await axios.put("/api/users/me", userData, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const updated: User = res.data;
      setUser(updated);
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  // ✅ Complete setup
  const completeSetup = async () => {
    await updateUser({ isSetupComplete: true });
    router.push("/home");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        completeSetup,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};