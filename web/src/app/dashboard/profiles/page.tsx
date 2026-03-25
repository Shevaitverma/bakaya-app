"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiError, clearAllAuth } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";
import { profilesApi } from "@/lib/api/profiles";
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
      .then((data) => setProfiles(data.profiles ?? []))
      .catch(() => setProfiles([]))
      .finally(() => setIsLoading(false));
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
          + New Profile
        </Link>
      </div>

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
        <div className={styles.profilesGrid}>
          {profiles.map((profile) => (
            <div key={profile._id} className={styles.profileCard}>
              <Link
                href={`/dashboard/profiles/${profile._id}`}
                className={styles.profileLink}
              >
                <div
                  className={styles.profileAvatar}
                  style={{ backgroundColor: profile.color || "var(--color-primary)" }}
                >
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.profileInfo}>
                  <p className={styles.profileName}>
                    {profile.name}
                    {profile.isDefault && (
                      <span className={styles.defaultBadge}>Default</span>
                    )}
                  </p>
                  {profile.relationship && (
                    <p className={styles.profileRelation}>{profile.relationship}</p>
                  )}
                </div>
              </Link>
              <Link
                href={`/dashboard/profiles/${profile._id}/edit`}
                className={styles.editBtn}
                title="Edit profile"
              >
                &#9998;
              </Link>
              {!profile.isDefault && (
                <button
                  className={styles.deleteBtn}
                  onClick={() => {
                    setDeleteTarget(profile);
                    setDeleteError("");
                  }}
                  title="Delete profile"
                >
                  &#10005;
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Manage Categories Link */}
      <div className={styles.accountSection} style={{ borderTop: "none", marginTop: "var(--spacing-md)", paddingTop: 0 }}>
        <Link
          href="/dashboard/categories"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            background: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            textDecoration: "none",
            color: "#1A1A2E",
            fontWeight: 600,
            fontSize: "15px",
            transition: "transform 200ms ease, box-shadow 200ms ease",
          }}
        >
          <span>Manage Categories</span>
          <span style={{ color: "#9CA3AF", fontSize: "1.25rem" }}>&rarr;</span>
        </Link>
      </div>

      {/* Account Section */}
      <div className={styles.accountSection}>
        <h2 className={styles.accountTitle}>Account</h2>
        <div className={styles.accountCard}>
          <div className={styles.accountInfo}>
            <div className={styles.accountAvatar}>
              {(userName || userEmail).charAt(0).toUpperCase()}
            </div>
            <div>
              {userName && <p className={styles.accountName}>{userName}</p>}
              {userEmail && <p className={styles.accountEmail}>{userEmail}</p>}
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>

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
  );
}
