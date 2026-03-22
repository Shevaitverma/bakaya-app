/**
 * Authentication types and interfaces
 *
 * Kept in sync with server schemas (auth.schema.ts) and models (User.ts, Device.ts).
 */

// -- User (mirrors server User.toJSON()) --

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  profilePicture?: string;
  authProvider: 'local' | 'google';
  googleId?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// -- Device (mirrors server Device.toJSON()) --

export interface Device {
  id: string;
  userId: string;
  deviceId: string;
  os?: string;
  osVersion?: string;
  fcmToken?: string;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

// -- Login --

/** Fields accepted by POST /api/v1/auth/login */
export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  os?: string;
  osVersion?: string;
  fcmToken?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    device: Device | null;
    accessToken: string;
    refreshToken: string;
  };
  meta: {
    timestamp: string;
  };
}

// -- Register --

/** Fields accepted by POST /api/v1/auth/register */
export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface RegisterResponse {
  success: boolean;
  data: User;
  meta: {
    timestamp: string;
  };
}

// -- Google Auth --

/** Fields accepted by POST /api/v1/auth/google */
export interface GoogleAuthRequest {
  credential: string;
  deviceId?: string;
  os?: string;
  osVersion?: string;
  fcmToken?: string;
}

export interface GoogleAuthResponse {
  success: boolean;
  data: {
    user: User;
    device: Device | null;
    accessToken: string;
    refreshToken: string;
  };
  meta: {
    timestamp: string;
  };
}

// -- Token Refresh --

/** Fields accepted by POST /api/v1/auth/refresh */
export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  meta: {
    timestamp: string;
  };
}

// -- Auth State --

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
