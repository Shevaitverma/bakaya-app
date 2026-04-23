# TanStack Query Migration Plan — Bakaya Mobile

Status: Planning doc. No code in this repo has been changed by this document.

Scope: convert every data-fetching screen in `mobile/src/screens/` from
`useState` + `useEffect` + direct `*Service.ts` calls over to TanStack
Query, with proper keys, cache invalidation, optimistic updates, and
offline mutation queueing. The provider, persister, `focusManager`, and
`onlineManager` are already wired in `src/App.tsx` — we just need to
actually use them.

---

## 1. Current state audit

Every screen fetches data by calling a `*Service.ts` singleton directly
inside `useFocusEffect` / `useEffect`, stores the result in `useState`,
and manages a manual `lastFetchTime` ref with a 30s staleness guard.
Mutations call services inline, then either refetch or mutate local
state — no caches are invalidated. The cache persister in `App.tsx` is
**live but effectively inert** because no query has ever been created
yet.

### 1.1 Services (single-class HTTP wrappers, all inline fetch)

| File | Methods (queries / mutations) |
| --- | --- |
| `src/services/authService.ts` | `register`, `login`, `googleLogin`, `refreshTokens` — all mutations; own `request()` wrapper; uses `API_CONFIG.HEADERS` directly, **does not go through `apiClient`**. |
| `src/services/profileService.ts` | Q: `getProfiles`, `getProfile`. M: `createProfile`, `updateProfile`, `deleteProfile`. Own 401-aware `request()`. |
| `src/services/expenseService.ts` | Q: `getPersonalExpenses` (paged + filters), `getExpense`, `getBalance`. M: `createExpense`, `updateExpense`, `deleteExpense`. Own 401-aware `request()` with logs + timeout. |
| `src/services/categoryService.ts` | Q: `getCategories(includeArchived)`. M: `createCategory`, `updateCategory`, `deleteCategory`. |
| `src/services/groupService.ts` | Q: `getGroups`, `getGroup`, `getGroupExpenses`, `getGroupExpense`, `getGroupBalances`, `getSettlements`. M: `createGroup`, `updateGroup`, `deleteGroup`, `createGroupExpense`, `updateGroupExpense`, `deleteGroupExpense`, `createSettlement`, `deleteSettlement`, `removeMember`, `addMember` (called from `GroupDetailScreen.tsx:248` — present in the screen, inferred to exist on the service). |
| `src/services/invitationService.ts` | Q: `listGroupInvitations`, `listMyInvitations`. M: `sendInvitation`, `acceptInvitation`, `declineInvitation`, `cancelInvitation`. |
| `src/services/analyticsService.ts` | Q: `getSummary`, `getByProfile`, `getByCategory`, `getTrends`, `getBalance`. |

Notable: **`apiClient.ts` exists and already implements `Bearer` +
401 refresh dedup** — but no service uses it yet. Services duplicate
`request()` over and over.

### 1.2 Screens — file-by-file data touches

Every screen below uses the same anti-pattern trio:
`useState` for data + loading + refreshing, `useFocusEffect` to refetch
on navigation focus, `lastFetchTime.current` ref for manual 30s
throttling.

