"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { clearToken, ApiError } from "@/lib/api-client";
import { groupsApi } from "@/lib/api/groups";
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
    server?: string;
  }>({});
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auth guard: redirect to login if not logged in
  useEffect(() => {
    const stored = localStorage.getItem("bakaya_user");
    if (!stored) {
      router.push("/login");
      return;
    }
    try {
      JSON.parse(stored);
      setIsAuthChecked(true);
    } catch {
      localStorage.removeItem("bakaya_user");
      clearToken();
      router.push("/login");
    }
  }, [router]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await groupsApi.createExpense(groupId, {
        title: title.trim(),
        amount: parseFloat(amount),
        category: category.trim(),
        notes: notes.trim() || undefined,
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
        setErrors({ server: "Unable to connect to server. Please try again." });
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
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {errors.server && (
            <div style={{ color: "var(--color-error, #ef4444)", background: "var(--color-error-bg, #fef2f2)", padding: "0.75rem 1rem", borderRadius: "0.5rem", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
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
              className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
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
              className={`${styles.input} ${errors.amount ? styles.inputError : ""}`}
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9.]/g, "");
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
                className={`${styles.categoryTrigger} ${errors.category ? styles.categoryTriggerError : ""}`}
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
                        className={`${styles.categoryItem} ${isSelected ? styles.categoryItemSelected : ""}`}
                        onClick={() => handleCategorySelect(cat)}
                      >
                        <span className={styles.categoryItemContent}>
                          <span
                            className={`${styles.categoryItemIcon} ${isSelected ? styles.categoryItemIconSelected : ""}`}
                          >
                            <span aria-hidden>{getCategoryEmoji(cat)}</span>
                          </span>
                          <span
                            className={`${styles.categoryItemText} ${isSelected ? styles.categoryItemTextSelected : ""}`}
                          >
                            {cat}
                          </span>
                        </span>
                        {isSelected && (
                          <span className={styles.categoryCheck} aria-hidden>
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
      </div>
    </div>
  );
}
