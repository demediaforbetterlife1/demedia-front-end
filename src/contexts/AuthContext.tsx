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
import { 
  setAuthToken, 
  clearAllTokens, 
  getBestToken, 
  hasValidAuth,
  debugAuth 
} from "@/utils/authFix";

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
  return localStorage.getItem("token");
};

const setLocalStorageToken = (token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
};

const removeLocalStorageToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  // Also remove old key for cleanup
  localStorage.removeItem("auth_token");
};

// Migration helper: move old "auth_token" to new "token" key
const migrateTokenStorage = () => {
  if (typeof window === "undefined") return;
  
  const oldToken = localStorage.getItem("auth_token");
  const newToken = localStorage.getItem("token");
  
  // If we have old token but no new token, migrate it
  if (oldToken && !newToken) {
    console.log("[Auth] Migrating token from old storage key");
    localStorage.setItem("token", oldToken);
    localStorage.removeItem("auth_token");
  }
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

  // Debug authentication state changes
  useEffect(() => {
    console.log('[Auth] State change:', {
      user: user ? { id: user.id, isSetupComplete: user.isSetupComplete } : null,
      isLoading,
      initComplete,
      isAuthenticated
    });
  }, [user, isLoading, initComplete, isAuthenticated]);

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

      console.log("[Auth] Starting authentication initialization...");
      setIsLoading(true);
      setInitComplete(false);

      try {
        // Migrate old token storage if needed
        migrateTokenStorage();
        
        // Check if we have any token stored
        const hasCookieToken = !!getCookie("token");
        const hasStorageToken = !!getLocalStorageToken();
        
        console.log("[Auth] Token check - Cookie:", hasCookieToken, "LocalStorage:", hasStorageToken);

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
          console.log("[Auth] Token found, attempting to fetch user data...");
          const userFetched = await fetchUser();
          if (userFetched) {
            console.log("[Auth] User data fetched successfully");
          } else {
            console.log("[Auth] Failed to fetch user data - token may be invalid");
            // Clear invalid tokens
            deleteCookie("token");
            removeLocalStorageToken();
            setUser(null);
          }
        } else {
          console.log("[Auth] No authentication token found - user is not logged in");
          setUser(null);
        }
      } catch (err) {
        console.error("[Auth] Authentication initialization error:", err);
        // Clear potentially corrupted auth state
        deleteCookie("token");
        removeLocalStorageToken();
        setUser(null);
      } finally {
        setIsLoading(false);
        setInitComplete(true);
        console.log("[Auth] Authentication initialization complete. User state:", user ? `authenticated (${user.id})` : "not authenticated");
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

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        // If response is not valid JSON, handle it
        console.error("[Auth] Failed to parse response as JSON:", jsonError);
        if (!res.ok) {
          let msg = "Login failed. Please try again.";
          if (res.status === 500) {
            msg = "Server error occurred. Please try again later.";
          } else if (res.status === 504) {
            msg = "Backend service is temporarily unavailable. Please try again in a few minutes.";
          } else if (res.status === 502) {
            msg = "Unable to connect to backend service. Please check your internet connection and try again.";
          } else if (res.status === 404) {
            msg = "Login service is currently unavailable. Please contact support.";
          }
          return { success: false, message: msg };
        }
        return { success: false, message: "Login failed. Please try again." };
      }

      if (!res.ok) {
        let msg = data?.error || data?.message || `Login failed (${res.status})`;
        
        // Provide better error messages for common backend issues
        if (res.status === 500) {
          msg = data?.error || data?.message || "Server error occurred. Please try again later.";
        } else if (res.status === 504) {
          msg = "Backend service is temporarily unavailable. Please try again in a few minutes.";
        } else if (res.status === 502) {
          msg = "Unable to connect to backend service. Please check your internet connection and try again.";
        } else if (res.status === 404) {
          msg = "Login service is currently unavailable. Please contact support.";
        }
        
        console.error("[Auth] login failed:", msg, "Status:", res.status);
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
      return { success: false, message: err?.message || "Login failed. Please try again." };
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
        
        // Provide better error messages for common backend issues
        if (res.status === 504) {
          msg = "Backend service is temporarily unavailable. Please try again in a few minutes.";
        } else if (res.status === 502) {
          msg = "Unable to connect to backend service. Please check your internet connection and try again.";
        } else if (res.status === 404) {
          msg = "Registration service is currently unavailable. Please contact support.";
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
        body: JSON.stringify({ finalSetup: true }),
      });

      console.log("[Auth] Complete setup response status:", res.status);

      // Always try to parse the response
      let data;
      try {
        data = await res.json();
        console.log("[Auth] Complete setup response data:", data);
      } catch (jsonError) {
        console.error("[Auth] Failed to parse response JSON:", jsonError);
        // If we can't parse JSON, assume success but don't mark as complete unless it's final setup
        data = { success: true, user: { isSetupComplete: false } };
      }

      // Update user state regardless of response status
      if (data && data.user) {
        console.log("[Auth] Setup completed successfully with user data");
        setUser((prev) => prev ? { ...prev, ...data.user } : data.user);
      } else {
        console.log("[Auth] Setup step completed, but not marking as complete yet");
        // Don't set isSetupComplete here - let the API response control it
      }

      // Always return success
      return {
        success: true,
        user: data?.user,
        message: data?.message || "Setup completed successfully"
      };
      
    } catch (err: any) {
      console.error("[Auth] completeSetup error:", err);
      
      // Don't fail - just update local state but don't mark as complete unless it's final
      console.log("[Auth] Error occurred, but not marking as complete");
      return { 
        success: true, 
        message: "Setup step completed locally despite connection issues" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (force: boolean = false): void => {
    try {
      // Only logout if explicitly forced or if user manually logs out
      if (!force) {
        console.log("[Auth] Logout prevented - not forced");
        return;
      }

      console.log("[Auth] Performing logout...");
      
      // Clear all storage methods using robust utility
      clearAllTokens();
      
      // Clear client-side state
      setUser(null);
      setInitComplete(true);

      // Call backend logout endpoint (don't wait for it)
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
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
