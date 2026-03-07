import { api } from "../api-client";

export interface Expense {
  _id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  title: string;
  amount: number;
  category?: string;
  notes?: string;
}

export interface ExpenseQueryParams {
  page?: number;
  limit?: number;
  category?: string;
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

export const expensesApi = {
  list(params: ExpenseQueryParams = {}): Promise<PersonalExpensesData> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.category) searchParams.set("category", params.category);

    const qs = searchParams.toString();
    return api.get<PersonalExpensesData>(
      `/api/v1/personal-expenses${qs ? `?${qs}` : ""}`
    );
  },

  create(data: CreateExpenseInput): Promise<Expense> {
    return api.post<Expense>("/api/v1/personal-expenses", data);
  },

  delete(id: string): Promise<{ deleted: boolean }> {
    return api.delete<{ deleted: boolean }>(`/api/v1/personal-expenses/${id}`);
  },
};