| Screen | Fetches (line) | Mutations (line) | Notes |
| --- | --- | --- | --- |
| `Home/HomeScreen.tsx` | `profileService.getProfiles` 142; `expenseService.getPersonalExpenses(1,5,filters)` 159, 266; `groupService.getGroups(1,20)` 174; `categoryService.getCategories` 196; `expenseService.getBalance` 209 | none | 5 parallel fetches inside one `fetchAllData` 132–237. Staggered into two `Promise.all` groups. 401 → `refreshSession`. Profile-filter chip triggers `fetchExpensesForProfile` 261. |
| `Home/HomeScreen.tsx` balance block | 209 | — | Balance card uses full-window (`getBalance` no params). |
| `Analytics/AnalyticsScreen.tsx` | `analyticsService.getSummary` 172; `.getByProfile` 184; `.getByCategory` 196; `.getTrends` 208 | none | 4 parallel via `Promise.allSettled` 218–223. Re-runs on `startDate`/`endDate` change (preset chips). |
| `Category/CategoriesScreen.tsx` | `categoryService.getCategories(token,true)` 110 | `.updateCategory` 186 / 237 (archive toggle — optimistic 232); `.createCategory` 200; `.deleteCategory` 280 (optimistic 273). | Only screen with partial optimistic updates already. Re-fetches on error via `fetchCategories()` 283. |
| `Expense/ExpenseDetailScreen.tsx` | `expenseService.getPersonalExpenses(1,50,filters)` 211; `profileService.getProfiles` 242; `categoryService.getCategories` 254 | `expenseService.deleteExpense` 455 | Has debounced search (400ms, timeout ref 297–299). Multiple filter states (search, type, profile, category, startDate, endDate, datePreset). `fetchInFlightRef` for dedup 174. |
| `Expense/EditExpenseScreen.tsx` | `expenseService.getExpense` 66; `profileService.getProfiles` 67; `categoryService.getCategories` 68 | `expenseService.updateExpense` 150 | Single `useEffect` on mount (57), not `useFocusEffect`. |
| `Expense/AddExpenseScreen.tsx` | `profileService.getProfiles` 89; `categoryService.getCategories` 112 | `expenseService.createExpense` 191 | `useEffect` on mount 85–124. |
| `Profile/ProfilesScreen.tsx` | `invitationService.listMyInvitations('pending')` 52; `profileService.getProfiles` 101; `expenseService.getPersonalExpenses(1,1,{profileId})` 71 (N+1 loop 69) | `profileService.deleteProfile` 170 (optimistic 162) | Per-profile total spent is fetched in a **sequential for-loop** 69–84 to avoid rate limits. |
| `Profile/AddProfileScreen.tsx` | none | `profileService.createProfile` 88 | |
| `Profile/EditProfileScreen.tsx` | `profileService.getProfile(profileId)` 75 | `profileService.updateProfile` 127 | |
| `Profile/ProfileExpensesScreen.tsx` | `categoryService.getCategories` 73; `expenseService.getPersonalExpenses(1,100,{profileId,startDate,endDate})` 102 | `expenseService.deleteExpense` 228 (optimistic 213–221; reverts via full refetch on error 234) | Re-fetches when date range changes 138–146. |
| `Invitations/InvitationsScreen.tsx` | `invitationService.listMyInvitations('pending')` 54 | `acceptInvitation` 86 (local splice 88); `declineInvitation` 104 (local splice 105) | Processing-id lock 44/84/102. |
| `Group/GroupsListScreen.tsx` | `groupService.getGroups(1,50)` 78 | none | 401 → `refreshSession` 87–94. |
| `Group/GroupDetailScreen.tsx` | `getGroup` 134; `getGroupExpenses(1,50)` 135; `getGroupBalances` 136; `getSettlements` 137 — one `Promise.all` 123; follow-up `getGroupBalances` 194, `getGroup` 280, `getSettlements`+`getGroupBalances` 315–317 | `deleteGroupExpense` 192 (optimistic 177); `addMember` 248 (assigns `res.data` → `setGroup` 241); `removeMember` 276 then re-fetch 280; `deleteSettlement` 310 then re-fetch 315; `deleteGroup` 353. | The single most interconnected screen. Member add/remove/delete settlement all require refetching 2–3 related queries. 5 different `ConfirmationDialog`s. |
| `Group/GroupsListScreen.tsx` | see above | | |
| `Group/CreateGroupScreen.tsx` | none | `groupService.createGroup` 65 | |
| `Group/EditGroupScreen.tsx` | `groupService.getGroup` 46 | `groupService.updateGroup` 94 | |
| `Group/AddGroupExpenseScreen.tsx` | `categoryService.getCategories` 79 | `groupService.createGroupExpense` 182 | Members list passed via route params — no fetch. |
| `Group/EditGroupExpenseScreen.tsx` | `groupService.getGroupExpense` 83; `categoryService.getCategories` 84 | `groupService.updateGroupExpense` 225 | |
| `Group/SettleUpScreen.tsx` | none | `groupService.createSettlement` 147 | Balances passed via route params. |
| `Settings/SettingsScreen.tsx` | none | none | Read-only UI, unaffected by this migration. |
| `Auth/LoginScreen.tsx`, `Auth/RegisterScreen.tsx` | none | `AuthContext.login/register/googleLogin` | Auth is its own world — do **not** migrate. See §6. |

### 1.3 Existing infrastructure (keep)

- `src/lib/queryClient.ts` — sane defaults already (5m stale / 30m gc /
  no retry on 401/404/429 / `refetchOnReconnect: 'always'` /
  `refetchOnWindowFocus: false`). Has a `setAuthFailureHandler` hook
  already wired for global 401.
- `src/lib/persister.ts` — AsyncStorage persister, 1s throttle, key
  `BAKAYA_QUERY_CACHE`. Already wrapped by `PersistQueryClientProvider`
  in `App.tsx` with `maxAge: 24h` and
  `shouldDehydrateQuery: status === 'success'`.
- `src/lib/queryKeys.ts` — partial factory (expenses / profiles /
  categories / groups / analytics). **Extend, don't rewrite.**
- `src/hooks/useAppStateRefresh.ts` — wires RN `AppState` →
  `focusManager.setFocused(active)`. Good.
- `src/hooks/useOnlineManager.ts` — wires `expo-network` →
  `onlineManager.setOnline`. Good.
- `src/hooks/useRefreshOnFocus.ts` — a bridge for `useFocusEffect` to
  call `refetch()` manually. **Will become unused** once screens use
  `refetchOnWindowFocus: true`.
- `src/lib/apiClient.ts` — fully-featured fetch wrapper with token
  refresh dedup. Currently unused by services. See §2.6.

---

## 2. Target architecture

### 2.1 `src/lib/queryClient.ts` tuning (minor changes)

Current defaults are close to correct. Only three tweaks recommended:

| Option | Current | Target | Rationale |
| --- | --- | --- | --- |
| `queries.staleTime` | `5 min` | `5 min` *(keep)* | Spending data changes hourly at best; 5m is aggressive enough to refresh on app return after brief backgrounding. |
| `queries.gcTime` | `30 min` | `24 h` | We persist to AsyncStorage with `maxAge: 24h`. In-memory `gcTime` must be ≥ the persist window, otherwise hydrated queries get GC'd before consumers mount. |
| `queries.retry` | `2 retries, not on 401/404/429` | *(keep)* | Already correct. |
| `queries.retryDelay` | exp backoff capped 10s | *(keep)* | Correct for flaky mobile networks. |
| `queries.refetchOnWindowFocus` | `false` | **`true`** | This is the whole point of `useAppStateRefresh` already being wired. With `focusManager` set to RN `AppState.active`, this gives automatic refetch when the user returns from backgrounding. Replaces every `useFocusEffect(fetchAllData)` across all screens. |
| `queries.refetchOnReconnect` | `'always'` | *(keep)* | Correct — `onlineManager` drives this. |
| `queries.refetchOnMount` | `true` | *(keep)* | Correct. |
| `queries.networkMode` | *(default `'online'`)* | **`'offlineFirst'`** | With persister + flaky mobile network, we want queries to return cached data immediately on mount and only network-request when online. |
| `mutations.retry` | `false` | **`3` with delay** | See §2.5 offline behavior. |
| `mutations.networkMode` | *(default `'online'`)* | **`'offlineFirst'`** | Queues mutations until back online. |
| `mutations.onError` global | 401 handler present | *(keep)* | Already triggers `setAuthFailureHandler`. |

