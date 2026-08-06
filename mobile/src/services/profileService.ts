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
    let res = await authedFetch<ProfilesResponse>(
      `${API_CONFIG.ENDPOINTS.PROFILES.LIST}?page=1&limit=100`,
      { method: 'GET', token }
    );
    const profiles = [...res.data.profiles];
    const totalPages = res.data.pagination?.totalPages ?? 1;
    for (let page = 2; page <= totalPages; page++) {
      res = await authedFetch<ProfilesResponse>(
        `${API_CONFIG.ENDPOINTS.PROFILES.LIST}?page=${page}&limit=100`,
        { method: 'GET', token }
      );
      profiles.push(...res.data.profiles);
    }
    return { ...res, data: { ...res.data, profiles } };
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
    const res = await authedFetch<ProfileResponse>(API_CONFIG.ENDPOINTS.PROFILES.LIST, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
    return res;
  }

  async updateProfile(
    id: string,
    data: UpdateProfileRequest,
    token: string
  ): Promise<ProfileResponse> {
    const res = await authedFetch<ProfileResponse>(API_CONFIG.ENDPOINTS.PROFILES.SINGLE(id), {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
    return res;
  }

  async deleteProfile(
    id: string,
    token: string
  ): Promise<{ success: boolean; data: { message: string }; meta: { timestamp: string } }> {
    const res = await authedFetch<{
      success: boolean;
      data: { message: string };
      meta: { timestamp: string };
    }>(API_CONFIG.ENDPOINTS.PROFILES.SINGLE(id), {
      method: 'DELETE',
      token,
    });
    return res;
  }
}

export const profileService = new ProfileService();
