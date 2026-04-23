# Bakaya Design Consistency Plan — Mobile as Anchor, Web to Match

> **Goal:** bring the Next.js web app into visual/UX parity with the Expo/React Native mobile app.
> **Source of truth:** `mobile/src/constants/theme.ts`. Web tokens are the *output* side — the web must be corrected to match mobile values exactly.
> **Scope:** tokens + CSS module swaps + component-pattern fixes. No framework migrations, no new shared packages, no mobile changes.

---

## 1. Token Extraction — Mobile (`mobile/src/constants/theme.ts`)

Extracted directly from `E:\shevait-projects\bakaya-app\mobile\src\constants\theme.ts` (lines 1-151). These are the canonical values.

### 1.1 Colors

| Token | Value | Path | Notes |
|---|---|---|---|
| `primary` | `#D81B60` | `Colors.primary` | Core magenta used on headers, CTAs, active state |
| `primaryDark` | `#AD1457` | `Colors.primaryDark` | (Pressed states — not widely used) |
| `primaryLight` | `#F48FB1` | `Colors.primaryLight` | Chip borders, tints |
| `gradientStart` | `#D81B60` | `Colors.gradientStart` | Gradient CTAs start |
| `gradientEnd` | `#E91E63` | `Colors.gradientEnd` | Gradient CTAs end |
| `splashBackground` | `#D81B60` | `Colors.splashBackground` | Splash/brand bg |
| `white` | `#FFFFFF` | `Colors.white` | |
| `black` | `#000000` | `Colors.black` | |
| `grey` | `#6B7280` | `Colors.grey` | Mid grey; also text-secondary |
| `lightGrey` | `#F3F4F6` | `Colors.lightGrey` | Backgrounds, dividers |
| `darkGrey` | `#374151` | `Colors.darkGrey` | Dark text on light surfaces |
| `stoneGrey` | `#E5E5E5` | `Colors.stoneGrey` | **Note: mobile is `#E5E5E5`, web uses `#E5E7EB`** |
| `blue` | `#3B82F6` | `Colors.blue` | Info/accent |
| `blueLight` | `#60A5FA` | `Colors.blueLight` | |
| `success` | `#10B981` | `Colors.success` | Income, positive balance |
| `warning` | `#F59E0B` | `Colors.warning` | Pending, neutral alerts |
| `error` | `#EF4444` | `Colors.error` | Destructive, negative balance |
| `cardBackground` | `#FFFFFF` | `Colors.cardBackground` | |
| `cardBackgroundElevated` | `#FFFFFF` | `Colors.cardBackgroundElevated` | |
| `surface` | `#FAFAFA` | `Colors.surface` | **Mobile surface = `#FAFAFA`** — web uses `#F9F9FF` + `#F5F5F5` inconsistently |
| `glassBackground` | `rgba(255, 255, 255, 0.25)` | `Colors.glassBackground` | |
| `glassBorder` | `rgba(255, 255, 255, 0.18)` | `Colors.glassBorder` | |
| `textPrimary` | `#111827` | `Colors.textPrimary` | **Mobile is `#111827`** — web uses `#1A1A2E` in many places |
| `textSecondary` | `#6B7280` | `Colors.textSecondary` | |
| `textTertiary` | `#9CA3AF` | `Colors.textTertiary` | |
| `textOnPrimary` | `#FFFFFF` | `Colors.textOnPrimary` | |

### 1.2 Typography

| Token | Value | Path | Notes |
|---|---|---|---|
| `fontFamily` | `System` | `Typography.fontFamily` | No custom font on mobile |
| `fontFamilyBold` | `System` | `Typography.fontFamilyBold` | |
| `fontSize.xs` | `11` | | |
| `fontSize.small` | `13` | | |
| `fontSize.medium` | `15` | | |
| `fontSize.large` | `17` | | |
| `fontSize.xlarge` | `20` | | |
| `fontSize.xxlarge` | `24` | | |
| `fontSize.title` | `28` | | |
| `fontSize.display` | `32` | | |
| `fontWeight.regular` | `'400'` | | |
| `fontWeight.medium` | `'500'` | | |
| `fontWeight.semibold` | `'600'` | | |
| `fontWeight.bold` | `'700'` | | **Mobile tops out at 700** — web uses `800` on many titles |
| `lineHeight.tight` | `1.2` | | |
| `lineHeight.normal` | `1.5` | | |
| `lineHeight.relaxed` | `1.75` | | |

### 1.3 Spacing

| Token | Value |
|---|---|
| `xs` | `4` |
| `sm` | `8` |
| `md` | `16` |
| `lg` | `24` |
| `xl` | `32` |
| `xxl` | `40` |
| `xxxl` | `48` |

### 1.4 Border Radius

| Token | Value |
|---|---|
| `xs` | `4` |
| `sm` | `8` |
| `md` | `12` |
| `lg` | `16` |
| `xl` | `20` |
| `xxl` | `24` |
| `round` | `9999` |

### 1.5 Shadows (RN-only, need CSS translation)

| Token | Mobile spec | Recommended CSS equivalent |
|---|---|---|
| `small` | offset(0,1), opacity 0.05, radius 2 | `0 1px 2px rgba(0,0,0,0.05)` |
| `medium` | offset(0,4), opacity 0.10, radius 8 | `0 4px 8px rgba(0,0,0,0.10)` |
| `large` | offset(0,8), opacity 0.12, radius 16 | `0 8px 16px rgba(0,0,0,0.12)` |
| `glass` | offset(0,8), opacity 0.15, radius 24 | `0 8px 24px rgba(0,0,0,0.15)` |

### 1.6 Splash / Brand

| Token | Value |
|---|---|
| `SplashScreen.duration` | `2000` ms |
| `SplashScreen.logoText` | `'Bakaya'` |

---

## 2. Web Token Audit — hardcoded values that should be tokens

Web already has a solid `:root` in `web/src/app/globals.css` (lines 25-130). The problem is that module CSS files **bypass** the variables and hardcode hex values. `grep` counts 325 hex-color occurrences across 15 module CSS files.

### 2.1 `web/src/app/globals.css` (:root) — mostly fine, small drifts

