"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { useCreateGroup } from "@/lib/queries";
import styles from "./page.module.css";

export default function CreateGroupPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const createGroup = useCreateGroup();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    server?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Group name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createGroup.isPending) return;
    if (!validateForm()) return;

    setErrors({});

    try {
      await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
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

  return (
    <div className={styles.page}>
      {/* ---------- Header ---------- */}
      <header className={styles.header}>
        <button
          className="btn-back"
          onClick={() => router.push("/dashboard")}
          aria-label="Go back"
        >
          &larr;
        </button>
        <h1 className={styles.headerTitle}>Create Group</h1>
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

          {/* Name */}
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Name
            </label>
            <input
              id="name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
              placeholder="Enter group name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name)
                  setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              autoCapitalize="words"
            />
            {errors.name && (
              <span className={styles.errorText}>{errors.name}</span>
            )}
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label htmlFor="description" className={styles.label}>
              Description (Optional)
            </label>
            <textarea
              id="description"
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Add a description for this group"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            disabled={createGroup.isPending}
          >
            {createGroup.isPending ? <span className={styles.spinner} /> : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
}
