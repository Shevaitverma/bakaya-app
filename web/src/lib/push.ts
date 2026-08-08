import { getToken, onMessage } from "firebase/messaging";
import { firebaseConfig, getMessagingInstance } from "./firebase";
import { devicesApi } from "./api/devices";

const DEVICE_ID_KEY = "bakaya_device_id";
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/** Stable per-browser device id, persisted in localStorage. */
function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/** Service workers can't read process.env, so pass the (non-secret, public)
 * Firebase web config to the SW via query params. */
export function serviceWorkerUrl(): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(firebaseConfig)) {
    if (v) params.set(k, v);
  }
  return `/firebase-messaging-sw.js?${params.toString()}`;
}

/**
 * Request notification permission, register the FCM token with the server, and
 * wire foreground-message handling. Fully defensive: returns false (never
 * throws) if unsupported, denied, or misconfigured.
 */
export async function registerWebPush(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) {
    console.warn("[push] notifications not supported in this browser");
    return false;
  }
  if (!VAPID_KEY) {
    console.warn("[push] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set — skipping push registration");
    return false;
  }

  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.warn("[push] firebase messaging unsupported");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.info("[push] permission not granted:", permission);
      return false;
    }

    const registration = await navigator.serviceWorker.register(serviceWorkerUrl());
    const fcmToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!fcmToken) {
      console.warn("[push] no FCM token returned");
      return false;
    }

    await devicesApi.registerToken({
      deviceId: getDeviceId(),
      fcmToken,
      os: "web",
      osVersion: navigator.userAgent,
    });

    onMessage(messaging, (payload) => {
      console.info("[push] foreground message", payload);
      const title = payload.notification?.title ?? "Bakaya";
      const body = payload.notification?.body ?? "";
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      }
    });

    return true;
  } catch (err) {
    console.warn("[push] registration failed", err);
    return false;
  }
}