| Line | Web value | Mobile value | Drift |
|---|---|---|---|
| 31 | `--color-primary: #E91E63` | mobile `primary = #D81B60` | **DRIFT** — web uses the gradient-END as primary; mobile uses gradient-START |
| 32 | `--color-primary-dark: #D81B60` | mobile `primaryDark = #AD1457` | **DRIFT** — web remaps dark to mobile's primary |
| 48 | `--color-stone-grey: #E5E7EB` | mobile `#E5E5E5` | minor drift |
| 49 | `--color-border: #E5E7EB` | mobile has no explicit `border` token; closest is `stoneGrey #E5E5E5` | minor |
| 61 | `--color-surface: #F9F9FF` | mobile `surface = #FAFAFA` | **DRIFT** — web has a purple-tinted surface |
| 62 | `--color-surface-container-low: #F0F3FF` | not in mobile | web-only token; used for input bg |
| 65 | `--color-input-bg: #F0F3FF` | no direct mobile equivalent; mobile inputs use `#FAFAFA`/`#F9FAFB` | **DRIFT** |
| 72 | `--color-text-primary: #1A1A2E` | mobile `textPrimary = #111827` | **DRIFT** — web uses a deeper indigo-black |
| 27-28 | `--font-headline` uses `Plus Jakarta Sans`; `--font-body` uses `Inter` | mobile is `System` | Acceptable per constraint; only align sizes/weights, not face |

### 2.2 Hardcoded values in module CSS files

Only the high-impact category offenders are enumerated — full list of pink `#D81B60` / near-`#D81B60` uses and header block geometry that should be tokenised.

#### `web/src/app/dashboard/layout.module.css`

| Line | Hardcoded | Should reference |
|---|---|---|
| 17 | `background: #F0F3FF` (sidebar bg) | `--color-surface-container-low` (already exists) — USE VARIABLE |
| 83 | `color: #6B7280` (nav link text) | `--color-text-secondary` |
| 91 | `color: #D81B60` (nav link hover) | `--color-primary-dark` |
| 102-103 | `color: #E91E63; box-shadow: inset 3px 0 0 #E91E63` | `--color-primary` |
| 174 | `color: #9CA3AF` (userEmail) | `--color-text-tertiary` |
| 189-200 | `#EF4444` (logoutBtn) | `--color-error` |
| 210 | `background: #F5F5F5` (main bg) | **MISMATCH** — mobile uses `surface #FAFAFA`. Needs a new or reused token. |
| 272 | `background: #ffffff` (bottomNav) | `--color-white` |
| 293, 329-330, 346 | `#9CA3AF`, `#E91E63` (bottomNav tab colors) | tertiary / primary tokens |

#### `web/src/app/dashboard/page.module.css`

| Line | Hardcoded | Should reference |
|---|---|---|
| 17, 56 | `background: #F5F5F5` | surface token (new/unified — see §3) |
| 29 | `background: #D81B60` (header) | `--color-primary-dark` |
| 46 | `color: #FFFFFF` | `--color-white` |
| 47 | `font-weight: 800` | **OVER-WEIGHT vs mobile (max 700)** — should be `var(--font-weight-bold)` = 700 |
| 48 | `font-size: 32px` | matches mobile `display`; use `var(--font-size-display)` |
| 67 | `border-radius: 16px` | `var(--radius-lg)` |
| 89, 93, 101, 107, 108, 114, 263, 285, 289, 390, 440, 441 | `#D81B60` | `--color-primary-dark` |
| 143 | `color: #10B981` | `--color-success` |
| 144 | `color: #EF4444` | `--color-error` |
| 147 | `color: #9CA3AF` | `--color-text-tertiary` |
| 205 | `color: #111827` | `--color-text-primary` — *note web var is `#1A1A2E` — fix the var first* |
| 311 | `padding: 16px 20px` | `var(--spacing-md) var(--spacing-md)` or tweak spacing |
| 329, 392 | `#F3F4F6` (divider) | `--color-light-grey` |
| 446 | `box-shadow: 0 4px 16px rgba(216, 27, 96, 0.4)` | shadow-lg-on-primary mixin |

#### `web/src/app/dashboard/groups/page.module.css`

| Line | Hardcoded | Should reference |
|---|---|---|
| 9, 60 | `#F5F5F5` | surface token |
| 21, 100 | `#D81B60` (header + emptyAction) | `--color-primary-dark` |
| 26, 35, 82, 172 | `#FFFFFF` `#111827` etc | white / text-primary tokens |
| 27 | `font-size: 32px; font-weight: 800` | display size + weight 700 (mobile max) |
| 62-63 | `border-top-left-radius: 24px` | `var(--radius-2xl)` |
| 87, 181, 206, 221 | `#9CA3AF` | tertiary |
| 102 | `border-radius: 16px` | `var(--radius-lg)` |
| 131, 135, 147 | `box-shadow: 0 2px 8px rgba(0,0,0,0.04)` | shadow-sm token |
| 156 | `background: #EEF2FF` (groupIcon bg) | **NOT IN MOBILE** — mobile uses primary-tinted avatar bg; needs decision |
| 204 | `background: #D81B60` (memberAvatar) | `--color-primary-dark` |

#### `web/src/app/dashboard/groups/[id]/page.module.css`

| Line | Hardcoded | Should reference |
|---|---|---|
| 8, 23, 69 | `#F5F5F5` | surface token |
| 22, 99, 134, 175, 180, 204 | `#D81B60` | `--color-primary-dark` |
| 21 | `padding: 28px 32px 56px` (header) | tokenised: `var(--spacing-lg) var(--spacing-xl)` |
| 49 | `font-size: 22px; font-weight: 700` | `var(--font-size-xl)` — OK |
| 108-109 | `border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04)` | radius-lg + shadow-sm |
| 117 | `padding: 10px 18px` (pillBtn) — **non-standard** | compare with global `.btn-primary` which is 48px × 28px padding; these diverge |
| 370-377 | `#FCE4EC`/`#D81B60` role badge, `#F3F4F6`/`#6B7280` | `primary-light-tint`/`primary-dark`; `light-grey`/`text-secondary` |
| 425, 457 | `#16A34A` (progress positive) | **DRIFT** — mobile uses `Colors.success = #10B981`. Web uses darker Tailwind `green-600` |
| 432, 462 | `#EF4444` (progress negative) | `--color-error` |
| 498-500 | input `background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px` | **DRIFT** — web's other inputs use `#F0F3FF` + `border-radius: 12px`. Mobile uses a light surface ~#FAFAFA + radius 12. |
| 552-557 | expenseCategory pill `background: #FCE4EC; color: #D81B60` | primary-tinted chip token |
| 572-591 | dialog: `rgba(0,0,0,0.45)`, `border-radius: 16px`, `padding: 24px` | tokenise overlay / dialog |
| 578 | `z-index: 200` | tokenise `--z-overlay` |

