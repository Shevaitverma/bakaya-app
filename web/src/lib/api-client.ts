import type { ApiResponse } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const TOKEN_KEY = "bakaya_token";
const REFRESH_TOKEN_KEY = "bakaya_refresh_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Clear all auth tokens and user data from localStorage. */
export function clearAllAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("bakaya_user");
}

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Global callback invoked when the session is truly expired (refresh token
 * rejected by the server).  Dashboard layout registers this once so that any
 * API call from any page can trigger a redirect to /login without every page
 * needing its own 401 handler.
 */
let _onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(cb: (() => void) | null): void {
  _onSessionExpired = cb;
}

function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

function handleSessionExpired(): void {
  clearAllAuth();
  if (_onSessionExpired) {
    _onSessionExpired();
  } else {
    // Fallback: if no callback is registered (e.g. outside the dashboard
    // layout), use a hard redirect so the user always reaches /login.
    redirectToLogin();
  }
}

function buildHeaders(options: RequestInit): HeadersInit {
  const headers: HeadersInit = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

const REFRESH_ENDPOINT = "/api/v1/auth/refresh";

// Mutex for token refresh: prevents concurrent refresh requests from racing
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    // No refresh token at all — session is expired
    handleSessionExpired();
    return false;
  }

  let refreshRes: Response;
  try {
    refreshRes = await fetch(`${API_BASE}${REFRESH_ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Network error — do NOT clear tokens.  The refresh token may still be
    // valid; clearing it would permanently log the user out on a transient
    // network blip.  The caller will see `false` and propagate the original
    // 401, but the user can retry.
    return false;
  }

  if (refreshRes.ok) {
    try {
      const refreshJson = await refreshRes.json();
      if (refreshJson.success && refreshJson.data) {
        setToken(refreshJson.data.accessToken);
        setRefreshToken(refreshJson.data.refreshToken);
        return true;
      }
    } catch {
      // JSON parse error — treat as transient, don't clear tokens
      return false;
    }
  }

  // Server explicitly rejected the refresh token (401/403) — session is
  // truly expired.  Clear everything and notify the app.
  handleSessionExpired();
  return false;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  _isRetry = false
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = buildHeaders(options);

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Unable to connect to server", 0);
  }

  // Auto-refresh on 401, but not if this is already a retry or the refresh endpoint itself
  if (res.status === 401 && !_isRetry && endpoint !== REFRESH_ENDPOINT) {
    // Use a shared promise so concurrent 401s only trigger one refresh
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      // Retry the original request with the new token
      return request<T>(endpoint, options, true);
    }
  }

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new ApiError("PARSE_ERROR", "Invalid response from server", res.status);
  }

  if (!json.success) {
    throw new ApiError(
      json.error?.code ?? "UNKNOWN_ERROR",
      json.error?.message ?? "An unexpected error occurred",
      res.status,
      json.error?.details
    );
  }

  return json.data as T;
}

async function requestWithMeta<T>(
  endpoint: string,
  options: RequestInit = {},
  _isRetry = false
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  const headers = buildHeaders(options);

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Unable to connect to server", 0);
  }

  // Auto-refresh on 401
  if (res.status === 401 && !_isRetry && endpoint !== REFRESH_ENDPOINT) {
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      return requestWithMeta<T>(endpoint, options, true);
    }
  }

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new ApiError("PARSE_ERROR", "Invalid response from server", res.status);
  }

  if (!json.success) {
    throw new ApiError(
      json.error?.code ?? "UNKNOWN_ERROR",
      json.error?.message ?? "An unexpected error occurred",
      res.status,
      json.error?.details
    );
  }

  return json;
}

export const api = {
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint);
  },

  getWithMeta<T>(endpoint: string): Promise<ApiResponse<T>> {
    return requestWithMeta<T>(endpoint);
  },

  post<T>(endpoint: string, body: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put<T>(endpoint: string, body: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "DELETE" });
  },
};

export { ApiError };
