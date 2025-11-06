"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { notificationService } from "@/services/notificationService";
import { useI18n } from "@/contexts/I18nContext";

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
  login: (token: string, user: User) => void;
  register: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  completeSetup: () => void;
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
  const [token, setToken] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // ✅ Load user & token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUser");

    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.language) setLanguage(parsedUser.language);
    }

    setIsLoading(false);
  }, []);

  // ✅ Save user and token after login/register
  const handleAuthSuccess = (token: string, user: User) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("authUser", JSON.stringify(user));

    setToken(token);
    setUser(user);

    if (user.language) setLanguage(user.language);
    router.replace(user.isSetupComplete ? "/home" : "/SignInSetUp");

    setTimeout(() => {
      if (user.name) notificationService.showWelcomeNotification(user.name);
    }, 100);
  };

  // ===== Login =====
  const login = (token: string, user: User) => {
    handleAuthSuccess(token, user);
  };

  // ===== Register =====
  const register = (token: string, user: User) => {
    handleAuthSuccess(token, user);
  };

  // ===== Logout =====
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    router.push("/sign-up");
  };

  // ===== Update user locally =====
  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...userData } : null;
      if (updated) localStorage.setItem("authUser", JSON.stringify(updated));
      return updated;
    });
  };

  // ===== Complete setup =====
  const completeSetup = () => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, isSetupComplete: true };
      localStorage.setItem("authUser", JSON.stringify(updated));
      return updated;
    });
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