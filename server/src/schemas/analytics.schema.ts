import { z } from "zod";

export const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  profileId: z.string().optional(),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
