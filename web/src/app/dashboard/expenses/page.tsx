"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/utils/format";
import { clearToken } from "@/lib/api-client";
import { expensesApi, type Expense } from "@/lib/api/expenses";
import { ApiError } from "@/lib/api-client";
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

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

  // Fetch expenses from API
  useEffect(() => {
    if (!isAuthChecked) return;

    async function fetchExpenses() {
      try {
        const data = await expensesApi.list({ limit: 100 });
        setExpenses(data.expenses);
        setTotalAmount(data.totalExpenseAmount);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem("bakaya_user");
          clearToken();
          router.push("/login");
          return;
        }
        setExpenses([]);
        setTotalAmount(0);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExpenses();
  }, [isAuthChecked, router]);

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
            ))}
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
