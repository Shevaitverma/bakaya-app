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
} from "@/lib/api/groups";
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

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<GroupExpense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");

  // Auth guard: redirect to login if not logged in
  useEffect(() => {
    const stored = localStorage.getItem("bakaya_user");
    if (!stored) {
      router.push("/login");
      return;
    }
    try {
      JSON.parse(stored);
      setIsAuthChecked(true);
    } catch {
      localStorage.removeItem("bakaya_user");
      clearToken();
      router.push("/login");
    }
  }, [router]);

  // Fetch group and expenses in parallel
  useEffect(() => {
    if (!isAuthChecked) return;

    async function fetchData() {
      try {
        const [groupData, expensesData] = await Promise.all([
          groupsApi.get(groupId),
          groupsApi.getExpenses(groupId, { limit: 100 }),
        ]);
        setGroup(groupData);
        setExpenses(expensesData.expenses);
        setTotalAmount(expensesData.totalAmount);
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

  if (!isAuthChecked) {
    return null;
  }

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
                    <div style={{ color: "var(--color-error, #ef4444)", background: "var(--color-error-bg, #fef2f2)", padding: "0.75rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
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
                      {getMemberDisplayName(member.userId).charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.memberInfo}>
                      <p className={styles.memberName}>
                        {getMemberDisplayName(member.userId)}
                      </p>
                      <p className={styles.memberEmail}>{member.userId.email}</p>
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
                          <span>{formatDate(new Date(expense.createdAt))}</span>
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
