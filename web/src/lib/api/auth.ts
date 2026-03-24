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

export interface GoogleAuthInput {
  credential: string;
}

export const authApi = {
  login(data: LoginInput): Promise<LoginResponse> {
    return api.post<LoginResponse>("/api/v1/auth/login", data);
  },

  register(data: RegisterInput): Promise<AuthUser> {
    return api.post<AuthUser>("/api/v1/auth/register", data);
  },

  googleLogin(data: GoogleAuthInput): Promise<LoginResponse> {
    return api.post<LoginResponse>("/api/v1/auth/google", data);
  },

  refreshToken(token: string): Promise<LoginResponse> {
    return api.post<LoginResponse>("/api/v1/auth/refresh", {
      refreshToken: token,
    });
  },

  /** Best-effort server logout. Always resolves (never throws). */
  async logout(): Promise<void> {
    try {
      await api.post("/api/v1/auth/logout", {});
    } catch {
      // Best-effort: ignore failures so local cleanup always proceeds
    }
  },
};
