/**
 * Authentication service for API calls
 */

import { API_CONFIG } from '../constants/api';
import { getDeviceInfo } from '../utils/device';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
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

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...API_CONFIG.HEADERS,
          ...options.headers,
        },
      });

      if (!response.ok) {
        console.log('[REGISTER API] Error response status:', response.status, response.statusText);
        let errorData: any = {};
        try {
          const text = await response.text();
          console.log('[REGISTER API] Error response text:', text);
          errorData = text ? JSON.parse(text) : {};
          console.log('[REGISTER API] Parsed error data:', JSON.stringify(errorData, null, 2));
        } catch (parseErr) {
          console.error('[REGISTER API] Error parsing error response:', parseErr);
          // If we can't parse the error, use empty object
        }

        // Handle 422 validation errors - extract field-specific errors
        if (response.status === 422) {
          let validationErrors: string[] = [];

          // Check for error.details.errors structure (API format)
          if (errorData.error?.details?.errors) {
            const errors = errorData.error.details.errors;
            validationErrors = Object.values(errors)
              .flat()
              .map((err: any) => (typeof err === 'string' ? err : err.message || err.msg || String(err)));
          }
          // Check for errorData.errors structure (alternative format)
          else if (errorData.errors) {
            validationErrors = Array.isArray(errorData.errors)
              ? errorData.errors.map((err: any) => err.message || err.msg || String(err))
              : Object.values(errorData.errors)
                  .flat()
                  .map((err: any) => (typeof err === 'string' ? err : err.message || err.msg || String(err)));
          }

          if (validationErrors.length > 0) {
            const errorMessage = validationErrors.join(', ');
            console.log('[REGISTER API] Validation errors extracted:', errorMessage);
            throw new Error(errorMessage);
          }
        }

        // Handle other errors - extract message from various possible structures
        let errorMessage = '';

        // Try error.error.message (nested error object)
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
        // Try errorData.message
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Try errorData.error as string
        else if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        }
        // Fallback
        else {
          errorMessage = `Request failed with status ${response.status}`;
        }

        console.log('[REGISTER API] Error message extracted:', errorMessage);
        throw new Error(errorMessage);
      }

      // Parse successful response
      let jsonData: any;
      try {
        const responseText = await response.text();
        console.log('[REGISTER API] Raw response text:', responseText);
        jsonData = responseText ? JSON.parse(responseText) : {};
        console.log('[REGISTER API] Parsed JSON data:', JSON.stringify(jsonData, null, 2));
      } catch (parseErr) {
        console.error('[REGISTER API] JSON parse error:', parseErr);
        throw new Error('Invalid response format from server');
      }

      return jsonData;
    } catch (err) {
      // Handle network errors and other fetch failures
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      }
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred during the request');
    }
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    console.log('[REGISTER API] Request Payload:', JSON.stringify(data, null, 2));
    const payload = JSON.stringify(data);
    console.log('[REGISTER API] Payload string:', payload);

    const response = await this.request<RegisterResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: payload,
    });

    console.log('[REGISTER API] Response received:', JSON.stringify(response, null, 2));
    console.log('[REGISTER API] Response type:', typeof response);
    console.log('[REGISTER API] Response keys:', Object.keys(response || {}));

    return response;
  }

  async login(
    email: string,
    password: string,
    username: string = ''
  ): Promise<LoginResponse> {
    const deviceInfo = getDeviceInfo();

    const loginData: LoginRequest = {
      email,
      username,
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
}

export const authService = new AuthService();
