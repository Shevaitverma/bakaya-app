"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/utils/currency";
import { expensesApi, type Expense } from "@/lib/api/expenses";
import { groupsApi, type Group } from "@/lib/api/groups";
import { profilesApi } from "@/lib/api/profiles";
import { analyticsApi, type BalanceData } from "@/lib/api/analytics";
import { categoriesApi, type Category } from "@/lib/api/categories";
import type { Profile } from "@/types/profile";
import styles from "./page.module.css";

const SOURCE_EMOJI: Record<string, string> = {
  salary: "\u{1F4B0}",
  freelance: "\u{1F4BB}",
  investment: "\u{1F4C8}",
  gift: "\u{1F381}",
  refund: "\u{1F504}",
  rental: "\u{1F3E0}",
  other: "\u{1F4B5}",
};

const SOURCE_COLORS: Record<string, string> = {
  salary: "rgba(16, 185, 129, 0.15)",
  freelance: "rgba(99, 102, 241, 0.15)",
  investment: "rgba(34, 197, 94, 0.15)",
  gift: "rgba(244, 63, 94, 0.15)",
  refund: "rgba(59, 130, 246, 0.15)",
  rental: "rgba(139, 92, 246, 0.15)",
  other: "rgba(16, 185, 129, 0.15)",
};

const GROUP_ICON_COLORS = [
  styles.groupIconPurple,
  styles.groupIconBlue,
  styles.groupIconGreen,
  styles.groupIconPink,
  styles.groupIconOrange,
];

const GROUP_EMOJIS = [
  "\u{1F3E0}", // house
  "\u{1F3D5}", // camping
  "\u{1F37D}", // fork & knife
  "\u{2708}",  // airplane
  "\u{1F46B}", // couple
];

