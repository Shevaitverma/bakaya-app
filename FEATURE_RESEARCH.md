# Feature Research: Money Manager & Competitor Analysis for Bakaya

## Date: 2026-03-25

---

## 1. Money Manager (Realbyte Inc.) -- Deep Dive

### Overview
- 20M+ downloads, 4.64/5 stars (440K ratings)
- Latest version 4.10.5 (Feb 2026)
- Available on iOS, Android, and PC (via Wi-Fi sync)

### Key Features

| Feature | Description |
|---------|-------------|
| **Double-Entry Bookkeeping** | When income is recorded, money is deposited into an account. When an expense is recorded, money is drawn from an account. This keeps account balances accurate automatically. |
| **Income + Expense Tracking** | Separate entry types for income, expense, and transfer. Each transaction ties to a specific account. |
| **Balance Display** | Shows real-time balance per account (cash, bank, credit card) and total net balance across all accounts. |
| **Multiple Account Types** | Cash, Bank, Credit Card, Savings, Investment, Insurance, Loan. Users can create account groups. |
| **Transfers Between Accounts** | Dedicated "Transfer" transaction type to move money between accounts (e.g., Cash to Savings). Supports swapping From/To. |
| **Budget Management** | Set budgets per category (weekly/monthly/annual). Visual progress bar fills as expenses are recorded. A line indicator shows recommended spending pace based on current date vs. budget period. |
| **Categories & Subcategories** | Preset categories (Food, Transport, Entertainment, etc.) that are fully customizable. Supports subcategories under main categories. |
| **Recurring Transactions** | Set up repeat schedules (daily, weekly, monthly, yearly) and installment plans for both income and expenses. |
| **Reports & Statistics** | Weekly, monthly, and annual statistics. Pie charts for spending distribution. Graphs showing income vs. expense over time. Export to PDF/Excel. |
| **Credit/Debit Card Management** | Enter settlement dates, see payment amounts and outstanding balances. Auto-record debit card expenses. |
| **Search & Filter** | Search transactions by keyword. Filter by date range, category, account. Sort by date, amount, category. |
| **Built-in Calculator** | Calculator accessible from the amount field when entering transactions. |
| **Photo Attachments** | Attach multiple photos to transactions (e.g., receipts). |
| **PC Manager** | View and edit data on PC via Wi-Fi connection. See graphs on a larger screen. |
| **Data Backup** | Backup to Google Drive (Android) / iCloud (iOS). Import/export data. |
| **Passcode/Biometric Lock** | Protect the app with PIN, pattern, or biometric authentication. |

### UX Flow: Adding an Expense
1. Open app -> Tap "Expense" tab (or floating + button)
2. Select the **Account** to draw from (Cash, Bank, Credit Card)
3. Select a **Category** (grid of icons)
4. Enter **Amount** (with built-in calculator)
5. Add optional: Date, Notes, Photo attachments
6. Save -> Balance for that account updates immediately

### UX Flow: Adding Income
1. Tap "Income" tab
2. Select the **Account** to deposit into
3. Select an income **Category** (Salary, Gift, Investment, Other)
4. Enter Amount, Date, Notes
5. Save -> Account balance increases

### How Balance Works
- **Per Account**: Each account (Cash, Bank, etc.) has its own running balance
- **Net Total**: Sum of all account balances = total assets
- **Income - Expense**: The app shows total income vs. total expense for any period
- **Budget Remaining**: Budget amount - expenses in that category for the period

---

## 2. Competitor Comparison

### Wallet by BudgetBakers
| Feature | Details |
|---------|---------|
| Bank Sync | Connects to 15,000+ banks worldwide. Auto-imports and categorizes transactions. |
| AI Categorization | Machine learning sorts transactions into categories based on habits. |
| Smart Budgets | Weekly, monthly, or custom-period budgets. AI-powered predictions. Alerts before overspending. |
| Bill Reminders | Scheduled payments with smart reminders for upcoming bills. |
| Cash Flow Forecasting | Predicts future balances based on income/expense patterns. |
| Family Sharing | Share accounts and track together with family members. |
| API/MCP Integration | REST API + MCP server for connecting to AI assistants (Claude, ChatGPT). |
| Web App | Full web dashboard alongside mobile. |
| Investment Tracking | Track stocks alongside bank accounts. |

