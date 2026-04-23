/**
 * Proactively refresh the access token on app foreground if it's close to
 * expiry (or already expired), so the next user action doesn't have to eat
 * a 401 round-trip.
 *
 * Strategy:
 *  1. On AppState transition background → active, read the access token.
 *  2. Parse its `exp` claim client-side (no server round-trip).
 *  3. If it expires in < 60s OR is already expired, fire a refresh through
 *     the shared dedup'd path (`getOrStartRefresh`). If concurrent data
 *     fetches also hit 401s in the same tick, they'll share that same
 *     promise.
 *  4. Refresh failures here are silent — the normal 401→refresh path will
 *     still run on the next request, and the `onSessionExpired` callback
 *     (wired in AuthContext) is the one place that logs the user out.
 */

import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { storage } from '../utils/storage';
import { getOrStartRefresh } from '../lib/authedFetch';

/** Refresh if the access token has less than this many seconds remaining. */
const PROACTIVE_REFRESH_THRESHOLD_SECONDS = 60;

/**
 * Decode a JWT payload without verifying the signature — we only need the
 * `exp` claim to decide whether to refresh. The server still validates the
 * token on every request, so this is safe.
 */
function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadPart = parts[1];
    if (!payloadPart) return null;
    // React Native supports atob via globalThis; fall back to a manual
    // base64url decode if not available.
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const decoded =
      typeof atob === 'function'
        ? atob(normalized)
        : // @ts-ignore — Buffer is available in Metro via globals
          Buffer.from(normalized, 'base64').toString('utf8');
    const payload = JSON.parse(decoded);
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

async function maybeRefresh(): Promise<void> {
  const accessToken = await storage.getAccessToken();
  if (!accessToken) return;

  const exp = decodeJwtExp(accessToken);
  if (!exp) {
    // Unparseable — let the normal 401 flow handle it.
    return;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const secondsLeft = exp - nowSec;

  if (secondsLeft > PROACTIVE_REFRESH_THRESHOLD_SECONDS) {
    return; // plenty of life left
  }

  console.log(
    `[AUTH] Proactive refresh: access token has ${secondsLeft}s left (threshold ${PROACTIVE_REFRESH_THRESHOLD_SECONDS}s)`,
  );

  try {
    await getOrStartRefresh();
  } catch (err) {
    // Silent — the next real request will retry through the same path.
    console.warn('[AUTH] Proactive refresh errored (will retry on next request)', err);
  }
}

export function useProactiveRefresh() {
  const prevState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Also refresh once on mount (covers cold starts where the persisted
    // access token is already expired).
    maybeRefresh();

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = prevState.current;
      prevState.current = next;
      if (next === 'active' && prev !== 'active') {
        maybeRefresh();
      }
    });

    return () => sub.remove();
  }, []);
}
