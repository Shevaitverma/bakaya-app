/**
 * Push notifications (FCM via expo-notifications).
 *
 * On Android `getDevicePushTokenAsync()` returns the raw FCM token, which the
 * server's firebase-admin sender can target directly. On iOS it returns the
 * APNs token — full iOS delivery is a later phase (needs the Firebase iOS SDK
 * or an APNs-direct path). Everything here degrades gracefully: on a simulator
 * or when permission is denied it logs and returns, never throwing.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/api';
import { authedFetch } from './authedFetch';

const DEVICE_ID_KEY = 'BAKAYA_DEVICE_ID';

/** Stable per-install id, generated once and persisted. */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = Crypto.randomUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

/** Foreground display behaviour. Call once at app start. */
export function configureNotificationHandler(): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    // Native module absent (e.g. a build predating expo-notifications) — no-op.
    console.warn('[PUSH] notification handler unavailable:', err instanceof Error ? err.message : err);
  }
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Request permission, get the device push token, and register it with the
 * server. Safe to call repeatedly (e.g. on every login) — the server upserts.
 * Returns the token on success, or null if unavailable/denied.
 */
export async function registerForPush(accessToken: string): Promise<string | null> {
  try {
    await ensureAndroidChannel();

    const settings = await Notifications.getPermissionsAsync();
    let granted = settings.granted;
    if (!granted && settings.canAskAgain) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted;
    }
    if (!granted) {
      console.warn('[PUSH] notification permission not granted');
      return null;
    }

    const { data: fcmToken } = await Notifications.getDevicePushTokenAsync();
    if (!fcmToken || typeof fcmToken !== 'string') {
      console.warn('[PUSH] no device push token available');
      return null;
    }

    const deviceId = await getOrCreateDeviceId();
    await authedFetch(API_CONFIG.ENDPOINTS.DEVICES.TOKEN, {
      method: 'PUT',
      token: accessToken,
      body: JSON.stringify({
        deviceId,
        fcmToken,
        os: Platform.OS,
        osVersion: String(Platform.Version),
      }),
    });

    return fcmToken;
  } catch (err) {
    // Simulators, denied permission, offline — never crash the app over push.
    console.warn('[PUSH] registration skipped:', err instanceof Error ? err.message : err);
    return null;
  }
}
