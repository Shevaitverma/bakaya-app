/**
 * Group type definitions
 */

export interface GroupMember {
  userId: {
    _id: string;
    email: string;
  };
  role: string;
  joinedAt: string;
}

export interface GroupData {
  _id: string;
  name: string;
  description: string;
  createdBy: {
    _id: string;
    email: string;
  };
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface GroupsData {
  groups: GroupData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface GroupsResponse {
  success: boolean;
  data: GroupsData;
  meta: {
    timestamp: string;
  };
}

export interface GroupResponse {
  success: boolean;
  data: GroupData;
  meta: {
    timestamp: string;
  };
}

export interface GroupExpense {
  _id: string;
  groupId: string;
  paidBy: { _id: string; email: string; name?: string; firstName?: string; lastName?: string };
  title: string;
  amount: number;
  category?: string;
  notes?: string;
  splitAmong: { userId: string; amount: number }[];
  createdAt: string;
}

export interface GroupExpensesResponse {
  success: boolean;
  data: {
    expenses: GroupExpense[];
    totalAmount: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  meta: {
    timestamp: string;
  };
}

export interface GroupBalance {
  [userId: string]: number;
}

export interface GroupBalancesResponse {
  success: boolean;
  data: {
    balances: GroupBalance;
  };
  meta: {
    timestamp: string;
  };
}

export interface Settlement {
  _id: string;
  groupId: string;
  paidBy: { _id: string; email: string; name?: string };
  paidTo: { _id: string; email: string; name?: string };
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface SettlementsResponse {
  success: boolean;
  data: {
    settlements: Settlement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  meta: {
    timestamp: string;
  };
}

export interface CreateGroupExpenseRequest {
  title: string;
  amount: number;
  category?: string;
  notes?: string;
  paidBy: string;
  splitAmong: { userId: string; amount: number }[];
}

export interface CreateSettlementRequest {
  paidBy: string;
  paidTo: string;
  amount: number;
  notes?: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

export interface UpdateGroupExpenseRequest {
  title?: string;
  amount?: number;
  category?: string;
  notes?: string;
  splitAmong?: { userId: string; amount: number }[];
}
