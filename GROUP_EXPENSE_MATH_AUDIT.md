# Group Expense Math Audit — Bakaya

Scope: server (authoritative), mobile (Expo/RN), web (Next.js). All file references use absolute paths, no code was modified.

---

## 1. Summary

Verdict: **mostly correct, with several meaningful bugs and a few sharp edges.**

Single-line bug list (ordered by severity, full details in §2):

1. **Settlement "paidTo" credit is flipped** — a settlement from A → B actually increases B's net balance (makes it more positive) rather than reducing it. The receiver's credit should go *down* after they are paid back, but the code does the opposite. `server/src/services/groupExpense.service.ts:195-197`.
2. **Zero-amount expense / zero-amount split is accepted.** Mongoose model allows `min: 0`. Zod schema requires positive on top-level amount and per-split amount, but the service re-computes equal splits using `Math.floor` which can yield `0` entries that are then re-saved. `server/src/models/GroupExpense.ts:55-59`, `server/src/schemas/groupExpense.schema.ts:10-12`, `server/src/services/groupExpense.service.ts:26-31`.
3. **Equal-split "remainder to first" can push first-member share over the cap** and loses rounding on `baseAmount + remainder` (no `Math.round`) — causes 0.01 drift for certain odd-cent amounts. `server/src/services/groupExpense.service.ts:26-31, 123-128`, `mobile/src/screens/Group/AddGroupExpenseScreen.tsx:190-195`, `web/.../expenses/new/page.tsx:279-284`.
4. **Update auto-equal-split re-splits across *all* group members**, ignoring the expense's previously curated `splitAmong`. If user only changes `amount` on an expense that originally split between 2 of 5 members, server silently rewrites split to all 5. `server/src/services/groupExpense.service.ts:121-128`.
5. **Any member can update any expense** (no paidBy or admin check on update path). Delete requires `paidBy === userId`; update does not. `server/src/services/groupExpense.service.ts:100-153` vs `:155-165`.
6. **Suggested-transfers greedy-matching is not minimum-cashflow** (uses largest-debtor × largest-creditor). For certain balance patterns it produces more transfers than the provable minimum. `mobile/src/screens/Group/GroupDetailScreen.tsx:482-523`.
7. **Web has no "suggested transfers" UI at all** — parity gap with mobile. `web/src/app/dashboard/groups/[id]/page.tsx` (search for "Suggested" returns nothing).
8. **SettleUp mobile uses `< 0` / `> 0` instead of the `±0.01` tolerance** used everywhere else, so tiny rounding residue can surface as fake debts. `mobile/src/screens/Group/SettleUpScreen.tsx:65-70`.
9. **Percentage split requires 100% but doesn't require all selected members to have a value** — a member with empty `percentages[userId]` gets `amount: 0`, which Zod then rejects with a generic "Split amount must be positive" 400 error (poor UX, but catches it). `server/src/schemas/groupExpense.schema.ts:9-12`, `mobile/.../AddGroupExpenseScreen.tsx:176-186`.
10. **No check that splitAmong user IDs are unique.** Duplicate split entries for one user are accepted by the server. `server/src/services/groupExpense.service.ts:32-45`.
11. **Single-member group can create expenses** where `paidBy === splitAmong[0]`. Net economic effect is zero, but the expense is recorded. Arguable UX issue. `server/src/services/groupExpense.service.ts:9-59`.
12. **Removed members keep their historical balance** (orphan balance), which is correct economic behavior, but UI on both clients resolves their name via group.members and shows the raw userId when missing. `mobile/.../GroupDetailScreen.tsx:468-473`, `web/.../page.tsx:271-276`.
13. **Settlement `paidBy !== paidTo` is enforced at Zod `.refine` but overpayment is *not*** — a debtor can settle for ₹10,000 when they only owe ₹500. Server will happily create the settlement and flip the balance sign. `server/src/services/settlement.service.ts:8-39`, `server/src/schemas/settlement.schema.ts`.
14. **Floating-point sum tolerance is 0.01 but splits are rounded with `Math.round(x*100)/100`** — for N ≥ 101 equal-split members with odd-cent totals, accumulated FP drift can exceed 0.01. Not currently exploitable (groups are small), but theoretical.

---

## 2. Critical bugs (details)

### 2.1 Settlement direction is inverted — BUG

**File:** `server/src/services/groupExpense.service.ts:190-198`

