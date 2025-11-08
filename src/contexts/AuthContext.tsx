// src/contexts/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api"; // افترض إنه موجود ومضبط
import { notificationService } from "@/services/notificationService";
import { useI18n } from "@/contexts/I18nContext";

/**
 * AuthContext (TypeScript, Client)
 *
 * - كل الداتا تجي من الباك اند عبر apiFetch
 * - Token مخزن في localStorage فقط (لاجل persist الجلسة)
 * - لا يوجد reload كامل أو تصرفات قد تسبب فلاش في الصفحة
 * - updateUser يقوم بعمل طلب للبك اند قبل تعديل الواجهة (يمكن استخدام نسخة محلية بديلة اذا فشل)
 */

// -----------------------------
// Types
// -----------------------------
export interface User {
  id: string;
  name: string;
  username: string;
  phoneNumber: string;
  email?: string | null;
  profilePicture?: string | null;
  coverPhoto?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  dateOfBirth?: string | null;
  dob?: string | null; // بعض الشاشات تستخدم dob
  age?: number | null;
  language?: string | null;
  preferredLang?: string | null;
  privacy?: string | null;
  interests?: string[] | null;
  isSetupComplete?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string | null;
  [k: string]: any; // للحقل الإضافي بدون أخطاء TS
}

export type LoginResult =
  | { success: true; user: User }
  | { success: false; error: string }
  | { success: false; requiresPhoneVerification: true; verificationToken?: string; message?: string };

export type RegisterResult =
  | { success: true; user: User }
  | { success: false; error: string }
  | { success: false; requiresPhoneVerification: true; verificationToken?: string; message?: string };

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // login/register return rich object so UI can handle verification flows
  login: (phoneNumber: string, password: string) => Promise<LoginResult>;
  register: (payload: { name: string; username: string; phoneNumber: string; password: string }) => Promise<RegisterResult>;
  logout: () => void;
  // updateUser: will persist to backend then update local state
  updateUser: (patch: Partial<User>, persist?: boolean) => Promise<User | null>;
  completeSetup: () => Promise<boolean>;
  verifyPhone: (token: string) => Promise<boolean>;
  resendPhoneVerification: (phoneNumber: string) => Promise<boolean>;
  sendVerificationCode: (phoneNumber: string, method: "whatsapp" | "sms") => Promise<boolean>;
}

// -----------------------------
// Context + Hook
// -----------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// -----------------------------
// Provider
// -----------------------------
interface Props {
  children: ReactNode;
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const { setLanguage } = useI18n();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // to avoid concurrent / double fetches
  const loadingRef = useRef(false);

  // -----------------------------
  // Helper: get token
  // -----------------------------
  const getToken = () => {
    try {
      return typeof window !== "undefined" ? localStorage.getItem("token") : null;
    } catch {
      return null;
    }
  };

