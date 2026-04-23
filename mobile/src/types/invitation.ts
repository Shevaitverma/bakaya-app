/**
 * Group invitation type definitions
 */

import type { GroupData } from './group';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

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
  invitedUserId?: string;
  status: InvitationStatus;
  message?: string;
  createdAt: string;
  respondedAt?: string;
  expiresAt: string;
}

export interface InvitationResponse {
  success: boolean;
  data: {
    invitation: GroupInvitation;
    group?: GroupData;
  };
  meta: {
    timestamp: string;
  };
}

export interface InvitationsResponse {
  success: boolean;
  data: {
    invitations: GroupInvitation[];
  };
  meta: {
    timestamp: string;
  };
}