#### `web/src/app/dashboard/expenses/page.module.css`

| Line | Hardcoded | Should reference |
|---|---|---|
| 37, 109 | `#F5F5F5` | surface token |
| 48 | `#D81B60` (header) | `--color-primary-dark` |
| 78-79 | `font-size: 32px; font-weight: 800` | display / bold(700) — **WEIGHT DRIFT** |
| 146-158 | summary card border-colors hardcoded rgba | tokenise tint colors (`--tint-success`, `--tint-primary`, `--tint-teal`) |
| 157 | `#14b8a6` | **UNDEFINED** — not in mobile. Introduce `--color-teal` or reuse blue |
| 189 | `color: #E53935` | **DRIFT** — mobile uses `#EF4444`; close but different red |
| 269 | `background: #F0F0F0` (search input) | should be `--color-input-bg` (`#F0F3FF`) for parity with other inputs |
| 535 | `color: #EF4444` | `--color-error` |

#### `web/src/app/dashboard/expenses/new/page.module.css`

| Line | Hardcoded | Should reference |
|---|---|---|
| 29, 123 | `#F5F5F5` | surface token |
| 35 | `background: #059669` (income page bg) | `--color-success-dark` — **not defined** |
| 44 | `#D81B60` (header) | `--color-primary-dark` |
| 53 | `font-size: 32px; font-weight: 800` | weight drift |
| 73 | `background: #F0F3FF` (type toggle) | `--color-input-bg` (exists) |
| 157 | `color: #1A1A2E` (label) | Fix via root var (should be mobile `#111827`) |
| 166 | `background: #F0F3FF` (input) | `--color-input-bg` |
| 178 | `border-color: rgba(216, 27, 96, 0.25)` (focus) | tokenise `--focus-ring` |
| 257 | `background: #FFFFFF` | `--color-white` |
| 289 | hover tint `#F0F3FF` | `--color-input-bg` |

#### `web/src/app/dashboard/analytics/page.module.css`

| Line | Hardcoded | Should reference |
|---|---|---|
| 17, 57 | `#F5F5F5` | surface token |
| 29 | `#D81B60` | `--color-primary-dark` |
| 41-42 | `font-size: 32px; font-weight: 800` | weight drift |
| 88-91 | chip border `#E5E7EB`, text `#374151` | `--color-border` / `--color-dark-grey` |
| 126-128 | card radius 16 + shadow | token |
| 189 | `color: #E53935` | mobile uses `#EF4444`; consistency mismatch (see expenses) |
| 202, 277 | `color: #1A1A2E` | should match mobile `#111827` via root var |

#### `web/src/app/dashboard/categories/page.module.css`

| Line | Hardcoded | Should reference |
|---|---|---|
| 3, 51 | `#F5F5F5` | surface token |
| 11 | `#D81B60` (header) | `--color-primary-dark` |
| 21-22 | `font-size: 32px; font-weight: 800` | weight drift |
| 62, 87 | `#9CA3AF`, `#F0F3FF` | tertiary / input-bg |
| 95 | `border-radius: 16px; border: 1px solid rgba(0,0,0,0.06)` | radius-lg + card-border |
| 130 | `color: #1A1A2E` | fix via root var |
| 141-142, 150-151 | badge backgrounds `rgba(233,30,99,0.1)` / `rgba(107,114,128,0.1)` | tint tokens |

#### `web/src/app/dashboard/invitations/page.module.css`

| Line | Hardcoded | Should reference |
|---|---|---|
| 8, 40 | `#F5F5F5` | surface token |
| 18 | `#D81B60` | `--color-primary-dark` |
| 24-25 | `font-size: 32px; font-weight: 800` | weight drift |
| 47-48 | `#f0fdf4; color: #15803d` (success banner) | tint-success / success-dark tokens |
| 57-58 | `#fef2f2; color: #b91c1c` (error banner) | tint-error / error-dark |

#### `web/src/app/dashboard/profiles/page.module.css`

| Line | Hardcoded | Should reference |
|---|---|---|
| 8, 35 | `#F5F5F5` | surface token |
| 16 | `#D81B60` | `--color-primary-dark` |
| 26-27 | `font-size: 32px; font-weight: 800` | weight drift |
| 58, 62 | `#1A1A2E`, `#9CA3AF` | fix via root var / tertiary |

#### `web/src/app/login/page.module.css` & `register/page.module.css`

| Line | Hardcoded | Should reference |
|---|---|---|
| login:11 / register:11 | `background: #F9F9FF` | drift from mobile surface `#FAFAFA`; decide on unified auth bg token |
| login:18 / register:18 | `border-radius: 16px` | `var(--radius-lg)` |
| login:37, register:37 | `color: #D81B60` | `--color-primary-dark` |
| login:48 / register:48 | `linear-gradient(135deg, #D81B60, #E91E63)` | gradient tokens |
| login:59, register:59 | `color: #1A1A2E` | fix via root var |
| login:100 / register:100 | `background: #F0F3FF` | `--color-input-bg` |
| login:113, register:113 | `box-shadow: 0 0 0 2px rgba(233, 30, 99, 0.4)` | focus ring token |
| login:221, register:221 | `color: #E91E63` (footerLink) | `--color-primary` |

---

## 3. Gap Analysis — unified table

