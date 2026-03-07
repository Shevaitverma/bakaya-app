/**
 * API configuration constants
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Resolve the API base URL:
// 1. Use EXPO_PUBLIC_API_URL env var if set (e.g. http://192.168.1.100:8080)
// 2. In Expo Go, use the dev machine's IP (extracted from the Expo debugger host)
// 3. Fallback: 10.0.2.2 for Android emulator, localhost for iOS simulator
function getBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return `${process.env.EXPO_PUBLIC_API_URL}/api/v1`;
  }

  // In Expo Go, extract the dev machine IP from the debugger host
  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:8080/api/v1`;
  }

  // Fallback: use the dev machine's local IP
  return 'http://192.168.1.4:8080/api/v1';
}

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
    },
    EXPENSES: {
      PERSONAL_EXPENSES: '/personal-expenses',
    },
    GROUPS: {
      LIST: '/groups',
    },
  },
  HEADERS: {
    'Content-Type': 'application/json',
    'accept': 'application/json',
  },
  // Hardcoded FCM token as requested
  FCM_TOKEN: 'firebase-cloud-messaging-token',
} as const;
