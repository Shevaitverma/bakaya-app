/**
 * Push notification sending (FCM via firebase-admin).
 *
 * Callers fire-and-forget: `sendToUser(...).catch(...)` — a push must never
 * block or fail the mutation that triggered it. When push is disabled (no
 * service account), every send is a silent no-op.
 */

import { Device } from "@/models/Device";
import { User } from "@/models/User";
import { getMessaging } from "@/config/firebase-admin";
import { logger } from "@/utils/logger";

export interface PushPayload {
  title: string;
  body: string;
  /** Delivered to the client for deep-linking (FCM requires string values). */
  data?: Record<string, string>;
}

// FCM error codes that mean the token is permanently dead and should be dropped.
const STALE_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

/**
 * Pure decision: given the tokens sent and FCM's per-token responses, return
 * the tokens that are permanently invalid and should be pruned. Extracted so
 * the pruning logic is testable without a live FCM connection.
 */
export function selectStaleTokens(
  tokens: string[],
  responses: Array<{ success: boolean; error?: { code?: string } }>
): string[] {
  const stale: string[] = [];
  responses.forEach((r, i) => {
    const token = tokens[i];
    if (token && !r.success && r.error?.code && STALE_TOKEN_CODES.has(r.error.code)) {
      stale.push(token);
    }
  });
  return stale;
}

/** Send one notification to every active device of the given users. */
export async function sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  const messaging = getMessaging();
  if (!messaging || userIds.length === 0) return;

  const devices = await Device.find({
    userId: { $in: userIds },
    isActive: true,
    fcmToken: { $nin: [null, ""] },
  }).select("fcmToken");

  const tokens = devices.map((d) => d.fcmToken).filter((t): t is string => !!t);
  if (tokens.length === 0) return;

  const result = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    data: payload.data ?? {},
  });

  const stale = selectStaleTokens(tokens, result.responses);
  if (stale.length > 0) {
    await Device.updateMany({ fcmToken: { $in: stale } }, { $unset: { fcmToken: "" } });
  }

  logger.info("Push sent", {
    users: userIds.length,
    tokens: tokens.length,
    delivered: result.successCount,
    pruned: stale.length,
  });
}

export function sendToUser(userId: string, payload: PushPayload): Promise<void> {
  return sendToUsers([userId], payload);
}

/** Best-effort display name for notification bodies. Never throws. */
export async function getUserDisplayName(userId: string): Promise<string> {
  try {
    const user = await User.findById(userId).select("firstName lastName name email");
    if (!user) return "Someone";
    const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return full || user.name || user.email?.split("@")[0] || "Someone";
  } catch {
    return "Someone";
  }
}
