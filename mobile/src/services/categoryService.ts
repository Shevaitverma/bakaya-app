/**
 * Category service for API calls
 */

import { API_CONFIG } from '../constants/api';
import type {
  CategoriesResponse,
  SingleCategoryResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  DeleteCategoryResponse,
} from '../types/category';

class CategoryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = 15000
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortController.signal,
        headers: {
          ...API_CONFIG.HEADERS,
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (response.status === 504) {
        throw new Error('Gateway timeout: The server took too long to respond. Please try again.');
      }

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (_parseErr) {
          // ignore parse error
        }

        if (response.status === 401) {
          const error = new Error(errorData.error?.message || errorData.message || 'Your session has expired. Please log in again.');
          (error as any).statusCode = 401;
          throw error;
        }

        let errorMessage = '';
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else {
          errorMessage = `Request failed with status ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      let jsonData: any;
      try {
        const responseText = await response.text();
        jsonData = responseText ? JSON.parse(responseText) : {};
      } catch (_parseErr) {
        clearTimeout(timeoutId);
        throw new Error('Invalid response format from server');
      }

      return jsonData;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timeout: The server took too long to respond. Please try again.');
      }

      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      }

      if (err instanceof Error) {
        throw err;
      }

      throw new Error('An unexpected error occurred during the request');
    }
  }

  /**
   * GET /categories
   * Fetch all categories. Auto-seeds defaults on first call.
   */
  async getCategories(token: string): Promise<CategoriesResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.CATEGORIES.LIST;

    return this.request<CategoriesResponse>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * POST /categories
   * Create a new custom category.
   */
  async createCategory(
    data: CreateCategoryRequest,
    token: string
  ): Promise<SingleCategoryResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.CATEGORIES.LIST;

    return this.request<SingleCategoryResponse>(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT /categories/:id
   * Update an existing category.
   */
  async updateCategory(
    id: string,
    data: UpdateCategoryRequest,
    token: string
  ): Promise<SingleCategoryResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.CATEGORIES.SINGLE(id);

    return this.request<SingleCategoryResponse>(endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE /categories/:id
   * Delete a category by ID.
   */
  async deleteCategory(
    id: string,
    token: string
  ): Promise<DeleteCategoryResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.CATEGORIES.SINGLE(id);

    return this.request<DeleteCategoryResponse>(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const categoryService = new CategoryService();