| Token | Mobile value | Web value (current) | Status | Recommended unified value |
|---|---|---|---|---|
| primary | `#D81B60` | `--color-primary = #E91E63` | **DRIFT** | `#D81B60` (rename web's current `primary-dark` → `primary`) |
| primary-light (gradient end) | `#E91E63` (`gradientEnd`) | `--color-primary-dark = #D81B60` (roles swapped) | **DRIFT** | Web `primary-dark` should become `#AD1457` to match mobile |
| primary-tint-subtle | tint at 8%/6% opacity | rgba(216,27,96,0.06–0.08) used ad-hoc | missing token | add `--color-primary-tint: rgba(216,27,96,0.08)` |
| surface | `#FAFAFA` | `#F9F9FF` (+ pages use `#F5F5F5`) | **DRIFT ×2** | `#FAFAFA` everywhere; or introduce `--color-surface-alt: #F5F5F5` if needed |
| text-primary | `#111827` | `#1A1A2E` | **DRIFT** | `#111827` |
| text-secondary | `#6B7280` | `#6B7280` | match | — |
| text-tertiary | `#9CA3AF` | `#9CA3AF` | match | — |
| stone-grey | `#E5E5E5` | `#E5E7EB` | minor drift | keep web (`#E5E7EB` — closer to design token world) OR flip to `#E5E5E5` |
| success | `#10B981` | `#10B981` + ad-hoc `#16A34A`, `#15803D` | **PARTIAL DRIFT** | `#10B981` everywhere; add `--color-success-dark: #059669` |
| error | `#EF4444` | `#EF4444` + ad-hoc `#E53935`, `#B91C1C`, `#DC2626` | **PARTIAL DRIFT** | `#EF4444` everywhere; add `--color-error-dark: #DC2626` |
| warning | `#F59E0B` | defined, used rarely | match | — |
| blue | `#3B82F6` | `#3B82F6` | match | — |
| splash | `#D81B60` | n/a on web | missing-on-web | — |
| font-size xs | 11 | `--font-size-xs: 0.6875rem` (11px) | match | — |
| font-size small | 13 | `--font-size-sm: 0.8125rem` (13px) | match | — |
| font-size medium | 15 | `--font-size-md: 0.9375rem` (15px) | match | — |
| font-size large | 17 | `--font-size-lg: 1.0625rem` (17px) | match | — |
| font-size xlarge | 20 | `--font-size-xl: 1.25rem` (20px) | match | — |
| font-size xxlarge | 24 | `--font-size-2xl: 1.5rem` (24px) | match | — |
| font-size title | 28 | `--font-size-title: 1.75rem` (28px) | match | — |
| font-size display | 32 | `--font-size-display: 2rem` (32px) | match | — |
| font-weight max | 700 | Used `800` on every page title | **DRIFT** | Cap at 700 |
| spacing xs/sm/md/lg/xl | 4/8/16/24/32 | 4/8/16/24/32 | match | — |
| spacing xxl/xxxl | 40/48 | `--spacing-2xl: 40; --spacing-3xl: 48` | match | — |
| radius xs→xxl | 4/8/12/16/20/24 | `--radius-xs`…`--radius-2xl` identical | match | — |
| shadow small | offset 1, radius 2 | `--shadow-sm: 0 2px 8px rgba(0,0,0,0.06)` | **DRIFT** | web is looser; align to mobile `0 1px 2px rgba(0,0,0,0.05)` OR keep web & treat mobile shadow as under-elevated |
| shadow medium | offset 4, radius 8 | `--shadow-md: 0 4px 16px rgba(0,0,0,0.08)` | drift | align to `0 4px 8px rgba(0,0,0,0.10)` |
| shadow large | offset 8, radius 16 | `--shadow-lg: 0 8px 24px rgba(0,0,0,0.12)` | drift | align to `0 8px 16px rgba(0,0,0,0.12)` |
| input bg | ~`#FAFAFA`/`#F9FAFB` per mobile | `#F0F3FF` (purple tinted) | **DRIFT** | Decide anchor; mobile uses a neutral light grey on inputs. Recommend `#F9FAFB` to match mobile. |
| card radius | 16 (`BorderRadius.lg`) | 16 (matches) | match | — |
| content-sheet top radius | 20 (`BorderRadius.xl`) on mobile | 24 on web (`border-top-left-radius: 24px`) | **DRIFT** | Use 20 (mobile) or 24 (web) consistently — recommend 24 to match user-facing screenshots |
| pink header bottom padding | `xl (32) + borderRadius.xl (20)` ≈ 52 | 60 (pages) / 56 (group detail) / 52 (mobile media query) | **MILD DRIFT** | align to 52–56 |
| header horizontal padding | md (16) on mobile | 32 on web desktop | expected (wider viewport); OK if mobile media-query matches 16–20 |

---

## 4. Component Parity Check

For each shared concept, current behavior on both platforms + the unified recommendation.

### 4.1 Pink Header Banner
| | Mobile | Web | Recommended |
|---|---|---|---|
| bg | `Theme.colors.primary` (`#D81B60`) | `#D81B60` (all pages match) | `var(--color-primary-dark)` (= `#D81B60`) |
| horizontal padding | `spacing.md` (16) | 32 desktop / 20 mobile | 32 desktop / 16–20 mobile (`spacing.md` / `spacing.lg`) |
| bottom padding (to allow sheet overlap) | `spacing.xl + borderRadius.xl` ≈ 52 | 56–60 | 52–56 (`spacing.xxl + spacing.md`) |
| title size | `fontSize.xxlarge` (24) | 32 | **FIX: use 28 (`title`) desktop, 24 (`xxlarge`) mobile** |
| title weight | 700 | 800 | 700 |
| title letter-spacing | −0.5px | −0.5px | match |
| back button | 40×40, rounded, `rgba(255,255,255,0.15)` bg | varies (group detail: transparent 36×36; expenses: 40×40 rgba bg) | **unify to 40×40, radius 12, bg `rgba(255,255,255,0.15)`, hover `rgba(255,255,255,0.25)`** |
| header "add" pill button | white bg, pink text, radius 999, 10×20 | matches (groups page) | keep |
| content-sheet overlap radius | `borderRadius.xl` (20) | 24 | align to 24 (matches screenshots) |
| content-sheet overlap distance | `-spacing.md` (-16) | `-28px` | align to −28 |

### 4.2 Card
| | Mobile | Web | Recommended |
|---|---|---|---|
| bg | `cardBackground` (`#FFFFFF`) | `#FFFFFF` | match |
| radius | `borderRadius.lg` (16) | 16 (most places) | 16 via `var(--radius-lg)` |
| padding | `spacing.md`–`spacing.lg` (16–24) | 16–24 varies | standardise: 24 for hero cards, 16 for list rows |
| shadow | `Shadows.small` (offset 1, radius 2) | `0 2px 8–12px rgba(0,0,0,0.04–0.06)` | define `--shadow-card: 0 2px 8px rgba(0,0,0,0.04)` |
| border | `1px solid rgba(0,0,0,0.05)` | `1px solid rgba(0,0,0,0.06)` | `1px solid rgba(0,0,0,0.05)` |

### 4.3 Primary Pill Button
| | Mobile | Web (`.btn-primary`) | Web (group detail `.pillBtn`) | Recommended |
|---|---|---|---|---|
| height | implicit via padding | 48 | 40 (10+18+text) | **48 everywhere** (larger-tap target; matches global) |
| padding | `spacing.sm` V × `spacing.md` H | 0 × 28 | 10 × 18 | 0 × 28 |
| radius | `borderRadius.round` (9999) | 9999 | 999 | 9999 |
| font-size | 15 | 15 | 14 | 15 |
| font-weight | 600 | 600 | 700 | 600 |
| bg | `Colors.primary` solid OR gradient | gradient 135°, `#D81B60→#E91E63` | solid `#D81B60` | gradient 135° (mobile HomeScreen also uses gradient) |
| shadow | `Shadows.small` | `0 4px 14px rgba(233,30,99,0.3)` | `0 6px 16px rgba(216,27,96,0.3)` on hover | `0 4px 14px rgba(216,27,96,0.3)` |
| disabled | 0.6 opacity | 0.6 opacity | 0.6 opacity | match |
| **ACTION** | — | — | — | Replace `.pillBtn` uses with `.btn-primary` + `.btn-sm` modifier where needed |

### 4.4 Secondary Button (outline)
| | Mobile | Web (`.btn-secondary`) | Web (group detail `.ghostBtn`) | Recommended |
|---|---|---|---|---|
| height | 36–44 (implicit) | 48 | 40 | 48 (match `.btn-secondary`) |
| border | `1.5px` of `stoneGrey` | `1.5px #E5E7EB` | `1px #E5E7EB` | `1.5px var(--color-stone-grey)` |
| text color | `textSecondary` / `darkGrey` | `#374151` | `#6B7280` | `var(--color-dark-grey)` |
| hover | subtle bg | `#FAFAFA` + shadow | `#F9FAFB` | `var(--color-surface)` |
| radius | round | 9999 | 999 | 9999 |

### 4.5 Input Field
| | Mobile (HomeScreen/AddExpense) | Web (`.input` in new expense) | Web (group detail `.textInput`) | Web (login) | Recommended |
|---|---|---|---|---|---|
| height | 48 | 48 | 44 | 48 | **48 everywhere** |
| padding | 16 | 0 × 16 | 0 × 14 | 0 × 16 | 0 × 16 (`spacing.md`) |
| bg | `#FAFAFA`/`#F9FAFB` | `#F0F3FF` | `#F9FAFB` | `#F0F3FF` | **DECISION NEEDED**: mobile anchor → `#F9FAFB`. Update web var `--color-input-bg` from `#F0F3FF` → `#F9FAFB`. |
| border | `1px solid #E5E7EB` idle | `1.5px transparent` idle | `1px #E5E7EB` idle | `2px transparent` idle | `1.5px var(--color-border)` idle |
| radius | 12 | 12 | 10 | 12 | 12 (`var(--radius-md)`) |
| placeholder color | `textTertiary` (`#9CA3AF`) | `#9CA3AF` | `#9CA3AF` | `#9CA3AF` | `var(--color-text-tertiary)` |
| focus ring | `borderColor: primary` + subtle shadow | `0 0 0 3px rgba(216,27,96,0.08)` + primary border | `0 0 0 3px rgba(216,27,96,0.12)` | `0 0 0 2px rgba(233,30,99,0.4)` | unify → `0 0 0 3px rgba(216,27,96,0.12)` + `1.5px var(--color-primary-dark)` |

### 4.6 Avatar Circle
| | Mobile | Web | Recommended |
|---|---|---|---|
| sm | 24 | 24 (memberAvatar) | 24 |
| md | 36 | 32–40 (varies) | 40 (mobile uses 36; web uses 40; align to 40) |
| lg | 48 (analytics iconCircle) | 48 | 48 |
| font-size inside | 40%–50% of diameter | varies | `size * 0.45` rounded |
| bg tint (initials) | primary-tinted `rgba(216,27,96,0.15)` | primary tint OR solid `#D81B60` OR `#EEF2FF` (drift) | **unify: `rgba(216,27,96,0.1)` fill, `var(--color-primary-dark)` text, white ring when stacked** |

### 4.7 Badge (role / count)
| | Mobile | Web | Recommended |
|---|---|---|---|
| admin bg | `rgba(216,27,96,0.15)` | `#FCE4EC` ≈ same | `rgba(216,27,96,0.10)` |
| admin text | `primary` | `#D81B60` | `var(--color-primary-dark)` |
| member bg | `rgba(107,114,128,0.15)` | `#F3F4F6` ≈ same | `var(--color-light-grey)` |
| member text | `grey` | `#6B7280` | `var(--color-text-secondary)` |
| radius | `round` (9999) | 999 | round |
| padding | 2 × 8 (xs × sm) | 4 × 12 | 4 × 12 (better hit area) |
| font-size | `xs` (11) | 12 | 12 |
| font-weight | 600 | 600 | 600 |

### 4.8 Empty State
| | Mobile | Web (groups list) | Web (group detail) | Recommended |
|---|---|---|---|---|
| icon size | 48–64 + tertiary color | 4rem (64) + 0.4 opacity | small inline svg | large emoji/icon 48px, opacity 0.4 |
| primary text | 15–17, semibold, `textSecondary` | 20px, 700, `#111827` | 15, 500, `#6B7280` | 20px / 700 / `var(--color-text-primary)` |
| secondary text | 13, regular, `textTertiary` | 15, 400, `#9CA3AF` | 13, 400, `#9CA3AF` | 15, 400, `var(--color-text-tertiary)` |
| CTA below | present only when actionable | pink pill `#D81B60` radius 16 | none | pink pill `.btn-primary` radius 9999 (match primary button) |

### 4.9 Bottom nav (mobile) vs Sidebar (web)
| | Mobile (bottom nav in web media query) | Web sidebar | Recommended |
|---|---|---|---|
| icon stroke | 1.8 (active 2.2) | 1.5 | match — keep per-platform but active color = `var(--color-primary)` on both |
| active indicator | 3px bar on top | 3px inset left box-shadow | OK — pattern differs but color must be `var(--color-primary)` (`#E91E63` currently; flip to `#D81B60` if we re-map primary token) |
| label font-size | 11 | 15 (sidebar) | keep — layout-specific |
| active color | `#E91E63` | `#E91E63` | align to unified primary token |

### 4.10 Skeletons / Loading shimmers
| | Mobile | Web (`Skeleton.module.css`) | Recommended |
|---|---|---|---|
| base | ? (not audited; RN uses `react-native-reanimated` or plain view) | gradient `#f0f0f0 → #e0e0e0 → #f0f0f0` | use `--color-light-grey` (`#F3F4F6`) base and `#E5E7EB` highlight to match token palette |
| animation duration | — | 1.5s | match |
| card radius | — | 16 | `var(--radius-lg)` — already matches |

### 4.11 Section Title
| | Mobile | Web | Recommended |
|---|---|---|---|
| size | `fontSize.large` (17) | 18–20 inconsistent | 18 (`1.125rem`) |
| weight | 700 | 700–800 | 700 |
| color | `textPrimary` (`#111827`) | `#111827` / `#1A1A2E` | `var(--color-text-primary)` |
| margin | `spacing.sm` bottom | 12 bottom | `var(--spacing-sm)` |
| letter-spacing | −0.3 | −0.3 | match |

### 4.12 Divider
| | Mobile | Web | Recommended |
|---|---|---|---|
| color | `rgba(0,0,0,0.05)` / `lightGrey` | `#F3F4F6` / `rgba(0,0,0,0.04)` mixed | `var(--color-light-grey)` (= `#F3F4F6`) |
| thickness | 1px | 1px | 1px |

### 4.13 Modal / Confirmation Dialog
| | Mobile (AlertModal) | Web (group detail `.dialog`) | Web (expenses `.dialog`) | Recommended |
|---|---|---|---|---|
| backdrop | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.45)` | `rgba(0,0,0,0.5)` + `blur(4px)` | `rgba(0,0,0,0.5)`; drop blur for parity |
| card radius | 16 | 16 | 16 | 16 |
| card padding | 24 | 24 | 32 | 24 |
| button row | column on small, inline on large | column on mobile, row on desktop | column always | column on <768px, row on ≥768px |
| title | 20/800 | 20/800 | 20/700 | 20/700 (mobile max weight) |

---

## 5. Execution Plan — ordered checklist (web side only)

Each step is small and self-contained. Numbered in recommended execution order.

### Phase A — fix the root variables first (single file impact)

1. **`web/src/app/globals.css` (lines 30–35):** swap the `primary` / `primary-dark` / `gradient-*` values so they align with mobile roles:
   - `--color-primary: #D81B60;` (was `#E91E63`)
   - `--color-primary-dark: #AD1457;` (was `#D81B60`)
   - `--color-primary-light: #F48FB1;` (unchanged)
   - `--color-gradient-start: #D81B60;` (unchanged)
   - `--color-gradient-end: #E91E63;` (unchanged)
