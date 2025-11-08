"use client"

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  ReactNode,
} from "react";

// =======================
// ✅ Types
// =======================
interface User {
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
  interests?: string[]; // <-- تأكد إن السطر ده موجود
  isSetupComplete?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (info: RegisterData) => Promise<AuthResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
}

// =======================
// ✅ Context Initialization
// =======================
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =======================
// ✅ Provider
// =======================
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user info
  const fetchUser = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data.user || data);
    } catch (error) {
      console.error("❌ Failed to load user:", error);
      setUser(null);
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Trigger fetchUser when token changes
  useEffect(() => {
    if (token) fetchUser();
  }, [token, fetchUser]);

  // =======================
  // ✅ login
  // =======================
  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.message || "Login failed");

      localStorage.setItem("token", data.token);
      setToken(data.token);
      await fetchUser();

      return { success: true };
    } catch (error: any) {
      console.error("❌ Login error:", error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // ✅ register
  // =======================
  const register = async (info: RegisterData): Promise<AuthResult> => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });

      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.message || "Registration failed");

      localStorage.setItem("token", data.token);
      setToken(data.token);
      await fetchUser();

      return { success: true };
    } catch (error: any) {
      console.error("❌ Register error:", error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // ✅ logout
  // =======================
  const logout = (): void => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // =======================
  // ✅ refreshUser
  // =======================
  const refreshUser = async (): Promise<void> => {
    if (token) await fetchUser();
  };

  // =======================
  // ✅ Context Value
  // =======================
  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    refreshUser,
  };

  // =======================
  // ✅ Render
  // =======================
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// =======================
// ✅ Custom Hook
// =======================
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};