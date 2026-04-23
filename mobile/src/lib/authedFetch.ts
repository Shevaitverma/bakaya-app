/**
 * Centralized authed-fetch for all service calls.
 *
 * Responsibilities:
 *  - Attach Bearer token from storage (or an explicit override).
 *  - On 401, transparently call /auth/refresh and retry the original request
 *    exactly once with the new access token.
 *  - Deduplicate concurrent refresh attempts: N simultaneous 401s share a
 *    single in-flight refresh promise.
 *  - Classify failures: only a server-side rejection of the refresh token
 *    (401/403 from /auth/refresh) counts as a truly expired session and
 *    triggers the `onSessionExpired` callback (which AuthContext wires up
 *    to logout). Network/parse failures during refresh propagate the
 *    original error without logging the user out, so a transient blip
 *    doesn't destroy the session.
 *  - Preserve the legacy ApiError shape (Error with statusCode) that
 *    services and TanStack Query's QueryCache already consume.
 *
 * This is the single source of truth for 401 handling across the app. All
 * services should call `authedFetch` instead of rolling their own retry
 * logic.
 */

import { API_CONFIG } from '../constants/api';
import { storage } from '../utils/storage';

export interface ApiError extends Error {
  statusCode?: number;
}

export function createApiError(message: string, statusCode: number): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  return error;
}

// ---------------------------------------------------------------------------
// Session-expired callback. AuthContext registers a callback that performs
// full logout (clears storage + resets state + navigates to login). When
// refresh fails because the server rejected the refresh token, we invoke it
// here — this is the only code path in the mobile app that should surface a
// "session expired" UX.
// ---------------------------------------------------------------------------

let onSessionExpiredCb: (() => void | Promise<void>) | null = null;

export function setOnSessionExpired(cb: (() => void | Promise<void>) | null): void {
  onSessionExpiredCb = cb;
}

async function fireSessionExpired(): Promise<void> {
  const cb = onSessionExpiredCb;
  if (cb) {
    try {
      await cb();
    } catch (err) {
      console.error('[authedFetch] onSessionExpired callback failed', err);
    }
  }
}

// ---------------------------------------------------------------------------
// Refresh deduplication: a single in-flight refreshPromise shared by every
// concurrent caller. After it resolves, the next 401 starts a fresh one.
// ---------------------------------------------------------------------------

type RefreshOutcome =
  | { ok: true; accessToken: string }
  | { ok: false; rejected: boolean }; // rejected=true means server said refresh is invalid

let refreshPromise: Promise<RefreshOutcome> | null = null;

async function performRefresh(): Promise<RefreshOutcome> {
  const currentRefresh = await storage.getRefreshToken();
  if (!currentRefresh) {
    // No refresh token means we can never recover; treat as expired.
    return { ok: false, rejected: true };
  }

  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { ...API_CONFIG.HEADERS },
      body: JSON.stringify({ refreshToken: currentRefresh }),
    });
  } catch (err) {
    // Transient network failure — do NOT log the user out. Caller will see
    // ok:false/rejected:false and propagate the original 401.
    console.warn('[authedFetch] refresh network error (keeping session)', err);
    return { ok: false, rejected: false };
  }

  if (!res.ok) {
    // 401/403 from /auth/refresh means the refresh token is no longer valid.
    if (res.status === 401 || res.status === 403) {
      return { ok: false, rejected: true };
    }
    // Server 5xx or similar — treat as transient, keep the session.
    return { ok: false, rejected: false };
  }

  let body: any;
  try {
    body = await res.json();
  } catch {
    // Malformed response — transient.
    return { ok: false, rejected: false };
  }

  if (body?.success && body?.data?.accessToken && body?.data?.refreshToken) {
    await storage.saveTokens(body.data.accessToken, body.data.refreshToken);
    if (body.data.user) {
      await storage.saveUser(body.data.user);
    }
    return { ok: true, accessToken: body.data.accessToken };
  }

  return { ok: false, rejected: false };
}

/**
 * Returns the shared refresh promise, creating one if not already in flight.
 * AuthContext's refreshSession also uses this so its call is deduped too.
 */
export function getOrStartRefresh(): Promise<RefreshOutcome> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Public fetch wrapper used by all services.
// ---------------------------------------------------------------------------

export interface AuthedFetchOptions extends RequestInit {
  /** Explicit bearer token override (falls back to storage). */
  token?: string;
  /** Request timeout in ms. Default 15s. */
  timeout?: number;
}

async function rawFetch(
  url: string,
  init: RequestInit,
  timeout: number,
): Promise<Response> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeout);
  try {
    return await fetch(url, { ...init, signal: abortController.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildHeaders(
  baseHeaders: HeadersInit_ | undefined,
  token: string | null,
): Record<string, string> {
  const headers: Record<string, string> = { ...API_CONFIG.HEADERS };
  if (baseHeaders) {
    // RequestInit headers can be HeadersInit_ (object, array, or Headers) —
    // normalize to a plain record.
    if (baseHeaders instanceof Headers) {
      baseHeaders.forEach((v, k) => (headers[k] = v));
    } else if (Array.isArray(baseHeaders)) {
      for (const [k, v] of baseHeaders) headers[k] = v;
    } else {
      Object.assign(headers, baseHeaders as Record<string, string>);
    }
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Authed fetch with auto-refresh on 401.
 *
 * @param endpoint  Path relative to API_CONFIG.BASE_URL (e.g. `/profiles`).
 * @param options   Standard RequestInit plus optional `token` override and `timeout`.
 */
export async function authedFetch<T>(
  endpoint: string,
  options: AuthedFetchOptions = {},
): Promise<T> {
  const { token: tokenOverride, timeout = 15000, headers: baseHeaders, ...rest } = options;
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  const attempt = async (tokenForCall: string | null): Promise<Response> => {
    const headers = buildHeaders(baseHeaders, tokenForCall);
    try {
      return await rawFetch(url, { ...rest, headers }, timeout);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw createApiError('Request timeout: The server took too long to respond. Please try again.', 408);
      }
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw createApiError('Network error: Unable to connect to the server. Please check your internet connection.', 0);
      }
      throw err;
    }
  };

  const initialToken = tokenOverride ?? (await storage.getAccessToken());
  let response = await attempt(initialToken);

  // Auto-refresh on 401 — but never for the refresh endpoint itself.
  if (response.status === 401 && endpoint !== API_CONFIG.ENDPOINTS.AUTH.REFRESH) {
    const outcome = await getOrStartRefresh();
    if (outcome.ok) {
      response = await attempt(outcome.accessToken);
    } else if (outcome.rejected) {
      // The server said our refresh token is dead — log the user out.
      await fireSessionExpired();
    }
    // If !ok && !rejected (transient), fall through and let caller see the 401.
  }

  if (response.status === 504) {
    throw createApiError('Gateway timeout: The server took too long to respond. Please try again.', 504);
  }

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
  return (text ? JSON.parse(text) : {}) as T;
}
