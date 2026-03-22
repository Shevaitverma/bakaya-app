/**
 * Profile type definitions
 */

export interface Profile {
  _id: string;
  userId: string;
  name: string;
  relationship?: string;
  avatar?: string;
  color?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileRequest {
  name: string;
  relationship?: string;
  avatar?: string;
  color?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  relationship?: string;
  avatar?: string;
  color?: string;
}

export interface ProfilesResponse {
  success: boolean;
  data: {
    profiles: Profile[];
  };
  meta: {
    timestamp: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  data: Profile;
  meta: {
    timestamp: string;
  };
}
