"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/utils/format";
import { clearAllAuth, ApiError } from "@/lib/api-client";
import { expensesApi, type Expense } from "@/lib/api/expenses";
import { profilesApi } from "@/lib/api/profiles";
import type { Profile } from "@/types/profile";
import styles from "./page.module.css";

/** Emoji equivalents for category icons (matching mobile categoryIcons.ts) */
const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍽️",
  accessory: "📱",
  transport: "🚗",
  shopping: "🛍️",
  bills: "🧾",
  entertainment: "🎬",
  groceries: "🛒",
  healthcare: "💊",
  education: "🎓",
  travel: "✈️",
  utilities: "⚡",
  clothing: "👕",
  restaurant: "🍴",
  gas: "⛽",
  insurance: "🛡️",
  rent: "🏠",
  other: "📄",
};

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category.toLowerCase()] ?? "📄";
}

export default function ExpensesPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileFilter, setActiveProfileFilter] = useState<string | null>(null);

  // Fetch profiles once on mount
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const data = await profilesApi.getProfiles();
        setProfiles(data.profiles ?? []);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearAllAuth();
          routerRef.current.push("/login");
        }
      }
    }

    fetchProfiles();
  }, []);

  // Fetch expenses from API (re-runs when profile filter changes)
  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { limit: number; profileId?: string } = { limit: 100 };
      if (activeProfileFilter) {
        params.profileId = activeProfileFilter;
      }
      const data = await expensesApi.list(params);
      setExpenses(data.expenses);
      setTotalAmount(data.totalExpenseAmount);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAllAuth();
        routerRef.current.push("/login");
        return;
      }
      setExpenses([]);
      setTotalAmount(0);
    } finally {
      setIsLoading(false);
    }
  }, [activeProfileFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = (expense: Expense) => {
    setDeleteTarget(expense);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);

    try {
      await expensesApi.delete(deleteTarget._id);
      setExpenses((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      setTotalAmount((prev) => prev - deleteTarget.amount);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAllAuth();
        routerRef.current.push("/login");
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
          <h1 className={styles.headerTitle}>My Expense</h1>
          <div className={styles.totalRow}>
            <p className={styles.totalLabel}>Total amount</p>
            <p className={styles.totalValue}>
              ₹{totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className={styles.headerPlaceholder} />
      </header>

      {/* ---------- Profile Filter ---------- */}
      {profiles.length > 0 && (
        <div className={styles.filterRow}>
          <button
            className={`${styles.filterChip} ${
              activeProfileFilter === null ? styles.filterChipActive : ""
            }`}
            onClick={() => setActiveProfileFilter(null)}
          >
            All
          </button>
          {profiles.map((profile) => (
            <button
              key={profile._id}
              className={`${styles.filterChip} ${
                activeProfileFilter === profile._id
                  ? styles.filterChipActive
                  : ""
              }`}
              onClick={() => setActiveProfileFilter(profile._id)}
            >
              <span
                className={styles.filterChipDot}
                style={{
                  backgroundColor: profile.color || "var(--color-primary)",
                }}
              />
              {profile.name}
            </button>
          ))}
        </div>
      )}

      {/* ---------- Content ---------- */}
      <main className={styles.content}>
        {isLoading ? (
          <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
            Loading expenses...
          </p>
        ) : expenses.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden>
              🧾
            </span>
            <p className={styles.emptyTitle}>No expenses yet</p>
            <p className={styles.emptySubtitle}>
              Add your first expense to get started
            </p>
          </div>
        ) : (
          <div className={styles.expenseList}>
            {expenses.map((expense) => {
              const expenseProfile = expense.profileId
                ? profiles.find((p) => p._id === expense.profileId)
                : profiles.find((p) => p.isDefault);

              return (
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
                    <span>{formatDate(new Date(expense.createdAt))}</span>
                  </div>
                </div>

                {/* Amount */}
                <span className={styles.expenseAmount}>
                  ₹{expense.amount.toFixed(2)}
                </span>

                {/* Edit */}
                <Link
                  href={`/dashboard/expenses/${expense._id}/edit`}
                  className={styles.expenseEdit}
                  aria-label={`Edit ${expense.title}`}
                  title="Edit expense"
                >
                  &#9998;
                </Link>

                {/* Delete */}
                <button
                  className={styles.expenseDelete}
                  onClick={() => handleDelete(expense)}
                  aria-label={`Delete ${expense.title}`}
                  title="Delete expense"
                >
                  ✕
                </button>
              </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ---------- FAB ---------- */}
      <Link href="/dashboard/expenses/new" className={styles.fab}>
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
