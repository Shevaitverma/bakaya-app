# Web Frontend Plan - Bakaya App (Next.js)

## Overview

Mirror the mobile experience on web: profile-first expense tracking, improved group flow, and analytics dashboard. Leverage Next.js App Router for clean routing.

---

## Phase 1: Profile Management

### New API Module: `/web/src/lib/api/profiles.ts`

```typescript
getProfiles()                    → GET /profiles
getProfile(id)                   → GET /profiles/:id
createProfile(data)              → POST /profiles
updateProfile(id, data)          → PUT /profiles/:id
deleteProfile(id)                → DELETE /profiles/:id
```

### New Pages

| Route | Description |
|-------|-------------|
| `/dashboard/profiles` | List all profiles |
| `/dashboard/profiles/new` | Create new profile |
| `/dashboard/profiles/[id]/edit` | Edit profile |

### Profile List Page

- Grid/list of profile cards (name, relationship, color indicator)
- "Self" profile pinned, non-deletable
- Quick link to view expenses for each profile
- "Add Profile" button

---

## Phase 2: Redesigned Dashboard

### Route: `/dashboard`

```
┌─────────────────────────────────────────────────────────┐
│  Bakaya                                    [Settings]   │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  Sidebar │  ┌─────────────────────────────────────┐     │
│          │  │        + Add Expense                 │     │
│  Home    │  └─────────────────────────────────────┘     │
│  Groups  │                                              │
│  Analytics│  ── Profiles ──────────────────────────     │
│  Profiles│  [Self] [Brother] [Girlfriend] [+ Add]      │
│          │                                              │
│          │  ── Recent Expenses ────────────────────     │
│          │  ┌─────────────────────────────────────┐     │
│          │  │ Coffee    │ ₹150  │ Self   │ Today  │     │
│          │  │ Dinner    │ ₹800  │ GF     │ Today  │     │
│          │  │ Shoes     │ ₹2000 │ Self   │ Mar 11 │     │
│          │  └─────────────────────────────────────┘     │
│          │                                              │
│          │  ── My Groups ──────────────────────────     │
│          │  ┌──────────┐  ┌──────────┐                  │
│          │  │ Trip     │  │ Flat     │                  │
│          │  │ ₹5,200   │  │ ₹1,800   │                  │
│          │  └──────────┘  └──────────┘                  │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### Key Elements

- **Sidebar navigation**: Home, Groups, Analytics, Profiles
- **Add Expense button**: Large, prominent CTA
- **Profile chips**: Horizontal row, clickable to filter expenses
- **Recent expenses table**: Shows latest expenses across all profiles with profile tag
- **Groups section**: Cards linking to group detail pages

---

## Phase 3: Add Expense Flow

### Route: `/dashboard/expenses/new`

**Layout:**

```
┌──────────────────────────────────────┐
│  ← Add Expense                       │
├──────────────────────────────────────┤
│                                      │
│  Who is this for?                    │
│  ┌──────┐ ┌────────┐ ┌──────┐       │
│  │ Self │ │Brother │ │  GF  │       │
│  └──────┘ └────────┘ └──────┘       │
│                                      │
│  Title      [                    ]   │
│  Amount     [₹                   ]   │
│  Category   [Food            ▼   ]   │
│  Notes      [                    ]   │
│                                      │
│  ┌──────────────────────────────┐    │
│  │        Save Expense          │    │
│  └──────────────────────────────┘    │
│                                      │
└──────────────────────────────────────┘
```

### UX Details

- Profile selection as clickable chips/cards at the top
- "Self" pre-selected by default
- Category dropdown with presets: Food, Travel, Shopping, Entertainment, Bills, Health, Gift, Other
- On save, redirect to dashboard with success toast
- Form validation with inline errors

---

## Phase 4: Profile Expense History

### Route: `/dashboard/profiles/[id]`

- Header: Profile name, relationship, total spent (current month)
- Expense table with columns: Title, Amount, Category, Date, Actions
- Filter bar: category dropdown, date range picker
- Edit/Delete actions per expense
- "Add Expense" button (pre-selects this profile)

### Route: `/dashboard/expenses/[id]/edit`

- Same form as Add Expense, pre-filled with existing data
- Save updates the expense

---

## Phase 5: Improved Group Pages

### Route: `/dashboard/groups/[id]` (redesign)

```
┌──────────────────────────────────────────────┐
│  ← Trip Group                    [Settings]  │
├──────────────────────────────────────────────┤
│                                              │
│  ── Balances ──────────────────────────      │
│  You owe Rahul ₹500    [Settle Up]          │
│  Priya owes you ₹300                        │
│                                              │
│  ── Expenses ──────────────────────────      │
│  ┌────────────────────────────────────┐      │
│  │ Hotel    │ ₹6000 │ You    │ Mar 10│      │
│  │          │ Split: 3 people         │      │
│  │ Cab      │ ₹900  │ Rahul  │ Mar 10│      │
│  │          │ Split: 3 people         │      │
│  └────────────────────────────────────┘      │
│                                              │
│  [+ Add Group Expense]                       │
│                                              │
│  ── Settlements ───────────────────────      │
│  You paid Rahul ₹200 on Mar 11              │
│                                              │
└──────────────────────────────────────────────┘
```

### Route: `/dashboard/groups/[id]/expenses/new` (redesign)

- Title, Amount, Category fields
- "Paid by" dropdown (group members)
- "Split between" checkboxes with member names
- Split type selector: Equal | Exact | Percentage
  - **Equal**: auto-calculate per person
  - **Exact**: manual amount inputs (validate sum = total)
  - **Percentage**: percentage inputs (validate sum = 100%)
- Save → redirect to group page

### Route: `/dashboard/groups/[id]/settle`

- Show balances (who owes whom)
- Select a debt to settle
- Enter amount
- Confirm → create settlement record

---

## Phase 6: Analytics Dashboard

### Route: `/dashboard/analytics`

- **Placeholder for now** - will build out after user provides details
- Structure with empty chart containers
- Summary cards: Total Spent, Top Profile, Top Category
- Ready for future: spending by profile chart, category breakdown, monthly trends

---

## Page Structure Summary

```
app/
├── page.tsx                                    # Landing (exists)
├── login/page.tsx                              # Login (exists)
├── register/page.tsx                           # Register (exists)
├── dashboard/
│   ├── page.tsx                                # Dashboard home (REDESIGN)
│   ├── layout.tsx                              # Dashboard layout with sidebar (NEW)
│   ├── expenses/
│   │   ├── page.tsx                            # All expenses (exists)
│   │   ├── new/page.tsx                        # Add expense (REDESIGN)
│   │   └── [id]/
│   │       └── edit/page.tsx                   # Edit expense (NEW)
│   ├── profiles/
│   │   ├── page.tsx                            # Profile list (NEW)
│   │   ├── new/page.tsx                        # Create profile (NEW)
│   │   └── [id]/
│   │       ├── page.tsx                        # Profile expense history (NEW)
│   │       └── edit/page.tsx                   # Edit profile (NEW)
│   ├── groups/
│   │   ├── new/page.tsx                        # Create group (exists)
│   │   └── [id]/
│   │       ├── page.tsx                        # Group detail (REDESIGN)
│   │       ├── settle/page.tsx                 # Settle up (NEW)
│   │       └── expenses/
│   │           ├── new/page.tsx                # Add group expense (REDESIGN)
│   │           └── [expenseId]/
│   │               └── edit/page.tsx           # Edit group expense (NEW)
│   └── analytics/
│       └── page.tsx                            # Analytics dashboard (NEW - placeholder)
```

---

## Implementation Order

1. **Profile API module + types** (no UI dependency)
2. **Dashboard layout with sidebar** (navigation structure)
3. **Profile management pages** (list, create, edit)
4. **Redesign dashboard home** (profile chips, add expense CTA, recent expenses)
5. **Redesign add expense page** (profile selection + form)
6. **Profile expense history page**
7. **Edit expense page**
8. **Redesign group detail page** (balances + expenses + settlements)
9. **Redesign add group expense** (split types)
10. **Settle up page**
11. **Analytics placeholder**

### Tasks 1-3 are sequential. Task 2 can start independently. Tasks 4-7 need 1+3 done. Tasks 8-10 are sequential but independent from 4-7. Task 11 is independent.

---

## Technical Notes

- Follow existing patterns in `/web/src/lib/api/` for API modules
- Use existing `api-client.ts` fetch wrapper for all API calls (supports GET, POST, PUT, DELETE)
- Use existing TypeScript types pattern from `/web/src/types/api.ts`
- All new types go in `/web/src/types/` (Profile, Settlement, updated Expense)
- Use Next.js App Router conventions (server/client components as appropriate)
- Forms should use client components with `"use client"`
- Consider a UI component library (shadcn/ui recommended) for consistent design - confirm with user
- Toast notifications for success/error feedback
- All amounts displayed in INR (₹) format
- Categories as shared constant: Food, Travel, Shopping, Entertainment, Bills, Health, Gift, Other

### Existing State

- **Google SSO already works** on web — Firebase popup auth on login + register pages, sends token to backend
- **Styling uses CSS Modules** — no Tailwind, no UI library installed
- **No shared components directory** — need to create `/web/src/components/` for reusable UI
- **No dashboard layout** — `dashboard/layout.tsx` does not exist, must be created for sidebar
- **Auth is client-side only** — localStorage token check, no middleware route protection
- **Providers wrapper exists** at `/web/src/app/providers.tsx` but is empty (just returns children)
- **No token refresh** — access token used until it expires, then manual re-login needed
