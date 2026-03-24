"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, clearAllAuth } from "@/lib/api-client";
import { expensesApi, type Expense } from "@/lib/api/expenses";
import { groupsApi, type Group } from "@/lib/api/groups";
import { profilesApi } from "@/lib/api/profiles";
import type { Profile } from "@/types/profile";
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
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [userName, setUserName] = useState("User");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        const handle401 = (error: unknown) => {
          if (error instanceof ApiError && error.status === 401) {
            clearAllAuth();
            routerRef.current.push("/login");
          }
          return null;
        };

        const [expenseData, groupsData, profilesData] = await Promise.all([
          expensesApi.list({ limit: 5 }).catch(handle401),
          groupsApi.list().catch(handle401),
          profilesApi.getProfiles().catch(handle401),
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
      } catch {
        // graceful fallback — dashboard still renders
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const defaultProfile = profiles.find((p) => p.isDefault);

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <p className={styles.greeting}>Hello, {userName}</p>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      {/* Add Expense CTA */}
      <Link href="/dashboard/expenses/new" className={styles.addExpenseCta}>
        <span className={styles.ctaIcon}>+</span>
        Add Expense
      </Link>

      {/* Profiles Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Profiles</h2>
          <Link href="/dashboard/profiles" className={styles.sectionLink}>
            View All
          </Link>
        </div>
        <div className={styles.profileChips}>
          {profiles.map((profile) => (
            <Link
              key={profile._id}
              href={`/dashboard/profiles/${profile._id}`}
              className={`${styles.profileChip} ${
                profile.isDefault ? styles.profileChipActive : ""
              }`}
            >
              <span
                className={styles.profileChipDot}
                style={{ backgroundColor: profile.color || "var(--color-primary)" }}
              />
              {profile.name}
              {profile.isDefault ? " (Self)" : ""}
            </Link>
          ))}
          <Link href="/dashboard/profiles/new" className={styles.addProfileChip}>
            + Add
          </Link>
        </div>
      </section>

      {/* Recent Expenses Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Expenses</h2>
          <Link href="/dashboard/expenses" className={styles.sectionLink}>
            View All
          </Link>
        </div>

        {isLoading ? (
          <p className={styles.loadingText}>Loading...</p>
        ) : recentExpenses.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No expenses yet. Add your first expense!</p>
          </div>
        ) : (
          <div className={styles.expensesTable}>
            {recentExpenses.map((expense) => {
              // Find the profile that matches the expense's profileId
              const expenseProfile = expense.profileId
                ? profiles.find((p) => p._id === expense.profileId)
                : defaultProfile;

              return (
                <div key={expense._id} className={styles.expenseRow}>
                  <div className={styles.expenseInfo}>
                    <p className={styles.expenseTitle}>{expense.title}</p>
                    <div className={styles.expenseMeta}>
                      {expense.category && (
                        <span className={styles.expenseCategory}>
                          {expense.category}
                        </span>
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
                  <span className={styles.expenseAmount}>
                    &#8377;{expense.amount.toLocaleString("en-IN")}
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
