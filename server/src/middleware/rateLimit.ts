import { env } from "@/config/env";
import { errorResponse } from "@/utils/response";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const authRateLimitStore = new Map<string, RateLimitEntry>();

// Stricter limits for auth endpoints
const AUTH_RATE_LIMIT_MAX = 10;
const AUTH_RATE_LIMIT_WINDOW_MS = 60000;

// Hard cap on store size — protects against unbounded growth from rotating
// JWTs / per-request unique IPs when expiration cleanup can't keep up.
const MAX_STORE_ENTRIES = 10_000;

function pruneStore(store: Map<string, RateLimitEntry>, now: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
  // If still oversized, evict the entries with the soonest resetAt
  // (i.e. closest to expiry — least useful to keep).
  if (store.size > MAX_STORE_ENTRIES) {
    const overflow = store.size - MAX_STORE_ENTRIES;
    const sorted = Array.from(store.entries()).sort(
      (a, b) => a[1].resetAt - b[1].resetAt
    );
    for (let i = 0; i < overflow; i++) {
      const entry = sorted[i];
      if (entry) store.delete(entry[0]);
    }
  }
}

// Clean up expired / oversized entries periodically
setInterval(() => {
  const now = Date.now();
  pruneStore(rateLimitStore, now);
  pruneStore(authRateLimitStore, now);
}, 60000);

function getRateLimitKey(req: Request): string {
  const authHeader = req.headers.get("authorization");
  return authHeader
    ? `user:${authHeader.slice(-16)}`
    : `ip:${getClientIP(req)}`;
}

export function getClientIP(req: Request): string {
  // Only trust proxy headers if TRUST_PROXY is enabled
  if (env.TRUST_PROXY === "true") {
    return (
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown"
    );
  }
  return "unknown";
}

function checkLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  maxRequests: number,
  windowMs: number
): Response | null {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return null;
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return errorResponse(
      "RATE_LIMIT_EXCEEDED",
      "Too many requests, please try again later",
      429,
      { retryAfter, limit: maxRequests, remaining: 0 }
    );
  }

  return null;
}

export function checkAuthRateLimit(req: Request): Response | null {
  const clientIP = getClientIP(req);
  return checkLimit(authRateLimitStore, clientIP, AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS);
}

export function checkRateLimit(req: Request): Response | null {
  // Use Authorization token (per-user) if available, otherwise fall back to IP.
  // This prevents all clients from sharing a single "unknown" bucket when
  // TRUST_PROXY is not set (e.g. local development).
  return checkLimit(rateLimitStore, getRateLimitKey(req), env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS);
}

export function getRateLimitHeaders(req: Request): Record<string, string> {
  // Must use the same key derivation as checkRateLimit, or headers will
  // report against a different bucket than the one actually enforced.
  const entry = rateLimitStore.get(getRateLimitKey(req));
  const maxRequests = env.RATE_LIMIT_MAX;

  const remaining = entry ? Math.max(0, maxRequests - entry.count) : maxRequests;
  const resetAt = entry ? Math.ceil(entry.resetAt / 1000) : Math.ceil((Date.now() + env.RATE_LIMIT_WINDOW_MS) / 1000);

  return {
    "X-RateLimit-Limit": String(maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(resetAt),
  };
}
