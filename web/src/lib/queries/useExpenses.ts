import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi, type ExpenseQueryParams, type CreateExpenseInput, type UpdateExpenseInput } from "@/lib/api/expenses";
import { queryKeys } from "./keys";

export function useExpenses(params: ExpenseQueryParams) {
  return useQuery({
    queryKey: queryKeys.expenses.list(params),
    queryFn: () => expensesApi.list(params),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(id),
    queryFn: () => expensesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseInput) => expensesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
      qc.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseInput }) => expensesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
      qc.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
      qc.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}
