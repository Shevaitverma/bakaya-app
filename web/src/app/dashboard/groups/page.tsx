"use client";

import Link from "next/link";
import { useGroups } from "@/lib/queries";
import { Skeleton } from "@/components/Skeleton";
import styles from "./page.module.css";

const AVATAR_PALETTE = [
  "#D81B60",
  "#F4511E",
  "#8E24AA",
  "#3949AB",
  "#00897B",
  "#43A047",
  "#FB8C00",
  "#6D4C41",
];

function getMemberInitial(member: { userId: { email: string } }): string {
  const email = member.userId?.email ?? "";
  return (email.charAt(0) || "?").toUpperCase();
}

function getAvatarColor(index: number): string {
  return AVATAR_PALETTE[index % AVATAR_PALETTE.length];
}

export default function GroupsPage() {
  const { data, isLoading } = useGroups();
  const groups = data?.groups ?? [];

  return (
    <div className={styles.page}>
      {/* ---------- Pink Header ---------- */}
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>My Groups</h1>
        <Link href="/dashboard/groups/new" className={styles.newButton}>
          <span className={styles.newButtonPlus}>+</span>
          <span>New</span>
        </Link>
      </header>

      {/* ---------- Content Sheet ---------- */}
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.groupsList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={styles.groupCard}
                style={{ pointerEvents: "none" }}
              >
                <Skeleton width={56} height={56} borderRadius="14px" />
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <Skeleton width="50%" height={16} />
                  <Skeleton width="70%" height={12} />
                  <Skeleton width="40%" height={12} />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>&#128101;</p>
            <p className={styles.emptyTitle}>No groups yet</p>
            <p className={styles.emptySubtitle}>
              Create a group to split expenses with friends, family, or
              roommates.
            </p>
            <Link href="/dashboard/groups/new" className={styles.emptyAction}>
              + Create your first group
            </Link>
          </div>
        ) : (
          <div className={styles.groupsList}>
            {groups.map((group) => {
              const memberCount = group.members.length;
              const avatarMembers = group.members.slice(0, 3);

              return (
                <Link
                  key={group._id}
                  href={`/dashboard/groups/${group._id}`}
                  className={styles.groupCard}
                >
                  <div className={styles.groupIcon} aria-hidden="true">
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                        fill="#6366F1"
                      />
                    </svg>
                  </div>

                  <div className={styles.groupInfo}>
                    <p className={styles.groupName}>{group.name}</p>
                    {group.description && (
                      <p className={styles.groupDescription}>
                        {group.description}
                      </p>
                    )}
                    <div className={styles.memberRow}>
                      <div className={styles.avatarStack}>
                        {avatarMembers.map((member, idx) => (
                          <div
                            key={member.userId.id ?? idx}
                            className={styles.memberAvatar}
                            style={{ backgroundColor: getAvatarColor(idx) }}
                          >
                            {getMemberInitial(member)}
                          </div>
                        ))}
                      </div>
                      <span className={styles.memberCount}>
                        {memberCount}{" "}
                        {memberCount === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </div>

                  <span className={styles.chevron} aria-hidden="true">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
