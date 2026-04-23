# Bakaya Group Expense — Competitive Research

> Research compiled 2026-04-23 to inform a redesign of Bakaya's group expense feature.
> Bakaya today supports: create group, invite by email (acceptance-based), add group expense (equal / exact / percentage split), per-user balances, suggested transfers, settle up, settlements history, delete/edit expense.

---

## TL;DR

Splitwise is the feature ceiling; Splid and Tricount are the "just the essentials" ceiling. Bakaya sits between Tricount and Splitwise on splits, behind on UX polish (notifications, receipts, invite friction, home-screen balance), and has a distinctive angle competitors lack: **the personal-profile system**. The recommended path is to:

1. Tighten the existing v1 flows (invite frictionless, add-expense field order, balance chip on home, empty states) before adding features.
2. Add receipts, notes/comments, and activity feed in v2 — these are the features Splitwise gets credit for and Tricount/Splid users miss.
3. Innovate in v3 by tagging group expenses into personal profiles so a single "Brother" transaction shows both "split with roommates" and "1/3 of my monthly outflow" — nobody else does this.

---

## 1. Feature Matrix

Legend: Y = yes (free or standard), P = partial / paywalled / awkward, N = no.
Rows marked with a * are confirmed from cited sources. Unmarked rows are general observations from blog/app-store descriptions.

| Feature | Bakaya (today) | Splitwise | Tricount | Settle Up | Splid | Venmo / CashApp / GPay | YNAB / PocketGuard |
|---|---|---|---|---|---|---|---|
| Create group | Y | Y | Y | Y | Y | P (ad hoc) | N |
| Leave group | N | Y | Y | Y | Y | N | N |
| Archive group* | N | Y | Y | Y | Y | N | N |
| Delete group | N | Y | Y | Y | Y | N | N |
| Invite by email | Y (accept flow) | Y | N (link only) | Y | N | P | N |
| Invite by phone | N | Y | N | N | N | Y | N |
| Invite by link | N | Y | Y | Y | Y | P | N |
| Invite by QR | N | P | P | Y | P | Y | N |
| No-signup guest invite* | N | N | Y | Y | Y (no account at all) | N | N |
| Split: equal | Y | Y | Y | Y | Y | Y (equal only) | N |
| Split: exact | Y | Y | Y | Y | Y | N | N |
| Split: percentage | Y | Y | Y | Y | Y | N | N |
| Split: shares / weights* | N | Y | P | Y (weights, e.g. couple=2) | Y | N | N |
| Split: by item / itemized* | N | Y (Pro OCR) | N | N | N | N | N |
| Split: adjusted ("plus") | N | Y | N | P | N | N | N |
| Per-expense currency | N | Y | Y (per expense) | Y | Y | N | N |
| Automatic currency conversion* | N | P (Pro) | N (keeps original) | Y | Y (150+ ccy) | N | N |
| Receipt / photo attachment* | N | Y (Pro OCR) | Y | Y | P | Y (payment memo img) | Y (receipts to tx) |
| Recurring expenses* | N | Y (weekly/monthly/yearly/fortnightly) | N | Y | N | N | Y |
| Comments on expenses | N | Y | P | Y | N | N | N |
| Notifications (push) | N | Y | Y | Y | P | Y | Y |
| Notifications (email) | P (invite only) | Y | Y | Y | N | Y | P |
| Reminders / nudge | N | Y | N | Y | N | Y (requests) | N |
| Exports (CSV / PDF)* | N | Y (Pro) | Y | Y (Excel) | Y (PDF/Excel) | N | Y |
| Balances: per-person | Y | Y | Y | Y | Y | N | N |
| Balances: per-category | N | Y (Pro charts) | P | Y (stats) | N | N | Y |
| Balances: over time | N | P | N | Y | N | N | Y |
| Settle up: cash / mark paid | Y | Y | Y | Y | Y | N/A | N |
| Settle up: PayPal deep link* | N | Y (US) | N | P | N | N/A | N |
| Settle up: Venmo deep link* | N | Y (US) | N | N | N | Native | N |
| Settle up: UPI deep link | N | N | N | N | N | Native (GPay/PhonePe) | N |
| Partial payment tracking | N | Y (any amount) | Y | Y | Y | N/A | N |
| Payment requests (push you→them) | N | P | N | P | N | Y | N |
| Group activity feed | N | Y | Y | Y | P | Y (social) | N |
| Search / filter expenses | P | Y | P | Y | N | P | Y |
| Edit history / audit trail | N | Y | P | P | N | N | Y |
| Web + mobile parity | Y | Y | Y | Y | P (mobile-first) | P | Y |
| Offline creation & sync* | N | Y | Y (basic) | P | Y (fully offline) | N | N |
| Smart split ("with group" / "with self") | N | Y | N | N | N | N | N |
| Home balance chip ("You are owed X net") | N | Y | Y | Y | P | N | N |
| Friends (outside groups) | N | Y | N | P | N | Y | N |
| Simplify debts (min-transfer) visible | P (suggested transfers) | Y (toggle) | Y | Y (core) | Y | N | N |
| Categories (custom) | Y | Y | P | Y | P | N | Y |

