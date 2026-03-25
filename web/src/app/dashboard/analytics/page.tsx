"use client";

import { useState, useEffect, useCallback } from "react";
import {
  analyticsApi,
  type SummaryData,
  type ByProfileData,
  type ByCategoryData,
  type TrendsData,
  type AnalyticsQueryParams,
} from "@/lib/api/analytics";
import { profilesApi } from "@/lib/api/profiles";
import type { Profile } from "@/types/profile";
import { getCategoryEmoji } from "@/constants/categories";
import { formatCurrency } from "@/utils/currency";
import DateRangePicker from "@/components/DateRangePicker";
import styles from "./page.module.css";

/* Fallback palette when a profile has no saved color */
const PROFILE_COLORS = [
  "#D81B60", "#1E88E5", "#43A047", "#FB8C00",
  "#8E24AA", "#00ACC1", "#E53935", "#3949AB",
];

const CATEGORY_COLORS = [
  "#D81B60", "#1E88E5", "#43A047", "#FB8C00",
  "#8E24AA", "#00ACC1", "#E53935", "#3949AB",
  "#F4511E", "#6D4C41", "#546E7A", "#00897B",
  "#7CB342", "#C0CA33", "#FFB300", "#5E35B1",
  "#EC407A",
];

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function AnalyticsPage() {
  /* Date range state — DateRangePicker drives this */
  const [dateStart, setDateStart] = useState<string | undefined>(undefined);
  const [dateEnd, setDateEnd] = useState<string | undefined>(undefined);

  /* Data state */
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [profileData, setProfileData] = useState<ByProfileData | null>(null);
  const [categoryData, setCategoryData] = useState<ByCategoryData | null>(null);
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});

  /* Independent loading states per section */
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);

  // Swallow errors — session-expired redirect is handled centrally by api-client
  const swallowError = useCallback(() => null, []);

  /* Fetch profiles once (for colors) */
  useEffect(() => {
    profilesApi
      .getProfiles()
      .then((res) => {
        const map: Record<string, Profile> = {};
        res.profiles.forEach((p) => {
          map[p._id] = p;
        });
        setProfilesMap(map);
      })
      .catch(() => {});
  }, []);

  /* Fetch all 4 analytics endpoints when date range changes */
  const fetchAnalytics = useCallback(() => {
    const params: AnalyticsQueryParams = {};
    if (dateStart) params.startDate = dateStart;
    if (dateEnd) params.endDate = dateEnd;

    setLoadingSummary(true);
    setLoadingProfiles(true);
    setLoadingCategories(true);
    setLoadingTrends(true);

    analyticsApi
      .summary(params)
      .then((res) => setSummary(res))
      .catch(swallowError)
      .finally(() => setLoadingSummary(false));

    analyticsApi
      .byProfile(params)
      .then((res) => setProfileData(res))
      .catch(swallowError)
      .finally(() => setLoadingProfiles(false));

    analyticsApi
      .byCategory(params)
      .then((res) => setCategoryData(res))
      .catch(swallowError)
      .finally(() => setLoadingCategories(false));

    analyticsApi
      .trends(params)
      .then((res) => setTrendsData(res))
      .catch(swallowError)
      .finally(() => setLoadingTrends(false));
  }, [dateStart, dateEnd, swallowError]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  /* --- Derived values --- */
  const totalExpenses = categoryData
    ? categoryData.categories.reduce((sum, c) => sum + c.count, 0)
    : profileData
      ? profileData.profiles.reduce((sum, p) => sum + p.count, 0)
      : 0;

  const totalSpent = summary?.totalSpent ?? profileData?.totalSpent ?? 0;
  const avgPerExpense = totalExpenses > 0 ? totalSpent / totalExpenses : 0;

  const periodLabel = summary
    ? `${formatPeriodDate(summary.period.start)} - ${formatPeriodDate(summary.period.end)}`
    : "This month";

  /* Profile bars */
  const profileBars = (profileData?.profiles ?? [])
    .slice()
    .sort((a, b) => b.total - a.total);
  const profileMax = profileBars.length > 0 ? profileBars[0].total : 1;
  const profileTotal = profileData?.totalSpent ?? totalSpent;

  /* Category bars */
  const categoryBars = (categoryData?.categories ?? [])
    .slice()
    .sort((a, b) => b.total - a.total);
  const categoryMax = categoryBars.length > 0 ? categoryBars[0].total : 1;
  const categoryTotal = categoryData?.totalSpent ?? totalSpent;

  /* Trend bars - last 6 months */
  const trendBars = (trendsData?.months ?? []).slice(-6);
  const trendMax =
    trendBars.length > 0
      ? Math.max(...trendBars.map((m) => m.total))
      : 1;

  function getProfileColor(profileId: string, index: number): string {
    const profile = profilesMap[profileId];
    if (profile?.color) return profile.color;
    return PROFILE_COLORS[index % PROFILE_COLORS.length];
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <h1 className={styles.pageTitle}>Analytics</h1>
          <span className={styles.periodBadge}>
            <span className={styles.periodIcon}>&#128197;</span>
            {periodLabel}
          </span>
        </div>
      </div>

      {/* Date range picker */}
      <div className={styles.datePickerSection}>
        <DateRangePicker
          onChange={(startDate, endDate) => {
            setDateStart(startDate);
            setDateEnd(endDate);
          }}
        />
      </div>

      {/* Section 1: Summary Cards */}
      <div className={styles.cardsGrid}>
        {loadingSummary ? (
          <>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
          </>
        ) : (
          <>
            {/* Total Spent */}
            <div className={styles.card}>
              <div className={`${styles.cardIcon} ${styles.cardIconSpent}`}>
                &#128176;
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardLabel}>Total Spent</p>
                <p className={styles.cardValue}>
                  {formatCurrency(totalSpent)}
                </p>
                <p className={styles.cardSub}>{periodLabel}</p>
              </div>
            </div>

            {/* Total Expenses */}
            <div className={styles.card}>
              <div className={`${styles.cardIcon} ${styles.cardIconProfile}`}>
                &#128203;
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardLabel}>Total Expenses</p>
                <p className={styles.cardValue}>
                  {totalExpenses.toLocaleString("en-IN")}
                </p>
                <p className={styles.cardSub}>
                  {totalExpenses === 1 ? "transaction" : "transactions"}
                </p>
              </div>
            </div>

            {/* Average per Expense */}
            <div className={styles.card}>
              <div className={`${styles.cardIcon} ${styles.cardIconCategory}`}>
                &#128200;
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardLabel}>Average / Expense</p>
                <p className={styles.cardValue}>
                  {formatCurrency(Math.round(avgPerExpense))}
                </p>
                <p className={styles.cardSub}>per transaction</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Section 2: Spending by Profile */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Spending by Profile</h2>
        {loadingProfiles ? (
          <BarsSkeleton />
        ) : profileBars.length === 0 ? (
          <EmptyState message="No profile spending data for this period." />
        ) : (
          <div className={styles.barsContainer}>
            {profileBars.map((p, i) => {
              const pct =
                profileTotal > 0
                  ? Math.round((p.total / profileTotal) * 100)
                  : 0;
              const barWidth =
                profileMax > 0
                  ? Math.max((p.total / profileMax) * 100, 2)
                  : 0;
              const color = getProfileColor(p.profileId, i);
              return (
                <div key={p.profileId} className={styles.barRow}>
                  <span className={styles.barLabel}>{p.profileName}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span className={styles.barAmount}>
                    {formatCurrency(p.total)}
                  </span>
                  <span className={styles.barPct}>{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 3: Spending by Category */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Spending by Category</h2>
        {loadingCategories ? (
          <BarsSkeleton />
        ) : categoryBars.length === 0 ? (
          <EmptyState message="No category spending data for this period." />
        ) : (
          <div className={styles.barsContainer}>
            {categoryBars.map((c, i) => {
              const pct =
                categoryTotal > 0
                  ? Math.round((c.total / categoryTotal) * 100)
                  : 0;
              const barWidth =
                categoryMax > 0
                  ? Math.max((c.total / categoryMax) * 100, 2)
                  : 0;
              const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              return (
                <div key={c.category} className={styles.barRow}>
                  <span className={styles.barLabel}>
                    <span className={styles.barEmoji}>
                      {getCategoryEmoji(c.category)}
                    </span>
                    {c.category}
                  </span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span className={styles.barAmount}>
                    {formatCurrency(c.total)}
                  </span>
                  <span className={styles.barPct}>
                    {c.count} {c.count === 1 ? "exp" : "exps"} &middot; {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 4: Monthly Trends */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Monthly Trends</h2>
        {loadingTrends ? (
          <BarsSkeleton />
        ) : trendBars.length === 0 ? (
          <EmptyState message="No trend data available yet." />
        ) : (
          <div className={styles.trendsChart}>
            {trendBars.map((m) => {
              const barHeight =
                trendMax > 0
                  ? Math.max((m.total / trendMax) * 100, 3)
                  : 0;
              return (
                <div
                  key={`${m.year}-${m.month}`}
                  className={styles.trendCol}
                >
                  <span className={styles.trendAmount}>
                    {abbreviateAmount(m.total)}
                  </span>
                  <div className={styles.trendBarWrapper}>
                    <div
                      className={styles.trendBarFill}
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                  <span className={styles.trendLabel}>
                    {MONTH_NAMES[m.month - 1]} {String(m.year).slice(-2)}
                  </span>
                  <span className={styles.trendCount}>
                    {m.count} {m.count === 1 ? "exp" : "exps"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Helper components ---- */

function BarsSkeleton() {
  return (
    <div className={styles.barsContainer}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.skeletonBar} />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className={styles.emptyState}>
      <p>{message}</p>
    </div>
  );
}

/* ---- Utility functions ---- */

function formatPeriodDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function abbreviateAmount(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatCurrency(amount);
}
