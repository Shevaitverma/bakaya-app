/**
 * Firebase Admin (FCM) initialization for push notifications.
 *
 * Reads FIREBASE_SERVICE_ACCOUNT (raw JSON or base64-encoded JSON). If it is
 * unset or invalid, push is simply disabled — the server still boots and every
 * send becomes a no-op. This keeps local/dev environments running without a
 * service-account key.
 */

import { initializeApp, getApps, getApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getMessaging as adminGetMessaging, type Messaging } from "firebase-admin/messaging";
import { env } from "./env";
import { logger } from "@/utils/logger";

let messaging: Messaging | null = null;

function parseServiceAccount(raw: string): ServiceAccount {
  const json = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(json) as ServiceAccount;
}

function init(): void {
  if (messaging) return;

  if (!env.FIREBASE_SERVICE_ACCOUNT) {
    logger.warn("FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled");
    return;
  }

  try {
    const serviceAccount = parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT);
    const app = getApps().length
      ? getApp()
      : initializeApp({ credential: cert(serviceAccount) });
    messaging = adminGetMessaging(app);
    logger.info("Firebase Admin initialized — push notifications enabled");
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin — push disabled", { error });
  }
}

init();

/** Returns the FCM messaging client, or null when push is disabled. */
export function getMessaging(): Messaging | null {
  return messaging;
}
