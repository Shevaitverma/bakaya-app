# Group Expense — UX & Bug Audit

Scope: every screen in the group-expense flow on mobile (`mobile/src/screens/Group/*`, `mobile/src/screens/Invitations/InvitationsScreen.tsx`) and web (`web/src/app/dashboard/groups/**`, `web/src/app/dashboard/invitations/page.tsx`). No code is changed by this document — it exists only to drive the next iteration.

Cross-references:
- `E:\shevait-projects\bakaya-app\DESIGN_CONSISTENCY.md` — design-token parity. Referenced where tokens matter.
- `COMPETITIVE_RESEARCH.md` / `GROUP_EXPENSE_MATH_AUDIT.md` — not present in this repo at time of writing. Competitive comparisons below draw on general knowledge of Splitwise, Settle Up, Tricount.

---

## 1. User journey walkthrough

### 1a. Creator journey (brand-new user, creates a group, adds 3 expenses, settles)

**Step 1 — Signs up → lands on Home tab.**
- What they see: dashboard Home. No indication of the Groups tab as the place to "start a shared trip". The user must discover the Groups tab from the bottom nav.
- Missing: no onboarding nudge like "Create a group to split with friends" on an empty Home. (Splitwise opens straight into a Groups list.)
- Cognitive load: low, but direction is unclear.

**Step 2 — Taps Groups tab → `GroupsListScreen.tsx`.**
- What they see: empty state with a `Create your first group` CTA (`GroupsListScreen.tsx:210-238`). This is good — the empty state has copy, icon, and CTA.
- Web parity: `web/src/app/dashboard/groups/page.tsx:69-80` shows the same empty state. Good.
- Unexpected: on mobile, there's also a `New` button in the header (`:296-309`) that duplicates the empty-state CTA. Not wrong, but the user has two entry points at the same visual elevation.

**Step 3 — Taps `Create your first group` → `CreateGroupScreen.tsx`.**
- What they see: avatar preview, Name, Description, Create Group button.
- Clarity: very clean. The live-updating "New Group" preview is a nice touch (`CreateGroupScreen.tsx:115-128`).
- Missing vs competitors: no group-type selector (Trip / Home / Couple / Other) — Splitwise uses this for default currency and categorization. No group photo / emoji. No currency selector (the whole app assumes INR — see `formatCurrency` use throughout).
- Cognitive load: very low. Good.

**Step 4 — Submits → returns to groups list via `navigation.goBack()` (`CreateGroupScreen.tsx:68`).**
- Expected: land inside the newly-created group so they can immediately invite and add expenses.
- Actual mobile: bounces back to the list. User must tap the new row to get into the group. **Two extra taps.**
- Actual web: **worse** — `new/page.tsx:46` calls `routerRef.current.push("/dashboard")`, sending the user to the main Dashboard, not even the Groups page and certainly not the detail page. This is a navigation bug (see §4 BUG-W1).
- Competitor ref: Splitwise / Settle Up drop you straight into the empty group detail with "Add an expense" primary.

**Step 5 — Taps group row → `GroupDetailScreen.tsx`.**
- What they see (in order, top to bottom): pink header with group name + edit/delete icons (admin only), Total Expense (hidden when zero, `:1171-1176`), then *inside the content sheet*: Balances section (empty state), Settlements section (empty state), Members section (just "you"), Expenses section (empty).
- **Problem:** the primary action for a new group is *Invite members*. It's buried: Balances → Settlements → Members → Expenses. The user scrolls past two empty states before finding the Invite button.
- Reordering in §5.
- FAB "Add Expense" is always visible (`:1201-1213`). Good.

**Step 6 — Invites a friend by email (`GroupDetailScreen.tsx:923-959`).**
- Inline form with email input + Invite button. Clean.
- Success path: Alert dialog ("Invitation sent"). Non-blocking would be nicer — a toast/snackbar. But Alert works.
- **Missing copy message field on mobile.** Web has one (`[id]/page.tsx:837-846`). Platform gap (see §3).
- No validation that the email is well-formed client-side (regex). If the server returns 400 "invalid email", the user sees a raw server message. Medium severity — the server must be handling this but the UX echo is not friendly.

**Step 7 — Second user accepts the invite (see §1b). Back to creator.**
- Creator must pull-to-refresh or leave/reopen to see the new member (`GroupDetailScreen.tsx:104-108`, `useFocusEffect`). No realtime. OK for v1.

**Step 8 — Creator taps FAB "Add Expense" → `AddGroupExpenseScreen.tsx`.**
- Fields presented:
  - Title (auto-capitalize words)
  - Amount (`decimal-pad` keyboard, good)
  - Category picker (modal with emoji)
  - Paid by picker (modal; defaults to self)
  - Split between: Select All / Deselect All pills, Equal / Exact / Percentage tabs, per-member checkbox list
  - Notes (optional)
- Cognitive load on FIRST use: high. There's a lot on one screen. But because defaults are sane (all members selected, equal split, current user pays), the happy path is fast: **Title + Amount + Category → Add**. That's three taps + typing.
- Allocation indicator (`:530-651`) is actually one of the strongest features: a real-time pass/fail bar showing "Remaining: X" / "Over by: Y" when in Exact or Percentage mode. This is better than Splitwise's experience.
- Web parity: `new/page.tsx` has equivalent Equal/Exact/Percentage tabs and allocation indicators (`:668-729`). Good parity.

**Step 9 — Creator adds expense #2 with exact split, #3 with percentage split.**
- #2 — Exact: selects 2 of 3 members, types amounts. The indicator updates live. Good.
- #3 — Percentage: types 40 / 30 / 30. See the calculated `(₹X.XX)` next to each percent. Good.
- **Bug observable:** On mobile, switching from `equal` → `exact` → `percentage` retains prior state in `exactAmounts` and `percentages`. If the user set exact amounts, flipped to percentage, then flipped back, the exact amounts are still there (by intent), but validation could fire against values they no longer see. Low severity because the indicators surface the mismatch.
- **Bug observable (web only):** `new/page.tsx:617, 637` have `onClick={(e) => e.preventDefault()}` on the split inputs. The *click* is prevented but the event is on the `<input>` *inside* a `<label>` with a checkbox — the preventDefault stops the label from toggling the checkbox only when clicking directly on the number input, not when clicking elsewhere on the row. This partially works but is fragile. See BUG-W3.

**Step 10 — Submit → Alert "Success" → goBack to Group Detail.**
- Why an Alert? Interrupts the user. On web, `createExpenseMutation` completes and `router.push(groupDetail)` happens silently (`new/page.tsx:296`). Web is better here. Mobile should use a toast, not a blocking Alert.
- Expense appears in the Expenses list with net label ("you lent ₹X", "you owe ₹Y", "settled", "not involved") — excellent signal.

**Step 11 — Views balances. Taps `Settle Up`.**
- Mobile: navigates to `SettleUpScreen.tsx`. Shows only debts where current user is the debtor (`SettleUpScreen.tsx:103-107`). Good — avoids the "I'll record that John paid me" anti-pattern. If the current user is owed money but owes nothing, the screen shows "All settled up!" — which is WRONG for them. See BUG-M3.
- Web: **no separate settle-up screen.** Uses the inline settle form on the group detail page (`[id]/page.tsx:628-703`). Triggered by per-balance-row `Settle Up` pill. This is actually a nicer flow than mobile's full navigation.
- Inconsistency noted in §3.

