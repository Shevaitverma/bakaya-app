import { api } from "../api-client";
import type { Group } from "./groups";

export type InvitationStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface GroupInvitation {
  _id: string;
  groupId: {
    _id: string;
    name: string;
  };
  invitedBy: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  invitedEmail: string;
  invitedUserId: string;
  status: InvitationStatus;
  message?: string;
  createdAt: string;
  respondedAt?: string;
  expiresAt: string;
}

export interface SendInvitationInput {
  email: string;
  message?: string;
}

export interface InvitationsList {
  invitations: GroupInvitation[];
}

export interface SendInvitationResult {
  invitation: GroupInvitation;
}

export interface AcceptInvitationResult {
  invitation: GroupInvitation;
  group: Group;
}

export interface DeclineInvitationResult {
  invitation: GroupInvitation;
}

function buildStatusQuery(status?: InvitationStatus): string {
  if (!status) return "";
  const qs = new URLSearchParams({ status }).toString();
  return `?${qs}`;
}

export const invitationsApi = {
  /** Admin-only: send an invitation to an email for a group. */
  send(groupId: string, data: SendInvitationInput): Promise<SendInvitationResult> {
    return api.post<SendInvitationResult>(
      `/api/v1/groups/${groupId}/invitations`,
      data
    );
  },

  /** Admin-only: list invitations for a group (optionally filtered by status). */
  listForGroup(
    groupId: string,
    status?: InvitationStatus
  ): Promise<InvitationsList> {
    return api.get<InvitationsList>(
      `/api/v1/groups/${groupId}/invitations${buildStatusQuery(status)}`
    );
  },

  /** Inviter or admin: cancel a pending invitation. */
  cancel(groupId: string, invitationId: string): Promise<{ invitation: GroupInvitation }> {
    return api.delete<{ invitation: GroupInvitation }>(
      `/api/v1/groups/${groupId}/invitations/${invitationId}`
    );
  },

  /** Current user's incoming invitations (optionally filtered by status). */
  listMine(status?: InvitationStatus): Promise<InvitationsList> {
    return api.get<InvitationsList>(
      `/api/v1/invitations/me${buildStatusQuery(status)}`
    );
  },

  /** Accept an invitation: joins the user to the group. */
  accept(invitationId: string): Promise<AcceptInvitationResult> {
    return api.post<AcceptInvitationResult>(
      `/api/v1/invitations/${invitationId}/accept`,
      {}
    );
  },

  /** Decline an invitation. */
  decline(invitationId: string): Promise<DeclineInvitationResult> {
    return api.post<DeclineInvitationResult>(
      `/api/v1/invitations/${invitationId}/decline`,
      {}
    );
  },
};
