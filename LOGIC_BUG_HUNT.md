# Bakaya — Logic Bug Hunt

Pure-discovery audit of server / mobile / web. No code edits.
Out of scope (owned by parallel agents): competitive research, group-expense split math audit, UX polish.
Scope covered: every other logic surface (auth, personal expenses, profiles, categories, analytics, invitations, settlements, persistence, permissions, input validation, timezone/date math, error handling, concurrency).

---

## 1. Executive summary — Top 10

1. **[CRIT]** Invitation list endpoints return a bare array; web + mobile type them as `{invitations: [...]}` → all invitation lists (pending badge, InvitationsScreen, GroupDetail pending roster) render empty on both platforms.
2. **[CRIT]** `createInvitation` / `cancelInvitation` / `declineInvitation` controllers return a bare `GroupInvitation`; both clients expect `{invitation: ...}` → mobile's optimistic insert of a just-sent invitation silently no-ops.
3. **[HIGH]** `updateGroupExpense` schema omits `paidBy`; the mobile Edit Group Expense UI has a "Paid by" picker whose change is silently stripped server-side.
4. **[HIGH]** `EditExpenseScreen` (mobile) ignores `expense.type` entirely — any income opened for edit is forced back to "expense", losing `source` and requiring a category.
5. **[HIGH]** Logout on mobile and web never clears the TanStack Query cache → next user who signs in on the same device sees the previous user's profiles/expenses/groups until queries refetch (and the persisted cache on mobile replays across accounts).
6. **[HIGH]** Group expense deletion is gated to `paidBy === userId`, not admins — admins cannot remove a fraudulent expense unless they also paid it. Error surfaces as "Expense not found" (404), confusingly conflated with genuine not-found.
7. **[HIGH]** User delete (`userService.delete`) cascades profiles / expenses / settlements / group memberships, but leaves `GroupExpense.paidBy`, `GroupExpense.splitAmong.userId`, and `GroupInvitation` orphans referencing the now-deleted user. Group balances will attribute money to a ghost.
8. **[HIGH]** Group delete cascades expenses and settlements but NOT `GroupInvitation`s — pending invites to a deleted group persist; accepting later throws "Group not found".
9. **[HIGH]** Web `RegisterPage` matches server error `"Email already registered"` against the literal string `"Email already exists"` → duplicate-email is shown as a generic server error banner instead of a field-level message.
10. **[HIGH]** Mobile login enforces password ≥ 6 chars while server requires ≥ 8 chars + complexity → password between 6–7 chars or simple passwords pass client validation and fail at the API with a vague error. (Login specifically; register is aligned.)

---

## 2. Bugs by severity

### CRITICAL

#### BUG-01 — Invitation list endpoints return a bare array; clients expect `{invitations}`
- **Severity:** Critical
- **Platforms:** server + web + mobile
- **Files:**
  - `server/src/controllers/invitation.controller.ts:76` (`listGroupInvitationsHandler` → `successResponse(invitations)`)
  - `server/src/controllers/invitation.controller.ts:129` (`listMyInvitationsHandler` → `successResponse(invitations)`)
  - `web/src/lib/api/invitations.ts:32-34` (type `InvitationsList = { invitations: GroupInvitation[] }`)
  - `web/src/lib/queries/useInvitations.ts:9-14` (`useMyInvitations` consumed with `data?.invitations ?? []`)
  - `web/src/app/dashboard/layout.tsx:71` (badge count)
  - `web/src/app/dashboard/invitations/page.tsx:24` (`invitations = data?.invitations ?? []`)
  - `web/src/app/dashboard/groups/[id]/page.tsx:236` (`pendingInvitations = data?.invitations ?? []`)
  - `mobile/src/types/invitation.ts:41-49` (`InvitationsResponse = { data: { invitations } }`)
  - `mobile/src/screens/Invitations/InvitationsScreen.tsx:56` (`response.data.invitations ?? []`)
  - `mobile/src/screens/Group/GroupDetailScreen.tsx:176` (`invitationsRes.data.invitations ?? []`)
  - `mobile/src/screens/Profile/ProfilesScreen.tsx:54` (`response.data.invitations?.length ?? 0`)
- **Description:** Server puts the array directly in `data`; every consumer reads `data.invitations`, which is `undefined`. Result: Every pending-invitation UI surface is permanently empty.
- **Reproduction:** Log in as user A, send an invitation to user B, log in as user B → `/dashboard/invitations` shows "No pending invitations"; badge count stays 0; GroupDetail pending chips don't render.
- **Expected:** Invitations appear in all lists.
- **Actual:** Arrays are dropped; UIs show zero results; feature appears broken.
- **Suggested fix:** Wrap the service return in `{ invitations }` at both controllers (or change types on both clients — pick one source of truth).

#### BUG-02 — Single-invitation controllers return bare `GroupInvitation`; clients expect `{invitation}`
- **Severity:** Critical (subset of BUG-01 fallout)
- **Platforms:** server + mobile (primary), web (latent)
- **Files:**
  - `server/src/controllers/invitation.controller.ts:34` (`createInvitationHandler`)
  - `server/src/controllers/invitation.controller.ts:106` (`cancelInvitationHandler`)
  - `server/src/controllers/invitation.controller.ts:173` (`declineInvitationHandler`)
  - `mobile/src/types/invitation.ts:30-39` (`InvitationResponse = { data: { invitation, group? } }`)
  - `mobile/src/screens/Group/GroupDetailScreen.tsx:278-280`
  - `web/src/lib/api/invitations.ts:75-79`, `97-101`
- **Description:** The create/cancel/decline controllers return the GroupInvitation directly as `data`. The mobile GroupDetail screen's optimistic insert (`setPendingInvitations((prev) => [res.data.invitation, ...prev])`) is a no-op; the new invitation is only seen after full refetch.
- **Reproduction:** From GroupDetail → Add Member → send an invite. Nothing appears in "Pending Invitations" until the screen is re-entered.
- **Expected:** Newly-created invite shows optimistically.
- **Actual:** List stays stale.
- **Suggested fix:** Wrap single-invitation responses in `{ invitation }` (and `{ invitation, group }` for `accept`, which is already correct).

---

### HIGH

#### BUG-03 — `paidBy` is silently dropped on group-expense update
- **Severity:** High
- **Platforms:** server + mobile
- **Files:**
  - `server/src/schemas/groupExpense.schema.ts:15-24` (`updateGroupExpenseSchema` — no `paidBy` field)
  - `server/src/services/groupExpense.service.ts:100-153` (`$set: input` — strips the unknown key)
  - `mobile/src/screens/Group/EditGroupExpenseScreen.tsx:49` (`showPaidByModal`), `244-255` (update payload omits `paidBy`)
- **Description:** The edit screen renders a "Paid by" picker and lets the user change the payer. The mobile client doesn't include `paidBy` in the update payload, and even if it did the Zod schema doesn't accept it, so Mongo never receives the change.
- **Reproduction:** Edit a group expense where Alice paid; change payer to Bob; Save → balances still credit Alice.
- **Expected:** Payer updates.
- **Actual:** Payer never changes; user sees wrong balances.
- **Suggested fix:** Add `paidBy` to `updateGroupExpenseSchema`, validate membership, and send it from the mobile update payload.

