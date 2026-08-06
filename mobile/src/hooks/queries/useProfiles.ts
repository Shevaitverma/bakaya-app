/**
 * Profile queries & mutations.
 *
 * "Profile expenses" is just a filtered personal-expense list — use
 * `useExpenses({ profileId })` from ./useExpenses, there is no separate hook.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from '../../lib/queryKeys';
import { profileService } from '../../services/profileService';
import type { CreateProfileRequest, UpdateProfileRequest } from '../../types/profile';

export function useProfiles() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.profiles.list(),
    queryFn: async () => {
      const res = await profileService.getProfiles(accessToken!);
      return res.data;
    },
    enabled: !!accessToken,
  });
}

export function useProfile(profileId: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.profiles.detail(profileId),
    queryFn: async () => {
      const res = await profileService.getProfile(profileId, accessToken!);
      return res.data;
    },
    enabled: !!accessToken && !!profileId,
  });
}

/** Expense rows and analytics both render profile name/colour, so they move too. */
function useInvalidateProfiles() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  };
}

export function useCreateProfile() {
  const { accessToken } = useAuth();
  const invalidate = useInvalidateProfiles();
  return useMutation({
    mutationFn: (data: CreateProfileRequest) => profileService.createProfile(data, accessToken!),
    onSuccess: invalidate,
  });
}

export function useUpdateProfile() {
  const { accessToken } = useAuth();
  const invalidate = useInvalidateProfiles();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProfileRequest }) =>
      profileService.updateProfile(id, data, accessToken!),
    onSuccess: invalidate,
  });
}

export function useDeleteProfile() {
  const { accessToken } = useAuth();
  const invalidate = useInvalidateProfiles();
  return useMutation({
    mutationFn: (id: string) => profileService.deleteProfile(id, accessToken!),
    onSuccess: invalidate,
  });
}