### Money Lover
| Feature | Details |
|---------|---------|
| Multiple Wallets | Separate wallets for Cash, Savings, Credit Cards. Each with its own balance. |
| Budget Planner | Set per-category limits. Predictive spending alerts based on history. |
| Bill & Debt Tracking | Track recurring bills with reminders. Manage debts/loans with payment schedules. |
| Savings Goals | Set savings targets with progress tracking. |
| Multi-Currency | Supports all currencies with live exchange rates. |
| Cross-Platform Sync | iOS, Android, Web -- all synced. |
| Category Visualization | See expense for a specific category across time (trend per category). |

### Monefy
| Feature | Details |
|---------|---------|
| One-Tap Entry | Category icons on home screen. Tap icon -> enter amount -> done. Under 10 seconds. |
| Visual Charts | Home screen is a pie chart showing spending distribution. |
| Multi-Currency | Track in multiple currencies simultaneously. |
| Cloud Sync | Google Drive / Dropbox sync. Family members can share the same data. |
| Simplicity First | No bank sync, no AI -- purely manual tracking for maximum awareness. |
| Passcode Protection | App lock behind PIN (Pro feature). |
| Custom Categories | Add new categories with custom icons (Pro feature). |

---

## 3. Bakaya's Current State

### What Exists
| Feature | Status |
|---------|--------|
| Personal expense tracking | Yes -- title, amount, category, notes, date |
| Profile-based tagging | Yes -- expenses tagged to profiles (Self, Brother, GF, etc.) |
| Profile CRUD | Yes -- create, edit, delete profiles; auto-created "Self" |
| Group expense splitting | Yes -- equal, exact, percentage splits |
| Settlement tracking | Yes -- record settlements within groups |
| Balance calculation | Yes -- who owes whom in groups |
| Analytics: summary | Yes -- total spent, by-profile breakdown |
| Analytics: by-category | Yes -- spending grouped by category |
| Analytics: by-profile | Yes -- spending grouped by profile with totals and counts |
| Analytics: trends | Yes -- monthly spending over last 6 months |
| Categories | Yes -- 16 preset categories (Food, Transport, Shopping, etc.) |
| Date/category/profile filtering | Yes -- on expense list and analytics |
| Google SSO | Yes -- web and server (not yet on mobile) |
| Web + Mobile | Yes -- Next.js web and Expo mobile |

### What's Missing (vs. Competitors)
| Feature | Money Manager | Wallet | Money Lover | Monefy | Bakaya |
|---------|:---:|:---:|:---:|:---:|:---:|
| Income tracking | Yes | Yes | Yes | Yes | **No** |
| Balance (income - expense) | Yes | Yes | Yes | Yes | **No** |
| Multiple accounts/wallets | Yes | Yes | Yes | Yes | **No** |
| Budgets | Yes | Yes | Yes | No | **No** |
| Recurring transactions | Yes | Yes | Yes | No | **No** |
| Subcategories | Yes | No | No | No | **No** |
| Custom categories | Yes | Yes | Yes | Pro | **No** |
| Bill reminders | Yes | Yes | Yes | No | **No** |
| Photo/receipt attachment | Yes | Yes | No | No | **No** |
| Data export (CSV/PDF) | Yes | Yes | Yes | Yes | **No** |
| Search transactions | Yes | Yes | Yes | No | **No** |
| Savings goals | No | Yes | Yes | No | **No** |
| Debt/loan tracking | No | No | Yes | No | **No** |
| Bank sync | No | Yes | No | No | **No** |
| Multi-currency | Yes | Yes | Yes | Yes | **No** |
| App lock (PIN/biometric) | Yes | Yes | Yes | Pro | **No** |
| Calculator in amount field | Yes | No | No | Yes | **No** |
| Data backup/restore | Yes | Yes | Yes | Yes | **No** |
| Dark mode | Yes | Yes | Yes | Yes | **Unclear** |

