/**
 * API configuration constants
 */

export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api/v1',
  // BASE_URL: 'https://zts-bakaya-server.onrender.com/api/v1',
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
