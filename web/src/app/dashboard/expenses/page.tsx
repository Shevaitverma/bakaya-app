"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/utils/format";
import { formatCurrency, formatCurrencyExact } from "@/utils/currency";
import { expensesApi, type Expense, type ExpenseQueryParams } from "@/lib/api/expenses";
import { useProfiles, useCategoriesMap, useExpenses, useDeleteExpense } from "@/lib/queries";
import DateRangePicker from "@/components/DateRangePicker";
import styles from "./page.module.css";

const SOURCE_EMOJI: Record<string, string> = {
  salary: "\u{1F4B0}",
  freelance: "\u{1F4BB}",
  investment: "\u{1F4C8}",
  gift: "\u{1F381}",
  refund: "\u{1F504}",
  rental: "\u{1F3E0}",
  other: "\u{1F4B5}",
};

const SOURCE_COLORS: Record<string, string> = {
  salary: "rgba(16, 185, 129, 0.15)",
  freelance: "rgba(99, 102, 241, 0.15)",
  investment: "rgba(34, 197, 94, 0.15)",
  gift: "rgba(244, 63, 94, 0.15)",
  refund: "rgba(59, 130, 246, 0.15)",
  rental: "rgba(139, 92, 246, 0.15)",
  other: "rgba(16, 185, 129, 0.15)",
};

function getSourceEmoji(source: string): string {
  return SOURCE_EMOJI[source.toLowerCase()] ?? "\u{1F4B5}";
}

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source.toLowerCase()] ?? "rgba(16, 185, 129, 0.15)";
}

type TypeFilter = "all" | "expense" | "income";