**Step 12 — Settlement recorded → success alert → back to group detail.** Balance and Settlements sections update.

**Step 13 — Creator removes a member.** On mobile, tap the X next to member name (admin only, `GroupDetailScreen.tsx:989-1002`). Confirmation dialog via `ConfirmationDialog` component. **Missing warning:** "If this member owes money or is owed money, those balances will need to be resolved first/will be orphaned". No data shown about member's outstanding balance at removal time. Medium severity UX.
- **Web:** `[id]/page.tsx:881-893` — the trash button is rendered but `// Preserve existing behavior: no remove handler was wired up in the original file`. **It does nothing when clicked.** Critical regression on web — see BUG-W2.

### 1b. Invited-user journey

**Step 1 — User A sends invite by email to user B.** User B is notified... how? Currently: they aren't, unless they open the app and navigate to Invitations.

**Step 2 — User B opens the app, navigates to Me tab → Invitations (mobile) or `/dashboard/invitations` (web).**
- Mobile: `MeStackParamList.Invitations` (`navigation/types.ts:47`). The user must go Me → Invitations. There's no badge on the Me tab showing pending invitation count. Medium severity IA issue (§6).
- Web: invitations live at `/dashboard/invitations`. Presumably linked from a sidebar — no badge either.

**Step 3 — Sees list of `InvitationsScreen.tsx`. Taps Accept.**
- Mobile: Alert "Joined X" (`InvitationsScreen.tsx:90`). User is still on the Invitations screen — they must back out and navigate to the group manually. **Friction.**
- Web: after accept, `setTimeout(..., 900)` then `router.push(/dashboard/groups/:id)` (`invitations/page.tsx:41-46`). Better — the web auto-redirects to the new group.
- Cross-platform gap — mobile should `navigation.navigate('GroupsTab', { screen: 'GroupDetail', params: { groupId, groupName } })` after accept instead of leaving them in limbo.