2. **`web/src/app/globals.css` line 61:** change `--color-surface: #F9F9FF` → `#FAFAFA` (mobile anchor).
3. **`web/src/app/globals.css` line 65:** change `--color-input-bg: #F0F3FF` → `#F9FAFB` (neutral, matches mobile inputs).
4. **`web/src/app/globals.css` line 72:** change `--color-text-primary: #1A1A2E` → `#111827` (mobile anchor).
5. **`web/src/app/globals.css`** — add missing tokens under an "Extended tokens" block:
   ```
   --color-primary-tint: rgba(216, 27, 96, 0.08);
   --color-primary-tint-strong: rgba(216, 27, 96, 0.15);
   --color-success-dark: #059669;
   --color-error-dark: #DC2626;
   --color-surface-alt: #F5F5F5;  /* the grey used on dashboard pages */
   --focus-ring: 0 0 0 3px rgba(216, 27, 96, 0.12);
   --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.04);
   --z-overlay: 200;
   ```
6. **`web/src/app/globals.css` lines 117–120 (shadows):** optionally tighten shadow scale to match mobile (`--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)`, `--shadow-md: 0 4px 8px rgba(0,0,0,0.10)`, `--shadow-lg: 0 8px 16px rgba(0,0,0,0.12)`).
7. **`web/src/app/globals.css` (`.btn-*` classes):** after step 1, the gradient direction `linear-gradient(135deg, #D81B60, #E91E63)` hardcoded on lines 329, 492 becomes `linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end))`. Replace the hardcoded literals in `.btn-primary`, `.btn-fab`. Same for `rgba(233,30,99,…)` shadow tints (lines 333, 340, 344, 496, 507) — replace with `var(--color-primary-tint-strong)` or explicit `rgba(216,27,96,…)`.
8. **`web/src/app/globals.css` `.btn-back` line 582:** align width/height/radius with `.btn-icon` spec: 40×40, radius 12 (matches mobile back-button token).