export default function ExpensesPage() {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [activeProfileFilter, setActiveProfileFilter] = useState<string | null>(null);
  const [dateStartFilter, setDateStartFilter] = useState<string | undefined>(undefined);
  const [dateEndFilter, setDateEndFilter] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ---------- TanStack Query hooks ----------
  const { data: profiles = [] } = useProfiles();
  const { data: categoriesMap = {} } = useCategoriesMap();

  const params = useMemo(() => {
    const p: ExpenseQueryParams = { limit: 100 };
    if (typeFilter !== "all") p.type = typeFilter;
    if (searchQuery.trim()) p.search = searchQuery.trim();
    if (activeProfileFilter) p.profileId = activeProfileFilter;
    if (dateStartFilter) p.startDate = dateStartFilter;
    if (dateEndFilter) p.endDate = dateEndFilter;
    return p;
  }, [typeFilter, searchQuery, activeProfileFilter, dateStartFilter, dateEndFilter]);

  const { data: expenseData, isLoading } = useExpenses(params);
  const expenses = expenseData?.expenses ?? [];
  const totalAmount = expenseData?.totalExpenseAmount ?? 0;
  const totalIncome = expenseData?.totalIncome ?? 0;
  const totalExpenses = expenseData?.totalExpenses ?? 0;
  const balance = expenseData?.balance ?? 0;

  const deleteExpenseMutation = useDeleteExpense();
  const isDeleting = deleteExpenseMutation.isPending;

  const handleDelete = (expense: Expense) => {
    setDeleteTarget(expense);
  };

  const confirmDelete = () => {
    if (!deleteTarget || isDeleting) return;

    deleteExpenseMutation.mutate(deleteTarget._id, {
      onSettled: () => {
        setDeleteTarget(null);
      },
    });
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await expensesApi.exportCSV({
        startDate: dateStartFilter,
        endDate: dateEndFilter,
        type: typeFilter !== "all" ? typeFilter : undefined,
      });
    } catch {
      // Silently fail -- could show a toast in the future
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ---------- Header ---------- */}
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => router.push("/dashboard")}
          aria-label="Go back"
        >
          &larr;
        </button>

        <div className={styles.headerCenter}>
          <h1 className={styles.headerTitle}>My Transactions</h1>
          <div className={styles.totalRow}>
            <p className={styles.totalLabel}>Total amount</p>
            <p className={styles.totalValue}>
              {formatCurrencyExact(totalAmount)}
            </p>
          </div>
        </div>

        <div className={styles.headerPlaceholder} />
      </header>

      {/* ---------- Content Sheet ---------- */}
      <div className={styles.contentSheet}>
        {/* ---------- Summary Bar ---------- */}
        <div className={styles.summaryBar}>
          <div className={`${styles.summaryItem} ${styles.summaryItemIncome}`}>
            <span className={styles.summaryLabel}>Income</span>
            <span className={styles.summaryIncome}>{formatCurrency(totalIncome)}</span>
          </div>
          <div className={styles.summarySep} />
          <div className={`${styles.summaryItem} ${styles.summaryItemExpense}`}>
            <span className={styles.summaryLabel}>Expenses</span>
            <span className={styles.summaryExpense}>{formatCurrency(totalExpenses)}</span>
          </div>
          <div className={styles.summarySep} />
          <div className={`${styles.summaryItem} ${styles.summaryItemBalance}`}>
            <span className={styles.summaryLabel}>Balance</span>
            <span className={balance >= 0 ? styles.summaryBalancePositive : styles.summaryBalanceNegative}>
              {formatCurrency(Math.abs(balance))}
            </span>
          </div>
        </div>

        {/* ---------- Type Filter Tabs ---------- */}
        <div className={styles.typeFilterRow}>
          {(["all", "expense", "income"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              className={`${styles.typeFilterBtn} ${typeFilter === t ? styles.typeFilterBtnActive : ""}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === "all" ? "All" : t === "expense" ? "Expenses" : "Income"}
            </button>
          ))}
        </div>

        {/* ---------- Search & Export Row ---------- */}
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrap}>
            <span className={styles.searchIcon} aria-hidden>&#128269;</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search transactions..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                className={styles.searchClear}
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
              >
                &#10005;
              </button>
            )}
          </div>
          <button
            className={styles.exportBtn}
            onClick={handleExportCSV}
            disabled={isExporting}
            title="Export as CSV"
          >
            {isExporting ? "..." : "Export CSV"}
          </button>
        </div>

        {/* ---------- Profile Filter ---------- */}
        {profiles.length > 0 && (
          <div className={styles.filterRow}>
            <button
              className={`${styles.filterChip} ${
                activeProfileFilter === null ? styles.filterChipActive : ""
              }`}
              onClick={() => setActiveProfileFilter(null)}
            >
              All
            </button>
            {profiles.map((profile) => (
              <button
                key={profile._id}
                className={`${styles.filterChip} ${
                  activeProfileFilter === profile._id
                    ? styles.filterChipActive
                    : ""
                }`}
                onClick={() => setActiveProfileFilter(profile._id)}
              >
                <span
                  className={styles.filterChipDot}
                  style={{
                    backgroundColor: profile.color || "var(--color-primary)",
                  }}
                />
                {profile.name}
              </button>
            ))}
          </div>
        )}

        {/* ---------- Date Range Picker ---------- */}
        <div className={styles.content} style={{ paddingBottom: 0 }}>
          <DateRangePicker
            onChange={(startDate, endDate) => {
              setDateStartFilter(startDate);
              setDateEndFilter(endDate);
            }}
          />
        </div>

        {/* ---------- Content ---------- */}
        <main className={styles.content}>
        {isLoading ? (
          <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
            Loading transactions...
          </p>
        ) : expenses.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden>
              {"\u{1F9FE}"}
            </span>
            <p className={styles.emptyTitle}>No transactions yet</p>
            <p className={styles.emptySubtitle}>
              Add your first expense or income to get started
            </p>
          </div>
        ) : (
          <div className={styles.expenseList}>
            {expenses.map((expense, index) => {
              const isIncome = expense.type === "income";
              const expenseProfile = expense.profileId
                ? profiles.find((p) => p._id === expense.profileId)
                : profiles.find((p) => p.isDefault);

              const catEntry = categoriesMap[expense.category ?? ""];
              const emoji = isIncome
                ? getSourceEmoji(expense.source ?? "other")
                : (catEntry?.emoji ?? "\u{1F4C4}");
              const circleColor = isIncome
                ? getSourceColor(expense.source ?? "other")
                : (catEntry?.color ? `${catEntry.color}26` : "rgba(156, 163, 175, 0.15)");
              const label = isIncome
                ? (expense.source ?? "Income")
                : (expense.category ?? "Other");

              return (
              <div
                key={expense._id}
                className={`${styles.expenseCard} ${isIncome ? styles.expenseCardIncome : ""}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Category/Source Icon */}
                <div
                  className={styles.categoryIcon}
                  style={{ background: circleColor }}
                >
                  <span aria-hidden>{emoji}</span>
                </div>

                {/* Info */}
                <div className={styles.expenseInfo}>
                  <p className={styles.expenseTitle}>{expense.title}</p>
                  <div className={styles.expenseMeta}>
                    <span>{label}</span>
                    {expenseProfile && (
                      <>
                        <span className={styles.metaDot} />
                        <span className={styles.expenseProfile}>
                          <span
                            className={styles.expenseProfileDot}
                            style={{
                              backgroundColor:
                                expenseProfile.color || "var(--color-primary)",
                            }}
                          />
                          {expenseProfile.name}
                        </span>
                      </>
                    )}
                  </div>
                  <span className={styles.expenseDate}>
                    {formatDate(new Date(expense.createdAt))}
                  </span>
                </div>

                {/* Amount */}
                <span className={isIncome ? styles.incomeAmount : styles.expenseAmount}>
                  {isIncome ? "+" : ""}{formatCurrency(expense.amount)}
                </span>

                {/* Edit */}
                <Link
                  href={`/dashboard/expenses/${expense._id}/edit`}
                  className={styles.expenseEdit}
                  aria-label={`Edit ${expense.title}`}
                  title="Edit"
                >
                  &#9998;
                </Link>

                {/* Delete */}
                <button
                  className={styles.expenseDelete}
                  onClick={() => handleDelete(expense)}
                  aria-label={`Delete ${expense.title}`}
                  title="Delete"
                >
                  {"\u2715"}
                </button>
              </div>
              );
            })}
          </div>
        )}
      </main>
      </div>

      {/* ---------- FAB ---------- */}
      <Link href="/dashboard/expenses/new" className={styles.fab}>
        <span aria-hidden>+</span> Add expense
      </Link>

      {/* ---------- Delete Confirmation Dialog ---------- */}
      {deleteTarget && (
        <div className={styles.dialogOverlay} onClick={cancelDelete}>
          <div
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.dialogTitle}>Delete {deleteTarget.type === "income" ? "Income" : "Expense"}</h2>
            <p className={styles.dialogMessage}>
              Are you sure you want to delete &ldquo;{deleteTarget.title}
              &rdquo;? This action cannot be undone.
            </p>
            <div className={styles.dialogActions}>
              <button
                className={styles.dialogCancel}
                onClick={cancelDelete}
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
