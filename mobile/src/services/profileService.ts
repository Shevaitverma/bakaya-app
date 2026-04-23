/**
 * Profile service for API calls.
 *
 * Uses the shared `authedFetch` wrapper.
 */

import { API_CONFIG } from '../constants/api';
import { authedFetch } from '../lib/authedFetch';
import type {
  ProfilesResponse,
  ProfileResponse,
  CreateProfileRequest,
  UpdateProfileRequest,
} from '../types/profile';

class ProfileService {
  async getProfiles(token: string): Promise<ProfilesResponse> {
    return authedFetch<ProfilesResponse>(API_CONFIG.ENDPOINTS.PROFILES.LIST, {
      method: 'GET',
      token,
    });
  }

  async getProfile(id: string, token: string): Promise<ProfileResponse> {
    return authedFetch<ProfileResponse>(API_CONFIG.ENDPOINTS.PROFILES.SINGLE(id), {
      method: 'GET',
      token,
    });
  }

  async createProfile(
    data: CreateProfileRequest,
    token: string
  ): Promise<ProfileResponse> {
    return authedFetch<ProfileResponse>(API_CONFIG.ENDPOINTS.PROFILES.LIST, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async updateProfile(
    id: string,
    data: UpdateProfileRequest,
    token: string
  ): Promise<ProfileResponse> {
    return authedFetch<ProfileResponse>(API_CONFIG.ENDPOINTS.PROFILES.SINGLE(id), {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  }

  async deleteProfile(
    id: string,
    token: string
  ): Promise<{ success: boolean; data: { message: string }; meta: { timestamp: string } }> {
    return authedFetch(API_CONFIG.ENDPOINTS.PROFILES.SINGLE(id), {
      method: 'DELETE',
      token,
    });
  }
}

export const profileService = new ProfileService();
