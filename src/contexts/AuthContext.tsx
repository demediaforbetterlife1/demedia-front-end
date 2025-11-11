// src/contexts/AuthContext.tsx
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
✅ Types
======================= */
export interface User {
id: string;
name: string;
username: string;
email?: string;
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
createdAt?: string;
}

export interface AuthResult {
success: boolean;
message?: string;
}

export interface LoginCredentials {
phoneNumber: string;
password: string;
}

export interface RegisterData {
name: string;
username: string;
phoneNumber: string;
password: string;
}

/* =======================
✅ Context Type
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
✅ Context init
======================= */
export const AuthContext = createContext<AuthContextType | undefined>(
undefined
);

/* =======================
✅ Cookie Helper Functions
======================= */
const setCookie = (name: string, value: string, days: number = 7) => {
if (typeof window === "undefined") return;

const date = new Date();
date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
const setCookie = (name: string, value: string, days: number) => {
  if (typeof window === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
};
};

const getCookie = (name: string): string | null => {
if (typeof window === "undefined") return null;

const nameEQ = name + "=";
const ca = document.cookie.split(';');
for (let i = 0; i < ca.length; i++) {
let c = ca[i];
while (c.charAt(0) === ' ') c = c.substring(1, c.length);
if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
}
return null;
};

const deleteCookie = (name: string) => {
if (typeof window === "undefined") return;
document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;;
}`;

/* =======================
✅ Provider
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

// FIXED: More accurate authentication state
const isAuthenticated = !!(user && token && initComplete);

const updateUser = (newData: Partial<User>) => {
setUser(prev => (prev ? { ...prev, ...newData } : null));
};

// FIXED: Validate token format
const isValidToken = (token: string | null): boolean => {
if (!token) return false;
// Basic JWT validation
const parts = token.split('.');
return parts.length === 3 && token.length > 30;
};

// Fetch current user from backend
// Fetch current user from backend
const fetchUser = useCallback(async (authToken: string): Promise<boolean> => {
try {
console.log("[Auth] Fetching user with token...");
const res = await fetch("/api/auth/me", {
method: "GET",
headers: {
Authorization: Bearer `${authToken}`,
"Content-Type": "application/json",
},
cache: "no-store",
});

console.log("[Auth] User fetch response status:", res.status);  

if (!res.ok) {  
  if (res.status === 401) {  
    console.warn("[Auth] Token invalid, clearing auth");  
    deleteCookie("token");  
    setToken(null);  
    setUser(null);  
    return false;  
  }  
  const errorText = await res.text();  
  console.error("[Auth] Failed to fetch user:", res.status, errorText);  
  throw new Error(`Failed to fetch user: ${res.status} - ${errorText}`);  
}  

const body = await res.json();  
console.log("[Auth] User data received:", body);  
  
const userObj: User | null = body?.user ?? body ?? null;  
  
if (userObj && userObj.id) {  
  console.log("[Auth] User fetched successfully:", userObj.id, userObj.username);  
  setUser(userObj);  
  return true;  
} else {  
  console.warn("[Auth] Invalid user data received:", body);  
  setUser(null);  
  return false;  
}

} catch (err) {
console.error("[Auth] fetchUser error:", err);
setUser(null);
return false;
}
}, []);

// FIXED: Improved initialization with better state tracking
useEffect(() => {
const initializeAuth = async () => {
if (typeof window === "undefined") {
setIsLoading(false);
setInitComplete(true);
return;
}

const savedToken = getCookie("token");  
  console.log("[Auth] Initializing with token:", savedToken ? "exists" : "null");  
    
  if (!savedToken || !isValidToken(savedToken)) {  
    console.log("[Auth] No valid token found");  
    setIsLoading(false);  
    setInitComplete(true);  
    return;  
  }  

  setToken(savedToken);  
    
  try {  
    const userFetched = await fetchUser(savedToken);  
    if (!userFetched) {  
      console.warn("[Auth] Failed to fetch user with valid token");  
      deleteCookie("token");  
      setToken(null);  
    }  
  } catch (error) {  
    console.error("[Auth] Initialization error:", error);  
    deleteCookie("token");  
    setToken(null);  
    setUser(null);  
  } finally {  
    setIsLoading(false);  
    setInitComplete(true);  
    console.log("[Auth] Initialization complete", {  
      hasToken: !!savedToken,  
      hasUser: !!user,  
      isAuthenticated: !!(user && savedToken)  
    });  
  }  
};  

initializeAuth();

}, [fetchUser]);

const refreshUser = async () => {
if (token) {
await fetchUser(token);
}
};

const login = async (
phoneNumber: string,
password: string
): Promise<AuthResult> => {
setIsLoading(true);
try {
console.log("[Auth] Attempting login...");
const res = await fetch("/api/auth/login", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ phoneNumber, password }),
});

const data = await res.json().catch(() => null);  

  if (!res.ok) {  
    const msg = data?.message || data?.error || `Login failed (${res.status})`;  
    console.error("[Auth] Login failed:", msg);  
    return { success: false, message: msg };  
  }  

  if (data?.token && isValidToken(data.token)) {  
    console.log("[Auth] Login successful, storing token in cookie");  
    setCookie("token", data.token, 7); // Store for 7 days  
    setToken(data.token);  
    // Fetch user data with the new token  
    await fetchUser(data.token);  
    return { success: true };  
  }  

  console.warn("[Auth] Login succeeded but no valid token returned");  
  return { success: false, message: "Login succeeded but no valid token returned" };  
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
console.log("[Auth] Attempting registration with data:", userData);

const res = await fetch("/api/auth/sign-up", {  
  method: "POST",  
  headers: { "Content-Type": "application/json" },  
  body: JSON.stringify(userData),  
});  

console.log("[Auth] Registration response status:", res.status);  
  
const data = await res.json().catch(async (parseError) => {  
  console.error("[Auth] Failed to parse response as JSON:", parseError);  
  // Try to get the raw text to see what the server actually returned  
  const rawText = await res.text();  
  console.error("[Auth] Raw response:", rawText);  
  return null;  
});  

if (!res.ok) {  
  const msg = data?.message || data?.error || `Registration failed (${res.status})`;  
  console.error("[Auth] Registration failed:", msg, "Full response:", data);  
  return { success: false, message: msg };  
}  

if (data?.token && isValidToken(data.token)) {  
  console.log("[Auth] Registration successful, storing token in cookie");  
  setCookie("token", data.token, 7);  
  setToken(data.token);  
    
  // IMPORTANT: Wait for user data to be fully fetched before returning  
  console.log("[Auth] Fetching user data with new token...");  
  const userFetched = await fetchUser(data.token);  
    
  if (userFetched) {  
    console.log("[Auth] User data fetched successfully, registration complete");  
    return { success: true };  
  } else {  
    console.error("[Auth] Failed to fetch user data after registration");  
    return { success: false, message: "Registration complete but failed to load user data" };  
  }  
}  

console.warn("[Auth] Registration succeeded but no valid token returned. Data:", data);  
return { success: false, message: "Registration succeeded but no valid token returned" };

} catch (err: any) {
console.error("[Auth] register error:", err);
return { success: false, message: err?.message || "Registration failed" };
} finally {
setIsLoading(false);
}
};
const logout = (): void => {
console.log("[Auth] Logging out...");
deleteCookie("token");
setToken(null);
setUser(null);
setInitComplete(true);
if (typeof window !== "undefined") {
window.dispatchEvent(new CustomEvent("auth:logout"));
}
// Use replace to avoid adding logout to history
router.replace("/sign-up");
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
    body: JSON.stringify({}),  
  });  

  if (res.ok) {  
    // Update local state immediately for better UX  
    setUser(prev => prev ? { ...prev, isSetupComplete: true } : null);  
    // Then refresh from backend to ensure consistency  
    await refreshUser();  
  } else {  
    const errText = await res.text();  
    console.error("[Auth] completeSetup failed:", res.status, errText);  
    throw new Error(`Setup completion failed: ${res.status}`);  
  }  
} catch (err) {  
  console.error("[Auth] completeSetup error:", err);  
  throw err;  
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

return (
<AuthContext.Provider value={value}>
{children}
</AuthContext.Provider>
);
};

export const useAuth = (): AuthContextType => {
const context = useContext(AuthContext);
if (!context) {
throw new Error("useAuth must be used within an AuthProvider");
}
return context;
};