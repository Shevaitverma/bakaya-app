/**
 * Expense service for API calls
 */

import { API_CONFIG } from '../constants/api';
import type { PersonalExpensesResponse, CreateExpenseRequest, CreateExpenseResponse } from '../types/expense';

class ExpenseService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = 15000 // 15 seconds default timeout
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestStartTime = Date.now();

    console.log('[ExpenseService] Making HTTP request', {
      url,
      method: options.method || 'GET',
      endpoint,
      timeout: `${timeout}ms`,
      timestamp: new Date().toISOString(),
    });

    // Create AbortController for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[ExpenseService] Request timeout', {
        url,
        timeout: `${timeout}ms`,
        timestamp: new Date().toISOString(),
      });
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

      // Clear timeout on successful response
      clearTimeout(timeoutId);

      const requestDuration = Date.now() - requestStartTime;
      console.log('[ExpenseService] HTTP response received', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${requestDuration}ms`,
        timestamp: new Date().toISOString(),
      });

      // Handle 504 Gateway Timeout specifically
      if (response.status === 504) {
        clearTimeout(timeoutId);
        throw new Error('Gateway timeout: The server took too long to respond. Please try again.');
      }

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (parseErr) {
          console.error('[ExpenseService] Error parsing error response', {
            url,
            status: response.status,
            error: parseErr,
            timestamp: new Date().toISOString(),
          });
        }

        let errorMessage = '';
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (response.status === 504) {
          errorMessage = 'Gateway timeout: The server took too long to respond. Please try again.';
        } else {
          errorMessage = `Request failed with status ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      // Parse successful response
      let jsonData: any;
      try {
        const responseText = await response.text();
        console.log('[ExpenseService] Response text received', {
          url,
          textLength: responseText.length,
          preview: responseText.substring(0, 200),
          timestamp: new Date().toISOString(),
        });

        jsonData = responseText ? JSON.parse(responseText) : {};

        console.log('[ExpenseService] Response parsed successfully', {
          url,
          hasSuccess: 'success' in jsonData,
          hasData: 'data' in jsonData,
          timestamp: new Date().toISOString(),
        });
      } catch (parseErr) {
        clearTimeout(timeoutId);
        console.error('[ExpenseService] JSON parse error', {
          url,
          error: parseErr,
          timestamp: new Date().toISOString(),
        });
        throw new Error('Invalid response format from server');
      }

      return jsonData;
    } catch (err) {
      // Clear timeout if still active
      clearTimeout(timeoutId);

      const requestDuration = Date.now() - requestStartTime;
      console.error('[ExpenseService] Request failed', {
        url,
        error: err,
        errorName: err instanceof Error ? err.name : 'Unknown',
        errorMessage: err instanceof Error ? err.message : String(err),
        duration: `${requestDuration}ms`,
        timestamp: new Date().toISOString(),
      });

      // Handle AbortError (timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timeout: The server took too long to respond. Please try again.');
      }

      // Handle network errors and other fetch failures
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      }

      if (err instanceof Error) {
        throw err;
      }

      throw new Error('An unexpected error occurred during the request');
    }
  }

  async getPersonalExpenses(
    page: number = 1,
    limit: number = 20,
    token: string
  ): Promise<PersonalExpensesResponse> {
    const endpoint = `${API_CONFIG.ENDPOINTS.EXPENSES.PERSONAL_EXPENSES}?page=${page}&limit=${limit}`;
    const fullUrl = `${this.baseUrl}${endpoint}`;

    console.log('[ExpenseService] getPersonalExpenses called', {
      endpoint,
      fullUrl,
      page,
      limit,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      timestamp: new Date().toISOString(),
    });

    return this.request<PersonalExpensesResponse>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createExpense(
    expenseData: CreateExpenseRequest,
    token: string
  ): Promise<CreateExpenseResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.EXPENSES.PERSONAL_EXPENSES;

    return this.request<CreateExpenseResponse>(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(expenseData),
    });
  }

  async deleteExpense(
    expenseId: string,
    token: string
  ): Promise<{ success: boolean; data: { message: string }; meta: { timestamp: string } }> {
    const endpoint = `${API_CONFIG.ENDPOINTS.EXPENSES.PERSONAL_EXPENSES}/${expenseId}`;

    return this.request<{ success: boolean; data: { message: string }; meta: { timestamp: string } }>(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const expenseService = new ExpenseService();