#### BUG-04 — EditExpense (mobile) ignores `type`; forces income → expense
- **Severity:** High
- **Platforms:** mobile
- **Files:** `mobile/src/screens/Expense/EditExpenseScreen.tsx:40-54`, `106-128`, `142-149`
- **Description:** The mobile edit flow never reads or sends `expense.type`. It always shows the category picker (required), never source. Server `updateExpenseSchema` will accept the implicit update and `$set: input` leaves `type` unchanged — BUT the screen requires a category from the user and the saved record ends up with category set even when it was an income (and the user typed random things in category).
- **Reproduction:** Create an income "Salary", edit it on mobile → app demands a category; save → record has both category and source.
- **Expected:** Mobile edit preserves income/expense distinction like web does.
- **Actual:** Data cleanliness drift between create and edit flows.
- **Suggested fix:** Mirror web: persist `type`, branch UI on it. Alternatively, disallow type change in edit.

#### BUG-05 — Logout leaves TanStack cache + persisted cache intact
- **Severity:** High
- **Platforms:** mobile + web
- **Files:**
  - `mobile/src/context/AuthContext.tsx:95-103` (logout clears storage but not `queryClient.clear()` or AsyncStorage `BAKAYA_QUERY_CACHE`)
  - `mobile/src/lib/persister.ts:9-13` (key: `BAKAYA_QUERY_CACHE` — never cleared)
  - `web/src/app/dashboard/layout.tsx:132` (`clearAllAuth()` only)
  - `web/src/app/dashboard/profiles/page.tsx:38-42` (handleLogout — no cache clear)
- **Description:** When user A logs out, the persisted TanStack cache and the in-memory queryClient retain A's profiles, expenses, group balances. If user B signs in on the same device/browser before the cache expires, they briefly see A's data before refetches land — and if a protected request somehow 401s first (e.g. race with refresh), they may re-enter and see A's data as "their own". On mobile the AsyncStorage persister hydrates A's cache back into B's session at cold start.
- **Reproduction:** Login as A, navigate to Home (fills cache), logout, login as B → Home renders A's profiles/balance for ~1s until fresh fetches settle.
- **Expected:** Logout clears all caches.
- **Actual:** Previous user's data leaks.
- **Suggested fix:** On logout, call `queryClient.clear()` and also `AsyncStorage.removeItem('BAKAYA_QUERY_CACHE')` on mobile.

#### BUG-06 — Group-expense delete restricted to payer; admins locked out; 404 mis-signals
- **Severity:** High
- **Platforms:** server + mobile + web
- **Files:**
  - `server/src/services/groupExpense.service.ts:155-165` (`findOneAndDelete({..., paidBy: userId})`)
  - `server/src/controllers/groupExpense.controller.ts:135-155` (returns 404 when not payer)
  - `web/src/app/dashboard/groups/[id]/page.tsx:313-316` (UI maps 404 → "Only the expense creator can delete")
- **Description:** Only the payer can delete. An admin who wants to clean up a bogus expense added by a (now-removed / departed) member can't. Even worse, the API doesn't distinguish "expense missing" from "expense exists but you're not the payer" — both return 404.
- **Reproduction:** As a non-payer group admin, try to DELETE `/api/v1/groups/:id/expenses/:eid` → 404.
- **Expected:** Admins should be able to delete; or API should return 403 when the expense exists but permission fails.
- **Actual:** Admins can't clean up; error is misleading.
- **Suggested fix:** In `deleteGroupExpense`, first fetch the expense, check membership + (payer OR admin), then delete; return 403 vs 404 distinctly.

#### BUG-07 — User deletion orphans group-expense references and invitations
- **Severity:** High
- **Platforms:** server
- **Files:** `server/src/services/user.service.ts:53-67`
- **Description:** `userService.delete` cascades `Profile`, `Expense`, `Settlement`, and pulls the user from `Group.members`. It does NOT touch `GroupExpense` (where the user may be `paidBy` or inside `splitAmong`) or `GroupInvitation` (where they may be `invitedBy` or `invitedUserId`). The balances endpoint for any group they belonged to will still assign credit/debt to the ghost user; the UI shows "Unknown member".
- **Reproduction:** Admin deletes user U who paid `GroupExpense X` in group G. GET `/api/v1/groups/:g/balances` → still returns U's balance.
- **Expected:** Either block deletion when user has group activity, or transactionally rewrite/delete those records.
- **Actual:** Dangling references; UI confusion.
- **Suggested fix:** Add `GroupExpense` and `GroupInvitation` to the cascade (or, better, soft-delete users for audit integrity).

#### BUG-08 — Group delete doesn't cascade GroupInvitation
- **Severity:** High
- **Platforms:** server
- **Files:**
  - `server/src/services/group.service.ts:47-63` (cascade misses `GroupInvitation`)
  - `server/src/services/invitation.service.ts:171-207` (`acceptInvitation` throws "Group not found" afterwards)
- **Description:** Deleting a group leaves pending/outstanding invitations in Mongo. The invitee's `listMyInvitations` (once BUG-01 is fixed) will still show the ghost invite; clicking Accept then throws "Group not found".
- **Reproduction:** A creates group, invites B, deletes group. B hits `/dashboard/invitations` → sees invite → clicks Accept → server error.
- **Expected:** Cascade-delete invitations when the group dies.
- **Actual:** Accept/decline endpoints throw on a group that no longer exists.
- **Suggested fix:** Add `GroupInvitation.deleteMany({ groupId })` (or mark them cancelled) to the cascade.

#### BUG-09 — Web register maps server's "Email already registered" incorrectly
- **Severity:** High
- **Platforms:** web
- **Files:**
  - `server/src/controllers/auth.controller.ts:67` (`"Email already registered"`)
  - `web/src/app/register/page.tsx:143` (`error.message.includes("Email already exists")`)
- **Description:** Web checks for the wrong literal string, so the duplicate-email case falls through to the generic `errors.server` banner instead of pointing at the Email field.
- **Reproduction:** Try to register with an existing email → top banner shows "Email already registered" instead of an inline field error.
- **Expected:** Inline field error, per existing UX intent.
- **Actual:** Banner only; Email input not highlighted.
- **Suggested fix:** Either align the server message to "Email already exists" or (better) check for the substring "already registered" / switch to `error.code === "BAD_REQUEST" && /email/i.test(error.message)`.

#### BUG-10 — Mobile login password validator weaker than server policy
- **Severity:** High (UX) / Medium (functional)
- **Platforms:** mobile
- **Files:** `mobile/src/screens/Auth/LoginScreen.tsx:44-60`
- **Description:** `password.length < 6` validation blocks ≤5-char passwords but allows 6–7 chars that the server will reject at login. Register screen is correct (checks ≥8 + complexity). But login's looser check means: if the user typo'd their password and it happens to be 6–7 chars, they get a vague server error instead of an inline client message.
- **Reproduction:** Type a 7-char password on the mobile login screen → request fires → server returns 401 "Invalid email or password".
- **Expected:** Keep parity with server min-length OR simply require non-empty (since server is authoritative).
- **Actual:** Partial validation creates inconsistent errors.
- **Suggested fix:** Drop the length check on login (require non-empty only) — login clients should defer to the server. Register's stronger check stays.

