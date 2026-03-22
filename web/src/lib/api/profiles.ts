import { api } from "../api-client";
import type { Profile, CreateProfileInput, UpdateProfileInput } from "@/types/profile";
import type { Pagination } from "./expenses";

export interface ProfilesData {
  profiles: Profile[];
  pagination: Pagination;
}

export const profilesApi = {
  getProfiles(): Promise<ProfilesData> {
    return api.get<ProfilesData>("/api/v1/profiles");
  },

  getProfile(id: string): Promise<Profile> {
    return api.get<Profile>(`/api/v1/profiles/${id}`);
  },

  createProfile(data: CreateProfileInput): Promise<Profile> {
    return api.post<Profile>("/api/v1/profiles", data);
  },

  updateProfile(id: string, data: UpdateProfileInput): Promise<Profile> {
    return api.put<Profile>(`/api/v1/profiles/${id}`, data);
  },

  deleteProfile(id: string): Promise<{ deleted: boolean }> {
    return api.delete<{ deleted: boolean }>(`/api/v1/profiles/${id}`);
  },
};
