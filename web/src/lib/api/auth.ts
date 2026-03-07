import { api } from "../api-client";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  role: "user" | "admin";
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  device: unknown;
}

export const authApi = {
  login(data: LoginInput): Promise<LoginResponse> {
    return api.post<LoginResponse>("/api/v1/auth/login", data);
  },

  register(data: RegisterInput): Promise<AuthUser> {
    return api.post<AuthUser>("/api/v1/auth/register", data);
  },
};
