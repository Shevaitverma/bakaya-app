"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { profilesApi } from "@/lib/api/profiles";
import type { Profile } from "@/types/profile";
import styles from "../../page.module.css";

const RELATIONSHIPS = ["self", "family", "partner", "friend", "other"] as const;
const COLORS = ["#D81B60", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#00ACC1", "#F4511E", "#6D4C41"];

export default function EditProfilePage() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const params = useParams();
  const profileId = params.id as string;

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [error, setError] = useState("");

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const profile = await profilesApi.getProfile(profileId);
        setName(profile.name);
        setRelationship(profile.relationship || "");
        setColor(profile.color || COLORS[0]);
        setIsDefault(profile.isDefault);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 404) {
            setFetchError("Profile not found.");
            return;
          }
          setFetchError(err.message);
        } else {
          setFetchError("Unable to connect to server. Please try again.");
        }
      } finally {
        setIsFetching(false);
      }
    }

    fetchProfile();
  }, [profileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await profilesApi.updateProfile(profileId, {
        name: name.trim(),
        relationship: relationship || undefined,
        color,
      });
      routerRef.current.push("/dashboard/profiles");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to update profile");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Edit Profile</h1>
        </div>
        <div className={styles.contentSheet}>
          <p className={styles.loadingText}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Edit Profile</h1>
        </div>
        <div className={styles.contentSheet}>
          <div className={styles.formError} style={{ textAlign: "center" }}>
            {fetchError}
          </div>
          <button
            onClick={() => routerRef.current.push("/dashboard/profiles")}
            style={{
              display: "block",
              marginTop: "1rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border, #ddd)",
              background: "transparent",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Back to Profiles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Edit Profile
          {isDefault && (
            <span className={styles.defaultBadge} style={{ marginLeft: "0.5rem", background: "rgba(255,255,255,0.2)", color: "#fff" }}>
              Default
            </span>
          )}
        </h1>
      </div>

      <div className={styles.contentSheet}>
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
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