Sources: [Splitwise product page](https://www.splitwise.com/), [Splitwise Pro](https://www.splitwise.com/pro), [Splitwise vs Tricount — tricount.com](https://tricount.com/splitwise-vs-tricount), [Tricount vs Splitwise — getcino](https://www.getcino.com/post/tricount-vs-splitwise), [Settle Up on App Store](https://apps.apple.com/us/app/settle-up-group-expenses/id737534985), [Settle Up tips](https://settleup.io/tips), [Splid](https://splid.app/english), [Splitty comparison](https://splittyapp.com/learn/splitwise-vs-splid-vs-settleup/), [Splitterup comparison](https://www.splitterup.app/blog/best-expense-splitting-apps), [Squadtrip alternatives](https://www.squadtrip.com/guides/top-splitwise-alternatives-for-group-travel-expenses/), [WhistleOut on Splid](https://www.whistleout.com/CellPhones/Guides/splid-app-for-splitting-group-expenses), [Splitwise Venmo/PayPal](https://feedback.splitwise.com/knowledgebase/articles/475734-how-do-i-send-money-via-paypal-or-venmo), [Splitwise recurring](https://feedback.splitwise.com/forums/162446-general/suggestions/7802040-recurring-expense).

### Reading of the matrix

- **Bakaya already has the core split engine (equal / exact / percentage) and balances.** The biggest *user-visible* gaps are: link invites, receipts, recurring, notifications, activity feed, offline, and currency-per-expense.
- **Splitwise is not dominant on simplicity** — it is dominant because it ships every split type, recurring, OCR and payment deep links. For Bakaya to match feature-for-feature is a multi-quarter program.
- **Tricount/Splid prove that "good enough" wins many users** — both ship without: payment deep links, payment requests, recurring, or friends-outside-groups, and retain a loyal base.
- **Venmo/CashApp/GPay ship a minimum viable set**: split equally, send/request. They do not do: balances-over-time, non-equal splits, receipts, per-group summaries, simplify-debts. This is a useful floor — features in their set are table-stakes; features they *skipped* are optional.
- **YNAB / PocketGuard / Mint (defunct) do not do group expenses.** Honeydue is the only personal-finance app with group features ([NerdWallet](https://www.nerdwallet.com/finance/learn/best-budget-apps)). So there is no strong crossover pattern to copy — this territory is open for Bakaya's profile-first vision.

---

## 2. UX Pattern Analysis

### 2.1 Add Expense flow

**Splitwise's canonical order** ([Aubergine case study](https://www.aubergine.co/insights/the-art-of-spending-helping-splitwise-split-right), [UX Planet case study](https://uxplanet.org/splitwiser-the-all-new-splitwise-mobile-app-redesign-ui-ux-case-study-4d3c0313ae6f)):

1. Description (title)
2. Amount
3. Payer (defaults to current user)
4. Split type (defaults to "equal among all")
5. Optional: category, notes, photo, date, recurring

Notable Splitwise pitfalls the research surfaced:

- Users cannot exclude themselves from a split without manually setting their share to $0 in exact-amount mode ([Splitwise feedback](https://feedback.splitwise.com/forums/162446-general/suggestions/38140684-set-payer-s-in-default-split)).
- Default payer is always the current user — no group-level default despite it being the #1 feature request on the Pro feedback board.
- Creating an expense where "you" are not involved required workarounds until recently ([Splitwise feedback](https://feedback.splitwise.com/forums/162446-general/suggestions/18791395-allow-creation-of-expenses-where-you-are-not-inv)).

**Numeric input**: Splitwise, Tricount, and Settle Up all use a **numeric keypad with a visible decimal point** by default on mobile and accept both `.` and `,` as decimal separator (general observation). On web, all three accept free-form typing but silently normalize. Splid forces a keypad-only entry which users like for speed.

**Confirmation**: all four apps save on "Save" with no confirmation dialog. Destructive confirmations are reserved for delete.

**Pitfall (common)**: too many visible fields at once. Splitwise progressively discloses split type — the default row just says *"Paid by you and split equally"* which is tappable and expands to the full splitter UI. Tricount does the same with a simpler UI.

### 2.2 Split Config UI

- **Splitwise**: segmented control across the top (Equal / Unequal / %). Inside Unequal and %, one row per person with input. "Adjusted" and "Shares" are behind a "More" tap.
- **Tricount**: one screen, toggle by person. Progressive disclosure of exact/% only if user opts in. Defaults-equal is the path of least resistance.
- **Settle Up**: shares-based by default, weights shown as integers next to the person. Very powerful, small learning cliff.
- **Splid**: two options only — equal or custom amounts. No percentage. Intentionally cut.

**Common pitfall**: showing "percentages" and "exact amounts" simultaneously. Users mentally convert and get the wrong value. The winning pattern is **mode-exclusive** (segmented) with a live **"remaining: ₹X"** running total.

### 2.3 Balances view

- **Splitwise** shows a home-screen banner "Overall, you are owed $X" and per-group rows showing "you owe $X" / "you are owed $X". Early versions double-counted (group-level and friend-level), which confused users and was removed [Splitwise UX case study](https://uxdesign.cc/splitwise-a-ux-case-study-dc2581971226).
- **Tricount** shows a single "balances" tab per tricount with a list of simplified transfers.
- **Settle Up** shows a per-person row with the exact debt and an inline "Settle" CTA.

The **list is the winning representation**. Graphs and matrices (who-owes-whom-grid) have been tried and abandoned by Splitwise — users reported they took longer to parse ([IXD@Pratt critique](https://ixd.prattsi.org/2017/09/design-critique-splitwise-iphone-app/)).

### 2.4 Settle Up flow

- **Splitwise**: Tap "Settle up" → choose recipient (pre-filled if obvious) → choose method (cash / PayPal / Venmo, US only) → confirm amount (defaults to full balance) → logs a settlement. Allows partial. Allows back-dating ([Splitwise Venmo integration](https://blog.splitwise.com/2013/09/11/introducing-settle-up-with-splitwise-and-venmo/)).
- **Tricount / Splid**: mark-as-paid only. No deep link to payment providers.
- **Settle Up**: similar to Splitwise but also prompts you when the algorithm suggests an off-cycle transfer.

Bakaya already has the "suggested transfers" + "create settlement" pattern. Gap vs. competitors: **no deep link to GPay/UPI** — a big miss for an India-first product. UPI intent URLs (`upi://pay?...`) are a small code change and a huge UX uplift.

### 2.5 Empty states

- **Splitwise**: illustrated empty state with a friendly copy ("No expenses yet — tap + to add one") and a CTA. When *all settled*, a celebratory state ("All settled up!") with a confetti-like illustration.
- **Tricount**: copy + illustration, plus a 3-step getting-started card that auto-hides.
- **Splid**: ultra-minimal — just "Add your first expense" with a single button.

**Pattern to steal**: the "All settled up" celebration — it rewards the user for reaching zero balance and reinforces the product's purpose.

### 2.6 Error states

- **Splitwise** persists offline entries locally and shows a subtle "Not yet synced" chip. On re-connect the sync is invisible unless there's a conflict (then a banner).
- **Tricount** queues writes; if currency conversion is needed it warns "rate unavailable — will recompute online".
- **Splid** is the gold standard — fully offline-first, no network at all.

**Pattern to steal**: optimistic UI + "sync pending" chip, not blocking modals.

### 2.7 Receipt / notes capture

- **Splitwise**: tiny camera icon on add-expense; Pro does OCR itemization ([SaaSWorthy](https://www.saasworthy.com/product/splitwise)).
- **Tricount / Settle Up**: explicit attachment button; files stored against the expense.
- **Splid**: no receipts. (A deliberate cut.)

Deep-flow (hidden under "More") is the norm. Surface it only when the user explicitly tags a category that benefits (e.g. "Food" or "Travel").

---

## 3. What Resonates for Bakaya's Profile-First Vision

Bakaya's killer differentiator is **profiles** — labels like *Self*, *Brother*, *Girlfriend* that annotate every personal expense. No competitor has this. The group feature currently lives in a silo, which is a missed opportunity.

### 3.1 Ideas where personal-profile ↔ group can cross-pollinate

1. **Tag group expenses with a personal profile**. When you pay ₹1,500 for roommates' dinner, you split it in the group (₹500 yours) *and* select profile = "Self". Result: your personal analytics at last shows the **true outflow** — the ₹1,500 — with a note that ₹1,000 was reimbursed. This closes the loop between "group money" and "real money", which Splitwise fundamentally can't do.
2. **"Paid for Brother" on a group expense**. If you paid in the group on behalf of your brother (who is a *profile*, not a user), the personal view can mark this as an expense against the Brother profile. Merges the roommate-tracker and the family-lending-tracker in one app.
3. **Balances by profile, not just by person**. "You have lent ₹12k via Brother profile this month" answers a question the user actually asks: *how much am I actually financing my brother?* — which spans both personal and group expenses.
4. **Default profile per group**. A "Flatmates" group can default-tag all your splits as "Self"; a "Family Trip" group can default-tag them as "Family". Removes a field at add-expense time.

### 3.2 Skip (bloat)

| Feature | Why skip |
|---|---|
| OCR receipt itemization | Huge build for low use rate. Photo attach is enough. |
| Friends list outside groups | Complex permissions, low payoff; groups of two work the same. |
| Adjusted ("plus") split | Rarely used; power users tolerate exact instead. |
| Payment requests (push "pay me now") | India UPI replaces this — users just send a UPI link. |
| Subscription / Pro tier (for now) | Muddles the value prop before PMF. |

### 3.3 Copy (proven winners)

| Feature | Why |
|---|---|
| Home balance chip ("Overall you're owed ₹X net") | Answers the first question the user asks when opening the app. |
| Link + QR invite | Removes the accept-by-email friction that stalls new groups today. |
| Mark-as-paid + payment deep link (UPI intent) | Zero-friction settlement, India-native. |
| Recurring expenses (monthly rent) | One of Splitwise Pro's most-loved features. |
| Comments on an expense | Resolves "why so high?" arguments without leaving the app. |
| "All settled up" celebratory empty state | Delight moment; cheap to build. |
| Per-expense currency | Needed the moment a user goes on one international trip. |

### 3.4 Innovate (distinctive)

| Idea | Why it's a moat |
|---|---|
| Profile-tagged group expenses | Nobody else does the personal-tracker ↔ group-tracker bridge. |
| "Shadow participant" via profile | Add a profile (not a real user account) as a group participant for lending scenarios. Tricount kind of allows this (no account needed), but doesn't carry it into a personal tracker. |
| UPI intent deep link in settle-up | Splitwise doesn't ship this in India; Tricount doesn't either. |
| Budget bleed warning | "This month your Flatmates group has pulled your food budget 18% over" — requires profile tagging + personal budgets, both of which Bakaya already has. |

---

## 4. Recommended v1 / v2 / v3 Feature Cut

### v1 — Next ship (focus: fix what's there, close invite / settlement friction)

| # | Feature | Why | Effort | Risk |
|---|---|---|---|---|
| 1 | **Link invite + optional email** (keep current email accept flow, add `invite?t=<token>` URL) | The #1 complaint about acceptance-email flows is deliverability + latency. A link removes the blocker. | S | Low |
| 2 | **Add-expense flow redesign**: title → amount → payer → "paid for N people equally" tappable row → save. Progressive disclosure for exact/%. | Current form is flat. The Splitwise pattern is well-validated. | M | Low |
| 3 | **Home balance chip** ("You are owed ₹X net" across all groups) + per-group net on card | Lack of this is why users open a group to check status. | S | Low |
| 4 | **UPI intent deep link on Settle Up** (`upi://pay?pa=...&am=...&tn=Bakaya%20settle`) | India-first, 2 days of work, delights users. | S | Low |
| 5 | **Empty states** (no expenses / all settled / no groups) with copy + illustration | Current screens look broken before data arrives. | S | Low |
| 6 | **Profile tag on group expense** (default = Self; dropdown) | The *differentiator* — ship it in v1 so analytics benefits immediately. | M | Medium (UX can confuse if unclear copy) |
| 7 | **Activity feed per group** (who added, who edited, who settled — chronological) | Low build, very high trust signal. | S | Low |
| 8 | **Archive group** + hide archived from main list | Current groups don't have an end-of-life. Trips pile up. | S | Low |
| 9 | **Leave group** | Critical safety feature; members feel stuck without it. | S | Low (re-balancing is the gotcha) |
| 10 | **Push notifications** for: added to group, new expense, settlement received | Expected baseline. | M | Medium (infra) |

**v1 goal**: Bakaya becomes *usable as a daily driver* for a 3–5 person flatmate or trip scenario, and the profile tag proves the differentiator.

### v2 — After v1 lands (focus: depth and polish)

| # | Feature | Why | Effort | Risk |
|---|---|---|---|---|
| 1 | **Recurring expenses** (monthly/weekly/yearly) | Rent & utilities — the most-requested Splitwise feature. | M | Medium (edge cases on edit/delete) |
| 2 | **Per-expense currency** + static FX snapshot at the time of the expense | Needed for one-off trip groups. Use a free FX API daily. | M | Medium (stale rates) |
| 3 | **Receipt attachment** (photo only, no OCR) | Low-ambition version of Splitwise's receipts. | S | Low |
| 4 | **Comments on expense** (per expense thread) | Defuses "why so much" fights. | M | Low |
| 5 | **Edit history / audit trail** (who changed what, when) | Trust feature, especially once money starts moving. | M | Low |
| 6 | **Search & filter** expenses in a group | Linear lists get unusable past ~50 expenses. | S | Low |
| 7 | **Share-based split** (integer weights) | Couples = 2, singles = 1 — the Settle Up pattern. | S | Low |
| 8 | **Export to CSV / PDF** | Tax / bookkeeping use case. | S | Low |
| 9 | **Email reminders** (weekly digest, pending settlements) | Retention; cheap; can be unsub'd. | S | Low |
| 10 | **QR invite** | Frictionless in-person onboarding. | S | Low |

### v3 — Aspirational (focus: moat + delight)

| # | Feature | Why | Effort | Risk |
|---|---|---|---|---|
| 1 | **Balances-by-profile analytics** ("Lent via Brother: ₹12k this quarter") | Spans personal + group; nobody else can do this. | M | Low |
| 2 | **Offline-first mobile** (local SQLite + sync) | Matches Splid/Tricount; the right architecture for travel. | L | High (conflict resolution) |
| 3 | **Budget-bleed warning** tied to groups | Unique to Bakaya's ecosystem. | M | Medium |
| 4 | **By-item split** for restaurant bills (scan items, assign per person) | Splitwise Pro does this; it's a wow moment. | L | High (OCR tuning) |
| 5 | **Payment deep-link for more providers** (PayPal, Paytm, PhonePe) | Expand on v1's UPI. | M | Low |
| 6 | **Shadow participants (profile-as-member)** | Lend to someone not on the app without waiting. | M | Medium |
| 7 | **Recurring reminders / nudge** ("Rohit owes you ₹2,300 for 14 days — nudge?") | Retention flywheel. | S | Low (tone risk) |
| 8 | **Group categories + per-category balance** | Power users want it; casuals ignore it. | M | Low |
| 9 | **Multi-device real-time sync indicator** | Small but signals professionalism. | M | Low |
| 10 | **Trip metaphor / templates** | Tricount's primary metaphor — template a "Trip" group with preset categories (Food / Stay / Transport) and auto-archive on end-date. | S | Low |

---

## 5. Specific UX Patterns to Adopt — Concrete

### 5.1 Splitwise's "who paid / your share" expense row

**Description**: each expense in the list shows, in one row:

- Left: title + category icon
- Middle: "Raj paid ₹1,500"
- Right: "you lent ₹500" (in green) or "you owe ₹500" (in orange), colored by who benefits

**Why it works**: the user reads the screen without arithmetic. The row answers the only question that matters ("am I up or down on this?").

**Validate Bakaya's version**: confirm that the expense row shows both (a) who paid and (b) your specific share delta — not just the total amount. If today's row only shows "₹1,500 — Dinner", it's incomplete.

Ref: [Aubergine case study on the Splitwise add-expense flow](https://www.aubergine.co/insights/the-art-of-spending-helping-splitwise-split-right), [UX Planet Splitwise redesign](https://uxplanet.org/splitwiser-the-all-new-splitwise-mobile-app-redesign-ui-ux-case-study-4d3c0313ae6f).

### 5.2 Splitwise's "simplify debts" suggestion card

**Description**: group screen shows a card above the expense list: *"Simplify debts: 4 payments → 2 payments. Apply?"* ([Splitwise help — simplify debts](https://feedback.splitwise.com/knowledgebase/articles/107220-what-does-the-simplify-debts-setting-do), [blog post](https://blog.splitwise.com/2012/09/14/debts-made-simple/)).

**Why it works**: the user sees the *benefit* (fewer payments) before turning it on. Bakaya already computes "suggested transfers" — surface *the savings number* explicitly.

**Recommendation**: show "Pay 2 people instead of 4" prominently; let the user toggle on/off, not just auto-apply.

### 5.3 Tricount's "trip" metaphor

**Description**: Tricount calls each group a *"tricount"*, framed around a trip, a night out, or a month of roommate bills ([Tricount homepage](https://tricount.com/), [Pilot Plans review](https://www.pilotplans.com/blog/tricount-review)).

**Why it works**: a "trip" has a **start**, **end**, and **archive**. Users don't feel guilty closing it. Splitwise groups feel perpetual; Tricount's feel finite and satisfying.

**Recommendation**: give Bakaya groups an optional `endDate` and auto-suggest archive when reached. Offer "Trip", "Flat", "Couple", "Event" templates on create.

### 5.4 Settle Up's "who paid for whom" filter

**Description**: filter the expense list by payer ("show only what Ankit paid") and by beneficiary ("show only what I was part of") ([Settle Up tips](https://settleup.io/tips)).

**Why it works**: answers the most common specific question ("what have I actually contributed to?").

**Recommendation**: add these two filters to the group expense list in v2.

### 5.5 The "balance chip" at home

**Description**: top of the Splitwise home screen shows: "Overall, you are owed ₹X" in a prominent green banner, or "you owe ₹X" in orange. Per-group rows show the same, scoped. Splitwise iterated away from double-counting group+friend balances after user confusion ([Splitwise feedback thread on widget/home](https://feedback.splitwise.com/forums/162446-general/suggestions/3913957-to-add-a-widget-for-the-homescreen)).

**Why it works**: answers "should I chase someone, or pay someone?" in under a second.

**Recommendation**: Bakaya's dashboard should add this chip next to the personal-expense summary. Clicking it drills to a "Who owes whom across all groups" view.

---

## 6. Non-Goals for Bakaya's Group Feature

Explicit list of things competitors ship that Bakaya should **not** build. All decisions reversible.

| Non-goal | Why skip |
|---|---|
| **OCR receipt itemization** | Splitwise Pro-only; ML cost high; accuracy low on Indian receipts. Photo attachment is 10% of the work for 80% of the value. |
| **Dedicated "friends" list outside groups** | Splitwise has it; Tricount/Splid don't. Adds model complexity (permissions, DMs) for a one-off "group of 2" use case that is already solvable by making a 2-person group. |
| **In-app DMs / chat per group** | Comments on expenses are enough. Full chat is scope creep that leads into moderation territory. |
| **Debt collection / reminders via SMS** | Tonal minefield; users resent nag apps. Keep nudges opt-in + polite. |
| **Third-party bank connection** (Plaid / Yodlee) | Scope creep from personal tracking. Bakaya's personal side is label-driven by design — connecting banks violates the core philosophy. |
| **Adjusted ("plus"/+tip/+tax) split** | Splitwise has it; almost nobody uses it. Exact amount is sufficient. |
| **Subscription Pro tier** | Premature monetization will hurt retention before PMF. Revisit after v2. |
| **Payment requests with provider push** | India UPI replaces this; users just share a UPI link. Building a payment-request system is regulated in most markets. |
| **Group "investments" / shared wallets** | Category expansion into fintech proper; out of scope. |
| **Social feed across all users** | Venmo's social feed is a novelty; regulators dislike it; Bakaya's audience doesn't want it. |
| **SMS login / invite** | Email + link is enough. SMS adds telecom cost and carrier friction in India. |
| **Full offline on web** (v1/v2) | Service-worker queueing is high effort, low payoff on web. Mobile offline is valuable; web offline is a niche. |

---

## 7. Open Research Questions

Things this doc couldn't fully resolve — suggest picking up in design review:

1. **How does Splitwise handle the "user edits a past expense that changed a settlement"?** General observation is that edits re-flow balances retroactively but preserve settlement records. Needs a behavioral spec before v2.
2. **Default currency policy**: per-group default (Splitwise) or per-expense (Tricount)? Recommend **per-group default with per-expense override** — matches how Indians actually travel.
3. **Profile-tag defaults per group**: should the default be the group creator's most-used profile, or always "Self"? Needs user testing.
4. **Simplify-debts opt-in vs. default-on**: Splitwise defaults it on; some users find retroactive reshuffling confusing. Recommend **default-on with a one-time explainer card**.

---

## Appendix A — Sources

- [Splitwise product](https://www.splitwise.com/)
- [Splitwise Pro](https://www.splitwise.com/pro)
- [Splitwise — SaaSWorthy features list](https://www.saasworthy.com/product/splitwise)
- [Splitwise — recurring expense feedback thread](https://feedback.splitwise.com/forums/162446-general/suggestions/7802040-recurring-expense)
- [Splitwise — set default payer request](https://feedback.splitwise.com/forums/162446-general/suggestions/38140684-set-payer-s-in-default-split)
- [Splitwise — expenses without "you"](https://feedback.splitwise.com/forums/162446-general/suggestions/18791395-allow-creation-of-expenses-where-you-are-not-inv)
- [Splitwise — simplify debts helpdesk article](https://feedback.splitwise.com/knowledgebase/articles/107220-what-does-the-simplify-debts-setting-do)
- [Splitwise — debts made simple blog](https://blog.splitwise.com/2012/09/14/debts-made-simple/)
- [Splitwise — UX case study (UX Collective)](https://uxdesign.cc/splitwise-a-ux-case-study-dc2581971226)
- [Splitwise — Aubergine redesign case study](https://www.aubergine.co/insights/the-art-of-spending-helping-splitwise-split-right)
- [Splitwise — UX Planet redesign](https://uxplanet.org/splitwiser-the-all-new-splitwise-mobile-app-redesign-ui-ux-case-study-4d3c0313ae6f)
- [Splitwise — IXD@Pratt critique](https://ixd.prattsi.org/2017/09/design-critique-splitwise-iphone-app/)
- [Splitwise — Settle Up with Venmo blog](https://blog.splitwise.com/2013/09/11/introducing-settle-up-with-splitwise-and-venmo/)
- [Splitwise — Venmo integration helpdesk](https://feedback.splitwise.com/knowledgebase/articles/475734-how-do-i-send-money-via-paypal-or-venmo)
- [Tricount — homepage](https://tricount.com/)
- [Tricount vs Splitwise — tricount.com](https://tricount.com/splitwise-vs-tricount)
- [Tricount vs Splitwise — getcino](https://www.getcino.com/post/tricount-vs-splitwise)
- [Tricount — Pilot Plans review](https://www.pilotplans.com/blog/tricount-review)
- [Tricount — UXArchive flows](https://uxarchive.com/app/tricount/app-f080c472cb4f960a/latest/latest/1)
- [Settle Up — App Store](https://apps.apple.com/us/app/settle-up-group-expenses/id737534985)
- [Settle Up — tips page](https://settleup.io/tips)
- [Settle Up — main site](https://settleup.app/)
- [Splid — homepage](https://splid.app/english)
- [Splid — WhistleOut review](https://www.whistleout.com/CellPhones/Guides/splid-app-for-splitting-group-expenses)
- [Splitty — Splitwise vs Splid vs SettleUp](https://splittyapp.com/learn/splitwise-vs-splid-vs-settleup/)
- [Splitty — best bill splitting apps 2026](https://splittyapp.com/learn/best-bill-splitting-apps/)
- [Splitterup — 7 best expense splitting apps 2026](https://www.splitterup.app/blog/best-expense-splitting-apps)
- [Squadtrip — top Splitwise alternatives for group travel](https://www.squadtrip.com/guides/top-splitwise-alternatives-for-group-travel-expenses/)
- [Blukyte — Splitwise vs Tricount](https://www.blukyte.co/post/splitwise-vs-tricount-expense-tracking-comparison)
- [Tricount blog — top Splitwise alternatives India 2025](https://tricount.com/blog/top-splitwise-alternatives-in-india-2025-which-app-should-you-switch-to)
- [Venmo — homepage](https://venmo.com)
- [Google Pay India — UPI Lite](https://support.google.com/pay/india/answer/13327133)
- [NerdWallet — best budget apps 2026](https://www.nerdwallet.com/finance/learn/best-budget-apps)
- [PocketGuard](https://pocketguard.com/)

---

*Doc owner: redesign track. Last updated 2026-04-23.*
