"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/utils/currency";
import { expensesApi, type Expense } from "@/lib/api/expenses";
import { groupsApi, type Group } from "@/lib/api/groups";
import { profilesApi } from "@/lib/api/profiles";
import { analyticsApi, type BalanceData } from "@/lib/api/analytics";
import type { Profile } from "@/types/profile";
import BalanceCard from "@/components/BalanceCard";
import styles from "./page.module.css";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const [userName, setUserName] = useState("User");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("bakaya_user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        const fullName = typeof user.name === "string" ? user.name : "User";
        const firstName = fullName.split(" ")[0] || "User";
        setUserName(firstName);
      } catch {
        // ignore
      }
    }

    async function fetchDashboardData() {
      try {
        const [expenseData, groupsData, profilesData, balData] = await Promise.all([
          expensesApi.list({ limit: 5 }).catch(() => null),
          groupsApi.list().catch(() => null),
          profilesApi.getProfiles().catch(() => null),
          analyticsApi.balance().catch(() => null),
        ]);

        if (expenseData) {
          setRecentExpenses(expenseData.expenses);
        }
        if (groupsData) {
          setGroups(groupsData.groups);
        }
        if (profilesData) {
          setProfiles(profilesData.profiles ?? []);
        }
        if (balData) {
          setBalanceData(balData);
        }
      } catch {
        // graceful fallback — dashboard still renders
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const handleProfileSelect = async (profileId: string | null) => {
    setSelectedProfileId(profileId);
    setExpensesLoading(true);
    try {
      const params: { limit: number; profileId?: string } = { limit: 5 };
      if (profileId) params.profileId = profileId;
      const data = await expensesApi.list(params);
      setRecentExpenses(data.expenses);
    } catch {
      // keep existing expenses on error
    } finally {
      setExpensesLoading(false);
    }
  };

  const defaultProfile = profiles.find((p) => p.isDefault);

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <p className={styles.greeting}>Hello, {userName}</p>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      {/* Balance Card */}
      {balanceData && (
        <BalanceCard
          totalIncome={balanceData.totalIncome}
          totalExpenses={balanceData.totalExpenses}
          balance={balanceData.balance}
          spentPercentage={balanceData.spentPercentage}
          dailySpendingRate={balanceData.dailySpendingRate}
          dailyBudgetRate={balanceData.dailyBudgetRate}
          daysRemaining={balanceData.daysRemaining}
          period={balanceData.period}
        />
      )}

      {/* Add Expense / Income CTAs */}
      <div className={styles.ctaRow}>
        <Link href="/dashboard/expenses/new" className={styles.addExpenseCta}>
          <span className={styles.ctaIcon}>+</span>
          Add Expense
        </Link>
        <Link href="/dashboard/expenses/new?type=income" className={styles.addIncomeCta}>
          <span className={styles.ctaIcon}>+</span>
          Add Income
        </Link>
      </div>

      {/* Profiles Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Profiles</h2>
          <Link href="/dashboard/profiles" className={styles.sectionLink}>
            View All
          </Link>
        </div>
        <div className={styles.profileChips}>
          <button
            type="button"
            className={`${styles.profileChip} ${
              selectedProfileId === null ? styles.profileChipActive : ""
            }`}
            onClick={() => handleProfileSelect(null)}
          >
            All
          </button>
          {profiles.map((profile) => (
            <button
              key={profile._id}
              type="button"
              className={`${styles.profileChip} ${
                selectedProfileId === profile._id ? styles.profileChipActive : ""
              }`}
              onClick={() => handleProfileSelect(profile._id)}
            >
              <span
                className={styles.profileChipDot}
                style={{ backgroundColor: profile.color || "var(--color-primary)" }}
              />
              {profile.name}
              {profile.isDefault ? " (Self)" : ""}
            </button>
          ))}
          <Link href="/dashboard/profiles/new" className={styles.addProfileChip}>
            + Add
          </Link>
        </div>
      </section>

      {/* Recent Transactions Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Transactions</h2>
          <Link href="/dashboard/expenses" className={styles.sectionLink}>
            View All
          </Link>
        </div>

        {isLoading || expensesLoading ? (
          <p className={styles.loadingText}>Loading...</p>
        ) : recentExpenses.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No transactions yet. Add your first expense or income!</p>
          </div>
        ) : (
          <div className={styles.expensesTable}>
            {recentExpenses.map((expense) => {
              const isIncome = expense.type === "income";
              // Find the profile that matches the expense's profileId
              const expenseProfile = expense.profileId
                ? profiles.find((p) => p._id === expense.profileId)
                : defaultProfile;

              return (
                <div key={expense._id} className={styles.expenseRow}>
                  <div className={styles.expenseInfo}>
                    <p className={styles.expenseTitle}>{expense.title}</p>
                    <div className={styles.expenseMeta}>
                      {isIncome ? (
                        expense.source && (
                          <span className={styles.incomeSource}>
                            {expense.source}
                          </span>
                        )
                      ) : (
                        expense.category && (
                          <span className={styles.expenseCategory}>
                            {expense.category}
                          </span>
                        )
                      )}
                      {expenseProfile && (
                        <span className={styles.expenseProfile}>
                          <span
                            className={styles.expenseProfileDot}
                            style={{
                              backgroundColor:
                                expenseProfile.color || "var(--color-primary)",
                            }}
                          />
                          {expenseProfile.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={
                      isIncome
                        ? styles.incomeAmount
                        : styles.expenseAmount
                    }
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(expense.amount)}
                  </span>
                  <span className={styles.expenseDate}>
                    {formatDate(expense.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Groups Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>My Groups</h2>
          <Link href="/dashboard/groups" className={styles.sectionLink}>
            View All
          </Link>
        </div>

        {isLoading ? (
          <p className={styles.loadingText}>Loading...</p>
        ) : (
          <div className={styles.groupsGrid}>
            {groups.map((group) => (
              <Link
                key={group._id}
                href={`/dashboard/groups/${group._id}`}
                className={styles.groupCard}
              >
                <div className={styles.groupIcon}>
                  <span aria-hidden>&#128101;</span>
                </div>
                <p className={styles.groupName}>{group.name}</p>
                <span className={styles.groupMembers}>
                  {group.members.length}{" "}
                  {group.members.length === 1 ? "member" : "members"}
                </span>
              </Link>
            ))}
            <Link href="/dashboard/groups/new" className={styles.newGroupCard}>
              <span className={styles.newGroupIcon}>+</span>
              New Group
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
