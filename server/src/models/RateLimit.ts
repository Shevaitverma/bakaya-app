import mongoose, { Schema } from "mongoose";

/**
 * Shared rate-limit counter — one document per bucket per fixed window, so
 * limits apply across all server instances instead of being multiplied by
 * the instance count. Documents are removed by the TTL index on expiresAt.
 */
export interface IRateLimit {
  // `${bucket}:${windowStart}` — the window is baked into the _id so each
  // window gets a fresh counter with no reset bookkeeping.
  _id: string;
  count: number;
  expiresAt: Date;
}

const rateLimitSchema = new Schema<IRateLimit>({
  _id: { type: String },
  count: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
});

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = mongoose.model<IRateLimit>("RateLimit", rateLimitSchema);