Also register a default `gcTime` on mutations so pending ones survive
network blips:

```ts
defaultOptions: {
  mutations: {
    networkMode: 'offlineFirst',
    retry: (failureCount, err) => {
      const s = (err as ApiError).statusCode;
      if (s === 400 || s === 401 || s === 403 || s === 404 || s === 422) return false;
      return failureCount < 3;
    },
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    gcTime: 1000 * 60 * 60 * 24, // keep paused mutations for 24h
  },
}
```

> `PersistQueryClientProvider` in `App.tsx` does not need to change,
> BUT the `dehydrateOptions.shouldDehydrateQuery` should also accept
> queries with `status === 'pending'` **no** — keep current behavior.
> Consider adding `shouldDehydrateMutation` to persist paused offline
> mutations. (See §2.5.)

### 2.2 `src/lib/queryKeys.ts` — extend the factory

Add `auth`, `invitations`, `groupExpense` detail, and broaden existing
factories so every screen can derive its key. Hierarchical so that a
single `invalidateQueries({ queryKey: keys.expenses.all })` nukes every
filtered variant.

```ts
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  expenses: {
    all: ['expenses'] as const,
    lists: () => [...queryKeys.expenses.all, 'list'] as const,
    list: (filters?: ExpenseFilters) =>
      [...queryKeys.expenses.lists(), filters ?? {}] as const,
    byProfile: (profileId: string, filters?: ExpenseFilters) =>
      [...queryKeys.expenses.all, 'by-profile', profileId, filters ?? {}] as const,
    details: () => [...queryKeys.expenses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.expenses.details(), id] as const,
    balance: (params?: BalanceParams) =>
      [...queryKeys.expenses.all, 'balance', params ?? {}] as const,
  },

  profiles: {
    all: ['profiles'] as const,
    list: () => [...queryKeys.profiles.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.profiles.all, 'detail', id] as const,
    totals: (id: string) => [...queryKeys.profiles.all, 'totals', id] as const, // for ProfilesScreen N+1
  },

  categories: {
    all: ['categories'] as const,
    list: (includeArchived?: boolean) =>
      [...queryKeys.categories.all, 'list', { includeArchived: !!includeArchived }] as const,
  },

  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: (filters?: { page?: number; limit?: number }) =>
      [...queryKeys.groups.lists(), filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.groups.all, 'detail', id] as const,
    expenses: (groupId: string, filters?: { page?: number; limit?: number }) =>
      [...queryKeys.groups.all, 'expenses', groupId, filters ?? {}] as const,
    expenseDetail: (groupId: string, expenseId: string) =>
      [...queryKeys.groups.all, 'expenses', groupId, 'detail', expenseId] as const,
    balances: (groupId: string) =>
      [...queryKeys.groups.all, 'balances', groupId] as const,
    settlements: (groupId: string) =>
      [...queryKeys.groups.all, 'settlements', groupId] as const,
  },

  analytics: {
    all: ['analytics'] as const,
    summary: (p?: AnalyticsQueryParams) => [...queryKeys.analytics.all, 'summary', p ?? {}] as const,
    byProfile: (p?: AnalyticsQueryParams) => [...queryKeys.analytics.all, 'by-profile', p ?? {}] as const,
    byCategory: (p?: AnalyticsQueryParams) => [...queryKeys.analytics.all, 'by-category', p ?? {}] as const,
    trends: (p?: AnalyticsQueryParams) => [...queryKeys.analytics.all, 'trends', p ?? {}] as const,
    balance: (p?: AnalyticsQueryParams) => [...queryKeys.analytics.all, 'balance', p ?? {}] as const,
  },

  invitations: {
    all: ['invitations'] as const,
    mine: (status?: InvitationStatus) =>
      [...queryKeys.invitations.all, 'mine', status ?? 'pending'] as const,
    forGroup: (groupId: string, status?: InvitationStatus) =>
      [...queryKeys.invitations.all, 'group', groupId, status ?? 'pending'] as const,
  },
} as const;
```

Rules:
- Every filter variant gets its own sub-key by appending the params
  object.
- `keys.foo.all` is always the broad invalidation prefix.
- Keep everything as functions returning `readonly` tuples.

### 2.3 `src/hooks/queries/` folder — one file per domain

Create `src/hooks/queries/` with a file per domain. Every hook follows
the same shape:

```
useXxxList(filters?)      → useQuery
useXxx(id)                → useQuery (enabled: !!id)
useCreateXxx()            → useMutation + onSuccess invalidate
useUpdateXxx()            → useMutation + optimistic + onSettled invalidate
useDeleteXxx()            → useMutation + optimistic + onSettled invalidate
```

Token is read inline via `useAuth()` so the hook pulls
`accessToken` at call time — no extra parameter threading.

Files and their exports:

