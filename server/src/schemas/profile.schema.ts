import { z } from "zod";

export const createProfileSchema = z.object({
  name: z.string().min(1, "Profile name is required").max(100),
  relationship: z.string().max(50).optional(),
  avatar: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  relationship: z.string().max(50).optional(),
  avatar: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
});

export const profileQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ProfileQueryInput = z.infer<typeof profileQuerySchema>;
