/**
 * Group queries & mutations.
 *
 * Everything for one group nests under `queryKeys.groups.detail(id)`, so a
 * write inside a group invalidates that one key and the group's expenses,
 * balances, suggested transfers and settlements all refetch.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from '../../lib/queryKeys';
import { groupService } from '../../services/groupService';
import type {
  CreateGroupRequest,
  UpdateGroupRequest,
  CreateGroupExpenseRequest,
  UpdateGroupExpenseRequest,
  CreateSettlementRequest,
} from '../../types/group';

export function useGroups(page = 1, limit = 50) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.groups.list({ page, limit }),
    queryFn: async () => {
      const res = await groupService.getGroups(page, limit, accessToken!);
      return res.data;
    },
    enabled: !!accessToken,
  });
}

export function useGroup(groupId: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: async () => {
      const res = await groupService.getGroup(groupId, accessToken!);
      return res.data;
    },
    enabled: !!accessToken && !!groupId,
  });
}

export function useGroupExpenses(groupId: string, page = 1, limit = 50) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.groups.expenses(groupId), { page, limit }],
    queryFn: async () => {
      const res = await groupService.getGroupExpenses(groupId, page, limit, accessToken!);
      return res.data;
    },
    enabled: !!accessToken && !!groupId,
  });
}

export function useGroupExpense(groupId: string, expenseId: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.groups.expense(groupId, expenseId),
    queryFn: async () => {
      const res = await groupService.getGroupExpense(groupId, expenseId, accessToken!);
      return res.data;
    },
    enabled: !!accessToken && !!groupId && !!expenseId,
  });
}

export function useGroupBalances(groupId: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.groups.balances(groupId),
    queryFn: async () => {
      const res = await groupService.getGroupBalances(groupId, accessToken!);
      return res.data;
    },
    enabled: !!accessToken && !!groupId,
  });
}

export function useSuggestedTransfers(groupId: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.groups.suggestedTransfers(groupId),
    queryFn: async () => {
      const res = await groupService.getSuggestedTransfers(groupId, accessToken!);
      return res.data;
    },
    enabled: !!accessToken && !!groupId,
  });
}

export function useSettlements(groupId: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.groups.settlements(groupId),
    queryFn: async () => {
      const res = await groupService.getSettlements(groupId, accessToken!);
      return res.data;
    },
    enabled: !!accessToken && !!groupId,
  });
}

/** Invalidates one group and every sub-resource hanging off it. */
function useInvalidateGroup() {
  const queryClient = useQueryClient();
  return (groupId: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
}

export function useCreateGroup() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupRequest) => groupService.createGroup(data, accessToken!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() }),
  });
}

export function useUpdateGroup() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupRequest }) =>
      groupService.updateGroup(id, data, accessToken!),
    onSuccess: (_res, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });
}

export function useDeleteGroup() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupService.deleteGroup(id, accessToken!),
    onSuccess: (_res, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.groups.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });
}

export function useRemoveGroupMember() {
  const { accessToken } = useAuth();
  const invalidateGroup = useInvalidateGroup();
  return useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
      groupService.removeMember(groupId, memberId, accessToken!),
    onSuccess: (_res, { groupId }) => invalidateGroup(groupId),
  });
}

export function useCreateGroupExpense() {
  const { accessToken } = useAuth();
  const invalidateGroup = useInvalidateGroup();
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: CreateGroupExpenseRequest }) =>
      groupService.createGroupExpense(groupId, data, accessToken!),
    onSuccess: (_res, { groupId }) => invalidateGroup(groupId),
  });
}

export function useUpdateGroupExpense() {
  const { accessToken } = useAuth();
  const invalidateGroup = useInvalidateGroup();
  return useMutation({
    mutationFn: ({
      groupId,
      expenseId,
      data,
    }: {
      groupId: string;
      expenseId: string;
      data: UpdateGroupExpenseRequest;
    }) => groupService.updateGroupExpense(groupId, expenseId, data, accessToken!),
    onSuccess: (_res, { groupId }) => invalidateGroup(groupId),
  });
}

export function useDeleteGroupExpense() {
  const { accessToken } = useAuth();
  const invalidateGroup = useInvalidateGroup();
  return useMutation({
    mutationFn: ({ groupId, expenseId }: { groupId: string; expenseId: string }) =>
      groupService.deleteGroupExpense(groupId, expenseId, accessToken!),
    onSuccess: (_res, { groupId }) => invalidateGroup(groupId),
  });
}

export function useCreateSettlement() {
  const { accessToken } = useAuth();
  const invalidateGroup = useInvalidateGroup();
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: CreateSettlementRequest }) =>
      groupService.createSettlement(groupId, data, accessToken!),
    onSuccess: (_res, { groupId }) => invalidateGroup(groupId),
  });
}

export function useDeleteSettlement() {
  const { accessToken } = useAuth();
  const invalidateGroup = useInvalidateGroup();
  return useMutation({
    mutationFn: ({ groupId, settlementId }: { groupId: string; settlementId: string }) =>
      groupService.deleteSettlement(groupId, settlementId, accessToken!),
    onSuccess: (_res, { groupId }) => invalidateGroup(groupId),
  });
}
