/**
 * Device information utilities
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@device:id';

let cachedDeviceId: string | null = null;

/**
 * Get or create a persistent device ID.
 * The ID is stored in AsyncStorage so it survives app restarts
 * but remains stable for the same device installation.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }
  } catch {
    // If read fails, generate a new one
  }

  const newId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  cachedDeviceId = newId;

  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
  } catch {
    // Best-effort persist
  }

  return newId;
}

/**
 * Returns static device info (os, osVersion).
 * For the full device info including a persistent deviceId, use getDeviceInfoAsync().
 */
export const getDeviceInfo = () => {
  const osVersion =
    typeof Platform.Version === 'string'
      ? Platform.Version
      : Platform.Version.toString();

  return {
    os: Platform.OS === 'ios' ? 'ios' : 'android',
    osVersion,
    // Kept for backward compat but callers should prefer getDeviceInfoAsync()
    deviceId: cachedDeviceId ?? `${Platform.OS}-${Date.now()}`,
  };
};

/**
 * Returns device info with a persistent deviceId (async).
 */
export const getDeviceInfoAsync = async () => {
  const osVersion =
    typeof Platform.Version === 'string'
      ? Platform.Version
      : Platform.Version.toString();

  const deviceId = await getOrCreateDeviceId();

  return {
    os: Platform.OS === 'ios' ? 'ios' : 'android',
    osVersion,
    deviceId,
  };
};