#### BUG-11 — `createGroupExpense` allows `paidBy` to be ANY group member, not just the authenticated user
- **Severity:** High (security + data integrity)
- **Platforms:** server
- **Files:**
  - `server/src/controllers/groupExpense.controller.ts:61` (`const paidBy = input.paidBy || userId`)
  - `server/src/services/groupExpense.service.ts:17-20` (only verifies paidBy is a member)
- **Description:** Any group member can POST `paidBy: <someoneElse>` and the server accepts it — effectively impersonating another member for expense creation. The only guard is "paidBy must be a group member." For settlements, by contrast, there's a server-side `paidBy === userId` enforcement (settlement.controller.ts:63); the group-expense path lacks that enforcement.
- **Reproduction:** As user A in group G, `POST /groups/G/expenses` with `paidBy: B, amount: 10000, splitAmong: [...]` → server accepts; group balances credit B.
- **Expected:** Only the authenticated user can be `paidBy`, OR admin override with explicit flag.
- **Actual:** Anyone can "log a receipt on someone else's behalf" — legitimate Splitwise-style use case, but without audit.
- **Suggested fix:** Decide product policy (current Splitwise does allow this). At minimum, record `createdBy` separately from `paidBy` so balances are attributable and audit-able, and rate-limit / notify the impersonated user.

#### BUG-12 — `createInvitation` swallows Mongo "E11000 duplicate key" under `listGroupInvitations` partial index
- **Severity:** High (surfaces as generic 500)
- **Platforms:** server
- **Files:**
  - `server/src/models/GroupInvitation.ts:78-85` (partial unique index on pending)
  - `server/src/controllers/invitation.controller.ts:35-55` (no handler for duplicate-key)
- **Description:** A race between two admins sending simultaneous invitations to the same pending user triggers MongoDB's E11000 error. The service's `existingPending` check happens before the insert but is not atomic with it. The controller doesn't map the duplicate-key error → handler returns 500.
- **Reproduction:** Two admins click "Send invitation" for the same email at the same moment → one succeeds, the other gets 500 instead of "Invitation already exists".
- **Expected:** 400 with the sane error message.
- **Actual:** 500 with generic error.
- **Suggested fix:** Add a `duplicate key` catch in `createInvitation`/controller mapping to `"A pending invitation already exists"`.

#### BUG-13 — `refreshTokenHandler` has no deny-list; rotated tokens remain replayable
- **Severity:** High (security — acknowledged TODO in code)
- **Platforms:** server
- **Files:** `server/src/controllers/auth.controller.ts:345-358` (the `// TODO(session-hardening)` comment)
- **Description:** Every refresh rotates access+refresh pair, but the OLD refresh token is still accepted if presented again before natural expiry. A stolen refresh token survives logout and rotation.
- **Reproduction:** Attacker exfiltrates RT_1 from victim's storage. Victim refreshes (gets RT_2). Attacker uses RT_1 → server still accepts it and issues RT_3.
- **Expected:** Old refresh tokens invalidated on rotation.
- **Actual:** Replayable until natural expiry.
- **Suggested fix:** Implement a deny-list / `Session` model keyed by jti, as the code's own TODO already states.

---

### MEDIUM

#### BUG-14 — Web `exportCSV` does NOT go through the 401-refresh wrapper
- **Severity:** Medium
- **Platforms:** web
- **Files:** `web/src/lib/api/expenses.ts:102-133`
- **Description:** `expensesApi.exportCSV` uses a bare `fetch` (to get the raw blob) and only checks `response.ok`. If the access token is expired, it 401s immediately without refresh and throws "Failed to export CSV". The user doesn't get the "session expired" redirect either.
- **Reproduction:** Leave the Expenses page open past token expiry, click "Export CSV" → silent failure (UI shows nothing; swallowed in `catch {}` at `expenses/page.tsx:87-89`).
- **Expected:** Proactive refresh or a one-shot retry, like the rest of the API.
- **Actual:** Feature silently fails.
- **Suggested fix:** Implement refresh-on-401 in the export helper, or use the shared `request()` flow to obtain the blob.

#### BUG-15 — Category delete leaves expenses pointing at a now-missing category
- **Severity:** Medium
- **Platforms:** server
- **Files:** `server/src/services/category.service.ts:89-104` (`deleteCategory`)
- **Description:** `Expense.category` is a plain string, not a ref. Deleting a category doesn't rename / null-out associated expenses, and recreating a same-named category will magically "re-link" them. If the user renames the default "Food" to "Meals", existing expenses still stored "Food" and fall off the category filter until re-categorized. The by-category analytics aggregation will then show "Food" as a ghost category.
- **Reproduction:** Create 10 expenses under "Food", delete category "Food" → `analytics/by-category` still shows "Food" totals from the expenses.
- **Expected:** Cascade-null or reassign to "Other" on delete; propagate rename to expenses on update.
- **Actual:** Ghost categories in analytics; silent data drift on rename.
- **Suggested fix:** Either (a) re-model `Expense.category` as a ref to Category, or (b) on category delete, `Expense.updateMany({category: name}, {$set: {category: "Other"}})` and on rename run a similar updateMany.

#### BUG-16 — Multiple "Self" profiles possible
- **Severity:** Medium
- **Platforms:** server
- **Files:**
  - `server/src/services/profile.service.ts:7-15` (`createProfile` — no uniqueness check on `relationship: "self"`)
  - `server/src/models/Profile.ts:52` (unique on `{userId, name}` only)
- **Description:** The "Self" concept is modeled by the boolean `isDefault` plus the string `relationship: "self"`. Nothing prevents a user from creating several profiles with `relationship: "self"` (or `isDefault: true` via raw update). AddProfileScreen exposes "Self" as a selectable relationship.
- **Reproduction:** Create profile "Self-A" with relationship "self", then "Self-B" also with "self" → both exist.
- **Expected:** At most one self-linked profile per user.
- **Actual:** Unlimited Selfs; analytics byProfile will count each.
- **Suggested fix:** Server-side guard: a user can create/own exactly one `relationship: "self"` profile; block the rest.

#### BUG-17 — `daysPassed` off-by-one in `getBalance` at month start
- **Severity:** Medium
- **Platforms:** server
- **Files:** `server/src/services/analytics.service.ts:228-253`
- **Description:** `Math.ceil((end - start) / 86400000)` — at the very start of a month (e.g. Jan 1, 00:01 IST), `daysPassed` = 1 even though effectively zero days have fully elapsed; `dailySpendingRate = firstExpense / 1` — the rate spikes to whatever the first expense was. Likewise, late on Jan 31, `daysPassed` can evaluate to 32 depending on timezone drift because `effectiveEnd` might momentarily overshoot on custom ranges.
- **Reproduction:** On the 1st of the month at 02:00 IST, spend ₹10; the dashboard claims "₹10/day spent" and gives wildly wrong projected budget.
- **Expected:** Use `Math.max(1, floor(...))` consistently, or use whole-day elapsed only.
- **Actual:** Rate volatility at boundaries.
- **Suggested fix:** Switch to `Math.floor((nowUTC midnight - startUTC midnight) / DAY_MS) + 1` using IST-anchored dates.