### Phase B — per-page token substitutions (each bullet = one file)

9. **`web/src/app/dashboard/layout.module.css`:**
   - Line 17 → `background: var(--color-surface-container-low)`
   - Line 210 → `background: var(--color-surface-alt)`
   - Lines 91, 102, 103, 108, 329, 330, 346 → `var(--color-primary)` (now `#D81B60`)
   - Lines 83, 174 → `var(--color-text-secondary)` / `var(--color-text-tertiary)`
   - Lines 189, 198, 200 → `var(--color-error)`
   - Line 272 → `var(--color-white)`

10. **`web/src/app/dashboard/page.module.css`:**
    - Replace every `#D81B60` (lines 29, 89, 93, 101, 107, 108, 114, 212, 262, 263, 285, 289, 390, 440, 441, 448, 458) with `var(--color-primary)`.
    - Line 17, 56 → `var(--color-surface-alt)`
    - Line 47 → change `font-weight: 800` to `var(--font-weight-bold)` (700)
    - Line 48 → `font-size: var(--font-size-display)`
    - Line 67, 302, 421 → `border-radius: var(--radius-lg)`
    - Line 143 → `var(--color-success)`; line 144 → `var(--color-error)`
    - Line 147, 174, 181, 187, 205, 209, 212, 329, 392 → tokenise text/greys

