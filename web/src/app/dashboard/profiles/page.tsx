"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient, useQueries } from "@tanstack/react-query";
import { ApiError, clearAllAuth } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";
import { profilesApi } from "@/lib/api/profiles";
import { expensesApi } from "@/lib/api/expenses";
import { useProfiles } from "@/lib/queries";
import { queryKeys } from "@/lib/queries";
import { formatCurrency } from "@/utils/currency";
import type { Profile } from "@/types/profile";
import { Skeleton } from "@/components/Skeleton";
import styles from "./page.module.css";

export default function ProfilesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    try {
      const userData = localStorage.getItem("bakaya_user");
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name || user.firstName || "");
        setUserEmail(user.email || "");
      }
    } catch {}
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    clearAllAuth();
    router.push("/login");
  };

  const { data: profiles = [], isLoading } = useProfiles();

  // Current month date range for per-month spending
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Fetch spending totals for each profile (current month)
  const totalsQueries = useQueries({
    queries: profiles.map((profile) => ({
      queryKey: queryKeys.expenses.list({ profileId: profile._id, limit: 1, startDate: monthStart, endDate: today }),
      queryFn: () => expensesApi.list({ profileId: profile._id, limit: 1, startDate: monthStart, endDate: today }),
      enabled: profiles.length > 0,
    })),
  });

  const profileTotals = useMemo(() => {
    const totals: Record<string, { totalSpent: number; balance: number }> = {};
    profiles.forEach((profile, index) => {
      const query = totalsQueries[index];
      if (query?.data) {
        totals[profile._id] = {
          totalSpent: query.data.totalExpenseAmount ?? 0,
          balance: query.data.balance ?? 0,
        };
      }
    });
    return totals;
  }, [profiles, totalsQueries]);

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      await profilesApi.deleteProfile(deleteTarget._id);
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all });
      setDeleteTarget(null);
    } catch (error) {
      if (error instanceof ApiError) {
        setDeleteError(error.message);
      } else {
        setDeleteError("Failed to delete profile");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Profiles</h1>
        <Link href="/dashboard/profiles/new" className="btn-header">
          + Add
        </Link>
      </div>

      <div className={styles.contentSheet}>
      {isLoading ? (
        <div className={styles.profilesList}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.profileCard} style={{ pointerEvents: "none" }}>
              <Skeleton width={44} height={44} borderRadius="50%" />
              <div className={styles.profileInfo} style={{ gap: 8 }}>
                <Skeleton width="55%" height={14} />
                <Skeleton width="35%" height={11} />
              </div>
              <div className={styles.profileRight}>
                <Skeleton width={50} height={10} />
                <Skeleton width={70} height={16} />
              </div>
            </div>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No profiles yet</p>
          <p className={styles.emptySubtitle}>
            Create profiles to track expenses per person
          </p>
          <Link href="/dashboard/profiles/new" className={styles.emptyAction}>
            Create Profile
          </Link>
        </div>
      ) : (
        <div className={styles.profilesList}>
          {profiles.map((profile, index) => {
            const relationship = profile.relationship
              ? profile.relationship.charAt(0).toUpperCase() + profile.relationship.slice(1)
              : "";
            const subtitle = profile.isDefault
              ? "PRIMARY ACCOUNT"
              : relationship
                ? `${relationship.toUpperCase()} GROUP`
                : "PERSONAL";

            return (
              <div key={profile._id}>
                <Link
                  href={`/dashboard/profiles/${profile._id}`}
                  className={`${styles.profileCard} ${profile.isDefault ? styles.profileCardDefault : ""}`}
                >
                  <div
                    className={styles.profileAvatar}
                    style={{ backgroundColor: profile.color || "var(--color-primary)" }}
                  >
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.profileInfo}>
                    <div className={styles.nameRow}>
                      <span className={styles.profileName}>{profile.name}</span>
                      {profile.isDefault && (
                        <span className={styles.defaultBadge}>DEFAULT</span>
                      )}
                      {relationship && !profile.isDefault && (
                        <span className={styles.relationshipBadge}>{relationship.toUpperCase()}</span>
                      )}
                    </div>
                    <span className={styles.profileSubtitle}>{subtitle}</span>
                  </div>
                  <div className={styles.profileRight}>
                    <span className={styles.profileRightLabel}>
                      BALANCE
                    </span>
                    {profileTotals[profile._id] ? (
                      <span className={`${styles.profileRightAmount} ${
                        profile.isDefault
                          ? styles.amountRed
                          : (profileTotals[profile._id]?.balance ?? 0) >= 0
                            ? styles.amountGreen
                            : styles.amountRed
                      }`}>
                        {profile.isDefault
                          ? formatCurrency(profileTotals[profile._id]?.totalSpent ?? 0)
                          : `${(profileTotals[profile._id]?.balance ?? 0) >= 0 ? "+" : "-"}${formatCurrency(Math.abs(profileTotals[profile._id]?.balance ?? 0))}`
                        }
                      </span>
                    ) : (
                      <span className={styles.profileRightAmount} style={{ color: "#9CA3AF" }}>...</span>
                    )}
                  </div>
                </Link>
                {index < profiles.length - 1 && !profile.isDefault && (
                  <div className={styles.profileDivider} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manage Categories Card */}
      <Link href="/dashboard/categories" className={styles.manageCategoriesCard}>
        <span className={styles.manageCategoriesIcon}>&#x1F3F7;</span>
        <span className={styles.manageCategoriesText}>Manage Categories</span>
        <span className={styles.manageCategoriesChevron}>&rsaquo;</span>
      </Link>

      {/* Account Settings Section */}
      <div className={styles.accountSection}>
        <h2 className={styles.accountTitle}>Account Settings</h2>
        <div className={styles.accountCard}>
          <div className={styles.accountRow}>
            <span className={styles.accountIconCircle}>&#x2709;</span>
            <div>
              <p className={styles.accountLabel}>EMAIL ADDRESS</p>
              <p className={styles.accountValue}>{userEmail || "Not set"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <button className={styles.signOutBtn} onClick={handleLogout}>
        <span className={styles.signOutIcon}>&#x2192;</span>
        Sign Out
      </button>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className={styles.dialogOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.dialogTitle}>Delete Profile</h2>
            <p className={styles.dialogMessage}>
              Are you sure you want to delete &ldquo;{deleteTarget.name}&rdquo;?
            </p>
            {deleteError && (
              <p className={styles.dialogError}>{deleteError}</p>
            )}
            <div className={styles.dialogActions}>
              <button
                className="btn-ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
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
    </div>
  );
}