---

## 4. Prioritized Feature Recommendations

### MUST-HAVE (Next Release) -- Table Stakes

These are features that every serious expense tracker has. Without them, users will leave for competitors.

| # | Feature | Importance | Effort | Tier |
|---|---------|-----------|--------|------|
| 1 | Income Tracking | Critical | Medium | Free |
| 2 | Balance Dashboard (Income - Expenses) | Critical | Medium | Free |
| 3 | Budgets (per category, monthly) | Critical | Medium | Free |
| 4 | Search & Filter Transactions | High | Easy | Free |
| 5 | Data Export (CSV) | High | Easy | Free |

### SHOULD-HAVE (Future Release) -- Significant Experience Improvements

| # | Feature | Importance | Effort | Tier |
|---|---------|-----------|--------|------|
| 6 | Recurring Transactions | High | Medium | Free |
| 7 | Custom Categories (user-defined) | High | Easy | Free |
| 8 | Photo/Receipt Attachment | Medium | Medium | Free (limit) / Paid (unlimited) |
| 9 | Bill Reminders & Notifications | Medium | Medium | Paid |
| 10 | Multiple Accounts/Wallets | Medium | Hard | Paid |

### NICE-TO-HAVE (Paid Tier) -- Premium Differentiation

| # | Feature | Importance | Effort | Tier |
|---|---------|-----------|--------|------|
| 11 | Savings Goals | Medium | Medium | Paid |
| 12 | Multi-Currency Support | Low-Medium | Medium | Paid |
| 13 | App Lock (PIN/Biometric) | Medium | Easy | Paid |
| 14 | Data Backup/Restore (Cloud) | Medium | Medium | Paid |
| 15 | Debt/Loan Tracking | Low | Hard | Paid |
| 16 | Advanced Reports (PDF export, visual charts) | Medium | Hard | Paid |
| 17 | AI Categorization (auto-categorize by title) | Low | Hard | Paid |

---

## 5. Top 10 Feature Details

### Feature 1: Income Tracking

**What Money Manager does:** Separate "Income" transaction type. User selects account, picks an income category (Salary, Gift, Investment, Freelance, Other), enters amount. Income deposits money into the selected account.

**How Bakaya should implement it:**
- Add a `type` field to the Expense model: `"expense" | "income"`
- Add income-specific categories: Salary, Freelance, Gift, Investment, Refund, Other Income
- The "Add Expense" form gets a toggle/tab at the top: "Expense" | "Income"
- When "Income" is selected, show income-specific categories
- Profile tagging still applies (e.g., income received from Brother, income for Self)
- This fits perfectly with Bakaya's profile model -- "I received a gift from Brother" is an income tagged to Brother

**Data model changes:**
```
Expense model:
  + type: { type: String, enum: ['expense', 'income'], default: 'expense' }
```
Categories constant:
```
INCOME_CATEGORIES = ['Salary', 'Freelance', 'Gift', 'Investment', 'Refund', 'Side Hustle', 'Other Income']
```
Schema update:
```
createExpenseSchema: + type: z.enum(['expense', 'income']).default('expense')
```

**Analytics updates:**
- Summary endpoint returns `totalIncome`, `totalExpense`, `netBalance`
- Trends endpoint includes income vs. expense per month
- By-profile includes income vs. expense per profile

**Estimated effort:** 3-4 days (backend model + schema + analytics updates + web form + mobile form)

---

### Feature 2: Balance Dashboard (Income - Expenses)

**What Money Manager does:** Shows real-time balance per account and net total. The home screen prominently displays: Total Income, Total Expenses, Balance (Income - Expenses) for the selected period.

