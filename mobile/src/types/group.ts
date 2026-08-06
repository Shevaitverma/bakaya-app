/**
 * Group type definitions
 */

/**
 * Populated user reference, as returned by the server.
 * The server's `User.toJSON` strips `_id` and re-exposes it as `id`,
 * so populated references always come through as `{ id, email, ... }`.
 */
export interface PopulatedUser {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

export interface GroupMember {
  userId: PopulatedUser;
  role: string;
  joinedAt: string;
}

export interface GroupData {
  _id: string;
  name: string;
  description: string;
  createdBy: PopulatedUser;
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

export type SplitType = 'equal' | 'exact' | 'percentage';

export interface SplitEntry {
  userId: string;
  amount: number;
  // Only set on percentage splits so an edit can reopen the original
  // percentages; `amount` stays the source of truth for balances.
  percentage?: number;
}

export interface GroupExpense {
  _id: string;
  groupId: string;
  paidBy: PopulatedUser;
  title: string;
  amount: number;
  category?: string;
  notes?: string;
  // Absent on expenses written before split types existed — treat as "equal".
  splitType?: SplitType;
  splitAmong: SplitEntry[];
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

export interface SuggestedTransfer {
  from: string;
  to: string;
  amount: number;
}

export interface SuggestedTransfersResponse {
  success: boolean;
  data: {
    transfers: SuggestedTransfer[];
  };
  meta: {
    timestamp: string;
  };
}

export interface Settlement {
  _id: string;
  groupId: string;
  paidBy: PopulatedUser;
  paidTo: PopulatedUser;
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
  splitType: SplitType;
  splitAmong: SplitEntry[];
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
  paidBy?: string;
  splitType?: SplitType;
  splitAmong?: SplitEntry[];
}

/**
 * Best-effort display name for a populated user.
 * Order: name → "firstName lastName" → username-part-of-email → email.
 */
export function getPopulatedUserName(user: PopulatedUser | null | undefined): string {
  if (!user) return '';
  if (user.name) return user.name;
  const combined = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  if (user.email) {
    const local = user.email.split('@')[0];
    return local || user.email;
  }
  return '';
}

/**
 * Single-character initial for a user's avatar.
 * Prefers firstName / name over email.
 */
export function getPopulatedUserInitial(user: PopulatedUser | null | undefined): string {
  const name = getPopulatedUserName(user);
  return name ? name.charAt(0).toUpperCase() : '?';
}
