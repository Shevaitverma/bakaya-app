"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { categoriesApi, type Category } from "@/lib/api/categories";
import styles from "./page.module.css";

const COLOR_PRESETS = [
  "#D81B60", "#E91E63", "#F44336", "#EF5350",
  "#FF9800", "#FB8C00", "#F59E0B", "#FBBF24",
  "#4CAF50", "#43A047", "#22C55E", "#10B981",
  "#2196F3", "#1E88E5", "#3B82F6", "#6366F1",
  "#9C27B0", "#8E24AA", "#A855F7", "#6B7280",
];

const EMOJI_OPTIONS = [
  "🍽️", "🍴", "🍕", "☕", "🛒", "🛍️", "👕", "💊", "🏥", "🎓",
  "📚", "🚗", "🚕", "✈️", "🚌", "⛽", "🏠", "🔑", "💡", "⚡",
  "📱", "💻", "🎮", "🎬", "🎵", "🎁", "💰", "💳", "🏦", "📊",
  "🧾", "📄", "🔄", "🛡️", "🏋️", "💇", "🐕", "🌿", "🍺", "🎉",
  "✂️", "🔧", "🧹", "👶", "💍", "📸", "🎨", "⚽", "🏖️", "🚿",
  "🧴", "🦷", "👓", "🎒", "📦", "🚚", "🏪", "🧸", "📌", "🎂",
];

type FormMode = "add" | "edit";

interface FormState {
  name: string;
  emoji: string;
  color: string;
}

