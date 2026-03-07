/**
 * Expense type definitions
 */

export interface Expense {
  _id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PersonalExpensesData {
  expenses: Expense[];
  totalExpenseAmount: number;
  pagination: Pagination;
}

export interface PersonalExpensesResponse {
  success: boolean;
  data: PersonalExpensesData;
  meta: {
    timestamp: string;
  };
}

export interface CreateExpenseRequest {
  title: string;
  amount: number;
  category: string;
  notes?: string;
}

export interface CreateExpenseResponse {
  success: boolean;
  data: Expense;
  meta: {
    timestamp: string;
  };
}
