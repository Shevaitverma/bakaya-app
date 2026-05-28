"use client";

// ux-audit BUG-W5 Critical: web had no edit-expense entry point or route.
// This page mirrors the "new" page's form but loads an existing expense and
// PUTs the changes via useUpdateGroupExpense. It reuses the existing CSS
// module from the sibling "new" route to stay design-consistent without
// duplicating styles.

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { formatCurrencyExact } from "@/utils/currency";
import {
  useGroup,
  useCategories,
  useGroupExpense,
  useUpdateGroupExpense,
} from "@/lib/queries";
import styles from "../../new/page.module.css";

function getMemberDisplayName(member: {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}): string {
  if (member.name) return member.name;
  if (member.firstName || member.lastName) {
    return [member.firstName, member.lastName].filter(Boolean).join(" ");
  }
  return member.email;
}

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

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    category?: string;
    paidBy?: string;
    splitAmong?: string;
    server?: string;
  }>({});

  const [paidBy, setPaidBy] = useState("");
  const [splitType, setSplitType] = useState<"equal" | "exact" | "percentage">(
    "equal"
  );
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Populate fields once expense loads
  useEffect(() => {
    if (!expense) return;
    setTitle(expense.title);
    setAmount(String(expense.amount));
    setCategory(expense.category ?? "");
    setNotes(expense.notes ?? "");
    setPaidBy(expense.paidBy.id);

    const memberIds = new Set(expense.splitAmong.map((s) => s.userId));
    setSelectedMembers(memberIds);

    const amounts = expense.splitAmong.map((s) => s.amount);
    const firstAmount = amounts[0] ?? 0;
    // Accept a small tolerance so equal splits don't read as exact (math-audit #2.3)
    const allEqual = amounts.every((a) => Math.abs(a - firstAmount) < 0.02);
    if (allEqual) {
      setSplitType("equal");
    } else {
      setSplitType("exact");
      const exactMap: Record<string, string> = {};
      expense.splitAmong.forEach((s) => {
        exactMap[s.userId] = String(s.amount);
      });
      setExactAmounts(exactMap);
    }
  }, [expense]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
        setExactAmounts((ea) => {
          const n = { ...ea };
          delete n[memberId];
          return n;
        });
        setPercentages((p) => {
          const n = { ...p };
          delete n[memberId];
          return n;
        });
      } else {
        next.add(memberId);
      }
      return next;
    });
    if (errors.splitAmong) {
      setErrors((prev) => ({ ...prev, splitAmong: undefined }));
    }
  };

  const selectAllMembers = () => {
    if (!group) return;
    setSelectedMembers(new Set(group.members.map((m) => m.userId.id)));
    if (errors.splitAmong) {
      setErrors((prev) => ({ ...prev, splitAmong: undefined }));
    }
  };

  const deselectAllMembers = () => {
    setSelectedMembers(new Set());
    setExactAmounts({});
    setPercentages({});
  };

  const handleExactAmountChange = (memberId: string, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    if ((cleaned.match(/\./g) || []).length > 1) return;
    setExactAmounts((prev) => ({ ...prev, [memberId]: cleaned }));
    if (errors.splitAmong) {
      setErrors((prev) => ({ ...prev, splitAmong: undefined }));
    }
  };

  const handlePercentageChange = (memberId: string, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    if ((cleaned.match(/\./g) || []).length > 1) return;
    setPercentages((prev) => ({ ...prev, [memberId]: cleaned }));
    if (errors.splitAmong) {
      setErrors((prev) => ({ ...prev, splitAmong: undefined }));
    }
  };

  const getExactTotal = (): number =>
    Array.from(selectedMembers).reduce((sum, id) => {
      const val = parseFloat(exactAmounts[id] || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

  const getPercentageTotal = (): number =>
    Array.from(selectedMembers).reduce((sum, id) => {
      const val = parseFloat(percentages[id] || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

  const getAmountFromPercentage = (memberId: string): number => {
    const total = parseFloat(amount);
    const pct = parseFloat(percentages[memberId] || "0");
    if (isNaN(total) || isNaN(pct) || total <= 0) return 0;
    return Math.round(((total * pct) / 100) * 100) / 100;
  };

  const handleSplitTypeChange = (
    next: "equal" | "exact" | "percentage"
  ) => {
    setSplitType(next);
    if (errors.splitAmong) {
      setErrors((prev) => ({ ...prev, splitAmong: undefined }));
    }
  };

  const getSplitAmounts = (): { base: number; first: number } => {
    const total = parseFloat(amount);
    if (isNaN(total) || total <= 0 || selectedMembers.size === 0)
      return { base: 0, first: 0 };
    const base = Math.floor((total * 100) / selectedMembers.size) / 100;
    const remainder =
      Math.round((total - base * selectedMembers.size) * 100) / 100;
    return {
      base,
      // math-audit #2.3 High: round base+remainder to avoid FP drift
      first: Math.round((base + remainder) * 100) / 100,
    };
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!title.trim()) newErrors.title = "Title is required";

    if (!amount.trim()) {
      newErrors.amount = "Amount is required";
    } else {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) {
        newErrors.amount = "Amount must be a positive number";
      }
    }

    if (!category.trim()) newErrors.category = "Category is required";
    if (!paidBy) newErrors.paidBy = "Please select who paid";

    if (selectedMembers.size === 0) {
      newErrors.splitAmong = "Select at least one member to split with";
    } else if (splitType === "exact") {
      const total = parseFloat(amount);
      if (!isNaN(total) && total > 0) {
        const exactTotal = getExactTotal();
        if (Math.abs(exactTotal - total) > 0.01) {
          newErrors.splitAmong = `Split amounts must equal the total. Currently ${formatCurrencyExact(
            exactTotal
          )} of ${formatCurrencyExact(total)} allocated.`;
        }
      }
    } else if (splitType === "percentage") {
      const pctTotal = getPercentageTotal();
      if (Math.abs(pctTotal - 100) > 0.01) {
        newErrors.splitAmong = `Percentages must add up to 100%. Currently ${pctTotal.toFixed(
          1
        )}% allocated.`;
      } else {
        // math-audit #2.9 High: every selected member must carry >0%
        const hasEmpty = Array.from(selectedMembers).some((uid) => {
          const pct = parseFloat(percentages[uid] || "0");
          return isNaN(pct) || pct <= 0;
        });
        if (hasEmpty) {
          newErrors.splitAmong =
            "Every selected member needs a percentage greater than 0%.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updateExpenseMutation.isPending) return;
    if (!validateForm()) return;

    setErrors({});

    const totalAmount = parseFloat(amount);
    const memberIds = Array.from(selectedMembers);

    let splitAmong: { userId: string; amount: number }[];

    if (splitType === "exact") {
      splitAmong = memberIds.map((userId) => ({
        userId,
        amount: Math.round(parseFloat(exactAmounts[userId] || "0") * 100) / 100,
      }));
    } else if (splitType === "percentage") {
      const rawAmounts = memberIds.map((userId) => {
        const pct = parseFloat(percentages[userId] || "0");
        return Math.floor(((totalAmount * pct) / 100) * 100) / 100;
      });
      const rawTotal = rawAmounts.reduce((s, a) => s + a, 0);
      const diff = Math.round((totalAmount - rawTotal) * 100) / 100;
      splitAmong = memberIds.map((userId, idx) => ({
        userId,
        amount:
          idx === 0
            ? Math.round((rawAmounts[idx]! + diff) * 100) / 100
            : rawAmounts[idx]!,
      }));
    } else {
      const splitPerPerson =
        Math.floor((totalAmount * 100) / memberIds.length) / 100;
      const remainder =
        Math.round((totalAmount - splitPerPerson * memberIds.length) * 100) /
        100;
      splitAmong = memberIds.map((userId, idx) => ({
        userId,
        amount:
          idx === 0
            ? Math.round((splitPerPerson + remainder) * 100) / 100
            : splitPerPerson,
      }));
    }

    try {
      await updateExpenseMutation.mutateAsync({
        title: title.trim(),
        amount: totalAmount,
        category: category.trim(),
        notes: notes.trim() || undefined,
        paidBy,
        splitAmong,
      });
      routerRef.current.push(`/dashboard/groups/${groupId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ server: error.message });
      } else {
        setErrors({
          server: "Unable to connect to server. Please try again.",
        });
      }
    }
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setShowDropdown(false);
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  const splitAmounts = getSplitAmounts();
  const isLoading = isGroupLoading || isExpenseLoading;

  return (
    <div className={styles.page}>
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

      <div className={styles.formContainer}>
        {isLoading ? (
          <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
            Loading expense...
          </p>
        ) : !expense ? (
          <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
            Expense not found.
          </p>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {errors.server && (
              <div
                style={{
                  color: "var(--color-error, #ef4444)",
                  background: "var(--color-error-bg, #fef2f2)",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                {errors.server}
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="title" className={styles.label}>
                Title
              </label>
              <input
                id="title"
                type="text"
                className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
                placeholder="Enter expense title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) {
                    setErrors((prev) => ({ ...prev, title: undefined }));
                  }
                }}
                autoCapitalize="words"
              />
              {errors.title && (
                <span className={styles.errorText}>{errors.title}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="amount" className={styles.label}>
                Amount
              </label>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                className={`${styles.input} ${errors.amount ? styles.inputError : ""}`}
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  let v = e.target.value.replace(/[^0-9.]/g, "");
                  const parts = v.split(".");
                  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
                  setAmount(v);
                  if (errors.amount) {
                    setErrors((prev) => ({ ...prev, amount: undefined }));
                  }
                }}
              />
              {errors.amount && (
                <span className={styles.errorText}>{errors.amount}</span>
              )}
            </div>

            {/* Category dropdown */}
            <div className={styles.field} ref={dropdownRef}>
              <label className={styles.label}>Category</label>
              <button
                type="button"
                className={`${styles.input} ${errors.category ? styles.inputError : ""}`}
                onClick={() => setShowDropdown((v) => !v)}
                style={{
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{category || "Select category"}</span>
                <span aria-hidden>▾</span>
              </button>
              {showDropdown && (
                <div
                  style={{
                    background: "var(--color-surface, #fff)",
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: "0.5rem",
                    marginTop: "0.25rem",
                    maxHeight: 240,
                    overflowY: "auto",
                    padding: "0.25rem 0",
                  }}
                >
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleCategorySelect(c.name)}
                      style={{
                        display: "flex",
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        padding: "0.5rem 0.75rem",
                        textAlign: "left",
                        cursor: "pointer",
                        gap: "0.5rem",
                      }}
                    >
                      <span>{c.emoji}</span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.category && (
                <span className={styles.errorText}>{errors.category}</span>
              )}
            </div>

            {/* Paid by */}
            <div className={styles.field}>
              <label htmlFor="paidBy" className={styles.label}>
                Paid by
              </label>
              <select
                id="paidBy"
                className={`${styles.input} ${errors.paidBy ? styles.inputError : ""}`}
                value={paidBy}
                onChange={(e) => {
                  setPaidBy(e.target.value);
                  if (errors.paidBy) {
                    setErrors((prev) => ({ ...prev, paidBy: undefined }));
                  }
                }}
              >
                {group?.members.map((m) => (
                  <option key={m.userId.id} value={m.userId.id}>
                    {getMemberDisplayName(m.userId)}
                  </option>
                ))}
              </select>
              {errors.paidBy && (
                <span className={styles.errorText}>{errors.paidBy}</span>
              )}
            </div>

            {/* Split section */}
            <div className={styles.field}>
              <label className={styles.label}>Split between</label>
              <div style={{ display: "flex", gap: "0.5rem", margin: "0.5rem 0" }}>
                <button
                  type="button"
                  onClick={() => handleSplitTypeChange("equal")}
                  className={splitType === "equal" ? "btn-primary" : "btn-secondary"}
                  style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem" }}
                >
                  Equal
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitTypeChange("exact")}
                  className={splitType === "exact" ? "btn-primary" : "btn-secondary"}
                  style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem" }}
                >
                  Exact
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitTypeChange("percentage")}
                  className={
                    splitType === "percentage" ? "btn-primary" : "btn-secondary"
                  }
                  style={{ padding: "0.25rem 0.75rem", fontSize: "0.875rem" }}
                >
                  Percentage
                </button>
                <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={selectAllMembers}
                    className="btn-secondary"
                    style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllMembers}
                    className="btn-secondary"
                    style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
                  >
                    None
                  </button>
                </div>
              </div>

              {splitType === "equal" && selectedMembers.size > 0 && (
                <p style={{ fontSize: "0.8125rem", opacity: 0.7, margin: "0.25rem 0 0.5rem" }}>
                  Each: {formatCurrencyExact(splitAmounts.base)} (first member:{" "}
                  {formatCurrencyExact(splitAmounts.first)})
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {group?.members.map((m) => {
                  const id = m.userId.id;
                  const checked = selectedMembers.has(id);
                  return (
                    <label
                      key={id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 0",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMember(id)}
                      />
                      <span style={{ flex: 1 }}>
                        {getMemberDisplayName(m.userId)}
                      </span>
                      {checked && splitType === "exact" && (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={exactAmounts[id] ?? ""}
                          onChange={(e) =>
                            handleExactAmountChange(id, e.target.value)
                          }
                          onClick={(e) => e.preventDefault()}
                          placeholder="0.00"
                          className={styles.input}
                          style={{ width: 100 }}
                        />
                      )}
                      {checked && splitType === "percentage" && (
                        <>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={percentages[id] ?? ""}
                            onChange={(e) =>
                              handlePercentageChange(id, e.target.value)
                            }
                            onClick={(e) => e.preventDefault()}
                            placeholder="0"
                            className={styles.input}
                            style={{ width: 60 }}
                          />
                          <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                            %{" "}
                            ({formatCurrencyExact(getAmountFromPercentage(id))})
                          </span>
                        </>
                      )}
                    </label>
                  );
                })}
              </div>

              {errors.splitAmong && (
                <span className={styles.errorText}>{errors.splitAmong}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="notes" className={styles.label}>
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Add any additional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={updateExpenseMutation.isPending}
            >
              {updateExpenseMutation.isPending ? (
                <span className={styles.spinner} />
              ) : (
                "Save changes"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