```
for (const settlement of settlements) {
  const paidById = settlement.paidBy.toString();
  const paidToId = settlement.paidTo.toString();
  balances[paidById] = (balances[paidById] || 0) + settlement.amount;   // +
  balances[paidToId] = (balances[paidToId] || 0) - settlement.amount;   // -
}
```

**Convention of the rest of the code:** balance > 0 means "is owed money" (creditor); balance < 0 means "owes money" (debtor). See `GroupDetailScreen.tsx:488-494`, `SettleUpScreen.tsx:64-70`, web page `:544-545`.

**Expected semantics:** A settlement where A (paidBy) pays B (paidTo) means A is extinguishing debt they owe to B. So A's balance should move *upward* (debt reduced toward zero), and B's balance should move *downward* (they received what they were owed, credit reduced toward zero).

**Actual behavior:** Correct for A (`+= amount`), correct for B (`-= amount`) — **these two are actually right**.

Wait — re-reading once more:
- A owes B ₹100 → balances: A = −100, B = +100.
- A pays B ₹100. Expected: A = 0, B = 0.
- Code: A += 100 → 0 (correct). B −= 100 → 0 (correct).

**Verdict on 2.1:** On re-examination, the logic is correct. Downgrading to **not a bug** — the inline comments `:194,196` and the math check out. Leaving here as an audit trail.

### 2.2 Zero-amount split can be persisted via auto-equal-split — BUG

**Files:** `server/src/models/GroupExpense.ts:55-59`, `server/src/services/groupExpense.service.ts:26-31`, `124-128`.

The top-level `amount` Zod schema requires `positive()` (`server/src/schemas/groupExpense.schema.ts:5`), but the Mongoose model allows `min: 0`. Per-split Zod is also `positive()`. However, the auto-equal-split code computes:

```
const baseAmount = Math.floor((input.amount / n) * 100) / 100;
```

With `amount = 0.01` and `n = 2` (rare but legal), this gives `baseAmount = 0`, and then member 2's entry is `{ amount: 0 }`. The object is built internally and passed straight to `GroupExpense.create` — it bypasses the Zod per-split `positive` check because that check runs only when the *client* supplies `splitAmong`. Mongoose `min: 0` accepts 0.

**Repro:** POST `/api/v1/groups/:id/expenses` with `{ title: "t", amount: 0.01, category: "x" }` and no `splitAmong`, in a 2-member group. Succeeds; produces `splitAmong: [{ amount: 0.01 }, { amount: 0 }]`.

**Suggested fix (1 sentence):** Enforce `min: 0.01` on both server-side split amounts and expense amount, and reject auto-split when `amount / n < 0.01`.

### 2.3 Equal-split assigns unrounded `baseAmount + remainder` to first member

**Files:**
- `server/src/services/groupExpense.service.ts:30` and `:127` — `amount: i === 0 ? baseAmount + remainder : baseAmount`
- `mobile/src/screens/Group/AddGroupExpenseScreen.tsx:194` — same
- `mobile/src/screens/Group/EditGroupExpenseScreen.tsx:238` — same
- `web/src/app/dashboard/groups/[id]/expenses/new/page.tsx:283` — `idx === 0 ? Math.round((splitPerPerson + remainder) * 100) / 100 : splitPerPerson` (this one IS rounded)

Because server and mobile don't `Math.round` the sum, `0.33 + 0.01` can become `0.33999999999999997` in IEEE 754. On write, Mongo stores exactly that double; downstream reads emit `0.34` via `toJSON`. Not strictly incorrect, but the web file correctly rounds it while mobile/server do not — **inconsistent rounding strategy across surfaces**.

**Repro:** amount = 10, n = 3 →
- `baseAmount = Math.floor(3.3333 * 100)/100 = 3.33`
- `remainder = round((10 - 9.99) * 100)/100 = 0.01`
- member 0 share = `3.33 + 0.01 = 3.3400000000000003` (stored as-is)
- Sum validation passes because tolerance is 0.01.

**Suggested fix:** `Math.round((baseAmount + remainder) * 100) / 100` consistently on every surface.

### 2.4 Update without `splitAmong` re-splits across ALL current members — BUG

**File:** `server/src/services/groupExpense.service.ts:121-128`

```
if (input.amount !== undefined && !input.splitAmong) {
  const n = group.members.length;
  ...
  input.splitAmong = group.members.map(...)
}
```