| File | Exports |
| --- | --- |
| `useAuth.ts` (query-level, **not** AuthContext) | `useRefreshSessionMutation` only if we want a manual refresh button. Optional — we may not need this file at all. See §6. |
| `useProfiles.ts` | `useProfiles()`, `useProfile(id)`, `useCreateProfile()`, `useUpdateProfile()`, `useDeleteProfile()`, `useProfileTotals(profileId)` (the N+1 from `ProfilesScreen`). |
| `useExpenses.ts` | `usePersonalExpenses(filters)` (page+limit+filters), `useExpense(id)`, `useBalance(params)`, `useCreateExpense()`, `useUpdateExpense()`, `useDeleteExpense()`. |
| `useCategories.ts` | `useCategories({ includeArchived })`, `useCreateCategory()`, `useUpdateCategory()`, `useDeleteCategory()`, `useToggleCategoryArchive()` (thin wrapper around `useUpdateCategory` optimistic). |
| `useGroups.ts` | `useGroups({ page, limit })`, `useGroup(groupId)`, `useGroupExpenses(groupId,{ page, limit })`, `useGroupExpense(groupId,expenseId)`, `useGroupBalances(groupId)`, `useGroupSettlements(groupId)`, `useCreateGroup()`, `useUpdateGroup()`, `useDeleteGroup()`, `useCreateGroupExpense()`, `useUpdateGroupExpense()`, `useDeleteGroupExpense()`, `useCreateSettlement()`, `useDeleteSettlement()`, `useAddGroupMember()`, `useRemoveGroupMember()`. |
| `useAnalytics.ts` | `useAnalyticsSummary(params)`, `useAnalyticsByProfile(params)`, `useAnalyticsByCategory(params)`, `useAnalyticsTrends(params)`, `useAnalyticsBalance(params)`. |
| `useInvitations.ts` | `useMyInvitations(status)`, `useGroupInvitations(groupId,status)`, `useSendInvitation()`, `useAcceptInvitation()`, `useDeclineInvitation()`, `useCancelInvitation()`. |

Inside, every `queryFn` delegates to the existing `*Service` method —
do not refactor services yet. (Later refactor: migrate them all onto
`apiClient`; out of scope.)

### 2.4 Mutation → invalidation map

Every mutation lists the keys its `onSuccess` (or `onSettled`) handler
must invalidate. `invalidateQueries({ queryKey: X })` performs a prefix
match, so passing `keys.expenses.all` nukes every list+detail+balance
variant in one call.

| Mutation | Invalidate |
| --- | --- |
| `useCreateExpense` | `keys.expenses.all`; `keys.expenses.balance()`; `keys.analytics.all`; `keys.profiles.totals(profileId)` for the affected profile |
| `useUpdateExpense` | `keys.expenses.all` (covers list + detail via prefix); `keys.expenses.balance()`; `keys.analytics.all`; `keys.profiles.totals(profileId)` (old **and** new profileId if changed) |
| `useDeleteExpense` | `keys.expenses.all`; `keys.expenses.balance()`; `keys.analytics.all`; `keys.profiles.totals(profileId)` |
| `useCreateProfile` | `keys.profiles.list()` |
| `useUpdateProfile` | `keys.profiles.detail(id)`; `keys.profiles.list()`; `keys.expenses.all` (profile name/color appears in expense rows) |
| `useDeleteProfile` | `keys.profiles.all`; `keys.expenses.all`; `keys.analytics.all` |
| `useCreateCategory` | `keys.categories.all` |
| `useUpdateCategory` (incl. archive) | `keys.categories.all`; `keys.expenses.all` (category color/emoji shown in expense rows); `keys.analytics.byCategory()` |
| `useDeleteCategory` | `keys.categories.all`; `keys.expenses.all`; `keys.analytics.byCategory()` |
| `useCreateGroup` | `keys.groups.list()` |
| `useUpdateGroup` | `keys.groups.detail(id)`; `keys.groups.list()` |
| `useDeleteGroup` | `keys.groups.all` |
| `useCreateGroupExpense` | `keys.groups.expenses(groupId)`; `keys.groups.balances(groupId)`; `keys.groups.detail(groupId)` (if group totals shown) |
| `useUpdateGroupExpense` | `keys.groups.expenses(groupId)`; `keys.groups.expenseDetail(groupId,expenseId)`; `keys.groups.balances(groupId)` |
| `useDeleteGroupExpense` | `keys.groups.expenses(groupId)`; `keys.groups.balances(groupId)` |
| `useCreateSettlement` | `keys.groups.settlements(groupId)`; `keys.groups.balances(groupId)` |
| `useDeleteSettlement` | `keys.groups.settlements(groupId)`; `keys.groups.balances(groupId)` |
| `useAddGroupMember` | `keys.groups.detail(groupId)`; `keys.groups.balances(groupId)` |
| `useRemoveGroupMember` | `keys.groups.detail(groupId)`; `keys.groups.balances(groupId)`; `keys.groups.expenses(groupId)` |
| `useSendInvitation` | `keys.invitations.forGroup(groupId)` |
| `useAcceptInvitation` | `keys.invitations.mine()`; `keys.groups.list()` (user now sees a new group); `keys.groups.detail(groupId)` if known |
| `useDeclineInvitation` | `keys.invitations.mine()` |
| `useCancelInvitation` | `keys.invitations.forGroup(groupId)` |

### 2.5 Optimistic updates — where they matter

Optimistic UX is only worth the code-complexity in hot paths. Apply
selectively:

