"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { useProfiles, useCategories, useCreateExpense } from "@/lib/queries";
import styles from "./page.module.css";

const INCOME_SOURCES = [
  "Salary",
  "Freelance",
  "Investment",
  "Gift",
  "Refund",
  "Rental",
  "Other",
] as const;

const SOURCE_EMOJI: Record<string, string> = {
  salary: "\u{1F4B0}",
  freelance: "\u{1F4BB}",
  investment: "\u{1F4C8}",
  gift: "\u{1F381}",
  refund: "\u{1F504}",
  rental: "\u{1F3E0}",
  other: "\u{1F4B5}",
};

function getSourceEmoji(source: string): string {
  return SOURCE_EMOJI[source.toLowerCase()] ?? "\u{1F4B5}";
}

export default function AddExpensePage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const searchParams = useSearchParams();
  const queryProfileId = searchParams.get("profileId") || "";
  const queryType = searchParams.get("type") === "income" ? "income" : "expense";

  const [entryType, setEntryType] = useState<"expense" | "income">(queryType);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState(queryProfileId);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    category?: string;
    source?: string;
    profile?: string;
    server?: string;
  }>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const isIncome = entryType === "income";

  const { data: profiles = [] } = useProfiles();
  const { data: categories = [] } = useCategories();
  const createExpense = useCreateExpense();

  // Pre-select default profile (unless query param already set)
  const hasSetDefault = useRef(false);
  useEffect(() => {
    if (hasSetDefault.current || profiles.length === 0) return;
    if (!queryProfileId || !profiles.some((p) => p._id === queryProfileId)) {
      const defaultProfile = profiles.find((p) => p.isDefault);
      if (defaultProfile) setSelectedProfileId(defaultProfile._id);
    }
    hasSetDefault.current = true;
  }, [profiles, queryProfileId]);

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

    if (isIncome) {
      if (!source.trim()) {
        newErrors.source = "Source is required";
      }
    } else {
      if (!category.trim()) {
        newErrors.category = "Category is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createExpense.isPending) return;
    if (!validateForm()) return;

    setErrors({});

    try {
      await createExpense.mutateAsync({
        title: title.trim(),
        amount: parseFloat(amount),
        type: entryType,
        profileId: isIncome ? undefined : (selectedProfileId || undefined),
        category: isIncome ? undefined : category.trim(),
        source: isIncome ? source.trim() : undefined,
        notes: notes.trim() || undefined,
      });
      routerRef.current.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ server: error.message });
      } else {
        setErrors({ server: "Unable to connect to server. Please try again." });
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

  const handleSourceSelect = (src: string) => {
    setSource(src);
    setShowDropdown(false);
    if (errors.source) {
      setErrors((prev) => ({ ...prev, source: undefined }));
    }
  };

  return (
    <div className={`${styles.page} ${isIncome ? styles.pageIncome : ""}`}>
      {/* ---------- Header ---------- */}
      <header className={`${styles.header} ${isIncome ? styles.headerIncome : ""}`}>
        <button
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="Go back"
        >
          &larr;
        </button>
        <h1 className={styles.headerTitle}>
          {isIncome ? "Add Income" : "Add Expense"}
        </h1>
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

          {/* Type Toggle */}
          <div className={styles.typeToggle}>
            <button
              type="button"
              className={`${styles.typeBtn} ${!isIncome ? styles.typeBtnActiveExpense : ""}`}
              onClick={() => setEntryType("expense")}
            >
              Expense
            </button>
            <button
              type="button"
              className={`${styles.typeBtn} ${isIncome ? styles.typeBtnActiveIncome : ""}`}
              onClick={() => setEntryType("income")}
            >
              Income
            </button>
          </div>

          {/* Profile Selector (only for expenses) */}
          {!isIncome && profiles.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Who is this for?</label>
              <div className={styles.profileChipsRow}>
                {profiles.map((profile) => (
                  <button
                    key={profile._id}
                    type="button"
                    className={`${styles.profileChip} ${
                      selectedProfileId === profile._id ? styles.profileChipActive : ""
                    }`}
                    onClick={() => setSelectedProfileId(profile._id)}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: profile.color || "var(--color-primary)",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    {profile.name}
                  </button>
                ))}
              </div>
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
              placeholder={isIncome ? "Enter income title" : "Enter expense title"}
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

          {/* Category (expenses only) */}
          {!isIncome && (
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
                      <span aria-hidden>{categories.find((c) => c.name === category)?.emoji ?? "\u{1F4C4}"}</span>
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
                    {categories.map((cat) => {
                      const isSelected = category === cat.name;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`${styles.categoryItem} ${isSelected ? styles.categoryItemSelected : ""}`}
                          onClick={() => handleCategorySelect(cat.name)}
                        >
                          <span className={styles.categoryItemContent}>
                            <span
                              className={`${styles.categoryItemIcon} ${isSelected ? styles.categoryItemIconSelected : ""}`}
                            >
                              <span aria-hidden>{cat.emoji}</span>
                            </span>
                            <span
                              className={`${styles.categoryItemText} ${isSelected ? styles.categoryItemTextSelected : ""}`}
                            >
                              {cat.name}
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
          )}

          {/* Source (income only) */}
          {isIncome && (
            <div className={styles.field}>
              <label className={styles.label}>Source</label>
              <div className={styles.categoryDropdown} ref={dropdownRef}>
                <button
                  type="button"
                  className={`${styles.categoryTrigger} ${errors.source ? styles.categoryTriggerError : ""}`}
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {source ? (
                    <span className={styles.categorySelected}>
                      <span aria-hidden>{getSourceEmoji(source)}</span>
                      {source}
                    </span>
                  ) : (
                    <span className={styles.categoryPlaceholder}>
                      Select source
                    </span>
                  )}
                  <span className={styles.categoryChevron} aria-hidden>
                    {showDropdown ? "\u25B2" : "\u25BC"}
                  </span>
                </button>

                {showDropdown && (
                  <div className={styles.categoryList}>
                    {INCOME_SOURCES.map((src) => {
                      const isSelected = source === src;
                      return (
                        <button
                          key={src}
                          type="button"
                          className={`${styles.categoryItem} ${isSelected ? styles.categoryItemSelected : ""}`}
                          onClick={() => handleSourceSelect(src)}
                        >
                          <span className={styles.categoryItemContent}>
                            <span
                              className={`${styles.categoryItemIcon} ${isSelected ? styles.categoryItemIconSelected : ""}`}
                            >
                              <span aria-hidden>{getSourceEmoji(src)}</span>
                            </span>
                            <span
                              className={`${styles.categoryItemText} ${isSelected ? styles.categoryItemTextSelected : ""}`}
                            >
                              {src}
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
              {errors.source && (
                <span className={styles.errorText}>{errors.source}</span>
              )}
            </div>
          )}

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
            className={`${styles.submitBtn} ${isIncome ? styles.submitBtnIncome : ""}`}
            disabled={createExpense.isPending}
          >
            {createExpense.isPending ? (
              <span className={styles.spinner} />
            ) : isIncome ? (
              "Save Income"
            ) : (
              "Add Expense"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
