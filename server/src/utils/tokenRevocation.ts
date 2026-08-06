import { TokenRevocation } from "@/models/TokenRevocation";
import { logger } from "@/utils/logger";

/**
 * Refresh-token deny list, backed by MongoDB.
 *
 * Why: when a user logs out we want their existing refresh tokens to stop
 * working immediately, not at natural expiry. JWTs are stateless, so we
 * keep a per-user "revoked-before" timestamp; any refresh token whose `iat`
 * is older than this timestamp is rejected on verify.
 *
 * Stored in Mongo (with a TTL index sized to JWT_REFRESH_EXPIRES_IN) so a
 * logout survives restarts and applies to every instance.
 */

/**
 * Pure decision: is a token with this `iat` revoked?
 *
 * `lookup` is the outcome of reading the deny list:
 *   number  — the user's revokedBefore timestamp (seconds)
 *   null    — no entry, nothing revoked
 *   "error" — the lookup failed
 */
export function isIatRevoked(iat: number | undefined, lookup: number | null | "error"): boolean {
  // FAIL CLOSED: if we can't read the deny list we can't prove the token
  // wasn't revoked, and honouring a logged-out token is worse than making
  // the user sign in again.
  if (lookup === "error") return true;
  if (iat === undefined) return false;
  if (lookup === null) return false;
  return iat < lookup;
}

export async function revokeRefreshTokensForUser(userId: string): Promise<void> {
  // iat in JWT is seconds, so use seconds here too. +1 ensures any token
  // issued in the same second as logout is also revoked.
  const revokedBefore = Math.floor(Date.now() / 1000) + 1;
  await TokenRevocation.updateOne(
    { userId },
    { $set: { revokedBefore, setAt: new Date() } },
    { upsert: true }
  );
}

export async function isRefreshTokenRevoked(
  userId: string,
  iat: number | undefined
): Promise<boolean> {
  let lookup: number | null | "error";
  try {
    const entry = await TokenRevocation.findOne({ userId }).lean();
    lookup = entry?.revokedBefore ?? null;
  } catch (error) {
    logger.error("Revocation lookup failed, rejecting refresh token", { userId, error });
    lookup = "error";
  }
  return isIatRevoked(iat, lookup);
}
