/**
 * Centralized query key factory.
 *
 * Hierarchical keys enable precise or broad invalidation:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.expenses.list({ profileId: '123' }) })
 */

export const queryKeys = {
  expenses: {
    all: ['expenses'] as const,
    lists: () => [...queryKeys.expenses.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.expenses.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.expenses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.expenses.details(), id] as const,
  },

  profiles: {
    all: ['profiles'] as const,
    list: () => [...queryKeys.profiles.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.profiles.all, 'detail', id] as const,
  },

  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
  },

  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.groups.lists(), filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.groups.all, 'detail', id] as const,
    expenses: (groupId: string) => [...queryKeys.groups.all, 'expenses', groupId] as const,
    balances: (groupId: string) => [...queryKeys.groups.all, 'balances', groupId] as const,
    settlements: (groupId: string) => [...queryKeys.groups.all, 'settlements', groupId] as const,
  },

  analytics: {
    all: ['analytics'] as const,
    summary: (params?: Record<string, unknown>) =>
      [...queryKeys.analytics.all, 'summary', params ?? {}] as const,
    byProfile: (params?: Record<string, unknown>) =>
      [...queryKeys.analytics.all, 'by-profile', params ?? {}] as const,
    byCategory: (params?: Record<string, unknown>) =>
      [...queryKeys.analytics.all, 'by-category', params ?? {}] as const,
    trends: (params?: Record<string, unknown>) =>
      [...queryKeys.analytics.all, 'trends', params ?? {}] as const,
    balance: (params?: Record<string, unknown>) =>
      [...queryKeys.analytics.all, 'balance', params ?? {}] as const,
  },
} as const;
