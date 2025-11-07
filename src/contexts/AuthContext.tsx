"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { setLanguage } = useI18n();

  const isAuthenticated = !!user;

  // Load user if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData: User = res.data;
        setUser(userData);
        if (userData.language) setLanguage(userData.language);
      } catch (error) {
        console.error("Failed to load user:", error);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Login
  const login = async (phoneNumber: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { phoneNumber, password });
      const { token: authToken, user: userData } = res.data;

      setToken(authToken);
      setUser(userData);

      if (userData.language) setLanguage(userData.language);

      router.replace(userData.isSetupComplete ? "/home" : "/SignInSetUp");

      if (userData.name) notificationService.showWelcomeNotification(userData.name);

      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (
  data: Partial<User> & { password: string },
  onSuccess?: (user: User) => void
): Promise<User> => {
  setIsLoading(true);
  try {
    // 🔹 إرسال البيانات للباك اند
    const res = await axios.post("/api/auth/register", data);
    const { token: authToken, user: userData } = res.data;

    // 🔹 تخزين البيانات في state فقط
    setToken(authToken);
    setUser(userData);

    if (userData.language) setLanguage(userData.language);
    if (userData.name) notificationService.showWelcomeNotification(userData.name);

    // 🔹 بعد التسجيل، توجيه المستخدم لصفحة SignInSetUp
    router.replace("/SignInSetUp");

    if (onSuccess) onSuccess(userData);

    return userData;
  } catch (error) {
    console.error("Register failed:", error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    router.push("/sign-in");
  };

  // Update user
  const updateUser = async (userData: Partial<User>) => {
    if (!token) return;
    try {
      const res = await axios.put("/api/users/me", userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser: User = res.data;
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  // Complete setup
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};