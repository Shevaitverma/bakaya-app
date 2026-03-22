"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { clearToken, ApiError } from "@/lib/api-client";
import { groupsApi, type Group } from "@/lib/api/groups";
import styles from "./page.module.css";

/** 17 categories matching the mobile app */
const CATEGORIES = [
  "Food",
  "Accessory",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Groceries",
  "Healthcare",
  "Education",
  "Travel",
  "Utilities",
  "Clothing",
  "Restaurant",
  "Gas",
  "Insurance",
  "Rent",
  "Other",
] as const;

/** Emoji equivalents for category icons */
const CATEGORY_EMOJI: Record<string, string> = {
  food: "\u{1F37D}\u{FE0F}",
  accessory: "\u{1F4F1}",
  transport: "\u{1F697}",
  shopping: "\u{1F6CD}\u{FE0F}",
  bills: "\u{1F9FE}",
  entertainment: "\u{1F3AC}",
  groceries: "\u{1F6D2}",
  healthcare: "\u{1F48A}",
  education: "\u{1F393}",
  travel: "\u{2708}\u{FE0F}",
  utilities: "\u{26A1}",
  clothing: "\u{1F455}",
  restaurant: "\u{1F374}",
  gas: "\u{26FD}",
  insurance: "\u{1F6E1}\u{FE0F}",
  rent: "\u{1F3E0}",
  other: "\u{1F4C4}",
};

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category.toLowerCase()] ?? "\u{1F4C4}";
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

export default function AddGroupExpensePage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    category?: string;
    paidBy?: string;
    splitAmong?: string;
    server?: string;
  }>({});
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Group data for member selection
  const [group, setGroup] = useState<Group | null>(null);
  const [isGroupLoading, setIsGroupLoading] = useState(true);

  // Paid by
  const [paidBy, setPaidBy] = useState("");

  // Split between
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auth guard: redirect to login if not logged in
  useEffect(() => {
    const stored = localStorage.getItem("bakaya_user");
    if (!stored) {
      router.push("/login");
      return;
    }
    try {
      const user = JSON.parse(stored);
      setIsAuthChecked(true);
      // Default paidBy to current user
      const userId = user.id || user._id || "";
      setPaidBy(userId);
    } catch {
      localStorage.removeItem("bakaya_user");
      clearToken();
      router.push("/login");
    }
  }, [router]);

  // Fetch group details
  useEffect(() => {
    if (!isAuthChecked) return;

    async function fetchGroup() {
      try {
        const groupData = await groupsApi.get(groupId);
        setGroup(groupData);
        // Select all members by default for splitting
        const allMemberIds = new Set(
          groupData.members.map((m) => m.userId.id)
        );
        setSelectedMembers(allMemberIds);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem("bakaya_user");
          clearToken();
          router.push("/login");
          return;
        }
      } finally {
        setIsGroupLoading(false);
      }
    }

    fetchGroup();
  }, [isAuthChecked, router, groupId]);

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
  };

  /** Calculate per-person amount for equal split */
  const perPersonAmount = (): number => {
    const total = parseFloat(amount);
    if (isNaN(total) || total <= 0 || selectedMembers.size === 0) return 0;
    return total / selectedMembers.size;
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    const totalAmount = parseFloat(amount);
    const splitPerPerson = totalAmount / selectedMembers.size;

    // Build splitAmong array
    const splitAmong = Array.from(selectedMembers).map((userId) => ({
      userId,
      amount: Math.round(splitPerPerson * 100) / 100,
    }));

    try {
      await groupsApi.createExpense(groupId, {
        title: title.trim(),
        amount: totalAmount,
        category: category.trim(),
        notes: notes.trim() || undefined,
        paidBy,
        splitAmong,
      });
      router.push(`/dashboard/groups/${groupId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          localStorage.removeItem("bakaya_user");
          clearToken();
          router.push("/login");
          return;
        }
        setErrors({ server: error.message });
      } else {
        setErrors({
          server: "Unable to connect to server. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setShowDropdown(false);
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  if (!isAuthChecked) {
    return null;
  }

  const ppAmount = perPersonAmount();

  return (
    <div className={styles.page}>
      {/* ---------- Header ---------- */}
      <header className={styles.header}>
        <button
          className={styles.backBtn}
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
        {isGroupLoading ? (
          <p
            style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}
          >
            Loading group details...
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
                      <span aria-hidden>{getCategoryEmoji(category)}</span>
                      {category}
                    </span>
                  ) : (
                    <span className={styles.categoryPlaceholder}>
                      Select category
                    </span>
                  )}
                  <span className={styles.categoryChevron} aria-hidden>
                    {showDropdown ? "\u25B2" : "\u25BC"}
                  </span>
                </button>

                {showDropdown && (
                  <div className={styles.categoryList}>
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          className={`${styles.categoryItem} ${
                            isSelected ? styles.categoryItemSelected : ""
                          }`}
                          onClick={() => handleCategorySelect(cat)}
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
                                {getCategoryEmoji(cat)}
                              </span>
                            </span>
                            <span
                              className={`${styles.categoryItemText} ${
                                isSelected
                                  ? styles.categoryItemTextSelected
                                  : ""
                              }`}
                            >
                              {cat}
                            </span>
                          </span>
                          {isSelected && (
                            <span
                              className={styles.categoryCheck}
                              aria-hidden
                            >
                              {"\u2713"}
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
                {group?.members.map((member) => (
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

              <div className={styles.splitTypeLabel}>
                Equal split
              </div>

              <div className={styles.memberCheckboxList}>
                {group?.members.map((member) => {
                  const isChecked = selectedMembers.has(member.userId.id);
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
                        {isChecked && ppAmount > 0 && (
                          <span className={styles.checkboxAmount}>
                            {"\u20B9"}{ppAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div
                        className={`${styles.checkboxMark} ${
                          isChecked ? styles.checkboxMarkChecked : ""
                        }`}
                      >
                        {isChecked ? "\u2713" : ""}
                      </div>
                    </label>
                  );
                })}
              </div>

              {errors.splitAmong && (
                <span className={styles.errorText}>
                  {errors.splitAmong}
                </span>
              )}

              {ppAmount > 0 && (
                <div className={styles.splitSummary}>
                  {"\u20B9"}{parseFloat(amount).toFixed(2)} split equally
                  among {selectedMembers.size}{" "}
                  {selectedMembers.size === 1 ? "person" : "people"} ={" "}
                  {"\u20B9"}{ppAmount.toFixed(2)} each
                </div>
              )}
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
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? <span className={styles.spinner} /> : "Add Expense"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
