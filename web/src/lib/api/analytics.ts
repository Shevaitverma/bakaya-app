import { api } from "../api-client";

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  profileId?: string;
}

export interface ProfileBreakdown {
  profileId: string;
  profileName: string;
  total: number;
}

export interface AnalyticsPeriod {
  start: string;
  end: string;
}

export interface SummaryData {
  totalSpent: number;
  byProfile: ProfileBreakdown[];
  period: AnalyticsPeriod;
}

export interface ProfileAnalytics {
  profileId: string;
  profileName: string;
  total: number;
  count: number;
}

export interface ByProfileData {
  profiles: ProfileAnalytics[];
  totalSpent: number;
  period: AnalyticsPeriod;
}

export interface CategoryAnalytics {
  category: string;
  total: number;
  count: number;
}

export interface ByCategoryData {
  categories: CategoryAnalytics[];
  totalSpent: number;
  period: AnalyticsPeriod;
}

export interface TrendMonth {
  year: number;
  month: number;
  total: number;
  count: number;
}

export interface TrendsData {
  months: TrendMonth[];
  period: AnalyticsPeriod;
}

export interface BalanceData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  spentPercentage: number;
  dailySpendingRate: number;
  dailyBudgetRate: number;
  daysRemaining: number;
  period: { start: string; end: string };
}

function buildQueryString(params: AnalyticsQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.profileId) searchParams.set("profileId", params.profileId);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export const analyticsApi = {
  summary(params: AnalyticsQueryParams = {}): Promise<SummaryData> {
    return api.get<SummaryData>(
      `/api/v1/analytics/summary${buildQueryString(params)}`
    );
  },

  byProfile(params: AnalyticsQueryParams = {}): Promise<ByProfileData> {
    return api.get<ByProfileData>(
      `/api/v1/analytics/by-profile${buildQueryString(params)}`
    );
  },

  byCategory(params: AnalyticsQueryParams = {}): Promise<ByCategoryData> {
    return api.get<ByCategoryData>(
      `/api/v1/analytics/by-category${buildQueryString(params)}`
    );
  },

  trends(params: AnalyticsQueryParams = {}): Promise<TrendsData> {
    return api.get<TrendsData>(
      `/api/v1/analytics/trends${buildQueryString(params)}`
    );
  },

  balance(params: AnalyticsQueryParams = {}): Promise<BalanceData> {
    return api.get<BalanceData>(
      `/api/v1/analytics/balance${buildQueryString(params)}`
    );
  },
};
