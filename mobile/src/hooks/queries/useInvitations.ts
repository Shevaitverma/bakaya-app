/**
 * Invitation queries & mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from '../../lib/queryKeys';
import { invitationService } from '../../services/invitationService';
import type { InvitationStatus } from '../../types/invitation';

/** Invitations addressed to the signed-in user (drives the tab badge). */
export function useMyInvitations(status: InvitationStatus = 'pending') {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.invitations.mine(status),
    queryFn: async () => {
      const res = await invitationService.listMyInvitations(accessToken!, status);
      return res.data;
    },
    enabled: !!accessToken,
  });
}

/** Invitations this group has sent. Admin-only endpoint — 403 for members. */
export function useGroupInvitations(groupId: string, status: InvitationStatus = 'pending') {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.groups.invitations(groupId, status),
    queryFn: async () => {
      const res = await invitationService.listGroupInvitations(groupId, accessToken!, status);
      return res.data;
    },
    enabled: !!accessToken && !!groupId,
    retry: false,
  });
}

export function useSendInvitation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, email, message }: { groupId: string; email: string; message?: string }) =>
      invitationService.sendInvitation(groupId, email, accessToken!, message),
    onSuccess: (_res, { groupId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.invitations(groupId, 'pending') }),
  });
}

export function useCancelInvitation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, invitationId }: { groupId: string; invitationId: string }) =>
      invitationService.cancelInvitation(groupId, invitationId, accessToken!),
    onSuccess: (_res, { groupId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.invitations(groupId, 'pending') }),
  });
}

export function useAcceptInvitation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      invitationService.acceptInvitation(invitationId, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.all });
      // Accepting adds a group to the user's list.
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });
}

export function useDeclineInvitation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      invitationService.declineInvitation(invitationId, accessToken!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invitations.all }),
  });
}
