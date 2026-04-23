/**
 * Category service for API calls.
 *
 * Uses the shared `authedFetch` wrapper.
 */

import { API_CONFIG } from '../constants/api';
import { authedFetch } from '../lib/authedFetch';
import type {
  CategoriesResponse,
  SingleCategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  DeleteCategoryResponse,
} from '../types/category';

class CategoryService {
  /**
   * GET /categories — auto-seeds defaults on first call.
   */
  async getCategories(token: string, includeArchived = false): Promise<CategoriesResponse> {
    const qs = includeArchived ? '?activeOnly=false' : '';
    const endpoint = `${API_CONFIG.ENDPOINTS.CATEGORIES.LIST}${qs}`;
    return authedFetch<CategoriesResponse>(endpoint, { method: 'GET', token });
  }

  /**
   * POST /categories
   */
  async createCategory(
    data: CreateCategoryRequest,
    token: string
  ): Promise<SingleCategoryResponse> {
    return authedFetch<SingleCategoryResponse>(API_CONFIG.ENDPOINTS.CATEGORIES.LIST, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT /categories/:id
   */
  async updateCategory(
    id: string,
    data: UpdateCategoryRequest,
    token: string
  ): Promise<SingleCategoryResponse> {
    return authedFetch<SingleCategoryResponse>(API_CONFIG.ENDPOINTS.CATEGORIES.SINGLE(id), {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE /categories/:id
   */
  async deleteCategory(
    id: string,
    token: string
  ): Promise<DeleteCategoryResponse> {
    return authedFetch<DeleteCategoryResponse>(API_CONFIG.ENDPOINTS.CATEGORIES.SINGLE(id), {
      method: 'DELETE',
      token,
    });
  }
}

export const categoryService = new CategoryService();