11. **`web/src/app/dashboard/groups/page.module.css`:**
    - Line 9, 60 → `var(--color-surface-alt)`
    - Lines 21, 100, 107, 112, 204 → `var(--color-primary)`
    - Line 27 → font-weight 700; font-size `var(--font-size-display)`; mobile media-query (line 239) → `var(--font-size-2xl)` (24)
    - Lines 62–63 → `var(--radius-2xl)`
    - Lines 102, 156 → `var(--radius-lg)`
    - Line 156 → remove arbitrary `#EEF2FF` groupIcon bg; use `var(--color-primary-tint)` + `var(--color-primary)` text
    - Lines 131, 147 → `var(--shadow-card)`

12. **`web/src/app/dashboard/groups/[id]/page.module.css`:**
    - Lines 8, 23, 69 → `var(--color-surface-alt)`
    - Lines 22, 99, 118, 134, 175, 180, 371, 553 → `var(--color-primary)`
    - Line 35, 108 → `var(--radius-lg)`
    - Lines 117–128 (`.pillBtn`) — **REMOVE** and have the TSX use the global `.btn-primary.btn-sm` class (already defined in globals). Same for `.ghostBtn` → `.btn-secondary.btn-sm`, `.dangerBtn` → `.btn-danger`. Saves ~60 lines.
    - Lines 370 (`.roleBadgeAdmin`) → `background: var(--color-primary-tint); color: var(--color-primary-dark);`
    - Lines 374 → `background: var(--color-light-grey); color: var(--color-text-secondary);`
    - Lines 425, 457 → `color: var(--color-success); background: var(--color-success);` (drop `#16A34A`)
    - Lines 492–513 (`.textInput`) → match `.input` pattern: 48px tall, `var(--color-input-bg)`, radius 12, focus ring token
    - Line 578 → `z-index: var(--z-overlay)`

13. **`web/src/app/dashboard/expenses/page.module.css`:**
    - Lines 37, 109, 391 → `var(--color-surface-alt)`
    - Line 48 → `var(--color-primary)`
    - Lines 78, 79 → font-weight 700
    - Line 157 → define `--color-teal: #14B8A6` in globals OR map summary-balance card to existing `--color-tertiary` (`#3B82F6`). Decide on visual: mobile home uses success-green for positive balance.
    - Line 189 → `color: var(--color-error)` (drop `#E53935`)
    - Line 269 → `background: var(--color-input-bg)`
    - Line 535 → `var(--color-error)`

14. **`web/src/app/dashboard/expenses/new/page.module.css`:**
    - Lines 29, 123 → `var(--color-surface-alt)`
    - Line 35 → `background: var(--color-success-dark)`
    - Line 44 → `var(--color-primary)`
    - Lines 53–54 → font-weight 700; size `var(--font-size-display)`; mobile var → xxlarge 24
    - Lines 73, 166, 212 → `var(--color-input-bg)`
    - Line 157 → `var(--color-text-primary)` (once root fixed, `#111827`)
    - Lines 178–179 → `box-shadow: var(--focus-ring)`
    - Line 257 → `var(--color-white)`

15. **`web/src/app/dashboard/analytics/page.module.css`:**
    - Lines 17, 57 → `var(--color-surface-alt)`
    - Line 29 → `var(--color-primary)`
    - Lines 41–42 → font-weight 700; size `var(--font-size-display)`
    - Lines 88, 91, 107 → tokens (border, text-dark-grey, primary)
    - Line 189 → `var(--color-error)`
    - Lines 202, 277 → `var(--color-text-primary)`

16. **`web/src/app/dashboard/categories/page.module.css`:**
    - Lines 3, 51 → `var(--color-surface-alt)`
    - Line 11 → `var(--color-primary)`
    - Lines 21–22 → font-weight 700; size `var(--font-size-display)`; mobile media → 24
    - Line 62, 87 → tokens
    - Line 130 → `var(--color-text-primary)`
    - Lines 141, 150 → `var(--color-primary-tint)` / `rgba(107,114,128,0.1)` → `var(--color-light-grey)`

17. **`web/src/app/dashboard/invitations/page.module.css`:**
    - Lines 8, 40 → `var(--color-surface-alt)`
    - Line 18 → `var(--color-primary)`
    - Lines 24–25 → font-weight 700 + display size
    - Lines 47–48 → add `--color-success-tint: #F0FDF4` and `--color-success-dark: #15803D` tokens (or reuse)
    - Lines 57–58 → similar error-tint tokens

18. **`web/src/app/dashboard/profiles/page.module.css`:**
    - Lines 8, 35 → `var(--color-surface-alt)`
    - Line 16 → `var(--color-primary)`
    - Lines 26–27 → font-weight 700 + display size
    - Lines 58, 62 → tokens
    - Line 69 → replace hardcoded gradient with `linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end))`

19. **`web/src/app/dashboard/groups/new/page.module.css`:**
    - Line 6, 39 → `var(--color-surface-alt)`
    - Line 21 → `var(--color-primary)`
    - Lines 25–26 → font-weight 700 + display size
    - Line 79 → `var(--color-input-bg)`
    - Line 93 → `box-shadow: var(--focus-ring)`

20. **`web/src/app/dashboard/groups/[id]/expenses/new/page.module.css`** (not fully read above but same pattern): apply same substitutions as `expenses/new/page.module.css`.

21. **`web/src/app/login/page.module.css`:**
    - Line 11 → `background: var(--color-surface)` (once var = `#FAFAFA`)
    - Line 18, 37, 48 → tokens; logo gradient uses tokens
    - Line 59, 99 → `var(--color-text-primary)` / `var(--color-input-bg)`
    - Line 113 → `box-shadow: var(--focus-ring)` (tweak opacity to 0.4 variant if needed)
    - Line 221 → `var(--color-primary)`

22. **`web/src/app/register/page.module.css`:** same changes as login (identical structure).

23. **`web/src/app/page.module.css` (landing):** scan for the same hex replacements; focus on `#D81B60`, `#E91E63`, `#1A1A2E`, `#F9F9FF` references.