| Target | Why | Shape (pseudo) |
| --- | --- | --- |
| **Delete expense** (`useDeleteExpense`) — `ExpenseDetailScreen`, `ProfileExpensesScreen`, `GroupDetailScreen` | User expects immediate row removal — current code does this manually. | `onMutate: cancel lists → snapshot lists → setQueryData list/byProfile remove expense; onError: restore snapshot; onSettled: invalidate expenses.all` |
| **Delete group expense** (`useDeleteGroupExpense`) | Same — already optimistic in `GroupDetailScreen:177`. | same as above but for `groups.expenses(groupId)` + `groups.balances(groupId)` stays invalidated not optimistic (balance math is server-side). |
| **Delete profile** (`useDeleteProfile`) | `ProfilesScreen:162` already optimistic. | `onMutate: setQueryData profiles.list to filter out; onError: setQueryData restore; onSettled: invalidate profiles.all` |
| **Delete category** | `CategoriesScreen:273` already optimistic. | same pattern |
| **Toggle category archive** | `CategoriesScreen:232` already optimistic. | `onMutate: setQueryData categories.list → map toggle isActive; onError: re-toggle; onSettled: invalidate categories.all` |
| **Accept invitation** | `InvitationsScreen:88` already splices locally; user gets immediate "gone from list" feedback. | `onMutate: setQueryData invitations.mine() → filter out; onError: restore; onSettled: invalidate invitations + groups.list` |
| **Decline invitation** | `InvitationsScreen:105` | same |
| **Add expense** (create) | Nice-to-have but risky because server generates id/timestamps. Recommended: **don't** optimistic; rely on invalidate + refetch. Add a short-lived `isPending` toast. |
| **Create settlement** | Complex (affects balances). Leave as pure invalidate. |
| **Type/profile filter chip** (Home, ExpenseDetail) | This is **not** an optimistic update — it's a **cached keyed query**. Switching chips should just pass different `filters` to `usePersonalExpenses` — TanStack will cache each filter variant and switch instantly. Preserve currently-cached data with `placeholderData: keepPreviousData`. |

Canonical optimistic-update shape (applied uniformly):

```ts
useMutation({
  mutationFn: deleteExpense,
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: keys.expenses.all });
    const prev = queryClient.getQueriesData({ queryKey: keys.expenses.lists() });
    queryClient.setQueriesData(
      { queryKey: keys.expenses.lists() },
      (old) => filterOut(old, variables.expenseId),
    );
    return { prev };
  },
  onError: (_err, _vars, ctx) => {
    ctx?.prev?.forEach(([key, data]) => queryClient.setQueryData(key, data));
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: keys.expenses.all });
    queryClient.invalidateQueries({ queryKey: keys.expenses.balance() });
    queryClient.invalidateQueries({ queryKey: keys.analytics.all });
  },
});
```

### 2.6 Offline behavior

Already-wired: `useOnlineManager` flips `onlineManager.setOnline`, so
queries pause when offline and auto-refetch on reconnect (we have
`refetchOnReconnect: 'always'`).

Missing: **mutations don't queue**. With `mutations.networkMode =
'offlineFirst'` + `retry: 3`, mutations that fire while offline will:

1. Run `onMutate` (optimistic UI applied immediately — user sees
   success).
2. Pause in the mutation cache instead of failing.
3. Replay automatically when `onlineManager.setOnline(true)` fires.

For this to survive **app kills**, we need to persist paused mutations.
`PersistQueryClientProvider` in `App.tsx` only persists queries. Add a
`dehydrateOptions.shouldDehydrateMutation` that returns `true` for
paused mutations:

```ts
persistOptions={{
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24,
  dehydrateOptions: {
    shouldDehydrateQuery: (q) => q.state.status === 'success',
    shouldDehydrateMutation: (m) => m.state.isPaused,
  },
}}
```

On app start, `PersistQueryClientProvider` also needs
`onSuccess={() => queryClient.resumePausedMutations().then(() =>
queryClient.invalidateQueries())}` to replay them in order.

Per-mutation overrides:
- Destructive mutations (`useDeleteGroup`, `useDeleteProfile`,
  `useRemoveGroupMember`) should **not** retry — set `retry: false`.
  Irreversible operations shouldn't fire twice.
- `useRefreshSessionMutation` (if introduced) must have `retry: false`.

### 2.7 Auth + 401

Today: each service throws a typed `{ statusCode: 401 }` error; some
screens call `refreshSession()` manually (`HomeScreen:230`,
`GroupsListScreen:88`, `AnalyticsScreen:230`).

`apiClient.ts:117–131` **already** handles refresh dedup — but services
don't use it. Two options:

**Option A (minimal)** — leave services as-is, rely on the existing
`setAuthFailureHandler`:

1. In `AuthProvider` `useEffect`, call
   `setAuthFailureHandler(async () => { const ok = await refreshSession(); if (!ok) await logout(); })`.
2. `queryClient.queryCache.onError` (already present) fires it.
3. Remove per-screen 401 handling. The global handler logs the user out
   on unrefreshable 401s.
4. Problem: the **current** query's error still propagates — the user
   briefly sees an error toast before being kicked. Accept this as a
   trade-off.

**Option B (proper, recommended)** — migrate services to go through
`apiClient`:

1. Each service swaps its private `request()` for a call to
   `apiClient<T>(endpoint, options, timeout)`.
2. 401 is transparently refreshed + retried; only if refresh fails does
   a 401 bubble up.
3. The `queryCache.onError` handler still triggers logout on the
   final-401 case.
4. **Do not do this in the first pass** — it's a cross-cutting change
   touching 7 service files. Schedule it as a follow-up after query
   migration lands. Track in §4 as "Phase 2 optional."

Either way: **remove every per-screen 401 branch** (`HomeScreen:228`,
`AnalyticsScreen:226`, `GroupsListScreen:86`). Screens must not know
about 401s.

---

## 3. Screen refactor plan

Legend: "stays" = keep as local `useState` because it's UI-only state
(filter selections, dialog visibility, form inputs, processing id
locks). Those are **never** moved into queries.

### 3.1 `Home/HomeScreen.tsx`

```
old:
  const [profiles,  setProfiles]  = useState(...)
  const [recent,    setRecent]    = useState(...)
  const [groups,    setGroups]    = useState(...)
  const [categories,setCategories]= useState(...)
  const [balance,   setBalance]   = useState(...)
  + 5 loading flags + useFocusEffect(fetchAllData)

new:
  const { data: profiles,   isLoading: profilesLoading   } = useProfiles();
  const { data: balance,    isLoading: balanceLoading    } = useBalance();
  const { data: recent,     isLoading: expensesLoading   } = usePersonalExpenses(
    { page: 1, limit: 5, profileId: selectedProfileId ?? undefined },
    { placeholderData: keepPreviousData },
  );
  const { data: groups,     isLoading: groupsLoading     } = useGroups({ limit: 20 });
  const { data: categories                                } = useCategories();
