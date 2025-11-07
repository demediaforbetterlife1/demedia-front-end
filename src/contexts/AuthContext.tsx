"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useI18n } from "@/contexts/I18nContext";
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
  login: (phoneNumber: string, password: string) => Promise<User | null>;
  register: (data: Partial<User> & { password: string }) => Promise<User | null>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  completeSetup: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const { setLanguage } = useI18n();

  const isAuthenticated = !!user;

  // 🔹 تحميل المستخدم من localStorage عند أول تشغيل
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);

    axios
      .get("/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
        withCredentials: true,
      })
      .then((res) => {
        const userData = res.data.user || res.data;
        setUser(userData);
        if (userData.language) setLanguage(userData.language);
      })
      .catch((err) => {
        console.error("❌ Error loading user:", err);
        localStorage.removeItem("token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  // 🔹 تسجيل الدخول
  const login = async (phoneNumber: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { phoneNumber, password }, { withCredentials: true });
      const { token: newToken, user: userData } = res.data;

      if (!newToken) throw new Error("Token not received");

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData);

      if (userData.language) setLanguage(userData.language);
      if (userData.name) notificationService.showWelcomeNotification(userData.name);

      // ✅ Redirect without refresh
      router.replace(userData.isSetupComplete ? "/(pages)/home" : "/SignInSetUp");

      return userData;
    } catch (err) {
      console.error("❌ Login failed:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 تسجيل جديد
  const register = async (formData: Partial<User> & { password: string }): Promise<User | null> => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/sign-up", formData, { withCredentials: true });
      const { token: newToken, user: userData } = res.data;

      if (!newToken) throw new Error("Token not received");

      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData);

      if (userData.language) setLanguage(userData.language);
      if (userData.name) notificationService.showWelcomeNotification(userData.name);

      // ✅ Redirect بدون refresh
      router.replace(userData.isSetupComplete ? "/(pages)/home" : "/SignInSetUp");

      return userData;
    } catch (err) {
      console.error("❌ Register failed:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 تسجيل الخروج
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    router.push("/sign-in");
  };

  // 🔹 تحديث المستخدم
  const updateUser = async (userData: Partial<User>) => {
    if (!token) return;
    try {
      const res = await axios.put("/api/users/me", userData, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUser(res.data);
    } catch (err) {
      console.error("❌ Update user failed:", err);
    }
  };

  // 🔹 إكمال الإعداد
  const completeSetup = async () => {
    await updateUser({ isSetupComplete: true });
    router.push("/(pages)/home");
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, login, register, logout, updateUser, completeSetup, token }}
    >
      {children}
    </AuthContext.Provider>
  );
};