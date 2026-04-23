import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi, type CreateGroupInput, type CreateGroupExpenseInput, type CreateSettlementInput } from "@/lib/api/groups";
import { queryKeys } from "./keys";

export function useGroups(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.groups.list(params),
    queryFn: () => groupsApi.list(params),
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: queryKeys.groups.detail(id),
    queryFn: () => groupsApi.get(id),
    enabled: !!id,
  });
}

export function useGroupExpenses(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.expenses(groupId),
    queryFn: () => groupsApi.getExpenses(groupId),
    enabled: !!groupId,
  });
}

export function useGroupBalances(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.balances(groupId),
    queryFn: () => groupsApi.getBalances(groupId),
    enabled: !!groupId,
  });
}

export function useGroupSettlements(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.settlements(groupId),
    queryFn: () => groupsApi.getSettlements(groupId),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupInput) => groupsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useRemoveMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => groupsApi.removeMember(groupId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.groups.balances(groupId) });
    },
  });
}

export function useCreateGroupExpense(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupExpenseInput) => groupsApi.createExpense(groupId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.expenses(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.groups.balances(groupId) });
    },
  });
}

export function useDeleteGroupExpense(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => groupsApi.deleteExpense(groupId, expenseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.expenses(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.groups.balances(groupId) });
    },
  });
}

export function useCreateSettlement(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSettlementInput) => groupsApi.createSettlement(groupId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.settlements(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.groups.balances(groupId) });
    },
  });
}

export function useDeleteSettlement(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settlementId: string) => groupsApi.deleteSettlement(groupId, settlementId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.groups.settlements(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.groups.balances(groupId) });
    },
  });
}
