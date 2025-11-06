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
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (data: Partial<User> & { password: string }) => Promise<void>;
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

  // ===== Load user from backend =====
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem("authToken");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);

      try {
        const res = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        const userData: User = res.data;
        setUser(userData);
        if (userData.language) setLanguage(userData.language);
      } catch (error) {
        console.error("Failed to load user:", error);
        localStorage.removeItem("authToken");
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // ===== Login =====
  const login = async (phoneNumber: string, password: string): Promise<User> => {
  setIsLoading(true);
  try {
    // طلب تسجيل الدخول للـ backend
    const res = await axios.post("/api/auth/login", { phoneNumber, password });

    // استلام token وبيانات المستخدم
    const { token: authToken, user: userData } = res.data;

    // حفظ البيانات في state فقط
    setToken(authToken);
    setUser(userData);

    // ضبط اللغة لو موجودة
    if (userData.language) setLanguage(userData.language);

    // التوجيه حسب حالة setup
    router.replace(userData.isSetupComplete ? "/home" : "/SignInSetUp");

    // إظهار رسالة ترحيب
    if (userData.name) {
      notificationService.showWelcomeNotification(userData.name);
    }

    // ترجع بيانات المستخدم للصفحة لو محتاج
    return userData;
  } catch (error) {
    console.error("Login failed:", error);
    throw error; // الصفحة تتعامل مع الفشل
  } finally {
    setIsLoading(false);
  }
};
  // ===== Register =====
  const register = async (data: Partial<User> & { password: string }) => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/register", data);
      const { token: authToken, user: userData } = res.data;

      localStorage.setItem("authToken", authToken);
      setToken(authToken);
      setUser(userData);

      if (userData.language) setLanguage(userData.language);
      router.replace(userData.isSetupComplete ? "/home" : "/SignInSetUp");

      if (userData.name) {
        setTimeout(() => {
          notificationService.showWelcomeNotification(userData.name);
        }, 100);
      }
    } catch (error) {
      console.error("Register failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Logout =====
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    router.push("/sign-up");
  };

  // ===== Update user locally + backend =====
  const updateUser = async (userData: Partial<User>) => {
    if (!token) return;
    try {
      const res = await axios.put("/api/users/me", userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = res.data;
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  // ===== Complete setup =====
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