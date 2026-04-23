/**
 * Group service for API calls.
 *
 * Uses the shared `authedFetch` wrapper — which handles 401 auto-refresh,
 * refresh dedup, and session-expired escalation in one place.
 */

import { API_CONFIG } from '../constants/api';
import { authedFetch } from '../lib/authedFetch';
import type {
  GroupsResponse,
  GroupResponse,
  GroupExpensesResponse,
  GroupBalancesResponse,
  SettlementsResponse,
  CreateGroupExpenseRequest,
  CreateSettlementRequest,
  CreateGroupRequest,
  UpdateGroupRequest,
  UpdateGroupExpenseRequest,
  GroupExpense,
} from '../types/group';

class GroupService {
  async getGroups(
    page: number = 1,
    limit: number = 20,
    token: string
  ): Promise<GroupsResponse> {
    const endpoint = `${API_CONFIG.ENDPOINTS.GROUPS.LIST}?page=${page}&limit=${limit}`;
    return authedFetch<GroupsResponse>(endpoint, { method: 'GET', token });
  }

  async createGroup(data: CreateGroupRequest, token: string): Promise<GroupResponse> {
    return authedFetch<GroupResponse>(API_CONFIG.ENDPOINTS.GROUPS.LIST, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async getGroup(id: string, token: string): Promise<GroupResponse> {
    return authedFetch<GroupResponse>(API_CONFIG.ENDPOINTS.GROUPS.SINGLE(id), {
      method: 'GET',
      token,
    });
  }

  async getGroupExpenses(
    groupId: string,
    page: number = 1,
    limit: number = 20,
    token: string
  ): Promise<GroupExpensesResponse> {
    const endpoint = `${API_CONFIG.ENDPOINTS.GROUPS.EXPENSES(groupId)}?page=${page}&limit=${limit}`;
    return authedFetch<GroupExpensesResponse>(endpoint, { method: 'GET', token });
  }

  async createGroupExpense(
    groupId: string,
    data: CreateGroupExpenseRequest,
    token: string
  ): Promise<{ success: boolean; data: any; meta: { timestamp: string } }> {
    return authedFetch(API_CONFIG.ENDPOINTS.GROUPS.EXPENSES(groupId), {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async deleteGroupExpense(
    groupId: string,
    expenseId: string,
    token: string
  ): Promise<{ success: boolean; data: { message: string }; meta: { timestamp: string } }> {
    return authedFetch(API_CONFIG.ENDPOINTS.GROUPS.SINGLE_EXPENSE(groupId, expenseId), {
      method: 'DELETE',
      token,
    });
  }

  async getGroupBalances(groupId: string, token: string): Promise<GroupBalancesResponse> {
    return authedFetch<GroupBalancesResponse>(API_CONFIG.ENDPOINTS.GROUPS.BALANCES(groupId), {
      method: 'GET',
      token,
    });
  }

  async getSettlements(groupId: string, token: string): Promise<SettlementsResponse> {
    return authedFetch<SettlementsResponse>(API_CONFIG.ENDPOINTS.GROUPS.SETTLEMENTS(groupId), {
      method: 'GET',
      token,
    });
  }

  async createSettlement(
    groupId: string,
    data: CreateSettlementRequest,
    token: string
  ): Promise<{ success: boolean; data: any; meta: { timestamp: string } }> {
    return authedFetch(API_CONFIG.ENDPOINTS.GROUPS.SETTLEMENTS(groupId), {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async updateGroup(id: string, data: UpdateGroupRequest, token: string): Promise<GroupResponse> {
    return authedFetch<GroupResponse>(API_CONFIG.ENDPOINTS.GROUPS.SINGLE(id), {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  }

  async deleteGroup(
    id: string,
    token: string
  ): Promise<{ success: boolean; data: { deleted: boolean }; meta: { timestamp: string } }> {
    return authedFetch(API_CONFIG.ENDPOINTS.GROUPS.SINGLE(id), {
      method: 'DELETE',
      token,
    });
  }

  async removeMember(
    groupId: string,
    memberId: string,
    token: string
  ): Promise<{ success: boolean; data: { removed: boolean }; meta: { timestamp: string } }> {
    return authedFetch(API_CONFIG.ENDPOINTS.GROUPS.SINGLE_MEMBER(groupId, memberId), {
      method: 'DELETE',
      token,
    });
  }

  async getGroupExpense(
    groupId: string,
    expenseId: string,
    token: string
  ): Promise<{ success: boolean; data: GroupExpense; meta: { timestamp: string } }> {
    return authedFetch(API_CONFIG.ENDPOINTS.GROUPS.SINGLE_EXPENSE(groupId, expenseId), {
      method: 'GET',
      token,
    });
  }

  async updateGroupExpense(
    groupId: string,
    expenseId: string,
    data: UpdateGroupExpenseRequest,
    token: string
  ): Promise<{ success: boolean; data: GroupExpense; meta: { timestamp: string } }> {
    return authedFetch(API_CONFIG.ENDPOINTS.GROUPS.SINGLE_EXPENSE(groupId, expenseId), {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  }

  async deleteSettlement(
    groupId: string,
    settlementId: string,
    token: string
  ): Promise<{ success: boolean; data: { deleted: boolean }; meta: { timestamp: string } }> {
    return authedFetch(API_CONFIG.ENDPOINTS.GROUPS.SINGLE_SETTLEMENT(groupId, settlementId), {
      method: 'DELETE',
      token,
    });
  }
}

export const groupService = new GroupService();
