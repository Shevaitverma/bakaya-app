import { z } from "zod";

export const createGroupExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  amount: z.number().min(0, "Amount must be non-negative"),
  category: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  splitAmong: z.array(z.object({
    userId: z.string().min(1),
    amount: z.number().min(0),
  })).optional(),
});

export const updateGroupExpenseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  amount: z.number().min(0).optional(),
  category: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  splitAmong: z.array(z.object({
    userId: z.string().min(1),
    amount: z.number().min(0),
  })).optional(),
});

export const groupExpenseQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export type CreateGroupExpenseInput = z.infer<typeof createGroupExpenseSchema>;
export type UpdateGroupExpenseInput = z.infer<typeof updateGroupExpenseSchema>;
export type GroupExpenseQueryInput = z.infer<typeof groupExpenseQuerySchema>;
