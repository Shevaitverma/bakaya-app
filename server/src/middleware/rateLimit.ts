import { env } from "@/config/env";
import { errorResponse } from "@/utils/response";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(req: Request): Response | null {
  const clientIP = getClientIP(req);
  const now = Date.now();
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const maxRequests = env.RATE_LIMIT_MAX;

  let entry = rateLimitStore.get(clientIP);

  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(clientIP, entry);
    return null;
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

    return errorResponse(
      "RATE_LIMIT_EXCEEDED",
      "Too many requests, please try again later",
      429,
      {
        retryAfter,
        limit: maxRequests,
        remaining: 0,
      }
    );
  }

  return null;
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