```

Stays as `useState`:
- `selectedProfileId` (filter chip) — UI selection, not server state.
- `showLogoutDialog`, `logoutLoading` — dialog UI.
- `refreshing` — drop entirely; use `isRefetching` from any of the
  queries or wire `onRefresh` to `queryClient.refetchQueries`.

Remove: `lastFetchTime` ref, `selectedProfileIdRef` ref, `fetchAllData`,
`fetchExpensesForProfile`, `useFocusEffect`. All replaced by TanStack +
the already-wired `focusManager`.

### 3.2 `Analytics/AnalyticsScreen.tsx`

```
old:
  const [summary, setSummary]     = useState<SummaryData|null>(null);
  const [profileData, ...]        = useState(...)
  const [categoryData, ...]       = useState(...)
  const [trendsData, ...]         = useState(...)
  + 4 loading flags + fetchAllData with Promise.allSettled + 401 handler

new:
  const params = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);
  const { data: summary,      isLoading: loadingSummary    } = useAnalyticsSummary(params);
  const { data: profileData,  isLoading: loadingProfiles   } = useAnalyticsByProfile(params);
  const { data: categoryData, isLoading: loadingCategories } = useAnalyticsByCategory(params);
  const { data: trendsData,   isLoading: loadingTrends     } = useAnalyticsTrends(params);
```

Stays: `activePreset`, `startDate`, `endDate` (all UI-controlled date
filter), `refreshing`. Preset chip handler stays local — it just calls
`setStartDate/setEndDate` which triggers automatic refetch via key
change.

### 3.3 `Category/CategoriesScreen.tsx`

```
old:
  const [categories, setCategories] = useState(...)
  + fetchCategories + 3 mutations with local setCategories splicing

new:
  const { data: categories } = useCategories({ includeArchived: true });
  const createCategory    = useCreateCategory();
  const updateCategory    = useUpdateCategory();          // also covers archive toggle
  const deleteCategory    = useDeleteCategory();
  // optimism baked into the hook
```

Stays: `modalVisible`, `editingCategory`, `formName`, `formEmoji`,
`formColor`, `formNameError`, `saving`, `deleteDialogVisible`,
`categoryToDelete`, `deleteLoading`, emoji picker toggle, animations.

### 3.4 `Expense/ExpenseDetailScreen.tsx`

```
old:
  const [expenses, setExpenses]                 = useState(...)
  const [profiles, setProfiles]                 = useState(...)
  const [categories, setCategories]             = useState(...)
  const [totalExpenseAmount, ...] + [totalIncome, ...] + [totalExpenses, ...] + [balance, ...]
  + debounced search effect + useFocusEffect + fetchInFlightRef

new:
  const filters = { search: debouncedSearch, type: typeFilter, profileId: profileFilter,
                    category: categoryFilter, startDate, endDate };
  const { data: expensesResp, isLoading } = usePersonalExpenses(
    { page: 1, limit: 50, ...filters },
    { placeholderData: keepPreviousData },
  );
  const { data: profiles }  = useProfiles();
  const { data: categories } = useCategories();
  const deleteExpense = useDeleteExpense();
  // expensesResp.expenses, .totalExpenseAmount, .totalIncome, .totalExpenses, .balance
```

Stays: `searchText`, `debouncedSearch`, `typeFilter`, `profileFilter`,
`categoryFilter`, `startDate`, `endDate`, `datePreset`,
`openSwipeableId`, `deleteDialogVisible`, `expenseToDelete`, `exporting`.

Drop: `filtersRef`, `fetchInFlightRef`, `lastFetchTimeRef`,
`fetchExpenses`, the whole `useFocusEffect` block.

Debounce: replace the 400ms `setTimeout` in `handleSearchChange` with a
`useDebounce(searchText, 400)` → feed into the `filters` object. Key
change automatically refetches.

### 3.5 `Expense/EditExpenseScreen.tsx`

```
new:
  const { data: expense,    isLoading: l1 } = useExpense(expenseId);
  const { data: profiles,   isLoading: l2 } = useProfiles();
  const { data: categories, isLoading: l3 } = useCategories();
  const updateExpense = useUpdateExpense();
```

Stays: every form state (`title`, `amount`, `category`, `notes`,
`selectedProfileId`, `showCategoryModal`, `errors`). Seed form state
from `expense` inside a `useEffect(() => {...}, [expense])` so the
form is editable after initial load — this is the correct pattern.

### 3.6 `Expense/AddExpenseScreen.tsx`

```
new:
  const { data: profiles }   = useProfiles();
  const { data: categories } = useCategories();
  const createExpense = useCreateExpense();
```

Stays: every form field.

### 3.7 `Profile/ProfilesScreen.tsx`

```
new:
  const { data: profiles } = useProfiles();
  const { data: invitationCount } = useMyInvitations('pending', { select: d => d?.invitations?.length ?? 0 });
  const profileTotals = useProfileTotals(profiles); // batched queries (see below)
  const deleteProfile = useDeleteProfile();
```

The N+1 for per-profile totals (lines 69–84) is replaced with
`useQueries` under the hood inside `useProfileTotals`. TanStack handles
parallelism + caching per profile id; no more manual sequential loop.

Stays: dialog states, logout state.

### 3.8 `Profile/AddProfileScreen.tsx` / `EditProfileScreen.tsx`

Pure mutation screens + form state. Edit screen uses `useProfile(id)`
to seed the form.

### 3.9 `Profile/ProfileExpensesScreen.tsx`

```
new:
  const filters = { page: 1, limit: 100, profileId, startDate, endDate };
  const { data: expensesResp } = usePersonalExpenses(filters, { placeholderData: keepPreviousData });
  const { data: categories }   = useCategories();
  const deleteExpense = useDeleteExpense();
