/**
 * Thin compatibility wrapper for TanStack Query that delegates to
 * `authedFetch` — the centralized auth-aware fetch used by all services.
 *
 * - Auto-attaches Bearer token from storage
 * - Handles 401 with token refresh (deduped across the whole app)
 * - Throws ApiError (Error with statusCode) consumable by QueryCache
 * - Timeout via AbortController
 */

import { authedFetch } from './authedFetch';

/**
 * Main API client with auto-retry on 401 after token refresh.
 *
 * All refresh logic and deduplication live in `authedFetch`, so this is just
 * a thin adapter that preserves the existing `apiClient(endpoint, options, timeout)`
 * signature used by TanStack Query hooks.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = 15000,
): Promise<T> {
  return authedFetch<T>(endpoint, { ...options, timeout });
}
