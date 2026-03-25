"use client";

import { formatCurrency } from "@/utils/currency";
import styles from "./BalanceCard.module.css";

export interface BalanceCardProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  spentPercentage: number;
  dailySpendingRate: number;
  dailyBudgetRate: number;
  daysRemaining: number;
  period: { start: string; end: string };
}

function getProgressColor(percentage: number): "Green" | "Yellow" | "Red" {
  if (percentage < 60) return "Green";
  if (percentage <= 80) return "Yellow";
  return "Red";
}

export default function BalanceCard({
  totalIncome,
  totalExpenses,
  balance,
  spentPercentage,
  dailySpendingRate,
  dailyBudgetRate,
  daysRemaining,
  period,
}: BalanceCardProps) {
  const progressColor = getProgressColor(spentPercentage);
  const clampedPercent = Math.min(spentPercentage, 100);

  const balanceColorClass =
    balance > 0
      ? styles.balancePositive
      : balance < 0
        ? styles.balanceNegative
        : styles.balanceZero;

  return (
    <div className={styles.card}>
      {/* Summary: Income | Expenses | Balance */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Income</span>
          <span className={`${styles.summaryValue} ${styles.incomeValue}`}>
            {formatCurrency(totalIncome)}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Expenses</span>
          <span className={`${styles.summaryValue} ${styles.expenseValue}`}>
            {formatCurrency(totalExpenses)}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Balance</span>
          <span className={`${styles.summaryValue} ${balanceColorClass}`}>
            {formatCurrency(Math.abs(balance))}
            {balance < 0 ? " deficit" : ""}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Spent of income</span>
          <span
            className={`${styles.progressPercent} ${
              styles[`progressPercent${progressColor}`]
            }`}
          >
            {Math.round(spentPercentage)}%
          </span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${
              styles[`progressFill${progressColor}`]
            }`}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
      </div>

      {/* Details Row */}
      <div className={styles.detailsRow}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Daily spending</span>
          <span className={styles.detailValue}>
            {formatCurrency(dailySpendingRate)}/day
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Daily budget</span>
          <span className={styles.detailValue}>
            {formatCurrency(dailyBudgetRate)}/day
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Days left</span>
          <span className={styles.detailValue}>{daysRemaining}</span>
        </div>
        <span className={styles.periodBadge}>
          {period.start} - {period.end}
        </span>
      </div>
    </div>
  );
}
