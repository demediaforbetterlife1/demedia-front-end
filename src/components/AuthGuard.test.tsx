import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthGuard } from './AuthGuard';
import { AuthContext, AuthContextType, User } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('AuthGuard - Redirect to /sign-up', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as any);
  });

  /**
   * Test: Unauthenticated user on protected route redirects to /sign-up
   * Validates: Requirements 1.1, 1.2
   */
  it('should redirect unauthenticated user to /sign-up when accessing protected route', async () => {
    mockUsePathname.mockReturnValue('/home');

    const authContextValue: AuthContextType = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      initComplete: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      completeSetup: jest.fn(),
      updateUserProfile: jest.fn(),
      updateUser: jest.fn(),
    };

    render(
      <AuthContext.Provider value={authContextValue}>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/sign-up');
    });
  });

  /**
   * Test: Unauthenticated user on public route (/sign-in) is allowed
   * Validates: Requirements 1.3, 1.4
   */
  it('should allow unauthenticated user to access /sign-in', async () => {
    mockUsePathname.mockReturnValue('/sign-in');

    const authContextValue: AuthContextType = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      initComplete: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      completeSetup: jest.fn(),
      updateUserProfile: jest.fn(),
      updateUser: jest.fn(),
    };

    render(
      <AuthContext.Provider value={authContextValue}>
        <AuthGuard>
          <div>Sign In Page</div>
        </AuthGuard>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).not.toHaveBeenCalled();
      expect(screen.getByText('Sign In Page')).toBeInTheDocument();
    });
  });

  /**
   * Test: Unauthenticated user on public route (/sign-up) is allowed
   * Validates: Requirements 1.3, 1.4
   */
  it('should allow unauthenticated user to access /sign-up', async () => {
    mockUsePathname.mockReturnValue('/sign-up');

    const authContextValue: AuthContextType = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      initComplete: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      completeSetup: jest.fn(),
      updateUserProfile: jest.fn(),
      updateUser: jest.fn(),
    };

    render(
      <AuthContext.Provider value={authContextValue}>
        <AuthGuard>
          <div>Sign Up Page</div>
        </AuthGuard>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).not.toHaveBeenCalled();
      expect(screen.getByText('Sign Up Page')).toBeInTheDocument();
    });
  });

  /**
   * Test: Authenticated user is not affected by redirect
   * Validates: Requirements 1.3
   */
  it('should not redirect authenticated user on protected route', async () => {
    mockUsePathname.mockReturnValue('/home');

    const mockUser: User = {
      id: 'user-123',
      name: 'Test User',
      isSetupComplete: true,
    };

    const authContextValue: AuthContextType = {
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      initComplete: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      completeSetup: jest.fn(),
      updateUserProfile: jest.fn(),
      updateUser: jest.fn(),
    };

    render(
      <AuthContext.Provider value={authContextValue}>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).not.toHaveBeenCalled();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  /**
   * Test: Redirect happens after authentication initialization is complete
   * Validates: Requirements 1.2
   */
  it('should wait for auth initialization before redirecting', async () => {
    mockUsePathname.mockReturnValue('/home');

    const authContextValue: AuthContextType = {
      user: null,
      isLoading: true,
      isAuthenticated: false,
      initComplete: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      completeSetup: jest.fn(),
      updateUserProfile: jest.fn(),
      updateUser: jest.fn(),
    };

    render(
      <AuthContext.Provider value={authContextValue}>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </AuthContext.Provider>
    );

    // Should show loading state while initializing
    expect(screen.getByText(/Connecting to DeMedia/i)).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  /**
   * Test: Authenticated user trying to access /sign-in is redirected to /home
   * Validates: Requirements 1.3
   */
  it('should redirect authenticated user away from /sign-in to /home', async () => {
    mockUsePathname.mockReturnValue('/sign-in');

    const mockUser: User = {
      id: 'user-123',
      name: 'Test User',
      isSetupComplete: true,
    };

    const authContextValue: AuthContextType = {
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      initComplete: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      completeSetup: jest.fn(),
      updateUserProfile: jest.fn(),
      updateUser: jest.fn(),
    };

    render(
      <AuthContext.Provider value={authContextValue}>
        <AuthGuard>
          <div>Sign In Page</div>
        </AuthGuard>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/home');
    });
  });

  /**
   * Test: Authenticated user with incomplete setup is redirected to setup page
   * Validates: Requirements 1.3
   */
  it('should redirect authenticated user with incomplete setup to SignInSetUp', async () => {
    mockUsePathname.mockReturnValue('/home');

    const mockUser: User = {
      id: 'user-123',
      name: 'Test User',
      isSetupComplete: false,
    };

    const authContextValue: AuthContextType = {
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      initComplete: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      completeSetup: jest.fn(),
      updateUserProfile: jest.fn(),
      updateUser: jest.fn(),
    };

    render(
      <AuthContext.Provider value={authContextValue}>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/SignInSetUp');
    });
  });

  /**
   * Test: Unauthenticated user on /profile redirects to /sign-up
   * Validates: Requirements 1.1
   */
  it('should redirect unauthenticated user from /profile to /sign-up', async () => {
    mockUsePathname.mockReturnValue('/profile');

    const authContextValue: AuthContextType = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      initComplete: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      completeSetup: jest.fn(),
      updateUserProfile: jest.fn(),
      updateUser: jest.fn(),
    };

    render(
      <AuthContext.Provider value={authContextValue}>
        <AuthGuard>
          <div>Profile Page</div>
        </AuthGuard>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/sign-up');
    });
  });

  /**
   * Test: Unauthenticated user on /messeging redirects to /sign-up
   * Validates: Requirements 1.1
   */
  it('should redirect unauthenticated user from /messeging to /sign-up', async () => {
    mockUsePathname.mockReturnValue('/messeging');

    const authContextValue: AuthContextType = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      initComplete: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      completeSetup: jest.fn(),
      updateUserProfile: jest.fn(),
      updateUser: jest.fn(),
    };

    render(
      <AuthContext.Provider value={authContextValue}>
        <AuthGuard>
          <div>Messaging Page</div>
        </AuthGuard>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/sign-up');
    });
  });
});
