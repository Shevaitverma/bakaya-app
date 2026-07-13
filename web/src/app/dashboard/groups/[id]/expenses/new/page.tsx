"use client";

import { useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGroup, useCategories, useCreateGroupExpense } from "@/lib/queries";
import { GroupExpenseForm } from "../GroupExpenseForm";
import styles from "./page.module.css";

export default function AddGroupExpensePage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const params = useParams();
  const groupId = params.id as string;

  const { data: group, isLoading: isGroupLoading } = useGroup(groupId);
  const { data: categories = [] } = useCategories();
  const createExpenseMutation = useCreateGroupExpense(groupId);

  return (
    <div className={styles.page}>
      {/* ---------- Header ---------- */}
      <header className={styles.header}>
        <button
          className="btn-back"
          onClick={() => router.push(`/dashboard/groups/${groupId}`)}
          aria-label="Go back"
        >
          &larr;
        </button>
        <h1 className={styles.headerTitle}>Add Group Expense</h1>
        <div className={styles.headerPlaceholder} />
      </header>

      {/* ---------- Form ---------- */}
      <div className={styles.formContainer}>
        {isGroupLoading || !group ? (
          <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
            Loading group details...
          </p>
        ) : (
          <GroupExpenseForm
            group={group}
            categories={categories}
            isPending={createExpenseMutation.isPending}
            submitLabel="Add Expense"
            onSubmit={async (values) => {
              await createExpenseMutation.mutateAsync(values);
              routerRef.current.push(`/dashboard/groups/${groupId}`);
            }}
          />
        )}
      </div>
    </div>
  );
}
