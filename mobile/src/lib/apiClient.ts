/**
 * Centralized fetch wrapper for TanStack Query.
 *
 * - Auto-attaches Bearer token from storage
 * - Handles 401 with token refresh (deduped)
 * - Throws typed errors with statusCode for QueryCache
 * - Timeout via AbortController
 */

import { API_CONFIG } from '../constants/api';
import { storage } from '../utils/storage';
import { authService } from '../services/authService';

interface ApiError extends Error {
  statusCode?: number;
}

function createApiError(message: string, statusCode: number): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  return error;
}

// Token refresh deduplication
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await storage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await authService.refreshTokens(refreshToken);
    if (response.success && response.data) {
      await storage.saveTokens(response.data.accessToken, response.data.refreshToken);
      return response.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

async function rawFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = 15000,
  tokenOverride?: string,
): Promise<T> {
  const token = tokenOverride ?? (await storage.getAccessToken());
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: abortController.signal,
      headers: {
        ...API_CONFIG.HEADERS,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: any = {};
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch {
        // ignore parse error
      }

      const message =
        errorData.error?.message ||
        errorData.message ||
        (typeof errorData.error === 'string' ? errorData.error : '') ||
        `Request failed with status ${response.status}`;

      throw createApiError(message, response.status);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      throw createApiError('Request timeout', 408);
    }

    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw createApiError('Network error: Unable to connect', 0);
    }

    throw err;
  }
}

/**
 * Main API client with auto-retry on 401 after token refresh.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = 15000,
): Promise<T> {
  try {
    return await rawFetch<T>(endpoint, options, timeout);
  } catch (err) {
    const apiError = err as ApiError;

    if (apiError.statusCode === 401) {
      // Deduplicate concurrent refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }

      const newToken = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;

      if (newToken) {
        // Retry with new token
        return rawFetch<T>(endpoint, options, timeout, newToken);
      }
    }

    throw err;
  }
}