function getSourceEmoji(source: string): string {
  return SOURCE_EMOJI[source.toLowerCase()] ?? "\u{1F4B5}";
}

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source.toLowerCase()] ?? "rgba(16, 185, 129, 0.15)";
}

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

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
  const [categoriesMap, setCategoriesMap] = useState<Record<string, Category>>({});

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
        const [expenseData, groupsData, profilesData, balData, catData] = await Promise.all([
          expensesApi.list({ limit: 5 }).catch(() => null),
          groupsApi.list().catch(() => null),
          profilesApi.getProfiles().catch(() => null),
          analyticsApi.balance().catch(() => null),
          categoriesApi.list().catch(() => null),
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
        if (catData) {
          const map: Record<string, Category> = {};
          for (const c of catData.categories ?? []) {
            map[c.name] = c;
          }
          setCategoriesMap(map);
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

  const spentPercent = balanceData ? Math.min(balanceData.spentPercentage, 100) : 0;
  const budgetFillClass =
    spentPercent >= 80
      ? styles.budgetFillDanger
      : spentPercent >= 60
        ? styles.budgetFillWarning
        : "";

  return (
    <div className={styles.page}>
      {/* ===== TOP BAR: Breadcrumb + Search + Bell ===== */}
      <div className={styles.topBar}>
        <div>
          <p className={styles.financeLabel}>Finance Tracker</p>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbName}>Hello, {userName}</span>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbPage}>Dashboard</span>
          </div>
        </div>
        <div className={styles.topBarRight}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search transactions..."
          />
          <button type="button" className={styles.notificationBtn} aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className={styles.notificationDot} />
          </button>
        </div>
      </div>

      {/* ===== BALANCE HERO CARD ===== */}
      {balanceData && (
        <div className={styles.balanceHero}>
          <div className={styles.balanceColumns}>
            <div className={styles.balanceCol}>
              <span className={styles.balanceLabel}>Total Income</span>
              <span className={`${styles.balanceValue} ${styles.balanceValueIncome}`}>
                {formatCurrency(balanceData.totalIncome)}
              </span>
            </div>
            <div className={styles.balanceCol}>
              <span className={styles.balanceLabel}>Total Expenses</span>
              <span className={`${styles.balanceValue} ${styles.balanceValueExpense}`}>
                {formatCurrency(balanceData.totalExpenses)}
              </span>
            </div>
            <div className={styles.balanceCol}>
              <span className={styles.balanceLabel}>Net Balance</span>
              <span
                className={`${styles.balanceValue} ${
                  balanceData.balance >= 0
                    ? styles.balanceValueNet
                    : styles.balanceValueNetNegative
                }`}
              >
                {formatCurrency(Math.abs(balanceData.balance))}
                {balanceData.balance < 0 ? " deficit" : ""}
              </span>
            </div>
          </div>

          {/* Monthly Budget Usage */}
          <div className={styles.budgetProgress}>
            <div className={styles.budgetProgressHeader}>
              <span className={styles.budgetProgressLabel}>Monthly Budget Usage</span>
              <span className={styles.budgetProgressPercent}>
                {Math.round(balanceData.spentPercentage)}% Used
              </span>
            </div>
            <div className={styles.budgetTrack}>
              <div
                className={`${styles.budgetFill} ${budgetFillClass}`}
                style={{ width: `${spentPercent}%` }}
              />
            </div>
            <p className={styles.dailyRate}>
              Daily spending rate: {formatCurrency(balanceData.dailySpendingRate)}/day
            </p>
          </div>
        </div>
      )}

      {/* ===== CTA BUTTONS ===== */}
      <div className={styles.ctaRow}>
        <Link href="/dashboard/expenses/new" className={styles.addExpenseCta}>
          <span className={styles.ctaIconCircle}>+</span>
          Add Expense
        </Link>
        <Link href="/dashboard/expenses/new?type=income" className={styles.addIncomeCta}>
          <span className={styles.ctaIconCircle}>+</span>
          Add Income
        </Link>
      </div>

      {/* ===== TWO COLUMN LAYOUT ===== */}
      <div className={styles.twoColumnLayout}>
        {/* ---------- LEFT COLUMN ---------- */}
        <div className={styles.leftColumn}>
          {/* Profiles Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Profiles</h2>
              <Link href="/dashboard/profiles" className={styles.sectionLink}>
                Manage All
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
                +
              </Link>
            </div>
          </section>

          {/* Recent Transactions */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderLeft}>
                <h2 className={styles.sectionTitle}>Recent Transactions</h2>
                <button type="button" className={styles.filterBtn} aria-label="Filter">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                </button>
              </div>
            </div>

            {isLoading || expensesLoading ? (
              <p className={styles.loadingText}>Loading...</p>
            ) : recentExpenses.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No transactions yet. Add your first expense or income!</p>
              </div>
            ) : (
              <div className={styles.transactionsCard}>
                <div className={styles.expensesTable}>
                  {recentExpenses.map((expense, index) => {
                    const isIncome = expense.type === "income";
                    const expenseProfile = expense.profileId
                      ? profiles.find((p) => p._id === expense.profileId)
                      : defaultProfile;

                    const catEntry = categoriesMap[expense.category ?? ""];
                    const emoji = isIncome
                      ? getSourceEmoji(expense.source ?? "other")
                      : (catEntry?.emoji ?? "\u{1F4C4}");
                    const circleColor = isIncome
                      ? getSourceColor(expense.source ?? "other")
                      : (catEntry?.color ? `${catEntry.color}26` : "rgba(156, 163, 175, 0.15)");
                    const label = isIncome
                      ? (expense.source ?? "Income")
                      : (expense.category ?? "Other");

                    return (
                      <div
                        key={expense._id}
                        className={styles.expenseRow}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Category/Source emoji circle */}
                        <div
                          className={styles.categoryCircle}
                          style={{ background: circleColor }}
                        >
                          <span aria-hidden>{emoji}</span>
                        </div>

                        <div className={styles.expenseInfo}>
                          <p className={styles.expenseTitle}>{expense.title}</p>
                          <div className={styles.expenseMeta}>
                            <span>{label}</span>
                            <span className={styles.metaDot} />
                            <span>{formatDate(expense.createdAt)}</span>
                            {expenseProfile && (
                              <>
                                <span className={styles.metaDot} />
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
                              </>
                            )}
                          </div>
                        </div>

                        <div className={styles.expenseRight}>
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
                          {isIncome && expense.source && (
                            <span className={styles.incomeNote}>
                              {expense.source.charAt(0).toUpperCase() + expense.source.slice(1)}
                            </span>
                          )}
                          {!isIncome && expense.notes && (
                            <span className={styles.expenseNote}>{expense.notes}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Link href="/dashboard/expenses" className={styles.viewAllLink}>
                  View All Transactions
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* ---------- RIGHT COLUMN ---------- */}
        <div className={styles.rightColumn}>
          {/* My Groups */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>My Groups</h2>
              <Link href="/dashboard/groups/new" className={styles.sectionAddBtn}>
                +
              </Link>
            </div>

            {isLoading ? (
              <p className={styles.loadingText}>Loading...</p>
            ) : (
              <div className={styles.groupsStack}>
                {groups.map((group, idx) => {
                  const colorClass = GROUP_ICON_COLORS[idx % GROUP_ICON_COLORS.length];
                  const groupEmoji = GROUP_EMOJIS[idx % GROUP_EMOJIS.length];
                  const memberCount = group.members.length;
                  const maxAvatars = 3;

                  return (
                    <Link
                      key={group._id}
                      href={`/dashboard/groups/${group._id}`}
                      className={styles.groupCard}
                    >
                      <div className={`${styles.groupIconCircle} ${colorClass}`}>
                        <span aria-hidden>{groupEmoji}</span>
                      </div>
                      <div className={styles.groupCardBody}>
                        <p className={styles.groupName}>{group.name}</p>
                        {group.description && (
                          <p className={styles.groupDescription}>{group.description}</p>
                        )}
                        <div className={styles.groupFooter}>
                          <div className={styles.memberAvatars}>
                            {group.members.slice(0, maxAvatars).map((m, mIdx) => (
                              <span key={mIdx} className={styles.memberAvatar}>
                                {getInitials(
                                  m.userId?.name ?? m.userId?.firstName ?? m.userId?.email
                                )}
                              </span>
                            ))}
                            {memberCount > maxAvatars && (
                              <span className={styles.memberCount}>
                                +{memberCount - maxAvatars}
                              </span>
                            )}
                            {memberCount <= maxAvatars && (
                              <span className={styles.memberCount}>
                                {memberCount} {memberCount === 1 ? "member" : "members"}
                              </span>
                            )}
                          </div>
                          <span className={`${styles.groupBadge} ${styles.badgeActive}`}>
                            Active
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                <Link href="/dashboard/groups/new" className={styles.newGroupCard}>
                  <span className={styles.newGroupIcon}>+</span>
                  New Group
                </Link>
              </div>
            )}
          </section>

          {/* Spending Trends removed — real analytics available at /dashboard/analytics */}
        </div>
      </div>
    </div>
  );
}
