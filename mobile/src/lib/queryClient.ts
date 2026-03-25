/**
 * TanStack Query client with mobile-optimized defaults.
 *
 * - staleTime 5min: prevents refetch on tab switch within 5 minutes
 * - gcTime 30min: keeps cache in memory even after unmount
 * - Global 401 handler: triggers auth failure callback
 * - No retry on 401/404
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

interface ApiError extends Error {
  statusCode?: number;
}

let onAuthFailure: (() => void) | null = null;

export function setAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: Error) => {
      const apiError = error as ApiError;
      if (apiError.statusCode === 401) {
        onAuthFailure?.();
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: Error) => {
      const apiError = error as ApiError;
      if (apiError.statusCode === 401) {
        onAuthFailure?.();
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutes
      gcTime: 1000 * 60 * 30,         // 30 minutes
      retry: (failureCount, error) => {
        const apiError = error as ApiError;
        if (apiError.statusCode === 401) return false;
        if (apiError.statusCode === 404) return false;
        if (apiError.statusCode === 429) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
    },
  },
});
