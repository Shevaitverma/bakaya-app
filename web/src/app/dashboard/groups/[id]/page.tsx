"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { formatDate } from "@/utils/format";
import { formatCurrency, formatCurrencyExact } from "@/utils/currency";
import { ApiError } from "@/lib/api-client";
import type { GroupExpense, GroupBalances } from "@/lib/api/groups";
import {
  useGroup,
  useGroupExpenses,
  useGroupBalances,
  useGroupSettlements,
  useCategoriesMap,
  useDeleteGroupExpense,
  useAddMember,
  useCreateSettlement,
} from "@/lib/queries";
import { Skeleton } from "@/components/Skeleton";
import styles from "./page.module.css";

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

  // TanStack Query hooks for data fetching
  const { data: group, isLoading: isGroupLoading } = useGroup(groupId);
  const { data: expensesData, isLoading: isExpensesLoading } = useGroupExpenses(groupId);
  const { data: balances, isLoading: isBalancesLoading } = useGroupBalances(groupId);
  const { data: settlementsData, isLoading: isSettlementsLoading } = useGroupSettlements(groupId);
  const { data: categoriesMap = {} } = useCategoriesMap();

  const expenses = expensesData?.expenses ?? [];
  const totalAmount = expensesData?.totalAmount ?? 0;
  const settlements = settlementsData?.settlements ?? [];

  const isLoading = isGroupLoading || isExpensesLoading || isBalancesLoading || isSettlementsLoading;

  // Mutation hooks
  const deleteExpenseMutation = useDeleteGroupExpense(groupId);
  const addMemberMutation = useAddMember(groupId);
  const createSettlementMutation = useCreateSettlement(groupId);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<GroupExpense | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [addMemberError, setAddMemberError] = useState("");

  // Settle up state
  const [settleTarget, setSettleTarget] = useState<SettleUpTarget | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNotes, setSettleNotes] = useState("");
  const [settleError, setSettleError] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Read current user ID from localStorage (layout already guards auth)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bakaya_user");
      if (stored) {
        const user = JSON.parse(stored);
        setCurrentUserId(user.id || user._id || "");
      }
    } catch {
      // ignore — layout handles auth redirect
    }
  }, []);

  /** Resolve a userId to a display name using group members */
  function resolveUserName(userId: string): string {
    if (!group) return userId;
    const member = group.members.find((m) => m.userId.id === userId);
    if (member) return getMemberDisplayName(member.userId);
    return userId;
  }

  /** Build human-readable balance entries from the balances object */
  const balanceEntries = useMemo(() => {
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
  }, [balances, currentUserId, group]);

  const handleDelete = (expense: GroupExpense) => {
    setDeleteError("");
    setDeleteTarget(expense);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteExpenseMutation.isPending) return;
    setDeleteError("");

    try {
      await deleteExpenseMutation.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          setDeleteError("Only the expense creator can delete this expense.");
        } else {
          setDeleteError(error.message);
        }
      } else {
        setDeleteError("Unable to delete expense. Please try again.");
      }
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
    setDeleteError("");
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addMemberMutation.isPending || !memberEmail.trim()) return;

    setAddMemberError("");

    try {
      await addMemberMutation.mutateAsync(memberEmail.trim());
      setMemberEmail("");
      setShowAddMember(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setAddMemberError(error.message);
      } else {
        setAddMemberError("Unable to add member. Please try again.");
      }
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
    if (!settleTarget || createSettlementMutation.isPending) return;

    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) {
      setSettleError("Please enter a valid amount.");
      return;
    }

    setSettleError("");

    try {
      // Server requires paidBy === authenticated user, so current user is always the payer.
      // Settle up is only available when current user owes someone (negative balance).
      const paidBy = currentUserId;
      const paidTo = settleTarget.userId;

      await createSettlementMutation.mutateAsync({
        paidBy,
        paidTo,
        amount: amt,
        notes: settleNotes.trim() || undefined,
      });

      cancelSettle();
    } catch (error) {
      if (error instanceof ApiError) {
        setSettleError(error.message);
      } else {
        setSettleError("Unable to record settlement. Please try again.");
      }
    }
  };

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
            {isLoading ? <Skeleton width={120} height={24} /> : group?.name ?? "Group"}
          </h1>
          <div className={styles.totalRow}>
            <p className={styles.totalLabel}>Total expense</p>
            <p className={styles.totalValue}>
              {formatCurrencyExact(totalAmount)}
            </p>
          </div>
        </div>

        <div className={styles.headerPlaceholder} />
      </header>

      {/* ---------- Content ---------- */}
      <main className={styles.content}>
        {isLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, s) => (
              <div key={s} className={styles.section}>
                <Skeleton width={140} height={16} style={{ marginBottom: 16 }} />
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
                    <Skeleton width={44} height={44} borderRadius={12} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <Skeleton width="50%" height={14} />
                      <Skeleton width="30%" height={10} />
                    </div>
                    <Skeleton width={60} height={16} />
                  </div>
                ))}
              </div>
            ))}
          </>
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
                    // entry.amount is the OTHER user's net balance from the server.
                    // Positive = they are owed money (paid more than their share).
                    // Negative = they owe money (paid less than their share).
                    const otherOwes = entry.amount < 0; // other user has debt
                    const myBalance = balances?.balances[currentUserId] ?? 0;
                    // Show settle-up button only when current user owes money
                    // (negative balance) and the other user is owed money (positive balance)
                    const canSettle = myBalance < 0 && entry.amount > 0;
                    return (
                      <div key={entry.userId} className={styles.balanceCard}>
                        <div className={styles.balanceInfo}>
                          <div
                            className={`${styles.balanceIndicator} ${
                              otherOwes
                                ? styles.balanceIndicatorNegative
                                : styles.balanceIndicatorPositive
                            }`}
                          />
                          <div>
                            <p className={styles.balanceText}>
                              {otherOwes ? (
                                <>
                                  <strong>{entry.userName}</strong> owes
                                </>
                              ) : (
                                <>
                                  <strong>{entry.userName}</strong> is owed
                                </>
                              )}
                            </p>
                            <p
                              className={`${styles.balanceAmount} ${
                                otherOwes
                                  ? styles.balanceAmountNegative
                                  : styles.balanceAmountPositive
                              }`}
                            >
                              {formatCurrencyExact(Math.abs(entry.amount))}
                            </p>
                          </div>
                        </div>
                        {canSettle ? (
                          <button
                            className={`btn-outline-accent ${styles.settleBtnGreen}`}
                            onClick={() => handleSettleUp(entry)}
                          >
                            Settle Up
                          </button>
                        ) : otherOwes ? (
                          <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>
                            Awaiting their payment
                          </span>
                        ) : null}
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
                      className="btn-ghost"
                      onClick={cancelSettle}
                      disabled={createSettlementMutation.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={confirmSettle}
                      disabled={createSettlementMutation.isPending || !settleAmount.trim()}
                    >
                      {createSettlementMutation.isPending ? "Recording..." : "Confirm Settlement"}
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
                        {formatCurrencyExact(s.amount)}
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
                  className="btn-outline-accent"
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
                      disabled={addMemberMutation.isPending || !memberEmail.trim()}
                    >
                      {addMemberMutation.isPending ? "Adding..." : "Add"}
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
                          {categoriesMap[expense.category ?? ""]?.emoji ?? "\u{1F4C4}"}
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
                        {formatCurrency(expense.amount)}
                      </span>

                      {/* Delete (only visible for expenses the current user created) */}
                      {expense.paidBy.id === currentUserId && (
                        <button
                          className={styles.expenseDelete}
                          onClick={() => handleDelete(expense)}
                          aria-label={`Delete ${expense.title}`}
                          title="Delete expense"
                        >
                          {"\u2715"}
                        </button>
                      )}
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
        className="btn-fab"
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
            {deleteError && (
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
                {deleteError}
              </div>
            )}
            <div className={styles.dialogActions}>
              <button
                className="btn-ghost"
                onClick={cancelDelete}
                disabled={deleteExpenseMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={confirmDelete}
                disabled={deleteExpenseMutation.isPending}
              >
                {deleteExpenseMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
