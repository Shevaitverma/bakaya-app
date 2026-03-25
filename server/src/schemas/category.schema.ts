import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(30),
  emoji: z.string().min(1).max(10).optional().default("📄"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default("#6B7280"),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(30).optional(),
  emoji: z.string().min(1).max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isActive: z.boolean().optional(),
  order: z.number().min(0).optional(),
});

export const reorderCategoriesSchema = z.object({
  categoryIds: z.array(z.string().min(1)).min(1),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
