"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { clearToken, ApiError } from "@/lib/api-client";
import { profilesApi } from "@/lib/api/profiles";
import type { Profile } from "@/types/profile";
import styles from "../../page.module.css";

const RELATIONSHIPS = ["self", "family", "partner", "friend", "other"] as const;
const COLORS = ["#D81B60", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#00ACC1", "#F4511E", "#6D4C41"];

export default function EditProfilePage() {
  const router = useRouter();
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
  const [isAuthChecked, setIsAuthChecked] = useState(false);

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

  // Fetch profile data
  useEffect(() => {
    if (!isAuthChecked) return;

    async function fetchProfile() {
      try {
        const profile = await profilesApi.getProfile(profileId);
        setName(profile.name);
        setRelationship(profile.relationship || "");
        setColor(profile.color || COLORS[0]);
        setIsDefault(profile.isDefault);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 401) {
            localStorage.removeItem("bakaya_user");
            clearToken();
            router.push("/login");
            return;
          }
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
  }, [isAuthChecked, profileId, router]);

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
      router.push("/dashboard/profiles");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          localStorage.removeItem("bakaya_user");
          clearToken();
          router.push("/login");
          return;
        }
        setError(err.message);
      } else {
        setError("Failed to update profile");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthChecked) {
    return null;
  }

  if (isFetching) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Edit Profile</h1>
        </div>
        <p className={styles.loadingText}>Loading profile...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Edit Profile</h1>
        </div>
        <div style={{
          color: "var(--color-error, #ef4444)",
          background: "var(--color-error-bg, #fef2f2)",
          padding: "0.75rem 1rem",
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
          textAlign: "center",
          maxWidth: 480,
        }}>
          {fetchError}
        </div>
        <button
          onClick={() => router.push("/dashboard/profiles")}
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
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Edit Profile
          {isDefault && (
            <span className={styles.defaultBadge} style={{ marginLeft: "0.5rem" }}>
              Default
            </span>
          )}
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        {error && (
          <div style={{
            color: "var(--color-error, #ef4444)",
            background: "var(--color-error-bg, #fef2f2)",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}>
            {error}
          </div>
        )}

        {/* Name */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.375rem", fontSize: "0.875rem" }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Brother, Girlfriend"
            style={{
              width: "100%",
              padding: "0.625rem 0.875rem",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.9375rem",
              background: "var(--color-surface)",
            }}
          />
        </div>

        {/* Relationship */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.375rem", fontSize: "0.875rem" }}>
            Relationship
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
                }}
              >
                {rel}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "0.375rem", fontSize: "0.875rem" }}>
            Color
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
                }}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "transparent",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "var(--color-primary)",
              color: "#fff",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
