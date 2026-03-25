/**
 * Analytics type definitions
 */

// Re-export BalanceData from expense types (single source of truth)
export type { BalanceData, BalanceResponse } from './expense';

/** Query parameters for all analytics endpoints */
export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  profileId?: string;
}

/** Period range returned by every analytics endpoint.
 *  The server returns { start, end } — NOT startDate/endDate. */
export interface AnalyticsPeriod {
  start: string;
  end: string;
}

/** A single profile's contribution.
 *  The summary endpoint returns only { profileId, profileName, total }.
 *  The by-profile endpoint also returns `count`.
 *  `profileColor` and `percentage` are never returned by the server;
 *  the client computes/falls back as needed. */
export interface ProfileBreakdown {
  profileId: string;
  profileName: string;
  profileColor?: string;
  total: number;
  count?: number;
  percentage?: number;
}

/** GET /analytics/summary response data */
export interface SummaryData {
  totalSpent: number;
  byProfile: ProfileBreakdown[];
  period: AnalyticsPeriod;
}

/** A single category's analytics.
 *  The server returns { category, total, count }.
 *  `categoryName` etc. are derived on the client from the `category` field. */
export interface CategoryAnalytics {
  /** The category name string returned by the server (field is `category`). */
  category: string;
  total: number;
  count: number;
}

/** GET /analytics/by-category response data */
export interface ByCategoryData {
  categories: CategoryAnalytics[];
  totalSpent: number;
  period: AnalyticsPeriod;
}

/** GET /analytics/by-profile response data */
export interface ByProfileData {
  profiles: ProfileBreakdown[];
  totalSpent: number;
  period: AnalyticsPeriod;
}

/** A single month in the trends timeline */
export interface TrendMonth {
  year: number;
  month: number;
  total: number;
  count: number;
}

/** GET /analytics/trends response data */
export interface TrendsData {
  months: TrendMonth[];
  period: AnalyticsPeriod;
}

/** Generic wrapper for all analytics API responses */
export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
  };
}