#### BUG-18 — Trend series: months with zero expenses are silently dropped
- **Severity:** Medium (chart misleads)
- **Platforms:** server + mobile + web
- **Files:**
  - `server/src/services/analytics.service.ts:281-348` (trends pipeline)
  - `web/src/app/dashboard/analytics/page.tsx:149-150` (`trendsData?.months ?? []`)
- **Description:** The aggregation only emits `{year, month}` rows where at least one expense exists. A month with zero spend is missing → the chart X-axis shows a 6-month window with 4 bars instead of 6; change-percent (`lastTwo`) compares whatever two happen to be last.
- **Reproduction:** Spend in Jan, skip Feb, spend in Mar → chart shows "Jan, Mar" adjacent; change% comparing Mar to Jan, mislabeled as MoM.
- **Expected:** Fill missing months with `{total: 0, count: 0}`.
- **Actual:** Chart and percentage change are wrong during sparse activity.
- **Suggested fix:** Backfill months in the service or in the client trend renderer.

#### BUG-19 — `EditGroupExpense` receives `members` as navigation param; stale if membership changed
- **Severity:** Medium
- **Platforms:** mobile
- **Files:**
  - `mobile/src/screens/Group/GroupDetailScreen.tsx:246-258` (passes `members` at nav time)
  - `mobile/src/screens/Group/EditGroupExpenseScreen.tsx:37-60` (reads from `route.params`)
- **Description:** If another client adds a new member while the edit screen is open, the new member won't appear in the split UI. If a member is removed concurrently, the old `splitAmong` still carries their userId; when the user hits Save, server rejects "User X is not a member of this group" — but the UI has no way to reconcile.
- **Reproduction:** Open Edit on an expense split among 3 members; on another device, remove one of those members; save the edit → 400 from server.
- **Expected:** Edit screen should refetch group (or at least display latest membership).
- **Actual:** Dead-end error.
- **Suggested fix:** Re-fetch group on screen focus inside EditGroupExpenseScreen, not pass `members` via route params.

#### BUG-20 — `useRemoveMember` invalidates group + balances but not invitations or expenses
- **Severity:** Medium
- **Platforms:** web
- **Files:** `web/src/lib/queries/useGroups.ts:64-73`
- **Description:** After removing a member, pending invitations cached from an earlier admin view (once BUG-01 is fixed) and the group's expenses (displayed names) can stay stale because `useGroupExpenses` key isn't invalidated.
- **Reproduction:** Remove a member → their name may still show on expense rows until a natural refetch.
- **Expected:** Invalidate `groups.expenses(id)` and `invitations.forGroup(id, "pending")` too.
- **Actual:** Stale expense rows; stale invitation list.
- **Suggested fix:** Expand the `onSuccess` invalidation set.

#### BUG-21 — `useDeleteSettlement` / `useCreateSettlement` don't invalidate the corresponding expenses cache entry used by the dashboard "recent transactions" list
- **Severity:** Low-Medium
- **Platforms:** web
- **Files:** `web/src/lib/queries/useGroups.ts:97-117`
- **Description:** Creating/deleting a settlement updates balances but not the group-expense list, which is correct. However, if the web UI ever surfaces settlement entries mixed with expenses on a dashboard (and BUG-NN is that the dashboard recent-activity will not get settlements invalidation at all here), state drifts.
- **Suggested fix:** Audit whether any dashboard widget depends on the settlements list and include the relevant invalidations.

#### BUG-22 — `formatCurrencyAbbreviated` lakhs threshold is 10 lakhs, not 1 lakh
- **Severity:** Medium (India UX)
- **Platforms:** mobile
- **Files:** `mobile/src/utils/currency.ts:39`
- **Description:** The lakhs branch kicks in at `abs >= 1_000_000` (= 10 lakhs). Indian convention calls 1,00,000 (1 lakh) "₹1L". Values between 1L and 10L are shown as "₹500K", "₹999K", etc. Inconsistent with convention.
- **Suggested fix:** Lower the threshold to `>= 100_000`.

#### BUG-23 — Rate-limit buckets collide in local/non-proxy environments
- **Severity:** Medium
- **Platforms:** server
- **Files:** `server/src/middleware/rateLimit.ts:27-98`
- **Description:** When `TRUST_PROXY !== "true"`, `getClientIP` returns `"unknown"` for all callers, so `checkAuthRateLimit` lumps every request into a single `ip:unknown` bucket → local dev can't test auth beyond 10 logins/min across ALL users. The general limiter gets around it by keying on last-16-chars of Authorization, but unauthenticated requests (Google OAuth exchange, register, login) all share the bucket.
- **Also:** `getRateLimitHeaders` always reads by `clientIP` regardless of whether the actual bucket was keyed by `user:*`, so the `X-RateLimit-*` headers are often misleading.
- **Suggested fix:** In dev, fall back to `req.socket.remoteAddress` (not trivially available in Bun.serve but retrievable via the `server.requestIP` API). Or gate the header code on the same key function.

#### BUG-24 — CORS `credentials: true` + `*` reflect-origin is permissive
- **Severity:** Medium (low risk because auth is Bearer, not cookies)
- **Platforms:** server
- **Files:** `server/src/middleware/cors.ts:11-30`
- **Description:** When `CORS_ORIGIN=*`, the middleware reflects the request origin back and sets `Access-Control-Allow-Credentials: true`. While Bakaya auth is Bearer-token (no cookies), a future cookie-backed endpoint would immediately be vulnerable to CSRF. Also, when origin is not allowed, it responds with `allowedOrigins[0]` which is a fail-open style that will still allow the request through unless the browser is strict.
- **Suggested fix:** Enumerate origins explicitly; never reflect arbitrary origin with credentials.

#### BUG-25 — `toISODate` in date pickers uses local timezone, not IST — drifts for non-IST users
- **Severity:** Medium
- **Platforms:** web + mobile
- **Files:**
  - `web/src/components/DateRangePicker.tsx:26-31`
  - `web/src/app/dashboard/analytics/page.tsx:33-38`
  - `web/src/app/dashboard/profiles/page.tsx:47-49`
  - `mobile/src/screens/Expense/ExpenseDetailScreen.tsx:43-48`
  - `mobile/src/screens/Analytics/AnalyticsScreen.tsx:73-78`
- **Description:** All client date-range computations use `d.getFullYear()/getMonth()/getDate()` which read local time. Server parses that string as IST midnight. For an IST user they match. For a user in, say, PST (UTC-8) at 00:30 PST on Feb 1, `getMonth()` returns 1 (Feb) but the equivalent IST is Feb 1 14:00 — still fine. But at 23:30 PST Jan 31 → local says Jan 31, server IST interprets "2026-01-31" start-of-day as IST and data shifts. Net: for non-IST users, the "This Month" preset picks the wrong IST month around midnight local.
- **Suggested fix:** Compute boundaries in IST explicitly (`Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Kolkata'})`).

#### BUG-26 — Mobile invitations service's `cancelInvitation` type is wrong-shape
- **Severity:** Medium
- **Platforms:** mobile
- **Files:** `mobile/src/services/invitationService.ts:47-54`
- **Description:** The declared return is `{ success, data: { cancelled: boolean }, meta }` but the server returns the populated invitation `{ success, data: <GroupInvitation>, meta }`. No consumer currently reads past `await`, so runtime is fine, but the type lies about the shape, and the `await` in GroupDetailScreen doesn't branch on the return → if the response shape ever changes, this silently breaks.
- **Suggested fix:** Align type with `InvitationResponse`.

