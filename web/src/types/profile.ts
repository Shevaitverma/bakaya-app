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

export interface CreateProfileInput {
  name: string;
  relationship?: string;
  avatar?: string;
  color?: string;
}

export interface UpdateProfileInput {
  name?: string;
  relationship?: string;
  avatar?: string;
  color?: string;
}
