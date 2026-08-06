import { env } from "@/config/env";
import { RateLimit } from "@/models/RateLimit";
import { logger } from "@/utils/logger";
import { errorResponse } from "@/utils/response";

// Stricter limits for auth endpoints
const AUTH_RATE_LIMIT_MAX = 10;
const AUTH_RATE_LIMIT_WINDOW_MS = 60000;

// Counter state as read back from Mongo, or null when the read failed.
type LimitState = { count: number; resetAt: number } | null;

// Lets getRateLimitHeaders report the counter checkRateLimit just incremented
// without a second round trip to Mongo. Keyed by Request, so it's per-request
// and collected with it.
const lastCheck = new WeakMap<Request, LimitState>();

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

/**
 * Pure decision: should this request be blocked?
 *
 * `state` of null means the shared counter could not be read. FAIL OPEN —
 * rate limiting sits in front of every request, so a Mongo outage must not
 * take the whole API down with it.
 */
export function isOverLimit(state: LimitState, maxRequests: number): boolean {
  if (state === null) return false;
  return state.count > maxRequests;
}

/** Fixed windows: everyone shares the same boundaries, so instances agree. */
export function windowStartFor(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

async function incrementCounter(
  bucket: string,
  windowMs: number
): Promise<LimitState> {
  const now = Date.now();
  const resetAt = windowStartFor(now, windowMs) + windowMs;
  try {
    // One atomic upsert+$inc per request — no transaction, no read-then-write.
    const doc = await RateLimit.findOneAndUpdate(
      { _id: `${bucket}:${resetAt}` },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(resetAt) } },
      { upsert: true, new: true }
    );
    return { count: doc.count, resetAt };
  } catch (error) {
    logger.warn("Rate limit counter unavailable, allowing request", { bucket, error });
    return null;
  }
}

function limitResponse(state: LimitState, maxRequests: number): Response | null {
  if (!isOverLimit(state, maxRequests)) return null;

  const retryAfter = Math.max(1, Math.ceil((state!.resetAt - Date.now()) / 1000));
  return errorResponse(
    "RATE_LIMIT_EXCEEDED",
    "Too many requests, please try again later",
    429,
    { retryAfter, limit: maxRequests, remaining: 0 }
  );
}

export async function checkAuthRateLimit(req: Request): Promise<Response | null> {
  const state = await incrementCounter(`auth:${getClientIP(req)}`, AUTH_RATE_LIMIT_WINDOW_MS);
  return limitResponse(state, AUTH_RATE_LIMIT_MAX);
}

export async function checkRateLimit(req: Request): Promise<Response | null> {
  // Use Authorization token (per-user) if available, otherwise fall back to IP.
  // This prevents all clients from sharing a single "unknown" bucket when
  // TRUST_PROXY is not set (e.g. local development).
  const state = await incrementCounter(getRateLimitKey(req), env.RATE_LIMIT_WINDOW_MS);
  lastCheck.set(req, state);
  return limitResponse(state, env.RATE_LIMIT_MAX);
}

export function getRateLimitHeaders(req: Request): Record<string, string> {
  const state = lastCheck.get(req) ?? null;
  const maxRequests = env.RATE_LIMIT_MAX;

  const remaining = state ? Math.max(0, maxRequests - state.count) : maxRequests;
  const resetAt = state
    ? Math.ceil(state.resetAt / 1000)
    : Math.ceil((Date.now() + env.RATE_LIMIT_WINDOW_MS) / 1000);

  return {
    "X-RateLimit-Limit": String(maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(resetAt),
  };
}
