/**
 * Centralized query key factory.
 *
 * Hierarchical keys enable precise or broad invalidation:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
 *   queryClient.invalidateQueries({ queryKey: queryKeys.expenses.list({ profileId: '123' }) })
 *
 * Everything that belongs to one group nests under `groups.detail(id)`, so a
 * single invalidate on that key covers the group, its expenses, balances,
 * transfers, settlements and invitations.
 *
 * Screens must only ever IMPORT from here — add new keys in this file.
 */

export const queryKeys = {
  expenses: {
    all: ['expenses'] as const,
    lists: () => [...queryKeys.expenses.all, 'list'] as const,
    list: (filters?: object) =>
      [...queryKeys.expenses.lists(), filters ?? {}] as const,
    // Separate from `list` on purpose: infinite queries cache InfiniteData,
    // a different shape than a plain page.
    infinite: (filters?: object) =>
      [...queryKeys.expenses.all, 'infinite', filters ?? {}] as const,
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
    list: (includeArchived = false) =>
      [...queryKeys.categories.all, 'list', includeArchived] as const,
  },

  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: (filters?: object) =>
      [...queryKeys.groups.lists(), filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.groups.all, 'detail', id] as const,
    expenses: (groupId: string) => [...queryKeys.groups.detail(groupId), 'expenses'] as const,
    expense: (groupId: string, expenseId: string) =>
      [...queryKeys.groups.expenses(groupId), expenseId] as const,
    balances: (groupId: string) => [...queryKeys.groups.detail(groupId), 'balances'] as const,
    suggestedTransfers: (groupId: string) =>
      [...queryKeys.groups.detail(groupId), 'transfers'] as const,
    settlements: (groupId: string) => [...queryKeys.groups.detail(groupId), 'settlements'] as const,
    invitations: (groupId: string, status: string) =>
      [...queryKeys.groups.detail(groupId), 'invitations', status] as const,
  },

  invitations: {
    all: ['invitations'] as const,
    mine: (status: string) => [...queryKeys.invitations.all, 'mine', status] as const,
  },

  analytics: {
    all: ['analytics'] as const,
    summary: (params?: object) =>
      [...queryKeys.analytics.all, 'summary', params ?? {}] as const,
    byProfile: (params?: object) =>
      [...queryKeys.analytics.all, 'by-profile', params ?? {}] as const,
    byCategory: (params?: object) =>
      [...queryKeys.analytics.all, 'by-category', params ?? {}] as const,
    trends: (params?: object) =>
      [...queryKeys.analytics.all, 'trends', params ?? {}] as const,
    balance: (params?: object) =>
      [...queryKeys.analytics.all, 'balance', params ?? {}] as const,
  },
} as const;
