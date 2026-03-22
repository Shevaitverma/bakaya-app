"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { formatDate } from "@/utils/format";
import { clearToken, ApiError } from "@/lib/api-client";
import {
  groupsApi,
  type Group,
  type GroupExpense,
  type GroupBalances,
} from "@/lib/api/groups";
import type { Settlement } from "@/types/settlement";
import styles from "./page.module.css";

/** Emoji equivalents for category icons (matching mobile categoryIcons.ts) */
const CATEGORY_EMOJI: Record<string, string> = {
  food: "\u{1F37D}\u{FE0F}",
  accessory: "\u{1F4F1}",
  transport: "\u{1F697}",
  shopping: "\u{1F6CD}\u{FE0F}",
  bills: "\u{1F9FE}",
  entertainment: "\u{1F3AC}",
  groceries: "\u{1F6D2}",
  healthcare: "\u{1F48A}",
  education: "\u{1F393}",
  travel: "\u{2708}\u{FE0F}",
  utilities: "\u{26A1}",
  clothing: "\u{1F455}",
  restaurant: "\u{1F374}",
  gas: "\u{26FD}",
  insurance: "\u{1F6E1}\u{FE0F}",
  rent: "\u{1F3E0}",
  other: "\u{1F4C4}",
};

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category.toLowerCase()] ?? "\u{1F4C4}";
}

function getMemberDisplayName(member: {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}): string {
  if (member.name) return member.name;
  if (member.firstName || member.lastName) {
    return [member.firstName, member.lastName].filter(Boolean).join(" ");
  }
  return member.email;
}

