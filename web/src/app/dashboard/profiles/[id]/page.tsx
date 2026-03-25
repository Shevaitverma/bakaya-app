"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { profilesApi } from "@/lib/api/profiles";
import { expensesApi, type Expense } from "@/lib/api/expenses";
import { formatCurrency } from "@/utils/currency";
import type { Profile } from "@/types/profile";
import DateRangePicker from "@/components/DateRangePicker";
import styles from "../page.module.css";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [dateStart, setDateStart] = useState<string | undefined>(undefined);
  const [dateEnd, setDateEnd] = useState<string | undefined>(undefined);

  // Fetch profile info once on mount
  useEffect(() => {
    profilesApi
      .getProfile(profileId)
      .then((profileData) => setProfile(profileData))
      .catch(() => {
        // Swallow — session-expired redirect is handled centrally by api-client
      });
  }, [profileId]);

  // Fetch expenses (re-runs when date range changes)
  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: {
        limit: number;
        profileId: string;
        startDate?: string;
        endDate?: string;
      } = { limit: 100, profileId };
      if (dateStart) params.startDate = dateStart;
      if (dateEnd) params.endDate = dateEnd;
      const expenseData = await expensesApi.list(params);
      setExpenses(expenseData.expenses);
      setTotalAmount(expenseData.totalExpenseAmount);
    } catch {
      setExpenses([]);
      setTotalAmount(0);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, dateStart, dateEnd]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await expensesApi.delete(deleteTarget._id);
      setExpenses((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      if ((deleteTarget as any).type !== "income") {
        setTotalAmount((prev) => prev - deleteTarget.amount);
      }
      setDeleteTarget(null);
    } catch (error) {
      if (error instanceof ApiError) {
        setDeleteError(error.message);
      } else {
        setDeleteError("Failed to delete expense");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            {profile?.name ?? "Profile"}
            {profile?.isDefault && (
              <span className={styles.defaultBadge} style={{ marginLeft: "0.5rem", background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                Default
              </span>
            )}
          </h1>
          {profile?.relationship && (
            <p style={{ color: "rgba(255,255,255,0.75)", textTransform: "capitalize", marginTop: "0.25rem" }}>
              {profile.relationship}
            </p>
          )}
        </div>
        <div className={styles.detailHeaderActions}>
          <Link
            href={`/dashboard/profiles/${profileId}/edit`}
            className={styles.editBtn}
            title="Edit profile"
            style={{ fontSize: "1.125rem", padding: "0.375rem 0.625rem", color: "#fff" }}
          >
            &#9998;
          </Link>
          <Link
            href={`/dashboard/expenses/new?profileId=${profileId}`}
            className={styles.createBtn}
          >
            + Add Expense
          </Link>
        </div>
      </div>

      <div className={styles.contentSheet}>
      {/* Total */}
      <div className={styles.totalCard}>
        <p className={styles.totalCardLabel}>
          Total Spent
        </p>
        <p className={styles.totalCardValue}>
          {formatCurrency(totalAmount)}
        </p>
      </div>

      {/* Date Range Picker */}
      <div className={styles.datePickerSection}>
        <DateRangePicker
          onChange={(startDate, endDate) => {
            setDateStart(startDate);
            setDateEnd(endDate);
          }}
        />
      </div>

      {/* Expenses List */}
      {isLoading ? (
        <p className={styles.loadingText}>Loading expenses...</p>
      ) : expenses.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No expenses for this profile</p>
          <p className={styles.emptySubtitle}>Add an expense to start tracking</p>
        </div>
      ) : (
        <div className={styles.profilesGrid} style={{ gridTemplateColumns: "1fr" }}>
          {expenses.map((expense) => (
            <div key={expense._id} className={`${styles.profileCard} ${styles.expenseRow}`}>
              <div className={styles.expenseRowInfo}>
                <div>
                  <p className={styles.expenseRowTitle}>{expense.title}</p>
                  <p className={styles.expenseRowMeta}>
                    {expense.category} &middot; {formatDate(expense.createdAt)}
                  </p>
                </div>
              </div>
              <div className={styles.expenseRowActions}>
                <span className={styles.expenseRowAmount}>
                  {formatCurrency(expense.amount)}
                </span>
                <Link
                  href={`/dashboard/expenses/${expense._id}/edit`}
                  className={styles.editBtn}
                  title="Edit"
                >
                  &#9998;
                </Link>
                <button
                  className={styles.deleteBtn}
                  onClick={() => { setDeleteTarget(expense); setDeleteError(""); }}
                  title="Delete"
                >
                  &#10005;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className={styles.dialogOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.dialogTitle}>Delete Expense</h2>
            <p className={styles.dialogMessage}>
              Delete &ldquo;{deleteTarget.title}&rdquo;? This cannot be undone.
            </p>
            {deleteError && (
              <p className={styles.dialogError}>{deleteError}</p>
            )}
            <div className={styles.dialogActions}>
              <button className={styles.dialogCancel} onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Cancel
              </button>
              <button className={styles.dialogConfirm} onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
