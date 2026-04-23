"use client";

/**
 * Proactively refresh the access token when the browser tab becomes visible
 * again (window focus or visibilitychange), so the first user action after
 * returning doesn't eat a 401 round-trip.
 *
 * Logic:
 *  1. Decode the access token's `exp` client-side (no server round-trip).
 *  2. If it expires in < 60s OR is already expired, fire a refresh through
 *     the shared refresh mutex inside `api-client`.
 *  3. Silent failures are fine — the standard 401-retry path in `api-client`
 *     still runs on the next real request, and only a confirmed refresh
 *     rejection invokes the session-expired UX.
 */

import { useEffect, useRef } from "react";
import { getToken, getRefreshToken, setToken, setRefreshToken } from "./api-client";

const PROACTIVE_REFRESH_THRESHOLD_SECONDS = 60;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadPart = parts[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    // Pad to a multiple of 4 for atob
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/**
 * Single in-flight proactive refresh promise (per tab), so rapid focus
 * toggles don't fire N refreshes.
 */
let proactivePromise: Promise<void> | null = null;

async function doProactiveRefresh(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return;

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      // Let the next real request handle the 401/403 via the normal flow.
      return;
    }
    const json = await res.json();
    if (json?.success && json?.data?.accessToken && json?.data?.refreshToken) {
      setToken(json.data.accessToken);
      setRefreshToken(json.data.refreshToken);
    }
  } catch {
    // Transient network error — the next real request will retry.
  }
}

async function maybeRefresh(): Promise<void> {
  const token = getToken();
  if (!token) return;

  const exp = decodeJwtExp(token);
  if (!exp) return;

  const nowSec = Math.floor(Date.now() / 1000);
  const secondsLeft = exp - nowSec;

  if (secondsLeft > PROACTIVE_REFRESH_THRESHOLD_SECONDS) return;

  if (!proactivePromise) {
    proactivePromise = doProactiveRefresh().finally(() => {
      proactivePromise = null;
    });
  }
  await proactivePromise;
}

export function useProactiveRefresh(enabled: boolean = true): void {
  const lastRunRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    // Fire once on mount — covers page loads where the stored access token
    // is already expired.
    maybeRefresh();

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      // Debounce to avoid spamming refresh on rapid focus/blur cycles.
      const now = Date.now();
      if (now - lastRunRef.current < 5000) return;
      lastRunRef.current = now;
      maybeRefresh();
    };

    const onFocus = onVisible;

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled]);
}
