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
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}${REFRESH_ENDPOINT}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        const refreshJson = await refreshRes.json();
        if (refreshJson.success && refreshJson.data) {
          setToken(refreshJson.data.accessToken);
          setRefreshToken(refreshJson.data.refreshToken);
          // Retry the original request
          return request<T>(endpoint, options, true);
        }
      } catch {
        // Refresh failed — fall through to throw 401
      }
      // Refresh did not succeed — clear tokens
      clearToken();
      clearRefreshToken();
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
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  const headers = buildHeaders(options);

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Unable to connect to server", 0);
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
