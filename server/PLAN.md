# Backend Plan - Bakaya App

## Overview

Add **Profiles** (local contacts), update personal expenses to support profile tagging, complete missing CRUD operations, and add analytics endpoints.

---

## Phase 1: Profiles (Local Contacts)

### New Model: `Profile`

```
Collection: "profiles"
Fields:
  - userId        (ref: User, required)     # owner of this profile
  - name          (string, required)        # e.g., "Brother", "Girlfriend", "Self"
  - relationship  (string, optional)        # e.g., "family", "partner", "friend", "self"
  - avatar        (string, optional)        # URL or initials
  - color         (string, optional)        # hex color for UI display
  - isDefault     (boolean, default: false) # marks the "Self" profile
Indexes:
  - userId + name (unique compound)
  - userId
Timestamps: true
```

### Profile Routes

All protected (require auth).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/profiles` | List all profiles for logged-in user |
| GET | `/api/v1/profiles/:id` | Get single profile |
| POST | `/api/v1/profiles` | Create profile |
| PUT | `/api/v1/profiles/:id` | Update profile |
| DELETE | `/api/v1/profiles/:id` | Delete profile (prevent if has expenses) |

### Auto-create "Self" profile

- On user registration, automatically create a default "Self" profile with `isDefault: true`
- The "Self" profile cannot be deleted

### Zod Schemas

- `createProfileSchema`: name (required), relationship (optional), avatar (optional), color (optional)
- `updateProfileSchema`: all fields optional

---

## Phase 2: Update Personal Expenses

### Model Changes

Add to existing `Expense` model:

```
  - profileId  (ref: Profile, required)  # who this expense is for
```

### Updated Routes

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/v1/personal-expenses` | List expenses (add `?profileId=` filter) | UPDATE |
| GET | `/api/v1/personal-expenses/:id` | Get single expense | NEW |
| POST | `/api/v1/personal-expenses` | Create expense (now requires `profileId`) | UPDATE |
| PUT | `/api/v1/personal-expenses/:id` | Update expense | NEW |
| DELETE | `/api/v1/personal-expenses/:id` | Delete expense | EXISTS |

### Query Filters

The list endpoint should support:
- `?profileId=xxx` - filter by profile
- `?category=xxx` - filter by category
- `?startDate=xxx&endDate=xxx` - date range filter
- `?page=1&limit=20` - pagination (already exists)

### Migration Consideration

- Existing personal expenses have no `profileId`
- Create a migration script that assigns existing expenses to the user's "Self" profile
- Make `profileId` required for new expenses going forward

---

## Phase 3: Complete Group Expenses CRUD

### New/Updated Routes

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/v1/groups/:id/expenses/:expenseId` | Get single group expense | NEW |
| PUT | `/api/v1/groups/:id/expenses/:expenseId` | Update group expense | NEW |

### Settlement Tracking

#### New Model: `Settlement`

```
Collection: "settlements"
Fields:
  - groupId    (ref: Group, required)
  - paidBy     (ref: User, required)    # person who paid to settle
  - paidTo     (ref: User, required)    # person who received payment
  - amount     (number, required)
  - notes      (string, optional)
Indexes:
  - groupId + createdAt
Timestamps: true
```

#### Settlement Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/groups/:id/settlements` | List settlements in group |
| POST | `/api/v1/groups/:id/settlements` | Record a settlement |
| DELETE | `/api/v1/groups/:id/settlements/:settlementId` | Delete settlement |

#### Update Balances Calculation

- `GET /api/v1/groups/:id/balances` should factor in settlements
- Balance = (what you're owed from splits) - (what you owe from splits) + (settlements received) - (settlements paid)

---

## Phase 4: Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/summary` | Total spending, per-profile breakdown, current month |
| GET | `/api/v1/analytics/by-profile` | Spending grouped by profile with totals |
| GET | `/api/v1/analytics/by-category` | Spending grouped by category |
| GET | `/api/v1/analytics/trends` | Monthly spending over time |

### Query Parameters for All Analytics

- `?startDate=xxx&endDate=xxx` - date range (default: current month)
- `?profileId=xxx` - filter to specific profile

### Response Examples

**GET /api/v1/analytics/summary**
```json
{
  "success": true,
  "data": {
    "totalSpent": 15000,
    "byProfile": [
      { "profileId": "...", "profileName": "Self", "total": 8000 },
      { "profileId": "...", "profileName": "Girlfriend", "total": 5000 },
      { "profileId": "...", "profileName": "Brother", "total": 2000 }
    ],
    "period": { "start": "2026-03-01", "end": "2026-03-12" }
  }
}
```

---

## Implementation Order

1. **Profile model + CRUD routes** (no dependencies)
2. **Auto-create Self profile on registration** (depends on #1)
3. **Update Expense model with profileId** (depends on #1)
4. **Migration script for existing expenses** (depends on #1, #3)
5. **Add Get Single + Update for personal expenses** (independent)
6. **Add Get Single + Update for group expenses** (independent)
7. **Settlement model + routes** (independent)
8. **Update balance calculation with settlements** (depends on #7)
9. **Analytics endpoints** (depends on #3)

### Tasks 1-4 must be sequential. Tasks 5, 6, 7 can run in parallel. Task 8 after 7. Task 9 after 3.

---

## Phase 5: Auth Improvements

### Token Refresh Endpoint

Currently refresh tokens are generated but never used. Add:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/refresh` | Accept refresh token, return new access + refresh tokens |

- Validate refresh token using existing `verifyRefreshToken()` in `/server/src/utils/jwt.ts`
- Return 401 if expired/invalid
- Issue new token pair on success

### Auto-create Self Profile on Google SSO

- The `googleAuth()` handler in `auth.controller.ts` creates users but does NOT create a "Self" profile
- Add Self profile creation for both `register()` and `googleAuth()` flows

---

## Technical Notes

- Follow existing patterns: controller → service → model
- Use Zod for all request validation (follow existing schemas in `/server/src/schemas/`)
- Use existing pagination utility from `/server/src/utils/pagination.ts`
- Use existing response formatters from `/server/src/utils/response.ts`
- Add Swagger docs for all new endpoints
- All routes use the existing auth middleware
- Ensure profileId ownership validation (user can only access their own profiles)
- Google SSO verification uses `jose` + Google JWKS — already working, no changes needed
- Firebase project ID configured via `FIREBASE_PROJECT_ID` env var
