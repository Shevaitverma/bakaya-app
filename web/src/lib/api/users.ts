import { api } from "../api-client";
import type { ApiResponse } from "@/types/api";

export interface UserResponse {
  _id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: "user" | "admin";
}

export interface UpdateUserInput {
  name?: string;
  isActive?: boolean;
  role?: "user" | "admin";
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  role?: "user" | "admin";
  isActive?: boolean;
  search?: string;
}

export const usersApi = {
  list(params: UserQueryParams = {}): Promise<ApiResponse<UserResponse[]>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.role) searchParams.set("role", params.role);
    if (params.isActive !== undefined)
      searchParams.set("isActive", String(params.isActive));
    if (params.search) searchParams.set("search", params.search);

    const qs = searchParams.toString();
    return api.getWithMeta<UserResponse[]>(
      `/api/v1/users${qs ? `?${qs}` : ""}`
    );
  },

  get(id: string): Promise<UserResponse> {
    return api.get<UserResponse>(`/api/v1/users/${id}`);
  },

  create(data: CreateUserInput): Promise<UserResponse> {
    return api.post<UserResponse>("/api/v1/users", data);
  },

  update(id: string, data: UpdateUserInput): Promise<UserResponse> {
    return api.put<UserResponse>(`/api/v1/users/${id}`, data);
  },

  delete(id: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`/api/v1/users/${id}`);
  },
};
