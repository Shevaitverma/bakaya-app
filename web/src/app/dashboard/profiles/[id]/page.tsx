"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { profilesApi } from "@/lib/api/profiles";
import { expensesApi, type Expense } from "@/lib/api/expenses";
import { ApiError, clearToken } from "@/lib/api-client";
import type { Profile } from "@/types/profile";
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

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileData, expenseData] = await Promise.all([
          profilesApi.getProfile(profileId),
          expensesApi.list({ limit: 100, profileId } as Parameters<typeof expensesApi.list>[0]),
        ]);
        setProfile(profileData);
        setExpenses(expenseData.expenses);
        setTotalAmount(expenseData.totalExpenseAmount);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem("bakaya_user");
          clearToken();
          router.push("/login");
          return;
        }
        // graceful fallback
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [profileId, router]);

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await expensesApi.delete(deleteTarget._id);
      setExpenses((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      setTotalAmount((prev) => prev - deleteTarget.amount);
      setDeleteTarget(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem("bakaya_user");
        clearToken();
        router.push("/login");
        return;
      }
      if (error instanceof ApiError) {
        setDeleteError(error.message);
      } else {
        setDeleteError("Failed to delete expense");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p className={styles.loadingText}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            {profile?.name ?? "Profile"}
            {profile?.isDefault && (
              <span className={styles.defaultBadge} style={{ marginLeft: "0.5rem" }}>
                Default
              </span>
            )}
          </h1>
          {profile?.relationship && (
            <p style={{ color: "var(--color-text-secondary)", textTransform: "capitalize", marginTop: "0.25rem" }}>
              {profile.relationship}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Link
            href={`/dashboard/profiles/${profileId}/edit`}
            className={styles.editBtn}
            title="Edit profile"
            style={{ fontSize: "1.125rem", padding: "0.375rem 0.625rem" }}
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

      {/* Total */}
      <div style={{
        padding: "1rem 1.25rem",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        marginBottom: "1.5rem",
      }}>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
          Total Spent
        </p>
        <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          &#8377;{totalAmount.toLocaleString("en-IN")}
        </p>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No expenses for this profile</p>
          <p className={styles.emptySubtitle}>Add an expense to start tracking</p>
        </div>
      ) : (
        <div className={styles.profilesGrid} style={{ gridTemplateColumns: "1fr" }}>
          {expenses.map((expense) => (
            <div key={expense._id} className={styles.profileCard} style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{expense.title}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    {expense.category} &middot; {formatDate(expense.createdAt)}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                  &#8377;{expense.amount.toLocaleString("en-IN")}
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
  );
}
