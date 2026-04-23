# Session Strategy

How Bakaya keeps users signed in. Short version: users should never see a
"session expired" prompt unless they explicitly sign out or leave the app
untouched for 90 days.

## Token TTLs

| Token         | TTL   | Purpose                                                      |
|---------------|-------|--------------------------------------------------------------|
| Access token  | 15m   | Short-lived bearer for every API call. Keeps blast radius small if leaked. |
| Refresh token | 90d   | Long-lived. Rotated on every use, giving a sliding window: any activity within 90d extends the session. |

Both TTLs live in server env vars (`JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`)
with safe defaults in `server/src/config/env.ts`.

## Refresh flow

1. Client calls a protected endpoint with its access token.
2. If the server returns 401 (access token expired or otherwise invalid),
   the client pauses the request and hits `POST /api/v1/auth/refresh` with
   the stored refresh token. The refresh endpoint is PUBLIC — it does NOT
   require a valid access token.
3. The server verifies the refresh token and responds with a brand-new
   `{ accessToken, refreshToken }` pair (rotation on every call). The old
   refresh token is not explicitly revoked today — see TODO below.
4. Client persists the new tokens and retries the original request exactly
   once with the new access token.
5. Multiple concurrent 401s in the same tick share a single in-flight
   refresh (one `refreshPromise` per client). No thundering-herd refresh.

## Proactive refresh on foreground

- **Mobile** (`useProactiveRefresh` hook in `App.tsx`): on AppState
  `background → active`, decode the access token's `exp` and refresh if
  less than 60s remain.
- **Web** (`useProactiveRefresh` in `dashboard/layout.tsx`): on
  `visibilitychange` / `focus`, do the same.
- Both share the same dedup path as the reactive 401 flow, so a proactive
  refresh + a concurrent 401 will never fire two `/auth/refresh` calls.

## Failure handling

| Failure type                          | What happens                                                        |
|---------------------------------------|---------------------------------------------------------------------|
| Network error during refresh          | Tokens preserved. Next request retries. User stays signed in.       |
| Server 5xx during refresh             | Tokens preserved. Treated as transient.                              |
| Server 401/403 during refresh         | Refresh token is dead. Client clears storage and shows login.       |
| No refresh token in storage           | Immediate logout (nothing to recover from).                          |

This is the ONLY path that surfaces a "session expired" UX:

- Mobile: `AuthContext` registers an `onSessionExpired` callback with
  `lib/authedFetch.ts`, which calls `logout()` and lets the nav stack
  bounce back to the login screen.
- Web: `dashboard/layout.tsx` registers a callback with `lib/api-client.ts`
  via `setOnSessionExpired`, which pushes to `/login`.

## Storage

- **Mobile**: AsyncStorage. TODO: migrate the refresh token to
  `expo-secure-store` for Keychain/Keystore-backed encryption. Deferred
  because it requires a native dep we don't currently use.
- **Web**: `localStorage` (`bakaya_token`, `bakaya_refresh_token`).
  Migrating to HttpOnly cookies is a server-architecture change and is
  explicitly out of scope.

## Single source of truth

- **Mobile**: `src/lib/authedFetch.ts` is the only code path that touches
  the Authorization header and the refresh endpoint. Every service
  (`expense`, `group`, `category`, `analytics`, `profile`, `invitation`)
  goes through it. The old `apiClient` wrapper for TanStack Query is now
  a thin adapter over `authedFetch`.
- **Web**: `src/lib/api-client.ts` is the single surface. It already
  dedupes refresh via a module-level `refreshPromise`.

## TODOs

- Server: add a `Session` model or a refresh-token deny list so rotated
  tokens can be revoked. Today, a stolen refresh token remains valid until
  its natural 90d expiry. Marked with a TODO in `auth.controller.ts`.
- Mobile: move refresh token to `expo-secure-store`. Marked with a TODO in
  `utils/storage.ts`.