const INITIAL_FORM: FormState = {
  name: "",
  emoji: "",
  color: COLOR_PRESETS[0]!,
};

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Include archived so we can show them in a separate section
  useEffect(() => {
    categoriesApi
      .list(true)
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => setCategories([]))
      .finally(() => setIsLoading(false));
  }, []);

  const activeCategories = categories.filter((c) => c.isActive);
  const archivedCategories = categories.filter((c) => !c.isActive);

  const openAddForm = () => {
    setFormMode("add");
    setEditingId(null);
    setForm(INITIAL_FORM);
    setFormError("");
    setShowEmojiPicker(false);
    setShowForm(true);
  };

  const openEditForm = (cat: Category) => {
    setFormMode("edit");
    setEditingId(cat.id);
    setForm({ name: cat.name, emoji: cat.emoji, color: cat.color });
    setFormError("");
    setShowEmojiPicker(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError("");
    setShowEmojiPicker(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    setFormError("");

    try {
      if (formMode === "add") {
        const newCat = await categoriesApi.create({
          name: form.name.trim(),
          emoji: form.emoji.trim() || undefined,
          color: form.color || undefined,
        });
        setCategories((prev) => [...prev, newCat]);
      } else if (editingId) {
        const updated = await categoriesApi.update(editingId, {
          name: form.name.trim(),
          emoji: form.emoji.trim(),
          color: form.color,
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c))
        );
      }
      closeForm();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Failed to save category. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleArchive = async (cat: Category) => {
    try {
      const updated = await categoriesApi.update(cat.id, {
        isActive: !cat.isActive,
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? updated : c))
      );
    } catch {
      // Swallow -- could show a toast in the future
    }
  };

  const handleDelete = (cat: Category) => {
    setDeleteTarget(cat);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);

    try {
      await categoriesApi.delete(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // Swallow -- keep dialog open on error, user can retry
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <button
            className={styles.backBtn}
            onClick={() => router.push("/dashboard/profiles")}
            aria-label="Go back"
          >
            &larr;
          </button>
          <h1 className={styles.pageTitle}>Categories</h1>
        </div>
        <button className={styles.addBtn} onClick={openAddForm}>
          + Add Category
        </button>
      </div>

      {isLoading ? (
        <p className={styles.loadingText}>Loading categories...</p>
      ) : activeCategories.length === 0 && archivedCategories.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No categories yet</p>
          <p className={styles.emptySubtitle}>
            Categories will be auto-created when you add your first expense, or
            you can create custom ones now.
          </p>
        </div>
      ) : (
        <>
          {/* Active Categories */}
          {activeCategories.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>Active ({activeCategories.length})</h2>
              <div className={styles.categoryList}>
                {activeCategories.map((cat) => (
                  <div key={cat.id} className={styles.categoryCard}>
                    <div className={styles.categoryEmoji}>
                      <span aria-hidden>{cat.emoji || "\u{1F4C4}"}</span>
                    </div>
                    <div className={styles.categoryInfo}>
                      <p className={styles.categoryName}>
                        {cat.name}
                        {cat.isDefault && (
                          <span className={styles.defaultBadge}>Default</span>
                        )}
                      </p>
                    </div>
                    <span
                      className={styles.colorDot}
                      style={{ backgroundColor: cat.color || "#6B7280" }}
                    />
                    <div className={styles.categoryActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openEditForm(cat)}
                        title="Edit"
                      >
                        &#9998;
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleToggleArchive(cat)}
                        title="Archive"
                      >
                        &#128451;
                      </button>
                      {!cat.isDefault && (
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDelete(cat)}
                          title="Delete"
                        >
                          &#10005;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Archived Categories */}
          {archivedCategories.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>Archived ({archivedCategories.length})</h2>
              <div className={styles.categoryList}>
                {archivedCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`${styles.categoryCard} ${styles.categoryCardArchived}`}
                  >
                    <div className={styles.categoryEmoji}>
                      <span aria-hidden>{cat.emoji || "\u{1F4C4}"}</span>
                    </div>
                    <div className={styles.categoryInfo}>
                      <p className={styles.categoryName}>
                        {cat.name}
                        <span className={styles.archivedBadge}>Archived</span>
                      </p>
                    </div>
                    <span
                      className={styles.colorDot}
                      style={{ backgroundColor: cat.color || "#6B7280" }}
                    />
                    <div className={styles.categoryActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleToggleArchive(cat)}
                        title="Restore"
                      >
                        &#8634;
                      </button>
                      {!cat.isDefault && (
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDelete(cat)}
                          title="Delete"
                        >
                          &#10005;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Add / Edit Form Dialog — rendered via portal to avoid transform stacking context issues */}
      {showForm && typeof document !== "undefined" && createPortal(
        <div className={styles.formOverlay} onClick={closeForm}>
          <div className={styles.formDialog} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.formTitle}>
              {formMode === "add" ? "Add Category" : "Edit Category"}
            </h2>

            <div className={styles.formRow}>
              <div className={`${styles.formField} ${styles.emojiField}`}>
                <label className={styles.formLabel}>Emoji</label>
                <div className={styles.emojiPickerWrapper}>
                  <button
                    type="button"
                    className={styles.emojiButton}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    {form.emoji || "📄"}
                  </button>
                  {showEmojiPicker && (
                    <div className={styles.emojiGrid}>
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className={styles.emojiOption}
                          onClick={() => {
                            setForm((f) => ({ ...f, emoji }));
                            setShowEmojiPicker(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={`${styles.formField} ${styles.formRowField}`}>
                <label className={styles.formLabel}>Name</label>
                <input
                  type="text"
                  className={`${styles.formInput} ${formError && !form.name.trim() ? styles.formInputError : ""}`}
                  placeholder="Category name"
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    if (formError) setFormError("");
                  }}
                  autoCapitalize="words"
                />
              </div>
            </div>

            {formError && <p className={styles.formError}>{formError}</p>}

            <div className={styles.formField}>
              <label className={styles.formLabel}>Color</label>
              <div className={styles.colorSwatches}>
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`${styles.colorSwatch} ${form.color === color ? styles.colorSwatchSelected : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm((f) => ({ ...f, color }))}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className={styles.formActions}>
              <button className={styles.formCancelBtn} onClick={closeForm}>
                Cancel
              </button>
              <button
                className={styles.formSaveBtn}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : formMode === "add" ? "Add" : "Save"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Dialog — rendered via portal to avoid transform stacking context issues */}
      {deleteTarget && typeof document !== "undefined" && createPortal(
        <div className={styles.dialogOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.dialogTitle}>Delete Category</h2>
            <p className={styles.dialogMessage}>
              Are you sure you want to delete &ldquo;{deleteTarget.name}&rdquo;?
              Existing expenses using this category will keep their label.
            </p>
            {deleteTarget.name === "Other" && (
              <p className={styles.dialogWarning}>
                Warning: &ldquo;Other&rdquo; is the fallback category. Deleting
                it may affect expenses without a specific category.
              </p>
            )}
            <div className={styles.dialogActions}>
              <button
                className={styles.dialogCancel}
                onClick={() => setDeleteTarget(null)}
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
        </div>,
        document.body
      )}
    </div>
  );
}