**How Bakaya should implement it:**
- Dashboard prominently shows three cards at the top: Income | Expenses | Balance
- Balance = Total Income - Total Expenses for the selected period
- Color-coded: green for positive balance, red for negative
- Per-profile balance breakdown: "You spent X on GF this month, but received Y from GF"
- Period selector: This Week / This Month / This Year / Custom

**Data model changes:** None beyond Feature 1 (uses the `type` field)

**API changes:**
- Update `GET /api/v1/analytics/summary` to return:
```json
{
  "totalIncome": 50000,
  "totalExpense": 35000,
  "balance": 15000,
  "byProfile": [
    { "profileName": "Self", "income": 50000, "expense": 20000, "balance": 30000 },
    { "profileName": "Girlfriend", "income": 0, "expense": 10000, "balance": -10000 }
  ]
}
```

**Estimated effort:** 2-3 days (analytics endpoint update + dashboard redesign on web + mobile)

---

### Feature 3: Budgets (Per Category, Monthly)

**What Money Manager does:** Users set a monthly budget for each category (e.g., Food: 5000, Transport: 2000). A progress bar fills as expenses accumulate. A line indicator shows the "recommended pace" (budget / days in month * days elapsed). Notifications when approaching limit.

**How Bakaya should implement it:**
- New `Budget` model linked to user
- Each budget has: category, amount, period (monthly is default)
- Dashboard shows budget cards with progress bars for each budgeted category
- Color transitions: green -> yellow (75%) -> red (100%+)
- Budget vs. actual spending visualization
- Bakaya twist: Option to set budgets per profile (e.g., "I want to limit spending on GF to 5000/month")

**Data model changes:**
```
New collection: "budgets"
Fields:
  - userId        (ref: User, required)
  - category      (string, required)          // or null for "total" budget
  - profileId     (ref: Profile, optional)    // budget per profile (Bakaya-unique!)
  - amount        (number, required)          // budget limit
  - period        (string: 'weekly' | 'monthly' | 'yearly', default: 'monthly')
  - isActive      (boolean, default: true)
Indexes:
  - userId + category + profileId + period (unique compound)
Timestamps: true
```

**New API endpoints:**
```
GET    /api/v1/budgets              -- list all budgets for user
POST   /api/v1/budgets              -- create budget
PUT    /api/v1/budgets/:id          -- update budget
DELETE /api/v1/budgets/:id          -- delete budget
GET    /api/v1/budgets/status       -- get all budgets with current spending vs. limit
```

**Estimated effort:** 5-7 days (new model + CRUD + budget status calculation + UI on web + mobile)

---

### Feature 4: Search & Filter Transactions

**What Money Manager does:** Full-text search across transaction titles and notes. Filter by date range, category, account. Sort by date, amount, or category.

**How Bakaya should implement it:**
- Add a search bar at the top of the expenses list page
- Search matches against `title` and `notes` fields (case-insensitive regex)
- Combined with existing filters: category, profile, date range
- Add sort options: date (newest/oldest), amount (highest/lowest)

**Data model changes:**
```
Expense model:
  + text index on title and notes for efficient search
```
Or simpler: use MongoDB `$regex` for title/notes search (sufficient for personal data volumes).

**API changes:**
- Add `search` query parameter to `GET /api/v1/personal-expenses`
- Add `sortBy` and `sortOrder` query parameters
```
expenseQuerySchema:
  + search: z.string().optional()
  + sortBy: z.enum(['createdAt', 'amount', 'title']).optional().default('createdAt')
  + sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
```

**Estimated effort:** 2 days (backend query update + search UI on web + mobile)

---

### Feature 5: Data Export (CSV)

**What Money Manager does:** Export transactions to CSV or Excel format. Choose date range and categories to export. Also supports PDF report generation.

