/**
 * In-memory refresh-token deny list.
 *
 * Why: when a user logs out we want their existing refresh tokens to stop
 * working immediately, not at natural expiry. JWTs are stateless, so we
 * keep a per-user "revoked-before" timestamp; any refresh token whose `iat`
 * is older than this timestamp is rejected on verify.
 *
 * Trade-offs:
 * - In-memory, so logouts are forgotten across server restarts. That's
 *   acceptable here because the server is small (10-20 users) and restarts
 *   are infrequent; a token that survives a restart is no worse than the
 *   current behavior (which never revokes).
 * - Single-process only. If the server is ever scaled out, this needs to
 *   move to Redis or a TokenRevocation collection.
 */

interface RevocationEntry {
  // Tokens with iat (seconds) strictly less than this are rejected.
  revokedBefore: number;
  // Wall-clock ms at which this entry was set — used for TTL cleanup.
  setAt: number;
}

const revocations = new Map<string, RevocationEntry>();

// Tokens have a finite expiry; once the longest possible refresh token would
// have expired naturally, the revocation entry is no longer needed.
const ENTRY_TTL_MS = 45 * 24 * 60 * 60 * 1000; // 45 days
const MAX_ENTRIES = 10_000;

setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of revocations.entries()) {
    if (now - entry.setAt > ENTRY_TTL_MS) {
      revocations.delete(userId);
    }
  }
  // Safety cap — if somehow entries pile up, drop the oldest.
  if (revocations.size > MAX_ENTRIES) {
    const overflow = revocations.size - MAX_ENTRIES;
    const sorted = Array.from(revocations.entries()).sort(
      (a, b) => a[1].setAt - b[1].setAt
    );
    for (let i = 0; i < overflow; i++) {
      const entry = sorted[i];
      if (entry) revocations.delete(entry[0]);
    }
  }
}, 60 * 60 * 1000).unref?.();

export function revokeRefreshTokensForUser(userId: string): void {
  // iat in JWT is seconds, so use seconds here too. +1 ensures any token
  // issued in the same second as logout is also revoked.
  const revokedBefore = Math.floor(Date.now() / 1000) + 1;
  revocations.set(userId, { revokedBefore, setAt: Date.now() });
}

export function isRefreshTokenRevoked(userId: string, iat: number | undefined): boolean {
  if (iat === undefined) return false;
  const entry = revocations.get(userId);
  if (!entry) return false;
  return iat < entry.revokedBefore;
}
