/**
 * Cross-screen staleness invalidation.
 *
 * Mutating service methods call `markDataChanged()`; screens gate their
 * fetch throttle with `isFresh(lastFetchTime)` so any mutation anywhere
 * invalidates every screen's cache on next focus.
 */

// ponytail: one clock for all domains; split per-domain only if over-refetching ever hurts
let mutatedAt = 0;

export const markDataChanged = () => {
  mutatedAt = Date.now();
};

export const isFresh = (lastFetch: number, ttl = 30000) =>
  lastFetch > mutatedAt && Date.now() - lastFetch < ttl;
