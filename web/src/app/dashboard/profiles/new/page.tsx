"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { profilesApi } from "@/lib/api/profiles";
import { ApiError } from "@/lib/api-client";
import styles from "../page.module.css";

const RELATIONSHIPS = ["self", "family", "partner", "friend", "other"] as const;
const COLORS = ["#D81B60", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#00ACC1", "#F4511E", "#6D4C41"];

export default function NewProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await profilesApi.createProfile({
        name: name.trim(),
        relationship: relationship || undefined,
        color,
      });
      router.push("/dashboard/profiles");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create profile");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>New Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.profileForm}>
        {error && (
          <div className={styles.formError}>
            {error}
          </div>
        )}

        {/* Name */}
        <div className={styles.formField}>
          <label className={styles.formLabel}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Brother, Girlfriend"
            className={styles.formInput}
          />
        </div>

        {/* Relationship */}
        <div className={styles.formField}>
          <label className={styles.formLabel}>
            Relationship
          </label>
          <div className={styles.formChipsRow}>
            {RELATIONSHIPS.map((rel) => (
              <button
                key={rel}
                type="button"
                onClick={() => setRelationship(rel)}
                style={{
                  padding: "0.375rem 0.875rem",
                  borderRadius: "2rem",
                  border: relationship === rel ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                  background: relationship === rel ? "var(--color-primary-bg, #fce4ec)" : "transparent",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  fontWeight: relationship === rel ? 600 : 400,
                  textTransform: "capitalize",
                  whiteSpace: "nowrap",
                }}
              >
                {rel}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className={styles.formFieldLarge}>
          <label className={styles.formLabel}>
            Color
          </label>
          <div className={styles.formChipsRow}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "3px solid var(--color-text-primary)" : "2px solid transparent",
                  cursor: "pointer",
                  outline: color === c ? "2px solid var(--color-surface)" : "none",
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.formCancelBtn}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={styles.formSubmitBtn}
          >
            {isLoading ? "Creating..." : "Create Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
