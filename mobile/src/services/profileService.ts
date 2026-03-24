/**
 * Profile service for API calls
 */

import { API_CONFIG } from '../constants/api';
import type {
  ProfilesResponse,
  ProfileResponse,
  CreateProfileRequest,
  UpdateProfileRequest,
} from '../types/profile';

class ProfileService {
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
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (parseErr) {
          console.error('[PROFILE API] Error parsing error response:', parseErr);
        }

        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          const error = new Error(errorData.error?.message || errorData.message || 'Your session has expired. Please log in again.');
          (error as any).statusCode = 401;
          throw error;
        }

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
        console.error('[PROFILE API] JSON parse error:', parseErr);
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

  async getProfiles(token: string): Promise<ProfilesResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.PROFILES.LIST;

    return this.request<ProfilesResponse>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getProfile(id: string, token: string): Promise<ProfileResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.PROFILES.SINGLE(id);

    return this.request<ProfileResponse>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createProfile(
    data: CreateProfileRequest,
    token: string
  ): Promise<ProfileResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.PROFILES.LIST;

    return this.request<ProfileResponse>(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async updateProfile(
    id: string,
    data: UpdateProfileRequest,
    token: string
  ): Promise<ProfileResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.PROFILES.SINGLE(id);

    return this.request<ProfileResponse>(endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async deleteProfile(
    id: string,
    token: string
  ): Promise<{ success: boolean; data: { message: string }; meta: { timestamp: string } }> {
    const endpoint = API_CONFIG.ENDPOINTS.PROFILES.SINGLE(id);

    return this.request<{ success: boolean; data: { message: string }; meta: { timestamp: string } }>(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const profileService = new ProfileService();
