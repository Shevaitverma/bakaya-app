"use client";

import styles from "./page.module.css";

export default function AnalyticsPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Analytics</h1>

      <div className={styles.comingSoon}>
        <span className={styles.icon}>&#128202;</span>
        <h2 className={styles.heading}>Coming Soon</h2>
        <p className={styles.subtitle}>
          Spending insights, per-profile breakdowns, category trends, and more.
        </p>
      </div>
    </div>
  );
}
