/**
 * Expense service for API calls.
 *
 * Uses the shared `authedFetch` wrapper — which handles 401 auto-refresh,
 * refresh dedup, and session-expired escalation in one place.
 */

import { API_CONFIG } from '../constants/api';
import { authedFetch } from '../lib/authedFetch';
import type {
  PersonalExpensesResponse,
  SingleExpenseResponse,
  CreateExpenseRequest,
  CreateExpenseResponse,
  UpdateExpenseRequest,
  UpdateExpenseResponse,
  DeleteExpenseResponse,
  ExpenseQueryParams,
  BalanceResponse,
} from '../types/expense';

class ExpenseService {
  /**
   * GET /personal-expenses
   * Fetch all personal expenses with optional filtering and pagination.
   */
  async getPersonalExpenses(
    page: number = 1,
    limit: number = 20,
    token: string,
    filters?: Omit<ExpenseQueryParams, 'page' | 'limit'>
  ): Promise<PersonalExpensesResponse> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));

    if (filters?.profileId) params.set('profileId', filters.profileId);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.source) params.set('source', filters.source);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);

    const endpoint = `${API_CONFIG.ENDPOINTS.EXPENSES.PERSONAL_EXPENSES}?${params.toString()}`;

    return authedFetch<PersonalExpensesResponse>(endpoint, {
      method: 'GET',
      token,
    });
  }

  /**
   * GET /personal-expenses/:id
   */
  async getExpense(
    expenseId: string,
    token: string
  ): Promise<SingleExpenseResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.EXPENSES.SINGLE_EXPENSE(expenseId);
    return authedFetch<SingleExpenseResponse>(endpoint, {
      method: 'GET',
      token,
    });
  }

  /**
   * POST /personal-expenses
   */
  async createExpense(
    expenseData: CreateExpenseRequest,
    token: string
  ): Promise<CreateExpenseResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.EXPENSES.PERSONAL_EXPENSES;
    return authedFetch<CreateExpenseResponse>(endpoint, {
      method: 'POST',
      token,
      body: JSON.stringify(expenseData),
    });
  }

  /**
   * PUT /personal-expenses/:id
   */
  async updateExpense(
    expenseId: string,
    expenseData: UpdateExpenseRequest,
    token: string
  ): Promise<UpdateExpenseResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.EXPENSES.SINGLE_EXPENSE(expenseId);
    return authedFetch<UpdateExpenseResponse>(endpoint, {
      method: 'PUT',
      token,
      body: JSON.stringify(expenseData),
    });
  }

  /**
   * DELETE /personal-expenses/:id
   */
  async deleteExpense(
    expenseId: string,
    token: string
  ): Promise<DeleteExpenseResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.EXPENSES.SINGLE_EXPENSE(expenseId);
    return authedFetch<DeleteExpenseResponse>(endpoint, {
      method: 'DELETE',
      token,
    });
  }

  /**
   * GET /analytics/balance
   */
  async getBalance(
    token: string,
    params?: { startDate?: string; endDate?: string; profileId?: string }
  ): Promise<BalanceResponse> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.profileId) searchParams.set('profileId', params.profileId);

    const query = searchParams.toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.ANALYTICS.BALANCE}${query ? `?${query}` : ''}`;

    return authedFetch<BalanceResponse>(endpoint, {
      method: 'GET',
      token,
    });
  }
}

export const expenseService = new ExpenseService();
