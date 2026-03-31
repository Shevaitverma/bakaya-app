"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";
import { categoriesApi, type Category } from "@/lib/api/categories";
import { queryKeys } from "@/lib/queries";
import styles from "./page.module.css";

const COLOR_PRESETS = [
  "#D81B60", "#E91E63", "#F44336", "#EF5350",
  "#FF9800", "#FB8C00", "#F59E0B", "#FBBF24",
  "#4CAF50", "#43A047", "#22C55E", "#10B981",
  "#2196F3", "#1E88E5", "#3B82F6", "#6366F1",
  "#9C27B0", "#8E24AA", "#A855F7", "#6B7280",
];

const EMOJI_OPTIONS = [
  "\uD83C\uDF7D\uFE0F", "\uD83C\uDF74", "\uD83C\uDF55", "\u2615", "\uD83D\uDED2", "\uD83D\uDECD\uFE0F", "\uD83D\uDC55", "\uD83D\uDC8A", "\uD83C\uDFE5", "\uD83C\uDF93",
  "\uD83D\uDCDA", "\uD83D\uDE97", "\uD83D\uDE95", "\u2708\uFE0F", "\uD83D\uDE8C", "\u26FD", "\uD83C\uDFE0", "\uD83D\uDD11", "\uD83D\uDCA1", "\u26A1",
  "\uD83D\uDCF1", "\uD83D\uDCBB", "\uD83C\uDFAE", "\uD83C\uDFAC", "\uD83C\uDFB5", "\uD83C\uDF81", "\uD83D\uDCB0", "\uD83D\uDCB3", "\uD83C\uDFE6", "\uD83D\uDCCA",
  "\uD83E\uDDFE", "\uD83D\uDCC4", "\uD83D\uDD04", "\uD83D\uDEE1\uFE0F", "\uD83C\uDFCB\uFE0F", "\uD83D\uDC87", "\uD83D\uDC15", "\uD83C\uDF3F", "\uD83C\uDF7A", "\uD83C\uDF89",
  "\u2702\uFE0F", "\uD83D\uDD27", "\uD83E\uDDF9", "\uD83D\uDC76", "\uD83D\uDC8D", "\uD83D\uDCF8", "\uD83C\uDFA8", "\u26BD", "\uD83C\uDFD6\uFE0F", "\uD83D\uDEBF",
  "\uD83E\uDDF4", "\uD83E\uDDB7", "\uD83D\uDC53", "\uD83C\uDF92", "\uD83D\uDCE6", "\uD83D\uDE9A", "\uD83C\uDFEA", "\uD83E\uDDF8", "\uD83D\uDCCC", "\uD83C\uDF82",
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
  const queryClient = useQueryClient();

  // Fetch categories including archived via direct useQuery (the shared hook doesn't include archived)
  const { data: categories = [], isLoading } = useQuery({
    queryKey: [...queryKeys.categories.all, { includeArchived: true }],
    queryFn: () => categoriesApi.list(true),
    select: (data) => data.categories ?? [],
  });

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

  const activeCategories = categories.filter((c) => c.isActive);
  const archivedCategories = categories.filter((c) => !c.isActive);

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
  };

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
        await categoriesApi.create({
          name: form.name.trim(),
          emoji: form.emoji.trim() || undefined,
          color: form.color || undefined,
        });
      } else if (editingId) {
        await categoriesApi.update(editingId, {
          name: form.name.trim(),
          emoji: form.emoji.trim(),
          color: form.color,
        });
      }
      invalidateCategories();
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
      await categoriesApi.update(cat.id, {
        isActive: !cat.isActive,
      });
      invalidateCategories();
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
      invalidateCategories();
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

      <div className={styles.contentSheet}>
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
      </div>

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
                    {form.emoji || "\uD83D\uDCC4"}
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
