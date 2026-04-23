import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  invitationsApi,
  type InvitationStatus,
  type SendInvitationInput,
} from "@/lib/api/invitations";
import { queryKeys } from "./keys";

export function useMyInvitations(status?: InvitationStatus) {
  return useQuery({
    queryKey: queryKeys.invitations.mine(status),
    queryFn: () => invitationsApi.listMine(status),
  });
}

export function useGroupInvitations(groupId: string, status?: InvitationStatus) {
  return useQuery({
    queryKey: queryKeys.invitations.forGroup(groupId, status),
    queryFn: () => invitationsApi.listForGroup(groupId, status),
    enabled: !!groupId,
  });
}

export function useSendInvitation(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SendInvitationInput) => invitationsApi.send(groupId, data),
    onSuccess: () => {
      // Invalidate all status variants for this group
      qc.invalidateQueries({
        queryKey: ["invitations", "group", groupId],
      });
      qc.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
    },
  });
}

export function useCancelInvitation(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      invitationsApi.cancel(groupId, invitationId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["invitations", "group", groupId],
      });
      qc.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
    },
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => invitationsApi.accept(invitationId),
    onSuccess: (data) => {
      // Invalidate all "mine" variants
      qc.invalidateQueries({ queryKey: ["invitations", "mine"] });
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
      const acceptedGroupId = data?.group?._id;
      if (acceptedGroupId) {
        qc.invalidateQueries({
          queryKey: queryKeys.groups.detail(acceptedGroupId),
        });
      }
    },
  });
}

export function useDeclineInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => invitationsApi.decline(invitationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations", "mine"] });
    },
  });
}
