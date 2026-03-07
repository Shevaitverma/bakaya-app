/**
 * Authentication types and interfaces
 */

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
}

export interface Device {
  id: string;
  deviceId: string;
  os: string;
  osVersion: string;
  isActive: boolean;
  lastLoginAt: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    device: Device;
    accessToken: string;
    refreshToken: string;
  };
  meta: {
    timestamp: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  data: {
    user: User;
  };
  meta: {
    timestamp: string;
  };
}

export interface LoginRequest {
  email: string;
  username: string;
  password: string;
  deviceId: string;
  os: string;
  osVersion: string;
  fcmToken: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
