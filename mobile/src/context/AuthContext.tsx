/**
 * Authentication Context for managing auth state
 *
 * Provides login, register, googleLogin, logout, and token refresh.
 *
 * Token refresh is unified with the service-layer 401 retry: both paths
 * go through `authedFetch.getOrStartRefresh()`, so a foreground-proactive
 * refresh and a concurrent 401 inside a data fetch can never fire two
 * /auth/refresh calls at once.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';
import { setOnSessionExpired, getOrStartRefresh } from '../lib/authedFetch';
import type {
  User,
  LoginResponse,
  RegisterResponse,
  GoogleAuthResponse,
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

  // ---- logout (needs to be defined before the effect that uses it) ----

  const logout = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setError(null);

    // Clear persisted session
    await storage.clearAll();
  }, []);

  // ---- Register the global session-expired callback ----
  //
  // When `authedFetch` detects that the server rejected the refresh token
  // (401/403 from /auth/refresh), it calls this — the ONLY path that
  // surfaces a "session expired" UX to the user. Transient network / 5xx
  // failures during refresh do NOT trigger this callback.

  useEffect(() => {
    setOnSessionExpired(async () => {
      console.log('[AUTH] Session expired — refresh token rejected by server');
      await logout();
    });
    return () => {
      setOnSessionExpired(null);
    };
  }, [logout]);

  // ---- Token refresh ----

  /**
   * Attempt to refresh the session using the stored refresh token.
   * Returns true on success, false otherwise.
   *
   * Uses the shared `getOrStartRefresh` so a proactive refresh (e.g. on
   * foreground) and a concurrent 401-triggered refresh never race.
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    const currentRefresh = refreshTokenRef.current ?? (await storage.getRefreshToken());
    if (!currentRefresh) return false;

    try {
      const outcome = await getOrStartRefresh();
      if (outcome.ok) {
        // The shared refresh already persisted the new tokens & user; pull
        // them into React state so subsequent renders see the fresh values.
        const [savedUser, savedAccess, savedRefresh] = await Promise.all([
          storage.getUser(),
          storage.getAccessToken(),
          storage.getRefreshToken(),
        ]);
        if (savedUser && savedAccess && savedRefresh) {
          setUser(savedUser);
          setAccessToken(savedAccess);
          setRefreshToken(savedRefresh);
        }
        console.log('[AUTH] Token refreshed successfully');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[AUTH] Token refresh failed:', err);
      return false;
    }
  }, []);

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
