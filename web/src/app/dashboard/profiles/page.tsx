"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiError, clearAllAuth } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";
import { profilesApi } from "@/lib/api/profiles";
import { expensesApi } from "@/lib/api/expenses";
import { formatCurrency } from "@/utils/currency";
import type { Profile } from "@/types/profile";
import styles from "./page.module.css";

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [profileTotals, setProfileTotals] = useState<Record<string, { totalSpent: number; balance: number }>>({});

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

  useEffect(() => {
    profilesApi
      .getProfiles()
      .then(async (data) => {
        const profilesList = data.profiles ?? [];
        setProfiles(profilesList);
        setIsLoading(false);

        // Fetch totals for each profile sequentially to avoid rate limits
        const totals: Record<string, { totalSpent: number; balance: number }> = {};
        for (const profile of profilesList) {
          try {
            const expData = await expensesApi.list({ profileId: profile._id, limit: 1 });
            totals[profile._id] = {
              totalSpent: expData.totalExpenseAmount ?? 0,
              balance: expData.balance ?? 0,
            };
          } catch {
            // skip this profile
          }
        }
        setProfileTotals(totals);
      })
      .catch(() => {
        setProfiles([]);
        setIsLoading(false);
      });
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      await profilesApi.deleteProfile(deleteTarget._id);
      setProfiles((prev) => prev.filter((p) => p._id !== deleteTarget._id));
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
        <Link href="/dashboard/profiles/new" className={styles.createBtn}>
          + Add
        </Link>
      </div>

      <div className={styles.contentSheet}>
      {isLoading ? (
        <p className={styles.loadingText}>Loading profiles...</p>
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
                      {profile.isDefault ? "TOTAL SPENT" : "BALANCE"}
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
                className={styles.dialogCancel}
                onClick={() => setDeleteTarget(null)}
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
    </div>
  );
}
