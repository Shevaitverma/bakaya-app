import { api } from "../api-client";
import type { Settlement } from "@/types/settlement";

export interface GroupMember {
  userId: {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  role: "admin" | "member";
  joinedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  createdBy: {
    id: string;
    email: string;
    name?: string;
  };
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface GroupsData {
  groups: Group[];
  pagination: Pagination;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
}

export interface GroupExpenseSplit {
  userId: string;
  amount: number;
}

export interface GroupExpense {
  _id: string;
  groupId: string;
  paidBy: {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  title: string;
  amount: number;
  category?: string;
  notes?: string;
  splitAmong: GroupExpenseSplit[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupExpensesData {
  expenses: GroupExpense[];
  totalAmount: number;
  pagination: Pagination;
}

export interface CreateGroupExpenseInput {
  title: string;
  amount: number;
  category?: string;
  notes?: string;
  paidBy?: string;
  splitAmong?: GroupExpenseSplit[];
}

export interface GroupBalances {
  balances: Record<string, number>;
}

export interface SettlementsData {
  settlements: Settlement[];
  pagination: Pagination;
}

export interface CreateSettlementInput {
  paidBy: string;
  paidTo: string;
  amount: number;
  notes?: string;
}

export const groupsApi = {
  list(params: { page?: number; limit?: number } = {}): Promise<GroupsData> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return api.get<GroupsData>(`/api/v1/groups${qs ? `?${qs}` : ""}`);
  },

  get(id: string): Promise<Group> {
    return api.get<Group>(`/api/v1/groups/${id}`);
  },

  create(data: CreateGroupInput): Promise<Group> {
    return api.post<Group>("/api/v1/groups", data);
  },

  update(id: string, data: UpdateGroupInput): Promise<Group> {
    return api.put<Group>(`/api/v1/groups/${id}`, data);
  },

  delete(id: string): Promise<{ deleted: boolean }> {
    return api.delete<{ deleted: boolean }>(`/api/v1/groups/${id}`);
  },

  addMember(groupId: string, email: string): Promise<Group> {
    return api.post<Group>(`/api/v1/groups/${groupId}/members`, { email });
  },

  removeMember(groupId: string, memberId: string): Promise<{ removed: boolean }> {
    return api.delete<{ removed: boolean }>(`/api/v1/groups/${groupId}/members/${memberId}`);
  },

  getExpenses(groupId: string, params: { page?: number; limit?: number } = {}): Promise<GroupExpensesData> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return api.get<GroupExpensesData>(`/api/v1/groups/${groupId}/expenses${qs ? `?${qs}` : ""}`);
  },

  createExpense(groupId: string, data: CreateGroupExpenseInput): Promise<GroupExpense> {
    return api.post<GroupExpense>(`/api/v1/groups/${groupId}/expenses`, data);
  },

  deleteExpense(groupId: string, expenseId: string): Promise<{ deleted: boolean }> {
    return api.delete<{ deleted: boolean }>(`/api/v1/groups/${groupId}/expenses/${expenseId}`);
  },

  getBalances(groupId: string): Promise<GroupBalances> {
    return api.get<GroupBalances>(`/api/v1/groups/${groupId}/balances`);
  },

  getSettlements(groupId: string): Promise<SettlementsData> {
    return api.get<SettlementsData>(`/api/v1/groups/${groupId}/settlements`);
  },

  createSettlement(groupId: string, data: CreateSettlementInput): Promise<Settlement> {
    return api.post<Settlement>(`/api/v1/groups/${groupId}/settlements`, data);
  },

  deleteSettlement(groupId: string, settlementId: string): Promise<{ deleted: boolean }> {
    return api.delete<{ deleted: boolean }>(`/api/v1/groups/${groupId}/settlements/${settlementId}`);
  },
};
