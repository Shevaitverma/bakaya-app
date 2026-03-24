"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ApiError, clearAllAuth } from "@/lib/api-client";
import {
  analyticsApi,
  type SummaryData,
  type ByCategoryData,
} from "@/lib/api/analytics";
import styles from "./page.module.css";

export default function AnalyticsPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [categoryData, setCategoryData] = useState<ByCategoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handle401 = (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        clearAllAuth();
        routerRef.current.push("/login");
      }
      return null;
    };

    Promise.all([
      analyticsApi.summary().catch(handle401),
      analyticsApi.byCategory().catch(handle401),
    ])
      .then(([summaryRes, categoryRes]) => {
        if (summaryRes) setSummary(summaryRes);
        if (categoryRes) setCategoryData(categoryRes);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const topProfile =
    summary && summary.byProfile.length > 0
      ? summary.byProfile[0]
      : null;

  const topCategory =
    categoryData && categoryData.categories.length > 0
      ? categoryData.categories[0]
      : null;

  const totalExpenses = categoryData
    ? categoryData.categories.reduce((sum, c) => sum + c.count, 0)
    : 0;

  const periodLabel = summary
    ? `${formatPeriodDate(summary.period.start)} - ${formatPeriodDate(summary.period.end)}`
    : "This month";

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Analytics</h1>
        <span className={styles.periodBadge}>
          <span className={styles.periodIcon}>&#128197;</span>
          {periodLabel}
        </span>
      </div>

      {isLoading ? (
        <p className={styles.loadingText}>Loading analytics...</p>
      ) : (
        <div className={styles.cardsGrid}>
          {/* Total Spent */}
          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.cardIconSpent}`}>
              &#128176;
            </div>
            <div className={styles.cardBody}>
              <p className={styles.cardLabel}>Total Spent</p>
              <p className={styles.cardValue}>
                &#8377;{(summary?.totalSpent ?? 0).toLocaleString("en-IN")}
              </p>
              <p className={styles.cardSub}>
                {totalExpenses} {totalExpenses === 1 ? "expense" : "expenses"}
              </p>
            </div>
          </div>

          {/* Top Profile */}
          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.cardIconProfile}`}>
              &#128100;
            </div>
            <div className={styles.cardBody}>
              <p className={styles.cardLabel}>Top Profile</p>
              <p className={styles.cardValue}>
                {topProfile ? topProfile.profileName : "--"}
              </p>
              {topProfile && (
                <p className={styles.cardSub}>
                  &#8377;{topProfile.total.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>

          {/* Top Category */}
          <div className={styles.card}>
            <div className={`${styles.cardIcon} ${styles.cardIconCategory}`}>
              &#127991;
            </div>
            <div className={styles.cardBody}>
              <p className={styles.cardLabel}>Top Category</p>
              <p className={styles.cardValue}>
                {topCategory ? topCategory.category : "--"}
              </p>
              {topCategory && (
                <p className={styles.cardSub}>
                  &#8377;{topCategory.total.toLocaleString("en-IN")} &middot;{" "}
                  {topCategory.count}{" "}
                  {topCategory.count === 1 ? "expense" : "expenses"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon placeholder for charts */}
      <div className={styles.comingSoon}>
        <div className={styles.comingSoonIcon}>&#128202;</div>
        <h2 className={styles.comingSoonTitle}>Charts &amp; Trends Coming Soon</h2>
        <p className={styles.comingSoonSubtitle}>
          Detailed spending charts, monthly trends, and category breakdowns are on the way.
        </p>
      </div>
    </div>
  );
}

function formatPeriodDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
