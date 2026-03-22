/**
 * Authentication service for API calls
 *
 * Covers all server auth endpoints:
 *  - POST /auth/login
 *  - POST /auth/register
 *  - POST /auth/google
 *  - POST /auth/refresh
 */

import { API_CONFIG } from '../constants/api';
import { getDeviceInfoAsync } from '../utils/device';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  GoogleAuthRequest,
  GoogleAuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '../types/auth';

class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('[AUTH API] Fetching:', url);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...API_CONFIG.HEADERS,
          ...options.headers,
        },
      });

      if (!response.ok) {
        console.log('[AUTH API] Error response status:', response.status, response.statusText);
        let errorData: any = {};
        try {
          const text = await response.text();
          console.log('[AUTH API] Error response text:', text);
          errorData = text ? JSON.parse(text) : {};
        } catch (parseErr) {
          console.error('[AUTH API] Error parsing error response:', parseErr);
        }

        // Handle 422 validation errors - extract field-specific errors
        if (response.status === 422) {
          let validationErrors: string[] = [];

          if (errorData.error?.details?.errors) {
            const errors = errorData.error.details.errors;
            validationErrors = Object.values(errors)
              .flat()
              .map((err: any) => (typeof err === 'string' ? err : err.message || err.msg || String(err)));
          } else if (errorData.errors) {
            validationErrors = Array.isArray(errorData.errors)
              ? errorData.errors.map((err: any) => err.message || err.msg || String(err))
              : Object.values(errorData.errors)
                  .flat()
                  .map((err: any) => (typeof err === 'string' ? err : err.message || err.msg || String(err)));
          }

          if (validationErrors.length > 0) {
            const errorMessage = validationErrors.join(', ');
            throw new Error(errorMessage);
          }
        }

        // Handle other errors
        let errorMessage = '';
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else {
          errorMessage = `Request failed with status ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      // Parse successful response
      let jsonData: any;
      try {
        const responseText = await response.text();
        jsonData = responseText ? JSON.parse(responseText) : {};
      } catch (parseErr) {
        console.error('[AUTH API] JSON parse error:', parseErr);
        throw new Error('Invalid response format from server');
      }

      return jsonData;
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      }
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred during the request');
    }
  }

  /**
   * POST /auth/register
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    console.log('[AUTH API] register payload:', JSON.stringify(data, null, 2));

    return this.request<RegisterResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * POST /auth/login
   *
   * Sends device info (persistent deviceId, os, osVersion) and FCM token
   * so the server can upsert the device record.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const deviceInfo = await getDeviceInfoAsync();

    const loginData: LoginRequest = {
      email,
      password,
      deviceId: deviceInfo.deviceId,
      os: deviceInfo.os,
      osVersion: deviceInfo.osVersion,
      fcmToken: API_CONFIG.FCM_TOKEN,
    };

    return this.request<LoginResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  /**
   * POST /auth/google
   *
   * Authenticates using a Firebase ID token from Google sign-in.
   */
  async googleLogin(firebaseIdToken: string): Promise<GoogleAuthResponse> {
    const deviceInfo = await getDeviceInfoAsync();

    const googleAuthData: GoogleAuthRequest = {
      credential: firebaseIdToken,
      deviceId: deviceInfo.deviceId,
      os: deviceInfo.os,
      osVersion: deviceInfo.osVersion,
      fcmToken: API_CONFIG.FCM_TOKEN,
    };

    console.log('[AUTH API] Sending Google credential to server');

    return this.request<GoogleAuthResponse>(API_CONFIG.ENDPOINTS.AUTH.GOOGLE, {
      method: 'POST',
      body: JSON.stringify(googleAuthData),
    });
  }

  /**
   * POST /auth/refresh
   *
   * Exchanges a valid refresh token for a new access + refresh token pair.
   */
  async refreshTokens(currentRefreshToken: string): Promise<RefreshTokenResponse> {
    const payload: RefreshTokenRequest = { refreshToken: currentRefreshToken };

    return this.request<RefreshTokenResponse>(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const authService = new AuthService();
