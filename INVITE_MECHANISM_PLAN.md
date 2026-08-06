# Invite Mechanism — Implementation Plan

**Date:** 6 August 2026
**Goal:** remove the hard viral ceiling — today you cannot invite anyone who does not already have a Bakaya account (`GroupInvitation.invitedUserId` is required; `invitation.service.ts:34-35` throws *"No registered user with that email"*).
**Status:** plan only. No code written.

---

## 1. The architectural decision — read this first

Two research streams reached different conclusions. Both are right about their own evidence; they are answering different questions.

| | **Option A — Shadow User rows** | **Option B — Per-group member entities** |
|---|---|---|
| **Idea** | Create a real but credential-less `User` document for each placeholder | Money records point at a per-group `member`, not at a `User`. A user *claims* a member |
| **Upfront diff** | **Small.** Zero changes to aggregations, indexes, or service guards | **Large.** Repoint `GroupExpense.paidBy`, `GroupExpense.splitAmong[].userId`, `Settlement.paidBy/paidTo` from `ref: "User"` to member refs, plus a migration of existing rows |
| **What "claiming" does** | Rewrites **6 fields across 4 collections** | **Nothing.** It writes one link row. Balances never move |
| **Risk profile** | Multi-document rewrite with **no transaction support available** | Claim is a single-document write. Structurally safe |
| **Precedent** | None found | **Settle Up ships exactly this.** Their public API docs state: *"Members are virtual entities unique per group"* |

### Recommendation: **Option B.**

The deciding factor is not elegance, it's this finding from the codebase audit:

> If a placeholder is claimed by someone already in the group, `Group.members` holds two rows for one user — and `group.members.length` is the equal-split denominator (`groupExpense.service.ts:111`). That user silently takes **2/N of every future split**. Splits still sum to the total, `sum(balances) ≈ 0` still holds, and **no validation anywhere fires**.

Option A's claim path is a 6-field, 4-collection rewrite on a database with **no `startSession` anywhere in `server/src`** and a `MONGODB_URI` that defaults to a standalone node (`config/env.ts:12`). A partial rewrite also preserves `sum(balances) ≈ 0`, so the one invariant the system has cannot detect it — while individual balances are wrong, and `computePairwiseOwed` then feeds those wrong numbers into the settlement overpayment guard.

Option B deletes that entire failure class rather than guarding it. Claiming moves no money because money was never attached to a user in the first place.

**The cost is honest and should be stated plainly:** repointing the money refs is the real work, and it needs a data migration. But it is *far* cheaper now than after you have production ledgers — the same reasoning as adding the `currency` field early. **If you already have meaningful production data, say so, because that changes the migration plan and possibly the recommendation.**

---

## 2. Data model

### 2.1 New: `GroupMember` (the per-group identity)

Replaces the embedded `Group.members[]` array as the identity of record.

```
GroupMember {
  _id           ObjectId      // <- what all money records point at
  groupId       ObjectId      indexed
  displayName   String        // "Rahul" — works with no account
  userId        ObjectId?     // null until claimed
  role          "admin" | "member"
  invitedEmail  String?       // optional matching hint
  joinedAt      Date
  claimedAt     Date?
}
```

Indexes: `{groupId}`, `{userId}` (sparse), and a **unique partial index on `{groupId, userId}` where `userId` exists** — this is the single guard that makes double-claim impossible at the database level rather than in application code.

### 2.2 Changed: money records point at members

| Field | From | To |
|---|---|---|
| `GroupExpense.paidBy` | `ref: "User"` | `ref: "GroupMember"` |
| `GroupExpense.splitAmong[].userId` | `ref: "User"` | `memberId`, `ref: "GroupMember"` |
| `Settlement.paidBy` / `paidTo` | `ref: "User"` | `ref: "GroupMember"` |

**Good news from the audit:** `getGroupBalances`, `suggestTransfers`, `splitEqually` and `splitByPercentage` are all **key-agnostic over opaque id strings** and need no logic change — only the field names change. `analytics.service.ts` has **zero** group coupling (it reads only the personal `Expense` collection) and is entirely out of scope.

### 2.3 New: `GroupInvite` (the link)

