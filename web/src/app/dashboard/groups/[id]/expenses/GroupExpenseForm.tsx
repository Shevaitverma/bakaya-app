"use client";

import { useState, useRef, useEffect } from "react";
import { ApiError } from "@/lib/api-client";
import { formatCurrencyExact } from "@/utils/currency";
import type { Category } from "@/lib/api/categories";
import type { Group, GroupExpense, GroupExpenseSplit } from "@/lib/api/groups";
import styles from "./new/page.module.css";

export interface GroupExpenseFormValues {
  title: string;
  amount: number;
  category: string;
  notes?: string;
  paidBy: string;
  splitAmong: GroupExpenseSplit[];
}

interface GroupExpenseFormProps {
  group: Group;
  categories: Category[];
  /** When set, the form starts prefilled from this expense (edit mode). */
  initial?: GroupExpense;
  isPending: boolean;
  submitLabel: string;
  /** Called with validated values; throw ApiError to surface a server error. */
  onSubmit: (values: GroupExpenseFormValues) => Promise<void>;
}

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

export function GroupExpenseForm({
  group,
  categories,
  initial,
  isPending,
  submitLabel,
  onSubmit,
}: GroupExpenseFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    category?: string;
    paidBy?: string;
    splitAmong?: string;
    server?: string;
  }>({});

  const [paidBy, setPaidBy] = useState(initial?.paidBy.id ?? "");

  // An initial expense whose splits are all (near-)equal reads as an equal
  // split; anything else starts in exact mode with the amounts prefilled.
  const initialAmounts = initial?.splitAmong.map((s) => s.amount) ?? [];
  const initialIsEqual =
    !initial ||
    initialAmounts.every((a) => Math.abs(a - (initialAmounts[0] ?? 0)) < 0.02);

  const [splitType, setSplitType] = useState<"equal" | "exact" | "percentage">(
    initialIsEqual ? "equal" : "exact"
  );
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    () =>
      new Set(
        initial
          ? initial.splitAmong.map((s) => s.userId)
          : group.members.map((m) => m.userId.id)
      )
  );
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>(() =>
    initial && !initialIsEqual
      ? Object.fromEntries(initial.splitAmong.map((s) => [s.userId, String(s.amount)]))
      : {}
  );
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);

  // New expense: default "paid by" to the logged-in user (from localStorage)
  useEffect(() => {
    if (initial) return;
    try {
      const stored = localStorage.getItem("bakaya_user");
      if (stored) {
        const user = JSON.parse(stored);
        setPaidBy(user.id || user._id || "");
      }
    } catch {
      // layout handles auth redirect
    }
  }, [initial]);

  // Close dropdown on outside click
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
        // Clean up custom amounts when deselecting
        setExactAmounts((ea) => { const n = { ...ea }; delete n[memberId]; return n; });
        setPercentages((p) => { const n = { ...p }; delete n[memberId]; return n; });
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

  /** Handle exact amount input change for a member */
  const handleExactAmountChange = (memberId: string, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    if ((cleaned.match(/\./g) || []).length > 1) return;
    setExactAmounts((prev) => ({ ...prev, [memberId]: cleaned }));
    if (errors.splitAmong) {
      setErrors((prev) => ({ ...prev, splitAmong: undefined }));
    }
  };

  /** Handle percentage input change for a member */
  const handlePercentageChange = (memberId: string, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    if ((cleaned.match(/\./g) || []).length > 1) return;
    setPercentages((prev) => ({ ...prev, [memberId]: cleaned }));
    if (errors.splitAmong) {
      setErrors((prev) => ({ ...prev, splitAmong: undefined }));
    }
  };

  /** Calculate totals for exact split mode */
  const getExactTotal = (): number => {
    return Array.from(selectedMembers).reduce((sum, id) => {
      const val = parseFloat(exactAmounts[id] || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  /** Calculate total percentage */
  const getPercentageTotal = (): number => {
    return Array.from(selectedMembers).reduce((sum, id) => {
      const val = parseFloat(percentages[id] || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  /** Get amount from percentage for a member */
  const getAmountFromPercentage = (memberId: string): number => {
    const total = parseFloat(amount);
    const pct = parseFloat(percentages[memberId] || "0");
    if (isNaN(total) || isNaN(pct) || total <= 0) return 0;
    return Math.round((total * pct) / 100 * 100) / 100;
  };

  /** Handle split type change, reset custom inputs */
  const handleSplitTypeChange = (type: "equal" | "exact" | "percentage") => {
    setSplitType(type);
    if (errors.splitAmong) {
      setErrors((prev) => ({ ...prev, splitAmong: undefined }));
    }
  };

  /** Calculate per-person amounts for equal split (Math.floor + remainder to first) */
  const getSplitAmounts = (): { base: number; first: number } => {
    const total = parseFloat(amount);
    if (isNaN(total) || total <= 0 || selectedMembers.size === 0)
      return { base: 0, first: 0 };
    const base = Math.floor((total * 100) / selectedMembers.size) / 100;
    const remainder = Math.round((total - base * selectedMembers.size) * 100) / 100;
    return { base, first: Math.round((base + remainder) * 100) / 100 };
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!amount.trim()) {
      newErrors.amount = "Amount is required";
    } else {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) {
        newErrors.amount = "Amount must be a positive number";
      }
    }

    if (!category.trim()) {
      newErrors.category = "Category is required";
    }

    if (!paidBy) {
      newErrors.paidBy = "Please select who paid";
    }

    if (selectedMembers.size === 0) {
      newErrors.splitAmong = "Select at least one member to split with";
    } else if (splitType === "exact") {
      const total = parseFloat(amount);
      if (!isNaN(total) && total > 0) {
        const exactTotal = getExactTotal();
        if (Math.abs(exactTotal - total) > 0.01) {
          newErrors.splitAmong = `Split amounts must equal the total. Currently ${formatCurrencyExact(exactTotal)} of ${formatCurrencyExact(total)} allocated.`;
        }
      }
    } else if (splitType === "percentage") {
      const pctTotal = getPercentageTotal();
      if (Math.abs(pctTotal - 100) > 0.01) {
        newErrors.splitAmong = `Percentages must add up to 100%. Currently ${pctTotal.toFixed(1)}% allocated.`;
      } else {
        // A 0% member would get a 0 split, which the server rejects.
        const hasEmpty = Array.from(selectedMembers).some((uid) => {
          const pct = parseFloat(percentages[uid] || "0");
          return isNaN(pct) || pct <= 0;
        });
        if (hasEmpty) {
          newErrors.splitAmong = "Every selected member needs a percentage greater than 0%.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    if (!validateForm()) return;

    setErrors({});

    const totalAmount = parseFloat(amount);
    const memberIds = Array.from(selectedMembers);

    let splitAmong: GroupExpenseSplit[];

    if (splitType === "exact") {
      splitAmong = memberIds.map((userId) => ({
        userId,
        amount: Math.round(parseFloat(exactAmounts[userId] || "0") * 100) / 100,
      }));
    } else if (splitType === "percentage") {
      // Convert percentages to amounts; handle rounding by assigning remainder to first member
      const rawAmounts = memberIds.map((userId) => {
        const pct = parseFloat(percentages[userId] || "0");
        return Math.floor((totalAmount * pct) / 100 * 100) / 100;
      });
      const rawTotal = rawAmounts.reduce((s, a) => s + a, 0);
      const diff = Math.round((totalAmount - rawTotal) * 100) / 100;
      splitAmong = memberIds.map((userId, idx) => ({
        userId,
        amount: idx === 0 ? Math.round((rawAmounts[idx]! + diff) * 100) / 100 : rawAmounts[idx]!,
      }));
    } else {
      // Equal split
      const splitPerPerson = Math.floor((totalAmount * 100) / memberIds.length) / 100;
      const remainder = Math.round((totalAmount - splitPerPerson * memberIds.length) * 100) / 100;
      splitAmong = memberIds.map((userId, idx) => ({
        userId,
        amount: idx === 0 ? Math.round((splitPerPerson + remainder) * 100) / 100 : splitPerPerson,
      }));
    }

    try {
      await onSubmit({
        title: title.trim(),
        amount: totalAmount,
        category: category.trim(),
        notes: notes.trim() || undefined,
        paidBy,
        splitAmong,
      });
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

  return (
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

      {/* Title */}
      <div className={styles.field}>
        <label htmlFor="title" className={styles.label}>
          Title
        </label>
        <input
          id="title"
          type="text"
          className={`${styles.input} ${
            errors.title ? styles.inputError : ""
          }`}
          placeholder="Enter expense title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title)
              setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          autoCapitalize="words"
        />
        {errors.title && (
          <span className={styles.errorText}>{errors.title}</span>
        )}
      </div>

      {/* Amount */}
      <div className={styles.field}>
        <label htmlFor="amount" className={styles.label}>
          Amount
        </label>
        <input
          id="amount"
          type="text"
          inputMode="decimal"
          className={`${styles.input} ${
            errors.amount ? styles.inputError : ""
          }`}
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => {
            const numericValue = e.target.value.replace(
              /[^0-9.]/g,
              ""
            );
            if ((numericValue.match(/\./g) || []).length > 1) return;
            setAmount(numericValue);
            if (errors.amount)
              setErrors((prev) => ({ ...prev, amount: undefined }));
          }}
        />
        {errors.amount && (
          <span className={styles.errorText}>{errors.amount}</span>
        )}
      </div>

      {/* Category */}
      <div className={styles.field}>
        <label className={styles.label}>Category</label>
        <div className={styles.categoryDropdown} ref={dropdownRef}>
          <button
            type="button"
            className={`${styles.categoryTrigger} ${
              errors.category ? styles.categoryTriggerError : ""
            }`}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {category ? (
              <span className={styles.categorySelected}>
                <span aria-hidden>{categories.find((c) => c.name === category)?.emoji ?? "\u{1F4C4}"}</span>
                {category}
              </span>
            ) : (
              <span className={styles.categoryPlaceholder}>
                Select category
              </span>
            )}
            <span className={styles.categoryChevron} aria-hidden>
              {showDropdown ? "▲" : "▼"}
            </span>
          </button>

          {showDropdown && (
            <div className={styles.categoryList}>
              {categories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.categoryItem} ${
                      isSelected ? styles.categoryItemSelected : ""
                    }`}
                    onClick={() => handleCategorySelect(cat.name)}
                  >
                    <span className={styles.categoryItemContent}>
                      <span
                        className={`${styles.categoryItemIcon} ${
                          isSelected
                            ? styles.categoryItemIconSelected
                            : ""
                        }`}
                      >
                        <span aria-hidden>
                          {cat.emoji}
                        </span>
                      </span>
                      <span
                        className={`${styles.categoryItemText} ${
                          isSelected
                            ? styles.categoryItemTextSelected
                            : ""
                        }`}
                      >
                        {cat.name}
                      </span>
                    </span>
                    {isSelected && (
                      <span
                        className={styles.categoryCheck}
                        aria-hidden
                      >
                        {"✓"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {errors.category && (
          <span className={styles.errorText}>{errors.category}</span>
        )}
      </div>

      {/* Paid By */}
      <div className={styles.field}>
        <label htmlFor="paidBy" className={styles.label}>
          Paid by
        </label>
        <select
          id="paidBy"
          className={`${styles.select} ${
            errors.paidBy ? styles.inputError : ""
          }`}
          value={paidBy}
          onChange={(e) => {
            setPaidBy(e.target.value);
            if (errors.paidBy)
              setErrors((prev) => ({ ...prev, paidBy: undefined }));
          }}
        >
          <option value="">Select who paid</option>
          {group.members.map((member) => (
            <option key={member.userId.id} value={member.userId.id}>
              {getMemberDisplayName(member.userId)}
            </option>
          ))}
        </select>
        {errors.paidBy && (
          <span className={styles.errorText}>{errors.paidBy}</span>
        )}
      </div>

      {/* Split Between */}
      <div className={styles.field}>
        <div className={styles.splitHeader}>
          <label className={styles.label}>Split between</label>
          <div className={styles.splitActions}>
            <button
              type="button"
              className={styles.splitToggle}
              onClick={selectAllMembers}
            >
              All
            </button>
            <button
              type="button"
              className={styles.splitToggle}
              onClick={deselectAllMembers}
            >
              None
            </button>
          </div>
        </div>

        {/* Split type tabs */}
        <div className={styles.splitTypeTabs}>
          {(["equal", "exact", "percentage"] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`${styles.splitTypeTab} ${
                splitType === type ? styles.splitTypeTabActive : ""
              }`}
              onClick={() => handleSplitTypeChange(type)}
            >
              {type === "equal"
                ? "Equal"
                : type === "exact"
                ? "Exact"
                : "Percentage"}
            </button>
          ))}
        </div>

        <div className={styles.memberCheckboxList}>
          {(() => {
            const selectedArr = Array.from(selectedMembers);
            return group.members.map((member) => {
              const isChecked = selectedMembers.has(member.userId.id);
              const isFirst = selectedArr[0] === member.userId.id;
              const memberAmount = isFirst ? splitAmounts.first : splitAmounts.base;
              return (
                <label
                  key={member.userId.id}
                  className={`${styles.memberCheckbox} ${
                    isChecked ? styles.memberCheckboxChecked : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={isChecked}
                    onChange={() => toggleMember(member.userId.id)}
                  />
                  <div className={styles.checkboxAvatar}>
                    {getMemberDisplayName(member.userId)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className={styles.checkboxInfo}>
                    <span className={styles.checkboxName}>
                      {getMemberDisplayName(member.userId)}
                    </span>

                    {/* Equal mode: show calculated amount */}
                    {splitType === "equal" && isChecked && memberAmount > 0 && (
                      <span className={styles.checkboxAmount}>
                        {formatCurrencyExact(memberAmount)}
                      </span>
                    )}

                    {/* Exact mode: show amount input */}
                    {splitType === "exact" && isChecked && (
                      <div className={styles.splitInputGroup}>
                        <span className={styles.splitInputSuffix}>{"₹"}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={styles.splitInlineInput}
                          placeholder="0.00"
                          value={exactAmounts[member.userId.id] || ""}
                          onChange={(e) =>
                            handleExactAmountChange(
                              member.userId.id,
                              e.target.value
                            )
                          }
                          onClick={(e) => e.preventDefault()}
                        />
                      </div>
                    )}

                    {/* Percentage mode: show percentage input + calculated amount */}
                    {splitType === "percentage" && isChecked && (
                      <div className={styles.splitInputGroup}>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={styles.splitInlineInput}
                          placeholder="0"
                          value={percentages[member.userId.id] || ""}
                          onChange={(e) =>
                            handlePercentageChange(
                              member.userId.id,
                              e.target.value
                            )
                          }
                          onClick={(e) => e.preventDefault()}
                        />
                        <span className={styles.splitInputSuffix}>%</span>
                        {getAmountFromPercentage(member.userId.id) > 0 && (
                          <span className={styles.splitInputCalculated}>
                            ({formatCurrencyExact(getAmountFromPercentage(member.userId.id))})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                <div
                  className={`${styles.checkboxMark} ${
                    isChecked ? styles.checkboxMarkChecked : ""
                  }`}
                >
                  {isChecked ? "✓" : ""}
                </div>
              </label>
              );
            });
          })()}
        </div>

        {errors.splitAmong && (
          <span className={styles.errorText}>
            {errors.splitAmong}
          </span>
        )}

        {/* Allocation indicator for Equal mode */}
        {splitType === "equal" && splitAmounts.base > 0 && (
          <div className={styles.splitSummary}>
            {formatCurrencyExact(parseFloat(amount))} split equally
            among {selectedMembers.size}{" "}
            {selectedMembers.size === 1 ? "person" : "people"} ={" "}
            {formatCurrencyExact(splitAmounts.base)} each
            {splitAmounts.first !== splitAmounts.base && (
              <> (first person: {formatCurrencyExact(splitAmounts.first)})</>
            )}
          </div>
        )}

        {/* Allocation indicator for Exact mode */}
        {splitType === "exact" && selectedMembers.size > 0 && amount && parseFloat(amount) > 0 && (() => {
          const total = parseFloat(amount);
          const allocated = getExactTotal();
          const diff = Math.round((total - allocated) * 100) / 100;
          const isMatch = Math.abs(diff) <= 0.01;
          const isOver = diff < -0.01;
          return (
            <div
              className={`${styles.splitAllocationIndicator} ${
                isMatch
                  ? styles.splitAllocationOk
                  : isOver
                  ? styles.splitAllocationError
                  : styles.splitAllocationWarning
              }`}
            >
              {isMatch
                ? `${formatCurrencyExact(allocated)} of ${formatCurrencyExact(total)} allocated`
                : isOver
                ? `${formatCurrencyExact(Math.abs(diff))} over (allocated ${formatCurrencyExact(allocated)} of ${formatCurrencyExact(total)})`
                : `${formatCurrencyExact(diff)} remaining (allocated ${formatCurrencyExact(allocated)} of ${formatCurrencyExact(total)})`}
            </div>
          );
        })()}

        {/* Allocation indicator for Percentage mode */}
        {splitType === "percentage" && selectedMembers.size > 0 && (() => {
          const pctTotal = getPercentageTotal();
          const diff = Math.round((100 - pctTotal) * 100) / 100;
          const isMatch = Math.abs(diff) <= 0.01;
          const isOver = diff < -0.01;
          return (
            <div
              className={`${styles.splitAllocationIndicator} ${
                isMatch
                  ? styles.splitAllocationOk
                  : isOver
                  ? styles.splitAllocationError
                  : styles.splitAllocationWarning
              }`}
            >
              {isMatch
                ? `${pctTotal.toFixed(1)}% of 100% allocated`
                : isOver
                ? `${Math.abs(diff).toFixed(1)}% over (${pctTotal.toFixed(1)}% of 100%)`
                : `${diff.toFixed(1)}% remaining (${pctTotal.toFixed(1)}% of 100%)`}
            </div>
          );
        })()}
      </div>

      {/* Notes */}
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

      {/* Submit */}
      <button
        type="submit"
        className="btn-primary"
        disabled={isPending}
      >
        {isPending ? <span className={styles.spinner} /> : submitLabel}
      </button>
    </form>
  );
}
