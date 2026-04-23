/**
 * Analytics service for API calls.
 *
 * Uses the shared `authedFetch` wrapper.
 */

import { API_CONFIG } from '../constants/api';
import { authedFetch } from '../lib/authedFetch';
import type {
  AnalyticsQueryParams,
  AnalyticsResponse,
  SummaryData,
  ByProfileData,
  ByCategoryData,
  TrendsData,
  BalanceData,
} from '../types/analytics';

class AnalyticsService {
  private buildQueryString(params?: AnalyticsQueryParams): string {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.profileId) searchParams.set('profileId', params.profileId);
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
  }

  /**
   * GET /analytics/summary
   */
  async getSummary(
    token: string,
    params?: AnalyticsQueryParams
  ): Promise<AnalyticsResponse<SummaryData>> {
    const endpoint = `${API_CONFIG.ENDPOINTS.ANALYTICS.SUMMARY}${this.buildQueryString(params)}`;
    return authedFetch<AnalyticsResponse<SummaryData>>(endpoint, {
      method: 'GET',
      token,
    });
  }

  /**
   * GET /analytics/by-profile
   */
  async getByProfile(
    token: string,
    params?: AnalyticsQueryParams
  ): Promise<AnalyticsResponse<ByProfileData>> {
    const endpoint = `${API_CONFIG.ENDPOINTS.ANALYTICS.BY_PROFILE}${this.buildQueryString(params)}`;
    return authedFetch<AnalyticsResponse<ByProfileData>>(endpoint, {
      method: 'GET',
      token,
    });
  }

  /**
   * GET /analytics/by-category
   */
  async getByCategory(
    token: string,
    params?: AnalyticsQueryParams
  ): Promise<AnalyticsResponse<ByCategoryData>> {
    const endpoint = `${API_CONFIG.ENDPOINTS.ANALYTICS.BY_CATEGORY}${this.buildQueryString(params)}`;
    return authedFetch<AnalyticsResponse<ByCategoryData>>(endpoint, {
      method: 'GET',
      token,
    });
  }

  /**
   * GET /analytics/trends
   */
  async getTrends(
    token: string,
    params?: AnalyticsQueryParams
  ): Promise<AnalyticsResponse<TrendsData>> {
    const endpoint = `${API_CONFIG.ENDPOINTS.ANALYTICS.TRENDS}${this.buildQueryString(params)}`;
    return authedFetch<AnalyticsResponse<TrendsData>>(endpoint, {
      method: 'GET',
      token,
    });
  }

  /**
   * GET /analytics/balance
   */
  async getBalance(
    token: string,
    params?: AnalyticsQueryParams
  ): Promise<AnalyticsResponse<BalanceData>> {
    const endpoint = `${API_CONFIG.ENDPOINTS.ANALYTICS.BALANCE}${this.buildQueryString(params)}`;
    return authedFetch<AnalyticsResponse<BalanceData>>(endpoint, {
      method: 'GET',
      token,
    });
  }
}

export const analyticsService = new AnalyticsService();
