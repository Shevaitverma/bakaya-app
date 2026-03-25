import { z } from "zod";

export const createExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["income", "expense"]).default("expense"),
  source: z.string().max(50).optional(),
  profileId: z.string().min(1).optional(),
  category: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const updateExpenseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  type: z.enum(["income", "expense"]).optional(),
  source: z.string().max(50).optional(),
  profileId: z.string().min(1).optional(),
  category: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const expenseQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  type: z.enum(["income", "expense"]).optional(),
  source: z.string().optional(),
  search: z.string().max(100).optional(),
  category: z.string().optional(),
  profileId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