```
GroupInvite {
  _id, groupId, createdBy
  tokenHash     String   // SHA-256 of a 128-bit CSPRNG token. Raw token NEVER stored
  code          String   // 9-char human-typeable, separate from the token
  memberId      ObjectId?  // set = "claim this specific person"; null = "join as someone new"
  maxUses       Number?
  useCount      Number
  expiresAt     Date
  active        Boolean
}
```

Storing only the hash follows OWASP and matches Settle Up, which ships an `inviteLinkHash` field. The 9-character code length is not arbitrary — **Splid raised theirs from 6 to 9 in v1.8.1**, which is real-world evidence that 6 was too weak.

### 2.4 Keep `GroupInvitation` as-is

The existing account-to-account invitation flow works and both clients already implement it (mobile *and* web — web has a complete invitations surface at `web/src/app/dashboard/invitations/`). Leave it. The new link flow sits alongside it.

---

## 3. Fix this bug first — it is live today

Expired invitations never leave `pending` — there is no TTL index and no sweeper — so they permanently occupy the partial unique index slot at `GroupInvitation.ts:79-85`. `invitation.service.ts:46-51` then **blocks re-inviting that person to that group, forever.**

That is a real user-facing bug independent of this plan, and it is roughly an hour of work. Fix it before anything else.

⚠️ It also constrains the design: making `invitedUserId` optional would invert that same index into a *one-pending-email-invite-per-group* limit, because **MongoDB indexes missing fields as `null`**. Another reason not to take Option A's shape.

---

