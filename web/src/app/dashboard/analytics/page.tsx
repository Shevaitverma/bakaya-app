"use client";

import { useState, useMemo } from "react";
import type { AnalyticsQueryParams } from "@/lib/api/analytics";
import type { Profile } from "@/types/profile";
import { useProfiles } from "@/lib/queries/useProfiles";
import { useCategoriesMap } from "@/lib/queries/useCategories";
import {
  useSummary,
  useByProfile,
  useByCategory,
  useTrends,
} from "@/lib/queries/useAnalytics";
import { formatCurrency } from "@/utils/currency";
import styles from "./page.module.css";

/* Date filter chip definitions */
type DateFilter = "this_month" | "last_month" | "last_3_months" | "half_year" | "all";

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "last_3_months", label: "Last 3 Months" },
  { key: "half_year", label: "Half Year" },
  { key: "all", label: "All" },
];

function getDateRange(filter: DateFilter): AnalyticsQueryParams {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed

  const fmt = (d: Date) => {
    const dy = d.getFullYear();
    const dm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${dy}-${dm}-${dd}`;
  };

  switch (filter) {
    case "this_month":
      return { startDate: fmt(new Date(y, m, 1)), endDate: fmt(now) };
    case "last_month":
      return { startDate: fmt(new Date(y, m - 1, 1)), endDate: fmt(new Date(y, m, 0)) };
    case "last_3_months":
      return { startDate: fmt(new Date(y, m - 2, 1)), endDate: fmt(now) };
    case "half_year":
      return { startDate: fmt(new Date(y, m - 5, 1)), endDate: fmt(now) };
    case "all":
      return { startDate: "2020-01-01", endDate: fmt(now) };
  }
}

/* Fallback palette when a profile has no saved color */
const PROFILE_COLORS = [
  "#D81B60", "#1E88E5", "#43A047", "#FB8C00",
  "#8E24AA", "#00ACC1", "#E53935", "#3949AB",
];

const CATEGORY_COLORS: Record<string, string> = {
  Healthcare: "#3B82F6",
  Food: "#FB8C00",
  Shopping: "#E53935",
  Transport: "#8E24AA",
  Entertainment: "#00ACC1",
  Education: "#43A047",
  Utilities: "#546E7A",
  Rent: "#6D4C41",
};

const CATEGORY_COLORS_FALLBACK = [
  "#3B82F6", "#FB8C00", "#E53935", "#8E24AA",
  "#00ACC1", "#43A047", "#546E7A", "#6D4C41",
  "#F4511E", "#7CB342", "#C0CA33", "#FFB300",
  "#5E35B1", "#EC407A", "#D81B60", "#1E88E5",
];

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function AnalyticsPage() {
  /* Date filter chip state */
  const [activeFilter, setActiveFilter] = useState<DateFilter>("this_month");

  /* Query params derived from active filter */
  const params = useMemo(() => getDateRange(activeFilter), [activeFilter]);

  /* Profiles & categories (for colors) — cached globally by TanStack Query */
  const { data: profiles } = useProfiles();
  const { data: categoriesMap } = useCategoriesMap();

  const profilesMap = useMemo(() => {
    const map: Record<string, Profile> = {};
    for (const p of profiles ?? []) {
      map[p._id] = p;
    }
    return map;
  }, [profiles]);

  /* Analytics queries — each keyed by params so filter switches cache automatically */
  const { data: summary, isLoading: loadingSummary } = useSummary(params);
  const { data: profileData, isLoading: loadingProfiles } = useByProfile(params);
  const { data: categoryData, isLoading: loadingCategories } = useByCategory(params);
  const { data: trendsData, isLoading: loadingTrends } = useTrends(params);

  /* --- Derived values --- */
  const totalExpenses = categoryData
    ? categoryData.categories.reduce((sum, c) => sum + c.count, 0)
    : profileData
      ? profileData.profiles.reduce((sum, p) => sum + p.count, 0)
      : 0;

  const totalSpent = summary?.totalSpent ?? profileData?.totalSpent ?? 0;

  /* Compute change % from trends (compare last two months) */
  const changePercent = useMemo(() => {
    if (!trendsData || trendsData.months.length < 2) return null;
    const months = trendsData.months;
    const current = months[months.length - 1]!;
    const previous = months[months.length - 2]!;
    if (previous.total === 0) return null;
    return Math.round(((current.total - previous.total) / previous.total) * 100);
  }, [trendsData]);

  /* Compute average daily spend */
  const avgDaily = useMemo(() => {
    if (!summary) return 0;
    const start = new Date(summary.period.start + "T00:00:00");
    const end = new Date(summary.period.end + "T00:00:00");
    const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return Math.round(totalSpent / days);
  }, [summary, totalSpent]);

  /* Profile bars */
  const profileBars = (profileData?.profiles ?? [])
    .slice()
    .sort((a, b) => b.total - a.total);
  const profileMax = profileBars.length > 0 ? profileBars[0]!.total : 1;
  const profileTotal = profileData?.totalSpent ?? totalSpent;

  /* Category bars */
  const categoryBars = (categoryData?.categories ?? [])
    .slice()
    .sort((a, b) => b.total - a.total);
  const categoryMax = categoryBars.length > 0 ? categoryBars[0]!.total : 1;

  /* Trend bars - last 6 months */
  const trendBars = (trendsData?.months ?? []).slice(-6);
  const trendMax =
    trendBars.length > 0
      ? Math.max(...trendBars.map((m) => m.total))
      : 1;

  /* Current month for highlighting in trend chart */
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  function getProfileColor(profileId: string, index: number): string {
    const profile = profilesMap[profileId];
    if (profile?.color) return profile.color;
    return PROFILE_COLORS[index % PROFILE_COLORS.length]!;
  }

  function getCategoryColor(categoryName: string, index: number): string {
    const cat = categoriesMap?.[categoryName];
    if (cat?.color) return cat.color;
    if (CATEGORY_COLORS[categoryName]) return CATEGORY_COLORS[categoryName]!;
    return CATEGORY_COLORS_FALLBACK[index % CATEGORY_COLORS_FALLBACK.length]!;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Analytics</h1>
      </div>

      <div className={styles.contentSheet}>
      {/* Date Filter Chips */}
      <div className={styles.chipRow}>
        {DATE_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`${styles.chip} ${activeFilter === f.key ? styles.chipActive : ""}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Section 1: Summary Cards — key forces re-mount animation on filter change */}
      <div className={styles.cardsRow} key={`cards-${activeFilter}`}>
        {loadingSummary ? (
          <>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
          </>
        ) : (
          <>
            {/* Monthly Spend */}
            <div className={styles.card}>
              <div className={`${styles.cardIconCircle} ${styles.cardIconPink}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E91E63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
                </svg>
              </div>
              <span className={styles.cardLabel}>MONTHLY SPEND</span>
              <p className={styles.cardValueRed}>
                {formatCurrency(totalSpent)}
              </p>
              <p className={styles.cardStatusGreen}>
                {changePercent !== null ? (
                  <>
                    {changePercent >= 0 ? "\u2197" : "\u2198"}{" "}
                    {Math.abs(changePercent)}% from last month
                  </>
                ) : (
                  "Current period total"
                )}
              </p>
            </div>

            {/* Total Count */}
            <div className={styles.card}>
              <div className={`${styles.cardIconCircle} ${styles.cardIconBlue}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <span className={styles.cardLabel}>TOTAL COUNT</span>
              <p className={styles.cardValueDark}>
                {totalExpenses.toLocaleString("en-IN")}
              </p>
              <p className={styles.cardStatusBlue}>
                Recorded transactions
              </p>
            </div>

            {/* Average Daily */}
            <div className={styles.card}>
              <div className={`${styles.cardIconCircle} ${styles.cardIconPurple}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8E24AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <span className={styles.cardLabel}>AVG DAILY</span>
              <p className={styles.cardValueRed}>
                {formatCurrency(avgDaily)}
              </p>
              <p className={styles.cardStatusGreen}>
                Within budget
              </p>
            </div>
          </>
        )}
      </div>

      {/* Section 2: Spending by Profile & Category (side by side) */}
      <div className={styles.twoColGrid} key={`charts-${activeFilter}`}>
        {/* Spending by Profile */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Spending by Profile</h2>
            <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          {loadingProfiles ? (
            <BarsSkeleton />
          ) : profileBars.length === 0 ? (
            <EmptyState message="No profile spending data for this period." />
          ) : (
            <div className={styles.profileList}>
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
                  <div key={p.profileId} className={styles.profileItem}>
                    <div className={styles.profileRow}>
                      <div className={styles.profileNameGroup}>
                        <span
                          className={styles.profileDot}
                          style={{ backgroundColor: color }}
                        />
                        <span className={styles.profileName}>
                          {p.profileName}
                        </span>
                      </div>
                      <div className={styles.profileValues}>
                        <span className={styles.profileAmountRed}>
                          {formatCurrency(p.total)}
                        </span>
                        <span className={styles.profilePct}>{pct}%</span>
                      </div>
                    </div>
                    <div className={styles.thinBarTrack}>
                      <div
                        className={styles.thinBarFill}
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Spending by Category */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Spending by Category</h2>
            <svg className={styles.sectionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          {loadingCategories ? (
            <BarsSkeleton />
          ) : categoryBars.length === 0 ? (
            <EmptyState message="No category spending data for this period." />
          ) : (
            <div className={styles.profileList}>
              {categoryBars.map((c, i) => {
                const barWidth =
                  categoryMax > 0
                    ? Math.max((c.total / categoryMax) * 100, 2)
                    : 0;
                const color = getCategoryColor(c.category, i);
                return (
                  <div key={c.category} className={styles.profileItem}>
                    <div className={styles.profileRow}>
                      <span className={styles.categoryName}>
                        {c.category}
                      </span>
                      <span className={styles.categoryAmount}>
                        {formatCurrency(c.total)}
                      </span>
                    </div>
                    <div className={styles.thinBarTrack}>
                      <div
                        className={styles.thinBarFill}
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Monthly Trends */}
      <div className={styles.section} key={`trends-${activeFilter}`}>
        <div className={styles.trendsHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Monthly Trends</h2>
            <p className={styles.trendsSubtitle}>
              Last 6 months expense comparison
            </p>
          </div>
          <div className={styles.trendsLegend}>
            <span className={styles.legendDot} />
            <span className={styles.legendLabel}>Expense</span>
          </div>
        </div>
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
              const isCurrent =
                m.month === currentMonth && m.year === currentYear;
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
                  <span
                    className={`${styles.trendLabel} ${isCurrent ? styles.trendLabelActive : ""}`}
                  >
                    {MONTH_NAMES[m.month - 1]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

/* ---- Helper components ---- */

function BarsSkeleton() {
  return (
    <div className={styles.profileList}>
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

function abbreviateAmount(amount: number): string {
  if (amount >= 100000) return `\u20B9${parseFloat((amount / 100000).toFixed(1))}L`;
  if (amount >= 1000) return `\u20B9${parseFloat((amount / 1000).toFixed(1))}K`;
  return formatCurrency(amount);
}
