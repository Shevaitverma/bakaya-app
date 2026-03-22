# Mobile Plan - Bakaya App (Expo/React Native)

## Overview

Redesign the mobile app around a **profile-first expense flow**: homepage has a quick "Add Expense" button, user picks a profile (Self, Brother, Girlfriend, etc.), enters expense details, done. Also improve the group expense flow to be more Splitwise-like.

---

## Phase 1: Profile Management

### New Service: `profileService.ts`

```
- getProfiles(accessToken)          → GET /profiles
- getProfile(id, accessToken)       → GET /profiles/:id
- createProfile(data, accessToken)  → POST /profiles
- updateProfile(id, data, token)    → PUT /profiles/:id
- deleteProfile(id, accessToken)    → DELETE /profiles/:id
```

### New Screen: `ProfilesScreen`

- List all profiles as cards/chips (name, color, relationship)
- Tap to view expenses for that profile
- Long press or edit icon to edit
- "Add Profile" button
- "Self" profile pinned at top, non-deletable

### New Screen: `AddProfileScreen`

- Form: name, relationship (dropdown: self, family, partner, friend, other), color picker
- Save → navigate back

### Update API Constants

Add to `/mobile/src/constants/api.ts`:
```
PROFILES: {
  LIST: '/profiles',
  SINGLE: (id) => `/profiles/${id}`,
}
```

---

## Phase 2: Redesigned Home Screen

### Layout

```
┌──────────────────────────────┐
│  Bakaya                  ⚙️  │  ← App bar with settings
├──────────────────────────────┤
│                              │
│  ┌──────────────────────┐    │
│  │  + Add Expense       │    │  ← Primary CTA button (large, prominent)
│  └──────────────────────┘    │
│                              │
│  ── Profiles ────────────    │
│  [Self] [Brother] [GF] [+]  │  ← Horizontal scrollable chips
│                              │
│  ── Recent Expenses ─────    │
│  📝 Coffee - ₹150 (Self)    │  ← Recent expenses across all profiles
│  📝 Dinner - ₹800 (GF)     │
│  📝 Shoes - ₹2000 (Self)   │
│                              │
│  ── My Groups ───────────    │
│  ┌─────────┐ ┌─────────┐    │  ← Group cards (existing)
│  │ Trip    │ │ Flat    │    │
│  │ ₹5,200  │ │ ₹1,800  │    │
│  └─────────┘ └─────────┘    │
│                              │
├──────────────────────────────┤
│  🏠 Home  📊 Analytics  👤   │  ← Bottom tab navigation
└──────────────────────────────┘
```

### Key Changes from Current Home

- **Add Expense button** is the most prominent element
- **Profile chips** row for quick filtering / navigation
- **Recent expenses** section showing latest across all profiles
- Tapping a profile chip filters recent expenses to that profile
- Tapping a profile chip long opens that profile's full expense history
- Groups section remains similar to current

---

## Phase 3: New Add Expense Flow

### Screen: `AddExpenseScreen` (redesigned)

**Step 1: Select Profile**
```
┌──────────────────────────────┐
│  ← Add Expense               │
├──────────────────────────────┤
│                              │
│  Who is this for?            │
│                              │
│  ┌────────┐  ┌────────┐     │
│  │  🙂    │  │  👦    │     │
│  │  Self  │  │ Brother│     │
│  └────────┘  └────────┘     │
│  ┌────────┐  ┌────────┐     │
│  │  💕    │  │   +    │     │
│  │   GF   │  │  Add   │     │
│  └────────┘  └────────┘     │
│                              │
└──────────────────────────────┘
```