**Step 4 — Declines.**
- Mobile: silently disappears from list. No confirmation dialog — a decline is destructive-ish (you can't undo; the sender sees nothing). Low-severity UX: usually declines are one-tap in competitor apps too.

---

## 2. Per-screen critique

### 2.1 `mobile/src/screens/Group/GroupsListScreen.tsx`

Mental model: pink gradient header with "My Groups" + `New` pill on right. Below, a white sheet with rounded top corners and stacked group cards (icon, name, description, avatar stack, chevron).

- Information hierarchy: fine. Name is largest, description is secondary, members row is tertiary. Clean.
- Primary action: `New` in header + FAB-equivalent empty-state CTA. Clear.
- Empty state (`:210-238`): icon + title + subtext + CTA — good.
- Loading state: full-screen `ActivityIndicator` with "Loading groups..." (`:241-258`). No skeleton. Inconsistent with Invitations which uses skeletons.
- Error state (`:261-286`): full-screen with retry button. Good. Copy is the server error message verbatim, which can be ugly ("Request failed with status code 500"). Low severity.
- Text: fine.
- Visual weight: OK — cards are 56pt icon + 2-line name/desc + 24pt avatars (`:411-417` etc.). No overflow issues.
- Accessibility: TouchableOpacity card has no accessibility role/label announcing "Group: X, 3 members". Low severity.
- Back-button behavior: this is the tab root, no back button. Correct.
- **Bug:** `fetchGroups` has `if (Date.now() - lastFetchTime.current < 30000) return;` (`:73`) but then immediately calls `setLoading(true); setLoading(false)` in the `finally`. If the rate-limit check returns early, `loading` still reflects whatever previous state. Low severity but confusing — see BUG-M1.
- **Bug (minor):** avatar initials are derived from `email.split('@')[0]` (`:129`), not the user's actual name. If the user has `firstName` / `lastName` populated, they're ignored. Users show as initial of email local-part, not first name. Low severity.

### 2.2 `mobile/src/screens/Group/GroupDetailScreen.tsx`

Mental model: pink header with back + title + (edit/delete for admins). Optional "Total Expense ₹X" in header area. White content sheet with four sections stacked: Balances → Settlements → Members → (conditional) Pending Invitations → Expenses. FAB "+ Add Expense" at bottom-right.

Observations:

- **Section order is wrong for the product's core value.** The app is about tracking expenses. A user who opens a group usually wants to: (a) see what's new, (b) add a new expense, or (c) settle up. The current order buries Expenses at the bottom; Members and Settlements take up 40-60% of the scroll on a group with any activity. See §5 and §7.
- Net summary card (`:720-776`) — this is the BEST part of the screen. "You are owed ₹X" / "You owe ₹X" / "All settled up" with semantic color. Should be more prominent.
- Suggested Transfers (`:794-834`) — very useful but sits below balances; many users won't scroll past balances to see it.
- Balances section uses mini progress bars (`:570-582`). Good visual signal, matches the web implementation.
- Expenses section shows net per row (`:588-624`) — "you lent / you owe / settled / not involved" — this is excellent.
- Empty expenses card (`:1078-1091`) is small and easy to miss given the amount of scrolling users do before reaching it.
- Settlements section with per-row delete (`:878-890`) — delete is unrestricted at the UI layer; the server enforces whether the user can actually delete (and returns an error). The trash icon on web and mobile shows for *all* settlements regardless of whether you can delete them. Medium severity — either gate on role, or handle the 403 gracefully.
- Accessibility: role badge "admin" / "member" lower-cased via CSS is fine; icon-only delete/edit buttons have `hitSlop` (good for touch targets) but no `accessibilityLabel`. Medium severity.
- **Bug:** `fetchAllData` (`:146-188`) fires `groupRes, expensesRes, balancesRes, settlementsRes, invitationsRes` in parallel but updates state sequentially — if any one fails, the others still update. Good. However, the outer try/catch catches ONE error from any of them and shows an `Alert.alert('Error', ...)`. If a single endpoint is down (e.g., invitations 403 for non-admin — handled by `.catch(() => null)`), other users would see a generic error once. Low severity — mitigated already.
- **Bug:** settlement delete button is always shown (`:878-890`) even when the current user did not create the settlement. Server enforces permission but UX is bad. Medium severity. Same on web.
- **Loading state** is a full-screen ActivityIndicator (`:1093-1118`). Web uses skeleton blocks (`[id]/page.tsx:488-522`). Mobile should match.
- **Keyboard:** the inline invite-member form uses a `TextInput` but the screen wraps a `FlatList`, NOT a `KeyboardAvoidingView`. On short phones the keyboard may cover the input. Medium severity.

### 2.3 `mobile/src/screens/Group/CreateGroupScreen.tsx`

Mental model: pink header, avatar preview, Name, Description, Create button. Simple.

- Primary action: obvious.
- KeyboardAvoidingView: yes (`:103-106`). Good.
- Inputs numeric/text: correct.
- Back behavior: `navigation.goBack()` (`:68` after success, `:89` on back button). After create, bounces back to list. UX miss (see §1a step 4). Should navigate into the new group.
- Empty/error states: not applicable.
- Accessibility: `Input` component presumably handles labels. Auto-capitalize is `words` (`:140`) — correct for group names.
- Low cognitive load.

### 2.4 `mobile/src/screens/Group/EditGroupScreen.tsx`

Near-mirror of CreateGroup. Loads group via `groupService.getGroup` (`:46`) then pre-fills.
- Loading state: full-screen spinner. Fine for a form.
- Bug: `fetchGroup` doesn't run again if focus returns after a network failure — the Alert "OK" handler pops the screen (`:56-58`). Acceptable.
- Back behavior: goBack on save. Since this is entered from GroupDetail via header action, going back to GroupDetail is correct.
- No mass delete / leave-group action here — leave-group is entirely absent from the UI. See §4 BUG-M4.

### 2.5 `mobile/src/screens/Group/AddGroupExpenseScreen.tsx`

Mental model: pink header → Title → Amount → Category (modal picker) → Paid by (modal picker) → Split-between section (Select All/None, Equal/Exact/Percentage tabs, allocation indicator, per-member checkbox list with inline inputs) → Notes → Add button.

- Primary action clarity: clear, but the screen is long — on a small device the user scrolls a lot. Fine; this is standard.
- Cognitive load: medium-high on first encounter because there are 3 split modes × 2 custom-input types. Mitigated by sensible defaults (equal, all members, you paid).
- Numeric keyboard: `keyboardType="decimal-pad"` on Amount (`:395`), inline exact amount (`:714`), inline percent (`:728`). Good.
- KeyboardAvoidingView at top-level (`:332-335`). Good.
- Split-member row touch target (`:663-738`): entire row is the tap target for toggle; with the inline `TextInput` for exact/percent inside, tapping the input still toggles the row on mobile because the parent `TouchableOpacity` catches the tap. **Bug:** tapping the exact-amount TextInput will both focus it AND toggle the member off. Actually — this is a real bug. See BUG-M2.
- Allocation indicator is great but placed ABOVE the member list (`:529-652`). When the user updates a member amount, the indicator is off-screen on small devices. Put it sticky or below-list.
- Category modal: bottom-sheet style, scrollable, emoji circles. Nice. Paid-by modal: same pattern. Good reuse.
- Success alert (`:214-219`): blocking modal. Should be a toast. Web handles this better — just does `router.push()` with no alert.
- **Bug (math rounding):** for equal split, the remainder is always assigned to the FIRST member in `splitMemberIds` array order (`:192-194`). The set iteration order is insertion order, which depends on what order toggling produced. Users may not know who absorbs the penny. Competitors show this explicitly. Low severity but non-obvious. Audit is flagged in `GROUP_EXPENSE_MATH_AUDIT.md` territory — not duplicated here.
- **Bug (members-from-route):** `members` is passed via route params (`navigation/types.ts:20`). If the group changes while the user is on this screen (someone else invites), the new member doesn't appear. Low-medium severity; the user has to re-enter.
- **Bug (duplicate "You" label):** Paid-by modal shows `You (member.name)` for the current user (`:864`). The "You" prefix duplicates information already apparent from selection state; also, `member.name` here is built from email (from `getMemberNames` in list screen), so it reads like `You (sheva)` — a little awkward.
- Accessibility: many `<TouchableOpacity>` with no labels. Medium severity.
- Visual weight: the Split section dominates the screen. That's correct, since it's the area that needs most attention.

### 2.6 `mobile/src/screens/Group/EditGroupExpenseScreen.tsx`

Structurally a copy of AddGroupExpenseScreen with `fetchLoading` state and `handleUpdateExpense` instead of `handleAddExpense`. Pre-populates from `groupService.getGroupExpense` (`:82-124`).

- **Bug:** line 111 detects "equal split" via `allEqual = amounts.every(a => Math.abs(a - amounts[0]) < 0.02)`. With the Add-screen's remainder-to-first rounding, an "equal" split of ₹10 / 3 yields ₹3.34 / ₹3.33 / ₹3.33. The difference is exactly 0.01 which is less than 0.02 — OK. But ₹100 / 7 yields 14.30 / 14.28 / 14.28 / 14.28 / 14.29 / 14.28 / 14.29 (hypothetically) and differences may exceed 0.02, causing a true "equal" split to be loaded as "exact" mode. Medium severity — roundtripping an equal split to edit and save can quietly change the allocation mode.
- **Bug:** members param is snapshotted at navigation time (`:37`). If a member was added between the expense creation and the edit, they won't appear in the UI, but their userId might still appear in splitAmong. **Render gap:** the screen maps over `members`, so a splitAmong entry for a userId missing from `members` is invisible but still submitted unchanged. Medium severity.
- **Missing `paidBy` in update payload:** `handleUpdateExpense` builds the update body (`:247-253`) with `title, amount, category, notes, splitAmong` — **NO `paidBy`**. Meaning: editing doesn't let you change who paid! Critical IF the user expected to be able to fix an error. The Add screen sends `paidBy`. The UI still presents the Paid-by picker (it's imported in the mirrored structure of the file — not shown in the 450-line read, but the file is a near-identical copy of Add). If the picker is present but the submission ignores it, that's a silent drop. Needs confirmation — flagged as BUG-M6.

### 2.7 `mobile/src/screens/Group/SettleUpScreen.tsx`

Mental model: pink header "Settle up" → white sheet. If no outstanding debt where YOU are debtor: "All settled up!" card. Otherwise: list of "YouName → OtherName — ₹X" debt cards; tap one to reveal inline form with Amount + Notes + Record Settlement.

- Information hierarchy: great. The only action is settle; it's front-and-center.
- **Issue:** "All settled up!" shows even when current user is OWED money by others (`:104-107` filters to debts where `debt.from === currentUserId`). From the user's POV, they might be owed ₹500 by 3 people and see "All settled up!" which is misleading. Copy should be "Nothing to settle from your side — you're all paid up. Others still owe you ₹X." BUG-M3.
- Numeric keyboard: yes on amount.
- Amount input is pre-filled with the full debt (`:111`). User can type less; max is validated (`:135-138`).
- Bug: no partial-settlement UX for the "pay multiple at once" case. That's a feature miss, not a bug.
- Back behavior: goBack to GroupDetail. Correct.

### 2.8 `mobile/src/screens/Invitations/InvitationsScreen.tsx`

Mental model: pink header with back button → white sheet → list of invitation cards (group icon, group name, "Invited by X", optional message, Decline/Accept buttons).

- Loading state: skeleton. Good (`:170-188`). Better than other screens.
- Empty state: icon + title + subtext. Good.
- Primary action: two equal-weight buttons. Fine for this case.
- Bug after accept: Alert → user stays on Invitations. Should auto-navigate. See §1b step 3. BUG-M5.
- No inline confirmation for Decline.

### 2.9 `mobile/src/components/ConfirmationDialog.tsx`

Animated scale + fade modal. Danger / warning / info variants. Loading state for the confirm button. Used 5× in GroupDetail (delete expense, remove member, delete settlement, delete group, cancel invitation). Web uses a simpler custom overlay (`[id]/page.tsx:1121-1156`) for delete expense ONLY; for cancel invitation it uses `window.confirm` (`:359-362`). **Inconsistent UX** — web reaches for the native browser dialog in one place and a custom dialog in another. See §3.