**How Bakaya should implement it:**
- "Export" button on the expenses list page
- Export current filtered view (respects date range, category, profile filters)
- CSV format with columns: Date, Title, Amount, Category, Profile, Notes, Type (income/expense)
- Generate CSV on the server side and return as downloadable file
- On mobile: share sheet to save/send the file

**Data model changes:** None

**New API endpoint:**
```
GET /api/v1/personal-expenses/export?format=csv&startDate=...&endDate=...&profileId=...&category=...
```
Returns `Content-Type: text/csv` with appropriate headers for download.

**Estimated effort:** 2-3 days (server endpoint + web download button + mobile share integration)

---

### Feature 6: Recurring Transactions

**What Money Manager does:** When creating a transaction, users can set it to repeat: daily, weekly, bi-weekly, monthly, yearly. The app auto-creates the transaction at the scheduled interval. Users can also set installment plans (e.g., 12 monthly payments).

**How Bakaya should implement it:**
- New "Recurring" toggle when creating an expense/income
- When enabled, show: frequency (daily/weekly/monthly/yearly), end condition (never / after N occurrences / until date)
- A background job (cron) creates the actual expense records at the scheduled time
- List of recurring rules visible in settings or a dedicated "Recurring" section
- Users can pause, edit, or delete recurring rules

**Data model changes:**
```
New collection: "recurringTransactions"
Fields:
  - userId        (ref: User, required)
  - profileId     (ref: Profile, optional)
  - title         (string, required)
  - amount        (number, required)
  - type          (string: 'expense' | 'income', required)
  - category      (string, optional)
  - notes         (string, optional)
  - frequency     (string: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly')
  - nextRunDate   (Date, required)
  - endDate       (Date, optional)          // null means "forever"
  - maxOccurrences (number, optional)       // null means unlimited
  - currentCount  (number, default: 0)
  - isActive      (boolean, default: true)
Indexes:
  - userId + isActive
  - nextRunDate (for cron query)
Timestamps: true
```

**Estimated effort:** 5-7 days (model + CRUD + cron job + UI toggle on forms + recurring list screen)

---

### Feature 7: Custom Categories (User-Defined)

**What Money Manager does:** Comes with preset categories but users can add, edit, rename, reorder, and delete categories. Supports subcategories. Custom icons for categories.

**How Bakaya should implement it:**
- Keep the current 16 preset categories as defaults
- Allow users to add their own categories (stored per user)
- Category management screen in settings: add, rename, reorder, delete custom categories
- Deleted custom categories don't affect existing transactions (category stored as string)
- Phase 2 enhancement: subcategories (e.g., Food > Dining Out, Food > Groceries)

**Data model changes:**
```
New collection: "categories"
Fields:
  - userId        (ref: User, required)
  - name          (string, required)
  - type          (string: 'expense' | 'income' | 'both', default: 'expense')
  - icon          (string, optional)       // icon name/identifier
  - color         (string, optional)       // hex color
  - parentId      (ref: Category, optional) // for subcategories (Phase 2)
  - order         (number, default: 0)     // for custom ordering
  - isDefault     (boolean, default: false) // preset categories
Indexes:
  - userId + name (unique compound)
  - userId + order
Timestamps: true
```

**Estimated effort:** 3-4 days (model + CRUD + seed defaults + category picker UI update on web + mobile)

---

### Feature 8: Photo/Receipt Attachment

**What Money Manager does:** Users can attach multiple photos to any transaction (receipts, bills, screenshots). Photos are stored locally with option to back up.

**How Bakaya should implement it:**
- "Add Photo" button on the expense form (both add and edit)
- On mobile: camera capture or gallery pick
- On web: file upload
- Store images in cloud storage (AWS S3, already have AWS infra via Terraform)
- Save image URLs in the expense document
- Free tier: 1 photo per transaction
- Paid tier: unlimited photos per transaction

**Data model changes:**
```
Expense model:
  + attachments: [{ type: String }]    // array of S3 URLs
```

