import { api, getToken } from "../api-client";

export interface Expense {
  _id: string;
  userId: string;
  profileId?: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  source?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  title: string;
  amount: number;
  type?: "income" | "expense";
  profileId?: string;
  category?: string;
  source?: string;
  notes?: string;
}

export interface UpdateExpenseInput {
  title?: string;
  amount?: number;
  type?: "income" | "expense";
  profileId?: string;
  category?: string;
  source?: string;
  notes?: string;
}

export interface ExpenseQueryParams {
  page?: number;
  limit?: number;
  type?: "income" | "expense";
  category?: string;
  source?: string;
  search?: string;
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
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  pagination: Pagination;
}

export const expensesApi = {
  list(params: ExpenseQueryParams = {}): Promise<PersonalExpensesData> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.type) searchParams.set("type", params.type);
    if (params.category) searchParams.set("category", params.category);
    if (params.source) searchParams.set("source", params.source);
    if (params.search) searchParams.set("search", params.search);
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

  async exportCSV(params: {
    startDate?: string;
    endDate?: string;
    type?: "income" | "expense";
  } = {}): Promise<void> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.set("startDate", params.startDate);
    if (params.endDate) searchParams.set("endDate", params.endDate);
    if (params.type) searchParams.set("type", params.type);
    const qs = searchParams.toString();
    const url = `${API_BASE}/api/v1/personal-expenses/export${qs ? `?${qs}` : ""}`;

    const token = getToken();
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error("Failed to export CSV");
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "bakaya-export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  },
};
