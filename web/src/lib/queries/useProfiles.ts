import { useQuery } from "@tanstack/react-query";
import { profilesApi } from "@/lib/api/profiles";
import { queryKeys } from "./keys";

export function useProfiles() {
  return useQuery({
    queryKey: queryKeys.profiles.all,
    queryFn: () => profilesApi.getProfiles(),
    select: (data) => data.profiles ?? [],
  });
}

export function useProfile(id: string) {
  return useQuery({
    queryKey: queryKeys.profiles.detail(id),
    queryFn: () => profilesApi.getProfile(id),
    enabled: !!id,
  });
}
