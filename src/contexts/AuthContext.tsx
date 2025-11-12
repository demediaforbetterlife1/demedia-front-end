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
email?: string;           // مهم لتجنب الخطأ في EditProfileModal
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
token: string | null;
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
const setCookie = (name: string, value: string, days: number = 7) => {
if (typeof window === "undefined") return;
const date = new Date();
date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
const expires = expires=`${date.toUTCString()}`;
const sameSite = process.env.NODE_ENV === "production" ? "Strict" : "Lax";
const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=${sameSite}${secure};
`};

const getCookie = (name: string): string | null => {
if (typeof window === "undefined") return null;
const nameEQ = name + "=";
const ca = document.cookie.split(";");
for (let c of ca) {
c = c.trim();
if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
}
return null;
};

const deleteCookie = (name: string) => {
if (typeof window === "undefined") return;
// Set expired cookie to remove it
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
const [token, setToken] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(true);
const [initComplete, setInitComplete] = useState<boolean>(false);

// Consider authenticated only when init finished and we have both user & token
const isAuthenticated = !!(user && token && initComplete);

const updateUser = (newData: Partial<User>) => {
setUser((prev) => (prev ? { ...prev, ...newData } : null));
};

const isValidToken = (t: string | null): boolean => {
if (!t) return false;
const parts = t.split(".");
return parts.length === 3 && t.length > 30;
};

// Fetch current user from backend (/api/auth/me)
const fetchUser = useCallback(async (authToken: string): Promise<boolean> => {
try {
console.log("[Auth] Fetching user with token...");
const res = await fetch("/api/auth/me", {
method: "GET",
headers: {
Authorization: `Bearer ${authToken}`,
"Content-Type": "application/json",
},
cache: "no-store",
credentials: "include", // important for cookie-based auth or same-origin
});

console.log("[Auth] User fetch status:", res.status);  

  if (!res.ok) {  
    if (res.status === 401) {  
      console.warn("[Auth] Token invalid, clearing");  
      deleteCookie("token");  
      setToken(null);  
      setUser(null);  
      return false;  
    }  
    const errText = await res.text().catch(() => "");  
    console.error("[Auth] fetchUser failed:", res.status, errText);  
    return false;  
  }  

  const body = await res.json().catch(() => null);  
  const userObj: User | null = body?.user ?? body ?? null;  

  if (userObj && (userObj as any).id) {  
    setUser(userObj);  
    return true;  
  } else {  
    console.warn("[Auth] fetchUser: invalid body", body);  
    setUser(null);  
    return false;  
  }  
} catch (err) {  
  console.error("[Auth] fetchUser error:", err);  
  setUser(null);  
  return false;  
}

}, []);

// Initialization: read cookie token then fetch user
useEffect(() => {
const initializeAuth = async () => {
if (typeof window === "undefined") {
setIsLoading(false);
setInitComplete(true);
return;
}

const savedToken = getCookie("token");  
  console.log("[Auth] initialize - token exists?", !!savedToken);  

  if (!savedToken || !isValidToken(savedToken)) {  
    setIsLoading(false);  
    setInitComplete(true);  
    return;  
  }  

  setToken(savedToken);  

  try {  
    const ok = await fetchUser(savedToken);  
    if (!ok) {  
      deleteCookie("token");  
      setToken(null);  
    }  
  } catch (err) {  
    console.error("[Auth] initialization error:", err);  
    deleteCookie("token");  
    setToken(null);  
    setUser(null);  
  } finally {  
    setIsLoading(false);  
    setInitComplete(true);  
  }  
};  

initializeAuth();

}, [fetchUser]);

const refreshUser = async () => {
if (token) await fetchUser(token);
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
credentials: "include", // important to receive/send cookie
});

const data = await res.json().catch(() => null);  

  if (!res.ok) {  
    const msg = data?.error || data?.message || `Login failed (${res.status})`;  
    console.error("[Auth] login failed:", msg);  
    return { success: false, message: msg };  
  }  

  // Backend sets cookie; some backends also return user in body  
  // Try to fetch user from /me (cookie will be sent)  
  const userOk = await fetchUser(getCookie("token") || "");  
  if (userOk) {  
    const savedToken = getCookie("token");  
    if (savedToken) setToken(savedToken);  
    return { success: true };  
  }  

  // Fallback: if response body includes user, set it  
  if (data?.user) {  
    setUser(data.user);  
    const savedToken = getCookie("token");  
    if (savedToken) setToken(savedToken);  
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
  credentials: "include",  
});  

// حاول تقرأ body سواء كان JSON أو نص عادي  
let data: any = null;  
try {  
  data = await res.json();  
} catch {  
  try {  
    data = await res.text();  
  } catch {  
    data = null;  
  }  
}  

console.log("[Auth] register response:", res.status, data);  

if (!res.ok) {  
  const msg = data?.error || data?.message || data || `Registration failed (${res.status})`;  
  console.error("[Auth] register failed:", msg);  
  return { success: false, message: msg };  
}  

// لو السيرفر رجّع user في body  
if (data?.user) {  
  setUser(data.user);  
  const tokenFromCookie = getCookie("token");  
  if (tokenFromCookie) setToken(tokenFromCookie);  
  return { success: true };  
}  

// fallback  
const tokenFromCookie = getCookie("token");  
const userOk = tokenFromCookie ? await fetchUser(tokenFromCookie) : false;  
if (userOk) {  
  setToken(tokenFromCookie);  
  return { success: true };  
}  

return { success: false, message: "Registration succeeded but failed to load user" };

} catch (err: any) {
console.error("[Auth] register exception:", err);
return { success: false, message: err?.message || err?.toString() || "Registration failed" };
} finally {
setIsLoading(false);
}
};
const logout = (): void => {
try {
deleteCookie("token");
setToken(null);
setUser(null);
setInitComplete(true);
if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("auth:logout"));
// Optionally call backend logout endpoint if needed (not required for cookie removal client side)
router.replace("/sign-up");
} catch (err) {
console.error("[Auth] logout error:", err);
}
};

const completeSetup = async (): Promise<void> => {
if (!token || !user) return;
setIsLoading(true);
try {
const res = await fetch("/api/auth/complete-setup", {
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${token}`,
},
credentials: "include",
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
token,
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