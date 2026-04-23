/**
 * Invitation service for group invitation API calls.
 *
 * Uses the shared `authedFetch` wrapper — previously this service lacked
 * 401 auto-refresh entirely, which was the root cause of the invitation
 * count 401 surfacing to users.
 */

import { API_CONFIG } from '../constants/api';
import { authedFetch } from '../lib/authedFetch';
import type {
  InvitationResponse,
  InvitationsResponse,
  InvitationStatus,
} from '../types/invitation';

class InvitationService {
  async sendInvitation(
    groupId: string,
    email: string,
    token: string,
    message?: string
  ): Promise<InvitationResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.INVITATIONS(groupId);

    const body: { email: string; message?: string } = { email };
    if (message && message.trim()) {
      body.message = message.trim();
    }

    return authedFetch<InvitationResponse>(endpoint, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    });
  }

  async listGroupInvitations(
    groupId: string,
    token: string,
    status: InvitationStatus = 'pending'
  ): Promise<InvitationsResponse> {
    const endpoint = `${API_CONFIG.ENDPOINTS.GROUPS.INVITATIONS(groupId)}?status=${status}`;
    return authedFetch<InvitationsResponse>(endpoint, { method: 'GET', token });
  }

  async cancelInvitation(
    groupId: string,
    invitationId: string,
    token: string
  ): Promise<{ success: boolean; data: { cancelled: boolean }; meta: { timestamp: string } }> {
    const endpoint = API_CONFIG.ENDPOINTS.GROUPS.INVITATION(groupId, invitationId);
    return authedFetch(endpoint, { method: 'DELETE', token });
  }

  async listMyInvitations(
    token: string,
    status: InvitationStatus = 'pending'
  ): Promise<InvitationsResponse> {
    const endpoint = `${API_CONFIG.ENDPOINTS.INVITATIONS.LIST_MINE}?status=${status}`;
    return authedFetch<InvitationsResponse>(endpoint, { method: 'GET', token });
  }

  async acceptInvitation(
    invitationId: string,
    token: string
  ): Promise<InvitationResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.INVITATIONS.ACCEPT(invitationId);
    return authedFetch<InvitationResponse>(endpoint, { method: 'POST', token });
  }

  async declineInvitation(
    invitationId: string,
    token: string
  ): Promise<InvitationResponse> {
    const endpoint = API_CONFIG.ENDPOINTS.INVITATIONS.DECLINE(invitationId);
    return authedFetch<InvitationResponse>(endpoint, { method: 'POST', token });
  }
}

export const invitationService = new InvitationService();