### 2.10 `mobile/src/components/GroupCard.tsx`

Used on HomeScreen / elsewhere but not on `GroupsListScreen.tsx` (which inlines its own card). Duplication.

- Props include `amount`, `totalExpenses`, `imageUri`, `memberCount`, `memberNames` — a heavier API than what the GroupsListScreen needs. The list-screen inlines to avoid threading the right data. Fine architecturally but it means future design changes need to be made in TWO places. Medium debt.

### 2.11 `web/src/app/dashboard/groups/page.tsx`

Mental model: pink header, "My Groups" title + `+ New` pill. Content: either skeleton (loading) or empty state with big "+ Create your first group" CTA, or a list of group link-cards.

- Clean. Icon+name+description+avatar stack+member count+chevron.
- Accessibility: group icon has `aria-hidden="true"` (`:93`). Chevron `aria-hidden` (`:134`). Good. Link text is the whole card, which acts as the accessible name from name + description + member count. Good.
- Empty state uses a unicode emoji (`:71` — `&#128101;`). Mobile uses a proper icon. Inconsistent — low severity.
- Loading state uses `Skeleton` component (good). Mobile uses `ActivityIndicator` (inconsistent).

### 2.12 `web/src/app/dashboard/groups/new/page.tsx`

Simple form, no group-type / emoji / currency selector (matches mobile — OK).

- **Bug W1:** on success `routerRef.current.push("/dashboard")` (`:46`) — goes to Dashboard root, not `/dashboard/groups` (list) nor `/dashboard/groups/<newId>` (detail). Critical UX regression. Mobile at least returns to the list.
- Submit button: `btn-primary` (global), with a spinner on pending. Disabled while pending. Good.
- Escape / back: no explicit cancel button; only the back-arrow in the header (`:60-67`) which does `router.push("/dashboard")`. Same incorrect destination.

### 2.13 `web/src/app/dashboard/groups/[id]/page.tsx`

Mental model: large pink header with back + group name. Main content sheet has **Balances → Settlements → Members → (conditional) Pending Invitations → Expenses**. Inline settle-up form appears below Balances after clicking the pill on a balance row.

- Same section-ordering issue as mobile (§5).
- Inline settle is better UX than mobile's full-navigation — keeps context.
- **Bug W2 (critical):** Member remove button is rendered but has no onClick handler (`:881-893`, comment on `:887-889`). Clicking it does nothing. Admin can see a trash icon and think they've removed someone.
- Expense edit: **no link to an edit page.** Delete only (`:1097-1107`). Mobile has edit via pen icon. Feature gap §3. Also no dedicated edit page route exists (verified: `web/src/app/dashboard/groups/[id]/expenses/[expenseId]/page.tsx` is absent).
- Delete uses custom modal `.dialogOverlay` / `.dialog` (`:1121-1155`). Good.
- Cancel invitation uses `window.confirm` (`:359-362`). Inconsistent.
- Loading: skeletons (good).
- `avatarColorFor` is defined INSIDE the component (`:438-460`). Reallocated each render. Low-severity perf.
- Invite success message displayed but there's no way to dismiss except submitting again. Minor.

### 2.14 `web/src/app/dashboard/groups/[id]/expenses/new/page.tsx`

Mirrors the mobile Add Group Expense. Same structure and logic.

- Category uses a custom dropdown (`:416-490`). Close-on-outside-click handler (`:94-107`) is correct.
- Paid By uses a native `<select>` (`:498-516`). **Inconsistent with Category** which is a custom dropdown. The category has a nice emoji display; Paid-By just lists member names. Some visual asymmetry.
- No `aria-label` on the category trigger (which is `<button type="button">`), so a screen reader reads "Select category" only. Acceptable but an explicit `aria-label="Category picker"` would be cleaner.
- Split-member row is a `<label>` wrapping a checkbox (`:572-655`). Clicking the label toggles the checkbox. But the inline exact/percentage `<input>` has `onClick={e => e.preventDefault()}` — this prevents the label-click from toggling the checkbox when you click directly on the number input. Works, but hacky — see BUG-W3. **Keyboard bug:** Tab order will skip or double-focus depending on hidden checkbox; keyboard users can't focus the exact/percentage inputs reliably without first un-focusing the hidden `<input type="checkbox">`.
- No way to reach this page from anywhere except the Group Detail's "+ Add Expense" link. No edit route at all.

### 2.15 `web/src/app/dashboard/invitations/page.tsx`

Clean list. Auto-redirect on accept after 900ms (`:41-46`). Skeleton loading. Empty state. Success banner + error banner at top of content.

- **Minor:** success banner color and error banner are positioned above the list but don't scroll with it; if the list scrolls you might miss them. CSS defines them presumably as in-flow (not sticky). Fine.
- Auto-redirect of 900ms is arbitrary — should just push immediately after the toast animation starts or just push instantly.

### 2.16 `web/src/components/Skeleton.tsx`

Not read in detail, but referenced across loading states. Mobile uses `SkeletonLoader` in `mobile/src/components/SkeletonLoader.tsx`. Parity exists.

### 2.17 `web/src/components/BalanceCard.tsx` / `DateRangePicker.tsx`

Not used in this flow. Not audited.

---

## 3. Cross-platform inconsistency

| Screen / Concept | Mobile | Web | Gap |
|---|---|---|---|
| **Groups list** | Custom inlined card, icon + description + avatar stack | Same structure, Next `<Link>` | Parity good. |
| **Empty state icon** | `<FontAwesome6 name="users">` | unicode emoji `&#128101;` | Visual inconsistency. |
| **Loading state (groups list)** | `ActivityIndicator` full-screen | `Skeleton` cards | Mobile should match web. |
| **Create group — post-success nav** | `goBack()` → list | `router.push("/dashboard")` → dashboard root | Both wrong; web worse. Should push to new group detail. |
| **Group detail section order** | Balances → Settlements → Members → [Invitations] → Expenses | Same | Both problematic (§5). |
| **Group detail loading** | ActivityIndicator | Skeleton blocks | Mobile lags. |
| **Edit group** | Dedicated screen accessible from header | **No edit-group UI on web** | Web missing a feature. |
| **Delete group** | Confirmation dialog via `ConfirmationDialog`; on success `goBack()` | **No delete-group UI on web** | Web missing a feature. |
| **Remove member** | Confirmation dialog; calls `groupService.removeMember` | **Button rendered but does nothing** (BUG-W2) | Critical regression. |
| **Add expense** | Dedicated screen with modals for Category and Paid-by | Dedicated page with custom dropdown for Category, native `<select>` for Paid-by | Minor visual inconsistency. |
| **Edit expense** | Dedicated screen with pen-icon entry point | **No edit route; no entry point; page does not exist** | Critical feature gap. |
| **Invite member — message field** | No message field on mobile (`GroupDetailScreen.tsx:931-942`) | Message field present (`[id]/page.tsx:837-846`) | Mobile missing feature. |
| **Settle up flow** | Dedicated navigation `SettleUpScreen` | Inline form on GroupDetail | Web better UX. |
| **Post-create-expense feedback** | Blocking Alert | Silent, router.push | Mobile should use toast. |
| **Post-accept-invitation nav** | Stay on Invitations + Alert | 900ms delay, then `router.push` to group | Mobile should navigate. |
| **Cancel invitation confirm** | Custom `ConfirmationDialog` | `window.confirm` | Web should use site-style dialog. |
| **Delete settlement visibility** | Always visible trash icon | Not present on web | Asymmetric. |
| **Invitations tab badge** | No badge on Me tab | No badge anywhere | Both missing. |
| **Role badge casing** | Mobile: `{member.role}` raw (`GroupDetailScreen.tsx:986`) — lowercase | Web: `"Admin" / "Member"` (`[id]/page.tsx:901`) | Mobile shows `admin` / `member`; web shows `Admin` / `Member`. |
| **Remove member icon placement on members row** | After role badge | Before role badge | Visual order inconsistency. |
| **Pending invitations section** | Shown to admins only when non-empty | Same | Parity. |