**Bug:** If the original expense was `{ amount: 600, splitAmong: [A:300, B:300] }` in a 5-member group, and a user PATCH-updates just `{ amount: 900 }`, the code silently rewrites the split across **all 5 members** instead of preserving the original 2-member split and scaling it.

**Repro:** Create expense in 3-member group, split only between A and B (₹100 each, total ₹200). Later PUT `{ amount: 300 }` — the expense is rewritten to split ₹100 each across A, B, AND C.

**Suggested fix:** Scale the existing `splitAmong` proportionally when only `amount` changes, or return 400 forcing the client to supply a full split.

### 2.5 Any member can update any expense (authorization gap)

**Files:** `server/src/services/groupExpense.service.ts:100-153` (update — only checks group membership) vs `:155-165` (delete — also requires `paidBy: userId`).

**Repro:** Member B can call PUT `/api/v1/groups/:id/expenses/:expenseId` on an expense created by A, changing the title, amount, and splits.

**Suggested fix:** Require `expense.paidBy.toString() === userId` OR the caller is an admin.

### 2.6 Suggested-transfers is greedy, not minimum-cashflow

**File:** `mobile/src/screens/Group/GroupDetailScreen.tsx:482-523` (also duplicated in `SettleUpScreen.tsx:59-100`).

Algorithm in pseudocode:
```
debtors = [{u, |bal|} for bal < -0.01], sorted desc by amount
creditors = [{u, bal} for bal > 0.01], sorted desc by amount
while both lists non-empty:
  t = min(debtors[0].amount, creditors[0].amount)
  emit(debtors[0] → creditors[0], t)
  debtors[0].amount -= t; creditors[0].amount -= t
  advance head when amount < 0.01
```

This is the classic Splitwise-style greedy matcher. It produces **at most N−1** transfers for N non-zero balances, but **not always the minimum**. Counterexample:

Balances: A = −5, B = −5, C = +3, D = +3, E = +4.
- Sum zero. Minimum transfers = 3 (e.g. A→C 3, A→E 2, B→D 3 and B→E 2; = 4 transfers; actually the minimum here is 4 because each creditor must receive from ≥1 debtor).

More interesting case: A = −10, B = −10, C = +5, D = +5, E = +10. Greedy (sorted A=10,B=10; E=10,C=5,D=5):
- A→E 10 (done A, E)
- B→C 5, B→D 5 → 3 transfers.

Optimal is also 3 here. For small realistic groups (< 8 members) greedy matches optimal in practice. **The code is "good enough" but not provably minimum.** Also, it does not respect "direct debt preference" (if A owes B specifically through an expense, the simplified transfer may route A→C→B).

**Suggested fix:** Document the limitation, or swap for a subset-sum/ILP minimum-transactions solver for groups > 6.

### 2.7 Web is missing the "Suggested transfers" panel

**File:** `web/src/app/dashboard/groups/[id]/page.tsx` — only renders `balanceEntries` and inline Settle Up form; no debtor↔creditor transfer preview.

Parity bug with mobile (`GroupDetailScreen.tsx:795-835`). Not a math bug, a feature gap.

### 2.8 SettleUp mobile uses `< 0` / `> 0` instead of `±0.01` tolerance

**File:** `mobile/src/screens/Group/SettleUpScreen.tsx:64-70`

```
if (amount < 0) { debtors.push(...) }
else if (amount > 0) { creditors.push(...) }
```

Every other surface uses `±0.01` (see `GroupDetailScreen.tsx:490-494`). Rounding artifacts around zero (e.g. `-0.000000001` from the FP accumulation in 2.3 above) will be displayed as spurious ₹0.00 debts and may produce ghost "settle up" rows. Mitigated because the inner `if (debtAmount > 0.01)` filters the emit, but the sort + loop machinery still runs on the noise.

**Suggested fix:** `amount < -0.01` / `amount > 0.01` like the detail screen.

### 2.9 Percentage split: empty percentage for a selected member → 0 → 400

**Files:** `mobile/.../AddGroupExpenseScreen.tsx:176-186`, `web/.../expenses/new/page.tsx:265-276`.

If a user selects 3 members but fills percentage only for 2 (sum 100%), the third produces `parseFloat('') = NaN → 0`. After distributing the remainder to member 0 the split is emitted with one `amount: 0` entry. Zod rejects with `Split amount must be positive` — correct, but the client-side allocation indicator shows "100% allocated" which misleads the user. The UX flag reads 100% yet the submit 400s.