#### BUG-27 — Server `findGroupById` relies on `_id` vs `id` duck-typing; a populated-member check can silently fail
- **Severity:** Medium
- **Platforms:** server
- **Files:** `server/src/controllers/group.controller.ts:39-41`, `server/src/controllers/groupExpense.controller.ts:13-18`, `server/src/controllers/settlement.controller.ts:13-18`
- **Description:** The helper is `(m.userId?._id || m.userId)?.toString() === userId`. Because `User.toJSON` deletes `_id` and adds `id` (see `User.ts:103-112`), a populated member's `userId` object only has `.id`, not `._id`. The `_id || userId` fallback then stringifies the entire populated object, which fails the compare. In practice the populate preserves `_id` on the underlying doc before toJSON is applied — but if any other code path runs the result through `toJSON` before this check, membership silently fails.
- **Suggested fix:** Normalize to `(m.userId?._id ?? m.userId?.id ?? m.userId).toString()` in one shared helper.

#### BUG-28 — `getGroupBalances` doesn't exclude removed members; UI maps to "Unknown member"
- **Severity:** Medium
- **Platforms:** server + mobile + web
- **Files:**
  - `server/src/services/groupExpense.service.ts:167-201`
  - `mobile/src/screens/Group/GroupDetailScreen.tsx:109-126`
  - `web/src/app/dashboard/groups/[id]/page.tsx:271-291`
- **Description:** Balances are computed from expenses + settlements, which keep references to removed/deleted users. If a member is removed while holding a non-zero balance, they stay in the `balances` map forever. Mobile's `getMemberName` returns "Unknown member"; web's `resolveUserName` falls back to the raw ObjectId.
- **Suggested fix:** Either block removeMember while balance is non-zero, or render "Former member — ₹X" explicitly and suggest a settlement/write-off.

#### BUG-29 — Mobile home screen's in-flight staleness guard + selectedProfile change can show stale expenses
- **Severity:** Medium
- **Platforms:** mobile
- **Files:** `mobile/src/screens/Home/HomeScreen.tsx:117-281`
- **Description:** `fetchAllData` short-circuits when `Date.now() - lastFetchTime.current < 30000`. A user who adds an expense and navigates back within 30s to Home → list unchanged; they may re-tap the FAB, duplicate-submit, or tap-again-tap-refresh. Pull-to-refresh resets it but users may not know. Same pattern in `GroupDetailScreen.tsx:148` and `Analytics`, `ExpenseDetail`, `Profiles`, `Invitations`.
- **Suggested fix:** Instead of staleness-gating on focus, invalidate on mutation (easier with TanStack mutations). The mobile app has the persister set up but no useQuery calls — migrate screens to TanStack.

#### BUG-30 — Mobile queryClient + persister are wired up but no screen uses `useQuery`
- **Severity:** Low (dead code) / Medium (missed opportunity causing bug #29)
- **Platforms:** mobile
- **Files:** `mobile/src/App.tsx:22-28`, `mobile/src/lib/queryClient.ts`, `mobile/src/lib/persister.ts`, `mobile/src/hooks/useRefreshOnFocus.ts`
- **Description:** `PersistQueryClientProvider` wraps the app, but `mobile/src/screens/**` contains zero `useQuery` / `useMutation` usage. The persister caches nothing; the 24h-maxAge persisted cache is always empty. Mobile data fetching is all ad-hoc useState + useFocusEffect + 30s staleness refs. This is the root cause of BUG-29 and contributes to BUG-05's AsyncStorage leak (cache key exists but no data is written — so it's only a bug if a future screen starts using useQuery without a logout-clear).
- **Suggested fix:** Migrate screens to TanStack Query (as the migration doc at `mobile/TANSTACK_MIGRATION.md` outlines) and invalidate on mutations.

---

### LOW

#### BUG-31 — Profile update doesn't invalidate expense/analytics caches
- **Severity:** Low
- **Platforms:** web
- **Files:** `web/src/app/dashboard/profiles/[id]/edit/page.tsx:68-70`
- **Description:** Updating a profile name/color only invalidates `profiles.*`. Expense rows and analytics byProfile still show the old name/color until a natural refetch.
- **Suggested fix:** Also invalidate `expenses.all` and `analytics.all`.

#### BUG-32 — Mobile logout never calls server `/auth/logout`; server device stays active
- **Severity:** Low
- **Platforms:** mobile
- **Files:** `mobile/src/context/AuthContext.tsx:95-103`
- **Description:** Logout clears local storage only. The Device document stays `isActive: true`. If FCM push is added later, notifications keep flowing.
- **Suggested fix:** Call `authedFetch('/api/v1/auth/logout', {method: 'POST'})` best-effort before clearing local state.

#### BUG-33 — `createPersonalExpense` auto-creates a default profile as a SIDE EFFECT of a GET-like operation
- **Severity:** Low
- **Platforms:** server
- **Files:** `server/src/controllers/expense.controller.ts:65-69`
- **Description:** If an expense is created without `profileId`, the server calls `createDefaultProfile` which will create a profile named "Self" if one doesn't exist. For old accounts that had no default profile, the very first expense they create silently provisions a "Self". This is probably intended, but race condition: two concurrent POSTs from the same user with no default profile could both create one (only one would succeed because of the unique `{userId,name}` index, but the second throws E11000 → 500 to user).
- **Suggested fix:** Wrap the default-profile creation in a `findOneAndUpdate({userId, isDefault: true}, {$setOnInsert: {...}}, {upsert: true})`. Already partly mitigated by `createDefaultProfile` checking `existing` first, but the check+insert is not atomic.

#### BUG-34 — Auth rate-limit on register uses IP-only bucket → easy DoS across users
- **Severity:** Low-Medium
- **Platforms:** server
- **Files:** `server/src/middleware/rateLimit.ts:69-71` (`AUTH_RATE_LIMIT_MAX = 10`)
- **Description:** `checkAuthRateLimit` keys on IP regardless of endpoint. A single coffee-shop NAT can only do 10 register/login attempts per minute across ALL patrons sharing the IP.
- **Suggested fix:** Split buckets by endpoint and consider a slow-down rather than hard-reject at small counts.

#### BUG-35 — Mobile's `authedFetch` reads response body twice on some error paths
- **Severity:** Low
- **Platforms:** mobile
- **Files:** `mobile/src/lib/authedFetch.ts:230-250`
- **Description:** After the 401-refresh retry sets `response = await attempt(...)`, if the retried response is also non-ok, the code reads `response.text()` twice (once in error path, once normally if !response.ok) — actually only once in this file, but the earlier `rawFetch` + `authedFetch` split means `response.text()` in `authService.ts` can be consumed twice if error handling branches. In `authService.ts:50-53` the error path reads `text()` inside the error body try; then control falls through the `if (!response.ok)` → throw. Not a double read because `response` is then discarded. No actual bug, but the code is easy to mis-edit into one.
- **Suggested fix:** Consolidate error parsing into a single helper.

