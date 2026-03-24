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

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) rateLimitStore.delete(key);
  }
  for (const [key, entry] of authRateLimitStore.entries()) {
    if (entry.resetAt < now) authRateLimitStore.delete(key);
  }
}, 60000);

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
  const clientIP = getClientIP(req);
  return checkLimit(rateLimitStore, clientIP, env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS);
}

export function getRateLimitHeaders(req: Request): Record<string, string> {
  const clientIP = getClientIP(req);
  const entry = rateLimitStore.get(clientIP);
  const maxRequests = env.RATE_LIMIT_MAX;

  const remaining = entry ? Math.max(0, maxRequests - entry.count) : maxRequests;
  const resetAt = entry ? Math.ceil(entry.resetAt / 1000) : Math.ceil((Date.now() + env.RATE_LIMIT_WINDOW_MS) / 1000);

  return {
    "X-RateLimit-Limit": String(maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(resetAt),
  };
}
