/**
 * Analytics queries. Read-only — invalidated by expense/profile/category writes.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from '../../lib/queryKeys';
import { analyticsService } from '../../services/analyticsService';
import type { AnalyticsQueryParams } from '../../types/analytics';

export function useAnalyticsSummary(params?: AnalyticsQueryParams) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.analytics.summary(params),
    queryFn: async () => {
      const res = await analyticsService.getSummary(accessToken!, params);
      return res.data;
    },
    enabled: !!accessToken,
  });
}

export function useAnalyticsByProfile(params?: AnalyticsQueryParams) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.analytics.byProfile(params),
    queryFn: async () => {
      const res = await analyticsService.getByProfile(accessToken!, params);
      return res.data;
    },
    enabled: !!accessToken,
  });
}

export function useAnalyticsByCategory(params?: AnalyticsQueryParams) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.analytics.byCategory(params),
    queryFn: async () => {
      const res = await analyticsService.getByCategory(accessToken!, params);
      return res.data;
    },
    enabled: !!accessToken,
  });
}

export function useAnalyticsTrends(params?: AnalyticsQueryParams) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.analytics.trends(params),
    queryFn: async () => {
      const res = await analyticsService.getTrends(accessToken!, params);
      return res.data;
    },
    enabled: !!accessToken,
  });
}

/** GET /analytics/balance — same endpoint `expenseService.getBalance` hits. */
export function useBalance(params?: AnalyticsQueryParams) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.analytics.balance(params),
    queryFn: async () => {
      const res = await analyticsService.getBalance(accessToken!, params);
      return res.data;
    },
    enabled: !!accessToken,
  });
}
