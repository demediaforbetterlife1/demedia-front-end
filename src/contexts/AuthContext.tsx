"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { notificationService } from '@/services/notificationService';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/contexts/I18nContext';

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
  verifyPhone: (token: string) => Promise<boolean>;
  resendPhoneVerification: (phoneNumber: string) => Promise<boolean>;
  sendVerificationCode: (phoneNumber: string, method: 'whatsapp' | 'sms') => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
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

  // Check user session directly from backend
  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.language) setLanguage(data.user.language);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (phoneNumber: string, password: string): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(errData.error || 'Login failed');
      }

      const data = await res.json();
      if (data.requiresPhoneVerification) {
        throw new Error(data.message || 'Please verify your phone number');
      }

      setUser(data.user);
      if (data.user.language) setLanguage(data.user.language);

      router.replace(data.user.isSetupComplete ? '/home' : '/SignInSetUp');

      setTimeout(() => {
        if (data.user.name) notificationService.showWelcomeNotification(data.user.name);
      }, 100);

      return true;
    } catch (err: unknown) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const register = async (userData: { name: string; username: string; phoneNumber: string; password: string }): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(errData.error || 'Registration failed');
      }

      const data = await res.json();
      if (!data.user) throw new Error('Registration succeeded but no user data returned');

      setUser(data.user);
      if (data.user.language) setLanguage(data.user.language);

      router.replace('/SignInSetUp');
      return true;
    } catch (err: unknown) {
      console.error('Registration error:', err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    router.push('/sign-up');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...userData } : null));
  };

  const completeSetup = async () => {
    try {
      const res = await apiFetch('/api/user/complete-setup', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
      router.push('/home');
    } catch (err) {
      console.error('Complete setup error:', err);
      setUser(prev => (prev ? { ...prev, isSetupComplete: true } : null));
      router.push('/home');
    }
  };

  const verifyPhone = async (token: string): Promise<boolean> => {
    const res = await apiFetch('/api/auth/verify-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Phone verification failed' }));
      throw new Error(data.error);
    }
    return true;
  };

  const resendPhoneVerification = async (phoneNumber: string): Promise<boolean> => {
    const res = await apiFetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to resend verification code' }));
      throw new Error(data.error);
    }
    return true;
  };

  const sendVerificationCode = async (phoneNumber: string, method: 'whatsapp' | 'sms'): Promise<boolean> => {
    const res = await apiFetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, method }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed to send verification code' }));
      throw new Error(data.error);
    }
    return true;
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
        verifyPhone,
        resendPhoneVerification,
        sendVerificationCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
