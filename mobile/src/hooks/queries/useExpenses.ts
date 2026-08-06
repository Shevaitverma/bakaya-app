/**
 * Personal expense queries & mutations.
 *
 * Hooks read the token from AuthContext themselves — screens never pass it.
 * Query hooks return the unwrapped `response.data` payload.
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from '../../lib/queryKeys';
import { expenseService } from '../../services/expenseService';
import type {
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseQueryParams,
} from '../../types/expense';

type ExpenseFilters = Omit<ExpenseQueryParams, 'page' | 'limit'>;

/** Personal expenses, one page. Use for fixed-size lists (e.g. Home's latest 5). */
export function useExpenses(filters?: ExpenseFilters, page = 1, limit = 20) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.expenses.list({ ...filters, page, limit }),
    queryFn: async () => {
      const res = await expenseService.getPersonalExpenses(page, limit, accessToken!, filters);
      return res.data;
    },
    enabled: !!accessToken,
  });
}

/** Personal expenses with infinite scroll. Totals live on `data.pages[0]`. */
export function useInfiniteExpenses(filters?: ExpenseFilters, limit = 20) {
  const { accessToken } = useAuth();
  return useInfiniteQuery({
    queryKey: queryKeys.expenses.infinite({ ...filters, limit }),
    queryFn: async ({ pageParam }) => {
      const res = await expenseService.getPersonalExpenses(pageParam, limit, accessToken!, filters);
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNext ? lastPage.pagination.page + 1 : undefined,
    enabled: !!accessToken,
  });
}

export function useExpense(expenseId: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.expenses.detail(expenseId),
    queryFn: async () => {
      const res = await expenseService.getExpense(expenseId, accessToken!);
      return res.data;
    },
    enabled: !!accessToken && !!expenseId,
  });
}

/** Any personal-expense write moves both the lists and every analytics rollup. */
function useInvalidateExpenses() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  };
}

export function useCreateExpense() {
  const { accessToken } = useAuth();
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => expenseService.createExpense(data, accessToken!),
    onSuccess: invalidate,
  });
}

export function useUpdateExpense() {
  const { accessToken } = useAuth();
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseRequest }) =>
      expenseService.updateExpense(id, data, accessToken!),
    onSuccess: invalidate,
  });
}

export function useDeleteExpense() {
  const { accessToken } = useAuth();
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id, accessToken!),
    onSuccess: invalidate,
  });
}