---

## 4. Bug list

Format: `ID — file:line — description — severity`.

### Mobile

- **BUG-M1** — `mobile/src/screens/Group/GroupsListScreen.tsx:73-102` — `fetchGroups` early-exits when called within 30s of last fetch without touching `loading`, so if the user navigates back and `loading === true` from a prior failed fetch, it'll stay true. Low.
- **BUG-M2** — `mobile/src/screens/Group/AddGroupExpenseScreen.tsx:663-738` — tapping the `<TextInput>` for exact amount or percentage inside the `<TouchableOpacity>` split-member row toggles the member OFF before focusing the input, because parent gets the press. User loses typing state. Medium-high.
- **BUG-M3** — `mobile/src/screens/Group/SettleUpScreen.tsx:103-107, 270-282` — when current user has positive balance (is owed money) and no outstanding debts OUT, screen says "All settled up!" which is false. Should show "Nothing to settle from your side. Others still owe you ₹X." Medium.
- **BUG-M4** — **missing feature** — no "Leave group" action anywhere. A non-admin invited member has no way to leave the group. High severity feature gap.
- **BUG-M5** — `mobile/src/screens/Invitations/InvitationsScreen.tsx:82-98` — after accepting, user is stuck on Invitations screen. Must manually navigate to Groups tab → group row. Should `navigation.navigate('GroupsTab', { screen: 'GroupDetail', ... })`. Medium.
- **BUG-M6** — `mobile/src/screens/Group/EditGroupExpenseScreen.tsx:247-253` — update payload omits `paidBy`. Even though the UI presents a Paid-by picker, editing never changes the payer server-side. Either silently ignored or rejected depending on server. **High** if picker is visible (it is — the file mirrors Add which has the picker at `Add:431-450` and Edit's structure is parallel per the copy). Verify and either (a) include `paidBy` in the PUT or (b) hide the picker.
- **BUG-M7** — `mobile/src/screens/Group/EditGroupExpenseScreen.tsx:105-124` — split-mode detection uses `< 0.02` tolerance. For groups > 5 members with remainder-to-first rounding the delta can exceed 0.02, mis-classifying equal splits as exact. Medium.
- **BUG-M8** — `mobile/src/screens/Group/EditGroupExpenseScreen.tsx:37` — `members` is snapshotted from route params; if a member was added since the expense was created, the edit screen shows fewer members than the expense actually references via `splitAmong`. Result: splitAmong for a missing member is invisible but submitted unchanged on save. Medium.
- **BUG-M9** — `mobile/src/screens/Group/GroupDetailScreen.tsx:878-890` — settlement delete button visible to everyone; server enforces permission but UI shows the affordance to people who can't use it. Medium.
- **BUG-M10** — `mobile/src/screens/Group/GroupDetailScreen.tsx:923-959` — inline invite-member form is NOT inside a `KeyboardAvoidingView`; FlatList does not shift when keyboard appears. Keyboard covers input on short devices. Medium.
- **BUG-M11** — `mobile/src/screens/Group/GroupDetailScreen.tsx:989-1002` — Remove-member button is gated on `isGroupCreator` (not `isGroupAdmin`). An admin who didn't create the group cannot remove members, contradicting the admin role badge in the same list. Medium severity — permission model inconsistency.
- **BUG-M12** — `mobile/src/screens/Group/AddGroupExpenseScreen.tsx:214-219` — success Alert blocks the UI thread until user taps OK. Should be a toast. Low-medium.
- **BUG-M13** — `mobile/src/screens/Group/GroupsListScreen.tsx:128-130` — `getMemberNames` uses `email.split('@')[0]` — ignores populated `firstName`/`lastName` from the member's userId. Inconsistent with GroupDetail which uses `getPopulatedUserName`. Low.
- **BUG-M14** — `mobile/src/screens/Group/GroupDetailScreen.tsx:44-56` — `formatDate` returns "30d ago" through `diffDays < 7`, meaning days 7+ fall through to a locale-formatted date. There's no "X weeks ago" / "X months ago" tier. Low.
- **BUG-M15** — `mobile/src/screens/Group/AddGroupExpenseScreen.tsx:271-282` — `handleExactAmountChange` strips non-digits but allows leading decimal (`.5` → ".5"). `parseFloat(".5")` = 0.5 → works, but also allows trailing decimal (`5.` → "5."), which displays oddly. Minor.

### Web

- **BUG-W1** — `web/src/app/dashboard/groups/new/page.tsx:46, 62` — after group creation success, router pushes to `/dashboard` (not `/dashboard/groups` or `/dashboard/groups/{id}`). On cancel (back button), also pushes to `/dashboard`. User loses their place. High.
- **BUG-W2** — `web/src/app/dashboard/groups/[id]/page.tsx:881-893` — remove-member trash button is rendered for admins but has no `onClick`. Clicking is a no-op. Critical regression on web.
- **BUG-W3** — `web/src/app/dashboard/groups/[id]/expenses/new/page.tsx:617, 637` — `onClick={(e) => e.preventDefault()}` on numeric/percent inputs inside `<label>` is a hack to stop label-click from toggling the checkbox. It partially works but breaks keyboard users' ability to focus the input via Tab, and breaks text selection by click-and-drag on desktop. Medium.
- **BUG-W4** — `web/src/app/dashboard/groups/[id]/page.tsx:359-372` — cancel-invitation uses `window.confirm` while the rest of the file uses a custom dialog. Inconsistent, and `window.confirm` is blocking and ugly. Low-medium.
- **BUG-W5** — `web/src/app/dashboard/groups/[id]/page.tsx` — **no edit-expense entry point** anywhere. Users can create and delete expenses but not edit them on web. Critical feature gap.
- **BUG-W6** — `web/src/app/dashboard/groups/[id]/page.tsx:1097-1107` — delete-expense button visible only when `expense.paidBy.id === currentUserId`. Server may allow admin to delete others' expenses; if so, admin cannot delete via UI. If not, this is correct. Verify against server rules. Low.
- **BUG-W7** — `web/src/app/dashboard/groups/[id]/page.tsx` — no "Leave group" / "Delete group" / "Edit group" UI. All group-management actions for admins missing. High feature gap.
- **BUG-W8** — `web/src/app/dashboard/groups/[id]/expenses/new/page.tsx:511-515` — the Paid-By `<select>` includes all members but has no "You" highlight for the current user. The current user is auto-selected via localStorage on mount (`:75-76`), but if the option label doesn't say "You", users hunt visually. Low.
- **BUG-W9** — `web/src/app/dashboard/invitations/page.tsx:41-46` — success banner + `setTimeout(..., 900)` before redirect creates a 900ms no-op window where the user can tap buttons again. `pendingId` is cleared after the mutate but before the setTimeout fires, so a second Accept is possible. Low.
- **BUG-W10** — `web/src/app/dashboard/groups/[id]/page.tsx:258-268` — reads user id from `localStorage` in `useEffect`; render-0 assumes empty `currentUserId`. Balance entries, "you" labels, "Settle Up" pills, delete buttons all flicker between states on first render. Medium-low.
- **BUG-W11** — `web/src/app/dashboard/groups/[id]/page.tsx:1097` — `expense.paidBy.id === currentUserId` — if the server returns `_id` rather than `id` for some shape mismatch (as observed in `EditGroupExpenseScreen.tsx:99-101`), the condition silently fails and the delete button never shows. Medium.
- **BUG-W12** — `web/src/app/dashboard/groups/[id]/expenses/new/page.tsx:565-658` — `selectedArr[0]` is used to determine which member receives the penny-remainder for equal split. `Set` iteration order is insertion order, meaning the "first" member visually in the UI may not be the one who actually absorbs the remainder. Low (see GROUP_EXPENSE_MATH_AUDIT if present).

### Shared / both

- **BUG-S1** — both `AddGroupExpenseScreen.tsx` and `expenses/new/page.tsx` — split-type switching between `equal` ↔ `exact` ↔ `percentage` preserves stale state in the mode the user abandoned. Switching back restores it, which may be intentional but is undocumented to the user. Low.
- **BUG-S2** — both platforms show server error strings verbatim via `Alert.alert` / inline banner. E.g., a 500 returns a cryptic message like "Request failed with status code 500". No friendly fallback for 5xx. Medium.

---

## 5. Simplicity-vs-information tradeoff

User requirement: *"as simple but informative as possible"*.

**Screens that show TOO MUCH:**
- `GroupDetailScreen.tsx` — four full sections stacked (Balances, Settlements, Members, Expenses, + conditional Pending Invitations). On a group with 10 members and 20 expenses, the user scrolls ~3 screen-heights before reaching Expenses. Recommendation: collapse Settlements and Members by default into accordion-style cards showing a count and the most recent item; expand on tap. Move Expenses up to position 2.
- `AddGroupExpenseScreen.tsx` — the split section occupies ~60% of the viewport. Defer Notes field behind an "Add notes" toggle (Splitwise does this). Also, the Allocation Indicator appears twice-ish (once as the bar, once as the subtext). Collapse to one tight row.

**Screens that HIDE info users want:**
- `GroupsListScreen.tsx` — the group card shows member avatars and count but NOT the user's own balance in the group. Splitwise shows "you are owed ₹X" / "you owe ₹X" on each group row. Surface this so users don't have to tap in to check.
- `GroupDetailScreen.tsx` — Group Total Expense is shown in the pink header ONLY when total > 0 (`:1171-1176`). But no breakdown: when was the last expense added? Who's the most recent payer? Add a 1-line "most recent: X" summary.
- `AddGroupExpenseScreen.tsx` — doesn't show the current per-person balance of each member as they're selected. When choosing who to split with, it'd help to know "Alice currently owes you ₹500, Bob is owed ₹200".
- `InvitationsScreen.tsx` — doesn't show group member count or "X expenses / ₹Y total" preview. Users accept blindly.

**Screens that BURY the primary action:**
- `GroupDetailScreen.tsx` — primary action is "Add Expense" via a FAB (fine). But a brand-new group's primary action should be "Invite members". The invite button is 4 sections deep.
- `web/src/app/dashboard/groups/[id]/page.tsx` — "Add Expense" is a pill in the Expenses section header. On a tall page it requires scrolling. Add a sticky FAB, like mobile.

---

## 6. Information architecture

### 6a. Should "Invitations" be a tab or nested under Me?

Currently: nested under Me → `MeStackParamList.Invitations` (`navigation/types.ts:47`). On web: `/dashboard/invitations` (presumably linked from sidebar).

**Evidence for moving to top-level or adjacent to Groups:**
- Invitations are time-sensitive and actionable. Hiding them under Me (which otherwise has Profiles, Categories, Settings — configuration stuff) mixes a notification inbox with settings.
- No badge is displayed on the Me tab for pending invitations (§3). Users may never discover a pending invite.
- Splitwise puts invitations at the top of the Groups list (or as a banner on Home). Settle Up shows them in a bell-icon dropdown.

**Recommendation:** keep the Invitations screen, but surface a **badge on the Groups tab** (mobile) and a **bell-icon in the top-right** (web) showing the pending count. Keep `Me → Invitations` as an additional entry point.

### 6b. Is "Groups" as a tab + HomeScreen showing groups redundant?

- `GroupsListScreen.tsx` is a dedicated tab root.
- HomeScreen (not part of this audit) presumably also shows groups as cards via `GroupCard.tsx` with balance.

**Evidence:** `GroupCard.tsx` shows `amount` and "You owe" label (`:47-53`), which the dedicated list doesn't show. Home is probably a dashboard ("overall status"), Groups tab is "enter a group". Not redundant if Home shows balance-summary and Groups tab shows a complete manageable list. If Home's group cards are styled differently from GroupsList cards, that's a design-system tax but not an IA bug.

**Recommendation:** keep both, but unify the visual treatment — use `GroupCard.tsx` in both places, with variant props.

### 6c. Does the Me tab hold too many functionally-distinct things?

Me includes: Profiles, AddProfile, EditProfile, ProfileExpenses, Categories, Settings, Invitations (`navigation/types.ts:40-48`).

- Profiles + ProfileExpenses: personal-finance feature.
- Categories: taxonomy config.
- Settings: user/app config.
- Invitations: notification inbox.

**Yes, the Me tab is overloaded.** The cleanest split:
- Me → Profile, Settings, Categories (config-ish)
- Notifications (bell icon at top-right or new top-tab) → Invitations
- The personal-finance Profiles feature is substantial enough to merit its own tab, but that's out of scope.

### 6d. Target IA (benchmarked)

**Splitwise mobile:** 4 tabs — Groups, Friends, Activity, Account. Notifications via banner/bell.
**Settle Up:** 3 tabs — Groups, Timeline, Settings. Invitations surface on Groups list as invitation cards.

**Recommended Bakaya IA (minimal churn):**
- Home (personal finance summary)
- Groups (list; invitation cards appear inline at top if pending)
- Analytics
- Me (Profiles, Categories, Settings)

This gets Invitations out of Me without adding a tab.

---

## 7. Redesign recommendation — Group Detail

This is the most-used screen in the flow. A tight redesign could slash cognitive load and elevate the primary actions.

### Goals

1. Show the user's net status at a glance.
2. Promote the Expenses timeline — this is why users are here.
3. Relegate Members / Settlements to secondary placement, since they're reference info, not daily activity.
4. Keep Settle Up one tap away.
5. Keep Invite Member discoverable.

### Layout blocks (top → bottom)

1. **Header** (pink, existing) — back + group name + overflow menu (three-dot) consolidating Edit Group / Delete Group / Leave Group / Invite. Replaces the two header action buttons currently next to the title. Reduces visual clutter for admins, gives non-admins a place for "Leave".
2. **Net Summary Hero** (expanded version of the current `netSummaryCard`) — large ₹ amount, "You are owed" / "You owe" / "All settled up". Secondary line: "X members • Y expenses • ₹Z total". Replaces the current separate "Total Expense" header chip and the smaller net card.
3. **Primary CTAs row** — two pill buttons: **[+ Add Expense]** (primary color) and **[Settle Up]** (green, outlined; only if there's anything to settle). This replaces the FAB on mobile AND fixes the web-scroll-for-CTA issue.
4. **Per-member balance list** (the existing Balances card, preserved as-is) — bar chart rows with name + amount. Keep Suggested Transfers as a collapsible sub-section under this card, collapsed by default when there are 3+ transfers.
5. **Expenses feed** (promoted to the middle/top) — the main content. Infinite scroll of expense rows. Each row: emoji + title + payer + net pill. Swipe-right (mobile) to edit, swipe-left to delete. Currently both edit/delete sit as icon buttons on the right of the row; swipe actions free up horizontal space.
6. **Accordion — Settlements** (closed by default, shows count). "3 settlements recorded. Tap to view."
7. **Accordion — Members** (closed by default). Shows top 5 avatars + "(10 total) • Invite Member". Tap expands to list with roles and remove/leave actions.
8. **Pending Invitations** (admin only, at bottom, always expanded if non-empty). Unchanged.

### What gets PROMOTED
- Net summary (hero)
- Primary CTAs (sticky)
- Expenses feed (moved up)

### What gets DEMOTED
- Members list (accordion)
- Settlements list (accordion)
- Edit/Delete group actions (into overflow menu)

### Mobile wireframe

```
┌───────────────────────────────────┐
│ ← Goa Trip                   ⋯   │  ← pink header + overflow
├───────────────────────────────────┤
│                                   │
│   You are owed                    │  ← net summary hero
│   ₹ 2,340.00                      │
│   4 members • 12 exp • ₹18,400    │
│                                   │
│  [+ Add expense]  [Settle up →]   │  ← sticky primary CTAs
│                                   │
├───────────────────────────────────┤
│ Balances                          │
│ ┌───────────────────────────────┐ │
│ │ 🟢 You      gets back ₹2,340  │ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓                   │ │
│ │ 🔴 Alice    owes ₹1,200       │ │
│ │ ▓▓▓▓▓                         │ │
│ │ 🔴 Bob      owes ₹1,140       │ │
│ │ ▓▓▓▓▓                         │ │
│ └───────────────────────────────┘ │
│ ▸ 2 suggested transfers           │  ← collapsible
├───────────────────────────────────┤
│ Activity                     12   │  ← promoted
│ ┌───────────────────────────────┐ │
│ │ 🍕  Dinner                    │ │
│ │     You paid ₹2,400     +1600 │ │
│ │     Today · you lent          │ │
│ ├───────────────────────────────┤ │
│ │ ⛽  Fuel                      │ │
│ │     Alice paid ₹1,200    -400 │ │
│ │     Yesterday · you owe       │ │
│ └───────────────────────────────┘ │
├───────────────────────────────────┤
│ ▸ 3 settlements                   │  ← accordion closed
├───────────────────────────────────┤
│ ▸ Members (4)  + Invite           │  ← accordion closed
└───────────────────────────────────┘
```

### Web wireframe

```
┌───────────────────────────────────────────────────────────────┐
│  ←  Goa Trip                                             ⋯   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  You are owed ₹ 2,340.00   4 members · 12 expenses · ₹18,400 │
│                                                               │
│  [ + Add expense ]   [ Settle up → ]                          │
│                                                               │
├───────────────── left col ─────────┬────── right col ─────────┤
│                                    │                          │
│  Activity               12 items   │  Balances                │
│  ┌──────────────────────────────┐  │  ┌────────────────────┐  │
│  │ 🍕 Dinner                    │  │  │ 🟢 You    +₹2,340  │  │
│  │    You paid ₹2,400    +1600  │  │  │ ▓▓▓▓▓▓▓▓▓▓        │  │
│  ├──────────────────────────────┤  │  │ 🔴 Alice  -₹1,200  │  │
│  │ ⛽ Fuel                     │  │  │ ▓▓▓               │  │
│  │    Alice paid ₹1,200   -400  │  │  │ 🔴 Bob    -₹1,140  │  │
│  ├──────────────────────────────┤  │  │ ▓▓▓               │  │
│  │ …                            │  │  └────────────────────┘  │
│  └──────────────────────────────┘  │  ▸ Suggested transfers   │
│                                    │  ▸ 3 settlements         │
│                                    │  ▸ Members (4) + Invite  │
└────────────────────────────────────┴──────────────────────────┘
```

Web gets a two-column layout above 960px: activity on the left (primary), side-panel on the right with balance + accordions. Below 960px, stack like mobile.

### What's achievable in the current codebase

All of the above is achievable with:
- React Native `Animated` (already in ConfirmationDialog) for accordion collapse.
- No new libraries. No `react-native-reanimated` additions.
- Tailwind-like CSS on web is already in `globals.css`; grid layout is trivial.
- Swipe actions use `SwipeableExpenseItem.tsx` (already in `mobile/src/components/`) — already in the codebase.

---

## 8. Prioritized action list

### Quick wins (<30 min each)

1. **Fix W1 post-create navigation** — change `web/src/app/dashboard/groups/new/page.tsx:46` to `router.push("/dashboard/groups/" + createdId)`. Affects web. ~10 min.
2. **Match mobile skeletons to groups-list** — swap `ActivityIndicator` for the `SkeletonLoader` pattern already used in `InvitationsScreen.tsx`. File: `GroupsListScreen.tsx:241-258`. Affects mobile only. ~25 min.
3. **Fix role badge casing on mobile** — change `{member.role}` to `{member.role === 'admin' ? 'Admin' : 'Member'}` at `GroupDetailScreen.tsx:986`. Match web. ~5 min.
4. **Use real name for avatars on groups list** — `GroupsListScreen.tsx:128-130` use `getPopulatedUserName` instead of `email.split('@')[0]`. Affects mobile. ~10 min.
5. **Fix Settle-up misleading "All settled up"** — in `SettleUpScreen.tsx:270-282`, check if `allDebts.length > 0` (meaning others owe) but `debts.length === 0` (user owes nothing) and show "You're all paid up from your side. Others owe you ₹X." ~20 min.
6. **Admin permission for remove-member** — change `isGroupCreator` → `isGroupAdmin` at `GroupDetailScreen.tsx:989`. Mobile. ~5 min.
7. **Hide settlement delete for non-creators** — gate the delete button by `s.paidBy.id === user?.id || isGroupAdmin` at `GroupDetailScreen.tsx:878` and web equivalent `[id]/page.tsx` (not yet visible there — skip web). ~10 min.
8. **Replace web `window.confirm` with custom dialog** — `[id]/page.tsx:359-372` — adopt the existing `.dialogOverlay` / `.dialog` CSS classes already defined locally (`:1121-1155`). Extract to a tiny helper if needed, or inline. ~20 min.
9. **Add "You" suffix on Paid-By select (web)** — `expenses/new/page.tsx:511-515`, wrap the option text with "(You)" when `member.userId.id === currentUserId`. ~5 min.
10. **Dismiss success/error banner buttons on web invitations page** — add a close button. ~15 min.
11. **Add `accessibilityLabel` to icon-only buttons** in GroupDetailScreen for edit, delete, remove-member, cancel-invitation, delete-settlement. ~25 min.
12. **Strip trailing-decimal edge case from amount input** — `AddGroupExpenseScreen.tsx:271-296` — normalize `5.` → `5`. ~10 min.

### Medium (2–4 hours each)

13. **Post-create navigate into new group (mobile)** — `CreateGroupScreen.tsx:68`, replace `goBack()` with `navigation.replace('GroupDetail', { groupId, groupName })`. Needs the response to include the created group id (already does, per the success branch). ~1.5 hrs including testing.
14. **Post-accept navigate into accepted group (mobile Invitations)** — `InvitationsScreen.tsx:82-98`, call `navigation.navigate('GroupsTab', { screen: 'GroupDetail', params: { ... } })` after success. ~2 hrs.
15. **Fix tap-target bug in AddGroupExpenseScreen split rows (BUG-M2)** — separate the row-toggle target from the inline input. Options: (a) when selected, render the input OUTSIDE the `TouchableOpacity` with a gap; (b) wrap the input in `pointerEvents="box-none"` and stop propagation. ~3 hrs including testing equal/exact/percentage modes.
16. **Implement web remove-member (BUG-W2)** — wire the trash button at `[id]/page.tsx:881-893` to a mutation. Server mutation already exists (mobile uses `groupService.removeMember`). ~2 hrs.
17. **Add edit-expense route on web (BUG-W5)** — create `expenses/[expenseId]/page.tsx` mirroring the mobile `EditGroupExpenseScreen.tsx`. Re-use the form component from `expenses/new/page.tsx` via a shared sub-component. ~4 hrs.
18. **Add message field to mobile invite-member form** — match web behavior at `[id]/page.tsx:837-846`. File: `GroupDetailScreen.tsx:923-959`. Send `message` in `invitationService.sendInvitation`. ~2 hrs.
19. **Replace post-submit Alerts with toast** — introduce a tiny `Toast.tsx` component (or use `react-native`'s `ToastAndroid` + iOS custom). Replace `Alert.alert('Success', …)` in AddGroupExpenseScreen, EditGroupExpenseScreen, SettleUpScreen, and others. ~3 hrs.
20. **Leave-group action** — add a Leave button for non-admin members in GroupDetailScreen header overflow or at the bottom of Members section. Needs a confirmation dialog and a `groupService.leaveGroup` call. ~3 hrs both platforms.
21. **Surface pending-invitation badge on Groups tab / bell icon (web)** — read `useMyInvitations('pending').data.length` in the tab bar. ~3 hrs.
22. **Inline KeyboardAvoidingView around invite-member form** — `GroupDetailScreen.tsx:923-959`. Wrap the FlatList in `KeyboardAvoidingView` or move the form into a header component that stays visible. ~2 hrs.
23. **Show balance on GroupCard in list** — change `GroupsListScreen.tsx` card to also show "you owe ₹X" / "you are owed ₹X" by fetching balance summary per group or returning it in the `/groups` response. Requires server support OR an N+1 request pattern. ~4 hrs.
24. **Include `paidBy` in edit-expense PUT (BUG-M6)** — `EditGroupExpenseScreen.tsx:247-253`. If the API already accepts it, just add the field. Check server. ~2 hrs.
25. **Confirm-before-decline invitation** — both platforms. ~1.5 hrs.

### Large (half-day+)

26. **Redesign Group Detail per §7** — promotes Activity, demotes Members & Settlements into accordions, adds Net Summary hero, consolidates admin actions into overflow menu. Both platforms. 1–2 days.
27. **Add swipe-to-edit / swipe-to-delete on mobile expense rows** — use the existing `SwipeableExpenseItem.tsx`. Refactor `GroupDetailScreen.tsx:588-690` to render via that component. ~1 day.
28. **Settle-up flow: unify mobile (separate screen) with web (inline)** — decision call: adopt the web inline approach on mobile too (bottom sheet) OR make web navigate to a dedicated `/settle` subroute. Recommend the former; inline is lower friction. ~1 day.
29. **IA change — promote Invitations out of Me** (per §6) — add a bell icon to top-right of each top-level screen on web, add a badge on Groups tab on mobile. Re-route Invitations screen accordingly but keep the legacy Me → Invitations for deep-links. ~1 day.
30. **Split-mode detection accuracy in Edit expense** (BUG-M7) — replace the current `< 0.02` heuristic with a server-stored `splitType` enum on the expense. Requires schema change on server. ~1–2 days.
31. **Group type / currency / emoji on CreateGroup** — bring Bakaya closer to Splitwise feature parity. Moderate scope: new fields in create form, database migration, render changes in list and detail. ~2 days.
32. **Stale-members handling in Edit expense (BUG-M8)** — refetch group membership on mount instead of relying on route-param snapshot. Also render splitAmong entries for removed members with a "(removed)" label. ~1 day.
33. **Toast / notification system app-wide** — unify the ad-hoc `Alert.alert` pattern everywhere. ~1 day.

---

## Appendix A — design-token adherence

Spot-checked uses of `Theme` and CSS tokens:
- `GroupsListScreen.tsx` consistently uses `Theme.colors.*`, `Theme.spacing.*`, `Theme.borderRadius.*`, `Theme.typography.*`. ✓
- `GroupDetailScreen.tsx:534-535` defines a hardcoded `avatarColors` array — duplicates the one in `GroupsListScreen.tsx:29-33`. Should live in a shared `constants/avatarColors.ts`. Low priority.
- `AddGroupExpenseScreen.tsx:983, 1199, 1210` uses hardcoded `#F0F0F0`, `#D0D0D0`, `#C8C8C8` for picker/split borders. These don't correspond to any Theme tokens and cause visual drift from the rest of the app, which uses `Theme.colors.lightGrey` (#F3F4F6). Should standardize. Low priority.
- Web `globals.css` tokens (`--color-primary`, `--color-text-primary`, etc.) are referenced consistently by the CSS modules. Not audited per-file.

## Appendix B — Files NOT part of this flow but cited

- `mobile/src/components/GroupCard.tsx` — used on HomeScreen; parallel implementation to the inlined `renderGroupItem` in `GroupsListScreen.tsx`. Flagged for consolidation.
- `mobile/src/components/SwipeableExpenseItem.tsx` — exists in the codebase, not used in this flow, but recommended for adoption per action 27.
- `mobile/src/components/ConfirmationDialog.tsx` — used heavily on mobile; should be matched by a similar primitive on web to avoid `window.confirm` in action 8.

---

*End of audit.*