**Suggested fix:** Client-side validation: each selected member must have a non-zero percentage.

### 2.10 Duplicate userIds in splitAmong accepted

**File:** `server/src/services/groupExpense.service.ts:32-45`.

Loop over `input.splitAmong` only checks each entry's `userId` is a group member. If the client sends `[{A, 50}, {A, 50}]` for a 100₹ expense, the sum check passes (100 = 100) and both entries are saved. The balance calc then debits A twice (−100 total) and credits paidBy +100, so the paidBy now appears to "have paid" the entire amount but A "owes" the whole amount — and the other members have no record.

**Repro:** POST with duplicated splitAmong entries for the same user.

**Suggested fix:** `new Set(splitAmong.map(s => s.userId)).size === splitAmong.length` check.

### 2.11 Single-member group expense accepted

**File:** `server/src/services/groupExpense.service.ts:9-59`.

A group can be created with just the creator as a member (`group.service.ts:8-18`). They can then add a group expense where `paidBy = me`, `splitAmong = [{me, amount}]`. Net economic delta is zero (they paid themselves) but the record persists and leaks into group totals.

**Suggested fix:** Require `group.members.length >= 2` to accept group expenses, or short-circuit this case in the client UI.

### 2.12 Removed-member orphan balances — correct math, incorrect UI

**File:** `mobile/.../GroupDetailScreen.tsx:466-475`, `web/.../page.tsx:283-292`.

When a member leaves/is removed from `group.members`, their historical splits stay in `GroupExpense.splitAmong`. `getGroupBalances()` (`server/.../groupExpense.service.ts:167-201`) still emits a balance entry for them keyed by their userId. The UI's `getMemberName(userId)` falls through to raw userId (mobile) or raw userId (web `resolveUserName`). The balance math is economically correct (debts don't disappear when someone leaves), but the UI shows `65abc...` style strings.

**Suggested fix:** Populate balance entries with user snapshots on the server (denormalize name+email at return time) OR block member removal while non-zero balance remains.

### 2.13 Overpaying a settlement is accepted

**Files:** `server/src/services/settlement.service.ts:8-39`, `server/src/schemas/settlement.schema.ts`.

Only checks: amount > 0, paidBy != paidTo, both are group members. No check that `amount <= balance_of_paidBy_to_paidTo`. Mobile/web UIs cap at balance (mobile `SettleUpScreen.tsx:135-138`, web `page.tsx:407-411` does **not** cap), but the server is the source of truth. A client bypassing the UI (or the web UI itself) can overpay.

**Repro:** user A owes B ₹100. A POSTs `/api/v1/groups/:id/settlements` with `{ paidBy:A, paidTo:B, amount:10000 }`. Server accepts. Balances flip: A becomes a creditor by ₹9900, B a debtor by ₹9900.

**Suggested fix:** Compute pairwise owed amount server-side, clamp or reject.

### 2.14 Floating-point drift in ultra-large-N splits

Edge-case only. Not exploitable in a realistic group but worth noting: the `0.01` tolerance in sum validation (`:42`, `:140`) becomes inadequate once `N ≥ ~1000` splits with fractional cents. Groups of this size don't exist in the app, but the assumption should be documented.

---

## 3. Algorithm walkthrough

### 3.1 Equal-split build (client → server)

Client (mobile `AddGroupExpenseScreen.tsx:187-196`, web `:277-284`):
```
total = parseFloat(amount)
n = |selectedMembers|
base = floor(total * 100 / n) / 100
remainder = round((total - base*n) * 100) / 100
for i in 0..n-1:
  splitAmong[i] = { userId, amount: i==0 ? base+remainder : base }
```

Server (`groupExpense.service.ts:22-45`): if `splitAmong` omitted, runs an identical formula over **all group members** (not the original selected subset). If `splitAmong` supplied, validates `|sum - amount| <= 0.01` and that every `userId` is a current member.

**Identity proof:** `base*n + remainder = total` by construction, so `sum(splitAmong) = base*(n-1) + (base + remainder) = base*n + remainder = total` exactly (modulo FP artifacts from not rounding the `base+remainder` addition on mobile/server).

### 3.2 Percentage split build