  // -----------------------------
  // Load current user from backend if token exists
  // -----------------------------
  useEffect(() => {
    // run only on client
    if (typeof window === "undefined") return;

    const init = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setIsLoading(true);

      const token = getToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        loadingRef.current = false;
        return;
      }

      try {
        // apiFetch should automatically attach token if needed;
        // but we call /api/auth/me directly to ensure fresh data from backend.
        const res = await apiFetch("/api/auth/me", { method: "GET" });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const serverUser: User = data.user ?? data;
          setUser(serverUser);
          if (serverUser?.language) setLanguage(serverUser.language);
        } else {
          // token invalid or expired -> clear stored token
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
          }
          setUser(null);
        }
      } catch (err) {
        // Network / unknown error -> keep token (so user doesn't get logged out unexpectedly),
        // but mark user as null until next successful check.
        console.error("AuthProvider: failed to load user", err);
        // do not remove token here aggressively; only on explicit 401 or invalid token
        setUser(null);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };

    init();
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setLanguage]);

  // -----------------------------
  // Auto-redirect after login/registration when user becomes available
  // - this avoids redirect inside login() which may run before user state
  // -----------------------------
  useEffect(() => {
    if (!user) return;
    // don't redirect during initial checks if loading
    // if user is present and setup complete -> home
    const setupComplete = user.isSetupComplete ?? false;
    // use replace to avoid adding extra history
    router.replace(setupComplete ? "/home" : "/SignInSetUp");
  }, [user, router]);

  // -----------------------------
  // login
  // -----------------------------
  const login = async (phoneNumber: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });

      // network-level non-ok
      if (!res.ok) {
        // try parse message
        let msg = `Login failed (${res.status})`;
        try {
          const parsed = await res.json();
          msg = parsed?.message || parsed?.error || msg;
        } catch {}
        return { success: false, error: msg };
      }

      const data = await res.json().catch(() => ({}));

      // phone verification required
      if (data?.requiresPhoneVerification) {
        return {
          success: false,
          requiresPhoneVerification: true,
          verificationToken: data.verificationToken,
          message: data.message,
        };
      }

      // store token only
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }

      // set user (fresh from server)
      const serverUser: User = data.user ?? data;
      if (serverUser) {
        setUser(serverUser);
        if (serverUser.language) setLanguage(serverUser.language);
      }

      return { success: true, user: serverUser };
    } catch (err: any) {
      console.error("AuthProvider.login error:", err);
      const message = err?.message || "Network error during login";
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // register
  // -----------------------------
  const register = async (payload: {
    name: string;
    username: string;
    phoneNumber: string;
    password: string;
  }): Promise<RegisterResult> => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = `Registration failed (${res.status})`;
        try {
          const parsed = await res.json();
          msg = parsed?.message || parsed?.error || msg;
        } catch {}
        return { success: false, error: msg };
      }

      const data = await res.json().catch(() => ({}));

      if (data?.requiresPhoneVerification) {
        return {
          success: false,
          requiresPhoneVerification: true,
          verificationToken: data.verificationToken,
          message: data.message,
        };
      }

      if (data?.token) {
        localStorage.setItem("token", data.token);
      }

      const serverUser: User = data.user ?? data;
      if (serverUser) {
        setUser(serverUser);
        if (serverUser.language) setLanguage(serverUser.language);
      }

      // after register, SignInSetUp will be triggered by useEffect when user is set
      return { success: true, user: serverUser };
    } catch (err: any) {
      console.error("AuthProvider.register error:", err);
      return { success: false, error: err?.message || "Network error during registration" };
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // logout
  // -----------------------------
  const logout = () => {
    try {
      localStorage.removeItem("token");
      // optionally you can inform backend (invalidate token) if you have endpoint
      // await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      // ignore
    } finally {
      setUser(null);
      // broadcast logout for other tabs/windows
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
      // SPA redirect
      try {
        router.replace("/sign-up");
      } catch {
        // ignore if router not ready
      }
    }
  };

  // -----------------------------
  // updateUser (persist by default)
  // - patch: partial user fields
  // - persist: if false -> only update local state (rare)
  // -----------------------------
  const updateUser = async (patch: Partial<User>, persist = true): Promise<User | null> => {
    // update local immediately (optimistic)
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));

    if (!persist) {
      return user ? { ...user, ...patch } : null;
    }

    try {
      const currentUserId = user?.id ?? localStorage.getItem("userId");
      if (!currentUserId) throw new Error("No user ID to update");

      const res = await apiFetch(`/api/user/${currentUserId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        // revert local change if server rejected
        const txt = await res.text().catch(() => "");
        console.warn("updateUser server rejected:", txt || res.status);
        // optionally refetch server user to sync
        const fresh = await apiFetch(`/api/auth/me`, { method: "GET" }).catch(() => null);
        if (fresh && fresh.ok) {
          const d = await fresh.json().catch(() => null);
          setUser(d?.user ?? d ?? null);
          return d?.user ?? d ?? null;
        }
        return user ? { ...user, ...patch } : null; // fallback
      }

      const updated = await res.json().catch(() => null);
      const serverUser: User = updated?.user ?? updated ?? null;
      if (serverUser) setUser(serverUser);
      return serverUser;
    } catch (err) {
      console.error("updateUser error:", err);
      // keep optimistic local update, but return null to signal failure
      return user ? { ...user, ...patch } : null;
    }
  };

  // -----------------------------
  // completeSetup -> call backend then update local
  // -----------------------------
  const completeSetup = async (): Promise<boolean> => {
    try {
      const currentUserId = user?.id ?? localStorage.getItem("userId");
      if (!currentUserId) throw new Error("No user ID");

      const res = await apiFetch(`/api/user/${currentUserId}/complete-setup`, {
        method: "POST",
      });

      if (!res.ok) {
        console.error("completeSetup failed:", res.status);
        // still set local flag to avoid blocking UX
        setUser((prev) => (prev ? { ...prev, isSetupComplete: true } : prev));
        router.replace("/home");
        return false;
      }

      const data = await res.json().catch(() => null);
      const serverUser: User = data?.user ?? data ?? null;
      if (serverUser) setUser(serverUser);
      else setUser((prev) => (prev ? { ...prev, isSetupComplete: true } : prev));
      router.replace("/home");
      return true;
    } catch (err) {
      console.error("completeSetup error:", err);
      setUser((prev) => (prev ? { ...prev, isSetupComplete: true } : prev));
      router.replace("/home");
      return false;
    }
  };

  // -----------------------------
  // phone verification helpers
  // -----------------------------
  const verifyPhone = async (token: string): Promise<boolean> => {
    try {
      const res = await apiFetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Phone verification failed");
      }
      // after verifying phone, refresh user
      const fresh = await apiFetch("/api/auth/me", { method: "GET" });
      if (fresh?.ok) {
        const d = await fresh.json().catch(() => null);
        setUser(d?.user ?? d ?? null);
      }
      return true;
    } catch (err) {
      console.error("verifyPhone error:", err);
      throw err;
    }
  };

  const resendPhoneVerification = async (phoneNumber: string): Promise<boolean> => {
    try {
      const res = await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      if (!res.ok) throw new Error("Failed to resend verification code");
      return true;
    } catch (err) {
      console.error("resendPhoneVerification error:", err);
      throw err;
    }
  };

  const sendVerificationCode = async (phoneNumber: string, method: "whatsapp" | "sms"): Promise<boolean> => {
    try {
      const res = await apiFetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, method }),
      });
      if (!res.ok) throw new Error("Failed to send verification code");
      return true;
    } catch (err) {
      console.error("sendVerificationCode error:", err);
      throw err;
    }
  };

  // -----------------------------
  // Context value
  // -----------------------------
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    completeSetup,
    verifyPhone,
    resendPhoneVerification,
    sendVerificationCode,
  };

  // -----------------------------
  // Render
  // -----------------------------
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};