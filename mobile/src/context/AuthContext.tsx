/**
 * Authentication Context for managing auth state
 *
 * Provides login, register, googleLogin, logout, and token refresh.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';
import type {
  User,
  LoginResponse,
  RegisterResponse,
  GoogleAuthResponse,
  RefreshTokenResponse,
  AuthState,
} from '../types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  googleLogin: (firebaseIdToken: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with true to check for persisted session
  const [error, setError] = useState<string | null>(null);

  // Keep a ref so the refresh callback always reads the latest token
  const refreshTokenRef = useRef<string | null>(null);
  refreshTokenRef.current = refreshToken;

  // ---- helper: persist session ----

  const applySession = useCallback(
    async (userData: User, access: string, refresh: string) => {
      setUser(userData);
      setAccessToken(access);
      setRefreshToken(refresh);
      await storage.saveUser(userData);
      await storage.saveTokens(access, refresh);
    },
    []
  );

  // ---- Load persisted session on app start ----

  useEffect(() => {
    const loadSession = async () => {
      try {
        const [savedUser, savedAccessToken, savedRefreshToken] = await Promise.all([
          storage.getUser(),
          storage.getAccessToken(),
          storage.getRefreshToken(),
        ]);

        if (savedUser && savedAccessToken) {
          setUser(savedUser);
          setAccessToken(savedAccessToken);
          setRefreshToken(savedRefreshToken);
        }
      } catch (err) {
        console.error('Error loading session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  // ---- Token refresh ----

  /**
   * Attempt to refresh the session using the stored refresh token.
   * Returns true on success, false otherwise (caller should redirect to login).
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    const currentRefresh = refreshTokenRef.current;
    if (!currentRefresh) return false;

    try {
      const response: RefreshTokenResponse = await authService.refreshTokens(currentRefresh);

      if (response.success && response.data) {
        const { user: updatedUser, accessToken: newAccess, refreshToken: newRefresh } = response.data;
        await applySession(updatedUser, newAccess, newRefresh);
        console.log('[AUTH] Token refreshed successfully');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[AUTH] Token refresh failed:', err);
      return false;
    }
  }, [applySession]);

  // ---- Auth actions ----

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response: LoginResponse = await authService.login(email, password);

        if (response.success && response.data) {
          const { user: u, accessToken: at, refreshToken: rt } = response.data;
          await applySession(u, at, rt);
        } else {
          throw new Error('Login failed');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred during login';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [applySession]
  );

  const register = useCallback(
    async (
      email: string,
      username: string,
      password: string,
      firstName: string,
      lastName: string
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const response: RegisterResponse = await authService.register({
          email,
          username,
          password,
          firstName,
          lastName,
        });

        // Server register returns { success, data: User } (user object directly, not nested under data.user)
        if (response.success && response.data) {
          setUser(response.data);
          setError(null);
          // Registration doesn't return tokens - user needs to login
        } else {
          throw new Error('Registration failed: Invalid response from server');
        }
      } catch (err) {
        let errorMessage = 'An error occurred during registration';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const googleLogin = useCallback(
    async (firebaseIdToken: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response: GoogleAuthResponse = await authService.googleLogin(firebaseIdToken);

        if (response.success && response.data) {
          const { user: u, accessToken: at, refreshToken: rt } = response.data;
          await applySession(u, at, rt);
          console.log('[AUTH] Google login successful');
        } else {
          throw new Error('Google login failed');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred during Google sign-in';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setError(null);

    // Clear persisted session
    await storage.clearAll();
  }, []);

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    login,
    register,
    googleLogin,
    logout,
    refreshSession,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
