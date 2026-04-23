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
  useCreateSettlement,
  useSendInvitation,
  useGroupInvitations,
  useCancelInvitation,
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

/* ---------- Inline SVG Icons ---------- */

function IconChevronLeft({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconScale({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v18" />
      <path d="M5 21h14" />
      <path d="M5 7h14" />
      <path d="M5 7l-3 7a4 4 0 0 0 6 0z" />
      <path d="M19 7l-3 7a4 4 0 0 0 6 0z" />
    </svg>
  );
}

function IconHandshake({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 17l2 2a1 1 0 1 0 1.4-1.4" />
      <path d="M13 19l2 2a1 1 0 0 0 1.4-1.4l-3.5-3.5" />
      <path d="M15 17l2 2a1 1 0 0 0 1.4-1.4l-4-4" />
      <path d="M20 13l-2.5-2.5a2 2 0 0 0-3 0L13 12l-1-1a2 2 0 0 0-2.8 0L7 13" />
      <path d="M2 13l3 3 3-3" />
      <path d="M22 13l-3 3" />
    </svg>
  );
}

function IconUserPlus({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function IconPlus({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconTrash({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconReceipt({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 2h16v20l-3-2-3 2-2-2-2 2-3-2-3 2z" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function IconEnvelope({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </svg>
  );
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
  const settlements = settlementsData?.settlements ?? [];

  const isLoading = isGroupLoading || isExpensesLoading || isBalancesLoading || isSettlementsLoading;

  // Mutation hooks
  const deleteExpenseMutation = useDeleteGroupExpense(groupId);
  const sendInvitationMutation = useSendInvitation(groupId);
  const cancelInvitationMutation = useCancelInvitation(groupId);
  const createSettlementMutation = useCreateSettlement(groupId);

  // Pending invitations (for admin-only display)
  const { data: pendingInvitationsData } = useGroupInvitations(groupId, "pending");
  const pendingInvitations = pendingInvitationsData?.invitations ?? [];

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<GroupExpense | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // Invite member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [addMemberError, setAddMemberError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

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

  // Max absolute balance used to scale progress bars
  const maxBalance = useMemo(() => {
    if (balanceEntries.length === 0) return 0;
    return Math.max(...balanceEntries.map((e) => Math.abs(e.amount)));
  }, [balanceEntries]);

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
    if (sendInvitationMutation.isPending || !memberEmail.trim()) return;

    setAddMemberError("");
    setInviteSuccess("");

    const email = memberEmail.trim();
    const message = inviteMessage.trim();

    try {
      await sendInvitationMutation.mutateAsync({
        email,
        message: message || undefined,
      });
      setInviteSuccess(`Invitation sent to ${email}`);
      setMemberEmail("");
      setInviteMessage("");
    } catch (error) {
      if (error instanceof ApiError) {
        setAddMemberError(error.message);
      } else {
        setAddMemberError("Unable to send invitation. Please try again.");
      }
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (cancelInvitationMutation.isPending) return;
    const ok = window.confirm(
      `Cancel the pending invitation to ${email}?`
    );
    if (!ok) return;
    try {
      await cancelInvitationMutation.mutateAsync(invitationId);
    } catch (error) {
      if (error instanceof ApiError) {
        window.alert(error.message);
      } else {
        window.alert("Unable to cancel invitation. Please try again.");
      }
    }
  };

  /** Is the current user an admin of this group? */
  const isCurrentUserAdmin = useMemo(() => {
    if (!group || !currentUserId) return false;
    const self = group.members.find((m) => m.userId.id === currentUserId);
    return self?.role === "admin";
  }, [group, currentUserId]);

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

  // Helper: derive a stable pastel avatar color from a user id / name
  const AVATAR_COLORS: { bg: string; fg: string }[] = [
    { bg: "#FCE4EC", fg: "#D81B60" },
    { bg: "#E3F2FD", fg: "#1976D2" },
    { bg: "#E8F5E9", fg: "#2E7D32" },
    { bg: "#FFF3E0", fg: "#EF6C00" },
    { bg: "#EDE7F6", fg: "#5E35B1" },
    { bg: "#FFFDE7", fg: "#F9A825" },
    { bg: "#E0F2F1", fg: "#00796B" },
    { bg: "#FBE9E7", fg: "#D84315" },
  ];
  function avatarColorFor(seed: string): { bg: string; fg: string } {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return (
      AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? {
        bg: "#FCE4EC",
        fg: "#D81B60",
      }
    );
  }

  return (
    <div className={styles.page}>
      {/* ---------- Pink Header ---------- */}
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="Go back"
          type="button"
        >
          <IconChevronLeft size={22} />
        </button>

        <h1 className={styles.headerTitle}>
          {isLoading ? (
            <Skeleton width={140} height={22} />
          ) : (
            group?.name ?? "Group"
          )}
        </h1>

        <div className={styles.headerPlaceholder} />
      </header>

      {/* ---------- Content Sheet ---------- */}
      <main className={styles.content}>
        {isLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, s) => (
              <div key={s} className={styles.section}>
                <Skeleton width={140} height={16} style={{ marginBottom: 16 }} />
                <div className={styles.card}>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "14px 0",
                      }}
                    >
                      <Skeleton width={40} height={40} borderRadius={20} />
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <Skeleton width="50%" height={14} />
                        <Skeleton width="30%" height={10} />
                      </div>
                      <Skeleton width={60} height={16} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* ---------- Balances Section ---------- */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Balances</h2>
              </div>

              <div className={styles.card}>
                {balanceEntries.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon} aria-hidden>
                      <IconScale size={48} />
                    </div>
                    <p className={styles.emptyPrimary}>No balances yet</p>
                  </div>
                ) : (
                  <div className={styles.balanceList}>
                    {balanceEntries.map((entry, idx) => {
                      // entry.amount is the OTHER user's net balance from the server.
                      // Positive = they are owed money.
                      // Negative = they owe money.
                      const otherOwes = entry.amount < 0;
                      const myBalance =
                        balances?.balances[currentUserId] ?? 0;
                      // Show settle-up button when current user owes money
                      // and the other user is owed money
                      const canSettle = myBalance < 0 && entry.amount > 0;
                      const color = avatarColorFor(
                        entry.userId || entry.userName
                      );
                      const pct =
                        maxBalance > 0
                          ? Math.max(
                              6,
                              Math.round(
                                (Math.abs(entry.amount) / maxBalance) * 100
                              )
                            )
                          : 0;
                      const isLast = idx === balanceEntries.length - 1;
                      return (
                        <div
                          key={entry.userId}
                          className={`${styles.balanceRow} ${
                            isLast ? styles.rowLast : ""
                          }`}
                        >
                          <div className={styles.balanceRowTop}>
                            <div
                              className={styles.avatar}
                              style={{
                                background: color.bg,
                                color: color.fg,
                              }}
                              aria-hidden
                            >
                              {entry.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.balanceMain}>
                              <p className={styles.balanceName}>
                                {entry.userName}
                              </p>
                              {entry.amount === 0 ? (
                                <p className={styles.balanceSettled}>
                                  settled up
                                </p>
                              ) : otherOwes ? (
                                <p className={styles.balanceOwes}>
                                  owes {formatCurrencyExact(Math.abs(entry.amount))}
                                </p>
                              ) : (
                                <p className={styles.balanceGets}>
                                  gets back{" "}
                                  {formatCurrencyExact(Math.abs(entry.amount))}
                                </p>
                              )}
                            </div>
                            {canSettle && (
                              <button
                                type="button"
                                className={styles.pillBtn}
                                onClick={() => handleSettleUp(entry)}
                              >
                                Settle Up
                              </button>
                            )}
                          </div>
                          <div className={styles.progressTrack} aria-hidden>
                            <div
                              className={`${styles.progressFill} ${
                                otherOwes
                                  ? styles.progressNegative
                                  : styles.progressPositive
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Inline Settle Up Form */}
              {settleTarget && (
                <div className={styles.card} style={{ marginTop: 16 }}>
                  <h3 className={styles.settleFormTitle}>
                    Settle with {settleTarget.userName}
                  </h3>

                  {settleError && (
                    <div className={styles.inlineError}>{settleError}</div>
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
                        className={styles.textInput}
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
                        className={styles.textInput}
                        placeholder="e.g. Cash payment"
                        value={settleNotes}
                        onChange={(e) => setSettleNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={styles.settleFormActions}>
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={cancelSettle}
                      disabled={createSettlementMutation.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.pillBtn}
                      onClick={confirmSettle}
                      disabled={
                        createSettlementMutation.isPending ||
                        !settleAmount.trim()
                      }
                    >
                      {createSettlementMutation.isPending
                        ? "Recording..."
                        : "Confirm Settlement"}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* ---------- Settlements Section ---------- */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Settlements</h2>
              </div>

              <div className={styles.card}>
                {settlements.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon} aria-hidden>
                      <IconHandshake size={48} />
                    </div>
                    <p className={styles.emptyPrimary}>No settlements yet</p>
                    <p className={styles.emptySecondary}>
                      Settlements will appear here when members settle their
                      balances
                    </p>
                  </div>
                ) : (
                  <div className={styles.rowList}>
                    {settlements.map((s, idx) => {
                      const color = avatarColorFor(
                        getMemberDisplayName(s.paidBy)
                      );
                      const isLast = idx === settlements.length - 1;
                      return (
                        <div
                          key={s._id}
                          className={`${styles.row} ${
                            isLast ? styles.rowLast : ""
                          }`}
                        >
                          <div
                            className={styles.avatarSquare}
                            style={{ background: color.bg, color: color.fg }}
                            aria-hidden
                          >
                            <IconHandshake size={20} />
                          </div>
                          <div className={styles.rowMain}>
                            <p className={styles.rowTitle}>
                              <strong>
                                {getMemberDisplayName(s.paidBy)}
                              </strong>{" "}
                              paid{" "}
                              <strong>
                                {getMemberDisplayName(s.paidTo)}
                              </strong>
                            </p>
                            <div className={styles.rowMeta}>
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
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ---------- Members Section ---------- */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Members ({group?.members.length ?? 0})
                </h2>
                {isCurrentUserAdmin && (
                  <button
                    type="button"
                    className={styles.pillBtn}
                    onClick={() => {
                      setShowAddMember(!showAddMember);
                      setAddMemberError("");
                      setInviteSuccess("");
                    }}
                  >
                    <IconUserPlus size={14} />
                    <span>
                      {showAddMember ? "Cancel" : "Invite Member"}
                    </span>
                  </button>
                )}
              </div>

              <div className={styles.card}>
                {/* Inline Invite Member Form */}
                {showAddMember && (
                  <form
                    className={styles.addMemberForm}
                    onSubmit={handleAddMember}
                  >
                    {addMemberError && (
                      <div className={styles.inlineError}>{addMemberError}</div>
                    )}
                    {inviteSuccess && (
                      <div className={styles.inlineSuccess}>
                        {inviteSuccess}
                      </div>
                    )}
                    <div className={styles.addMemberRow}>
                      <input
                        type="email"
                        className={styles.textInput}
                        placeholder="Enter email address"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                      />
                      <button
                        type="submit"
                        className={styles.pillBtn}
                        disabled={
                          sendInvitationMutation.isPending ||
                          !memberEmail.trim()
                        }
                      >
                        {sendInvitationMutation.isPending
                          ? "Sending..."
                          : "Send Invite"}
                      </button>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <input
                        type="text"
                        className={styles.textInput}
                        placeholder="Optional message"
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                        maxLength={280}
                      />
                    </div>
                  </form>
                )}

                <div className={styles.rowList}>
                  {group?.members.map((member, idx) => {
                    const name = getMemberDisplayName(member.userId);
                    const color = avatarColorFor(member.userId.id || name);
                    const isLast = idx === (group?.members.length ?? 0) - 1;
                    const isSelf = member.userId.id === currentUserId;
                    const canRemove =
                      isCurrentUserAdmin && !isSelf; // existing behavior preserved — removal handler not present
                    return (
                      <div
                        key={member.userId.id}
                        className={`${styles.row} ${
                          isLast ? styles.rowLast : ""
                        }`}
                      >
                        <div
                          className={styles.avatar}
                          style={{
                            background: "#FCE4EC",
                            color: "#D81B60",
                          }}
                          aria-hidden
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.rowMain}>
                          <p className={styles.rowTitle}>{name}</p>
                          <p className={styles.rowSubtitle}>
                            {member.userId.email}
                          </p>
                        </div>
                        {canRemove && (
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label={`Remove ${name}`}
                            title="Remove member"
                            // Preserve existing behavior: no remove handler was
                            // wired up in the original file. Keeping the UI
                            // affordance visible to admins as restyled icon.
                          >
                            <IconTrash size={16} />
                          </button>
                        )}
                        <span
                          className={`${styles.roleBadge} ${
                            member.role === "admin"
                              ? styles.roleBadgeAdmin
                              : styles.roleBadgeMember
                          }`}
                        >
                          {member.role === "admin" ? "Admin" : "Member"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ---------- Pending Invitations Section (admin-only) ---------- */}
            {isCurrentUserAdmin && pendingInvitations.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    Pending Invitations ({pendingInvitations.length})
                  </h2>
                </div>

                <div className={styles.card}>
                  <div className={styles.rowList}>
                    {pendingInvitations.map((inv, idx) => {
                      const isLast = idx === pendingInvitations.length - 1;
                      return (
                        <div
                          key={inv._id}
                          className={`${styles.row} ${
                            isLast ? styles.rowLast : ""
                          }`}
                        >
                          <div
                            className={styles.avatarSquare}
                            style={{
                              background: "#FCE4EC",
                              color: "#D81B60",
                            }}
                            aria-hidden
                          >
                            <IconEnvelope size={18} />
                          </div>
                          <div className={styles.rowMain}>
                            <p className={styles.rowTitle}>
                              {inv.invitedEmail}
                            </p>
                            {inv.message ? (
                              <p
                                className={styles.rowSubtitle}
                                style={{ fontStyle: "italic" }}
                              >
                                &ldquo;{inv.message}&rdquo;
                              </p>
                            ) : (
                              <p className={styles.rowSubtitle}>
                                Awaiting response
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() =>
                              handleCancelInvitation(
                                inv._id,
                                inv.invitedEmail
                              )
                            }
                            disabled={cancelInvitationMutation.isPending}
                            aria-label={`Cancel invitation to ${inv.invitedEmail}`}
                            title="Cancel invitation"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ---------- Expenses Section ---------- */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Expenses</h2>
                <Link
                  href={`/dashboard/groups/${groupId}/expenses/new`}
                  className={styles.pillBtn}
                >
                  <IconPlus size={14} />
                  <span>Add Expense</span>
                </Link>
              </div>

              <div className={styles.card}>
                {expenses.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon} aria-hidden>
                      <IconReceipt size={48} />
                    </div>
                    <p className={styles.emptyPrimary}>No expenses yet</p>
                    <p className={styles.emptySecondary}>
                      Add your first group expense to get started
                    </p>
                  </div>
                ) : (
                  <div className={styles.rowList}>
                    {expenses.map((expense, idx) => {
                      const isLast = idx === expenses.length - 1;
                      const emoji =
                        categoriesMap[expense.category ?? ""]?.emoji;

                      // Net calculation (mirrors mobile renderExpenseItem)
                      const payerId =
                        (expense.paidBy as { id?: string; _id?: string })?.id ??
                        (expense.paidBy as { id?: string; _id?: string })?._id ??
                        "";
                      const isCurrentUserPayer =
                        !!currentUserId && payerId === currentUserId;
                      const payerLabel = isCurrentUserPayer
                        ? "You"
                        : getMemberDisplayName(expense.paidBy);
                      const userShare = currentUserId
                        ? expense.splitAmong?.find(
                            (s) => s.userId === currentUserId
                          )?.amount ?? 0
                        : 0;
                      const youPaid = isCurrentUserPayer ? expense.amount : 0;
                      const net = youPaid - userShare;
                      const involved = isCurrentUserPayer || userShare > 0;

                      let netLabel: string;
                      let netAmountText = "";
                      let netSign = "";
                      let netClass = styles.expenseNetNeutral;
                      if (!involved) {
                        netLabel = "not involved";
                        netClass = styles.expenseNetNeutral;
                      } else if (net > 0.01) {
                        netLabel = "you lent";
                        netAmountText = formatCurrency(net);
                        netSign = "+";
                        netClass = styles.expenseNetPositive;
                      } else if (net < -0.01) {
                        netLabel = "you owe";
                        netAmountText = formatCurrency(Math.abs(net));
                        netSign = "−"; // unicode minus sign
                        netClass = styles.expenseNetNegative;
                      } else {
                        netLabel = "settled";
                        netClass = styles.expenseNetNeutral;
                      }

                      return (
                        <div
                          key={expense._id}
                          className={`${styles.row} ${styles.expenseRow} ${
                            isLast ? styles.rowLast : ""
                          }`}
                        >
                          <div
                            className={styles.avatarSquare}
                            style={{
                              background: "#FCE4EC",
                              color: "#D81B60",
                            }}
                            aria-hidden
                          >
                            {emoji ? (
                              <span style={{ fontSize: 18 }}>{emoji}</span>
                            ) : (
                              <IconReceipt size={20} />
                            )}
                          </div>
                          <div className={styles.rowMain}>
                            <p className={styles.rowTitle}>{expense.title}</p>
                            <p className={styles.expensePayerLine}>
                              <strong>{payerLabel}</strong> paid{" "}
                              <strong>{formatCurrency(expense.amount)}</strong>
                            </p>
                            <p className={styles.expenseMeta}>
                              {formatDate(new Date(expense.createdAt))}
                            </p>
                          </div>
                          <div className={styles.expenseRight}>
                            {netAmountText ? (
                              <span
                                className={`${styles.expenseNetAmount} ${netClass}`}
                              >
                                {netSign}
                                {netAmountText}
                              </span>
                            ) : null}
                            <span
                              className={`${styles.expenseNetLabel} ${netClass}`}
                            >
                              {netLabel}
                            </span>
                            {expense.paidBy.id === currentUserId && (
                              <button
                                type="button"
                                className={styles.iconBtn}
                                onClick={() => handleDelete(expense)}
                                aria-label={`Delete ${expense.title}`}
                                title="Delete expense"
                              >
                                <IconTrash size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

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
              <div className={styles.inlineError}>{deleteError}</div>
            )}
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={cancelDelete}
                disabled={deleteExpenseMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
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
