import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100),
  description: z.string().max(500).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const groupQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const createInvitationSchema = z.object({
  email: z.string().email("Invalid email format"),
  message: z.string().max(200).optional(),
});

export const listInvitationsQuerySchema = z.object({
  status: z.enum(["pending", "accepted", "declined", "cancelled"]).optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type GroupQueryInput = z.infer<typeof groupQuerySchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type ListInvitationsQueryInput = z.infer<typeof listInvitationsQuerySchema>;
