"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearAllAuth, ApiError } from "@/lib/api-client";
import { expensesApi } from "@/lib/api/expenses";
import { profilesApi } from "@/lib/api/profiles";
import type { Profile } from "@/types/profile";
import { CATEGORIES, getCategoryEmoji } from "@/constants/categories";
import styles from "./page.module.css";

export default function AddExpensePage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const searchParams = useSearchParams();
  const queryProfileId = searchParams.get("profileId") || "";

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState(queryProfileId);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    category?: string;
    profile?: string;
    server?: string;
  }>({});

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch profiles and pre-select default (unless query param already set)
  useEffect(() => {
    profilesApi.getProfiles().then((data) => {
      const list = data.profiles ?? [];
      setProfiles(list);
      // If a profileId was provided via query param and exists, keep it;
      // otherwise fall back to the default profile
      if (!queryProfileId || !list.some((p) => p._id === queryProfileId)) {
        const defaultProfile = list.find((p) => p.isDefault);
        if (defaultProfile) setSelectedProfileId(defaultProfile._id);
      }
    }).catch(() => {
      // profiles API not ready — continue without
    });
  }, [queryProfileId]);

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
      await expensesApi.create({
        title: title.trim(),
        amount: parseFloat(amount),
        profileId: selectedProfileId || undefined,
        category: category.trim(),
        notes: notes.trim() || undefined,
      });
      routerRef.current.push("/dashboard/expenses");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          clearAllAuth();
          routerRef.current.push("/login");
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

  return (
    <div className={styles.page}>
      {/* ---------- Header ---------- */}
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="Go back"
        >
          &larr;
        </button>
        <h1 className={styles.headerTitle}>Add expense</h1>
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

          {/* Profile Selector */}
          {profiles.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Who is this for?</label>
              <div className={styles.profileChipsRow}>
                {profiles.map((profile) => (
                  <button
                    key={profile._id}
                    type="button"
                    onClick={() => setSelectedProfileId(profile._id)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "2rem",
                      border: selectedProfileId === profile._id ? "2px solid var(--color-primary, #D81B60)" : "1px solid #ddd",
                      background: selectedProfileId === profile._id ? "var(--color-primary-bg, #fce4ec)" : "transparent",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: selectedProfileId === profile._id ? 600 : 400,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: profile.color || "var(--color-primary, #D81B60)",
                      display: "inline-block",
                      flexShrink: 0,
                    }} />
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
                  {showDropdown ? "▲" : "▼"}
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
                            ✓
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
