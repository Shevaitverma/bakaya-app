/**
 * Storage utilities using AsyncStorage
 * Compatible with Expo Go (no native linking required)
 *
 * TODO(session-hardening): move the refresh token (and ideally the access
 * token) to `expo-secure-store` for Keychain/Keystore-backed encryption.
 * Not installed today — deferred to avoid pulling a new native dep in this
 * change. AsyncStorage is plain text under the app's sandbox, which is
 * acceptable for a single-user device but not ideal.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER: '@auth:user',
  ACCESS_TOKEN: '@auth:accessToken',
  REFRESH_TOKEN: '@auth:refreshToken',
} as const;

export const storage = {
  async saveUser(user: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<any | null> {
    const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);
  },
};