24. **`web/src/components/BalanceCard.module.css`:** already heavily tokenised (good). Only change: line 11 `border-radius: 12px` → `var(--radius-lg)` (16) to match mobile card pattern.

25. **`web/src/components/Skeleton.module.css`:**
    - Line 2 → `background: linear-gradient(90deg, var(--color-light-grey) 25%, var(--color-stone-grey) 50%, var(--color-light-grey) 75%);`
    - Line 18 → `border-radius: var(--radius-lg)`

26. **`web/src/components/DateRangePicker.module.css`:** read + apply same treatment (not audited in depth; same hex list applies).

### Phase C — component-pattern fixes (TSX edits to switch to global classes)

27. In `web/src/app/dashboard/groups/[id]/page.tsx`: replace `styles.pillBtn` usages with `btn-primary btn-sm` classes; `styles.ghostBtn` → `btn-secondary btn-sm`; `styles.dangerBtn` → `btn-danger`. Delete the now-unused local styles (step 12 covers the CSS side).

28. In `web/src/app/dashboard/page.tsx`: verify the FAB uses the global `.btn-fab` class instead of the local `.fab` in page.module.css — if not, migrate.

29. **Header back button unification:** all pages currently define their own back button CSS (`backBtn`, `backButton`). Migrate every back button in header to use `.btn-back` from globals. Files affected: `dashboard/groups/[id]/page.tsx`, `dashboard/expenses/page.tsx`, `dashboard/categories/page.tsx`, `dashboard/expenses/new/page.tsx`, `dashboard/invitations/page.tsx`.

30. **Pink-header "add" pill button:** standardise on the global `.btn-header` class (lines 549–573 in globals). Files with inline `newButton` CSS: `dashboard/groups/page.module.css` (lines 30–54). Migrate the TSX to use the global class and delete the local style.

31. **Empty-state unification:** create a single empty-state class pattern in `globals.css` (`.empty-state`, `.empty-state__icon`, `.empty-state__title`, `.empty-state__subtitle`, `.empty-state__action`) with specs from §4.8. Then swap per-page definitions in `groups/page.module.css`, `groups/[id]/page.module.css`, `invitations/page.module.css`, `profiles/page.module.css`.

32. **Role badge unification:** add `.badge`, `.badge--admin`, `.badge--member` to globals using tokens from §4.7; remove local role-badge styles from `groups/[id]/page.module.css`.

### Phase D — Accessibility parity

33. Add `aria-label` to every icon-only button (back buttons, action icon buttons `.btn-icon`, settlement delete, category delete). Files: each page.tsx with an icon-only button.

34. Add a visible focus ring to `.btn-icon`, `.btn-back`, `.btn-header`, `.pillBtn` equivalents. In globals.css, extend existing `.focus-ring` utility to be applied to any button-like element or add a `:focus-visible` block for each `.btn-*` class using `var(--focus-ring)`.

35. Ensure sidebar nav items have `aria-current="page"` on the active link (layout.tsx).

36. Color-contrast audit: `var(--color-text-tertiary)` (`#9CA3AF`) on `var(--color-surface)` (`#FAFAFA`) has contrast ratio ~3.1:1 — falls short of WCAG AA for body text. Flag for product; suggest `var(--color-text-secondary)` (`#6B7280`, ratio ~5.3:1) for any body copy that currently uses tertiary.

### Phase E — verification

37. After all swaps, re-run `grep -r "#D81B60\|#E91E63\|#F5F5F5\|#F0F3FF\|#1A1A2E" web/src` — target count should be zero in module CSS files (only allowed in `globals.css :root`).
38. Visual diff: compare mobile screenshots against web screenshots for login, dashboard home, groups list, group detail, expenses list, add expense, analytics, categories, profiles, invitations. Screenshot pairs should be pixel-close on header, cards, pills, inputs, avatars.

---

## 6. What NOT to Touch

- **No design-system refactor.** Do not introduce Tailwind, CSS-in-JS, styled-components, or a shared npm package. CSS custom properties + CSS modules stay.
- **No mobile changes.** `mobile/src/constants/theme.ts` is the anchor — we do NOT edit mobile values.
- **No custom font loading changes.** Web already loads Inter + Plus Jakarta Sans; mobile uses `System`. Keep per-platform font faces. Only align sizes and weights.
- **No sidebar → bottom-nav re-architecture.** Mobile uses bottom nav; web uses sidebar + bottom nav on small viewports. That structural split is fine — only active-state colors and icon stroke weights need to match.
- **No animation library swaps.** Keep CSS keyframes.
- **No new TSX components** unless Phase C step 31/32 require a shared `EmptyState` / `Badge` — and even then, use a local component, not a package.
- **No Tailwind utility classes.** All styling stays in CSS modules / globals.css.
- **No dark-mode work** — not in scope.

---

## Appendix: File index referenced

- `E:\shevait-projects\bakaya-app\mobile\src\constants\theme.ts` (1-151)
- `E:\shevait-projects\bakaya-app\web\src\app\globals.css` (1-597)
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\layout.module.css` (1-356)
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\page.module.css` (1-483)
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\groups\page.module.css` (1-251)
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\groups\[id]\page.module.css` (1-719)
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\groups\new\page.module.css`
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\expenses\page.module.css` (1-749)
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\expenses\new\page.module.css` (1-446)
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\analytics\page.module.css` (1-300)
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\categories\page.module.css` (1-200)
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\invitations\page.module.css` (1-100)
- `E:\shevait-projects\bakaya-app\web\src\app\dashboard\profiles\page.module.css` (1-80)
- `E:\shevait-projects\bakaya-app\web\src\app\login\page.module.css` (1-260)
- `E:\shevait-projects\bakaya-app\web\src\app\register\page.module.css`
- `E:\shevait-projects\bakaya-app\web\src\app\page.module.css`
- `E:\shevait-projects\bakaya-app\web\src\components\BalanceCard.module.css`
- `E:\shevait-projects\bakaya-app\web\src\components\Skeleton.module.css`
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Group\GroupDetailScreen.tsx` (styles block 1234–1790+)
- `E:\shevait-projects\bakaya-app\mobile\src\screens\Home\HomeScreen.tsx` (styles block 697+)
