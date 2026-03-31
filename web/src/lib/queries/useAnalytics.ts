import { useQuery } from "@tanstack/react-query";
import { analyticsApi, type AnalyticsQueryParams } from "@/lib/api/analytics";
import { queryKeys } from "./keys";

export function useSummary(params: AnalyticsQueryParams) {
  return useQuery({
    queryKey: queryKeys.analytics.summary(params),
    queryFn: () => analyticsApi.summary(params),
  });
}

export function useByProfile(params: AnalyticsQueryParams) {
  return useQuery({
    queryKey: queryKeys.analytics.byProfile(params),
    queryFn: () => analyticsApi.byProfile(params),
  });
}

export function useByCategory(params: AnalyticsQueryParams) {
  return useQuery({
    queryKey: queryKeys.analytics.byCategory(params),
    queryFn: () => analyticsApi.byCategory(params),
  });
}

export function useBalance(params: AnalyticsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.analytics.balance(params),
    queryFn: () => analyticsApi.balance(params),
  });
}

export function useTrends(params: AnalyticsQueryParams) {
  return useQuery({
    queryKey: queryKeys.analytics.trends(params),
    queryFn: () => analyticsApi.trends(params),
  });
}
