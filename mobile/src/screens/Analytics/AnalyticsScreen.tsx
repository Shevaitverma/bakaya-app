/**
 * Analytics Screen - Full analytics dashboard with spending insights.
 *
 * Sections:
 *   1. Summary cards (monthly spend, total count, avg daily)
 *   2. Spending by Profile (horizontal bar chart)
 *   3. Spending by Category (horizontal bar chart)
 *   4. Monthly Trends (vertical bar chart)
 *
 * Each section loads independently so one failure does not block the others.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { analyticsService } from '../../services/analyticsService';
import { formatCurrency, formatCurrencyAbbreviated } from '../../utils/currency';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import VerticalBarChart from '../../components/charts/VerticalBarChart';

import type {
  SummaryData,
  ByProfileData,
  ByCategoryData,
  TrendsData,
  AnalyticsQueryParams,
} from '../../types/analytics';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const PROFILE_COLORS = [
  '#D81B60', '#1E88E5', '#43A047', '#FB8C00',
  '#8E24AA', '#00ACC1', '#E53935', '#3949AB',
];

const CATEGORY_COLORS = [
  '#D81B60', '#1E88E5', '#43A047', '#FB8C00',
  '#8E24AA', '#00ACC1', '#E53935', '#3949AB',
  '#5E35B1', '#00897B', '#F4511E', '#6D4C41',
];

// ---------------------------------------------------------------------------
// Date filter presets (inline chips — replaces DateRangePicker modal)
// ---------------------------------------------------------------------------

type DatePreset = 'this_month' | 'last_month' | 'last_3_months' | 'half_year' | 'all';

interface DateRange {
  startDate: string | undefined;
  endDate: string | undefined;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function computeRange(preset: DatePreset): DateRange {
  const today = new Date();
  switch (preset) {
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: toISODate(start), endDate: toISODate(today) };
    }
    case 'last_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: toISODate(start), endDate: toISODate(end) };
    }
    case 'last_3_months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return { startDate: toISODate(start), endDate: toISODate(today) };
    }
    case 'half_year': {
      const start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      return { startDate: toISODate(start), endDate: toISODate(today) };
    }
    case 'all':
      return { startDate: '2020-01-01', endDate: toISODate(today) };
    default:
      return { startDate: undefined, endDate: undefined };
  }
}

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'last_3_months', label: 'Last 3 Months' },
  { key: 'half_year', label: 'Half Year' },
  { key: 'all', label: 'All' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AnalyticsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { accessToken, refreshSession, logout } = useAuth();

  // --- Date range ---
  const [activePreset, setActivePreset] = useState<DatePreset>('this_month');
  const [startDate, setStartDate] = useState<string | undefined>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  });
  const [endDate, setEndDate] = useState<string | undefined>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // --- Data ---
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [profileData, setProfileData] = useState<ByProfileData | null>(null);
  const [categoryData, setCategoryData] = useState<ByCategoryData | null>(null);
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);

  // --- Independent loading states ---
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const lastFetchTime = useRef<number>(0);

  // ------------------------------------------------------------------
  // Data fetching
  // ------------------------------------------------------------------

  const fetchAllData = useCallback(async () => {
    if (!accessToken) return;
    if (Date.now() - lastFetchTime.current < 30000) return;

    const params: AnalyticsQueryParams = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    setLoadingSummary(true);
    setLoadingProfiles(true);
    setLoadingCategories(true);
    setLoadingTrends(true);

    const fetchSummary = async () => {
      try {
        const res = await analyticsService.getSummary(accessToken, params);
        if (res.success && res.data) setSummary(res.data);
      } catch (err: any) {
        if (err?.statusCode === 401) throw err;
        console.error('[Analytics] Error fetching summary:', err);
      } finally {
        setLoadingSummary(false);
      }
    };

    const fetchProfiles = async () => {
      try {
        const res = await analyticsService.getByProfile(accessToken, params);
        if (res.success && res.data) setProfileData(res.data);
      } catch (err: any) {
        if (err?.statusCode === 401) throw err;
        console.error('[Analytics] Error fetching profiles:', err);
      } finally {
        setLoadingProfiles(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await analyticsService.getByCategory(accessToken, params);
        if (res.success && res.data) setCategoryData(res.data);
      } catch (err: any) {
        if (err?.statusCode === 401) throw err;
        console.error('[Analytics] Error fetching categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    const fetchTrends = async () => {
      try {
        const res = await analyticsService.getTrends(accessToken, params);
        if (res.success && res.data) setTrendsData(res.data);
      } catch (err: any) {
        if (err?.statusCode === 401) throw err;
        console.error('[Analytics] Error fetching trends:', err);
      } finally {
        setLoadingTrends(false);
      }
    };

    const results = await Promise.allSettled([
      fetchSummary(),
      fetchProfiles(),
      fetchCategories(),
      fetchTrends(),
    ]);

    // Check if any fetch threw a 401 (session expired)
    const has401 = results.some(
      (r) => r.status === 'rejected' && (r.reason as any)?.statusCode === 401,
    );
    if (has401) {
      const refreshed = await refreshSession();
      if (!refreshed) {
        await logout();
      }
    } else {
      lastFetchTime.current = Date.now();
    }
  }, [accessToken, startDate, endDate, refreshSession, logout]);

  // Fetch on focus
  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData]),
  );

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    lastFetchTime.current = 0;
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  // Date filter chip handler
  const handlePresetPress = useCallback((preset: DatePreset) => {
    setActivePreset(preset);
    const range = computeRange(preset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    lastFetchTime.current = 0;
  }, []);

  // ------------------------------------------------------------------
  // Derived / computed values
  // ------------------------------------------------------------------

  const totalSpent = summary?.totalSpent ?? profileData?.totalSpent ?? 0;

  const totalCount = useMemo(() => {
    if (categoryData) {
      return categoryData.categories.reduce((sum, c) => sum + (c.count ?? 0), 0);
    }
    if (profileData) {
      return profileData.profiles.reduce((sum, p) => sum + (p.count ?? 0), 0);
    }
    return 0;
  }, [categoryData, profileData]);

  // Change % from trends (compare last two months)
  const changePercent = useMemo(() => {
    if (!trendsData || trendsData.months.length < 2) return null;
    const months = trendsData.months;
    const current = months[months.length - 1]!;
    const previous = months[months.length - 2]!;
    if (previous.total === 0) return null;
    return Math.round(
      ((current.total - previous.total) / previous.total) * 100,
    );
  }, [trendsData]);

  // Average daily spend
  const avgDaily = useMemo(() => {
    if (!summary) return 0;
    const start = new Date(summary.period.start + 'T00:00:00');
    const end = new Date(summary.period.end + 'T00:00:00');
    const days = Math.max(
      1,
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );
    return Math.round(totalSpent / days);
  }, [summary, totalSpent]);

  // Budget status text for avg daily card
  const avgDailyBudgetStatus = useMemo(() => {
    if (changePercent !== null && changePercent > 0) {
      return { text: 'Over budget', color: Theme.colors.error };
    }
    return { text: 'Within budget', color: Theme.colors.success };
  }, [changePercent]);

  // Profile chart data
  const profileBars = useMemo(() => {
    const sorted = [...(profileData?.profiles ?? [])].sort(
      (a, b) => b.total - a.total,
    );
    const total = profileData?.totalSpent ?? totalSpent;
    return sorted.map((p, i) => ({
      label: p.profileName,
      value: p.total,
      color: p.profileColor || PROFILE_COLORS[i % PROFILE_COLORS.length]!,
      percentage:
        total > 0 ? Math.round((p.total / total) * 100) : 0,
    }));
  }, [profileData, totalSpent]);

  // Category chart data
  const categoryBars = useMemo(() => {
    const sorted = [...(categoryData?.categories ?? [])].sort(
      (a, b) => b.total - a.total,
    );
    const catTotal = categoryData?.totalSpent ?? totalSpent;
    return sorted.map((c, i) => ({
      label: c.category ?? 'Uncategorized',
      value: c.total,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]!,
      percentage: catTotal > 0 ? Math.round((c.total / catTotal) * 100) : 0,
    }));
  }, [categoryData, totalSpent]);

  // Trend chart data (last 6 months)
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const trendBars = useMemo(() => {
    const months = (trendsData?.months ?? []).slice(-6);
    return months.map((m) => ({
      label: MONTH_NAMES[m.month - 1]!,
      value: m.total,
      color: Theme.colors.primary,
      isHighlighted: m.month === currentMonth && m.year === currentYear,
    }));
  }, [trendsData, currentMonth, currentYear]);

  // ------------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------------

  const renderDateChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsContainer}
      style={styles.chipsScroll}
    >
      {DATE_PRESETS.map(({ key, label }) => {
        const isActive = activePreset === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => handlePresetPress(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderSummaryCards = () => {
    if (loadingSummary && loadingTrends) {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryCardsContainer}
          style={styles.summaryCardsScroll}
        >
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.summaryCard}>
              <SkeletonLoader width={40} height={40} borderRadius={20} style={{ marginBottom: 10 }} />
              <SkeletonLoader width="80%" height={10} borderRadius={4} style={{ marginBottom: 8 }} />
              <SkeletonLoader width="60%" height={22} borderRadius={4} style={{ marginBottom: 8 }} />
              <SkeletonLoader width="70%" height={10} borderRadius={4} />
            </View>
          ))}
        </ScrollView>
      );
    }

    const isChangePositive = changePercent !== null && changePercent >= 0;
    const changeColor = changePercent !== null
      ? (isChangePositive ? Theme.colors.error : Theme.colors.success)
      : Theme.colors.success;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.summaryCardsContainer}
        style={styles.summaryCardsScroll}
      >
        {/* Monthly Spend */}
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIconCircle, { backgroundColor: 'rgba(216, 27, 96, 0.12)' }]}>
            <FontAwesome6 name="wallet" size={16} color={Theme.colors.primary} solid />
          </View>
          <Text style={styles.summaryLabel}>MONTHLY SPEND</Text>
          <Text style={[styles.summaryValue, { color: Theme.colors.error }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(totalSpent)}
          </Text>
          <Text style={[styles.summarySubtext, { color: changeColor }]} numberOfLines={1}>
            {changePercent !== null
              ? `${Math.abs(changePercent)}% from last month`
              : 'Current period total'}
          </Text>
        </View>

        {/* Total Count */}
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
            <FontAwesome6 name="receipt" size={16} color={Theme.colors.blue} solid />
          </View>
          <Text style={styles.summaryLabel}>TOTAL COUNT</Text>
          <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
            {totalCount.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.summarySubtext, { color: Theme.colors.blue }]} numberOfLines={1}>
            Recorded transactions
          </Text>
        </View>

        {/* Average Daily */}
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIconCircle, { backgroundColor: 'rgba(142, 36, 170, 0.12)' }]}>
            <FontAwesome6 name="chart-simple" size={16} color="#8E24AA" solid />
          </View>
          <Text style={styles.summaryLabel}>AVG DAILY</Text>
          <Text style={[styles.summaryValue, { color: Theme.colors.error }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(avgDaily)}
          </Text>
          <Text style={[styles.summarySubtext, { color: avgDailyBudgetStatus.color }]} numberOfLines={1}>
            {avgDailyBudgetStatus.text}
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderProfileSection = () => {
    const maxVal = profileBars.length > 0 ? Math.max(...profileBars.map((b) => b.value)) : 1;

    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <Text style={styles.sectionCardTitle}>Spending by Profile</Text>
          <FontAwesome6 name="users" size={14} color={Theme.colors.textTertiary} solid />
        </View>
        {loadingProfiles ? (
          <View style={styles.skeletonRows}>
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} width="100%" height={48} borderRadius={8} style={{ marginBottom: 12 }} />
            ))}
          </View>
        ) : profileBars.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No spending data for this period</Text>
          </View>
        ) : (
          <View style={styles.barListContainer}>
            {profileBars.map((item, index) => (
              <View key={`profile-${index}`} style={styles.barRow}>
                <View style={styles.barRowTop}>
                  <View style={styles.barLabelRow}>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
                  </View>
                  <View style={styles.barValueRow}>
                    <Text style={[styles.barValue, { color: Theme.colors.error }]}>{formatCurrency(item.value)}</Text>
                    <Text style={styles.barPercent}>{item.percentage}%</Text>
                  </View>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: item.color,
                        width: maxVal > 0 ? `${Math.max((item.value / maxVal) * 100, 2)}%` : '2%',
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderCategorySection = () => {
    const maxVal = categoryBars.length > 0 ? Math.max(...categoryBars.map((b) => b.value)) : 1;

    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <Text style={styles.sectionCardTitle}>Spending by Category</Text>
          <FontAwesome6 name="grid-2" size={14} color={Theme.colors.textTertiary} solid />
        </View>
        {loadingCategories ? (
          <View style={styles.skeletonRows}>
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} width="100%" height={48} borderRadius={8} style={{ marginBottom: 12 }} />
            ))}
          </View>
        ) : categoryBars.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No spending data for this period</Text>
          </View>
        ) : (
          <View style={styles.barListContainer}>
            {categoryBars.map((item, index) => (
              <View key={`cat-${index}`} style={styles.barRow}>
                <View style={styles.barRowTop}>
                  <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
                  <Text style={[styles.barValue, { color: Theme.colors.error }]}>
                    {formatCurrency(item.value)}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: item.color,
                        width: maxVal > 0 ? `${Math.max((item.value / maxVal) * 100, 2)}%` : '2%',
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTrendsSection = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionCardHeader}>
        <View>
          <Text style={styles.sectionCardTitle}>Monthly Trends</Text>
          <Text style={styles.sectionCardSubtitle}>Last 6 months expense comparison</Text>
        </View>
        <View style={styles.trendLegend}>
          <View style={styles.trendLegendDot} />
          <Text style={styles.trendLegendText}>Expense</Text>
        </View>
      </View>
      {loadingTrends ? (
        <SkeletonLoader width="100%" height={200} borderRadius={12} />
      ) : (
        <VerticalBarChart
          data={trendBars}
          height={220}
          formatValue={formatCurrencyAbbreviated}
          emptyMessage="No trend data available"
        />
      )}
    </View>
  );

  // ------------------------------------------------------------------
  // Main render
  // ------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Theme.spacing.md }]}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Review your spending patterns and budgets.</Text>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Theme.colors.primary]}
              tintColor={Theme.colors.primary}
            />
          }
        >
          {/* Date Filter Chips */}
          {renderDateChips()}

          {/* Summary Cards */}
          {renderSummaryCards()}

          {/* Spending by Profile */}
          {renderProfileSection()}

          {/* Spending by Category */}
          {renderCategorySection()}

          {/* Monthly Trends */}
          {renderTrendsSection()}

          {/* Bottom spacing */}
          <View style={{ height: Theme.spacing.xxl }} />
        </ScrollView>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },

  // --- Header ---
  header: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.lg,
    backgroundColor: Theme.colors.primary,
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.display,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textOnPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    opacity: 0.75,
    marginTop: Theme.spacing.xs,
  },

  // --- Content wrapper ---
  contentWrapper: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingTop: Theme.spacing.md,
  },

  // --- Date Filter Chips ---
  chipsScroll: {
    marginBottom: Theme.spacing.md,
  },
  chipsContainer: {
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.lightGrey,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: 'rgba(216, 27, 96, 0.08)',
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },
  chipTextActive: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.fontWeight.semibold,
  },

  // --- Summary Cards (horizontal scroll) ---
  summaryCardsScroll: {
    marginBottom: Theme.spacing.md,
  },
  summaryCardsContainer: {
    paddingHorizontal: Theme.spacing.md,
    flexDirection: 'row',
  },
  summaryCard: {
    width: 155,
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: Theme.spacing.sm,
    ...Theme.shadows.small,
  },
  summaryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 9,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: Theme.typography.fontSize.xlarge,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  summarySubtext: {
    fontSize: 10,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    textAlign: 'center',
  },

  // --- Section Cards ---
  sectionCard: {
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Theme.shadows.small,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  sectionCardTitle: {
    fontSize: Theme.typography.fontSize.large,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  sectionCardSubtitle: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
    marginTop: 2,
  },

  // --- Bar list (Profile & Category sections) ---
  barListContainer: {
    gap: Theme.spacing.md,
  },
  barRow: {
    gap: Theme.spacing.xs + 2,
  },
  barRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: Theme.borderRadius.round,
  },
  barLabel: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    flex: 1,
  },
  barValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  barValue: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.semibold,
  },
  barPercent: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
    minWidth: 32,
    textAlign: 'right',
  },
  barTrack: {
    height: 8,
    backgroundColor: Theme.colors.lightGrey,
    borderRadius: Theme.borderRadius.round,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Theme.borderRadius.round,
  },

  // --- Trend legend ---
  trendLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  trendLegendDot: {
    width: 8,
    height: 8,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Theme.colors.primary,
  },
  trendLegendText: {
    fontSize: Theme.typography.fontSize.small,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.medium,
  },

  // --- Empty state ---
  emptyState: {
    paddingVertical: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: Theme.typography.fontSize.medium,
    color: Theme.colors.textTertiary,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: Theme.typography.fontWeight.regular,
  },

  // --- Skeleton loading rows ---
  skeletonRows: {
    gap: 0,
  },
});

export default AnalyticsScreen;
