"use client";

import Link from "next/link";
import { useGroups } from "@/lib/queries";
import { Skeleton } from "@/components/Skeleton";
import styles from "./page.module.css";

export default function GroupsPage() {
  const { data, isLoading } = useGroups();
  const groups = data?.groups ?? [];

  return (
    <div className={styles.page}>
      {/* ---------- Pink Header ---------- */}
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>My Groups</h1>
        <Link href="/dashboard/groups/new" className="btn-header">
          + New Group
        </Link>
      </header>

      {/* ---------- Content Sheet ---------- */}
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.groupsGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.groupCard} style={{ pointerEvents: "none" }}>
                <Skeleton width={48} height={48} borderRadius="50%" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="80%" height={10} />
                  <Skeleton width="40%" height={10} />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>&#128101;</p>
            <p className={styles.emptyTitle}>No groups yet</p>
            <p className={styles.emptySubtitle}>Create a group to split expenses with friends, family, or roommates.</p>
            <Link href="/dashboard/groups/new" className={styles.emptyAction}>
              + Create your first group
            </Link>
          </div>
        ) : (
          <div className={styles.groupsGrid}>
            {groups.map((group) => (
              <Link
                key={group._id}
                href={`/dashboard/groups/${group._id}`}
                className={styles.groupCard}
              >
                <div className={styles.groupIcon}>&#128101;</div>
                <div className={styles.groupInfo}>
                  <p className={styles.groupName}>{group.name}</p>
                  {group.description && (
                    <p className={styles.groupDescription}>{group.description}</p>
                  )}
                  <span className={styles.groupMembers}>
                    {group.members.length} {group.members.length === 1 ? "member" : "members"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
