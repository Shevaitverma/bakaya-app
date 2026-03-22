import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30).optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  deviceId: z.string().optional(),
  os: z.string().optional(),
  osVersion: z.string().optional(),
  fcmToken: z.string().optional(),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
  deviceId: z.string().optional(),
  os: z.string().optional(),
  osVersion: z.string().optional(),
  fcmToken: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
