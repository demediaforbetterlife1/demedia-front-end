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
  bio?: string;
  dateOfBirth?: string;
  dob?: string;
  age?: number;
  language?: string;
  preferredLang?: string;
  interests?: string[];
  isSetupComplete?: boolean;
  isPhoneVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string, password: string) => Promise<boolean>;
  register: (userData: { name: string; username: string; phoneNumber: string; password: string }) => Promise<boolean | { requiresPhoneVerification: boolean; verificationToken?: string; message?: string }>;
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
  const [authChecked, setAuthChecked] = useState(false);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const router = useRouter();
  const { setLanguage } = useI18n();

  const isAuthenticated = !!user;

  useEffect(() => {
    // Listen for auto-logout events from API
    const handleAutoLogout = () => {
      console.log('Auto logout event received');
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener('auth:logout', handleAutoLogout);

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        console.log('AuthContext checkAuth:', { token: token ? 'exists' : 'null', userId });
        
        // First check if backend is healthy (with retry limit)
        if (connectionRetries < 3) {
          try {
            const healthResponse = await fetch('/api/health', { 
              method: 'GET',
              signal: AbortSignal.timeout(3000) // 3 second timeout for health check
            });
            if (!healthResponse.ok) {
              console.log(`Backend health check failed (attempt ${connectionRetries + 1}/3), retrying in 2 seconds`);
              setConnectionRetries(prev => prev + 1);
              setTimeout(checkAuth, 2000);
              return;
            }
          } catch (healthError) {
            console.log(`Backend health check error (attempt ${connectionRetries + 1}/3), retrying in 2 seconds:`, healthError);
            setConnectionRetries(prev => prev + 1);
            setTimeout(checkAuth, 2000);
            return;
          }
        } else {
          console.log('Max connection retries reached, proceeding with auth check');
        }
        
        if (token && userId && token !== 'temp-token') {
          // Check if token is expired (basic check)
          try {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            const now = Date.now() / 1000;
            if (tokenData.exp && tokenData.exp < now) {
              console.log('Token expired, clearing tokens');
              localStorage.removeItem('token');
              localStorage.removeItem('userId');
              setUser(null);
              return;
            }
          } catch (e) {
            console.log('Token format invalid, proceeding with auth check');
          }
          
          console.log('Making auth check request to /api/auth/me');
          const res = await apiFetch(`/api/auth/me`);
          console.log('Auth check response status:', res.status, 'ok:', res.ok);

          if (res.ok) {
            const userData = await res.json();
            console.log('Auth check success, user data:', userData);
            
            setUser(userData.user);
            setConnectionRetries(0); // Reset retry counter on success
            if (userData.user?.language) {
              setLanguage(userData.user.language);
            } else {
              const storedLang = localStorage.getItem('language');
              if (storedLang) setLanguage(storedLang);
            }
          } else if (res.status === 401) {
            console.log('Token expired or invalid, clearing tokens');
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            setUser(null);
          } else {
            console.log('Auth check failed with status:', res.status);
            // Don't clear tokens for server errors, only for auth errors
            if (res.status >= 500) {
              console.log('Server error, keeping tokens for retry');
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            setUser(null);
            }
          }
        } else {
          console.log('No valid token/userId, setting user to null');
          setUser(null);
          setConnectionRetries(0); // Reset retry counter when no token
        }
      } catch (error: unknown) {
        console.error('Auth check failed:', error);
        // Only clear tokens if it's a network error or server error, not auth errors
        if (error instanceof Error && (
          error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') ||
          error.message.includes('timeout')
        )) {
          console.log('Network error during auth check, keeping tokens');
        } else {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        }
        setUser(null);
      } finally {
        setIsLoading(false);
        setAuthChecked(true);
        // Reset connection retries after auth check completes
        if (connectionRetries > 0) {
          setConnectionRetries(0);
        }
      }
    };

    // Add a small delay to prevent rapid auth checks
    const timeoutId = setTimeout(checkAuth, 50);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('auth:logout', handleAutoLogout);
    };
  }, []);

  const login = async (phoneNumber: string, password: string, retryCount = 2): Promise<boolean> => {
    try {
      console.log('AuthContext: Starting login process');
      const res = await apiFetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password }),
      });

      console.log('AuthContext: Login response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('AuthContext: Login response data:', data);
        
        // Check if phone verification is required
        if (data.requiresPhoneVerification) {
          throw new Error(data.message || "Please verify your phone number before logging in");
        }
        
        const userData = data.user;
        console.log('AuthContext: User data received:', userData);
        
        // Store auth data immediately
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('AuthContext: Token stored');
        }
        localStorage.setItem('userId', userData.id);
        console.log('AuthContext: User ID stored:', userData.id);
        
        // Update user state immediately
        setUser(userData);
        if (userData.language) setLanguage(userData.language);
        
        console.log('AuthContext: User state updated, redirecting...');
        
        // Use replace instead of push for faster navigation
        if (userData.isSetupComplete) {
          console.log('AuthContext: Setup complete, redirecting to home');
          router.replace('/home');
        } else {
          console.log('AuthContext: Setup not complete, redirecting to SignInSetUp');
          router.replace('/SignInSetUp');
        }

        // Fire a welcome notification (non-blocking)
        setTimeout(() => {
        try {
          if (userData.name) {
            notificationService.showWelcomeNotification(userData.name);
          }
        } catch (e) {
          // ignore notification errors silently
        }
        }, 100);
        
        return true;
      } else {
        let message = 'Login failed';
        try {
          const txt = await res.text();
          console.log('AuthContext: Error response text:', txt);
          const errorData = (() => { 
            try { 
              return JSON.parse(txt); 
            } catch { 
              return { error: txt || res.statusText }; 
            } 
          })();
          message = errorData.error || errorData.message || message;
        } catch (e) {
          console.log('AuthContext: Error parsing response:', e);
          message = `Login failed (${res.status}): ${res.statusText}`;
        }
        console.log('AuthContext: Throwing error:', message);
        throw new Error(message);
      }
    } catch (error: unknown) {
      console.error('AuthContext: Login error:', error);
      
      // Retry on network errors with shorter delays
      if (retryCount > 0 && error instanceof Error && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('timeout')
      )) {
        console.log(`Retrying login, attempts left: ${retryCount}`);
        await new Promise(resolve => setTimeout(resolve, 300 * (3 - retryCount)));
        return login(phoneNumber, password, retryCount - 1);
      }
      
      throw error;
    }
  };

  const register = async (userData: { name: string; username: string; phoneNumber: string; password: string }): Promise<boolean | { requiresPhoneVerification: boolean; verificationToken?: string; message?: string }> => {
    try {
      // Add a wrapper to catch any "Something went wrong" errors
      return await registerInternal(userData);
    } catch (error: unknown) {
      // Final catch for any remaining "Something went wrong" errors
      if (error instanceof Error && error.message.includes('Something went wrong')) {
        console.log('Final catch: Converting "Something went wrong" to proper error');
        throw new Error('Registration failed. Please try a different username or phone number.');
      }
      throw error;
    }
  };

  const registerInternal = async (userData: { name: string; username: string; phoneNumber: string; password: string }): Promise<boolean | { requiresPhoneVerification: boolean; verificationToken?: string; message?: string }> => {
    try {
      console.log('AuthContext: Starting registration for:', userData.username);
      console.log('AuthContext: Registration data:', { 
        name: userData.name, 
        username: userData.username, 
        phoneNumber: userData.phoneNumber 
      });
      
      const res = await apiFetch(`/api/auth/sign-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      console.log('AuthContext: Registration response status:', res.status);
      console.log('AuthContext: Registration response ok:', res.ok);

      if (res.ok) {
        const data = await res.json();
        console.log('AuthContext: Registration success data:', data);
        const newUser = data.user;
        
        // Store auth data and proceed to setup
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('AuthContext: Token stored');
        }
        localStorage.setItem('userId', newUser.id);
        console.log('AuthContext: User ID stored:', newUser.id);
        
        setUser(newUser);
        console.log('AuthContext: User state updated');
        
        // Redirect to setup with replace for faster navigation
        console.log('AuthContext: Redirecting to SignInSetUp');
        router.replace('/SignInSetUp');
        
        return true;
      } else {
        console.log('AuthContext: Registration failed with status:', res.status);
        let errorText = '';
        let errorData = null;
        
        try {
          errorText = await res.text();
          console.log('AuthContext: Raw error response:', errorText);
          errorData = JSON.parse(errorText);
          console.log('AuthContext: Parsed error data:', errorData);
        } catch (parseError) {
          console.log('AuthContext: Error parsing response:', parseError);
          console.log('AuthContext: Using raw error text:', errorText);
        }
        
        // Extract the actual error message
        let message = 'Registration failed';
        if (errorData && errorData.error) {
          message = errorData.error;
        } else if (errorText) {
          message = errorText;
        }
        
        console.log('AuthContext: Final error message:', message);
        console.log('AuthContext: Error data:', errorData);
        throw new Error(message);
      }
    } catch (error: unknown) {
      console.error('AuthContext: Registration error caught:', error);
      console.error('AuthContext: Error type:', typeof error);
      console.error('AuthContext: Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('AuthContext: Error toString:', error?.toString());
      
      // Re-throw the error with proper message
      if (error instanceof Error) {
        // Handle network errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
        // Handle server errors
        if (error.message.includes('Database connection error')) {
          throw new Error('Server is temporarily unavailable. Please try again in a few moments.');
        }
        // Handle timeout errors
        if (error.message.includes('timeout')) {
          throw new Error('Request timeout. Please try again.');
        }
        throw error;
      } else {
        throw new Error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
      }
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
    // Clear any cached data
    if (typeof window !== 'undefined') {
      // Clear any other auth-related data
      localStorage.removeItem('language');
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
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
    } catch (error: unknown) {
      console.error('Error completing setup:', error);
      // Fallback: just update locally
      setUser(prev => prev ? { ...prev, isSetupComplete: true } : null);
      router.push('/home');
    }
  };

  const verifyPhone = async (token: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/auth/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        return true;
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Phone verification failed');
      }
    } catch (error: unknown) {
      console.error('Phone verification error:', error);
      throw error;
    }
  };

  const resendPhoneVerification = async (phoneNumber: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      if (res.ok) {
        return true;
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to resend verification code');
      }
    } catch (error: unknown) {
      console.error('Resend phone verification error:', error);
      throw error;
    }
  };

  const sendVerificationCode = async (phoneNumber: string, method: 'whatsapp' | 'sms'): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, method }),
      });

      if (res.ok) {
        return true;
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send verification code');
      }
    } catch (error: unknown) {
      console.error('Send verification code error:', error);
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
      verifyPhone,
      resendPhoneVerification,
      sendVerificationCode,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