#### BUG-36 — Analytics `changePercent` division-by-zero is guarded; but "100% increase from 0" hides
- **Severity:** Low
- **Platforms:** web + mobile
- **Files:** `web/src/app/dashboard/analytics/page.tsx:118-125`, `mobile/src/screens/Analytics/AnalyticsScreen.tsx:279-316` (similar shape)
- **Description:** When previous month is 0, `changePercent` returns `null` (no display). Expected UX probably is "new" or "N/A" or even just `+∞`; silent omission makes it unclear whether there was no previous data or no change.
- **Suggested fix:** Render a distinct "New" chip when previous == 0 and current > 0.

#### BUG-37 — `expenseQuerySchema` allows `search` with regex metacharacters; service escapes them — but aggregation uses `filter.$or` with regex, which is O(N)
- **Severity:** Low (perf, not correctness)
- **Platforms:** server
- **Files:** `server/src/services/expense.service.ts:58-63`
- **Description:** Input is escaped (good) — no ReDoS or operator injection risk. But at scale the anchored-free regex scan across `title` + `notes` for every filter is unindexed. Not a correctness bug; flagged because it affects the search UX response time once an account has many expenses.
- **Suggested fix:** Add a text index on `{title: "text", notes: "text"}` and switch to `$text` when search is present.

#### BUG-38 — `exportCSV` date uses `toISTDateStr` but columns are not clearly labelled as IST
- **Severity:** Low (user confusion)
- **Platforms:** server
- **Files:** `server/src/controllers/expense.controller.ts:175-189`
- **Description:** Dates exported to CSV are IST date strings, but the header just says `Date` and the value like `2026-04-23` is ambiguous. Users opening the CSV in a spreadsheet in another timezone will misinterpret.
- **Suggested fix:** Header: `Date (IST)`.

#### BUG-39 — Mobile `ExpenseDetail` CSV export uses local timezone, not IST
- **Severity:** Low
- **Platforms:** mobile
- **Files:** `mobile/src/screens/Expense/ExpenseDetailScreen.tsx:364` (`toISODate(new Date(exp.createdAt))`)
- **Description:** The mobile export computes `toISODate` from local time, so an expense created at 23:30 IST on Apr 23 shows as Apr 24 for a device in UTC+6. Server-side export uses IST consistently.
- **Suggested fix:** Use the same IST-anchored formatting.

#### BUG-40 — Emoji field on Category has loose validation; accepts plain text or multi-emoji
- **Severity:** Low
- **Platforms:** server + clients
- **Files:** `server/src/schemas/category.schema.ts:5` (`emoji: z.string().min(1).max(10)`)
- **Description:** "Emoji" is just a 1–10 char string. You can set it to `"ha"`. Not dangerous (no XSS — React escapes text), but breaks the implicit UX contract of emoji == pictogram.
- **Suggested fix:** Validate with a grapheme-cluster regex or rely on a constrained emoji picker + server-side re-check.

#### BUG-41 — `Profile.color` and `Profile.avatar` have only `max` length; no format/hex/URL validation
- **Severity:** Low
- **Platforms:** server
- **Files:** `server/src/schemas/profile.schema.ts:3-8`
- **Description:** `color` should be a 7-char hex; `avatar` should be a URL or known identifier. Current schema allows any string up to the length limit. React's default escaping stops XSS but the UI uses `{ backgroundColor: profile.color }` — a bad string produces CSS no-op rather than broken layout. Low risk.
- **Suggested fix:** Add `.regex(/^#[0-9A-Fa-f]{6}$/)` to `color`.

---

## 3. Logic walkthroughs

### Authentication
- Local register: clean. Server checks duplicate email (case-insensitive via lowercase store), duplicate username (guarded), password policy (8+ chars + upper+lower+digit). Web register's error mapping **broken** — see BUG-09.
- Local login: clean server-side. Mobile login has **weaker password validator** (BUG-10). Web login validator is just non-empty — correct.
- Google OAuth: server verifies Firebase JWT via jose + cached JWKS. Double-checks `email_verified` and `sign_in_provider === "google.com"`. Prevents Google-login from auto-linking to a local-auth email (good). Clean overall.
- Refresh flow: dedup'd on mobile via `getOrStartRefresh`, on web via `refreshPromise` mutex — good. Rotates access+refresh pair on every refresh. **No deny-list** (BUG-13).
- Logout: mobile clears local storage but misses query-cache and persister (BUG-05, BUG-32). Web clears localStorage only (BUG-05). No password-reset flow exists.

### Personal expenses
- Add/edit/delete/list: pagination at `max(100)` on server; search is regex-escaped; filters compose correctly at the Mongo level (`filter.$or` for search, explicit `createdAt: {$gte,$lte}` for dates, etc.). Clean.
- Income vs expense: server splits aggregation by `type`. Web edit handles type correctly. **Mobile edit forces every record to "expense"** (BUG-04).
- Profile linking: `createPersonalExpense` auto-creates a "Self" profile if none exists (see BUG-33 race). Editing with a profile not belonging to the user returns 403. Clean.
- Deletion cascade: personal expenses are only cascaded on full user delete; profile delete is blocked if expenses exist (good).
- Decimals: amounts stored as numbers; risks at extreme values (1e10 etc.) would produce IEEE-754 rounding, but server enforces `.positive()` and clients clean input. No `parseFloat` footgun beyond the known group-expense math.
- Dates: server stores UTC, IST is canonical for date boundaries. Client date-range pickers all compute boundaries in LOCAL time — drifts for non-IST users (BUG-25).

### Profiles
- Create/edit/delete: clean API. Unique `{userId,name}`.
- "Self" uniqueness is NOT enforced beyond name uniqueness (BUG-16).
- Deletion blocked when profile has expenses — good design.
- Default profile auto-creation is idempotent via `createDefaultProfile`, with a small race window (BUG-33).

### Categories
- Create/edit/delete/reorder: server enforces max 50, unique name per user (case-insensitive collation). Can't delete "Other".
- Rename and delete do NOT propagate to expenses' `category` string field (BUG-15).
- Default categories seeded lazily in `getCategories` if zero exist — good fallback.

### Analytics
- Summary / byProfile / byCategory: correctly filter `type !== "income"` → returns spend only. Grouped + projected cleanly.
- Balance: segregates income vs expense via `$group by type`. `spentPercentage` capped correctly on clients. Daily rate math: off-by-one at boundaries (BUG-17).
- Trends: pipeline drops empty months (BUG-18).
- Empty periods: return 0s, not errors.
- This flow has issues — see bugs #17, #18, #25.

### Groups
- CRUD: admin-only for updates (BUG-20 for invalidation). Creator-only for delete (stricter than admin — by design).
- Delete cascades expenses + settlements; misses invitations (BUG-08).
- Remove member: non-admin can remove themselves; creator can't be removed. Doesn't check outstanding balance (BUG-28).

### Invitations
- Send: email must exist in User collection — enforced. Prevents self-invite, already-member, duplicate-pending. Race → 500 (BUG-12).
- Read (list): **completely broken** response shape across all consumers (BUG-01).
- Accept/decline: expiry checked lazily in `loadPendingInvitationForUser`. Works, but `listMyInvitations` already filters `expiresAt > now` for pending → expired invites are hidden from the UI (good). No background cron.
- Cancel: inviter or admin. Race between cancel + accept = two writes on the same doc; Mongo's write serialization prevents inconsistency but the API returns 400 "no longer pending" for whichever loses.
- Email rebound (same email rebound to new user) — NOT handled. `invitedUserId` is snapshot at invitation time. If user account is deleted and a new account with same email is created, the old invitation still references the old userId. Accept fails with "This invitation is not for you" (forbidden 403). Flow has issues — see bugs #01, #02, #08, #12.

