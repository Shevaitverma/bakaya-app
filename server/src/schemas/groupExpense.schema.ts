import { z } from "zod";

const splitEntrySchema = z.object({
  userId: z.string().min(1),
  amount: z.number().positive("Split amount must be positive"),
  // Kept only for "percentage" splits so an edit can restore the exact
  // percentages; `amount` remains the source of truth for balances.
  percentage: z.number().min(0).max(100).optional(),
});

const splitTypeSchema = z.enum(["equal", "exact", "percentage"]);

type SplitCoherenceInput = {
  amount?: number;
  splitType?: z.infer<typeof splitTypeSchema>;
  splitAmong?: Array<{ amount: number; percentage?: number }>;
};

// Exported for tests: amounts must always add up to the total, and percentage
// splits must additionally carry percentages adding up to 100.
export function checkSplitCoherence(input: SplitCoherenceInput, ctx: z.RefinementCtx): void {
  const splitAmong = input.splitAmong;
  if (!splitAmong || splitAmong.length === 0) return;

  // On update, amount may be omitted — the service compares against the stored total.
  if (input.amount !== undefined) {
    const splitSum = Math.round(splitAmong.reduce((sum, s) => sum + s.amount, 0) * 100) / 100;
    if (Math.abs(splitSum - input.amount) > 0.01) {
      ctx.addIssue({
        code: "custom",
        path: ["splitAmong"],
        message: `Split amounts (${splitSum}) must equal the expense total (${input.amount})`,
      });
    }
  }

  if (input.splitType !== "percentage") return;

  if (splitAmong.some((s) => s.percentage === undefined)) {
    ctx.addIssue({
      code: "custom",
      path: ["splitAmong"],
      message: "Every split needs a percentage when splitType is percentage",
    });
    return;
  }
  const percentSum = Math.round(splitAmong.reduce((sum, s) => sum + s.percentage!, 0) * 100) / 100;
  if (Math.abs(percentSum - 100) > 0.01) {
    ctx.addIssue({
      code: "custom",
      path: ["splitAmong"],
      message: `Split percentages (${percentSum}) must add up to 100`,
    });
  }
}

export const createGroupExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  paidBy: z.string().min(1).optional(),
  splitType: splitTypeSchema.optional(),
  splitAmong: z.array(splitEntrySchema).optional(),
}).superRefine(checkSplitCoherence);

export const updateGroupExpenseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  category: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  paidBy: z.string().min(1).optional(),
  splitType: splitTypeSchema.optional(),
  splitAmong: z.array(splitEntrySchema).optional(),
}).superRefine(checkSplitCoherence);

export const groupExpenseQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export type CreateGroupExpenseInput = z.infer<typeof createGroupExpenseSchema>;
export type UpdateGroupExpenseInput = z.infer<typeof updateGroupExpenseSchema>;
export type GroupExpenseQueryInput = z.infer<typeof groupExpenseQuerySchema>;