**New infrastructure:**
- S3 bucket for user uploads
- Presigned URL generation endpoint for direct uploads
- Image size limit (e.g., 5MB per image)

**Estimated effort:** 5-7 days (S3 setup + upload endpoint + model update + camera/gallery UI on mobile + file upload on web)

---

### Feature 9: Bill Reminders & Notifications

**What Money Manager does:** N/A (Money Manager doesn't have strong reminders). Wallet by BudgetBakers excels here: smart reminders for upcoming bills, push notifications for budget limits, recurring bill tracking.

**How Bakaya should implement it:**
- Tie into recurring transactions: when a recurring expense is due, send a push notification
- Budget alerts: notify when spending hits 80% and 100% of budget
- Weekly/monthly spending summary notification
- Uses FCM (Firebase Cloud Messaging) -- the server already has `fcmToken` in the Device model

**Data model changes:**
```
User preferences:
  + notificationPreferences: {
      budgetAlerts: boolean (default: true),
      recurringReminders: boolean (default: true),
      weeklySummary: boolean (default: false),
      monthlySummary: boolean (default: true),
    }
```

**Estimated effort:** 4-5 days (FCM integration + notification service + preference UI + cron jobs for scheduled notifications)

---

### Feature 10: Multiple Accounts/Wallets

**What Money Manager does:** Users create accounts (Cash, Bank Account, Credit Card, Savings, etc.). Every transaction is tied to an account. Transfers move money between accounts. Each account has a running balance. Total assets = sum of all account balances.

**How Bakaya should implement it:**
- New "Account" concept (not to be confused with user accounts)
- Default accounts: Cash, Bank Account
- Users can create more: Savings, Credit Card, Investment, etc.
- When adding an expense, select which account to deduct from
- When adding income, select which account to deposit into
- Transfer transaction type: move money between accounts
- Account balances shown on dashboard
- Bakaya twist: accounts are per-user, but expenses still tie to profiles. So you can track "I spent X from my Credit Card on GF"

**Data model changes:**
```
New collection: "accounts"
Fields:
  - userId          (ref: User, required)
  - name            (string, required)      // "Cash", "HDFC Bank", "ICICI Credit Card"
  - type            (string: 'cash' | 'bank' | 'credit_card' | 'savings' | 'investment' | 'other')
  - initialBalance  (number, default: 0)
  - color           (string, optional)
  - icon            (string, optional)
  - isDefault       (boolean, default: false)  // default account for new expenses
  - isArchived      (boolean, default: false)
Indexes:
  - userId + name (unique compound)
Timestamps: true

Expense model:
  + accountId    (ref: Account, optional)    // which account this came from

New collection: "transfers"
Fields:
  - userId       (ref: User, required)
  - fromAccountId (ref: Account, required)
  - toAccountId   (ref: Account, required)
  - amount        (number, required)
  - notes         (string, optional)
Timestamps: true
```

**Estimated effort:** 7-10 days (2 new models + account CRUD + transfer logic + balance calculation + account picker in expense form + account management screen + dashboard integration)

---

## 6. Implementation Roadmap

### Phase A: Core Financial Features (Must-Have) -- ~2-3 weeks
1. Income tracking (type field + income categories)
2. Balance dashboard (income - expense display)
3. Search & filter enhancements
4. Data export (CSV)

### Phase B: Planning Features -- ~2-3 weeks
5. Custom categories
6. Budgets (per category + per profile)

### Phase C: Automation -- ~2 weeks
7. Recurring transactions
8. Bill reminders & notifications

### Phase D: Premium Features -- ~3-4 weeks
9. Photo/receipt attachments (requires S3)
10. Multiple accounts/wallets

### Phase E: Polish & Advanced -- backlog
11. Savings goals
12. Multi-currency
13. App lock
14. Cloud backup/restore
15. Advanced PDF reports
16. Debt/loan tracking
17. AI categorization

---

## 7. Bakaya's Unique Competitive Advantage

While implementing these standard features, Bakaya's **profile-based expense segregation** remains a unique differentiator that none of the researched competitors offer:

| Bakaya-Unique Feature | Competitor Equivalent | Why Bakaya Is Better |
|-----------------------|----------------------|---------------------|
| Per-profile expense tagging | None -- competitors track by category only | "How much did I spend on my GF this month?" is unanswerable in Money Manager |
| Per-profile budgets | Per-category budgets only | Set a budget specifically for spending on Brother, not just on "Food" |
| Profile-based income | N/A | Track gifts/money received per person |
| Profile + Group integration | Splitwise has groups only | Personal + group spending in one app |

**Recommendation:** Every new feature should be evaluated through the "profile lens":
- Budgets? Support per-profile budgets, not just per-category.
- Income? Tag income to profiles (gift from Brother, salary for Self).
- Recurring? A recurring expense can be tagged to a profile (monthly GF subscription).
- Reports? Show spending per profile with income/expense breakdown.

This is what makes Bakaya *not just another expense tracker*.

---

## Sources

- [Money Manager Expense & Budget - Google Play](https://play.google.com/store/apps/details?id=com.realbyteapps.moneymanagerfree&hl=en_US)
- [Money Manager Expense & Budget - App Store](https://apps.apple.com/us/app/money-manager-expense-budget/id560481810)
- [Money Manager Official Site (Realbyte)](https://www.realbyteapps.com/)
- [Money Manager Help Center](https://help.realbyteapps.com/hc/en-us)
- [How to set up a budget - Money Manager Help Center](https://help.realbyteapps.com/hc/en-us/articles/360042842974-How-to-set-up-modify-delete-a-budget)
- [How to enable sub-category - Money Manager Help Center](https://help.realbyteapps.com/hc/en-us/articles/360042890154-How-to-enable-sub-category)
- [How to set up a repeat schedule - Money Manager Help Center](https://help.realbyteapps.com/hc/en-us/articles/360046668993-How-to-set-up-a-repeat-schedule-installment)
- [Wallet by BudgetBakers](https://budgetbakers.com/en/products/wallet/)
- [Wallet - Google Play](https://play.google.com/store/apps/details?id=com.droid4you.application.wallet&hl=en_US)
- [BudgetBakers Bank Sync](https://budgetbakers.com/en/products/wallet/features/bank-sync/)
- [BudgetBakers Budgets](https://budgetbakers.com/en/products/wallet/features/budgets/)
- [Money Lover](https://moneylover.me/)
- [Money Lover - Google Play](https://play.google.com/store/apps/details?id=com.bookmark.money&hl=en)
- [Money Lover - App Store](https://apps.apple.com/us/app/money-lover-money-manager/id486312413)
- [Monefy](https://www.monefy.com/)
- [Monefy - App Store](https://apps.apple.com/us/app/monefy-money-tracker/id1212024409)
- [Monefy - Google Play](https://play.google.com/store/apps/details?id=com.monefy.app.lite&hl=en_US)
- [Monefy Product Review (incubatingwallet.com)](https://incubatingwallet.com/the-checkbook-app-monefy-product-review/)
- [Best Expense Tracker Apps 2026 - CNBC](https://www.cnbc.com/select/best-expense-tracker-apps/)
- [Best Personal Expense Tracker Apps 2026 - NerdWallet](https://www.nerdwallet.com/finance/learn/best-expense-tracker-apps)
- [Best Expense Tracker Apps 2026 - Expensify](https://use.expensify.com/blog/personal-expense-tracker-apps)
- [Realbyte Money Manager Review - CHOICE](https://www.choice.com.au/products/money/financial-planning-and-investing/creating-a-budget/realbyte-money-manager)
- [Money Manager - BridgingApps](https://search.bridgingapps.org/apps/money-manager-expense-budget)
- [Expensify Receipt Scanning](https://use.expensify.com/receipt-scanning-app)