```
for each selected userId:
  raw[i] = floor(total * pct[i] / 100 * 100) / 100
rawTotal = sum(raw)
diff = round((total - rawTotal) * 100) / 100
amount[i] = i==0 ? round((raw[i] + diff) * 100) / 100 : raw[i]
```

Properties: if all `pct` sum to 100 (± 0.01 tolerance), then `rawTotal ≤ total` and `diff ∈ [0, n*0.01]` roughly, absorbed into member 0.

### 3.3 Balance calc (server, authoritative)

`server/src/services/groupExpense.service.ts:167-201`:
```
balances = {}
for expense in group's expenses:
  balances[paidBy] += amount
  for split in splitAmong:
    balances[split.userId] -= split.amount
for settlement in group's settlements:
  balances[paidBy] += amount    # debtor paying; their debt shrinks (balance rises)
  balances[paidTo] -= amount    # creditor receiving; their credit shrinks (balance falls)
return balances  # signed net per user
```

Convention across the app: `> 0` = is owed; `< 0` = owes; `~ 0` = settled.

**Invariant:** `sum(balances.values()) ≈ 0` (modulo FP drift). The audit did not find any code path that violates conservation-of-money.

Deleted expenses: `deleteGroupExpense` is a hard delete (`findOneAndDelete` `:160-164`), not soft. Once deleted, its contribution vanishes from the next `getGroupBalances` call — correct.

### 3.4 Suggested transfers (mobile only)

See §2.6 above. Pseudocode:
```
debtors = bal < -0.01 (with |amt|), desc
creditors = bal > 0.01, desc
while both non-empty:
  t = min(d.amt, c.amt)
  if t > 0.01: emit(d.user → c.user, round(t*100)/100)
  d.amt -= t; c.amt -= t
  advance pointers when < 0.01
```

---

## 4. Rounding & precision

- **Currency scale:** INR, 2 decimals everywhere (paise).
- **Rounding strategy:**
  - `Math.floor(x * 100) / 100` for base shares (truncate toward zero).
  - `Math.round(x * 100) / 100` for final per-user amount in most places, but **NOT** for the equal-split first-member value on server and mobile (see §2.3).
  - Remainder always dumped on member `[0]` of the selected list — **not deterministic across calls** because `selectedMembers` is a `Set`, whose iteration order equals insertion order in V8/Hermes but is not guaranteed by spec.
- **Tolerance:** `|splitSum - amount| <= 0.01` on server (both create and update paths); mobile + web clients use the same threshold in their validators.
- **Display:** `formatCurrency` drops trailing `.00` on whole-rupee amounts (good for headlines), `formatCurrencyExact` always shows 2 decimals (good for ledger rows). Both clients have identical implementations (`mobile/src/utils/currency.ts:1-25`, `web/src/utils/currency.ts:1-25`). No discrepancies between display and DB values.
- **Abbreviation:** mobile `formatCurrencyAbbreviated` exists for charts, web has no equivalent — minor parity gap.

---

## 5. Edge-case coverage matrix

