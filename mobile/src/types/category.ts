/**
 * Category types for the categories API
 */

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

export interface CategoriesResponse {
  success: boolean;
  data: { categories: Category[] };
}

export interface SingleCategoryResponse {
  success: boolean;
  data: { category: Category };
}

export interface CreateCategoryRequest {
  name: string;
  emoji: string;
  color: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  emoji?: string;
  color?: string;
  isActive?: boolean;
  order?: number;
}

export interface DeleteCategoryResponse {
  success: boolean;
  message: string;
}
