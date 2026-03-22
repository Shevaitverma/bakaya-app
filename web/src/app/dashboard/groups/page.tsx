"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, clearToken } from "@/lib/api-client";
import { groupsApi, type Group } from "@/lib/api/groups";
import styles from "./page.module.css";

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    groupsApi
      .list()
      .then((data) => setGroups(data.groups))
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem("bakaya_user");
          clearToken();
          router.push("/login");
          return;
        }
        setGroups([]);
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Groups</h1>
        <Link href="/dashboard/groups/new" className={styles.createBtn}>
          + New Group
        </Link>
      </div>

      {isLoading ? (
        <p className={styles.loadingText}>Loading groups...</p>
      ) : groups.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>&#128101;</p>
          <p className={styles.emptyTitle}>No groups yet</p>
          <p className={styles.emptySubtitle}>Create a group to start splitting expenses</p>
          <Link href="/dashboard/groups/new" className={styles.emptyAction}>
            Create Group
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
              <p className={styles.groupName}>{group.name}</p>
              {group.description && (
                <p className={styles.groupDescription}>{group.description}</p>
              )}
              <span className={styles.groupMembers}>
                {group.members.length} {group.members.length === 1 ? "member" : "members"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
