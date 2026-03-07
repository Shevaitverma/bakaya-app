/**
 * Authentication Context for managing auth state
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';
import type {
  User,
  LoginResponse,
  RegisterResponse,
  AuthState,
} from '../types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, username?: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  logout: () => void;
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

  // Load persisted session on app start
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

  const login = useCallback(
    async (email: string, password: string, username: string = '') => {
      setIsLoading(true);
      setError(null);
      try {
        const response: LoginResponse = await authService.login(
          email,
          password,
          username
        );

        if (response.success && response.data) {
          const { user, accessToken, refreshToken } = response.data;
          setUser(user);
          setAccessToken(accessToken);
          setRefreshToken(refreshToken);

          // Persist session
          await storage.saveUser(user);
          await storage.saveTokens(accessToken, refreshToken);
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
    []
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
        console.log('[AUTH CONTEXT] Calling register with:', {
          email,
          username,
          hasPassword: !!password,
          firstName,
          lastName,
        });

        const response: RegisterResponse = await authService.register({
          email,
          username,
          password,
          firstName,
          lastName,
        });

        console.log('[AUTH CONTEXT] Register response:', JSON.stringify(response, null, 2));
        console.log('[AUTH CONTEXT] Response type:', typeof response);
        console.log('[AUTH CONTEXT] Response.success:', response?.success);
        console.log('[AUTH CONTEXT] Response.data:', response?.data);
        console.log('[AUTH CONTEXT] Response.data.user:', response?.data?.user);

        // Validate response structure
        if (!response || typeof response !== 'object') {
          console.error('[AUTH CONTEXT] Invalid response structure:', response);
          throw new Error('Invalid response from server');
        }

        if (response.success && response.data && response.data.user) {
          console.log('[AUTH CONTEXT] Registration successful, setting user');
          setUser(response.data.user);
          setError(null); // Clear any previous errors on success
          // Registration doesn't return tokens, so user needs to login
        } else {
          console.error('[AUTH CONTEXT] Registration failed - invalid response structure');
          // Extract error message from response if available
          const errorMsg =
            (response as any)?.message ||
            (response as any)?.error ||
            'Registration failed: Invalid response from server';
          console.error('[AUTH CONTEXT] Error message:', errorMsg);
          throw new Error(errorMsg);
        }
      } catch (err) {
        console.error('[AUTH CONTEXT] Register catch block - Error:', err);
        console.error('[AUTH CONTEXT] Error type:', typeof err);
        console.error('[AUTH CONTEXT] Error constructor:', err?.constructor?.name);
        console.error('[AUTH CONTEXT] Error message:', err instanceof Error ? err.message : String(err));
        console.error('[AUTH CONTEXT] Full error object:', JSON.stringify(err, null, 2));

        let errorMessage = 'An error occurred during registration';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else if (err && typeof err === 'object') {
          // Try to extract message from error object
          errorMessage = (err as any)?.message || (err as any)?.error || JSON.stringify(err);
        }

        console.error('[AUTH CONTEXT] Setting error message:', errorMessage);
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
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
    logout,
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