```

Stays: date range state, `openSwipeableId`, dialog state, all form
state.

### 3.10 `Invitations/InvitationsScreen.tsx`

```
new:
  const { data: invitations, isLoading } = useMyInvitations('pending');
  const accept  = useAcceptInvitation();
  const decline = useDeclineInvitation();
```

Stays: `processingId` lock (UI state to prevent double-tap during a
mutation; equivalent to `accept.isPending ? accept.variables?.id : null`
— either works). `refreshing`.

### 3.11 `Group/GroupsListScreen.tsx`

```
new:
  const { data: groupsResp, isLoading, error } = useGroups({ limit: 50 });
```

Stays: nothing beyond navigation state.

### 3.12 `Group/GroupDetailScreen.tsx` — the big one

```
new:
  const { data: group }        = useGroup(groupId);
  const { data: expensesResp } = useGroupExpenses(groupId, { limit: 50 });
  const { data: balances }     = useGroupBalances(groupId);
  const { data: settlements }  = useGroupSettlements(groupId);

  const deleteExpense     = useDeleteGroupExpense();     // optimistic on expenses list
  const addMember         = useAddGroupMember();         // invalidates group.detail
  const removeMember      = useRemoveGroupMember();
  const deleteSettlement  = useDeleteSettlement();
  const deleteGroup       = useDeleteGroup();
```

Stays (all UI): 5 dialog-visible flags, `memberEmail`, `showAddMember`,
`isAddingMember` (becomes `addMember.isPending`), `addMemberError`
(becomes `addMember.error?.message`), all 5 `*Loading` flags (use
`.isPending` from each mutation).

Critical: every single manual re-fetch inside mutation handlers
(`getGroupBalances`, `getGroup`, `getSettlements`) goes away. The
`onSettled` invalidation in the hook handles it.

### 3.13 `Group/CreateGroupScreen.tsx` / `EditGroupScreen.tsx`

Pure mutation + form state. Edit uses `useGroup(groupId)`.

### 3.14 `Group/AddGroupExpenseScreen.tsx` / `EditGroupExpenseScreen.tsx`

```
new:
  const { data: categories } = useCategories();
  const createGroupExpense = useCreateGroupExpense();   // edit variant: useGroupExpense(groupId,expenseId) + useUpdateGroupExpense()
```

Members come from route params — no query needed.

### 3.15 `Group/SettleUpScreen.tsx`

```
new:
  const createSettlement = useCreateSettlement();