**Step 2: Expense Details** (after profile selection)
```
┌──────────────────────────────┐
│  ← Add Expense (for: GF)    │
├──────────────────────────────┤
│                              │
│  Title:     [Dinner        ] │
│  Amount:    [₹ 800         ] │
│  Category:  [Food     ▼    ] │
│  Notes:     [optional      ] │
│                              │
│  ┌──────────────────────┐    │
│  │     Save Expense     │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

### UX Details

- Profile selection and expense form can be on the **same screen** (profile chips at top, form below)
- Pre-select "Self" profile by default
- After saving, show success toast and navigate back to home
- Amount field has numeric keyboard
- Category is a dropdown/picker with presets: Food, Travel, Shopping, Entertainment, Bills, Health, Gift, Other

---

## Phase 4: Profile Expense History

### Screen: `ProfileExpensesScreen`

- Shows all expenses for a specific profile
- Header shows profile name, total spent (this month)
- Swipeable items for delete (reuse existing `SwipeableExpenseItem`)
- Tap expense to edit
- Filter by category, date range

---

## Phase 5: Improved Group Flow (Splitwise-like)

### Screen: `GroupDetailScreen` (redesign existing `ExpenseDetailScreen` for groups)

```
┌──────────────────────────────┐
│  ← Trip Group                │
├──────────────────────────────┤
│                              │
│  Balances:                   │
│  You owe Rahul ₹500         │
│  Priya owes you ₹300        │
│                              │
│  [Settle Up]                 │
│                              │
│  ── Expenses ────────────    │
│  📝 Hotel - ₹6000           │
│     Paid by: You             │
│     Split: 3 people          │
│                              │
│  📝 Cab - ₹900              │
│     Paid by: Rahul           │
│     Split: 3 people          │
│                              │
│  ┌──────────────────────┐    │
│  │  + Add Group Expense │    │
│  └──────────────────────┘    │
└──────────────────────────────┘
```

### Screen: `AddGroupExpenseScreen` (redesign)

```
┌──────────────────────────────┐
│  ← Add Group Expense         │
├──────────────────────────────┤
│                              │
│  Title:    [Hotel stay     ] │
│  Amount:   [₹ 6000         ] │
│  Category: [Travel    ▼    ] │
│                              │
│  Paid by:  [You       ▼    ] │
│                              │
│  Split between:              │
│  ☑ You          ₹2000       │
│  ☑ Rahul        ₹2000       │
│  ☑ Priya        ₹2000       │
│                              │
│  Split: [Equal ▼]           │  ← Equal / Exact / Percentage
│                              │
│  ┌──────────────────────┐    │
│  │     Save Expense     │    │
│  └──────────────────────┘    │
└──────────────────────────────┘
```

### Split Types

- **Equal**: Total / number of selected members
- **Exact**: Manually enter amount per person (must sum to total)
- **Percentage**: Enter % per person (must sum to 100%)

### Screen: `SettleUpScreen`

- Shows who you owe / who owes you in the group
- Select a balance to settle
- Enter amount paid
- Confirm → creates settlement record

---

## Phase 6: Bottom Tab Navigation

### New Navigation Structure

```
RootNavigator
├── AuthNavigator (unauthenticated)
│   ├── LoginScreen
│   └── RegisterScreen
└── MainTabNavigator (authenticated)
    ├── HomeTab
    │   ├── HomeScreen
    │   ├── AddExpenseScreen
    │   ├── ProfileExpensesScreen
    │   ├── GroupDetailScreen
    │   ├── AddGroupExpenseScreen
    │   └── SettleUpScreen
    ├── AnalyticsTab
    │   └── AnalyticsScreen (placeholder for now)
    └── ProfileTab
        ├── ProfilesScreen (manage profiles)
        ├── AddProfileScreen
        └── SettingsScreen
```

### Bottom Tabs

| Tab | Icon | Label |
|-----|------|-------|
| Home | home | Home |
| Analytics | bar-chart-2 | Analytics |
| Profile | user | Me |

---

## Phase 7: Analytics Screen (Placeholder)

- Build a placeholder screen with "Coming Soon" message
- Structure ready for future implementation
- Will show: spending per profile, by category, monthly trends

---

## Implementation Order

1. **Profile service + API constants** (no UI dependency)
2. **Profile management screens** (Add/Edit/List profiles)
3. **Redesign HomeScreen** (profile chips + add expense CTA + recent expenses)
4. **Redesign AddExpenseScreen** (profile selection + expense form)
5. **ProfileExpensesScreen** (expense history per profile)
6. **Bottom tab navigation** (restructure navigation)
7. **Group detail screen redesign** (balances + expenses list)
8. **Add group expense redesign** (split types: equal/exact/percentage)
9. **Settle up screen** (settlement recording)
10. **Analytics placeholder**

### Tasks 1-2 are sequential. Tasks 3-5 can start after 2. Task 6 can be done early (just navigation restructure). Tasks 7-9 are sequential. Task 10 is independent.

---

## Phase 8: Google SSO (Mobile)

Google Sign-In is working on server + web but **completely missing on mobile**.

### Dependencies to Install

- `@react-native-google-signin/google-signin` (or `expo-auth-session` with Google provider)
- Firebase config for mobile (google-services.json / GoogleService-Info.plist)

### Changes Needed

1. **Add Google Sign-In button** to `LoginScreen.tsx` and `RegisterScreen.tsx`
2. **Add `googleSignIn()` to `authService.ts`**: get Firebase ID token → POST to `/api/v1/auth/google`
3. **Update `AuthContext`**: handle Google auth flow alongside email/password
4. **Add Firebase config** to mobile constants

### Server Endpoint Already Exists

- `POST /api/v1/auth/google` accepts `{ credential: "<firebase_id_token>", deviceId?, os?, osVersion?, fcmToken? }`
- Returns `{ user, accessToken, refreshToken }`

---

## Technical Notes

- Follow existing patterns: services for API calls, context for state
- Reuse existing theme from `/mobile/src/constants/theme.ts`
- Reuse existing components (Button, Input, SwipeableExpenseItem, ConfirmationDialog)
- Use React Navigation bottom tabs: `@react-navigation/bottom-tabs` (NOT installed — must add)
- Consider adding a lightweight state management if AuthContext becomes too bloated (or create ProfileContext, ExpenseContext)
- Categories list should be a shared constant (used in Add Expense + filters) — currently hardcoded in AddExpenseScreen
- All amounts displayed in INR (₹) format
- Existing groupService only has `getGroups()` — needs expansion for group detail, expenses, settlements
- Categories icon mapping already exists at `/mobile/src/utils/categoryIcons.ts`
