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
  email: string;
  profilePicture?: string;
  dob?: string;
  age?: number;
  language?: string;
  interests?: string[];
  isSetupComplete?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: { name: string; username: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  completeSetup: () => void;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (token && userId && token !== 'temp-token') {
          const res = await apiFetch(`/api/auth/me`);

          if (res.ok) {
            const userData = await res.json();
            setUser(userData.user);
            if (userData.user?.language) {
              setLanguage(userData.user.language);
            } else {
              const storedLang = localStorage.getItem('language');
              if (storedLang) setLanguage(storedLang);
            }
          } else {
            console.log('Auth check failed, clearing tokens');
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const userData = data.user;
        
        // Store auth data
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        localStorage.setItem('userId', userData.id);
        
        setUser(userData);
        if (userData.language) setLanguage(userData.language);
        
        // Redirect based on setup status
        if (userData.isSetupComplete) {
          router.push('/home');
        } else {
          router.push('/SignInSetUp');
        }

        // Fire a welcome notification (non-blocking)
        try {
          if (userData.name) {
            notificationService.showWelcomeNotification(userData.name);
          }
        } catch (e) {
          // ignore notification errors silently
        }
        
        return true;
      } else {
        let message = 'Login failed';
        try {
          const txt = await res.text();
          message = (() => { try { return JSON.parse(txt).error || message; } catch { return txt || message; } })();
        } catch {}
        throw new Error(message);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: { name: string; username: string; email: string; password: string }): Promise<any> => {
    try {
      // Add a wrapper to catch any "Something went wrong" errors
      return await registerInternal(userData);
    } catch (error) {
      // Final catch for any remaining "Something went wrong" errors
      if (error instanceof Error && error.message.includes('Something went wrong')) {
        console.log('Final catch: Converting "Something went wrong" to proper error');
        throw new Error('Registration failed. Please try a different username or email.');
      }
      throw error;
    }
  };

  const registerInternal = async (userData: { name: string; username: string; email: string; password: string }): Promise<any> => {
    try {
      console.log('Starting registration for:', userData.username);
      const res = await apiFetch(`/api/auth/sign-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      console.log('Registration response status:', res.status);
      console.log('Registration response ok:', res.ok);

      if (res.ok) {
        const data = await res.json();
        console.log('Registration success data:', data);
        const newUser = data.user;
        
        // Store auth data
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        localStorage.setItem('userId', newUser.id);
        
        setUser(newUser);
        
        // If email verification is required, return the verification data
        if (data.requiresEmailVerification) {
          return {
            requiresEmailVerification: true,
            verificationToken: data.verificationToken,
            message: data.message
          };
        }
        
        // Redirect to setup if no verification needed
        router.push('/SignInSetUp');
        
        return true;
      } else {
        console.log('Registration failed with status:', res.status);
        let errorText = '';
        let errorData = null;
        
        try {
          errorText = await res.text();
          console.log('Raw error response:', errorText);
          errorData = JSON.parse(errorText);
          console.log('Parsed error data:', errorData);
        } catch (parseError) {
          console.log('Error parsing response:', parseError);
          console.log('Using raw error text:', errorText);
        }
        
        // Extract the actual error message
        let message = 'Registration failed';
        if (errorData && errorData.error) {
          message = errorData.error;
        } else if (errorText) {
          message = errorText;
        }
        
        console.log('Final error message:', message);
        throw new Error(message);
      }
    } catch (error) {
      console.error('Registration error caught:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Error toString:', error?.toString());
      
      // Re-throw the error with proper message
      if (error instanceof Error) {
        // Fix the "Something went wrong" error specifically
        if (error.message === 'Something went wrong' || error.message.includes('Something went wrong')) {
          console.log('Converting "Something went wrong" to proper error message');
          throw new Error('Registration failed. Please try a different username or email.');
        }
      throw error;
      } else {
        // Handle non-Error objects that might contain "Something went wrong"
        const errorStr = error?.toString() || '';
        if (errorStr.includes('Something went wrong')) {
          console.log('Converting non-Error "Something went wrong" to proper error message');
          throw new Error('Registration failed. Please try a different username or email.');
        }
        throw new Error(error?.message || 'Registration failed. Please try again.');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
    router.push('/sign-up');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const completeSetup = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('No user ID found');
        return;
      }

      const res = await apiFetch(`/api/user/${userId}/complete-setup`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        router.push('/home');
      } else {
        console.error('Failed to complete setup');
        // Fallback: just update locally
        setUser(prev => prev ? { ...prev, isSetupComplete: true } : null);
        router.push('/home');
      }
    } catch (error) {
      console.error('Error completing setup:', error);
      // Fallback: just update locally
      setUser(prev => prev ? { ...prev, isSetupComplete: true } : null);
      router.push('/home');
    }
  };

  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        return true;
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Email verification failed');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  };

  const resendVerification = async (email: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        return true;
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to resend verification code');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
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
      verifyEmail,
      resendVerification,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