## 4. API surface

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/groups/:id/members` | admin | Add a placeholder member by name — **no account required** |
| POST | `/api/v1/groups/:id/invites` | admin | Mint an invite link (returns the raw token exactly once) |
| DELETE | `/api/v1/groups/:id/invites/:inviteId` | admin | Revoke / reset the link |
| GET | **`/api/v1/join/:token`** | **public** | Preview: group name, member count, whether a specific member is being claimed |
| POST | `/api/v1/join/:token` | authenticated | Join the group, or claim `memberId` |
| GET | **`/api/v1/public/groups/:token/summary`** | **public** | Read-only balances for the no-install web view |
| POST | `/api/v1/groups/:id/members/:memberId/claim` | authenticated | Claim a placeholder you were pointed at |

**Every invitation route today is `protected: true`** — there is currently no endpoint an account-less person can reach at all. The two public routes above are the crux of the change and need the hardest security review.

---

## 5. Security requirements

Non-negotiable, in order:

1. **`noindex` on every `/join/*` page.** WhatsApp leaked ~470,000 group invite links to Google — twice. Our leak would be people's financial balances.
2. **128-bit CSPRNG token, store only the SHA-256 hash.** Raw token appears once, in the response that mints it.
3. **Full link lifecycle**: expiry + `maxUses` + an `active` toggle + a "reset link" action. Discord, Signal and Telegram all ship this combination.
4. **Admin approval queue for link joins** (the Signal/Telegram model). An invite link forwarded into a large WhatsApp group otherwise means strangers land inside a group containing financial balances.
5. **Rate-limit the join endpoint** at 5–10 per 15 minutes keyed on IP, and **return identical responses for not-found and expired** so the endpoint is not a group-existence oracle. Reuse the rate-limit store rather than adding a second mechanism.
6. **Scope what a joiner can do.** A newly joined non-admin must never be able to edit or delete other people's expenses.

---

## 6. Deep-link infrastructure

### 6.1 Currently broken

`mobile/app.json` declares URL schemes but has **no `associatedDomains` and no `intentFilters`**, and `App.tsx:38` passes **no `linking` prop** to `NavigationContainer`. An incoming `bakaya://` URL today opens the app and the payload is **silently discarded**. This must be fixed before any link-based invite can work.

### 6.2 Serving the association files from Next.js

Put both `apple-app-site-association` and `assetlinks.json` in `public/.well-known/`, and force `Content-Type: application/json` via `next.config` `headers()` — headers run before the filesystem, and the extensionless AASA file otherwise serves as `application/octet-stream`, which silently breaks iOS.

Two caching traps to plan around: **Apple's CDN caches AASA for 24–48h** (use `?mode=developer` while testing), and **Android 15+ can take up to 7 days** to re-verify `assetlinks.json`.

### 6.3 Deferred deep linking — the honest answer

This is the "user taps invite → has no app → installs → should land in the right group" problem.

| Platform | Verdict | Detail |
|---|---|---|
| **Android** | **Yes — free, ~1 day** | Play Install Referrer API is current (library 2.2, docs Feb 2026), 90-day retention, via `&referrer=` on the Play URL. An RN wrapper exists; no Expo config plugin was found, so verify autolinking early |
| **iOS** | **No.** | Apple provides no mechanism. Clipboard reading works but **iOS 16+ fires a paste-permission prompt on every programmatic read** — even Branch cannot avoid this; they just wrap it in a button |

**Firebase Dynamic Links is confirmed dead** (shut down 25 Aug 2025; links now 404). There is no free Google replacement.

**So do not sprint on iOS deferred linking.** Remove the problem instead of solving it:
- **Web-first join** — the link lands on a working web page that shows the group and balances without any install.
- **"Tap the link again after installing"** — one instruction, and Universal Links then work correctly.
- **A typeable 9-character code** as the universal fallback. This is what Splid does, and it works everywhere.

---

## 7. User flows

**A. Organiser adds a friend who has no app.** Group → Add member → types "Rahul" → member exists immediately, can be assigned expenses. *Zero friction, zero dependency on Rahul.* This alone removes the ceiling.

**B. Organiser shares the group.** Share link → WhatsApp. Recipient opens it → web page shows the group and balances with no install → "Open in app" / "Get the app" / "I'm Rahul, that's me".

**C. Someone claims a placeholder.** Signs up → the invite token points at `memberId` → confirm "You are Rahul" → `GroupMember.userId` is set. **No balances move.** The partial unique index makes a double-claim structurally impossible.

**D. Stranger with a forwarded link.** Joins → lands in the admin approval queue → admin approves or rejects.

**E. Read-only observer.** Opens the public summary URL, sees balances, never installs anything. This is the funnel-leak fix.

---

## 8. Phased plan

| Phase | Scope | Effort (2 devs) |
|---|---|---|
| **0** | Fix the live expired-invitation bug (TTL + sweeper). Deep-link plumbing: `associatedDomains`, `intentFilters`, `linking` prop, `.well-known/` from Next.js | **1 week** |
| **1** | `GroupMember` model + repoint money refs + **data migration** + backfill. All existing tests must stay green | **2 weeks** |
| **2** | Placeholder members end-to-end (API + mobile + web). **Flow A ships here — the ceiling is removed at the end of this phase** | **1.5 weeks** |
| **3** | Invite links, public join endpoints, web join page, approval queue, full security set | **2 weeks** |
| **4** | Claim flow + read-only public balance view (flows C and E) | **1.5 weeks** |
| **5** | Android deferred deep linking, QR generation and scanning, 9-char code entry | **1 week** |

**Total ≈ 9 weeks.** Phase 2 is the point of maximum value — everything after it is amplification.

---

## 9. Test plan

The migration and the claim path are where money breaks, so they carry the burden:

- **Migration**: a fixture group with expenses and settlements, migrated, with balances asserted **byte-identical before and after**. This is the single most important test in the plan.
- **Double-claim**: two users racing to claim one member — assert exactly one succeeds and the index rejects the other.
- **Equal-split denominator**: assert it counts *members*, and that a claim never changes it. This is the 2/N corruption guard.
- **Settlement cap interaction**: assert suggested transfers never propose an amount `computePairwiseOwed` would reject.
- **Token security**: raw token never persisted; expired and not-found return identical responses; rate limiter trips.
- **Placeholder in every money path**: expense, split, settlement, balances, suggested transfers — all with an unclaimed member.

---

## 10. Explicitly out of scope

Contact-book friend discovery (permission cost, low return) · SMS/phone invites (no phone field on `User`; `authProvider` is `local|google`) · paid attribution SDKs · iOS deferred deep linking · referral bounties (Splitkaro pays ₹500/₹250 — a customer-acquisition decision, not an engineering one).

**Note on identity matching:** email is the only viable key (no phone field), and it *is* reliably verified for both auth providers — but **prefer the token over email matching**, because people frequently sign up with a different address than the one they were invited at.
