import { api } from "../api-client";

export interface Expense {
  _id: string;
  userId: string;
  profileId?: string;
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
  profileId?: string;
  category?: string;
  notes?: string;
}

export interface UpdateExpenseInput {
  title?: string;
  amount?: number;
  profileId?: string;
  category?: string;
  notes?: string;
}

export interface ExpenseQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  profileId?: string;
  startDate?: string;
  endDate?: string;
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
    if (params.profileId) searchParams.set("profileId", params.profileId);
    if (params.startDate) searchParams.set("startDate", params.startDate);
    if (params.endDate) searchParams.set("endDate", params.endDate);

    const qs = searchParams.toString();
    return api.get<PersonalExpensesData>(
      `/api/v1/personal-expenses${qs ? `?${qs}` : ""}`
    );
  },

  getById(id: string): Promise<Expense> {
    return api.get<Expense>(`/api/v1/personal-expenses/${id}`);
  },

  create(data: CreateExpenseInput): Promise<Expense> {
    return api.post<Expense>("/api/v1/personal-expenses", data);
  },

  update(id: string, data: UpdateExpenseInput): Promise<Expense> {
    return api.put<Expense>(`/api/v1/personal-expenses/${id}`, data);
  },

  delete(id: string): Promise<{ deleted: boolean }> {
    return api.delete<{ deleted: boolean }>(`/api/v1/personal-expenses/${id}`);
  },
};