interface SettleUpTarget {
  userId: string;
  userName: string;
  amount: number; // positive = they owe you, negative = you owe them
}

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [balances, setBalances] = useState<GroupBalances | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<GroupExpense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");

  // Settle up state
  const [settleTarget, setSettleTarget] = useState<SettleUpTarget | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNotes, setSettleNotes] = useState("");
  const [isSettling, setIsSettling] = useState(false);
  const [settleError, setSettleError] = useState("");

  // Auth guard: redirect to login if not logged in
  useEffect(() => {
    const stored = localStorage.getItem("bakaya_user");
    if (!stored) {
      router.push("/login");
      return;
    }
    try {
      const user = JSON.parse(stored);
      setCurrentUserId(user.id || user._id || "");
      setIsAuthChecked(true);
    } catch {
      localStorage.removeItem("bakaya_user");
      clearToken();
      router.push("/login");
    }
  }, [router]);

  // Fetch group, expenses, balances, and settlements in parallel
  useEffect(() => {
    if (!isAuthChecked) return;

    async function fetchData() {
      try {
        const [groupData, expensesData, balancesData, settlementsData] =
          await Promise.all([
            groupsApi.get(groupId),
            groupsApi.getExpenses(groupId, { limit: 100 }),
            groupsApi.getBalances(groupId),
            groupsApi.getSettlements(groupId),
          ]);
        setGroup(groupData);
        setExpenses(expensesData.expenses);
        setTotalAmount(expensesData.totalAmount);
        setBalances(balancesData);
        setSettlements(settlementsData.settlements);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem("bakaya_user");
          clearToken();
          router.push("/login");
          return;
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [isAuthChecked, router, groupId]);

  /** Resolve a userId to a display name using group members */
  function resolveUserName(userId: string): string {
    if (!group) return userId;
    const member = group.members.find((m) => m.userId.id === userId);
    if (member) return getMemberDisplayName(member.userId);
    return userId;
  }

  /** Build human-readable balance entries from the balances object */
  function getBalanceEntries(): {
    userId: string;
    userName: string;
    amount: number;
  }[] {
    if (!balances || !currentUserId) return [];
    const entries: { userId: string; userName: string; amount: number }[] = [];

    for (const [userId, amount] of Object.entries(balances.balances)) {
      if (userId === currentUserId || amount === 0) continue;
      entries.push({
        userId,
        userName: resolveUserName(userId),
        amount,
      });
    }
    return entries;
  }

  const handleDelete = (expense: GroupExpense) => {
    setDeleteTarget(expense);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);

    try {
      await groupsApi.deleteExpense(groupId, deleteTarget._id);
      setExpenses((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      setTotalAmount((prev) => prev - deleteTarget.amount);
      // Refresh balances after deleting an expense
      const updatedBalances = await groupsApi.getBalances(groupId);
      setBalances(updatedBalances);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem("bakaya_user");
        clearToken();
        router.push("/login");
        return;
      }
    } finally {
      setDeleteTarget(null);
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingMember || !memberEmail.trim()) return;

    setIsAddingMember(true);
    setAddMemberError("");

    try {
      const updatedGroup = await groupsApi.addMember(groupId, memberEmail.trim());
      setGroup(updatedGroup);
      setMemberEmail("");
      setShowAddMember(false);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          localStorage.removeItem("bakaya_user");
          clearToken();
          router.push("/login");
          return;
        }
        setAddMemberError(error.message);
      } else {
        setAddMemberError("Unable to add member. Please try again.");
      }
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleSettleUp = (entry: {
    userId: string;
    userName: string;
    amount: number;
  }) => {
    setSettleTarget({
      userId: entry.userId,
      userName: entry.userName,
      amount: entry.amount,
    });
    // Pre-fill the amount with the absolute balance value
    setSettleAmount(Math.abs(entry.amount).toFixed(2));
    setSettleNotes("");
    setSettleError("");
  };

  const cancelSettle = () => {
    setSettleTarget(null);
    setSettleAmount("");
    setSettleNotes("");
    setSettleError("");
  };

  const confirmSettle = async () => {
    if (!settleTarget || isSettling) return;

    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) {
      setSettleError("Please enter a valid amount.");
      return;
    }

    setIsSettling(true);
    setSettleError("");

    try {
      // If the balance is negative, current user owes the other person (currentUser pays them)
      // If the balance is positive, the other person owes current user (they pay currentUser)
      const paidBy =
        settleTarget.amount < 0 ? currentUserId : settleTarget.userId;
      const paidTo =
        settleTarget.amount < 0 ? settleTarget.userId : currentUserId;

      const newSettlement = await groupsApi.createSettlement(groupId, {
        paidBy,
        paidTo,
        amount: amt,
        notes: settleNotes.trim() || undefined,
      });

      setSettlements((prev) => [newSettlement, ...prev]);

      // Refresh balances after settling
      const updatedBalances = await groupsApi.getBalances(groupId);
      setBalances(updatedBalances);

      cancelSettle();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          localStorage.removeItem("bakaya_user");
          clearToken();
          router.push("/login");
          return;
        }
        setSettleError(error.message);
      } else {
        setSettleError("Unable to record settlement. Please try again.");
      }
    } finally {
      setIsSettling(false);
    }
  };

  if (!isAuthChecked) {
    return null;
  }

  const balanceEntries = getBalanceEntries();

  return (
    <div className={styles.page}>
      {/* ---------- Header ---------- */}
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => router.push("/dashboard")}
          aria-label="Go back"
        >
          &larr;
        </button>

        <div className={styles.headerCenter}>
          <h1 className={styles.headerTitle}>
            {isLoading ? "Loading..." : group?.name ?? "Group"}
          </h1>
          <div className={styles.totalRow}>
            <p className={styles.totalLabel}>Total expense</p>
            <p className={styles.totalValue}>
              {"\u20B9"}{totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className={styles.headerPlaceholder} />
      </header>

      {/* ---------- Content ---------- */}
      <main className={styles.content}>
        {isLoading ? (
          <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
            Loading group...
          </p>
        ) : (
          <>
            {/* ---------- Balances Section ---------- */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Balances</h2>

              {balanceEntries.length === 0 ? (
                <div className={styles.balanceEmpty}>
                  <p className={styles.balanceEmptyText}>
                    All settled up! No outstanding balances.
                  </p>
                </div>
              ) : (
                <div className={styles.balanceList}>
                  {balanceEntries.map((entry) => {
                    const isOwed = entry.amount > 0; // other person owes current user
                    return (
                      <div key={entry.userId} className={styles.balanceCard}>
                        <div className={styles.balanceInfo}>
                          <div
                            className={`${styles.balanceIndicator} ${
                              isOwed
                                ? styles.balanceIndicatorPositive
                                : styles.balanceIndicatorNegative
                            }`}
                          />
                          <div>
                            <p className={styles.balanceText}>
                              {isOwed ? (
                                <>
                                  <strong>{entry.userName}</strong> owes you
                                </>
                              ) : (
                                <>
                                  You owe <strong>{entry.userName}</strong>
                                </>
                              )}
                            </p>
                            <p
                              className={`${styles.balanceAmount} ${
                                isOwed
                                  ? styles.balanceAmountPositive
                                  : styles.balanceAmountNegative
                              }`}
                            >
                              {"\u20B9"}{Math.abs(entry.amount).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <button
                          className={styles.settleBtn}
                          onClick={() => handleSettleUp(entry)}
                        >
                          Settle Up
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Inline Settle Up Form */}
              {settleTarget && (
                <div className={styles.settleForm}>
                  <h3 className={styles.settleFormTitle}>
                    Settle with {settleTarget.userName}
                  </h3>

                  {settleError && (
                    <div className={styles.settleFormError}>{settleError}</div>
                  )}

                  <div className={styles.settleFormFields}>
                    <div className={styles.settleField}>
                      <label
                        htmlFor="settleAmount"
                        className={styles.settleLabel}
                      >
                        Amount
                      </label>
                      <input
                        id="settleAmount"
                        type="text"
                        inputMode="decimal"
                        className={styles.settleInput}
                        placeholder="Enter amount"
                        value={settleAmount}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, "");
                          if ((val.match(/\./g) || []).length > 1) return;
                          setSettleAmount(val);
                        }}
                      />
                    </div>
                    <div className={styles.settleField}>
                      <label
                        htmlFor="settleNotes"
                        className={styles.settleLabel}
                      >
                        Notes (optional)
                      </label>
                      <input
                        id="settleNotes"
                        type="text"
                        className={styles.settleInput}
                        placeholder="e.g. Cash payment"
                        value={settleNotes}
                        onChange={(e) => setSettleNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.settleFormActions}>
                    <button
                      type="button"
                      className={styles.settleCancelBtn}
                      onClick={cancelSettle}
                      disabled={isSettling}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.settleConfirmBtn}
                      onClick={confirmSettle}
                      disabled={isSettling || !settleAmount.trim()}
                    >
                      {isSettling ? "Recording..." : "Confirm Settlement"}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* ---------- Settlements Section ---------- */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Settlements</h2>

              {settlements.length === 0 ? (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon} aria-hidden>
                    {"\u{1F91D}"}
                  </span>
                  <p className={styles.emptyTitle}>No settlements yet</p>
                  <p className={styles.emptySubtitle}>
                    Settlements will appear here when members settle their
                    balances
                  </p>
                </div>
              ) : (
                <div className={styles.settlementList}>
                  {settlements.map((s) => (
                    <div key={s._id} className={styles.settlementCard}>
                      <div className={styles.settlementIcon}>
                        {"\u{1F91D}"}
                      </div>
                      <div className={styles.settlementInfo}>
                        <p className={styles.settlementText}>
                          <strong>
                            {getMemberDisplayName(s.paidBy)}
                          </strong>{" "}
                          paid{" "}
                          <strong>
                            {getMemberDisplayName(s.paidTo)}
                          </strong>
                        </p>
                        <div className={styles.settlementMeta}>
                          <span>
                            {formatDate(new Date(s.createdAt))}
                          </span>
                          {s.notes && (
                            <span className={styles.settlementNotes}>
                              {s.notes}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={styles.settlementAmount}>
                        {"\u20B9"}{s.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ---------- Members Section ---------- */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Members</h2>
                <button
                  className={styles.addMemberBtn}
                  onClick={() => {
                    setShowAddMember(!showAddMember);
                    setAddMemberError("");
                  }}
                >
                  {showAddMember ? "Cancel" : "+ Add Member"}
                </button>
              </div>

              {/* Inline Add Member Form */}
              {showAddMember && (
                <form className={styles.addMemberForm} onSubmit={handleAddMember}>
                  {addMemberError && (
                    <div
                      style={{
                        color: "var(--color-error, #ef4444)",
                        background: "var(--color-error-bg, #fef2f2)",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {addMemberError}
                    </div>
                  )}
                  <div className={styles.addMemberRow}>
                    <input
                      type="email"
                      className={styles.addMemberInput}
                      placeholder="Enter email address"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                    />
                    <button
                      type="submit"
                      className={styles.addMemberSubmit}
                      disabled={isAddingMember || !memberEmail.trim()}
                    >
                      {isAddingMember ? "Adding..." : "Add"}
                    </button>
                  </div>
                </form>
              )}

              {/* Members List */}
              <div className={styles.memberList}>
                {group?.members.map((member) => (
                  <div key={member.userId.id} className={styles.memberCard}>
                    <div className={styles.memberAvatar}>
                      {getMemberDisplayName(member.userId)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className={styles.memberInfo}>
                      <p className={styles.memberName}>
                        {getMemberDisplayName(member.userId)}
                      </p>
                      <p className={styles.memberEmail}>
                        {member.userId.email}
                      </p>
                    </div>
                    <span
                      className={`${styles.roleBadge} ${
                        member.role === "admin"
                          ? styles.roleBadgeAdmin
                          : styles.roleBadgeMember
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ---------- Expenses Section ---------- */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Expenses</h2>

              {expenses.length === 0 ? (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon} aria-hidden>
                    {"\u{1F9FE}"}
                  </span>
                  <p className={styles.emptyTitle}>No expenses yet</p>
                  <p className={styles.emptySubtitle}>
                    Add your first group expense to get started
                  </p>
                </div>
              ) : (
                <div className={styles.expenseList}>
                  {expenses.map((expense) => (
                    <div key={expense._id} className={styles.expenseCard}>
                      {/* Category Icon */}
                      <div className={styles.categoryIcon}>
                        <span aria-hidden>
                          {getCategoryEmoji(expense.category ?? "other")}
                        </span>
                      </div>

                      {/* Info */}
                      <div className={styles.expenseInfo}>
                        <p className={styles.expenseTitle}>{expense.title}</p>
                        <div className={styles.expenseMeta}>
                          <span className={styles.expenseCategory}>
                            {expense.category ?? "Other"}
                          </span>
                          <span>
                            {formatDate(new Date(expense.createdAt))}
                          </span>
                          <span className={styles.paidBy}>
                            Paid by {getMemberDisplayName(expense.paidBy)}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <span className={styles.expenseAmount}>
                        {"\u20B9"}{expense.amount.toFixed(2)}
                      </span>

                      {/* Delete */}
                      <button
                        className={styles.expenseDelete}
                        onClick={() => handleDelete(expense)}
                        aria-label={`Delete ${expense.title}`}
                        title="Delete expense"
                      >
                        {"\u2715"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* ---------- FAB ---------- */}
      <Link
        href={`/dashboard/groups/${groupId}/expenses/new`}
        className={styles.fab}
      >
        <span aria-hidden>+</span> Add expense
      </Link>

      {/* ---------- Delete Confirmation Dialog ---------- */}
      {deleteTarget && (
        <div className={styles.dialogOverlay} onClick={cancelDelete}>
          <div
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.dialogTitle}>Delete Expense</h2>
            <p className={styles.dialogMessage}>
              Are you sure you want to delete &ldquo;{deleteTarget.title}
              &rdquo;? This action cannot be undone.
            </p>
            <div className={styles.dialogActions}>
              <button
                className={styles.dialogCancel}
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.dialogConfirm}
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