### Group expenses (logic-only, math skipped)
- Create: paidBy trust issue (BUG-11). Member validation on `splitAmong` entries works.
- Edit: schema missing `paidBy` (BUG-03). Stale member snapshot (BUG-19).
- Delete: payer-only with confusing 404 (BUG-06).
- Create with `paidBy` not in `splitAmong`: allowed — matches Splitwise (I paid, only others split). OK.
- Create with `paidBy` not a group member: rejected. Good.

### Settlements
- Create: server enforces `paidBy === userId`, both must be members, paidBy ≠ paidTo. Good.
- Over-settle: NOT prevented. Could record a settlement greater than current balance — flips sign. (Arguable: Splitwise allows this since records are just "I gave you ₹X".)
- Delete: allowed by any group member (no payer-only guard for settlements, unlike group-expenses). Seems inconsistent but probably intentional.
- Balance-reversion on delete: works correctly — balances are computed live from all expenses + settlements.

### Navigation & state
- Mobile deep-link coverage: minimal (React Navigation stack with no `linking` configuration). Low risk.
- Back-button refresh: mobile uses `useFocusEffect` + 30s staleness guard (BUG-29).
- Rapid taps: mostly guarded with `isLoading`/`isPending` checks, BUT:
  - `AddGroupExpenseScreen.handleAddExpense` guards `loading` and sets it at the start, OK.
  - `ExpenseDetailScreen.handleConfirmDelete` uses optimistic removal + re-fetch; fast double-delete would hit same ID twice, second returns 404 (caught in catch, but shows alert).

### Persistence & offline
- Mobile TanStack persister stores nothing because no `useQuery` usage (BUG-30). If a screen starts using useQuery without a logout clear, BUG-05 becomes severe.
- Web localStorage: all JSON.parse calls are try/wrapped. Clean.

### Permissions
- Personal expenses: userId ownership checks everywhere. Clean.
- Group expenses: member-only on read/update/delete; payer-only on delete (BUG-06); impersonation possible on paidBy in create (BUG-11).
- Settlements: member-only + paidBy===userId enforced. Clean.
- Admin user CRUD: `requireAdmin` helper on all user routes. Clean.
- Direct ID guessing for cross-user reads: tested — all return 403/404 correctly.

### Input validation
- XSS: React escapes by default. No `dangerouslySetInnerHTML` anywhere in web. Mobile uses `<Text>` which escapes. Clean.
- NoSQL operator injection: all queries use `new mongoose.Types.ObjectId(...)` casts OR Zod string schemas → safe. Search uses escaped regex.
- Max lengths: mostly covered in Zod schemas (email 254 implicit via email, password no max, title 200, notes 500, name 100, emoji 10, color 20, category 50). No password max length is mildly concerning — a 2MB password POST causes bcrypt to do expensive work before rejecting. Low priority.

### Timezone & dates
- Server: uses `parseISTDate` and `toISTDateStr` utilities consistently for analytics + export. Good.
- Clients: compute ranges in local time (BUG-25).

### Error handling consistency
- Server: most controllers map known errors; generic case → 500 via `internalErrorResponse`. A few paths `throw error` after logging, which goes to the top-level `error()` handler and returns 500 — fine.
- Mobile `authedFetch`: detailed error mapping (timeout, network, JSON parse). Clean.
- `catch {}` empty blocks: `web/src/app/dashboard/expenses/page.tsx:87-89` silently swallows export failures (BUG-14 side effect).

### Concurrency
- Refresh dedup: correctly implemented on both web (refreshPromise mutex) and mobile (getOrStartRefresh).
- TanStack mutations: web invalidates broadly. A few miss-cases (BUG-20, BUG-31).
- Double-submit: most forms gate with `isPending`; a few still show the button live during delete dialog (e.g. delete mutation fires on first click, dialog stays, second click disabled). OK.

---

## 4. Security flags

- **SEC-01** (BUG-11): Group-expense `paidBy` is not forced to the authenticated user — any member can log "A paid" as "B paid".
- **SEC-02** (BUG-13): Refresh-token rotation has no deny-list; stolen refresh tokens are replayable until natural expiry.
- **SEC-03** (BUG-24): CORS reflects arbitrary origins when `CORS_ORIGIN=*` and ships `credentials: true`. Low impact today (Bearer, not cookies) but a footgun.
- **SEC-04** (BUG-34): Global auth rate-limit of 10/min/IP lumps all register/login attempts behind a NAT. Easy DoS.
- **SEC-05**: Swagger is mounted at `/api-docs` and served unconditionally (`server/src/index.ts:52-68`, `server/src/plugins/swagger.plugin.ts`). Should be gated to non-production.
- **SEC-06**: Logout on server only marks devices inactive; JWT access tokens remain valid until expiry. Accepted design for stateless JWT, but explicit token revocation is absent (linked to SEC-02).

---

## 5. Data integrity flags

- **DI-01** (BUG-07, BUG-28): Removed/deleted users leave references inside `GroupExpense.paidBy`, `GroupExpense.splitAmong.userId`, `GroupInvitation.invitedBy`, `GroupInvitation.invitedUserId`. Balances cannot be cleanly attributed.
- **DI-02** (BUG-08): Group deletion leaves orphaned invitations.
- **DI-03** (BUG-15): Category `name` is a denormalized string on `Expense`. Rename/delete don't propagate. Recreating a same-named category "re-links" old expenses accidentally.
- **DI-04** (BUG-16): Multiple `relationship: "self"` profiles possible.
- **DI-05** (BUG-04): Mobile edit of an income record persists both `source` and `category` because type isn't updated.
- **DI-06** (BUG-03): `paidBy` change on group expense is silently ignored → balance history diverges from user intent.
- **DI-07** (BUG-33): Narrow race in `createDefaultProfile` can hit the unique `{userId,name}` index and return 500 to the second concurrent expense-create.
- **DI-08**: `updateExpense` on server uses `$set: input` without unsetting mutually-exclusive fields. A record that was originally `{type: income, source: Salary}` edited on web to `{type: expense, category: Food}` will still have `source` in Mongo because Zod strips undefined and `$set` doesn't unset.

---

## 6. Open questions (need product decisions)

