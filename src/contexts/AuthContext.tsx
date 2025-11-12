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
Types
======================= */
export interface User {
  id: string;
  name?: string;
  username?: string;
  email?: string;           
  phoneNumber?: string;
  profilePicture?: string | null;
  coverPhoto?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  dateOfBirth?: string | null;
  dob?: string | null;
  age?: number | null;
  language?: string | null;
  preferredLang?: string | null;
  privacy?: string | null;
  interests?: string[] | null;
  isSetupComplete?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
}

export interface RegisterData {
  name: string;
  username: string;
  phoneNumber: string;
  password: string;
}

/* =======================
Context Type
======================= */
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string, password: string) => Promise<AuthResult>;
  register: (userData: RegisterData) => Promise<AuthResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  completeSetup: () => Promise<void>;
  updateUser: (newData: Partial<User>) => void;
}

/* =======================
Context init
======================= */
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

/* =======================
Cookie Helpers
======================= */
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
};

const deleteCookie = (name: string) => {
  if (typeof window === "undefined") return;
  const domain = window.location.hostname;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
  // Also clear without domain for local development
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

/* =======================
Provider
======================= */
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initComplete, setInitComplete] = useState<boolean>(false);

  const isAuthenticated = !!(user && initComplete);

  const updateUser = (newData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...newData } : null));
  };

  // Fetch current user from backend (/api/auth/me) using cookies
  const fetchUser = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[Auth] Fetching user with cookies...");
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // This sends cookies automatically
      });

      console.log("[Auth] User fetch status:", res.status);  

      if (!res.ok) {  
        if (res.status === 401) {  
          console.warn("[Auth] Token invalid, clearing cookies");  
          deleteCookie("token");  
          setUser(null);  
          return false;  
        }  
        const errText = await res.text().catch(() => "");  
        console.error("[Auth] fetchUser failed:", res.status, errText);  
        return false;  
      }  

      const data = await res.json().catch(() => null);  
      const userObj: User | null = data?.user ?? null;  

      if (userObj && userObj.id) {  
        console.log("[Auth] User fetched successfully:", userObj.id);
        setUser(userObj);  
        return true;  
      } else {  
        console.warn("[Auth] fetchUser: invalid user data", data);  
        setUser(null);  
        return false;  
      }  
    } catch (err) {  
      console.error("[Auth] fetchUser error:", err);  
      setUser(null);  
      return false;  
    }
  }, []);

  // Initialization: check if user is authenticated via cookies
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window === "undefined") {
        setIsLoading(false);
        setInitComplete(true);
        return;
      }

      console.log("[Auth] Initializing auth from cookies...");  

      try {  
        const ok = await fetchUser();  
        if (!ok) {  
          // Clear any potentially invalid token
          deleteCookie("token");  
        }  
      } catch (err) {  
        console.error("[Auth] initialization error:", err);  
        deleteCookie("token");  
        setUser(null);  
      } finally {  
        setIsLoading(false);  
        setInitComplete(true);  
        console.log("[Auth] Auth initialization complete, authenticated:", isAuthenticated);
      }  
    };  

    initializeAuth();
  }, [fetchUser]);

  const refreshUser = async () => {
    await fetchUser();
  };

  const login = async (
    phoneNumber: string,
    password: string
  ): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      console.log("[Auth] login attempt...");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
        credentials: "include", // Important for cookies
      });

      const data = await res.json().catch(() => null);  

      if (!res.ok) {  
        const msg = data?.error || data?.message || `Login failed (${res.status})`;  
        console.error("[Auth] login failed:", msg);  
        return { success: false, message: msg };  
      }  

      // After successful login, fetch the user data using cookies
      const userOk = await fetchUser();
      if (userOk) {
        console.log("[Auth] Login successful, user loaded");
        return { success: true };
      }

      return { success: false, message: "Login succeeded but failed to load user" };  
    } catch (err: any) {  
      console.error("[Auth] login error:", err);  
      return { success: false, message: err?.message || "Login failed" };  
    } finally {  
      setIsLoading(false);  
    }
  };

  const register = async (userData: RegisterData): Promise<AuthResult> => {
    setIsLoading(true);

    try {
      console.log("[Auth] register attempt with:", userData);

      const res = await fetch("/api/auth/sign-up", {  
        method: "POST",  
        headers: { "Content-Type": "application/json" },  
        body: JSON.stringify(userData),  
        credentials: "include", // Important for cookies
      });  

      const data = await res.json().catch(() => null);

      console.log("[Auth] register response:", res.status, data);  

      if (!res.ok) {  
        const msg = data?.error || data?.message || `Registration failed (${res.status})`;  
        console.error("[Auth] register failed:", msg);  
        return { success: false, message: msg };  
      }  

      // After successful registration, fetch the user data using cookies
      const userOk = await fetchUser();
      if (userOk) {
        console.log("[Auth] Registration successful, user loaded");
        return { success: true };
      }

      console.warn("[Auth] Registration succeeded but no user data available");
      return { success: false, message: "Registration succeeded but failed to load user" };
    } catch (err: any) {
      console.error("[Auth] register exception:", err);
      return { success: false, message: err?.message || "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    try {
      // Clear client-side state first
      setUser(null);
      setInitComplete(true);
      
      // Call backend logout endpoint to clear server-side session
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      }).catch(err => console.error("[Auth] Backend logout error:", err));
      
      // Clear cookies
      deleteCookie("token");
      
      // Dispatch logout event for other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
      
      console.log("[Auth] Logout successful");
      router.replace("/sign-up");
    } catch (err) {
      console.error("[Auth] logout error:", err);
    }
  };

  const completeSetup = async (): Promise<void> => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/complete-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Cookies will be sent automatically
        body: JSON.stringify({}),
      });

      if (res.ok) {  
        setUser((prev) => (prev ? { ...prev, isSetupComplete: true } : null));  
        await refreshUser();  
      } else {  
        const txt = await res.text().catch(() => "");  
        console.error("[Auth] completeSetup failed:", res.status, txt);  
      }  
    } catch (err) {  
      console.error("[Auth] completeSetup error:", err);  
    } finally {  
      setIsLoading(false);  
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    completeSetup,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};