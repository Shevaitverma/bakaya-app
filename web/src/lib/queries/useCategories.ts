import { useQuery } from "@tanstack/react-query";
import { categoriesApi, type Category } from "@/lib/api/categories";
import { queryKeys } from "./keys";

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoriesApi.list(),
    select: (data): Category[] => data.categories ?? [],
  });
}

export function useCategoriesMap() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoriesApi.list(),
    select: (data) => {
      const map: Record<string, Category> = {};
      for (const c of data.categories ?? []) {
        map[c.name] = c;
      }
      return map;
    },
  });
}
