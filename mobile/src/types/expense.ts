/**
 * Expense type definitions
 */

export interface Expense {
  _id: string;
  userId: string;
  profileId?: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  source?: string;
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
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  pagination: Pagination;
}

export interface PersonalExpensesResponse {
  success: boolean;
  data: PersonalExpensesData;
  meta: {
    timestamp: string;
  };
}

export interface SingleExpenseResponse {
  success: boolean;
  data: Expense;
  meta: {
    timestamp: string;
  };
}

export interface CreateExpenseRequest {
  title: string;
  amount: number;
  type?: 'income' | 'expense';
  category?: string;
  source?: string;
  notes?: string;
  profileId?: string;
}

export interface CreateExpenseResponse {
  success: boolean;
  data: Expense;
  meta: {
    timestamp: string;
  };
}

export interface UpdateExpenseRequest {
  title?: string;
  amount?: number;
  type?: 'income' | 'expense';
  profileId?: string;
  category?: string;
  source?: string;
  notes?: string;
}

export interface UpdateExpenseResponse {
  success: boolean;
  data: Expense;
  meta: {
    timestamp: string;
  };
}

export interface DeleteExpenseResponse {
  success: boolean;
  data: { deleted: boolean };
  meta: {
    timestamp: string;
  };
}

/** Query parameters supported by GET /personal-expenses */
export interface ExpenseQueryParams {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense';
  category?: string;
  source?: string;
  search?: string;
  profileId?: string;
  startDate?: string;
  endDate?: string;
}

/** Balance analytics response from GET /analytics/balance */
export interface BalanceData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  spentPercentage: number;
  dailySpendingRate: number;
  dailyBudgetRate: number;
  daysRemaining: number;
}

export interface BalanceResponse {
  success: boolean;
  data: BalanceData;
  meta: {
    timestamp: string;
  };
}
