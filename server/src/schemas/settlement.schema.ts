import { z } from "zod";

export const createSettlementSchema = z.object({
  paidBy: z.string().min(1, "paidBy is required"),
  paidTo: z.string().min(1, "paidTo is required"),
  amount: z.number().positive("Amount must be positive"),
  notes: z.string().max(500).optional(),
}).refine(data => data.paidBy !== data.paidTo, {
  message: "Cannot settle with yourself",
  path: ["paidTo"],
});

export const settlementQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
export type SettlementQueryInput = z.infer<typeof settlementQuerySchema>;
