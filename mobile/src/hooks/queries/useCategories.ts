/**
 * Category queries & mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from '../../lib/queryKeys';
import { categoryService } from '../../services/categoryService';
import type { CreateCategoryRequest, UpdateCategoryRequest } from '../../types/category';

export function useCategories(includeArchived = false) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.categories.list(includeArchived),
    queryFn: async () => {
      const res = await categoryService.getCategories(accessToken!, includeArchived);
      return res.data;
    },
    enabled: !!accessToken,
  });
}

/** Expense rows and the by-category rollup both render category name/colour. */
function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  };
}

export function useCreateCategory() {
  const { accessToken } = useAuth();
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => categoryService.createCategory(data, accessToken!),
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const { accessToken } = useAuth();
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      categoryService.updateCategory(id, data, accessToken!),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const { accessToken } = useAuth();
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id, accessToken!),
    onSuccess: invalidate,
  });
}
