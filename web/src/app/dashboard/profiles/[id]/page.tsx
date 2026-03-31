"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { expensesApi, type Expense } from "@/lib/api/expenses";
import { useProfile, useExpenses, useDeleteExpense } from "@/lib/queries";
import { formatCurrency } from "@/utils/currency";
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

  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [dateStart, setDateStart] = useState<string | undefined>(undefined);
  const [dateEnd, setDateEnd] = useState<string | undefined>(undefined);

  const { data: profile } = useProfile(profileId);

  const expenseParams = useMemo(() => {
    const p: { limit: number; profileId: string; startDate?: string; endDate?: string } = {
      limit: 100,
      profileId,
    };
    if (dateStart) p.startDate = dateStart;
    if (dateEnd) p.endDate = dateEnd;
    return p;
  }, [profileId, dateStart, dateEnd]);

  const { data: expenseData, isLoading } = useExpenses(expenseParams);
  const expenses = expenseData?.expenses ?? [];
  const totalAmount = expenseData?.totalExpenseAmount ?? 0;

  const deleteExpenseMutation = useDeleteExpense();

  const confirmDelete = async () => {
    if (!deleteTarget || deleteExpenseMutation.isPending) return;
    setDeleteError("");
    try {
      await deleteExpenseMutation.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    } catch (error) {
      if (error instanceof ApiError) {
        setDeleteError(error.message);
      } else {
        setDeleteError("Failed to delete expense");
      }
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
              <button className={styles.dialogCancel} onClick={() => setDeleteTarget(null)} disabled={deleteExpenseMutation.isPending}>
                Cancel
              </button>
              <button className={styles.dialogConfirm} onClick={confirmDelete} disabled={deleteExpenseMutation.isPending}>
                {deleteExpenseMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
