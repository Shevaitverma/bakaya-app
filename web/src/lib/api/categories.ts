import { api } from "../api-client";

export interface Category {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
}

export const categoriesApi = {
  list(includeArchived = false) {
    const qs = includeArchived ? "?activeOnly=false" : "";
    return api.get<{ categories: Category[] }>(`/api/v1/categories${qs}`);
  },
  create(data: { name: string; emoji?: string; color?: string }) {
    return api.post<Category>("/api/v1/categories", data);
  },
  update(id: string, data: Partial<{ name: string; emoji: string; color: string; isActive: boolean }>) {
    return api.put<Category>(`/api/v1/categories/${id}`, data);
  },
  delete(id: string) {
    return api.delete<{ deleted: boolean }>(`/api/v1/categories/${id}`);
  },
  reorder(categoryIds: string[]) {
    return api.put<void>("/api/v1/categories/reorder", { categoryIds });
  },
};
