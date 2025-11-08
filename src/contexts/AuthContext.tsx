"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { notificationService } from '@/services/notificationService';
import { useI18n } from '@/contexts/I18nContext';

// =======================
// Types
// =======================
export interface User {
  id: string;
  name: string;
  username: string;
  phoneNumber: string;
  email?: string;
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

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string, password: string) => Promise<boolean | { requiresPhoneVerification: boolean; verificationToken?: string; message?: string }>;
  register: (userData: { name: string; username: string; phoneNumber: string; password: string }) => Promise<boolean | { requiresPhoneVerification: boolean; verificationToken?: string; message?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  completeSetup: () => void;
  verifyPhone: (token: string) => Promise<boolean>;
  resendPhoneVerification: (phoneNumber: string) => Promise<boolean>;
  sendVerificationCode: (phoneNumber: string, method: 'whatsapp' | 'sms') => Promise<boolean>;
}

// =======================
// Context
// =======================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// =======================
// Provider
// =======================
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { setLanguage } = useI18n();

  const isAuthenticated = !!user;

  // =======================
  // Load user from backend
  // =======================
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.user?.language) setLanguage(data.user.language);
        } else {
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        setUser(null);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [setLanguage]);
  
  
useEffect(() => {
  if (user) {
    const setupComplete = user.isSetupComplete ?? false;
    router.replace(setupComplete ? '/home' : '/SignInSetUp');
  }
}, [user, router]);
  // =======================
  // Login
  // =======================
  const login = async (phoneNumber: string, password: string): Promise<boolean | { requiresPhoneVerification: boolean; verificationToken?: string; message?: string }> => {
  setIsLoading(true);
  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, password }),
    });

    if (!res.ok) throw new Error('Login failed');

    const data = await res.json();

    if (data.requiresPhoneVerification) {
      return { requiresPhoneVerification: true, verificationToken: data.verificationToken, message: data.message };
    }

    if (data.token) localStorage.setItem('token', data.token);

    setUser(data.user);
    if (data.user.language) setLanguage(data.user.language);

    // مش هنا redirect بعد كده، هنعمله في useEffect
    return true;
  } catch (err) {
    console.error('Login error:', err);
    return false;
  } finally {
    setIsLoading(false);
  }
};
  // =======================
  // Register
  // =======================
  const register = async (userData: { name: string; username: string; phoneNumber: string; password: string }): Promise<boolean | { requiresPhoneVerification: boolean; verificationToken?: string; message?: string }> => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!res.ok) throw new Error('Registration failed');

      const data = await res.json();

      if (data.requiresPhoneVerification) {
        return { requiresPhoneVerification: true, verificationToken: data.verificationToken, message: data.message };
      }

      if (data.token) localStorage.setItem('token', data.token);

      setUser(data.user);
      router.replace('/SignInSetUp');

      return true;
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // =======================
  // Logout
  // =======================
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/sign-up');
    window.dispatchEvent(new CustomEvent('auth:logout'));
  };

  // =======================
  // Update user
  // =======================
  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  // =======================
  // Complete setup
  // =======================
  const completeSetup = async () => {
    try {
      if (!user) throw new Error('User not found');
      const res = await apiFetch(`/api/user/${user.id}/complete-setup`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to complete setup');
      const data = await res.json();
      setUser(data.user);
      router.push('/home');
    } catch (err) {
      console.error('Complete setup error:', err);
      setUser(prev => prev ? { ...prev, isSetupComplete: true } : null);
      router.push('/home');
    }
  };

  // =======================
  // Phone verification
  // =======================
  const verifyPhone = async (token: string) => {
    try {
      const res = await apiFetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error('Phone verification failed');
      return true;
    } catch (err) {
      console.error('Verify phone error:', err);
      throw err;
    }
  };

  const resendPhoneVerification = async (phoneNumber: string) => {
    try {
      const res = await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      if (!res.ok) throw new Error('Failed to resend verification code');
      return true;
    } catch (err) {
      console.error('Resend phone verification error:', err);
      throw err;
    }
  };

  const sendVerificationCode = async (phoneNumber: string, method: 'whatsapp' | 'sms') => {
    try {
      const res = await apiFetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, method }),
      });
      if (!res.ok) throw new Error('Failed to send verification code');
      return true;
    } catch (err) {
      console.error('Send verification code error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      updateUser,
      completeSetup,
      verifyPhone,
      resendPhoneVerification,
      sendVerificationCode,
    }}>
      {children}
    </AuthContext.Provider>
  );
};