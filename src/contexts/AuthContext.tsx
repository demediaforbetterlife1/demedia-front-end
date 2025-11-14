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
  user?: User;
}

export interface FormData {
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
  initComplete: boolean;
  login: (phoneNumber: string, password: string) => Promise<AuthResult>;
  register: (userData: FormData) => Promise<AuthResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  completeSetup: () => Promise<AuthResult>;
  updateUserProfile: (userData: { dob?: string; interests?: string[] }) => Promise<AuthResult>;
  updateUser: (newData: Partial<User>) => void;
}

/* =======================
Context init
======================= */
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

/* =======================
Storage Helpers - DUAL STORAGE (Cookies + localStorage)
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

const setCookie = (name: string, value: string, days: number = 365) => {
  if (typeof window === "undefined") return;
  
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// localStorage helpers
const getLocalStorageToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

const setLocalStorageToken = (token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
};

const removeLocalStorageToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
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

  // Enhanced fetch with dual token support
  const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    try {
      // Get token from either storage method
      const token = getCookie("token") || getLocalStorageToken();
      
      const headers: Record<string, string> = {
  "Content-Type": "application/json",
};

      // Add token to headers for backup (in case cookies don't work
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Still try cookies first
      });

      return response;
    } catch (error: any) {
      console.error(`[Auth] API fetch error for ${url}:`, error);
      throw new Error('Network error. Please check your connection.');
    }
  };

  // Fetch current user from backend (/api/auth/me)
  const fetchUser = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[Auth] Fetching user...");
      
      // Check both storage methods
      const cookieToken = getCookie("token");
      const storageToken = getLocalStorageToken();
      console.log("[Auth] Token - Cookie:", !!cookieToken, "LocalStorage:", !!storageToken);

      const res = await apiFetch("/api/auth/me", {
        method: "GET",
      });

      console.log("[Auth] User fetch status:", res.status);  

      if (res.status === 401) {
        console.warn("[Auth] Token invalid, clearing all storage");
        deleteCookie("token");
        removeLocalStorageToken();
        setUser(null);
        return false;
      }

      if (!res.ok) {
        console.error("[Auth] fetchUser failed:", res.status);
        return false;
      }

      const data = await res.json();
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

  // Initialization: check if user is authenticated
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window === "undefined") {
        setIsLoading(false);
        setInitComplete(true);
        return;
      }

      console.log("[Auth] Initializing auth...");

      try {
        // Check if we have any token stored
        const hasCookieToken = !!getCookie("token");
        const hasStorageToken = !!getLocalStorageToken();
        
        console.log("[Auth] Tokens found - Cookie:", hasCookieToken, "LocalStorage:", hasStorageToken);

        // If we have localStorage token but no cookie, restore the cookie
        if (hasStorageToken && !hasCookieToken) {
          const token = getLocalStorageToken();
          if (token) {
            console.log("[Auth] Restoring token from localStorage to cookie");
            setCookie("token", token);
          }
        }

        // If we have any token, try to fetch user
        if (hasCookieToken || hasStorageToken) {
          console.log("[Auth] Token found, fetching user...");
          await fetchUser();
        } else {
          console.log("[Auth] No token found");
        }
      } catch (err) {
        console.error("[Auth] initialization error:", err);
      } finally {
        setIsLoading(false);
        setInitComplete(true);
        console.log("[Auth] Auth initialization complete, user:", user ? user.id : "null");
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
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || `Login failed (${res.status})`;
        console.error("[Auth] login failed:", msg);
        return { success: false, message: msg };
      }

      // Store token in both cookie and localStorage
      if (data.token) {
        console.log("[Auth] Storing token in both cookie and localStorage");
        setCookie("token", data.token);
        setLocalStorageToken(data.token);
      }

      // Use user data from response
      if (data.user) {
        console.log("[Auth] Login successful, setting user from response");
        setUser(data.user);
        return {
          success: true,
          user: data.user
        };
      }

      return {
        success: false,
        message: "Login succeeded but failed to load user"
      };
    } catch (err: any) {
      console.error("[Auth] login error:", err);
      return { success: false, message: err?.message || "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData: FormData): Promise<AuthResult> => {
    setIsLoading(true);

    try {
      console.log("[Auth] register attempt with:", formData);

      const res = await apiFetch("/api/auth/sign-up", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      console.log("[Auth] register response:", res.status, data);

      if (!res.ok) {
        let msg = data?.error || `Registration failed (${res.status})`;
        
        // Handle timeout errors with user-friendly message
        if (res.status === 504 || (data?.error === "Timeout" || data?.details === "Backend took too long")) {
          msg = "Backend service is temporarily unavailable. Please try again in a few minutes.";
        }
        
        console.error("[Auth] register failed:", msg);
        return { success: false, message: msg };
      }

      // Store token in both cookie and localStorage
      if (data.token) {
        console.log("[Auth] Storing token in both cookie and localStorage");
        setCookie("token", data.token);
        setLocalStorageToken(data.token);
      }

      // Use user data from response
      if (data.user) {
        console.log("[Auth] Registration successful, setting user from response");
        setUser(data.user);
        return {
          success: true,
          user: data.user
        };
      }

      return {
        success: false,
        message: "Registration succeeded but failed to load user"
      };
    } catch (err: any) {
      console.error("[Auth] register exception:", err);
      return { success: false, message: err?.message || "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (userData: { dob?: string; interests?: string[] }): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      console.log("[Auth] Updating user profile:", userData);

      const res = await apiFetch("/api/auth/update-profile", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || `Profile update failed (${res.status})`;
        console.error("[Auth] updateUserProfile failed:", msg);
        return { success: false, message: msg };
      }

      if (data.user) {
        console.log("[Auth] Profile updated successfully");
        setUser(data.user);
        return {
          success: true,
          user: data.user
        };
      }

      return { success: false, message: "Profile update failed" };
    } catch (err: any) {
      console.error("[Auth] updateUserProfile error:", err);
      return { success: false, message: err?.message || "Profile update failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async (): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      console.log("[Auth] Completing setup...");

      const res = await apiFetch("/api/auth/complete-setup", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || `Setup completion failed (${res.status})`;
        console.error("[Auth] completeSetup failed:", msg);
        return { success: false, message: msg };
      }

      if (data.user) {
        console.log("[Auth] Setup completed successfully");
        setUser(data.user);
        return {
          success: true,
          user: data.user
        };
      }

      // Fallback: update local state
      setUser((prev) => (prev ? { ...prev, isSetupComplete: true } : null));
      return { success: true };
    } catch (err: any) {
      console.error("[Auth] completeSetup error:", err);
      return { success: false, message: err?.message || "Setup completion failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    try {
      // Clear all storage methods
      deleteCookie("token");
      removeLocalStorageToken();
      
      // Clear client-side state
      setUser(null);
      setInitComplete(true);

      // Call backend logout endpoint
      apiFetch("/api/auth/logout", {
        method: "POST",
      }).catch(err => console.error("[Auth] Backend logout error:", err));

      // Dispatch logout event
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }

      console.log("[Auth] Logout successful");
      router.replace("/sign-up");
    } catch (err) {
      console.error("[Auth] logout error:", err);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    initComplete,
    login,
    register,
    logout,
    refreshUser,
    completeSetup,
    updateUserProfile,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};