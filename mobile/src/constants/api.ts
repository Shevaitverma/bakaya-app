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

  // Fallback: Android emulator uses 10.0.2.2 to reach host; iOS simulator uses localhost
  const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${fallbackHost}:8080/api/v1`;
}

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      GOOGLE: '/auth/google',
      REFRESH: '/auth/refresh',
    },
    EXPENSES: {
      PERSONAL_EXPENSES: '/personal-expenses',
      SINGLE_EXPENSE: (id: string) => `/personal-expenses/${id}`,
    },
    ANALYTICS: {
      SUMMARY: '/analytics/summary',
      BY_PROFILE: '/analytics/by-profile',
      BY_CATEGORY: '/analytics/by-category',
      TRENDS: '/analytics/trends',
      BALANCE: '/analytics/balance',
    },
    GROUPS: {
      LIST: '/groups',
      SINGLE: (id: string) => `/groups/${id}`,
      EXPENSES: (id: string) => `/groups/${id}/expenses`,
      SINGLE_EXPENSE: (id: string, expenseId: string) => `/groups/${id}/expenses/${expenseId}`,
      BALANCES: (id: string) => `/groups/${id}/balances`,
      SETTLEMENTS: (id: string) => `/groups/${id}/settlements`,
      SINGLE_SETTLEMENT: (id: string, settlementId: string) => `/groups/${id}/settlements/${settlementId}`,
      SINGLE_MEMBER: (id: string, memberId: string) => `/groups/${id}/members/${memberId}`,
      INVITATIONS: (id: string) => `/groups/${id}/invitations`,
      INVITATION: (id: string, invId: string) => `/groups/${id}/invitations/${invId}`,
    },
    INVITATIONS: {
      LIST_MINE: '/invitations/me',
      ACCEPT: (id: string) => `/invitations/${id}/accept`,
      DECLINE: (id: string) => `/invitations/${id}/decline`,
    },
    CATEGORIES: {
      LIST: '/categories',
      SINGLE: (id: string) => `/categories/${id}`,
      REORDER: '/categories/reorder',
    },
    PROFILES: {
      LIST: '/profiles',
      SINGLE: (id: string) => `/profiles/${id}`,
    },
  },
  HEADERS: {
    'Content-Type': 'application/json',
    'accept': 'application/json',
  },
  // Hardcoded FCM token as requested
  FCM_TOKEN: 'firebase-cloud-messaging-token',
} as const;
