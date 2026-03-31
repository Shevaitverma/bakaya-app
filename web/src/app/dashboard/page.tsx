"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/utils/currency";
import { getSourceEmoji, getSourceColor } from "@/utils/source-helpers";
import type { Expense } from "@/lib/api/expenses";
import type { BalanceData } from "@/lib/api/analytics";
import type { Category } from "@/lib/api/categories";
import type { Profile } from "@/types/profile";
import { useProfiles, useCategoriesMap, useBalance, useExpenses } from "@/lib/queries";
import styles from "./page.module.css";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getCurrentMonthYear(): string {
  const now = new Date();
  return now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function getBalanceColor(balance: number): string {
  if (balance > 0) return "#10B981";
  if (balance < 0) return "#EF4444";
  return "#6B7280";
}

function getProgressColor(percentage: number): string {
  if (percentage <= 50) return "#D81B60";
  if (percentage <= 75) return "#F59E0B";
  return "#EF4444";
}

export default function DashboardPage() {
  const [userName, setUserName] = useState("User");
  const [userInitial, setUserInitial] = useState("U");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("bakaya_user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        const fullName = typeof user.name === "string" ? user.name : "User";
        const firstName = fullName.split(" ")[0] || "User";
        setUserName(firstName);
        setUserInitial(firstName.charAt(0).toUpperCase());
      } catch {
        // ignore
      }
    }
  }, []);

  // --- TanStack Query hooks ---
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles();
  const { data: rawCategoriesMap = {}, isLoading: categoriesLoading } = useCategoriesMap();
  const { data: balanceData, isLoading: balanceLoading } = useBalance({});

  const expenseParams = useMemo(() => ({
    limit: 5 as const,
    ...(selectedProfileId ? { profileId: selectedProfileId } : {}),
  }), [selectedProfileId]);

  const { data: expensesData, isLoading: expensesLoading } = useExpenses(expenseParams);

  // Build a lowercased categories map for case-insensitive lookup
  const categoriesMap = useMemo(() => {
    const map: Record<string, Category> = {};
    for (const [key, value] of Object.entries(rawCategoriesMap)) {
      map[key.toLowerCase()] = value;
    }
    return map;
  }, [rawCategoriesMap]);

  const recentExpenses: Expense[] = expensesData?.expenses ?? [];
  const isLoading = profilesLoading || balanceLoading || categoriesLoading;

  const handleProfileSelect = (profileId: string | null) => {
    setSelectedProfileId(profileId);
  };

  const clampedPercentage = balanceData ? Math.min(Math.max(balanceData.spentPercentage, 0), 100) : 0;
  const progressColor = balanceData ? getProgressColor(clampedPercentage) : "#D81B60";
  const balanceColor = balanceData ? getBalanceColor(balanceData.balance) : "#6B7280";

  return (
    <div className={styles.page}>
      {/* ===== Pink Header ===== */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.greeting}>Hello, {userName}</p>
          <h1 className={styles.title}>Bakaya</h1>
        </div>
        <div className={styles.avatarCircle}>
          <span className={styles.avatarText}>{userInitial}</span>
        </div>
      </div>

      {/* ===== Content Sheet ===== */}
      <div className={styles.contentSheet}>

        {/* ===== Balance Summary Card ===== */}
        {isLoading ? (
          <div className={styles.loadingContainer}>Loading...</div>
        ) : balanceData ? (
          <div className={styles.balanceCard}>
            {/* Top row: Month chip + Income button */}
            <div className={styles.balanceCardTopRow}>
              <div className={styles.monthChip}>
                <span className={styles.monthChipIcon}>{"\uD83D\uDCC5"}</span>
                {getCurrentMonthYear()}
              </div>
              <Link href="/dashboard/expenses/new?type=income" className={styles.incomeButton}>
                + Income
              </Link>
            </div>

            {/* Three columns: Income | Expenses | Balance */}
            <div className={styles.balanceSummaryRow}>
              <div className={styles.balanceSummaryItem}>
                <span className={`${styles.balanceSummaryValue} ${styles.balanceSummaryValueGreen}`}>
                  {formatCurrency(balanceData.totalIncome)}
                </span>
                <span className={styles.balanceSummaryLabel}>INCOME</span>
              </div>
              <div className={styles.balanceSummaryItem}>
                <span className={`${styles.balanceSummaryValue} ${styles.balanceSummaryValueRed}`}>
                  {formatCurrency(balanceData.totalExpenses)}
                </span>
                <span className={styles.balanceSummaryLabel}>EXPENSES</span>
              </div>
              <div className={styles.balanceSummaryItem}>
                <span
                  className={styles.balanceSummaryValue}
                  style={{ color: balanceColor }}
                >
                  {formatCurrency(Math.abs(balanceData.balance))}
                </span>
                <span className={styles.balanceSummaryLabel}>BALANCE</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className={styles.progressBarBackground}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${clampedPercentage}%`,
                  backgroundColor: progressColor,
                }}
              />
            </div>

            {/* Bottom row: daily rates + days remaining */}
            <div className={styles.balanceBottomRow}>
              <span className={styles.balanceBottomLeft}>
                {formatCurrency(balanceData.dailySpendingRate)}/day spent &middot; Budget: {formatCurrency(balanceData.dailyBudgetRate)}/day
              </span>
              {balanceData.daysRemaining > 0 && (
                <span className={styles.balanceBottomRight}>
                  {balanceData.daysRemaining} days left
                </span>
              )}
            </div>
          </div>
        ) : null}

        {/* ===== Profiles Section ===== */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Profiles</h2>
            {profiles.length > 0 && (
              <Link href="/dashboard/profiles" className={styles.sectionLink}>
                View All
              </Link>
            )}
          </div>
          {isLoading ? (
            <div className={styles.loadingContainer}>Loading...</div>
          ) : profiles.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No profiles yet. Create one to get started!</p>
            </div>
          ) : (
            <div className={styles.profileChips}>
              {/* "All" chip */}
              <button
                type="button"
                className={`${styles.profileChip} ${selectedProfileId === null ? styles.profileChipActive : ""}`}
                onClick={() => handleProfileSelect(null)}
              >
                <span className={styles.profileChipIcon}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="1" y="1" width="10" height="10" rx="2" />
                    <rect x="13" y="1" width="10" height="10" rx="2" />
                    <rect x="1" y="13" width="10" height="10" rx="2" />
                    <rect x="13" y="13" width="10" height="10" rx="2" />
                  </svg>
                </span>
                All
              </button>

              {/* Profile chips */}
              {profiles.map((profile, index) => {
                const color = profile.color || "#D81B60";
                const isSelected = selectedProfileId === profile._id;
                return (
                  <button
                    key={profile._id}
                    type="button"
                    className={`${styles.profileChip} ${isSelected ? styles.profileChipActive : ""}`}
                    style={
                      isSelected
                        ? { background: color, borderColor: color, color: "#FFFFFF" }
                        : undefined
                    }
                    onClick={() => handleProfileSelect(profile._id)}
                  >
                    <span
                      className={styles.profileDot}
                      style={{ backgroundColor: isSelected ? "#FFFFFF" : color }}
                    />
                    {profile.name}
                  </button>
                );
              })}

              {/* Add profile chip */}
              <Link href="/dashboard/profiles/new" className={styles.addProfileChip}>
                + Add
              </Link>
            </div>
          )}
        </div>

        {/* ===== Recent Transactions Section ===== */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Transactions</h2>
          </div>

          {isLoading || expensesLoading ? (
            <div className={styles.loadingContainer}>Loading...</div>
          ) : recentExpenses.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>{"\uD83E\uDDFE"}</div>
              <p>No expenses yet. Tap the + button to get started!</p>
            </div>
          ) : (
            <div className={styles.transactionsCard}>
              <div className={styles.transactionsList}>
              {recentExpenses.map((expense, index) => {
                const isIncome = expense.type === "income";
                const expenseProfile = expense.profileId
                  ? profiles.find((p) => p._id === expense.profileId)
                  : undefined;

                const catKey = (expense.category ?? "other").toLowerCase();
                const catEntry = categoriesMap[catKey];
                const labelText = isIncome
                  ? (expense.source ?? "Income")
                  : (expense.category ?? "Other");

                // Icon and background color
                let emoji: string;
                let iconBg: string;

                if (isIncome) {
                  emoji = getSourceEmoji(expense.source ?? "other");
                  iconBg = getSourceColor(expense.source ?? "other");
                } else if (catEntry) {
                  emoji = catEntry.emoji ?? "\u{1F4C4}";
                  iconBg = catEntry.color ? `${catEntry.color}20` : "rgba(156, 163, 175, 0.15)";
                } else {
                  emoji = "\u{1F4C4}";
                  iconBg = "rgba(216, 27, 96, 0.1)";
                }

                // Build subtitle: "CATEGORY · DATE ·"
                const subtitleParts = [labelText.toUpperCase(), formatDate(expense.createdAt).toUpperCase()];
                const subtitle = subtitleParts.join(" \u00B7 ") + " \u00B7";

                return (
                  <div
                    key={expense._id}
                    className={styles.expenseRow}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className={styles.expenseIconWrapper}
                      style={{ background: iconBg }}
                    >
                      <span aria-hidden>{emoji}</span>
                    </div>
                    <div className={styles.expenseDetails}>
                      <p className={styles.expenseTitle}>{expense.title}</p>
                      <p className={styles.expenseCategory}>{subtitle}</p>
                    </div>
                    <span
                      className={`${styles.expenseAmount} ${
                        isIncome ? styles.expenseAmountGreen : styles.expenseAmountRed
                      }`}
                    >
                      {isIncome ? "+" : "-"}{formatCurrency(expense.amount)}
                    </span>
                  </div>
                );
              })}
              </div>
              <Link href="/dashboard/expenses" className={styles.viewAllTransactions}>
                View All Transactions
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ===== FAB ===== */}
      <Link href="/dashboard/expenses/new" className={styles.fab} aria-label="Add expense">
        +
      </Link>
    </div>
  );
}
