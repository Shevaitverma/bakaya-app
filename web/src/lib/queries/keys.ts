import type { AnalyticsQueryParams } from "@/lib/api/analytics";
import type { ExpenseQueryParams } from "@/lib/api/expenses";
import type { InvitationStatus } from "@/lib/api/invitations";

export const queryKeys = {
  profiles: {
    all: ["profiles"] as const,
    detail: (id: string) => ["profiles", id] as const,
  },

  categories: {
    all: ["categories"] as const,
  },

  expenses: {
    all: ["expenses"] as const,
    list: (params: ExpenseQueryParams) => ["expenses", "list", params] as const,
    detail: (id: string) => ["expenses", id] as const,
  },

  analytics: {
    all: ["analytics"] as const,
    summary: (params: AnalyticsQueryParams) => ["analytics", "summary", params] as const,
    byProfile: (params: AnalyticsQueryParams) => ["analytics", "byProfile", params] as const,
    byCategory: (params: AnalyticsQueryParams) => ["analytics", "byCategory", params] as const,
    balance: (params: AnalyticsQueryParams) => ["analytics", "balance", params] as const,
    trends: (params: AnalyticsQueryParams) => ["analytics", "trends", params] as const,
  },

  groups: {
    all: ["groups"] as const,
    list: (params?: { page?: number; limit?: number }) => ["groups", "list", params] as const,
    detail: (id: string) => ["groups", id] as const,
    expenses: (groupId: string) => ["groups", groupId, "expenses"] as const,
    balances: (groupId: string) => ["groups", groupId, "balances"] as const,
    settlements: (groupId: string) => ["groups", groupId, "settlements"] as const,
  },

  invitations: {
    all: ["invitations"] as const,
    mine: (status?: InvitationStatus) => ["invitations", "mine", status ?? null] as const,
    forGroup: (groupId: string, status?: InvitationStatus) =>
      ["invitations", "group", groupId, status ?? null] as const,
  },
};
