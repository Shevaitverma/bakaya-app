import { z } from "zod";

export const createExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  amount: z.number().min(0, "Amount must be non-negative"),
  category: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const expenseQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  category: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