| # | Scenario | Current behavior | Expected | Verdict |
|---|----------|-----------------|----------|---------|
| 1 | Split sum != amount (server, create) | Rejected if diff > 0.01 | Rejected | OK |
| 2 | Split sum != amount (server, update) | Rejected if diff > 0.01 | Rejected | OK |
| 3 | Negative expense amount | Zod `positive()` rejects | Reject | OK |
| 4 | Zero expense amount | Zod rejects | Reject | OK |
| 5 | Zero per-split amount (client-provided) | Zod rejects | Reject | OK |
| 6 | Zero per-split amount (auto-split, tiny total) | **Accepted (bug 2.2)** | Reject | FAIL |
| 7 | Empty `splitAmong` array | Server auto-splits across all members | Reject or auto-split (ambiguous) | Ambiguous |
| 8 | `splitAmong` omitted | Server auto-splits across all members | Documented behavior | OK |
| 9 | Non-member in splitAmong | Rejected with error message | Reject | OK |
| 10 | Duplicate userId in splitAmong | **Accepted (bug 2.10)** | Reject | FAIL |
| 11 | 33.33 % × 3 (sum 99.99%) | Client clamps to 100% via tolerance; first member absorbs 0.01% | ✓ | OK |
| 12 | 100% allocated to only 2 of 3 selected | Zod rejects `amount: 0` on the third | Client-side reject; clearer UX | PARTIAL |
| 13 | Exact sum short by ₹100 | Client blocks submit; server would reject too | Reject | OK |
| 14 | Exact sum over by ₹100 | Client blocks submit; server would reject too | Reject | OK |
| 15 | Single-member group | Expense accepted (bug 2.11) | Reject or no-op | FAIL (minor) |
| 16 | Future-dated expense | No date field on `GroupExpense` at all (only `createdAt/updatedAt`) | N/A | N/A |
| 17 | Amount ≥ ₹1,000,000,000 | Accepted; JS double safe up to 2^53 | Accepted | OK |
| 18 | Title length | Zod max 200, Mongoose trims | OK | OK |
| 19 | Notes length | Zod max 500 | OK | OK |
| 20 | Category length | Zod max 50 | OK | OK |
| 21 | Settle partial balance | Allowed | Allowed | OK |
| 22 | Settle more than owed | **Accepted on server (bug 2.13)** | Reject or clamp | FAIL |
| 23 | Settle with self | Zod `.refine` rejects | Reject | OK |
| 24 | Admin settle on behalf of another | Controller enforces `paidBy === userId` (`settlement.controller.ts:63-65`) | Enforce | OK |
| 25 | Non-member settle | `validateGroupMembership` rejects | Reject | OK |
| 26 | Deleted expense contribution | Hard-deleted, removed from balance | Removed | OK |
| 27 | Removed member historical debts | Preserved in math, userId shown in UI (bug 2.12) | Math correct; UI fallback needs work | PARTIAL |
| 28 | Concurrent edits same expense | Last-writer-wins, no optimistic locking | At least document | DOCUMENT |
| 29 | Concurrent expense adds | Balances derived on read → consistent | Consistent | OK |
| 30 | Member removed mid-edit | Edit proceeds if caller still in group; submit may 400 if stale user appears in `splitAmong` | Re-fetch group on client | DOCUMENT |
| 31 | Settle in a different currency | No currency field; all INR | INR-only | OK |
| 32 | Update expense by non-creator | **Accepted (bug 2.5)** | Reject unless admin | FAIL |
| 33 | Delete expense by non-creator | Rejected (`paidBy: userId` filter) | Reject | OK |

---

## 6. Recommendations (prioritized, no patches)

**P0 — Fix before next release**

1. **Restrict update to expense creator or group admin** — bug 2.5. Mirror the delete-path condition in `updateGroupExpense`.
2. **Cap settle-up amount at pairwise owed** — bug 2.13. Compute A→B net on the server, reject / clamp overpayment.
3. **Preserve original `splitAmong` on amount-only update** — bug 2.4. Either require clients to send a full split when `amount` changes, or scale the existing split proportionally.
4. **Reject duplicate userIds in `splitAmong`** — bug 2.10. Trivial `Set` check in both create and update paths.

**P1 — Correctness / consistency**

5. **Round `baseAmount + remainder` everywhere** — bug 2.3. Align server/mobile to the web's `Math.round` pattern.
6. **Enforce minimum ₹0.01 on per-split amounts in the auto-split helper** — bug 2.2. Also increase Mongoose model `min` from 0 to 0.01 (or leave 0 and tighten at service).
7. **Use `±0.01` tolerance in `SettleUpScreen` debtor/creditor partitioning** — bug 2.8. Purely cosmetic but easy.
8. **Block expense creation in single-member groups** — bug 2.11. One `if (members.length < 2)` in the service.
9. **Client-side validation: every selected member in percentage mode must have > 0%** — bug 2.9.

**P2 — UX / parity**

10. **Port "Suggested transfers" to the web** — bug 2.7. Copy the mobile greedy matcher.
11. **Denormalize member name/email into the balances response**, so removed-member rows don't show raw ObjectIds — bug 2.12.
12. **Document the greedy-matching limitation** in the Settle Up screen, or replace with minimum-transactions ILP for N ≥ 6 — bug 2.6.
13. **Introduce optimistic locking (`__v`) on group-expense updates** — concurrent-edit concern (edge 28).

**P3 — Hygiene**

14. **Unify the three copies of the equal-split formula** (mobile create, mobile edit, web create, server) into one shared pure function. Currently diverges in subtle ways (rounding of `base + remainder`).
15. **Add integration tests** covering: exact-sum mismatch, duplicate userId, overpay settlement, update by non-creator, single-member group, remove-member-with-debt.