- **Q-1 (BUG-06):** Should group admins be able to delete any expense, or only payers? Splitwise allows any member to delete any expense in a group.
- **Q-2 (BUG-11):** Is "log an expense on someone else's behalf" a feature or an exploit? Splitwise allows it; Bakaya's intent is unclear.
- **Q-3 (BUG-16):** Is "only one Self profile per account" a product rule, or should users be allowed multiple personal profiles (e.g. "Self — Personal" and "Self — Business")?
- **Q-4 (BUG-18):** Should trend chart fill zero months? (UX opinion: yes.)
- **Q-5:** When a member is removed with a non-zero balance, what's the resolution? (Write-off? Force settle-first? Leave as ghost?)
- **Q-6:** Should invitations auto-expire via a cron, or is the existing lazy-filter-on-read sufficient? (Today: `listMyInvitations` hides expired; but a user with many stale invites sees no surface to clean them.)
- **Q-7 (BUG-15):** Category as denormalized string vs reference — which direction does the product want to go?
- **Q-8:** Mobile uses local-state + useFocusEffect while web uses TanStack Query. Should mobile complete the TanStack migration hinted at in `mobile/TANSTACK_MIGRATION.md`? This would fix BUG-29 and unblock proper invalidation-based UX.
- **Q-9 (BUG-25):** Should "This Month" always mean IST, or the user's local timezone? Product intent from the docs (`server/src/utils/date.ts`) says IST is canonical, but clients contradict.

---

## Appendix — Files cited (absolute)

Server:
- `E:\shevait-projects\bakaya-app\server\src\index.ts`
- `E:\shevait-projects\bakaya-app\server\src\routes\index.ts`
- `E:\shevait-projects\bakaya-app\server\src\middleware\auth.ts`
- `E:\shevait-projects\bakaya-app\server\src\middleware\cors.ts`
- `E:\shevait-projects\bakaya-app\server\src\middleware\rateLimit.ts`
- `E:\shevait-projects\bakaya-app\server\src\utils\date.ts`
- `E:\shevait-projects\bakaya-app\server\src\utils\response.ts`
- `E:\shevait-projects\bakaya-app\server\src\controllers\auth.controller.ts`
- `E:\shevait-projects\bakaya-app\server\src\controllers\expense.controller.ts`
- `E:\shevait-projects\bakaya-app\server\src\controllers\profile.controller.ts`
- `E:\shevait-projects\bakaya-app\server\src\controllers\group.controller.ts`
- `E:\shevait-projects\bakaya-app\server\src\controllers\groupExpense.controller.ts`
- `E:\shevait-projects\bakaya-app\server\src\controllers\settlement.controller.ts`
- `E:\shevait-projects\bakaya-app\server\src\controllers\invitation.controller.ts`
- `E:\shevait-projects\bakaya-app\server\src\controllers\category.controller.ts`
- `E:\shevait-projects\bakaya-app\server\src\controllers\analytics.controller.ts`
- `E:\shevait-projects\bakaya-app\server\src\controllers\user.controller.ts`
- `E:\shevait-projects\bakaya-app\server\src\services\expense.service.ts`
- `E:\shevait-projects\bakaya-app\server\src\services\profile.service.ts`
- `E:\shevait-projects\bakaya-app\server\src\services\group.service.ts`
- `E:\shevait-projects\bakaya-app\server\src\services\groupExpense.service.ts`
- `E:\shevait-projects\bakaya-app\server\src\services\settlement.service.ts`
- `E:\shevait-projects\bakaya-app\server\src\services\invitation.service.ts`
- `E:\shevait-projects\bakaya-app\server\src\services\category.service.ts`
- `E:\shevait-projects\bakaya-app\server\src\services\analytics.service.ts`
- `E:\shevait-projects\bakaya-app\server\src\services\user.service.ts`
- `E:\shevait-projects\bakaya-app\server\src\schemas\auth.schema.ts`
- `E:\shevait-projects\bakaya-app\server\src\schemas\expense.schema.ts`
- `E:\shevait-projects\bakaya-app\server\src\schemas\profile.schema.ts`
- `E:\shevait-projects\bakaya-app\server\src\schemas\group.schema.ts`
- `E:\shevait-projects\bakaya-app\server\src\schemas\groupExpense.schema.ts`
- `E:\shevait-projects\bakaya-app\server\src\schemas\settlement.schema.ts`
- `E:\shevait-projects\bakaya-app\server\src\schemas\category.schema.ts`
- `E:\shevait-projects\bakaya-app\server\src\schemas\analytics.schema.ts`
- `E:\shevait-projects\bakaya-app\server\src\models\User.ts`
- `E:\shevait-projects\bakaya-app\server\src\models\Profile.ts`
- `E:\shevait-projects\bakaya-app\server\src\models\Expense.ts`
- `E:\shevait-projects\bakaya-app\server\src\models\Group.ts`
- `E:\shevait-projects\bakaya-app\server\src\models\GroupExpense.ts`
- `E:\shevait-projects\bakaya-app\server\src\models\Settlement.ts`
- `E:\shevait-projects\bakaya-app\server\src\models\GroupInvitation.ts`
- `E:\shevait-projects\bakaya-app\server\src\models\Category.ts`
- `E:\shevait-projects\bakaya-app\server\src\data\defaultCategories.ts`

Mobile:
- `E:\shevait-projects\bakaya-app\mobile\src\App.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\context\AuthContext.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\lib\authedFetch.ts`
- `E:\shevait-projects\bakaya-app\mobile\src\lib\queryClient.ts`
- `E:\shevait-projects\bakaya-app\mobile\src\lib\persister.ts`
- `E:\shevait-projects\bakaya-app\mobile\src\hooks\useProactiveRefresh.ts`
- `E:\shevait-projects\bakaya-app\mobile\src\utils\storage.ts`
- `E:\shevait-projects\bakaya-app\mobile\src\utils\currency.ts`
- `E:\shevait-projects\bakaya-app\mobile\src\services\expenseService.ts`
- `E:\shevait-projects\bakaya-app\mobile\src\services\authService.ts`
- `E:\shevait-projects\bakaya-app\mobile\src\services\invitationService.ts`
- `E:\shevait-projects\bakaya-app\mobile\src\types\invitation.ts`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Auth\LoginScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Auth\RegisterScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Home\HomeScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Settings\SettingsScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Expense\AddExpenseScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Expense\EditExpenseScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Expense\ExpenseDetailScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Profile\ProfilesScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Profile\AddProfileScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Group\GroupDetailScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Group\AddGroupExpenseScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Group\EditGroupExpenseScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Group\SettleUpScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Invitations\InvitationsScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Analytics\AnalyticsScreen.tsx`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Category\CategoriesScreen.tsx`

Web:
- `E:\shevait-projects\bakaya-app\web\src\lib\api-client.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\api\auth.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\api\expenses.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\api\groups.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\api\invitations.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\api\profiles.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\api\categories.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\api\analytics.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\queries\index.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\queries\useInvitations.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\queries\useExpenses.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\queries\useGroups.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\queries\useCategories.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\queries\useProfiles.ts`
- `E:\shevait-projects\bakaya-app\web\src\lib\use-proactive-refresh.ts`
- `E:\shevait-projects\bakaya-app\web\src\components\DateRangePicker.tsx`
- `E:\shevait-projects\bakaya-app\web\src\app\login\page.tsx`
- `E:\shevait-projects\bakaya-app\web\src\app\register\page.tsx`
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\layout.tsx`
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\page.tsx`
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\expenses\page.tsx`
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\expenses\new\page.tsx`
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\expenses\[id]\edit\page.tsx`
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\profiles\page.tsx`
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\profiles\new\page.tsx`
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\profiles\[id]\edit\page.tsx`
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\groups\[id]\page.tsx`
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\invitations\page.tsx`
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\analytics\page.tsx`
