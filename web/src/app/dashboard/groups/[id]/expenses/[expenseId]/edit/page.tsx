"use client";

import { useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  useGroup,
  useCategories,
  useGroupExpense,
  useUpdateGroupExpense,
} from "@/lib/queries";
import { GroupExpenseForm } from "../../GroupExpenseForm";
import styles from "../../new/page.module.css";

export default function EditGroupExpensePage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const params = useParams();
  const groupId = params.id as string;
  const expenseId = params.expenseId as string;

  const { data: group, isLoading: isGroupLoading } = useGroup(groupId);
  const { data: categories = [] } = useCategories();
  const { data: expense, isLoading: isExpenseLoading } = useGroupExpense(
    groupId,
    expenseId
  );
  const updateExpenseMutation = useUpdateGroupExpense(groupId, expenseId);

  const isLoading = isGroupLoading || isExpenseLoading;

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
        <h1 className={styles.headerTitle}>Edit Group Expense</h1>
        <div className={styles.headerPlaceholder} />
      </header>

      {/* ---------- Form ---------- */}
      <div className={styles.formContainer}>
        {isLoading || !group ? (
          <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
            Loading expense...
          </p>
        ) : !expense ? (
          <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
            Expense not found.
          </p>
        ) : (
          <GroupExpenseForm
            group={group}
            categories={categories}
            initial={expense}
            isPending={updateExpenseMutation.isPending}
            submitLabel="Save changes"
            onSubmit={async (values) => {
              await updateExpenseMutation.mutateAsync(values);
              routerRef.current.push(`/dashboard/groups/${groupId}`);
            }}
          />
        )}
      </div>
    </div>
  );
}
