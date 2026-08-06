import mongoose, { Schema } from "mongoose";
import { env } from "@/config/env";

/**
 * Per-user "revoked-before" marker for refresh tokens.
 *
 * JWTs are stateless, so logout records a timestamp here and any refresh token
 * whose `iat` is older than it is rejected on verify. Stored in Mongo rather
 * than a process Map so logouts survive restarts and apply to every instance.
 */
export interface ITokenRevocation {
  userId: string;
  // Tokens with iat (seconds) strictly less than this are rejected.
  revokedBefore: number;
  // TTL anchor — the entry is useless once the longest-lived refresh token
  // issued before it would have expired on its own.
  setAt: Date;
}

const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
  y: 31536000,
};

// "90d" -> 7776000. Reuses JWT_REFRESH_EXPIRES_IN so the TTL can never drift
// out of sync with the actual refresh-token lifetime. jose also accepts forms
// like "2 days" that we don't parse — those fall back to the default.
export function parseExpiryToSeconds(value: string, fallbackSeconds = 90 * 86400): number {
  const match = value.trim().match(/^(\d+)\s*(s|m|h|d|w|y)$/i);
  if (!match) return fallbackSeconds;
  return Number(match[1]) * UNIT_SECONDS[match[2]!.toLowerCase()]!;
}

const tokenRevocationSchema = new Schema<ITokenRevocation>({
  userId: { type: String, required: true, unique: true },
  revokedBefore: { type: Number, required: true },
  setAt: { type: Date, required: true },
});

tokenRevocationSchema.index(
  { setAt: 1 },
  { expireAfterSeconds: parseExpiryToSeconds(env.JWT_REFRESH_EXPIRES_IN) }
);

export const TokenRevocation = mongoose.model<ITokenRevocation>(
  "TokenRevocation",
  tokenRevocationSchema
);