```

Balances and members come from route params. `loading` becomes
`createSettlement.isPending`.

### 3.16 `Settings/SettingsScreen.tsx`, `Auth/LoginScreen.tsx`, `Auth/RegisterScreen.tsx`

No migration. Settings has no data fetching. Auth stays in
`AuthContext` (see §6).

---

## 4. Ordering / risk

Safe order — merge incrementally, screen at a time. Each PR should leave
the app fully working.

### Phase 0 — infra prep (no screen changes)

1. Extend `src/lib/queryKeys.ts` with the factories in §2.2.
2. Tune `src/lib/queryClient.ts` per §2.1 (esp. `gcTime: 24h`,
   `refetchOnWindowFocus: true`, `networkMode: 'offlineFirst'`,
   mutation retry policy).
3. Update `App.tsx` persister with `shouldDehydrateMutation` +
   `resumePausedMutations` (§2.5).
4. Wire `setAuthFailureHandler` from `AuthProvider` (§2.7 option A).
5. Create `src/hooks/queries/` folder with **empty stubs** for each
   file — import and compile-check them.

**Risk: low.** No screens change.

### Phase 1 — leaf read-only screens (no mutations)

In this order:
1. `GroupsListScreen` (only `getGroups`) — canary. If the persister,
   focusManager, and online manager don't misbehave, we're clear.
2. `Invitations/InvitationsScreen` (list + 2 mutations on same key).
3. `Analytics/AnalyticsScreen` (4 parallel queries, param-keyed).
4. `Home/HomeScreen` (5 queries, shares keys with #5/6/10).

**Risk: medium.** `Home` + `Analytics` share cache entries; correctness
is easy to verify because both re-read from a just-written cache.

### Phase 2 — simple mutation screens

5. `Category/CategoriesScreen` — 3 mutations, optimistic archive.
6. `Profile/ProfilesScreen` — includes N+1 → `useQueries`. Verify
   totals update after expense create/delete from other screens.
7. `Profile/AddProfileScreen` + `EditProfileScreen`.
8. `Expense/AddExpenseScreen` + `EditExpenseScreen`.
9. `Profile/ProfileExpensesScreen` (list + delete + date filter).

**Risk: medium-high at #6 and #9** because the shared `expenses.all`
cache is touched by 3+ screens; a bad invalidation key would cause
stale data elsewhere. Mitigation: always invalidate `keys.expenses.all`
not a specific `list(filters)`.

### Phase 3 — filter-heavy screen

10. `Expense/ExpenseDetailScreen` — debounced search, 6 filters,
    keepPreviousData. Highest-complexity migration.

**Risk: high.** The `fetchInFlightRef` dedup goes away — replaced by
TanStack's built-in query-dedup. But `keepPreviousData` is essential
here or every filter change will flash the empty state.

### Phase 4 — group interconnected screens

11. `Group/GroupDetailScreen` — touches 4 queries + 5 mutations that
    invalidate each other. Save for last.
12. `Group/CreateGroupScreen`, `EditGroupScreen`.
13. `Group/AddGroupExpenseScreen`, `EditGroupExpenseScreen`.
14. `Group/SettleUpScreen`.

**Risk: high on #11.** The `addMember` mutation returns the full new
group — use its response in `onSuccess` to `setQueryData(keys.groups.detail(groupId), res)`
so the new member appears instantly without a re-fetch race.

### Phase 5 — optional follow-up

- Migrate services onto `apiClient.ts` so 401 refresh is transparent
  (§2.7 option B). Removes ~500 lines of duplicated `request()` code.
- Delete `src/hooks/useRefreshOnFocus.ts` — now unused.

### Hotspots to watch

- **Pagination**: current code always requests `page=1`. When real
  pagination lands, switch `usePersonalExpenses`, `useGroups`,
  `useGroupExpenses` to `useInfiniteQuery`. Out of scope for this
  migration — keep as `useQuery` for now.
- **`Home` balance vs `Expense` balance**: both call
  `expenseService.getBalance` but `Home` uses no params (all-time)
  and balance invalidation fires on any expense mutation. Ensure
  `keys.expenses.balance()` prefix is invalidated, not a specific
  filter variant.
- **Group total expense** (`GroupDetailScreen:366`) is derived from
  `expenses`, not a separate endpoint — no extra key needed.

---

## 5. Testing strategy

Per-screen smoke tests to run in Expo Go after each migration PR.

### Infrastructure-level (Phase 0)

- [ ] Cold start app with **airplane mode on** — cached queries from
  previous session render immediately (persister working).
- [ ] Turn off airplane mode — queries silently refetch
  (`refetchOnReconnect`).
- [ ] Background the app for >5 minutes, return — stale queries
  refetch (`focusManager` + `staleTime: 5min` +
  `refetchOnWindowFocus: true`).
- [ ] Force-quit the app while a create mutation is in flight — on
  next launch it replays (`resumePausedMutations`).
- [ ] Expired access token — a single query triggers
  `refreshSession`; other in-flight queries don't each try to refresh.

### Per-screen (after each migration)

For every migrated screen, verify:
- [ ] Initial load shows skeleton/loading; populates with data.
- [ ] Pull-to-refresh calls `refetch`.
- [ ] Background the app for 6 min, return — automatic refetch happens
  (watch Metro logs).
- [ ] Navigate away and back — **no** refetch fires (staleTime 5m).
- [ ] Create/update/delete from the screen itself — list updates
  without a second manual refresh.
- [ ] Create from a **different** screen — navigate back; list shows
  new row within `staleTime`-triggered refetch OR immediately if the
  invalidation hit.

### Cross-screen (end-to-end)

- [ ] Create expense in `AddExpenseScreen` → go to `HomeScreen` → row
  shows; balance card updated; `AnalyticsScreen` totals updated;
  `ProfilesScreen` total for that profile updated.
- [ ] Delete a category in `CategoriesScreen` → open `ExpenseDetail`
  → category filter list no longer contains it; existing expenses
  keep their (now-orphan) category string.
- [ ] Accept an invitation → `GroupsListScreen` immediately shows the
  new group; `InvitationsScreen` no longer shows it.
- [ ] Create a group expense → `GroupDetailScreen` balances and
  settlements stay consistent.
- [ ] Offline: tap Delete on an expense — row disappears optimistically,
  tiny "offline, will sync" indicator appears; come online — mutation
  replays, no duplicate delete; switch to another screen during offline
  — optimistic state is preserved across screens.

### Optional tooling

- Install `@tanstack/react-query-devtools` in dev only (react-native
  support requires the `react-query-devtools-rn` companion or a
  web-devtools bridge). Not required; use Metro logs +
  `queryClient.getQueryCache().getAll()` in a debug screen.

---

## 6. Things NOT to do (non-goals)

- **Do not move `AuthContext` into a query.** It manages
  `user`/`accessToken`/`refreshToken`, boot-up session hydration from
  AsyncStorage, and broadcasts auth state to the whole app — it's
  infra, not server state. Keep it as a Context. Only a one-off
  `useRefreshSessionMutation` is optional, and only if we need a
  user-facing "retry login" button somewhere.
- **Do not migrate `authService.register`, `.login`, `.googleLogin`,
  `.refreshTokens` into TanStack.** They're orchestrated by
  `AuthContext` and side-effect `AsyncStorage` in specific order.
- **Do not introduce Zustand, Redux, Recoil, or any other state
  library.** TanStack Query + existing React Context is sufficient.
- **Do not refactor the 7 `*Service.ts` files in this migration.**
  Their `request()` methods work; migrating them onto `apiClient.ts`
  is a separate, independent task (§4 Phase 5).
- **Do not touch the server/backend.** Query params, response shapes,
  and endpoints must not change.
- **Do not add `useInfiniteQuery` now.** All current screens fetch a
  fixed `limit` in one page. Infinite scroll is a product decision,
  not a migration requirement.
- **Do not remove `useRefreshOnFocus.ts`** until every screen has been
  migrated — it may still have consumers mid-migration. Delete in
  Phase 5 cleanup.
- **Do not skip the `gcTime: 24h` bump.** With a 24h persister and the
  default 5-minute `gcTime`, hydrated queries are GC'd before any
  consumer mounts and the persister's entire purpose is defeated.
- **Do not set `refetchOnMount: false` globally.** It breaks the
  "returned-to-screen-after-stale-time" UX. Override per-query if ever
  needed.
- **Do not inline-thread `accessToken` through every hook.** Every
  query hook calls `useAuth()` internally and reads the token once.
  Hooks take only domain-relevant params.
- **Do not store derived data in queries.** Things like
  `groupTotalExpense`, `balanceEntries`, `suggestedTransfers` in
  `GroupDetailScreen` stay as `useMemo` — they're client-side
  computations on query data.
