"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";
import axios from "axios";
import { notificationService } from "@/services/notificationService";

interface User {
  id: string;
  name: string;
  username: string;
  phoneNumber: string;
  email?: string;
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const { setLanguage } = useI18n();

  const isAuthenticated = !!user;

  const applyAxiosToken = (t?: string | null) => {
    if (t) axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    else delete axios.defaults.headers.common["Authorization"];
  };

  // ✅ Load token and user data from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    applyAxiosToken(storedToken);

    (async () => {
      try {
        const res = await axios.get("/api/auth/me");
        const u: User = res.data.user || res.data;
        setUser(u);
        if (u.language) setLanguage(u.language);
      } catch (err) {
        console.warn("Token expired or invalid:", err);
        localStorage.removeItem("token");
        applyAxiosToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ✅ Login
  const login = async (phoneNumber: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { phoneNumber, password });
      const newToken = res.data.token;
      const userData: User = res.data.user || res.data;

      if (!newToken) throw new Error("No token returned from server.");

      localStorage.setItem("token", newToken);
      setToken(newToken);
      applyAxiosToken(newToken);
      setUser(userData);

      if (userData.language) setLanguage(userData.language);
      if (userData.name) notificationService.showWelcomeNotification(userData.name);

      // ✅ تأخير بسيط لتثبيت الحالة قبل التوجيه
      setTimeout(() => router.push(userData.isSetupComplete ? "/home" : "/SignInSetUp"), 300);

      return userData;
    } catch (err) {
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
      const newToken = res.data.token;
      const userData: User = res.data.user || res.data;

      if (newToken) {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        applyAxiosToken(newToken);
      }

      setUser(userData);
      if (userData.language) setLanguage(userData.language);

      setTimeout(() => router.push(userData.isSetupComplete ? "/home" : "/SignInSetUp"), 300);

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
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    applyAxiosToken(null);
    router.push("/sign-in");
  };

  // ✅ Update user
  const updateUser = async (userData: Partial<User>) => {
    try {
      const res = await axios.put("/api/users/me", userData);
      setUser(res.data);
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
        token,
        login,
        register,
        logout,
        updateUser,
        completeSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};