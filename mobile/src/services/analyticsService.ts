/**
 * Analytics service for API calls
 */

import { API_CONFIG } from '../constants/api';
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
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = 15000 // 15 seconds default timeout
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestStartTime = Date.now();

    console.log('[AnalyticsService] Making HTTP request', {
      url,
      method: options.method || 'GET',
      endpoint,
      timeout: `${timeout}ms`,
      timestamp: new Date().toISOString(),
    });

    // Create AbortController for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[AnalyticsService] Request timeout', {
        url,
        timeout: `${timeout}ms`,
        timestamp: new Date().toISOString(),
      });
      abortController.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortController.signal,
        headers: {
          ...API_CONFIG.HEADERS,
          ...options.headers,
        },
      });

      // Clear timeout on successful response
      clearTimeout(timeoutId);

      const requestDuration = Date.now() - requestStartTime;
      console.log('[AnalyticsService] HTTP response received', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${requestDuration}ms`,
        timestamp: new Date().toISOString(),
      });

      // Handle 504 Gateway Timeout specifically
      if (response.status === 504) {
        clearTimeout(timeoutId);
        throw new Error('Gateway timeout: The server took too long to respond. Please try again.');
      }

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (parseErr) {
          console.error('[AnalyticsService] Error parsing error response', {
            url,
            status: response.status,
            error: parseErr,
            timestamp: new Date().toISOString(),
          });
        }

        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          const error = new Error(errorData.error?.message || errorData.message || 'Your session has expired. Please log in again.');
          (error as any).statusCode = 401;
          throw error;
        }

        let errorMessage = '';
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (response.status === 504) {
          errorMessage = 'Gateway timeout: The server took too long to respond. Please try again.';
        } else {
          errorMessage = `Request failed with status ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      // Parse successful response
      let jsonData: any;
      try {
        const responseText = await response.text();
        console.log('[AnalyticsService] Response text received', {
          url,
          textLength: responseText.length,
          preview: responseText.substring(0, 200),
          timestamp: new Date().toISOString(),
        });

        jsonData = responseText ? JSON.parse(responseText) : {};

        console.log('[AnalyticsService] Response parsed successfully', {
          url,
          hasSuccess: 'success' in jsonData,
          hasData: 'data' in jsonData,
          timestamp: new Date().toISOString(),
        });
      } catch (parseErr) {
        clearTimeout(timeoutId);
        console.error('[AnalyticsService] JSON parse error', {
          url,
          error: parseErr,
          timestamp: new Date().toISOString(),
        });
        throw new Error('Invalid response format from server');
      }

      return jsonData;
    } catch (err) {
      // Clear timeout if still active
      clearTimeout(timeoutId);

      const requestDuration = Date.now() - requestStartTime;
      console.error('[AnalyticsService] Request failed', {
        url,
        error: err,
        errorName: err instanceof Error ? err.name : 'Unknown',
        errorMessage: err instanceof Error ? err.message : String(err),
        duration: `${requestDuration}ms`,
        timestamp: new Date().toISOString(),
      });

      // Handle AbortError (timeout)
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timeout: The server took too long to respond. Please try again.');
      }

      // Handle network errors and other fetch failures
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      }

      if (err instanceof Error) {
        throw err;
      }

      throw new Error('An unexpected error occurred during the request');
    }
  }

  /**
   * Build query string from analytics params.
   */
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
   * Fetch spending summary with per-profile breakdown.
   */
  async getSummary(
    token: string,
    params?: AnalyticsQueryParams
  ): Promise<AnalyticsResponse<SummaryData>> {
    const endpoint = `${API_CONFIG.ENDPOINTS.ANALYTICS.SUMMARY}${this.buildQueryString(params)}`;

    return this.request<AnalyticsResponse<SummaryData>>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * GET /analytics/by-profile
   * Fetch expense analytics grouped by profile.
   */
  async getByProfile(
    token: string,
    params?: AnalyticsQueryParams
  ): Promise<AnalyticsResponse<ByProfileData>> {
    const endpoint = `${API_CONFIG.ENDPOINTS.ANALYTICS.BY_PROFILE}${this.buildQueryString(params)}`;

    return this.request<AnalyticsResponse<ByProfileData>>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * GET /analytics/by-category
   * Fetch expense analytics grouped by category.
   */
  async getByCategory(
    token: string,
    params?: AnalyticsQueryParams
  ): Promise<AnalyticsResponse<ByCategoryData>> {
    const endpoint = `${API_CONFIG.ENDPOINTS.ANALYTICS.BY_CATEGORY}${this.buildQueryString(params)}`;

    return this.request<AnalyticsResponse<ByCategoryData>>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * GET /analytics/trends
   * Fetch monthly spending trends over time.
   */
  async getTrends(
    token: string,
    params?: AnalyticsQueryParams
  ): Promise<AnalyticsResponse<TrendsData>> {
    const endpoint = `${API_CONFIG.ENDPOINTS.ANALYTICS.TRENDS}${this.buildQueryString(params)}`;

    return this.request<AnalyticsResponse<TrendsData>>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * GET /analytics/balance
   * Fetch balance analytics (totalIncome, totalExpenses, balance, spending rates).
   */
  async getBalance(
    token: string,
    params?: AnalyticsQueryParams
  ): Promise<AnalyticsResponse<BalanceData>> {
    const endpoint = `${API_CONFIG.ENDPOINTS.ANALYTICS.BALANCE}${this.buildQueryString(params)}`;

    return this.request<AnalyticsResponse<BalanceData>>(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const analyticsService = new AnalyticsService();
