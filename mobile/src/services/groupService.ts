/**
 * Group service for API calls
 */

import { API_CONFIG } from '../constants/api';
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
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...API_CONFIG.HEADERS,
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (parseErr) {
          console.error('[GROUP API] Error parsing error response:', parseErr);
        }

        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          const error = new Error(errorData.error?.message || errorData.message || 'Your session has expired. Please log in again.');
          (error as any).statusCode = 401;
          throw error;
        }

        let errorMessage = '';
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else {
          errorMessage = `Request failed with status ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      // Parse successful response
      let jsonData: any;
      try {
        const responseText = await response.text();
        jsonData = responseText ? JSON.parse(responseText) : {};
      } catch (parseErr) {
        console.error('[GROUP API] JSON parse error:', parseErr);
        throw new Error('Invalid response format from server');
      }

      return jsonData;
    } catch (err) {
      // Handle network errors and other fetch failures
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      }
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred during the request');
    }
  }

  async getGroups(
    page: number = 1,
    limit: number = 20,
    token: string
  ): Promise<GroupsResponse> {
    const endpoint = `${API_CONFIG.ENDPOINTS.GROUPS.LIST}?page=${page}&limit=${limit}`;

    return this.request<GroupsResponse>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createGroup(
    data: CreateGroupRequest,
    token: string
  ): Promise<GroupResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.LIST;

    return this.request<GroupResponse>(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async getGroup(
    id: string,
    token: string
  ): Promise<GroupResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.SINGLE(id);

    return this.request<GroupResponse>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getGroupExpenses(
    groupId: string,
    page: number = 1,
    limit: number = 20,
    token: string
  ): Promise<GroupExpensesResponse> {
    const endpoint = `${API_CONFIG.ENDPOINTS.GROUPS.EXPENSES(groupId)}?page=${page}&limit=${limit}`;

    return this.request<GroupExpensesResponse>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createGroupExpense(
    groupId: string,
    data: CreateGroupExpenseRequest,
    token: string
  ): Promise<{ success: boolean; data: any; meta: { timestamp: string } }> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.EXPENSES(groupId);

    return this.request<{ success: boolean; data: any; meta: { timestamp: string } }>(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async deleteGroupExpense(
    groupId: string,
    expenseId: string,
    token: string
  ): Promise<{ success: boolean; data: { message: string }; meta: { timestamp: string } }> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.SINGLE_EXPENSE(groupId, expenseId);

    return this.request<{ success: boolean; data: { message: string }; meta: { timestamp: string } }>(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getGroupBalances(
    groupId: string,
    token: string
  ): Promise<GroupBalancesResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.BALANCES(groupId);

    return this.request<GroupBalancesResponse>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getSettlements(
    groupId: string,
    token: string
  ): Promise<SettlementsResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.SETTLEMENTS(groupId);

    return this.request<SettlementsResponse>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async addMember(
    groupId: string,
    email: string,
    token: string
  ): Promise<GroupResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.MEMBERS(groupId);

    return this.request<GroupResponse>(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });
  }

  async createSettlement(
    groupId: string,
    data: CreateSettlementRequest,
    token: string
  ): Promise<{ success: boolean; data: any; meta: { timestamp: string } }> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.SETTLEMENTS(groupId);

    return this.request<{ success: boolean; data: any; meta: { timestamp: string } }>(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async updateGroup(
    id: string,
    data: UpdateGroupRequest,
    token: string
  ): Promise<GroupResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.SINGLE(id);

    return this.request<GroupResponse>(endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async deleteGroup(
    id: string,
    token: string
  ): Promise<{ success: boolean; data: { deleted: boolean }; meta: { timestamp: string } }> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.SINGLE(id);

    return this.request<{ success: boolean; data: { deleted: boolean }; meta: { timestamp: string } }>(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async removeMember(
    groupId: string,
    memberId: string,
    token: string
  ): Promise<{ success: boolean; data: { removed: boolean }; meta: { timestamp: string } }> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.SINGLE_MEMBER(groupId, memberId);

    return this.request<{ success: boolean; data: { removed: boolean }; meta: { timestamp: string } }>(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getGroupExpense(
    groupId: string,
    expenseId: string,
    token: string
  ): Promise<{ success: boolean; data: GroupExpense; meta: { timestamp: string } }> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.SINGLE_EXPENSE(groupId, expenseId);

    return this.request<{ success: boolean; data: GroupExpense; meta: { timestamp: string } }>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async updateGroupExpense(
    groupId: string,
    expenseId: string,
    data: UpdateGroupExpenseRequest,
    token: string
  ): Promise<{ success: boolean; data: GroupExpense; meta: { timestamp: string } }> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.SINGLE_EXPENSE(groupId, expenseId);

    return this.request<{ success: boolean; data: GroupExpense; meta: { timestamp: string } }>(endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async deleteSettlement(
    groupId: string,
    settlementId: string,
    token: string
  ): Promise<{ success: boolean; data: { deleted: boolean }; meta: { timestamp: string } }> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.SINGLE_SETTLEMENT(groupId, settlementId);

    return this.request<{ success: boolean; data: { deleted: boolean }; meta: { timestamp: string } }>(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const groupService = new GroupService();
