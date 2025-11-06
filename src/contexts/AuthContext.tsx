"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { notificationService } from "@/services/notificationService";
import { apiFetch } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";

interface User {
id: string;
name: string;
email: string;
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
login: (phoneNumber: string, password: string) => Promise<boolean>;
register: (userData: { name: string; username: string; phoneNumber: string; password: string }) => Promise<boolean>;
logout: () => void;
updateUser: (userData: Partial<User>) => void;
completeSetup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
const context = useContext(AuthContext);
if (!context) throw new Error("useAuth must be used within an AuthProvider!!");
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

const safeJson = async (res: Response) => {
try {
return await res.json();
} catch {
return {};
}
};

const fetchUser = async () => {
setIsLoading(true);
try {
const res = await apiFetch("/api/auth/me", {
headers: {
"Content-Type": "application/json",
},
});

  const data = await safeJson(res);

  if (res.ok && data.user) {
    setUser(data.user);
    if (data.user.language) setLanguage(data.user.language);
  } else {
    console.warn("No active session found");
  }
} catch (err) {
  console.error("Failed to fetch user:", err);
} finally {
  setIsLoading(false);
}

};

useEffect(() => {
fetchUser();
}, []);

const login = async (phoneNumber: string, password: string): Promise<boolean> => {
try {
const res = await apiFetch("/api/auth/login", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ phoneNumber, password }),
});

  const data = await safeJson(res);

  if (!res.ok) throw new Error(data.error || "Login failed");
  if (!data.user) throw new Error("Invalid login response: missing user data");

  if (data.requiresPhoneVerification) {
    throw new Error(data.message || "Please verify your phone number");
  }

  setUser(data.user);
  if (data.user.language) setLanguage(data.user.language);

  router.replace(data.user.isSetupComplete ? "/home" : "/SignInSetUp");

  setTimeout(() => {
    if (data.user.name) notificationService.showWelcomeNotification(data.user.name);
  }, 100);

  return true;
} catch (err) {
  console.error("Login error:", err);
  throw err;
}

};

const register = async (userData: { name: string; username: string; phoneNumber: string; password: string }): Promise<boolean> => {
  try {
    const res = await apiFetch("/api/auth/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await safeJson(res);

    if (!res.ok) throw new Error(data.error || "Registration failed");

    // ✅ لو الـ backend ما رجعش user أو token
    if (!data.user) {
      console.warn("No user data returned, fetching session user...");
      await fetchUser();
      router.replace("/SignInSetUp");
      return true;
    }

    setUser(data.user);
    setToken(data.token);
    if (data.user.language) setLanguage(data.user.language);

    router.replace("/SignInSetUp");
    return true;

  } catch (err) {
    console.error("Registration error:", err);
    throw err;
  }
};
const logout = () => {
setUser(null);
router.push("/sign-up");
};

const updateUser = (userData: Partial<User>) => {
setUser((prev) => (prev ? { ...prev, ...userData } : prev));
};

const completeSetup = async () => {
try {
const res = await apiFetch("/api/user/complete-setup", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
});

  const data = await safeJson(res);
  if (res.ok && data.user) setUser(data.user);
} catch (err) {
  console.error("Complete setup error:", err);
  setUser((prev) => (prev ? { ...prev, isSetupComplete: true } : prev));
} finally {
  router.push("/home");
}

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