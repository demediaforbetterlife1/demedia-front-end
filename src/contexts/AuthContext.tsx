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
  const router = useRouter();
  const { setLanguage } = useI18n();

  const isAuthenticated = !!user;

  // Load user using token from localStorage
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = res.data.user || res.data;
        setUser(userData);
        if (userData.language) setLanguage(userData.language);
      } catch (err) {
        console.error("Failed to load user:", err);
        setUser(null);
        localStorage.removeItem("token");
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Login
  const login = async (phoneNumber: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { phoneNumber, password });
      const { token, user: userData } = res.data;

      localStorage.setItem("token", token); // ✅ store token in localStorage
      setUser(userData);

      if (userData.language) setLanguage(userData.language);
      if (userData.name) notificationService.showWelcomeNotification(userData.name);

      router.replace(userData.isSetupComplete ? "/home" : "/SignInSetUp");

      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (formData: Partial<User> & { password: string }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/sign-up", formData);
      const { token, user: userData } = res.data;

      localStorage.setItem("token", token); // ✅ store token in localStorage
      setUser(userData);

      if (userData.language) setLanguage(userData.language);
      if (userData.name) notificationService.showWelcomeNotification(userData.name);

      router.replace(userData.isSetupComplete ? "/home" : "/SignInSetUp");

      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token"); // ✅ remove token
    router.push("/sign-in");
  };

  // Update user
  const updateUser = async (userData: Partial<User>) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.put("/api/users/me", userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Complete setup
  const completeSetup = async () => {
    await updateUser({ isSetupComplete: true });
    router.push("/home");
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, login, register, logout, updateUser, completeSetup }}
    >
      {children}
    </AuthContext.Provider>
  );
};