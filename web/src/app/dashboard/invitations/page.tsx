"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import {
  useMyInvitations,
  useAcceptInvitation,
  useDeclineInvitation,
} from "@/lib/queries";
import type { GroupInvitation } from "@/lib/api/invitations";
import { Skeleton } from "@/components/Skeleton";
import styles from "./page.module.css";

function getInviterName(inv: GroupInvitation): string {
  const { firstName, lastName, email } = inv.invitedBy;
  const full = [firstName, lastName].filter(Boolean).join(" ").trim();
  return full || email;
}

export default function InvitationsPage() {
  const router = useRouter();
  const { data, isLoading } = useMyInvitations("pending");
  const invitations = data?.invitations ?? [];

  const acceptMutation = useAcceptInvitation();
  const declineMutation = useDeclineInvitation();

  const [actionError, setActionError] = useState("");
  const [successBanner, setSuccessBanner] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleAccept = async (invitationId: string) => {
    if (acceptMutation.isPending || declineMutation.isPending) return;
    setActionError("");
    setPendingId(invitationId);
    try {
      const result = await acceptMutation.mutateAsync(invitationId);
      const groupName = result?.group?.name ?? "group";
      const groupId = result?.group?._id;
      setSuccessBanner(`Joined ${groupName}! Redirecting...`);
      if (groupId) {
        window.setTimeout(() => {
          router.push(`/dashboard/groups/${groupId}`);
        }, 900);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setActionError(error.message);
      } else {
        setActionError("Unable to accept invitation. Please try again.");
      }
    } finally {
      setPendingId(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    if (acceptMutation.isPending || declineMutation.isPending) return;
    setActionError("");
    setPendingId(invitationId);
    try {
      await declineMutation.mutateAsync(invitationId);
      // Query invalidation removes the card automatically
    } catch (error) {
      if (error instanceof ApiError) {
        setActionError(error.message);
      } else {
        setActionError("Unable to decline invitation. Please try again.");
      }
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Invitations</h1>
        {invitations.length > 0 && (
          <span className={styles.headerCount}>
            {invitations.length} pending
          </span>
        )}
      </header>

      <div className={styles.content}>
        {successBanner && (
          <div className={styles.successBanner}>{successBanner}</div>
        )}
        {actionError && (
          <div className={styles.errorBanner}>{actionError}</div>
        )}

        {isLoading ? (
          <div className={styles.list}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.card} style={{ animation: "none" }}>
                <div className={styles.cardHeader}>
                  <Skeleton width={44} height={44} borderRadius="50%" />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="40%" height={12} />
                  </div>
                </div>
                <Skeleton width="100%" height={32} borderRadius={10} />
              </div>
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>&#128231;</p>
            <p className={styles.emptyTitle}>No pending invitations</p>
            <p className={styles.emptySubtitle}>
              When someone invites you to a group, it will show up here.
            </p>
          </div>
        ) : (
          <div className={styles.list}>
            {invitations.map((inv) => {
              const inviterName = getInviterName(inv);
              const isRowPending = pendingId === inv._id;
              const disabled =
                isRowPending ||
                acceptMutation.isPending ||
                declineMutation.isPending;
              return (
                <div key={inv._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.groupIcon} aria-hidden>
                      &#128101;
                    </div>
                    <div className={styles.cardMeta}>
                      <p className={styles.groupName}>{inv.groupId.name}</p>
                      <p className={styles.invitedBy}>
                        Invited by {inviterName}
                      </p>
                    </div>
                  </div>
                  {inv.message && (
                    <p className={styles.message}>&ldquo;{inv.message}&rdquo;</p>
                  )}
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.declineBtn}
                      onClick={() => handleDecline(inv._id)}
                      disabled={disabled}
                    >
                      {isRowPending && declineMutation.isPending
                        ? "Declining..."
                        : "Decline"}
                    </button>
                    <button
                      type="button"
                      className={styles.acceptBtn}
                      onClick={() => handleAccept(inv._id)}
                      disabled={disabled}
                    >
                      {isRowPending && acceptMutation.isPending
                        ? "Accepting..."
                        : "Accept"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
