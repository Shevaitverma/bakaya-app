"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearToken } from "@/lib/api-client";
import { expensesApi } from "@/lib/api/expenses";
import { groupsApi, type GroupsData } from "@/lib/api/groups";
import styles from "./page.module.css";

interface DashboardGroup {
  id: string;
  title: string;
  amount: number;
  isMyExpense: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [groups, setGroups] = useState<DashboardGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("bakaya_user");
    if (!stored) {
      router.push("/login");
      return;
    }
    try {
      const user = JSON.parse(stored);
      const fullName = typeof user.name === "string" ? user.name : "User";
      const firstName = fullName.split(" ")[0] || "User";
      setUserName(firstName);
      setIsAuthChecked(true);
    } catch {
      localStorage.removeItem("bakaya_user");
      clearToken();
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthChecked) return;

    async function fetchDashboardData() {
      try {
        const [expenseData, groupsData] = await Promise.all([
          expensesApi.list({ limit: 1 }),
          groupsApi.list().catch(() => ({ groups: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }) as GroupsData),
        ]);

        const dashboardGroups: DashboardGroup[] = [
          {
            id: "my-expense",
            title: "My Expense",
            amount: expenseData.totalExpenseAmount,
            isMyExpense: true,
          },
          ...groupsData.groups.map((g) => ({
            id: g._id,
            title: g.name,
            amount: 0,
            isMyExpense: false,
          })),
        ];

        setGroups(dashboardGroups);
      } catch {
        setGroups([
          { id: "my-expense", title: "My Expense", amount: 0, isMyExpense: true },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [isAuthChecked]);

  const handleLogout = () => {
    localStorage.removeItem("bakaya_user");
    clearToken();
    router.push("/login");
  };

  const totalOwed = groups
    .filter((g) => !g.isMyExpense)
    .reduce((sum, g) => sum + g.amount, 0);

  if (!isAuthChecked) {
    return null;
  }

  return (
    <div className={styles.page}>
      {/* ---------- Header (primary background) ---------- */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.titleBlock}>
            <p className={styles.greeting}>Hello, {userName}</p>
            <h1 className={styles.pageTitle}>Your Groups</h1>
          </div>

          <div className={styles.headerActions}>
            <Link href="/dashboard/groups/new" className={styles.newGroupBtn}>
              <span aria-hidden>+</span> New Group
            </Link>
            <button
              className={styles.logoutBtn}
              aria-label="Logout"
              title="Logout"
              onClick={handleLogout}
            >
              <span aria-hidden>⏻</span>
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <span aria-hidden>💰</span>
          </div>
          <div className={styles.summaryContent}>
            <p className={styles.summaryLabel}>Total Owed</p>
            <p className={styles.summaryAmount}>
              ₹{totalOwed.toFixed(2)}
            </p>
          </div>
        </div>
      </header>

      {/* ---------- Content ---------- */}
      <main className={styles.content}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Expense Groups</h2>
          <p className={styles.sectionSubtitle}>
            {groups.length} {groups.length === 1 ? "group" : "groups"}
          </p>
        </div>

        {isLoading ? (
          <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
            Loading...
          </p>
        ) : (
          <div className={styles.groupsGrid}>
            {groups.map((group) => {
              const href = group.isMyExpense
                ? "/dashboard/expenses"
                : `/dashboard/groups/${group.id}`;

              return (
                <Link key={group.id} href={href} className={styles.groupCard}>
                  {/* Icon */}
                  <div
                    className={`${styles.groupIcon} ${
                      group.isMyExpense
                        ? styles.groupIconPrimary
                        : styles.groupIconBlue
                    }`}
                  >
                    <span aria-hidden>{group.isMyExpense ? "💳" : "👥"}</span>
                  </div>

                  {/* Info */}
                  <div className={styles.groupInfo}>
                    <p className={styles.groupTitle}>{group.title}</p>
                    <div className={styles.groupAmountRow}>
                      <span className={styles.groupAmountLabel}>
                        {group.isMyExpense ? "Your expense" : "You owe"}
                      </span>
                      <span
                        className={`${styles.groupAmount} ${
                          group.amount > 0
                            ? styles.amountRed
                            : styles.amountGreen
                        }`}
                      >
                        ₹{group.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <span className={styles.groupChevron} aria-hidden>
                    ›
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
