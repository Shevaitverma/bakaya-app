# Splitify vs Bakaya — Product Strategy & Competitive Intelligence Report

**Prepared for:** the founder of Bakaya
**Date:** 6 August 2026
**Subject:** Competitive analysis of "Splitify" (Findat Private Limited), the expense-splitting category, and a prioritised V2 roadmap for Bakaya

---

## How to read this report

### Evidence grading

Every claim in this report carries one of these tags. Where a section is dense with them, the tag is applied per row or per claim.

| Tag | Meaning |
|---|---|
| **[F] FACT** | Directly observed on a cited primary source — an app-store listing, a vendor-controlled file, a regulator page, a company statement. Reproducible by following the link. |
| **[E] ESTIMATE** | A third-party estimator (AppBrain, Similarweb, AppstoreSpy, Growjo, Tracxn, market-research firms). Directionally useful, not audited. |
| **[I] INFERENCE** | Analyst reasoning from observed evidence. Not observed. The reasoning is always shown so you can disagree with it. |
| **[A] ASSUMPTION** | Plausible but unevidenced. Flagged so it never gets quoted as fact. |

### What could not be obtained

Stated up front, because a report that hides its gaps is worse than one that has them.

- **Nobody on this team installed Splitify.** All UX and UI analysis derives from store screenshots, marketing copy, privacy policy, vendor-controlled config files, and three public Play reviews. Ratings of unobserved screens are explicitly marked low-confidence.
- **Splitify has essentially no public review corpus** — ~48 ratings across both stores, zero Reddit/Product Hunt/YouTube/X/press footprint. This is itself a finding, not a research failure.
- **Trustpilot blocked automated access (HTTP 403).** The widely-cited "Splitwise 1.8★" figure is second-hand and unverified; do not use it externally.
- **No direct Reddit access.** Reddit signal is second-hand via search indexes and should be weighted below the App Store and Splitwise's vote-counted feedback forum.
- **No audited market-size figure exists for this category.** Competing research firms publish materially different numbers behind paywalls.

### On imagery

No copyrighted product imagery is reproduced. Splitify's UI is described in words, with links to the public store listings where the screenshots can be viewed. Section 5 describes eight iOS screenshots, eight Android screenshots and one iPad screenshot that were downloaded and visually inspected.

---

## Corrections to the brief you gave me

Six findings contradict the premises of the research request. They are listed first because several of them change what you should do.

| # | Your premise | What the evidence shows | Consequence |
|---|---|---|---|
| 1 | Splitify is an established app worth benchmarking against | It is **pre-traction**: ~18 iOS ratings (India), ~4 (US), ~30 Android, ~2,438 Android installs [F] | Study its *strategy*, not its *position*. Your real benchmark is Splitwise, and in India, **Splitkaro** |
| 2 | — (not in your brief) | **Splitkaro** — ~340K downloads, 8.1K Android + 3.4K iOS ratings, free, UPI, delivery-app receipt auto-fetch — is the actual India incumbent [E] | Any India plan that omits Splitkaro is incomplete. It has ~520× Splitify's rating volume |
| 3 | Splitify has funding worth researching | **No public evidence of any funding, press, LinkedIn presence, Product Hunt launch, or named founders** for Findat Private Limited [F] | A Tracxn profile claiming a funded Bengaluru company is a **different entity** — see §2.4 |
| 4 | Your app does 10 things | The code does roughly **2× that** — profiles, categories, 5 analytics endpoints, invitations, push, CSV export, Google auth, refresh-token rotation, admin roles [F] | The gap analysis is grounded in the code, not your summary. Several "gaps" are already shipped |
| 5 | Splitify's ₹999/yr undercuts Splitwise by ~44% | **Splitwise is regionally priced in India** — its Indian App Store IAPs are ₹49/₹99/₹149/₹999/₹1,199 [F] | Splitify's price advantage is ~50% in the **US** and approximately **zero in India**. See §15.1 |
| 6 | Splitify's bank sync is a moat you'd need to match | It is **two channels**: Plaid (US banks) plus **raw SMS and email ingestion** (India) [F] | You cannot and should not match either. See §16 and §22 |

### Contradictions between my own researchers, and how I resolved them

Six analysts worked in parallel and disagreed on six points. Resolution shown, because you should be able to audit it.

| Disputed point | Resolution | Why |
|---|---|---|
| Is `com.akhash.splitify` Splitify's Android app or a namesake? | **It is Splitify's Android app** | Play publishes it under "Findat Pvt. Ltd." with `hello@getsplitify.com`; getsplitify.com's own Play button links to it; it shares Apple Team ID `S2VSF826K9` with `com.findat.splitify` [F]. My initial three-app framing was wrong |
| Is bank sync Plaid, or email/SMS parsing? | **Both** | The vendor's own `.well-known/apple-app-site-association` declares a `/plaid/*` path, and a screenshot shows a live "Wells Fargo" connection [F]. The privacy policy *also* admits ingesting "bank alert SMS messages and emails", and the Android app holds `READ_SMS` [F]. Plaid serves US banks; SMS/email serves India |
| Splitwise India price: ₹2,499/yr or ₹999–1,199? | **₹999–₹1,199** | The ₹2,499 figure comes from a competitor's blog whose business model is ranking for "Splitwise is expensive" queries. Apple's own India storefront is primary evidence and contradicts it [F] |
| Does Splitify have an Android app at all? | **Yes, and it launched first** | Android released **23 Jul 2025**, iOS **5 Jan 2026** — Android led by ~5.5 months [F]. The "brand-new app" framing is half wrong |
| Does Splitify carry RBI Account Aggregator compliance cost? | **No — and that is worse, not better** | No AA, Setu, Finbox, Perfios or Salt Edge appears anywhere [F]. It ingests Indian bank data via SMS scraping, *outside* the regulated framework. That is a regulatory exposure, not a compliance investment |
| Age rating 12+ or 13+? | **12+ on both stores** | Apple's lookup API returns `contentAdvisoryRating: 12+`; Play returns "Rated for 12+" [F]. Splitify's own privacy policy says the service is not for under-13s — a small compliance inconsistency |

---

# SECTION 1 — Executive Summary

## 1.1 What Splitify is

Splitify is an India-built, all-in-one personal-finance and bill-splitting app operated by **Findat Private Limited**, a company registered in Tiruchirappalli, Tamil Nadu [F]. It ships on Android (`com.akhash.splitify`, since 23 Jul 2025) and iOS (`com.findat.splitify`, since 5 Jan 2026) [F].

Its proposition is stated in its own subtitle: *"One app. All your finances."* It bundles six product categories that competitors ship separately:

1. **Group expense splitting** — equal, exact, percentage, item-wise, and shares
2. **Personal expense tracking** — a separate non-shared ledger
3. **Bank and card sync** — via Plaid in the US, and via SMS/email alert scraping in India
4. **Budgets** — monthly overall and per-category, with spending pace
5. **Net worth tracking** — assets, liabilities, investments
6. **An AI finance assistant** — natural-language queries over your own ledger, plus an AI receipt scanner

Plus a deliberate switching wedge: **Import from Splitwise** [F].

## 1.2 Target audience

[I] Primarily **Indian urban millennials and Gen-Z with smartphones and bank accounts** — the flatmate, trip-group, and young-professional segment. Evidence: ₹-denominated pricing as the primary tier, an Indian registered entity, Chennai jurisdiction in the terms of service, and India-first store presence. A secondary international audience is served by USD pricing ($2.99/$7.99/$19.99), Plaid's US bank coverage, and the Wells Fargo connection shown in its own marketing screenshot.

The bundle implies a specific user: someone who wants one app for both *shared* and *personal* money, is willing to connect financial data, and is comfortable paying a subscription. [I] That is a narrower person than the category's typical user, who wants to settle a dinner bill and leave.

## 1.3 Core value proposition

**"Stop using four apps."** A splitter, a budgeting app, a subscription tracker and a net-worth tool, unified — with AI to do the data entry (receipt scanning) and the analysis (chat assistant).

## 1.4 Main problem it solves

Two, joined at the hip:

- **The shared problem:** who owes whom, after a trip, a flat, or a dinner.
- **The personal problem:** where did my money actually go this month — including my share of the shared spending.

[I] The second is the genuinely differentiated claim. Splitwise has never built personal tracking. Tricount *removed* it in June 2026. The observed AI response in Splitify's own screenshot demonstrates the payoff: *"I summed only your share of split expenses and your personal expenses, excluding settlements"* — a number no pure splitter can compute.

## 1.5 Why people choose it

Based on the only two substantive public reviews and the feature set [F, thin evidence]:

- **Free AI bill scanning**, where Splitwise caps receipt scanning behind Pro
- **No ads**, where Splitwise runs interstitials in the free tier
- **No visible daily expense cap**, where Splitwise limits free users to ~3–5 entries per day
- **Import from Splitwise**, which removes the switching cost of losing ledger history
- **Clean interface** — the one positive review's specific praise

## 1.6 Why it became popular

**It did not.** [F]

This is the single most important correction in the report. Splitify has ~48 total ratings across both app stores worldwide and ~2,438 Android installs. It has no Reddit discussion, no Product Hunt launch, no YouTube coverage, no press, and no discoverable social footprint. Every descriptive article about it traces back to its own store copy.

Its 4.8★ Android rating comes from 30 ratings distributed as 27×5★, 1×4★, 0×3★, 0×2★, 1×1★ [F]. [I] A naturally-distributed finance app at that volume normally shows some 3★/4★ mass. This distribution is consistent with early ratings from a warm, founder-adjacent cohort. **Do not treat 4.4★/4.8★ as product validation.** It is a number without a denominator.

## 1.7 Overall strengths

| # | Strength | Confidence |
|---|---|---|
| S1 | **The only app in the category combining splitting + personal tracking + bank sync + budgets + net worth + AI assistant.** Verified against 12 competitors. It is not merely competitive on this axis — it is alone | **High [F]** |
| S2 | **"Import from Splitwise" attacks the category's only real moat** — accumulated ledger history — and it is timed against peak Splitwise discontent | **High [F]** |
| S3 | **Release velocity.** 11 releases in 6 weeks. Splitwise ships monthly with ~53 staff. A one-to-three-person team can close feature gaps faster than incumbents respond | **High [F]** |
| S4 | **Ad-free with no published daily cap**, neutralising the two most-complained-about attributes of the incumbent | **Medium [A]** — free-tier limits are nowhere published |
| S5 | **Genuinely good craft in three places**: the natural-language split line, the Budgets screen, and the removable AI context chip. All three are worth studying | **High [F]** |
| S6 | **Architecturally sensible for its size** — Firebase Auth, Plaid where coverage exists, cryptographically verified Android App Links, scoped OAuth redirect paths | **High [F]** |

## 1.8 Overall weaknesses

| # | Weakness | Severity |
|---|---|---|
| W1 | **No brand, no traction, no earned media.** ~520× behind the nearest Indian competitor | **Critical [F]** |
| W2 | **The privacy posture is disqualifying for its own category.** A bank-sync app that declares data linked to identity used for **third-party advertising** and cross-app tracking; Play declares **Emails and SMS *shared* with third parties** for "Analytics, Personalisation" — flatly contradicting its own privacy policy | **Critical [F]** |
| W3 | **Its "End-to-End Encryption" claim is false as stated** — expense data is sent to Gemini and OpenAI for processing, and Play's security declaration claims only encryption *in transit* | **Critical [F]** |
| W4 | **Signup wall before any value**: name + email + verified phone. Publicly objected to in one of only three visible reviews; the developer defends rather than defers it | **High [F]** |
| W5 | **Settlement stops at "mark as paid"** — no UPI deep link, in an India-first app. The highest-intent moment is handed to GPay | **High [F]** |
| W6 | **iOS 18.0 minimum**, discarding an estimated 15–25% of the India iOS base for no API reason — in a product whose value requires the *whole group* to install | **High [F]** |
| W7 | **Zero DPDP Act and zero GDPR mention.** An India-registered, ₹-priced, Chennai-jurisdiction company whose privacy policy addresses only California law, with no grievance officer | **High [F]** |
| W8 | **114.8 MB** against Splid's 12.5 MB — ~9× for a utility, a measurable install-conversion tax on India's mid-tier Android base | **Medium–High [F]** |
| W9 | **Subscription pricing in a category that has repeatedly refused to subscribe**, at ~2.2× the local challenger (Splitkaro, ~₹450/yr) and near-parity with Splitwise India | **High [F]** |
| W10 | **Brand-name collision** with a US "Splitify, LLC" shipping a near-identical product concept (since renamed "Cove"), plus other `splitify` packages | **Medium–High [F]** |
| W11 | **Data-presentation defects shipped in App Store screenshots**: `₹624634.57` with no digit grouping in an India-first app; raw `Uber 063015 SF**POOL**`; a primary action button clipped off-screen with no scroll affordance | **Medium [F]** |

## 1.9 The one-paragraph verdict

[I] **Splitify has the right strategic read and the wrong sequencing.** Its diagnosis is correct: the core splitting product is a commodity — a free open-source clone, a 12.5 MB no-account app, and a bank-subsidised free app all deliver it at 4.8–4.9★, so nobody will pay for splitting, and the money must come from what surrounds it. But Splitwise took seven years to charge anything and twelve to gate the core action, monetising from a position of near-monopoly. Splitify has assembled a V3-scale feature stack and a V3-scale price on a V1-scale user base, and has spent its scarce trust budget on an ad-tracking SDK in a product that asks to read your bank SMS. The features are not wrong. The order is.

## 1.10 What this means for Bakaya — the five things that matter

Detailed throughout, summarised here:

1. **Do not chase bank sync.** It is closed to you (Account Aggregator FIU status requires a licence or a regulated partner) and the unlicensed alternative — SMS scraping — is both prohibited by Play policy for non-default-SMS-handlers and reputationally toxic. Turn the constraint into the pitch: you can answer "what did I actually spend" from your own two ledgers without ever touching a bank.
2. **You have a structural asset none of them have.** The `Profile` primitive — a private, per-user roster of *real people who are not app users* — is unique in this category. Every competitor's data model assumes the other party is an account. Yours does not.
3. **That asset is currently half-built.** `GroupExpense` has no `profileId`, so profile attribution dies the moment money enters a group — precisely the question the concept promises to answer. It is one foreign key and a `$unionWith` away from being the product's actual wedge.
4. **Four ship-blockers outrank every feature on this roadmap**, including a live authorisation hole, a production build that cannot boot, a missing Apple Sign-In that blocks App Store approval, and dead iOS push.
5. **Do not plan on Indian subscription revenue.** At category-median conversion, 1,000 Indian installs yields roughly ₹14,000–21,000/year gross. The viable configuration is India for users, the West for revenue — which has a schema consequence you should act on now, in §20.

---

# Splitify — Verified Product Fact Sheet

*Compiled by the UX/UI research stream and retained here because it is the most complete single view of what Splitify verifiably is.*

**Analyst note on method and evidence limits.** I could not install or run the app. Everything below is derived from: the iOS App Store listing (IN + US storefronts), the iTunes lookup API payload, the eight iOS phone screenshots and one iPad screenshot downloaded at full resolution and inspected visually, the eight Google Play phone screenshots (identical creative), the Play listing HTML including its three visible user reviews and the developer's replies, the marketing site `getsplitify.com` (HTML and CSS scraped for hex values and typography), and the privacy policy. Every claim is tagged **OBSERVED** (visible in artefacts I inspected), **INFERRED** (reasoned from observed evidence), or **ASSUMPTION** (plausible but unevidenced). Ratings that rest mostly on inference say so explicitly and should be read as low-confidence.

**There is essentially no public UX commentary on this app.** 18 iOS ratings, 29–30 Play reviews, 1K+ Play installs. Three Play review texts are publicly visible; the iOS review RSS feed returned zero entries. I have not invented reviews, usability studies, or benchmark numbers. Where I had no evidence, I say so.

---

### Two corrections to the brief

1. **`com.akhash.splitify` is NOT a namesake — it is this app's Android build.** The Play listing for `com.akhash.splitify` is published by **"Findat Pvt. Ltd."**, lists support email `hello@getsplitify.com`, links `getsplitify.com/privacy`, and carries byte-identical marketing creative to the iOS screenshots. `getsplitify.com`'s own "Get it on Google Play" button points at it. The package prefix is the founder's personal namespace — screenshot 4 shows the seeded demo user "Paid by **Akhash** A." The genuine namesakes to avoid remain Splitify LLC / `id6736849874` / Cove, `splitify.us`, `splitify.app`, and the Figma kit. **OBSERVED.**
2. **The iOS bundle ID is `com.findat.splitify`**, not `com.splitify.splitify`. **OBSERVED** (iTunes lookup API).

### Verified fact sheet

| Field | iOS | Android |
|---|---|---|
| Store ID / package | `id6756657540` / `com.findat.splitify` | `com.akhash.splitify` |
| Publisher | Findat Private Limited | Findat Pvt. Ltd. |
| Subtitle | "One app. All your finances." | same |
| Current version | 1.4.11, released 6 Aug 2026 | updated 6 Aug 2026 |
| First release | 5 Jan 2026 | — |
| Binary size | 114,756,608 bytes (114.8 MB) | not disclosed |
| Min OS | iOS/iPadOS 18.0 | not disclosed |
| Languages | English only | English only |
| Rating | 4.44 / 5 from 18 ratings (IN); 3.0 / 5 from 4 (US) | 4.8 / 5 from 29–30 reviews |
| Installs | not disclosed | 1K+ |
| Age rating | 12+ (store page also renders "13+" in the US layout) | Rated for 12+ |
| Pro pricing | ₹149 / mo · ₹399 / qtr · ₹999 / yr | $2.99 / $7.99 / $19.99 |
| Category | Finance | Finance |

**Third parties named in the privacy policy (OBSERVED):** Google Gemini *or* OpenAI (AI chat), Google Firebase (analytics + hosting), RevenueCat (subscriptions). No bank aggregator (Plaid, Setu, Finbox, Account Aggregator) is named anywhere.

**"Bank & Card Sync" is almost certainly email/SMS alert parsing, not true aggregation.** Three independent pieces of evidence converge: the privacy policy describes "linked communications" for "**bank alert SMS messages and emails**"; the marketing site's own mockup is captioned "**Email alerts connected**"; and the App Store privacy card declares collection of "**User content (emails, texts, photos/videos)**" linked to identity. The store screenshot showing "Bank Connection ✓ Wells Fargo / UNLINK" is therefore a US-flavoured skin over what is mechanically a Gmail read-scope grant. **INFERRED, high confidence.** This matters competitively: it is far cheaper to run than Plaid, works in India where aggregation is fragmented, but produces lower-fidelity, lag-prone, alert-shaped data.

> **EDITOR'S NOTE (cross-checked against other research streams):** **partially superseded — it is *both* channels.** A separate research stream fetched the vendor's own `.well-known/apple-app-site-association`, which declares a `/plaid/*` universal-link path for `S2VSF826K9.com.findat.splitify` [F] — that path exists specifically to catch Plaid Link's OAuth redirect. So Plaid **is** integrated, and the Wells Fargo tile is a real Plaid connection, not a skin. The SMS/email channel described above is **also** real (Android holds `READ_SMS`; the privacy policy admits ingesting bank-alert message content). **Resolution: Plaid serves US banks, SMS/email scraping serves India.** The competitive conclusion is unchanged and arguably sharper — Indian users get the low-fidelity scraped channel while the marketing shows the US one.

**Likely built in Flutter with Material 2 widgets, shipped unchanged to iOS. INFERRED, high confidence.** The signals: iOS screens use a Material back-arrow rather than the iOS chevron-plus-label; buttons carry ALL-CAPS labels (Material 2 `ElevatedButton` default, never an iOS convention); the Insights member picker is an outlined dropdown with a notched floating label (`OutlineInputBorder`); the iPad tab bar is a `BottomAppBar` with a docked circular FAB, a Material construct with no UIKit equivalent; and the Android and iOS screenshots are pixel-identical in layout, spacing, and type. This single choice explains a large share of the UX and UI findings below.

---


---

# SECTION 2 — Business Analysis

### 2.1 Legal entity and contact — now fully identified

| Field | Value | Source |
|---|---|---|
| Legal name (Play "About the developer") | **FINDAT PRIVATE LIMITED** | [Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN) |
| Registered address | No 19 Rani Meiyyammai Nag, Airport Post, Tiruchirappalli Airport, Tiruchirappalli, Tamil Nadu 620007, India | [Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN) |
| Developer phone | +91 63806 23524 | [Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN) |
| Developer email (corporate) | hello@getsplitify.com | [Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN) |
| Support email (public) | splitify.queries@gmail.com | [Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN), [contact.html](https://getsplitify.com/contact.html) |
| Governing law / venue | Laws of India; exclusive jurisdiction **courts of Chennai** | [terms.html](https://getsplitify.com/terms.html) |
| Apple seller name | Findat Private Limited | [iTunes lookup](https://itunes.apple.com/lookup?id=6756657540&country=in) |
| Apple artistId / Team ID | 1861789652 / `S2VSF826K9` | [iTunes lookup](https://itunes.apple.com/lookup?id=6756657540&country=in), [AASA](https://getsplitify.com/apple-app-site-association) |
| CIN / incorporation date / directors | **No public evidence found.** MCA/Tofler/Zaubacorp/TheCompanyCheck lookups for "FINDAT" returned nothing indexed | Searches returned no matching entity |

Tiruchirappalli (Tamil Nadu) registration is internally consistent with the Chennai jurisdiction clause in the ToS. **INFERENCE:** this is a Tier-2 Tamil Nadu operation, not a Bengaluru VC-backed startup — reinforcing that the Tracxn "Splitify LLP, Bengaluru, funded, ₹10–50 Cr revenue" profile describes a different company.

### 2.2 Platform footprint and traction

| Metric | iOS | Android |
|---|---|---|
| Store ID / package | id6756657540 (`com.findat.splitify`) | `com.akhash.splitify` |
| Initial release | **5 Jan 2026** | **23 Jul 2025** |
| Latest version | 1.4.11 (6 Aug 2026) | **1.13.2** (updated 6 Aug 2026) |
| Min OS | iOS/iPadOS 18.0 | **Android 8.0 (API 26)** |
| Size | 114,756,608 bytes (114.8 MB) | Not published on listing |
| Rating | 4.44 ★ | **4.81 ★** |
| Rating count | **18** | **30** (5★:27, 4★:1, 3★:0, 2★:0, 1★:1) |
| Written reviews | n/a | **14** |
| Installs | n/a | **1,000+** (raw internal counter in page payload: **2,438**) |
| IAP range | ₹149 / ₹399 / ₹999 | **"₹149.00 – ₹999.00 per item"** |
| Content rating | 12+ | Rated for 12+ ("Parental guidance recommended", "Users interact") |
| Category | Finance | Finance |
| Languages | English only | — |

Sources: [iTunes lookup](https://itunes.apple.com/lookup?id=6756657540&country=in); [Play listing](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN); [AppstoreSpy](https://appstorespy.com/android-google-play/com.akhash.splitify-trends-revenue-statistics-downloads-ratings) (independently reports ~1,000 installs, Findat Pvt. Ltd., released 23 Jul 2025).

**Observations:**

- **Android-first by ~5.5 months.** Android shipped Jul 2025; iOS Jan 2026. **INFERENCE:** the founder built Android first (cheapest path to Indian users), then added iOS once the product had shape.
- **Divergent version tracks (Android 1.13.2 vs iOS 1.4.11).** **INFERENCE:** either two separate codebases with independent numbering, or a shared codebase with per-store build numbering. Version *history* on Android visible via review metadata spans 1.3.4 → 1.4.2 → 1.4.3 → 1.11.3 → 1.11.10 → 1.12.10 → 1.12.13 → 1.13.2 ([Play review payload](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN)), i.e. Android was already at 1.4.x in 2025 while iOS reached 1.4.x only in mid-2026. Version numbers are therefore **not** comparable across platforms.
- **Total addressable evidence of traction: ~48 ratings and ~2.4k Android installs across both stores.** This is a pre-traction product regardless of what any database claims.
- **Rating distribution is suspicious.** 27 of 30 Android ratings are 5★, 1 is 1★, none in the middle, against only 14 written reviews. **INFERENCE (not proof):** consistent with early ratings sourced from friends/family or a rating prompt shown to a small, warm cohort; a naturally distributed 30-rating finance app usually has some 3★/4★ mass.

### 2.3 Monetisation

| Item | Detail | Source |
|---|---|---|
| Model | Free download + "Splitify Pro" auto-renewing subscription | [App Store](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540) |
| Tiers | Monthly ₹149 / $2.99 · Quarterly ₹399 / $7.99 · Yearly ₹999 / $19.99 | Lead-verified; Play range ₹149–₹999 corroborates ([Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN)) |
| Subscription infrastructure | **RevenueCat** (named as a processor) | [privacy.html](https://getsplitify.com/privacy.html) |
| What is gated by Pro | **NOT FOUND.** No paywall/feature-matrix page on the site, no "Pro" feature list in either store description | [getsplitify.com](https://getsplitify.com/) |
| Refund policy | **NOT FOUND** — ToS is silent on subscriptions and refunds | [terms.html](https://getsplitify.com/terms.html) |
| Ads shown in app | No evidence of in-app ad units; the "Third-Party Advertising" label refers to **outbound** attribution data sharing | [privacy.html](https://getsplitify.com/privacy.html) |

**INFERENCE:** Yearly ₹999 at a ~44% discount to monthly is a standard India consumer-subscription ladder. With ~2.4k Android installs and 18 iOS ratings, revenue is almost certainly negligible; any "₹10–50 Cr revenue" claim attached to the name Splitify belongs to a different entity.

### 2.4 Funding, press, team — the honest answer

| Question | Answer | Evidence |
|---|---|---|
| Funding raised by Findat Private Limited | **No public evidence found.** No Crunchbase, Entrackr, Inc42, YourStory, VCCircle, or Tracxn entry for *Findat* | Multiple searches, Aug 2026 |
| Press coverage | **No public evidence found** for the getsplitify.com product | Multiple searches |
| Product Hunt launch | **No public evidence found** | Search |
| LinkedIn company page | **No public evidence found** for Findat Private Limited | Search |
| Team size | **No public evidence found.** The company publishes no team page, no about page, no social links | [getsplitify.com](https://getsplitify.com/), [contact.html](https://getsplitify.com/contact.html) |
| Founder identity | **Not disclosed anywhere.** Circumstantial only: the Android package is `com.akhash.splitify` and an App Store screenshot uses "Akhash A." as the demo user paying an expense ([screenshot 4](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540)). **INFERENCE, not confirmation:** a founder/primary developer named Akhash. No LinkedIn or MCA record was located to confirm. |
| Tracxn "Splitify" profile | Describes a **different** company: Splitify LLP (AAI-8069, 2017, Bengaluru), founders Champaka Jaiprakash Vastrad & Siddhartha Agarwal, website **splitifyapp.com**, and it also bundles "Bhoruka Park Private Limited" (U40100KA2005PTC037407, 2005) into the same record | [Tracxn](https://tracxn.com/d/companies/splitify/__xrFxYSJcSGTyk7M1M6dGVEzHMUSPzRWH50pns9ALdt0) |

> **Recommended report language:** "Splitify is operated by Findat Private Limited, a Tiruchirappalli-registered company with no discoverable funding history, press coverage, LinkedIn presence, or named founders. Third-party databases returning a funded Bengaluru company under the name 'Splitify' describe a different entity."

### 2.5 Corporate hygiene signals

| Signal | Reading |
|---|---|
| Public support channel is a **gmail.com** address for an app that ingests bank transactions | Weak. A finance app normally exposes a domain-based support address; `hello@getsplitify.com` exists but is only shown in the Play developer block, not on the website ([contact.html](https://getsplitify.com/contact.html)) |
| ToS "Last Updated" 15 Jun 2026 vs Privacy "Last Updated" 3 Aug 2026 | Policies are actively maintained; privacy policy was refreshed 3 days before the current release |
| ToS omits subscription terms, refunds, and account deletion | Incomplete for a paid consumer subscription product ([terms.html](https://getsplitify.com/terms.html)) |
| No registered address or entity name on the website itself | Only discoverable via the Play developer disclosure ([Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN)) |
| Developer replies to Play reviews within days | Active, responsive operator — replies dated 23 May 2026 and 1 Aug 2026 ([Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN)) |

---

# SECTION 3 — Feature Breakdown

Legend: **[C]** = CONFIRMED (observed in store listing, screenshots, policy, or app config on the vendor's domain) · **[V]** = CLAIMED by vendor, unverified (marketing text only, no independent artefact) · **[NF]** = NOT FOUND / no evidence.

### Authentication

| Feature | Status | Evidence |
|---|---|---|
| Firebase Authentication as the auth layer | **[C]** | Firebase auth handler paths reserved on the domain (`NOT /__/auth/action/`, `NOT /__/auth/handler/`) and `authDomain: splitify-2bb8c.firebaseapp.com` — [AASA](https://getsplitify.com/apple-app-site-association), [__/firebase/init.json](https://getsplitify.com/__/firebase/init.json) |
| Email + password sign-in, with password reset by email | **[C]** | User review "I'm not receiving the reset password link in my email"; developer reply "check your spam folder for the reset email" — [Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN) |
| **Mandatory phone-number verification at signup** | **[C]** | Developer reply: "Splitify asks for phone verification so you can find friends, be added to the right groups… It also helps reduce duplicate or fake accounts" — [Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN) |
| Full name collected at signup | **[C]** | Same review thread ("Full name? Phone number with verification?"); privacy policy lists name, email, phone — [Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN), [privacy.html](https://getsplitify.com/privacy.html) |
| Google / Apple / social sign-in | **[NF]** | Not mentioned in any listing, policy, or screenshot |
| Biometric app lock (Face ID / fingerprint) | **[NF]** | No mention anywhere — notable omission for a finance app |
| 2FA / MFA on the account | **[NF]** | No mention |

### Onboarding

| Feature | Status | Evidence |
|---|---|---|
| Group-invite deep links (`/join/*`) with a web landing page and store fallback | **[C]** | [AASA](https://getsplitify.com/.well-known/apple-app-site-association) declares `/join/*` "for group invites"; live page at [getsplitify.com/join/](https://getsplitify.com/join/) titled "You've been invited to Splitify" with OG image `og-invite.jpg` and both store links |
| Android App Links verified for the same domain | **[C]** | [assetlinks.json](https://getsplitify.com/.well-known/assetlinks.json) with three signing-cert fingerprints for `com.akhash.splitify` |
| Contact-book import to find/invite friends | **[C]** | "Contact book data (with permission) for friend invitations" ([privacy.html](https://getsplitify.com/privacy.html)); Android `read your contacts` permission ([Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN)) |
| Guided onboarding tour / demo data | **[NF]** | No evidence |

*Three signing certificates in assetlinks.json is consistent with Play App Signing plus an upload key plus a debug/legacy key — **INFERENCE**, benign.*

### Expense Management

| Feature | Status | Evidence |
|---|---|---|
| Add expense: description + amount + payer + split method | **[C]** | Screenshot 4 "Add an expense" with DESCRIPTION, AMOUNT, "Paid by Akhash A. and split equally", SAVE — [App Store](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540) |
| Auto-categorisation with category icons | **[C]** | Screenshots show per-expense category icons and labels (Cab/Taxi, Flights, Personal transfers, Rent, Maintenance, Sports, Entertainment, Dining out) — screenshots 1, 2, 6, 8 |
| Expense list grouped by month | **[C]** | "January 2026" section headers in screenshots 1 and 2 |
| Attach receipt image to an expense | **[C]** | Policy references "any images you upload"; Play declares Photos collected/shared — [privacy.html](https://getsplitify.com/privacy.html), [Data safety](https://play.google.com/store/apps/datasafety?id=com.akhash.splitify&hl=en_IN) |
| Comments on expenses | **[C]** | Policy lists "comments" as user content; a group screen action button reads "COM…" (truncated, likely COMMENTS) — [privacy.html](https://getsplitify.com/privacy.html), screenshot 1 |
| Edit / delete expense | **[V]** | Standard, but never explicitly shown or stated |
| Recurring expense tracking (subscriptions, EMIs) | **[V]** | [Play description](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN), [getsplitify.com](https://getsplitify.com/) — no screenshot |

### Group Management

| Feature | Status | Evidence |
|---|---|---|
| Create groups; per-group expense ledger | **[C]** | Screenshot 1: group "Trip to Bali" with Balances + Expenses — [App Store](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540) |
| Add members to a group | **[C]** | "ADD MEMBERS" button, screenshot 1 |
| Per-group settings (gear icon) | **[C]** | Screenshot 1 header |
| Friends (1:1, non-group) expenses | **[C]** | Screenshot 4 "With friends"; "Groups & Friends" in description |
| Activity feed of expenses and settlements | **[V]** | Description only, both stores |
| Group roles / admin permissions | **[NF]** | No evidence |
| Simplify-debts algorithm (Splitwise-style netting) | **[NF]** | Never mentioned; balances shown are pairwise ("Anna H. owes you") |

### Splitting

| Method | Status | Evidence |
|---|---|---|
| Equally | **[C]** | "split equally" in Add-expense screenshot 4 |
| By exact amount | **[V]** | [Play description](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN) |
| By percentage | **[V]** | Play description |
| Item-wise (line items from a scanned bill) | **[C]** | Developer's own review reply: "the scanner lets everyone pay only for what they ordered… designed specifically for itemized bills (like restaurants)" — [Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN) |
| By shares/weights | **[V]** | Listed on the site as "shares" |
| Share-based splitting shipped in 1.3.10 (12 Jun 2026) | Lead-verified | iOS version history |

### Settlement

| Feature | Status | Evidence |
|---|---|---|
| "Settle Up" — record a payment, close a balance | **[C]** | "SETTLE UP" button, screenshot 1 |
| Real-time balances, per person, signed ("you lent"/"you owe") | **[C]** | Screenshot 1 |
| **In-app payment rails (UPI / payment links / collect requests)** | **[NF]** | No evidence at all. Settlement appears to be **record-keeping only** — a material competitive gap in the Indian market vs UPI-integrated rivals |
| Payment reminders / nudges | **[V]** | Site claims "smart notifications … unsettled balances" |

### Personal Finance

| Feature | Status | Evidence |
|---|---|---|
| Personal (non-shared) expense ledger, separate from group expenses | **[C]** | Screenshot 2 "Personal expenses" screen |
| Personal + shared expenses unified in analysis | **[C]** | AI reply text: "I summed only **your share** of split expenses and your personal expenses, excluding settlements" — screenshot 8 |
| Net worth tracking (assets, liabilities, investments) | **[V]** | [getsplitify.com](https://getsplitify.com/), Play description — no screenshot, no detail |
| Historical spending insights (shipped 1.3.7, 25 May 2026) | Lead-verified | iOS version history |

### Bank Sync

| Feature | Status | Evidence |
|---|---|---|
| **Plaid as the aggregator** | **[C]** | `/plaid/*` universal-link path declared for `S2VSF826K9.com.findat.splitify` — [.well-known/apple-app-site-association](https://getsplitify.com/.well-known/apple-app-site-association) |
| Live bank connection with named institution + UNLINK control | **[C]** | Screenshot 2: "Bank Connection ✓ Wells Fargo [UNLINK]" — [App Store](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540) |
| Auto-fetched transactions rendered as expenses | **[C]** | Screenshot 2 shows machine-style descriptors: "CREDIT CARD 3333 PAYME…", "Uber 063015 SF**POOL**", "United Airlines" |
| **SMS bank-alert ingestion** | **[C]** | Android `read your text messages (SMS or MMS)` permission ([Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN)); "we ingest the content and limited metadata … of bank alert SMS messages" ([privacy.html](https://getsplitify.com/privacy.html)) |
| **Email bank-alert ingestion** | **[C]** | Play Data safety declares "Emails" collected **and shared** ([Data safety](https://play.google.com/store/apps/datasafety?id=com.akhash.splitify&hl=en_IN)); [privacy.html](https://getsplitify.com/privacy.html) |
| India Account Aggregator / Setu / Finbox / Perfios / Salt Edge / Yodlee | **[NF]** | None named anywhere; **INFERENCE:** Indian users are served by the SMS/email channel, not by a licensed AA connection |
| User-controlled disconnection | **[C]** | UNLINK control visible, screenshot 2; claim also on [getsplitify.com](https://getsplitify.com/) |
| "No stored bank credentials" | **[V]** | [getsplitify.com](https://getsplitify.com/). Plausible for Plaid's token model (**INFERENCE**), but unverifiable, and irrelevant to the SMS/email path |

### Budgets

| Feature | Status | Evidence |
|---|---|---|
| Monthly overall budget with % used, amount remaining, days left | **[C]** | Screenshot 6: "$1922 of $2400 budget · 80% used · $478 remaining · ⚠ 7 days left this month" |
| Per-category budgets, addable ("+ Add") | **[C]** | Screenshot 6: Entertainment $1339/$1500, Dining out $566/$800, Sports $450/$1500 |
| Status badges (NEAR LIMIT / ON TRACK) + progress bars | **[C]** | Screenshot 6 |
| Month navigation (‹ December 2025 ›) | **[C]** | Screenshot 6 |
| Budget overspend alerts | **[V]** | Implied by badges; push alerting not evidenced |

### Reports / Analytics

| Feature | Status | Evidence |
|---|---|---|
| "Spending insights" screen with total spent + donut breakdown by category | **[C]** | Screenshot 5: "Total spent ₹624634.57", donut with "Rent 62.4%", "Tap a slice for details" |
| Date-range filters: month, year, All-time, **Custom** with from/to pickers | **[C]** | Screenshot 5 (Jan · Dec · 2026 · All-time · Custom + Jan 1 2025 – Dec 31 2025 + APPLY) |
| **Per-member filter** ("All members" dropdown) on insights | **[C]** | Screenshot 5 |
| Home tab with analytics (shipped 1.4.3, 23 Jul 2026) | Lead-verified | iOS version history |
| CSV/PDF report export | **[NF]** | No evidence |

### AI

| Feature | Status | Evidence |
|---|---|---|
| AI receipt scanner ("Scan Bill") launched from Add-expense | **[C]** | Screenshot 4 "📷 Scan Bill ›"; screenshot 3 shows a camera pointed at an itemised restaurant receipt |
| Receipt → line items → per-person allocation | **[C]** | Developer review reply, [Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN) |
| Bill scanning improvements shipped 1.3.11 (16 Jun 2026) | Lead-verified | iOS version history |
| "AI Chat" natural-language finance assistant | **[C]** | Screenshot 8: full chat UI, user turn "How can I reduce my spend?", multi-paragraph structured answer with month-by-month INR figures |
| **AI context chips** ("Add Context", removable "Home ⊗" chip) | **[C]** | Screenshot 8 bottom bar — indicates scoped/RAG-style context selection |
| AI is transparent about its calculation method | **[C]** | Screenshot 8: "I summed only your share of split expenses and your personal expenses, excluding settlements and amounts others owe you" |
| **LLM vendors: Google Gemini and OpenAI** | **[C]** | Named as processors; "process expense data for the AI chat assistant feature only when users engage that tool" — [privacy.html](https://getsplitify.com/privacy.html) |
| AI-output disclaimer (not financial advice; no liability for losses) | **[C]** | [terms.html](https://getsplitify.com/terms.html) §9 |
| AI-driven auto-categorisation | **[V]** | "Auto-Categorized Expenses – Smart categories" ([Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN)); mechanism (rules vs LLM) not disclosed |

### Notifications

| Feature | Status | Evidence |
|---|---|---|
| Push notifications (FCM) | **[C]** | `messagingSenderId: 469304074105` ([__/firebase/init.json](https://getsplitify.com/__/firebase/init.json)); Android "receive data from Internet" + "run at startup" + "prevent device from sleeping" permissions ([Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN)) |
| Smart alerts for upcoming bills / unsettled balances / recurring-cost increases | **[V]** | Vendor marketing copy |
| Notification preference controls | **[NF]** | No evidence |
| Email transactional notifications | **[C]** (partial) | Password-reset emails confirmed via review thread; Google Workspace MX on the domain (`aspmx.l.google.com`) — DNS MX query for getsplitify.com, 6 Aug 2026 |

### Search

| Feature | Status | Evidence |
|---|---|---|
| Search within a group's expenses | **[C]** | Magnifier icon on the group Expenses header — screenshot 1 |
| Search within personal expenses | **[C]** | Magnifier icon on the Personal expenses header — screenshot 2 |
| Global search across groups/friends | **[NF]** | No evidence |

### Offline & Sync

| Feature | Status | Evidence |
|---|---|---|
| Offline expense entry / offline-first cache | **[NF]** | No claim anywhere. **INFERENCE:** if Firestore SDKs are used, some offline persistence is likely on by default, but this is not a marketed capability |
| Real-time multi-user sync | **[V]** | "Real-Time Balances – Instantly see who owes whom" ([Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN)); Firestore backend would make this trivially true (**INFERENCE**) |
| Multi-device sync | **[V]** | Implied by a cloud account model; never stated |

### Security (feature-level; full analysis in S16)

| Feature | Status | Evidence |
|---|---|---|
| Encryption in transit | **[C]** | Play Data safety security practice — [Data safety](https://play.google.com/store/apps/datasafety?id=com.akhash.splitify&hl=en_IN) |
| Encryption at rest | **[V]** and **contested** | Claimed on [getsplitify.com](https://getsplitify.com/); **not** declared in Play's security practices |
| "End-to-End Encryption" | **[V]** and **implausible** | Claimed on the site; incompatible with server-side LLM processing of expense data ([privacy.html](https://getsplitify.com/privacy.html)) — see S16 |
| Data-deletion request path | **[C]** | Play "You can request that data be deleted"; policy: email splitify.queries@gmail.com, deletion within 60 days — [Data safety](https://play.google.com/store/apps/datasafety?id=com.akhash.splitify&hl=en_IN), [privacy.html](https://getsplitify.com/privacy.html) |
| In-app account deletion (self-serve) | **[NF]** | Only an email route is documented |
| App-level PIN / biometric lock | **[NF]** | No evidence |

### Settings & Profile

| Feature | Status | Evidence |
|---|---|---|
| Profile: name, email, phone, avatar | **[C]** | Collected per [privacy.html](https://getsplitify.com/privacy.html); avatars visible in screenshot 4 |
| Preferred display currency | **[C]** | "Always see balances in your preferred currency" — [Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN) |
| Group settings screen | **[C]** | Gear icon, screenshot 1 |
| Ad-tracking opt-out via device settings (ATT on iOS) | **[C]** | [privacy.html](https://getsplitify.com/privacy.html) |
| Dark mode | **[NF]** | All eight screenshots are light-mode only |
| Localisation / non-English languages | **[NF]** | English only on both stores ([iTunes lookup](https://itunes.apple.com/lookup?id=6756657540&country=in)) |

### Integrations, Import/Export

| Feature | Status | Evidence |
|---|---|---|
| **Import from Splitwise — two paths** | **[C]** | Screenshot 7: "Option 1: Import Directly — In Splitwise, export your group data; from the share menu, choose Splitify" (**iOS Share Extension**) and "Option 2: Upload a File — SELECT FILE" (**document picker**) |
| Plaid institution linking | **[C]** | See Bank Sync |
| Export your own data out of Splitify | **[NF]** | No export feature evidenced — asymmetric with the import feature; a lock-in signal |
| Calendar / Slack / WhatsApp / UPI app integrations | **[NF]** | None |

### Multi-currency

| Feature | Status | Evidence |
|---|---|---|
| Add expenses in any currency | **[V]** | Play/site description |
| Automatic FX conversion to a preferred display currency | **[V]** | Play/site description |
| FX rate source, rate-date handling, historical rates | **[NF]** | Not disclosed |
| Mixed-currency evidence in UI | **[C]** (weak) | Screenshots mix `$` (screens 1, 2, 6) and `₹` (screens 5, 8) — consistent with a currency-configurable UI |

### Platform coverage, Widgets, Shortcuts

| Feature | Status | Evidence |
|---|---|---|
| iPhone + iPad (universal) | **[C]** | `features: ["iosUniversal"]`, 1 iPad screenshot — [iTunes lookup](https://itunes.apple.com/lookup?id=6756657540&country=in) |
| Android phone | **[C]** | [Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN) — reviews section is filtered to "Phone" only, i.e. no tablet/other form-factor review cohorts |
| **Web app** | **[NF]** | getsplitify.com is a static marketing site on Firebase Hosting; no app subdomain resolves; `api.getsplitify.com` does not resolve (DNS A query, 6 Aug 2026) |
| Home-screen widgets | **[NF]** | No evidence |
| Siri Shortcuts / App Intents | **[NF]** | No evidence |
| Apple Watch / wearables | **[NF]** | No evidence |
| **Share Extension (iOS)** | **[C]** | Splitwise import "from the share menu, choose Splitify" — screenshot 7 |

**Only iPad artefact is a single `0x0ss.png` screenshot** ([iTunes lookup](https://itunes.apple.com/lookup?id=6756657540&country=in)). **INFERENCE:** iPad support is nominal (scaled iPhone layout), not a designed tablet experience.

---


---

# SECTION 4 — UX Analysis

### 4.1 What is actually visible

Nine distinct screens are observable across the store creative. I describe them; I reproduce no imagery. Public URLs: [iOS IN listing](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540) · [iOS US listing](https://apps.apple.com/us/app/splitify-expense-tracker/id6756657540) · [Play listing](https://play.google.com/store/apps/details?id=com.akhash.splitify) · [getsplitify.com](https://getsplitify.com/).

| # | Screen | Source | Status |
|---|---|---|---|
| 1 | Group detail ("Trip to Bali") | iOS shot 1, Play shot 1 | OBSERVED |
| 2 | Personal expenses + bank connection | iOS shot 2 | OBSERVED |
| 3 | Receipt scan — lifestyle photo of a paper receipt, **no app UI at all** | iOS shot 3 | OBSERVED |
| 4 | Add an expense | iOS shot 4, Play shot 4 | OBSERVED |
| 5 | Spending insights | iOS shot 5 | OBSERVED |
| 6 | Budgets | iOS shot 6 | OBSERVED |
| 7 | Import from Splitwise | iOS shot 7 | OBSERVED |
| 8 | AI Chat | iOS shot 8, Play shot 8 | OBSERVED |
| 9 | Group detail on iPad **with the tab bar visible** | iPad shot | OBSERVED |

The iPad screenshot is the single most valuable artefact in the set, because it is the only one showing global navigation. Everything else is a pushed detail screen with a back arrow.

### 4.2 Navigation model

**OBSERVED (iPad shot):** a bottom tab bar of four labelled tabs — **Friends · Groups · Activity · Account** — with a circular teal **"+" floating action button docked in the centre**, overlapping the bar and splitting it 2 + 2. The active tab (Groups) is teal with a filled icon; inactive tabs are grey. Icons sit above ~10px labels.

**INFERRED:** the tab bar now has a **fifth "Home" tab**, added in v1.4.3 on 23 Jul 2026 ("added a home tab to view analytics at a glance"). No screenshot anywhere shows it — the store creative predates it by two weeks and has not been refreshed through eleven subsequent releases. Five tabs plus a docked centre FAB is a crowded bar; either Home displaced a tab, or labels are now truncating. Unresolvable from public evidence.

**OBSERVED:** every content screen is a full-screen push with a back arrow, a left-aligned title, and at most one trailing action (a gear, or a text "SAVE"). No modal sheets, no bottom sheets, no segmented controls, no swipe-back affordance visible. Depth is achieved purely by stacking.

**OBSERVED — the horizontal action-chip row.** Both the group screen and the personal screen place a row of filled teal pill buttons directly under the balance card: `ADD MEMBERS · SETTLE UP · COM…` on the group screen, `INSIGHTS · AI CHAT · RECOM…` on the personal screen. **The third button is clipped by the screen edge in both cases**, with no fade, gradient, chevron, or page indicator to signal that the row scrolls. This is the clearest navigation defect in the set: primary actions are hidden behind an undiscoverable horizontal scroll. It appears identically on Android and on the 900px-wide iPad render is replaced by three fully-visible buttons — confirming the row is a scrolling `ListView`, not a wrapping layout.

### 4.3 Flow reconstruction

| Flow | Reconstruction | Status |
|---|---|---|
| **Navigation model** | Bottom tabs Friends / Groups / Activity / Account + centre "+" FAB; push-based detail stacks; Home tab added post-creative | Tabs and FAB **OBSERVED**; Home tab **INFERRED** |
| **Onboarding** | No onboarding screenshot exists. Given the twin propositions (splitting *and* personal finance) an intent/setup step is likely, but there is no evidence of a carousel, permissions primer, or value-prop sequence | **ASSUMPTION** |
| **Login / signup** | Collects **name, email address, and phone number**; **phone number requires verification**. The developer confirms this publicly: *"Splitify asks for phone verification so you can find friends, be added to the right groups… It also helps reduce duplicate or fake accounts."* Email/password exists — a user reports a broken **password-reset email**. Firebase is the backend, so Google/Apple social sign-in is likely available alongside | Name/email/phone + phone verification **OBSERVED** (policy + developer reply); email/password **OBSERVED** (reset-link complaint); social sign-in **INFERRED** |
| **Home screen** | v1.4.3 "analytics at a glance" tab; content unknown. Probable composition: net-worth or balance hero, spend-this-month figure, budget progress, recent activity | **INFERRED** from changelog text only |
| **Create group** | Not screenshotted. Group detail shows a title ("Trip to Bali", "Home") and a gear for settings, so creation minimally captures a name. Category/type selection is likely — the site says "Groups & Friends – organize by category". Members are added *after* creation via the `ADD MEMBERS` action, not during it | Post-hoc member addition **OBSERVED**; creation form **INFERRED** |
| **Add expense** | Fields observed top-to-bottom: `DESCRIPTION` (text + leading icon tile), `AMOUNT` (currency tile + numeric), then a natural-language config line **"Paid by *Akhash A.* and split *equally*"** with two teal inline-tappable tokens, then a `Scan Bill` pill, then a large illustration. Trailing "SAVE" in the header. Date and category fields are not visible in the viewport | **OBSERVED** (fields shown); date/category presence **INFERRED** |
| **Split configuration** | Tapping the "equally" token opens a split editor supporting equal / by amount / by percentage / item-wise / **by shares** (shares added in v1.3.10, 12 Jun 2026). No screenshot of the editor exists | Modes **OBSERVED** (description + changelog); the editor UI **INFERRED** |
| **Receipt scan** | `Scan Bill` pill on Add Expense → camera → AI extracts line items → per-item assignment to members. The store screenshot for this feature is a **stock photo of a paper receipt with no app UI**, which strongly suggests the real scan/assign screens were not considered demo-ready | Entry point **OBSERVED**; capture/review/assign screens **INFERRED** |
| **Settle up** | `SETTLE UP` pill on the group screen. Settlements are recorded, not transacted — the site says Splitify "can't move money in or out". Settlement rows render in the ledger as **full-width pale-green tinted rows with a check-circle icon**, e.g. "Anna H. paid you / Settlement / ₹30000.39" | Entry point and ledger rendering **OBSERVED** (iPad shot); the settle-up form **INFERRED** |
| **Bank linking** | "Connect your data" card → connect flow → returns a "Bank Connection ✓ *Institution*" row with an outlined `UNLINK` pill. Mechanically an email/SMS alert grant (see fact sheet) | Card and post-link state **OBSERVED**; the connect flow itself **INFERRED** |
| **Budget setup** | Budgets screen has a month stepper, a hero total-budget card, and a "Category Budgets" section with a pale-mint `+ Add` pill → presumably a category picker + amount entry | Screen **OBSERVED**; the add-budget form **INFERRED** |
| **AI assistant** | Reached via the `AI CHAT` pill on the personal screen. Chat transcript UI with a **removable context chip** (`🏠 Home ✕`) and an `Add Context` outlined pill at the bottom, scoping the model to a chosen group or dataset | **OBSERVED** |

### 4.4 UX ratings

| Dimension | /10 | Confidence | Reasoning |
|---|---|---|---|
| **Navigation** | 6 | Med (tabs observed, Home tab inferred) | The four-tab + centre-FAB skeleton is the correct, conventional shape for this category and needs no explanation: Groups and Friends are the two real object types, Activity is the feed, Account is settings, and the FAB is the one thing users do most. It is let down by two things. First, the clipped horizontal action row hides `COMPARE`-class and `RECURRING`-class actions behind a scroll with **zero visual affordance** — I can see the truncation in both the iOS and Android renders. Second, adding a Home tab in v1.4.3 to a bar that already carried four tabs and a docked FAB is a structural decision made under feature pressure, not from an information-architecture position; "analytics at a glance" overlaps Insights, which already exists one tap away on the personal screen. Depth is otherwise shallow and push-based, which is forgiving. |
| **User Flow** | 6.5 | Med | The core split loop — open → Groups → group → `+` → describe → amount → save — is short and legible, and the natural-language "Paid by X and split Y" line collapses what could be three screens into one tappable sentence. The problem is that Splitify is two products in one shell: a social splitter and a personal finance manager. Nothing in the observed navigation reconciles them. Personal expenses live behind a pushed screen; group expenses live in tabs; Insights exists in both worlds with different scopes; and the AI chat is reachable only from the personal screen even though its most compelling use ("who owes what on the Bali trip") is a group question. A user arriving for splitting has no path that surfaces the personal half, and vice versa. |
| **Onboarding** | 4 | Low — **rating rests on inference** | I have no onboarding screenshot, so this rates the *known constraints*, not the screens. Signup demands name **and** email **and** a **verified phone number** before any value is delivered. That is three identity fields plus an OTP round-trip for an app whose competitor (Splitwise) lets you sign in with Google and add a friend by email in under thirty seconds. One of only three public Play reviews is exactly this objection — *"Isn't you are requesting too much confidential information? Full name? Phone number with verification? Crazy!"* — and the developer's reply defends the design rather than softening it. Phone verification is defensible for contact-graph matching and anti-abuse, but gating it *before* first value, rather than deferring it to the moment a user first adds a friend, is a textbook activation error. The Splitwise import path is a genuinely strong onboarding asset that appears to sit *after* this wall rather than in front of it. |
| **Login Flow** | 4 | Low–Med | Email/password exists and its **recovery path is publicly reported broken** — a July 2026 reviewer received no reset link, and the developer's reply ("check your spam folder") treats a deliverability failure as user error rather than an owned defect. For a finance app holding balances between friends, a lockout is not a minor bug: the account is the only route to money owed. Firebase Auth almost certainly backs this, so Google and Apple sign-in are probably available and probably fine; the phone-verification step is the drag. No screenshot of the login screen exists, so this is a rating of the reported behaviour rather than the interface. |
| **Home Screen** | 6 | Low — **rating rests on inference** | Unseen. The changelog phrase "view analytics at a glance" and the presence of well-composed analytics elsewhere (the Budgets hero, the Insights donut) make it likely the Home tab is competent, since the components already exist and are the best-designed in the app. But the strategic read is unfavourable: shipping an analytics home *fifteen versions in* implies the app previously opened onto a list — probably Groups — and that the team is now solving "the app doesn't tell me anything when I open it" reactively. A splitting app's home screen should answer "who owes me and what do I do next"; an analytics home answers a different, less urgent question. |
| **Create Group Flow** | 5.5 | Low — **rating rests on inference** | Not screenshotted. What is observable is that members are added **after** creation, via an `ADD MEMBERS` pill on the group detail screen, and that pill is one of the three primary actions — so the empty group is a real, designed state rather than an accident. Splitting members out of creation is a defensible two-step, but it means the highest-drop-off moment (getting a second human into the app) happens on a screen the user has already "finished". No evidence of invite-by-link, QR, or contact-picker exists; if invitations require the invitee to complete the same name+email+**verified phone** signup before appearing, the group-formation funnel is the app's structural weak point. |
| **Add Expense Flow** | 7 | High — screen observed | The best-executed flow in the app. Labels are small grey caps above filled rounded fields; the leading icon tiles give each field a target and a glanceable identity; the amount field's boxed currency tile doubles as the multi-currency selector, which is elegant. The natural-language line **"Paid by *Akhash A.* and split *equally*"** is the single strongest interaction pattern in the product — it states the current configuration in plain English *and* is the control for changing it, so nothing is hidden behind a "more options" disclosure. `Scan Bill` is placed inline where the user has already committed to entering an expense, which is the right moment. Marks lost for: a trailing "SAVE" text button with no visible validation state or unsaved-changes guard; no date or category field in view; and a large off-brand stock illustration eating the lower half of the screen where a live split preview belongs. |
| **Split Flow** | 7 | Med — modes observed, editor inferred | Five modes — equal, exact amount, percentage, item-wise, and shares — is a complete competitive set, matching or exceeding Splitwise, and "by shares" arriving as a discrete v1.3.10 release suggests it was built for a real request (housemates on unequal rents) rather than for a feature grid. The inline "equally" token is the correct entry point: progressive disclosure with the default stated, not assumed. I cannot see the editor, so I cannot judge the hard part — whether remainders reconcile visibly (does 100/3 show 33.34/33.33/33.33 and prove it sums?), whether percentage mode blocks a save at 97%, or whether item-wise assignment supports multi-person items and shared tax/tip. Those details are where splitting apps are won and lost, and I have no evidence on any of them. |
| **Settlement Flow** | 6 | Med | Settlements are visibly first-class: the group screen gives `SETTLE UP` a permanent primary pill next to `ADD MEMBERS`, and the ledger renders settlement events as full-width pale-green tinted rows with a check-circle icon — a distinct visual class from expenses, which is exactly right, since a settlement is a state change, not a cost. What is missing is money movement. The app records that a payment happened; it cannot make it happen. In India, where UPI intent links are a two-line integration and where the entire category has trained users to expect a "Pay ₹1,082 via UPI" button, ending the flow at "mark as paid" leaves the highest-value moment on the table and hands it to WhatsApp and GPay. The green-tinted settlement row is good craft in service of an incomplete flow. |
| **Performance** | 5.5 | Low — **rating rests on inference** | See S17. Briefly: 114.8 MB is heavy for a finance app with no media library, implying a Flutter engine plus bundled fonts, illustrations, Firebase SDKs, and scan/vision dependencies; a cold start on a mid-tier Android device is plausibly 2–4 s. Receipt scanning and AI chat are both server round-trips over an LLM, which are seconds-scale by nature and cannot be optimised away, only *presented* well — and I see no evidence they are. Eleven releases in six weeks, every one labelled "Bug fixes & improvements", reads as either high defect churn or fast iteration; without crash data I cannot separate them, but the changelog hygiene is poor either way. |
| **Animations** | 4.5 | Low — **rating rests on inference** | Static screenshots carry no motion information, so this rates *opportunity taken*, judged by whether the surfaces that reward animation look built for it. The docked FAB implies a Material transition; Flutter's default page pushes are competent. But the Budgets ring, the Insights donut, and the category progress bars are all quantities that should count up or sweep in, and the AI chat is the one surface where token streaming is nearly mandatory to make a multi-second wait tolerable. None of that is provable from stills. I am rating below average because nothing in the artefact set — no motion-suggestive framing in the store creative, no animated preview video on either store, no motion on the marketing site — indicates motion design was a priority. |
| **Accessibility** | 3.5 | Low–Med | The App Store accessibility card states outright: **"Developer has not indicated supported accessibility features"** — OBSERVED, and for a 2026 finance app that is a meaningful signal, since the field is cheap to populate. What I can check visually is mixed-to-poor. Amount values in the ledger encode meaning in **colour alone**: green "you lent" versus red "you owe" are distinguished by hue and by a 12px micro-label at the very edge of legibility. The Insights donut relies entirely on hue to separate seven categories with no patterning and no adjacent legend. The Budgets screen is the honourable exception — it encodes status four ways at once (bar colour, bar length, a worded badge, and a percentage). English-only, with no dynamic-type evidence and a Flutter stack that does not inherit iOS text scaling for free. |
| **Dark Mode** | 3 | **Very low — ASSUMPTION, effectively unverified** | I found no dark-mode evidence of any kind: all eight iOS screenshots, all eight Android screenshots, the iPad screenshot, and the entire marketing site are light-only. That is not proof of absence — teams routinely shoot store creative in light mode — but a team that had invested in a dark theme would normally show at least one dark frame, because it markets well. Combined with a Flutter stack (where dark mode is opt-in work per widget, not free) and a hard-coded-looking palette of near-white card surfaces on pale-grey backgrounds, I judge dark mode more likely absent or partial than complete. **Treat this score as a flag to verify, not a finding.** |
| **Micro-interactions** | 4 | Low — **rating rests on inference** | Two genuinely good ones are visible as static state. The **removable AI context chip** (`🏠 Home ✕`) makes the model's scope tangible and reversible in one tap — that is a real micro-interaction pattern, not decoration. The **"Tap a slice for details"** caption under the donut is an explicit invitation, though a caption is a weaker device than making the chart look tappable. Beyond those, the surfaces that should reward touch — balance rows, settlement rows, the budget hero — show no affordance cues (no chevrons, no press states inferable). Haptics, pull-to-refresh, and swipe actions on expense rows are all unevidenced. |
| **Empty States** | 5 | Med | One empty state is clearly observable and it is instructive: the **Add Expense screen carries a large stock line-art illustration** (a phone, a banknote, an orange credit card) filling the lower half where a split preview would go. Someone recognised the emptiness and filled it — but with a generic asset in a blue/orange/green palette that clashes with the teal system, rather than with useful content. The Import-from-Splitwise screen leaves a large void below the fold with no filler at all. So: empty space is acknowledged inconsistently, and when it is addressed, it is addressed decoratively rather than functionally. First-run empty states (no groups, no friends, no expenses) are unobserved. |
| **Loading States** | 3.5 | Low — **rating rests on inference** | No skeleton, spinner, shimmer, or progress state appears anywhere in seventeen screenshots. That is weak evidence — nobody screenshots a loading state — but the app has at least four unavoidable multi-second waits: receipt OCR/LLM extraction, AI chat generation, bank-alert sync, and Splitwise import parsing. The AI Chat screenshot shows a fully-rendered ~300-word response with no streaming indicator, no partial text, and no stop control, which is the presentation you get when a response is awaited whole and then dropped in. If that is the real behaviour, users face a blank grey bubble for several seconds on the app's headline AI feature. I rate low because the *risk surface* is large and there is no counter-evidence. |
| **Error Handling** | 3.5 | Med — one confirmed failure | The one error path with public evidence **failed**: a user reported the password-reset email never arriving, and the developer's reply redirected to the spam folder rather than acknowledging a deliverability problem. That is a single data point, but it is on the most safety-critical path in the product. Structurally, the app has an unusual number of failure modes for its size — LLM extraction that returns garbage on a crumpled receipt, email-alert parsing that mis-reads a merchant string, currency conversion that needs a live rate, Splitwise import files that are malformed, and OTP delivery that fails in exactly the way already reported. And there is direct evidence of unhandled data quality reaching the UI: the personal ledger renders raw, untidied bank descriptors — `CREDIT CARD 3333 PAYME…` truncated mid-word and `Uber 063015 SF**POOL**` complete with asterisks — in the *marketing screenshots*, meaning nobody cleaned them even for the store. |
| | | | |
| **OVERALL UX SCORE** | **5.3 / 10** | | A competent, fast-moving, feature-dense v1 with one genuinely excellent interaction (the natural-language split line), one excellent screen (Budgets), and a sound navigation skeleton — undermined by an activation wall at signup, a settlement flow that stops short of payment, no visible investment in the states between screens (loading, error, empty, motion), and a strategic identity split between two products sharing a shell. It is roughly where a capable four-person team lands after nine months of shipping features and no dedicated design review. |

---

# SECTION 5 — UI Analysis

### 5.1 Visual system, described

**Colour. OBSERVED.** The primary is a deep teal — `#0E867E` on the marketing site, and the in-app buttons, active tab, links, and icon accents read the same. Supporting brand values scraped from the site CSS: `#689E88` (muted sage, the most-used value on the site), `#388468` (deeper green), `#ADC7D8` (dusty blue), `#F5F0EE` (warm off-white), `#9C7561` (clay). In-app semantics are conventional and consistent: green `#16A34A`-class for credit/"you lent"/on-track, red for debit/"you owe", amber `#D97706`/`#FBBF24` for warning states, orange for the over-budget hero. Card surfaces are pure white on a very light neutral-grey page (`#F7F7F8`-class); the app chrome is white.

Three colour problems are visible. **First**, the Insights "Total spent" figure is rendered in a **bright blue** that exists nowhere else in the system — not the teal primary, not a semantic colour — apparently only to match the dominant donut slice. **Second**, the donut uses a generic categorical palette (blue, purple, teal, orange, dark orange, green, grey) that shares no relationship with the pastel category tints used on every expense row in the app, so "Rent" is blue in the chart and lavender in the list. **Third and most consequential**, the red/green semantic **inverts between contexts**: on the group screen red means *you owe someone*, on the personal screen red means *you paid* (money out) and green means *you received*. Same component, same colours, opposite referents.

**Typography. OBSERVED / INFERRED.** The marketing site declares `Inter` with a system fallback stack. The app uses a neutral grotesque that is visually consistent with Inter or Roboto (INFERRED — I cannot read font metadata from a JPEG). The in-app scale is disciplined and small: roughly 20px semibold for screen titles, 17–18px bold for amounts, 16px medium for row titles, 14px regular grey for subtitles, 12–13px for micro-labels and badges, and ~11px letter-spaced grey caps for field labels. Weight rather than size does most of the hierarchy work, which is why the screens read cleanly at a glance. The marketing headlines use a noticeably heavier, more geometric grotesque than Inter at display sizes (INFERRED — possibly Inter Display or a Poppins-class face).

**Spacing and layout. OBSERVED.** A consistent ~16px page gutter, ~12–16px vertical rhythm between cards, and ~16–20px internal card padding. Expense rows are ~72px tall with comfortable internal gaps. The layout is a single-column card stack throughout, which is monotonous but very legible and never crowded. This is the strongest part of the UI craft — nothing in the phone screenshots is cramped, misaligned, or visually noisy.

**Iconography. OBSERVED.** Two distinct icon families coexist. Category icons are **black or dark line-art glyphs inside ~44px rounded-square tiles (≈12px radius) with pastel tinted backgrounds** — mint for tickets and flights, peach for taxis, lavender for sports, pale blue for statements, pink for groceries. These are the app's best visual signature: they give the list colour and scanability without shouting. Interface icons (back arrow, gear, magnifier, chevrons) are a standard Material outline set. Button icons are white line-art. The `AI CHAT` sparkles glyph is the current cross-industry convention and correctly signals "generative". The **app icon** is a teal-gradient tile with a bold white "S" over a lighter teal pie/donut ring and small motion dashes; it is legible at large sizes but the ring and dashes collapse into mush at 60px, and a green-teal finance icon is weakly differentiated from Splitwise's green in a search-results row.

**Buttons — the weakest component. OBSERVED.** I count **five distinct button treatments** across eight screenshots:
1. Filled teal **pill**, white ALL-CAPS bold label, leading icon — `ADD MEMBERS`, `SETTLE UP`, `INSIGHTS`, `AI CHAT`
2. Filled teal **rounded-rect** (~8px radius), white ALL-CAPS — `SELECT FILE`, `APPLY`
3. Filled teal pill, white **sentence-case** label with a trailing chevron — `Scan Bill`
4. **Outlined** teal pill, teal caps label — `UNLINK`, and `Add Context` in sentence case
5. **Pale-mint tinted** pill, teal sentence-case label with a `+` — `Add` on Budgets
Plus a bare teal text action (`SAVE`) in the nav bar. Shape, case, and radius all vary without a discernible rule mapping to hierarchy. `SELECT FILE` (a secondary file-picker) gets the same visual weight as `APPLY`, while `Scan Bill` — arguably a primary action — is the only sentence-case pill in the app.

**Cards. OBSERVED, and the strongest component.** A single well-tuned recipe: white fill, ~12–16px corner radius, a very soft low-opacity drop shadow, generous padding, no borders. It is applied consistently to balance cards, expense rows, filter panels, budget rows, and import options. The variants earn their differences: the Budgets hero is a **solid orange** full-bleed card (colour-as-status, at the largest size on screen), and settlement rows are **pale-green tinted** full-width rows. Both deviations are meaningful rather than decorative, which is exactly how a card system should flex.

**Forms. OBSERVED.** Two incompatible field styles ship side by side. Add Expense uses **filled grey rounded fields with an external small-caps grey label above** and a leading icon tile — a clean, custom, iOS-plausible treatment. Insights uses a **Material outlined field with a notched floating label** ("Member") — an unmistakably Android control. Filter chips (Jan / Dec / 2026 / All-time / Custom) are well-built: pale mint when unselected, solid teal when selected, good touch targets. But the chip set mixes granularities — a month, another month, a year, all-time, and custom — with no grouping logic, and the custom range requires an explicit `APPLY` tap that the preset chips do not, so two adjacent controls in one card behave differently.

**Number formatting. OBSERVED — a real defect.** The Insights total renders as **`₹624634.57`** with no digit grouping. For an India-first product this should be `₹6,24,634.57` (or at minimum `₹624,634.57`). A six-figure rupee amount with no separators is genuinely hard to read, and it is in the App Store screenshot.

**iPad. OBSERVED — poor.** The iPad build is a stretched phone layout: no sidebar, no split view, no master-detail. Expense rows span ~900px with a 44px icon at the far left and the amount at the far right, leaving an enormous dead zone in the middle; the balance card is one line of text and a number separated by 700px of white. The tab bar and centre FAB stretch across the full width. This is what you get from a responsive framework with no tablet-specific layout work.

### 5.2 UI ratings

| Dimension | /10 | Confidence | Reasoning |
|---|---|---|---|
| **Typography** | 6.5 | High | A tight, disciplined scale — roughly five sizes doing all the work, with weight rather than size carrying the hierarchy, which is why dense ledger rows stay readable. Amounts are correctly the heaviest thing in each row. The small-caps letter-spaced field labels are a nice, deliberate touch. Marked down for: no expressive display tier anywhere in the app (the marketing site has a far more confident headline face than the product does), the unformatted `₹624634.57`, some 11–12px micro-labels sitting below comfortable minimums for a finance app, and no evidence of dynamic-type support. |
| **Spacing** | 7 | High | The most reliably executed part of the UI. A consistent 16px gutter, even card rhythm, and roomy 72px rows mean no screen in the set feels cramped or accidental. Card padding is generous enough that dense financial data reads as calm. The deductions are for unmanaged voids rather than crowding: the Import screen leaves a large empty region below the fold, and the iPad layout is almost entirely whitespace stretched between two edges. Vertical spacing is solved; horizontal spacing is not, because nothing constrains a max content width. |
| **Colour System** | 6 | High | The teal-plus-semantic-green/red/amber foundation is correct for the category and applied consistently in the ledger, and using orange for the over-budget hero is a smart use of colour as a status carrier at the largest available size. Three real faults hold it here: an unexplained bright blue on the Insights total that belongs to no tier of the system; a chart palette with no relationship to the pastel category tints used everywhere else, so a category has two different colours in two different views; and the red/green inversion between group context ("you owe") and personal context ("you paid"). The last is the serious one — it means the fastest visual cue in the app means different things on adjacent screens. |
| **Iconography** | 6.5 | High | The pastel-tile category icons are the app's best visual asset: consistent 44px rounded squares, consistent line weight, tint-per-category, dark glyph for contrast. They make a long ledger scannable in a way plain text never would, and they are the one thing here I would tell a competitor to study. The interface icons are a competent stock Material outline set — safe, unremarkable, and slightly off-platform on iOS (Material back arrow rather than an iOS chevron). The app icon is the weak link: the pie ring and motion dashes are illegible at launcher size and the teal reads as generic finance. |
| **Buttons** | 5 | High | Five treatments — filled pill, filled rounded-rect, filled pill with sentence case and a chevron, outlined pill, tinted pill — plus a bare text action, with no consistent mapping from style to hierarchy. `SELECT FILE`, a secondary picker, carries the same weight as `APPLY`; `Scan Bill` is the sole sentence-case filled pill; radius varies between 8px and fully-rounded for buttons of identical rank. The ALL-CAPS labelling is a Material 2 default carried onto iOS unedited, where it looks foreign and costs legibility on longer labels. Compounding this, the primary action row is horizontally clipped with no scroll affordance, so button *placement* fails alongside button *styling*. |
| **Cards** | 7.5 | High | The single most mature component in the product. One recipe — white, ~12–16px radius, soft shadow, generous padding, no border — applied consistently across six screen types, which is what gives the app its "clean" impression (and "the design is really clean" is exactly what the one substantive positive review says). Crucially, the variants are *semantic*: the solid-orange budget hero and the pale-green settlement rows deviate to carry meaning, not to decorate. If Splitify has a design system at all, it lives entirely in this component. |
| **Forms** | 6 | High | Add Expense is genuinely good: external small-caps labels, filled fields, leading icon tiles for identity and target size, and a currency tile that doubles as the multi-currency control. The filter chips are well-built with clear selected states. Against that, the Insights screen ships a Material notched-outline dropdown next to that custom style, so two field languages coexist within one app; the chip row mixes months, a year, all-time, and custom with no grouping; and the custom range needs an explicit `APPLY` while the presets apply instantly, so adjacent controls in one card have different commit models. No validation, error, disabled, or focus states are observable anywhere. |
| **Design Language** | 6 | High | There *is* a language — soft-shadowed white cards on light grey, teal accent, pastel category tiles, minimal chrome — and it is coherent enough that a stranger would recognise two screens as the same app. It is also entirely undifferentiated: this is the default modern-fintech look, and nothing in it would distinguish Splitify from a dozen competitors in a screenshot line-up. The stock line-art illustration on Add Expense actively fights the language with an orange/blue palette from a different world. The marketing site is more confident than the product — heavier display type, richer section rhythm — which suggests the brand was designed after, and separately from, the app. |
| **Visual Hierarchy** | 7 | High | Strong at the row level and strong on Budgets. Each ledger row resolves in one fixation: date on the left, identity via the coloured tile, description in medium weight, and the amount as the heaviest, colour-coded element on the right — the eye lands on the number, which is the correct target. The Budgets screen is a model of hierarchy: one dominant orange hero carrying the only number that matters, then a uniform list of secondary rows. Weaker at screen level elsewhere — the Insights screen opens with a filter card rather than the answer, so the user reads controls before content, and the Add Expense screen gives half its area to an illustration. |
| **Component Consistency** | 5.5 | High | The failures are catalogued above and they are not cosmetic quibbles: five button treatments, two form-field languages, two icon families, a chart palette divorced from the list palette, a red/green semantic that inverts by context, and title alignment that is left-aligned on five screens and centred on the sixth. Individually minor; collectively they say there is no component library being enforced — or that there is one and it has been overridden ad hoc under shipping pressure. The eleven-releases-in-six-weeks cadence makes the second explanation the likely one. |
| **Design System maturity** | 5 | Med–High | Evidence of *conventions* but not of a *system*. Cards, spacing, and the type scale are consistent enough to be governed by shared tokens. Buttons, fields, and chart colour are not — they look like local decisions made per screen. The tell is the Material leakage: notched dropdowns, ALL-CAPS buttons, a docked FAB, and a Material back arrow shipped unedited to iOS means the team is inheriting a framework's defaults rather than defining their own primitives on top of it. That is a rational speed trade-off for a nine-month-old product; it is also precisely what a design system exists to prevent, and the cost is now visible on every screen. |
| **Overall polish** | 6.5 | High | At a glance this looks like a professional 2026 finance app, and the first impression is genuinely good — that is not nothing, and it is what the positive review responds to. The polish gaps show under inspection and they cluster in one place: **data presentation**. An unseparated `₹624634.57`, a truncated `CREDIT CARD 3333 PAYME…`, a raw `Uber 063015 SF**POOL**` with asterisks intact — all three shipped in App Store screenshots, which are the most-reviewed images the team produces. Add the stretched iPad layout, the off-brand stock illustration, and store creative that is two weeks and eleven releases stale, and the picture is a team that polishes layout but not content. |

---

# SECTION 6 — User Journey

Screen-by-screen, open → activation → retention. **Status** marks whether the step's screen is observed or reconstructed. Drop-off risk is my judgement given the observed friction, not measured data.

| # | Screen | User goal | Likely friction | Drop-off | What a competitor does better | Status |
|---|---|---|---|---|---|---|
| 1 | App Store / Play listing | Decide whether to install | Eight screenshots but the **first** shows a dense group ledger, not the value proposition; the receipt-scan slide is a stock photo of paper with **no app UI**, which reads as "feature not ready"; creative predates the Home tab by eleven releases; **iOS 18.0 minimum** silently excludes a large share of Indian iPhones | Med | Splitwise leads with a single clear "who owes whom" frame and supports far older OS versions, so it is installable by everyone who finds it | OBSERVED |
| 2 | Cold launch / splash | Get in | ~114.8 MB download before first launch; Flutter cold start on mid-tier Android plausibly 2–4 s | Low | Splitwise is a fraction of the size and launches faster on cheap hardware — decisive in the India-first market Splitify targets | INFERRED |
| 3 | Onboarding / value prop | Understand what this is | Unobserved. The app is two products (splitter + personal finance) and nothing in the observed IA reconciles them; if onboarding does not pick a lane, the user forms the wrong model | Med | Monarch and Copilot run a short intent-selection step that routes the user into one of two coherent product experiences instead of both | ASSUMPTION |
| 4 | **Signup** | Create an account | **The critical wall.** Name **+** email **+** phone number **+ OTP verification**, before any value. Publicly objected to in one of only three visible reviews; developer defends rather than defers it. OTP delivery is an added failure point in a flow where email delivery is *already reported broken* | **High** | Splitwise: Google/Apple sign-in, add a friend by email, done in ~30 s. Settle Up allows a usable local group with **no account at all**. Phone verification, if needed, belongs at first-friend-add, not first-launch | OBSERVED (fields + verification) |
| 5 | Login / password reset | Get back in | **Reset emails reportedly not delivered** (Jul 2026 review); developer's reply blames spam filtering. On a finance app a lockout blocks access to money owed | **High** | Any competitor using magic links or enforced social sign-in removes this failure class entirely | OBSERVED (failure reported) |
| 6 | Home (v1.4.3+) | Orient — "what needs my attention?" | Unobserved. An *analytics* home answers "how am I doing" when a first-run user with zero data needs "what do I do next"; empty-state design here decides activation | Med | Splitwise opens on a balance summary with a persistent "Add expense" — the next action is never in doubt | INFERRED |
| 7 | Groups tab (empty) | Find or start a group | Empty-state unobserved. Users arriving from Splitwise need the **Import** path surfaced *here*, but Import appears to be a separate destination rather than an empty-state CTA | Med | Splitwise's empty group list leads directly with group creation and sample content | INFERRED |
| 8 | Create group | Name the group | Minimal capture (name, probably a category). Members are **not** added here — the flow ends with an empty group | Low | Tricount creates a group *and* collects participants as free-text names in one screen, so the group is immediately usable solo | INFERRED |
| 9 | **Add members** | Get friends in | The structural weak point. `ADD MEMBERS` is a pill on the *already-created* group. If invitees must complete the same name/email/**verified-phone** signup to appear, every added friend re-runs step 4's wall. No evidence of invite-link, QR, or placeholder participants | **High** | Splitwise adds a friend by email address and lets you split with them **before** they ever sign up. Tricount and Settle Up allow pure local participants with no account. This single difference is Splitify's largest competitive gap | Pill OBSERVED; invite mechanics INFERRED |
| 10 | Group detail | See state, act | Genuinely good: balance card on top, action pills, then the ledger. But the **third action pill is clipped off-screen with no scroll affordance**, so `COMPARE`-class actions are effectively undiscoverable | Low | Splitwise keeps a fixed, always-visible action set | OBSERVED |
| 11 | **Add expense** | Log a cost | The app's best screen. Description + amount + the natural-language "Paid by X and split equally" line. Frictions: no date/category visible in the viewport; a large stock illustration occupies the space where a live split preview belongs; "SAVE" with no visible validation or unsaved-changes guard | Low | Splitwise shows the resulting per-person amount *live* as you type, so the user never saves a split they have not verified | OBSERVED |
| 12 | Split configuration | Split unequally | Full mode set (equal / amount / % / item-wise / shares) behind an inline token — correct progressive disclosure. Unobservable: remainder reconciliation, whether a 97% split can be saved, whether item-wise supports shared items and proportional tax/tip | Med | Splitwise visibly reconciles the remainder and blocks an unbalanced save — the trust-critical detail in any splitter | Modes OBSERVED; editor INFERRED |
| 13 | Receipt scan | Split an itemised bill | Multi-second LLM round trip with **no observable loading or progress state**; no visible retry/edit path when extraction misreads a crumpled receipt. Notably, one of three public reviewers calls the feature unnecessary and the developer had to explain its purpose — a positioning as well as a UX signal | Med | Any scanner that streams progress and drops the user into an editable line-item list makes the wait legible and the failure recoverable | Entry OBSERVED; flow INFERRED |
| 14 | Ledger review | Confirm it looks right | Rows are excellent — date, pastel category tile, description, colour-coded amount, resolvable in one fixation | Low | — (this is competitive strength) | OBSERVED |
| 15 | **Settle up** | Close the balance | Records a payment; **cannot move money**. The flow ends at "mark as paid" and the user leaves for GPay, PhonePe, or WhatsApp to actually pay — and may not come back | **High** (silent: retention loss, not visible abandonment) | In India this is the decisive gap: a **UPI intent deep link** turns "mark as settled" into "pay ₹1,082 now", keeping the highest-value moment inside the app. Splitwise monetises settle-up via payment partners for the same reason | Entry + ledger rendering OBSERVED; form INFERRED |
| 16 | Activity feed | See what changed | Auto-logged expenses and settlements. Unobserved; value depends entirely on push notifications, which are unevidenced | Med | Splitwise's nudge/reminder loop is the mechanic that brings users back without them deciding to | INFERRED |
| 17 | Personal expenses | Track own spending | Reachable only via a pushed screen, not a tab. **Raw bank descriptors ship untidied** (`Uber 063015 SF**POOL**`, `CREDIT CARD 3333 PAYME…`). Red/green here means paid/received — **inverted** from the group screen's owe/lent | Med | Copilot and Monarch clean merchant strings to a recognisable name and logo, which is most of the perceived quality of a transaction feed | OBSERVED |
| 18 | Connect bank | Automate the feed | Framed as "bank connection" but mechanically an email/SMS alert grant. Handing a finance app read access to your inbox is a large ask; the reviewer already objecting to a phone number will not clear this bar | **High** | True aggregation (Plaid in the US, RBI Account Aggregator in India) is a narrower, better-understood consent than "read my email" | Post-link state OBSERVED; mechanism INFERRED |
| 19 | Insights | Understand spending | Opens with a **filter card before the answer**; `₹624634.57` unformatted; donut colours unrelated to the list's category tints; custom range needs a separate `APPLY` | Low | Any tool that leads with the number and offers filters second respects the user's actual question order | OBSERVED |
| 20 | Budgets | Set limits, track | Best-composed screen in the app: orange hero with ring, %, remaining, and days left; category rows with badge + bar + % (four redundant encodings). "Spending pace" shipped in v1.3.6 | Low | — (this is competitive strength) | OBSERVED |
| 21 | AI Chat | Ask a question | The removable context chip is excellent. But responses are long, dense, and — on the evidence of a fully-rendered bubble with no streaming indicator — likely delivered whole after a multi-second blank wait. No visible suggested prompts to teach users what to ask | Med | Any assistant that streams tokens converts a dead wait into visible progress, at essentially zero engineering cost | OBSERVED |
| 22 | Paywall | Convert to Pro | Unobserved. ₹149/mo in India is priced against Splitwise Pro and is defensible, but which features gate is unknown — if receipt scanning or AI gate, the free tier may not demonstrate enough value to justify the ask | Med | Splitwise's free tier is fully usable for the core job, so Pro is an upgrade rather than an unlock | ASSUMPTION |
| 23 | Return visit | Re-check balances | Depends entirely on push notifications and the Activity feed, neither observable. The settle-up gap (#15) means the natural return trigger — "pay me back" — resolves in a *different app* | **High** | Splitwise's reminder emails and nudges are the entire retention engine of the category | INFERRED |
| 24 | Retention loop | Habit | Two competing loops — social (group activity, others' actions pull you back) and personal (self-motivated, weak). The **social loop is the strong one and is exactly the one blocked by the signup wall at #4 and #9**: friction on invitees caps the network effect that would otherwise drive retention | **High** | Splitwise's loop works because a friend can be *added* before they are a *user*; the network grows ahead of the signup funnel | INFERRED |

**The three compounding chokepoints:** step 4 (signup wall), step 9 (friends must clear that same wall), and step 15 (settlement leaves the app). They are causally linked — the wall throttles the social graph, and a small graph plus an exit at the payment moment means the retention loop never closes. Fixing #9 alone (invite-by-link with placeholder participants who are reconciled on signup) would likely move activation more than any visual change in this report.

---


---

# SECTION 7 — Market Research

### 7.1 Market size

| Metric | Value | Type | Source |
|---|---|---|---|
| Bill-splitting apps market, 2024 | USD 572.47M | [E] | [360iResearch](https://www.360iresearch.com/library/intelligence/bill-splitting-apps) |
| Bill-splitting apps market, 2025 | USD 612.14M | [E] | [360iResearch](https://www.360iresearch.com/library/intelligence/bill-splitting-apps) |
| Bill-splitting apps market, 2026 | USD 657.72M | [E] | [360iResearch](https://www.360iresearch.com/library/intelligence/bill-splitting-apps) |
| Bill-splitting apps market, 2032 | USD 1,005.38M | [E] | [360iResearch](https://www.360iresearch.com/library/intelligence/bill-splitting-apps) |
| CAGR 2025–2032 | 7.34% | [E] | [360iResearch](https://www.360iresearch.com/library/intelligence/bill-splitting-apps) |

**Verification note:** the brief's figure (USD 612M in 2025, 7.34% CAGR) is **confirmed** directly against the 360iResearch library page, not just the press release. I attempted to triangulate with MarketResearchFuture, VerifiedMarketResearch and Technavio, all of whom publish competing and materially different numbers behind paywalls. **No independently audited market size exists for this category.** Treat all of these as syndicated-research estimates with wide error bars.

**Sizing sanity check [A]:** the entire global "bill-splitting app" software market at ~$612M is smaller than a single mid-cap SaaS company. Splitwise — the category leader — is estimated at only ~$6.6M revenue ([Growjo, 2026](https://growjo.com/company/Splitwise)) [E]. That is roughly **1% of the claimed market**. Either the market sizing includes payment-volume-adjacent revenue that pure splitting apps do not capture, or the addressable software revenue is far smaller than $612M. **A pure bill-splitting app is not a large business.** This is the single most important structural fact for Splitify's positioning, and it is why Splitify's all-in-one personal-finance bundling is strategically correct even though it is executionally harder.

Regional note: 360iResearch calls Asia-Pacific "one of the most dynamic regions" on mobile-wallet and QR-payment adoption, but publishes **no quantified regional split** ([source](https://www.360iresearch.com/library/intelligence/bill-splitting-apps)) [E].

### 7.2 The India regulatory shock nobody in this category has priced in

This is the sharpest finding in the whole research pass, and it is not in any competitor's marketing.

| Fact | Detail | Source |
|---|---|---|
| NPCI circular dated 29 Jul 2025 | **UPI P2P "collect requests" (pull payments) ceased to be processed from 1 October 2025** | [Medianama](https://www.medianama.com/2025/08/223-npci-p2p-collect-payments-oct-1-what-it-means/), [Outlook Money](https://www.outlookmoney.com/banking/npci-to-end-upi-p2p-collect-requests-from-october-1-to-reduce-fraud) [F] |
| Rationale | Fraud reduction — scammers abused collect requests to trick users into authorising payments | [Angel One](https://www.angelone.in/news/market-updates/npci-to-end-upi-person-to-person-collect-requests-from-october-to-curb-fraud) [F] |
| Scope | P2M (merchant) collect requests **continue**. Only person-to-person pull is dead | [Medianama](https://www.medianama.com/2025/08/223-npci-p2p-collect-payments-oct-1-what-it-means/) [F] |
| Previous limits removed | ₹2,000 per collect txn, 50/day cap — now moot | [Angel One](https://www.angelone.in/news/market-updates/npci-to-end-upi-person-to-person-collect-requests-from-october-to-curb-fraud) [F] |

**Why this matters commercially [A]:** "request money from your friend" — the mechanic Google Pay's India bill-split feature and every UPI app relied on for settlement — **no longer works P2P in India**. Bill-splitting apps that settle via a **payer-initiated UPI deep-link** (`upi://pay?pa=...&am=...`) are unaffected, because the deep-link is a *push* from the payer, not a *pull* from the creditor. So the regulator has just kneecapped the incumbent platform mechanic and left the deep-link mechanic standing.

Every India-first competitor (Niptao, FairShare, goDutch) already ships UPI deep-links. Splitify's brief does **not** list UPI deep-link settlement among its features. **If Splitify does not have payer-initiated UPI deep-links, it is missing the one India feature that regulation just made structurally advantaged.** Flagged as the top product gap.

> **EDITOR'S NOTE (cross-checked against other research streams):** **this paragraph's premise is wrong and the correction matters.** No Account Aggregator, Setu, Finbox, Perfios, Salt Edge or Yodlee appears anywhere in Splitify's app, policy or vendor-controlled files [F]. Splitify ingests Indian bank data by **scraping bank-alert SMS and email**, i.e. *outside* the AA framework entirely. That is a regulatory **exposure**, not a compliance investment — and it means weaknesses W7 and W11 below overstate Splitify's cost base while understating its risk. The AA background below remains accurate as context for anyone considering building bank sync properly.

Secondary regulatory note: the RBI **Account Aggregator** framework is the licensed route Splitify did *not* take. NBFC-AA licences require ₹2 crore minimum net owned funds and RBI registration; consumer apps consume AA data via a licensed AA rather than holding the licence ([RBI NBFC-AA Directions 2025, via TaxGuru](https://taxguru.in/rbi/rbi-non-banking-financial-companies-account-aggregator-directions-2025.html); [Sahamati](https://sahamati.org.in/account-aggregators-in-india/)) [F]. This is a real, ongoing cost and compliance surface for Splitify that pure splitters do not carry [A].

### 7.3 Competitor profiles

#### Tier 1 — Global incumbents

**Splitwise** (the app to beat)

| Field | Value | Type | Source |
|---|---|---|---|
| Company | Splitwise, Inc., Providence RI | [F] | [Wikipedia](https://en.wikipedia.org/wiki/Splitwise) |
| Founded | Feb 2011, as SplitTheRent. Ryan Laughlin, Jon Bittner, Marshall Weir | [F] | [Wikipedia](https://en.wikipedia.org/wiki/Splitwise) |
| Funding | $1.4M (Dec 2014), $5M (Oct 2016), $20M Series A (Apr 2021, Insight Partners) = $26.4M | [F] | [Wikipedia](https://en.wikipedia.org/wiki/Splitwise), [TechCrunch](https://techcrunch.com/2021/04/28/splitwise-raises-20m-series-a-to-help-everyone-in-the-world-divvy-expenses) |
| Funding (alt figure) | $30.5M across 5 rounds; investors incl. Insight Partners, SVB, Great Oaks | [E] | [Growjo](https://growjo.com/company/Splitwise) / Tracxn |
| Revenue | ~$6.6M/yr | [E] | [Growjo](https://growjo.com/company/Splitwise) |
| Headcount | ~50+, ~14% YoY growth | [E] | [Growjo](https://growjo.com/company/Splitwise) |
| iOS (US) | 4.0★, 27K ratings | [F] | [App Store](https://apps.apple.com/us/app/splitwise/id458023433) |
| Android | 4.17★, ~190K ratings, ~30M lifetime installs | [E] | [AppBrain](https://www.appbrain.com/app/splitwise/com.Splitwise.SplitwiseMobile) |
| Android (alt) | 4.3★, 194K rating votes, 28K written reviews, 10M+ install bucket, v26.7.3, updated 23 Jul 2026 | [E] | [AppstoreSpy](https://appstorespy.com/android-google-play/com.Splitwise.SplitwiseMobile-trends-revenue-statistics-downloads-ratings) |
| Pricing (US) | Pro IAP tiers $2.99 / $3.99 / $4.99 / $29.99 / $39.99 | [F] | [App Store](https://apps.apple.com/us/app/splitwise/id458023433) |
| **Pricing (India)** | ~~₹2,499/year, annual billing only~~ **CORRECTED: ₹49 / ₹99 / ₹149 / ₹999 / ₹1,199 IAP tiers** on Apple's own India storefront | **[F]** | [App Store IN](https://apps.apple.com/in/app/splitwise/id458023433) — primary source, supersedes the [Niptao blog](https://niptao.app/en/blog/splitwise-pro-price-india-2026) claim |
| Free-tier limit | ~3 expenses/day (some sources say 3–5, or 4 with a 10-second cooldown between entries); ads throughout; receipt scanning capped ~3/week; no charts | [E] | [Splitty](https://splittyapp.com/learn/splitwise-vs-splid-vs-settleup/), [Niptao](https://niptao.app/en/blog/splitwise-pro-price-india-2026), [Split-Circle](https://split-circle.com/en/blog/splitwise-daily-limit) |
| Free-tier limit — official | **Splitwise does not publish the exact number.** Every figure above is user-reported | [A] | — |
| Payments | Venmo (2013), PayPal, both **US-only**; Tink/Visa "Pay by Bank" (Apr 2024, Europe); Paytm integration announced 2017 | [F] | [Wikipedia](https://en.wikipedia.org/wiki/Splitwise), [Splitwise blog](https://blog.splitwise.com/2017/05/23/announcing-a-splitwise-paytm-integration-for-android/) |
| **UPI** | **None.** Feature request open, 458 votes, status "Under review" | [F] | [Splitwise feedback forum](https://feedback.splitwise.com/forums/162446-general/suggestions/15872739-is-it-possible-to-integrate-upi-unified-payment-s) |
| Platforms | iOS, Android, Web | [F] | store listings |

**Tricount (by bunq)** — the sleeping giant that just reset its own pricing

| Field | Value | Type | Source |
|---|---|---|---|
| Company | Belgian, founded 2012; acquired by bunq (NL neobank), announced 2022 | [F] | [FinTech Futures](https://www.fintechfutures.com/challenger-banks/dutch-challenger-bunq-becomes-eu-s-second-largest-neobank-with-tricount-acquisition), [ThePaypers](https://thepaypers.com/fintech/news/bunq-acquires-tricount-app) |
| Deal terms | Undisclosed | [F] | [ThePaypers](https://thepaypers.com/fintech/news/bunq-acquires-tricount-app) |
| Users at acquisition | +5.4M users to bunq, making it EU's 2nd-largest neobank | [F] | [FinTech Futures](https://www.fintechfutures.com/challenger-banks/dutch-challenger-bunq-becomes-eu-s-second-largest-neobank-with-tricount-acquisition) |
| Scale | €16.4bn split by Tricount users in 2024; ~16M users across 175 countries | [F] | [bunq Newsroom](https://press.bunq.com/246589-from-roommates-to-road-trips-tricount-tallies-16-4-billion-shared-in-2024/) |
| Android | 4.81★, ~150K ratings, 14M lifetime downloads, ~250K/30 days | [E] | [AppBrain](https://www.appbrain.com/app/tricount-split-settle-bills/com.tribab.tricount.android) |
| **Pricing** | **Tricount Premium deprecated. App now fully free, no hidden costs.** Former Premium was $9.99/yr. Ex-subscribers given 6 months bunq Pro free (€59.94 value) | [F] | [Tricount Help Center](https://help.tricount.com/articles/what-happened-with-tricount-premium) |
| **Features REMOVED in the rewrite** | **CSV and PDF export, Personal mode, Statistics, saved Custom Splits** (last three "planned for future update") | [F] | [Tricount Help Center](https://help.tricount.com/articles/what-happened-with-tricount-premium) |
| New app published | 9 Jun 2026; latest v14.0.3, updated 2 Jun 2026 | [F/E] | [Tricount Help Center](https://help.tricount.com/articles/what-happened-with-tricount-premium) |
| Monetisation model | Free app as **funnel into bunq banking** — a free credit card auto-adds group expenses as you pay | [F] | [bunq on X](https://x.com/bunq/status/1808967542670516647) |
| UPI | None | [E] | [Niptao comparison](https://niptao.app/en/blog/best-upi-bill-splitting-apps-india-2025) |

**Tricount is the most dangerous global competitor, not Splitwise.** It just went free-forever, has 14M downloads at a 4.81★ rating, and is cross-subsidised by a bank. It cannot be out-priced. But it just **deleted export, statistics and personal mode** from its own product — a self-inflicted, exploitable gap.

**Settle Up** (Step Up Labs, Inc.)

| Field | Value | Type | Source |
|---|---|---|---|
| iOS | 4.8★, 1.7K ratings; requires iOS 17+ | [F] | [App Store](https://apps.apple.com/us/app/settle-up-group-expenses/id737534985) |
| User base claim | "Over 2.5 million users" | [F] | [App Store listing](https://apps.apple.com/us/app/settle-up-group-expenses/id737534985) (self-reported) |
| Pricing (iOS IAP, obs. 2026-08-06) | Monthly Premium $3.99; Yearly Premium $19.99; Group Premium $39.99; durations 1 week → lifetime $149.99 | [F] | [App Store](https://apps.apple.com/us/app/settle-up-group-expenses/id737534985) |
| Pricing (vendor page) | Individual $3.49/mo or $18.99/yr (=$1.58/mo); Group $5.49/wk, $13.99/mo, $34.99/yr, $134.99 lifetime | [E] | [settleup.app/premium](https://settleup.app/premium) — page did not render fully on fetch; figures via search snippet |
| Free tier | **Unlimited transactions and unlimited export are NOT paywalled.** Ad-supported on Android | [E] | [Splitty](https://splittyapp.com/learn/splitwise-vs-splid-vs-settleup/) |
| Premium unlocks | Ad removal, receipt photos, categories, group colours, recurring + future transactions, payment reminders, bulk FX-rate editing, Excel export, charts | [E] | [settleup.app/premium](https://settleup.app/premium) |
| Differentiator | **Weighted shares** (a couple counts as 2, a single person as 1); fewest-transfers settlement algorithm; browser-based group sharing with no download; offline | [F] | [App Store](https://apps.apple.com/us/app/settle-up-group-expenses/id737534985) |
| Platforms | Android, iOS, Windows, Web | [E] | [Splitty](https://splittyapp.com/learn/splitwise-vs-splid-vs-settleup/) |
| UPI | Manual only | [E] | [Niptao](https://niptao.app/en/blog/best-upi-bill-splitting-apps-india-2025) |

**Splid** (Nicolas Jersch / listed via MWM)

| Field | Value | Type | Source |
|---|---|---|---|
| iOS | **4.9★, 3.9K ratings** — highest-rated app in this entire study | [F] | [App Store](https://apps.apple.com/us/app/splid-split-group-bills/id991473495) |
| Android | 2.5M+ downloads (one source says 3.3M) | [E] | [MWM](https://mwm.ai/apps/splid-split-group-bills/991473495), [Similarweb](https://www.similarweb.com/app/google-play/splid.teamturtle.com.splid/statistics/) |
| Pricing | **One-time IAPs, not subscription.** Splid Plus $3.99; "2 Groups" $2.99 | [F] | [App Store](https://apps.apple.com/us/app/splid-split-group-bills/id991473495) |
| Free tier | Unlimited expenses, **no ads**, **no account required**, one group at a time, no PDF/Excel export | [E] | [Splitty](https://splittyapp.com/learn/splitwise-vs-splid-vs-settleup/) |
| Killer features | **Fully offline, zero-signup**, join via group code, 150+ currencies with auto-conversion, multiple payers per expense | [F] | [splid.app](https://splid.app/english), [App Store](https://apps.apple.com/us/app/splid-split-group-bills/id991473495) |
| Size | 12.5 MB, iOS 16+ | [F] | [App Store](https://apps.apple.com/us/app/splid-split-group-bills/id991473495) |
| Weakness | No payment rails at all; Europe-centric; 5 languages | [A] | — |

Splid is the **proof that the category's users reward restraint**: no account, no subscription, no ads, 12.5 MB, 4.9★. Splitify at 114.8 MB with a subscription and bank sync is the polar opposite product philosophy.

**Spliit** (open source)

| Field | Value | Type | Source |
|---|---|---|---|
| Model | Free, open source, self-hostable; MIT-style community project | [F] | [GitHub spliit-app/spliit](https://github.com/spliit-app/spliit) |
| Origin | Explicitly built as a response to Splitwise's tightening free tier | [F] | [Spliit blog](https://spliit.app/blog/we-need-an-open-source-alternative-to-splitwise) |
| Features | No account for participants — share a link; receipt scanning with amount extraction; multi-currency; minimal-transaction settlement | [F] | [GitHub](https://github.com/spliit-app/spliit), [OpenAlternative](https://openalternative.co/spliit) |
| Deployment | Web app; VPS one-click deploy available (Hostinger) | [F] | [Hostinger](https://www.hostinger.com/applications/spliit) |
| Weakness | No native mobile apps; requires technical user to self-host; naming confusion with unrelated "SPLIIT Pro" | [F] | [OpenAlternative](https://openalternative.co/spliit) |
| Threat level | Low commercially, **high reputationally** — it is the standing proof that the core product is a commodity | [A] | — |

#### Tier 2 — India-relevant

**Splitkaro** — the India competitor Splitify's brief did not mention, and the most important one

| Field | Value | Type | Source |
|---|---|---|---|
| Android | 4.38★, **8.1K ratings, ~340K downloads**, ~5.7K downloads/30 days | [E] | [AppBrain](https://www.appbrain.com/app/splitkaro-split-expenses/com.bsquare.splitkaro) |
| iOS | **4.7★, 3.4K ratings** | [E] | via [App Store IN](https://apps.apple.com/in/app/splitkaro-split-bills-fairly/id1573115695) |
| Claim | "500k+ users in India & the USA" | [F] | [splitkaro.com](https://www.splitkaro.com/) (self-reported) |
| Pricing | Free | [F] | [splitkaro.com](https://www.splitkaro.com/) |
| Features | Equal / unequal / item-wise / ratio splits; recurring bills + reminders; group & overall analytics; **auto-fetch and split receipts from food-delivery and grocery apps** | [F] | [splitkaro.com](https://www.splitkaro.com/) |
| Distribution | Google Play, App Store, **and Indus Appstore** (India's domestic store) | [F] | [Indus Appstore](https://www.indusappstore.com/apps/finance/splitkaro/com.bsquare.splitkaro/) |

**Splitkaro has ~11,500 total ratings across stores. Splitify has ~22.** That is a ~500x gap against a domestic competitor operating in the same market with a free product.

**goDutch**

| Field | Value | Type | Source |
|---|---|---|---|
| Origin | IIT-Bombay alumni founded group-payments startup | [F] | [Inventiva](https://www.inventiva.co.in/stories/this-group-payments-startup-founded-by-iit-bombay-alumni-makes-it-easy-to-godutch/) |
| Funding | $1.7M seed, Jul 2020, led by Matrix Partners India; Y Combinator, Global Founders Capital, angels incl. Tinder & Twitch co-founders | [F] | [Inventiva](https://www.inventiva.co.in/stories/this-group-payments-startup-founded-by-iit-bombay-alumni-makes-it-easy-to-godutch/), [Dealroom](https://app.dealroom.co/companies/godutch_1) |
| Key feature | **In-app UPI settlement** via PhonePe, Google Pay, WhatsApp, BHIM; in-app chat; payment reminders | [F] | [TechIHD](https://techihd.com/godutch-app/) |
| **Brand-name collision** | The App Store ID 1363868328 now resolves to a **different** "GoDutch: Split Group Bills" by developer 振宇 陈 — **2.0★, 3 ratings**, updated 3 Jul 2024, IAPs ₹29/week to ₹1,999 lifetime | [F] | [App Store IN](https://apps.apple.com/in/app/godutch-split-group-bills/id1363868328) |
| Status | **[A] The VC-backed goDutch appears effectively dead or handed over.** A YC/Matrix-backed India app sitting at 3 lifetime ratings and a Chinese-name developer is a wind-down signature, not a going concern |

**goDutch is the cautionary tale for Splitify: $1.7M from Y Combinator and Matrix Partners India, UPI-native from day one, launched 2020 — and it is a 3-rating husk in 2026.** UPI integration and tier-1 funding were not sufficient to win this category in India.

**Niptao**

| Field | Value | Type | Source |
|---|---|---|---|
| Pricing | **Completely free. No freemium tier, no ads, no data selling** | [F] | [niptao.app](https://niptao.app/en) |
| Positioning | India-first: native UPI deep-links (GPay/PhonePe/Paytm) with pre-filled amounts, Indian group templates, rupee-first formatting, 6 bundled calculators | [F] | [niptao.app](https://niptao.app/en) |
| Splits | Equal, exact, percentage, custom | [F] | [niptao.app](https://niptao.app/en) |
| Offline | Yes — add offline, sync when online | [F] | [niptao.app](https://niptao.app/en) |
| Delivery | Browser-based PWA; native app "in development"; also on Google Play | [E] | [Niptao blog](https://niptao.app/en/blog/best-upi-bill-splitting-apps-india-2025) |
| Rating claim | "4.6+ on Google Play" | [E] | self-reported on own blog — **unverified, treat sceptically** |
| Marketing tactic | Aggressive comparison-SEO — dedicated `/vs/` pages against Tricount, SettleUp, PayUp etc. | [F] | [niptao.app/en/vs/tricount](https://niptao.app/en/vs/tricount) |

**FairShare** (fairshareapp.co.in)

| Field | Value | Type | Source |
|---|---|---|---|
| Pricing | **100% free, ad-free, no transaction caps, no paywalled tiers** | [F] | [fairshareapp.co.in](https://fairshareapp.co.in/) |
| Features | AI receipt scanning that reads **Indian bills with GST**; split by item / percentage / exact; native UPI deep-link settlement, one tap in GPay or PhonePe; multi-group real-time balances | [F] | [fairshareapp.co.in](https://fairshareapp.co.in/) |
| Reach | 67 countries incl. India | [F] | [fairshareapp.co.in](https://fairshareapp.co.in/) |
| Store metrics | **Not disclosed and not found.** [A] Assume low — no store listing surfaced ratings |
| **Name collision** | At least **five** distinct "FairShare" apps exist on Google Play under different package IDs (`com.debayan.fairshare`, `com.leaske.fairshare`, `fi.ferrit.fairshare`, `com.huishun.fairshare`, `exceedit.fairshare`) | [F] | Google Play search results |
| Marketing tactic | Same comparison-SEO playbook as Niptao | [F] | [fairshareapp.co.in/compare](https://fairshareapp.co.in/compare/) |

**Contri** (contri.money) — India, UPI settlement via user's preferred UPI app. Blog URL 404'd on fetch [F]; details via search snippet only [E]. Low visibility, no store metrics found.

#### Tier 3 — Adjacent threats

**Google Pay India / UPI apps**

| Field | Value | Type | Source |
|---|---|---|---|
| Bill-split feature | Live and documented in Google Pay India: create a bill, request money from a group | [F] | [Google Pay Help (India)](https://support.google.com/pay/india/answer/11420982?hl=en) |
| **Structural break** | The "request money" mechanic it depends on **cannot be used P2P in India since 1 Oct 2025** (NPCI) | [F] | [Medianama](https://www.medianama.com/2025/08/223-npci-p2p-collect-payments-oct-1-what-it-means/) |
| Competitor claim | Niptao asserts "Google Pay Groups discontinued in 2023" | [E] | [Niptao](https://niptao.app/en/blog/best-upi-bill-splitting-apps-india-2025) — **could not verify; Google's own help page contradicts it.** Do not repeat this claim |
| Threat assessment | **Moderate and declining.** Distribution is overwhelming, but the feature is thin, the settlement mechanic is now regulator-blocked, and Google has repeatedly deprioritised it | [A] |

**Venmo (PayPal) / Cash App (Block)**

| Field | Value | Type | Source |
|---|---|---|---|
| Venmo Groups | Launched Nov 2023; up to 32 people per group, up to 20 groups per user; **unlimited expenses, no paywall, no daily cap, free** | [F] | [TechCrunch](https://techcrunch.com/2023/11/14/venmo-gets-a-new-way-to-split-expenses-among-groups-like-clubs-teams-trip-buddies-and-more), [PaymentsJournal](https://www.paymentsjournal.com/venmo-launches-venmo-groups-to-split-common-expenses/) |
| Venmo scale | ~66M monthly active accounts, Q3 2025 | [F] | [PaymentsJournal](https://www.paymentsjournal.com/venmo-launches-venmo-groups-to-split-common-expenses/) |
| Venmo gap | No receipt OCR / line-item extraction — manual entry only; **US-only, USD-only** | [F] | [Splitty](https://splittyapp.com/learn/venmo-groups-vs-splitwise/) |
| Cash App "Pools" | Split checks and bills; **accepts third-party payments from Google Pay and Apple Pay so non-Cash-App users can pay** | [F] | [Money.com](https://money.com/cash-app-pools-split-payments-feature/) |
| Cash App gap | US-based recipients only | [F] | [FreshBooks](https://www.freshbooks.com/hub/accounting/how-cash-app-works) |
| Threat to Splitify | **Low direct, high strategic.** Neither operates in India. But they prove the endgame: payment networks absorb splitting as a free feature and destroy the standalone category's pricing power | [A] |

**Revolut / bunq (Europe)**

| Field | Value | Type | Source |
|---|---|---|---|
| Revolut Group Bills | Split by amount, percentage or share; automatic payment reminders; **works with non-Revolut users** | [F] | [Wise](https://wise.com/ie/blog/split-bill-revolut-ireland), [Splitty](https://splittyapp.com/learn/revolut-bill-splitting/) |
| Speed advantage | Instant vs Venmo's 1–3 business-day bank transfers (UK vs US rails) | [E] | [Splitty](https://splittyapp.com/learn/revolut-bill-splitting/) |
| bunq | Owns Tricount outright and runs it free as a bank-acquisition funnel | [F] | [bunq on X](https://x.com/bunq/status/1808967542670516647) |
| Threat to Splitify | Low geographically, **high as a template.** [A] The winning model in this category is "free splitter, monetised by the bank behind it." Splitify has no bank behind it |

#### The subject: Splitify

| Field | Value | Type | Source |
|---|---|---|---|
| Company | Findat Private Limited | [F] | [App Store IN](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540) |
| iOS (IN) | **4.4★, 18 ratings** | [F] | [App Store IN](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540) |
| iOS (US) | 3.0★, 4 ratings | [F] | brief, consistent with store |
| Pricing | Pro ₹149/mo, ₹399/qtr, ₹999/yr ($2.99 / $7.99 / $19.99) | [F] | [App Store IN](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540) |
| Version / cadence | v1.4.11, updated within hours of observation; home tab with analytics added 23 Jul | [F] | [App Store IN](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540) |
| App size | **114.8 MB** (vs Splid 12.5 MB, Splitwise 69 MB) | [F] | [App Store IN](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540) |
| **Min OS** | **iOS 18.0 or later** | [F] | [App Store IN](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540) |
| Features | Smart splits (equal/amount/%/item-wise), AI receipt scanner, real-time balances, activity feed, settlement recording, Splitwise import, bank + credit-card sync, auto-categorisation, budgets, recurring/subscription tracking, net worth, AI finance assistant, multi-currency + auto-conversion | [F] | [App Store IN](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540) |
| Age rating | **12+** on both stores (corrected) | [F] | [iTunes lookup](https://itunes.apple.com/lookup?id=6756657540&country=in) returns `contentAdvisoryRating: 12+` |
| Android | **CONFIRMED: `com.akhash.splitify`, published by Findat Pvt. Ltd.** — 4.8★/30 ratings, 1,000+ installs (internal counter 2,438), released **23 Jul 2025**, i.e. **5.5 months before iOS** | **[F]** | [Play listing](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN); linked from getsplitify.com; shares Apple Team ID `S2VSF826K9` |

**Two brand collisions found, both material:**
1. **`Splitify, LLC`** (a different US company) publishes **"Cove: Track & Budget Money"** on the US App Store — a product that *also* does AI spend analytics, budgets, investment tracking, subscription management **and bill splitting**. 4.4★, 7 ratings ([App Store](https://apps.apple.com/us/app/splitify-splits-and-expenses/id6736849874)) [F]. It is a near-identical product concept under a near-identical name, and it appears to have already rebranded away from "Splitify" — which is itself a signal.
2. At least two unrelated `Splitify` packages on Google Play.

**"Splitify" is not a defensible name.** [A] Trademark and App Store Search ranking are both compromised before Splitify has any traction to protect.

**Min-OS iOS 18 is a serious, self-inflicted distribution constraint** [A]. It excludes every iPhone that cannot run iOS 18 (iPhone X and older) and every user who has not upgraded. In a category where the whole point is that *your entire friend group* installs the app, gating on the newest OS breaks the network-effect loop that the product depends on. Splid ships iOS 16+, Splitwise ships far lower.

### 7.4 MASTER COMPARISON TABLE

| App | Owner | Funding | Platforms | Pricing (obs. 2026-08-06) | Free-tier limits | UX quality | Market popularity | Strengths | Weaknesses |
|---|---|---|---|---|---|---|---|---|---|
| **Splitify** | Findat Pvt Ltd (IN) | **None found** [F] | iOS 18+; **Android confirmed** (launched first, Jul 2025) | ₹149/mo, ₹399/qtr, ₹999/yr | Not disclosed publicly | Reported clean & ad-free (n≈48) | **~48 ratings both stores. Pre-traction** | Widest feature set; Splitwise import; ships every few days | No traction; 114.8 MB; iOS 18+ gate; name collision; **no UPI deep-link**; **~price parity with Splitwise in India**; bank sync via **unregulated SMS scraping** |
| **Splitwise** | Splitwise, Inc. (US) | $26.4M [F] / $30.5M [E] | iOS, Android, Web | $4.99/mo, $39.99/yr US; **India IAPs ₹49–₹1,199** [F] | ~3/day + ads + ~3 scans/wk | Dated, nested nav; most-complained-about | ~30M installs [E]; 190K Android + 27K iOS ratings | Default brand; largest network; Venmo/PayPal/Tink | Hated free tier; **no UPI**; 1.8★ Trustpilot [E]; expensive in India |
| **Tricount** | bunq (NL bank) | Acquired, terms undisclosed | iOS, Android, Web | **Free — Premium deprecated** | None stated | 4.81★ — excellent | 14M downloads, ~150K ratings, €16.4bn split 2024 | Free forever, bank-funded; huge EU base; instant onboarding | **Just removed CSV/PDF export, Personal mode, Statistics, saved custom splits**; no UPI; EU-centric |
| **Settle Up** | Step Up Labs, Inc. | Not disclosed | iOS 17+, Android, Windows, Web | $3.99/mo, $19.99/yr; Group $39.99–$149.99 lifetime | **Unlimited txns + export free**; ads on Android | 4.8★ — very good | 1.7K iOS ratings; "2.5M users" self-reported | Weighted shares; fewest-transfers algorithm; export not paywalled; browser join, no download | Small brand; no payment rails; no UPI |
| **Splid** | Nicolas Jersch | Bootstrapped [A] | iOS 16+, Android | **One-time $3.99 (Plus) / $2.99 (2 Groups)** | 1 group; no export; **no ads, no account** | **4.9★ — best in category** | 2.5–3.3M downloads; 3.9K iOS ratings | Zero-friction: no signup, fully offline, 12.5 MB, 150+ currencies, multi-payer | 1 free group; no payments; 5 languages; EU-centric |
| **Spliit** | Open-source community | None | Web / self-host | **Free** | None | Functional, dev-oriented | GitHub project; niche | Free forever by charter; self-host = data sovereignty; link-share, no accounts | No native apps; needs technical host; name confusion |
| **Splitkaro** | BSquare (IN) | Not disclosed | iOS, Android, **Indus Appstore** | **Free** | None stated | 4.38★ Android / 4.7★ iOS | **~340K downloads, 8.1K + 3.4K ratings** | Real India traction; ratio & item splits; **auto-fetch from food-delivery/grocery apps**; India domestic-store distribution | No public UPI-deep-link claim verified; brand only in IN/US |
| **goDutch** | Original: IIT-B founders | $1.7M seed (Matrix, YC, GFC) | iOS, Android | ₹29/wk – ₹1,999 lifetime | Not stated | 2.0★ (3 ratings) | **Effectively dead [A]** | Was UPI-native from launch; in-app chat | Abandoned/handed over; listing now under an unrelated developer |
| **Niptao** | Niptao (IN) | Not disclosed | PWA + Android; native "in dev" | **Free, no ads** | None | Unverified | Unverified — self-claims 4.6★ | UPI deep-links, rupee-first, offline, bundled calculators | PWA-first; no verifiable scale; heavy self-promotional SEO |
| **FairShare** | FairShare (IN) | Not disclosed | Android + web | **Free, ad-free** | None | Unverified | **No store metrics found — assume minimal [A]** | AI scan of **GST-bearing Indian bills**; UPI deep-links; 67 countries | Unverified scale; **5 same-named apps on Play**; no iOS confirmed |
| **Google Pay (IN)** | Alphabet | n/a | iOS, Android | Free | n/a | Adequate | Enormous by default | Universal India distribution; native UPI rails | Thin feature; **its "request money" mechanic is NPCI-blocked P2P since 1 Oct 2025**; no group ledger depth |
| **Venmo Groups** | PayPal | n/a | iOS, Android | **Free, no cap, no paywall** | 32 people/group, 20 groups | Good | ~66M MAU (Q3 2025) | Payment + splitting fused; free forever | **US-only, USD-only**; no receipt OCR |
| **Cash App Pools** | Block | n/a | iOS, Android | Free | n/a | Good | Large US base | Non-users can pay via Apple/Google Pay | US recipients only; shallow ledger |
| **Revolut Group Bills** | Revolut | n/a | iOS, Android, Web | Free with account | n/a | Good | Large EU base | Instant settlement; auto-reminders; works with non-users | Requires Revolut; EU/UK-centric |

### 7.5 GRANULAR FEATURE MATRIX

**Y** = yes, present. **P** = partial / paywalled / caveated. **N** = no. **?** = could not verify.

| Feature | Splitify | Splitwise | Tricount | Settle Up | Splid | Spliit | Splitkaro | Niptao | FairShare | GPay IN | Venmo | Revolut |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Splits** | | | | | | | | | | | | |
| Equal split | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Exact-amount split | Y | Y | Y | Y | Y | Y | Y | Y | Y | P | Y | Y |
| Percentage split | Y | Y | Y | Y | Y | Y | Y | Y | Y | N | N | Y |
| Shares / ratio split | ? | Y | Y | Y | Y | Y | Y | Y | ? | N | N | Y |
| **Weighted participants** (couple = 2) | N | N | N | **Y** | N | N | ? | N | N | N | N | N |
| Item-wise / line-item split | Y | P | N | N | Y | Y | Y | ? | Y | N | N | N |
| Multiple payers on one expense | ? | N | ? | Y | **Y** | Y | ? | ? | ? | N | N | N |
| **Data entry** | | | | | | | | | | | | |
| Receipt photo storage | Y | P | Y | P | ? | Y | Y | Y | Y | N | N | N |
| **AI / OCR receipt scan** | Y | P | N | N | N | Y | Y | N | **Y (GST-aware)** | N | **N** | N |
| Recurring expenses | Y | Y | N | P | N | Y | Y | ? | ? | N | N | N |
| In-app calculator on entry | ? | **P** (955 votes, "Started") | ? | ? | ? | ? | ? | Y | ? | Y | Y | Y |
| **Settlement** | | | | | | | | | | | | |
| **UPI deep-link settlement** | **?** | **N** | **N** | **N** | N | N | ? | **Y** | **Y** | Y (native) | N | N |
| Venmo / PayPal | N | Y (US) | N | N | N | N | N | N | N | N | Y | N |
| Bank transfer / open banking | ? | Y (EU, Tink) | Y (bunq) | N | N | N | N | N | N | Y | Y | Y |
| Record manual settlement | Y | Y | Y | Y | Y | Y | Y | Y | Y | P | Y | Y |
| Debt simplification | ? | **P** (web only) | Y | **Y** | Y | Y | ? | ? | ? | N | N | N |
| Payment reminders | Y | Y | Y | P | N | N | Y | ? | ? | Y | Y | Y |
| **Access & friction** | | | | | | | | | | | | |
| **Works with no account** | N | N | N | P (browser join) | **Y** | **Y** | N | ? | N | N | N | P |
| **Full offline use** | ? | P | P | Y | **Y** | N | ? | Y | ? | N | N | N |
| Web app | ? | Y | Y | Y | N | **Y** | ? | Y | Y | N | Y | Y |
| Non-users can participate | N | N | N | Y | Y | Y | N | ? | ? | N | N | Y |
| **Data out** | | | | | | | | | | | | |
| CSV / Excel export | ? | P | **N (removed)** | **Y (free)** | P | Y | ? | ? | ? | N | N | P |
| PDF export | ? | P | **N (removed)** | P | P | Y | ? | ? | ? | N | N | N |
| **Import from Splitwise** | **Y** | n/a | Y | ? | N | ? | ? | ? | ? | N | N | N |
| Self-host / data sovereignty | N | N | N | N | N | **Y** | N | N | N | N | N | N |
| **Beyond splitting** | | | | | | | | | | | | |
| **Personal expense tracking** | **Y** | N | **N (removed)** | N | N | N | Y | N | N | N | N | Y |
| **Bank / card sync** | **Y** | N | Y (bunq only) | N | N | N | N | N | N | Y | Y | Y |
| Budgets | **Y** | P (Pro charts) | N | N | N | N | N | N | N | N | N | Y |
| Subscription tracking | **Y** | N | N | N | N | N | N | N | N | N | N | Y |
| **Net worth tracking** | **Y** | N | N | N | N | N | N | N | N | N | N | P |
| **AI finance assistant** | **Y** | N | N | N | N | N | N | N | N | N | N | N |
| Group/personal analytics | Y | P | **N (removed)** | P | N | Y | Y | ? | Y | N | N | Y |
| **Commercial** | | | | | | | | | | | | |
| Ad-free free tier | Y | **N** | Y | P | **Y** | Y | Y | Y | Y | Y | Y | Y |
| No daily expense cap on free | Y | **N** | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| One-time purchase option | N | N | n/a | P (lifetime) | **Y** | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Multi-currency + auto FX | Y | P | Y | Y | **Y (150+)** | Y | ? | ? | ? | N | N | Y |

**Reading the matrix:** Splitify wins decisively on exactly one axis — **"Beyond splitting."** It is the only app in the study with personal tracking + bank sync + budgets + subscriptions + net worth + AI assistant in one binary. It is at parity or behind on **every splitting-specific axis**, and it has open question marks on the two that matter most in India: UPI deep-link settlement and offline use.

---

# SECTION 8 — User Reviews Analysis

### 8.1 Method and honesty statement

**Sources mined:** Apple App Store (US and India listings), Google Play (via AppBrain, AppstoreSpy, Similarweb — Google Play blocks direct server fetches), Splitwise's own public feedback forum (vote-counted, the highest-quality signal available), Product Hunt, Trustpilot (via secondary citation — trustpilot.com returned HTTP 403), competitor comparison blogs, and Reddit/forum discussion surfaced via search indexes.

**Four limitations you must carry into any decision made on this section:**

1. **These are qualitative frequencies from a non-random, self-selecting sample. They are not statistics.** People who write app reviews are disproportionately angry or delighted. No percentage in this section should be quoted as a market measurement.
2. **Direct Reddit thread access was not obtainable** through the available search tooling; Reddit signal here is second-hand via search-index summaries and comparison blogs. Weight it lower than the App Store and the Splitwise feedback forum.
3. **Competitor-authored blogs (Niptao, FairShare, AreWeEven, Splitty, Spliit.pro, SplitterUp, Split-Circle, Splital, NomadCrew) are a large share of the indexed writing about Splitwise's failings.** These are content-marketing assets by rivals. They are *directionally* corroborated by the App Store and the vote-counted feedback forum, which is why the themes below survive — but their specific numbers are unreliable and are marked [E] throughout.
4. **A striking structural observation:** an entire cottage industry of "Splitwise alternative" apps now exists whose *founding premise is Splitwise's free-tier restriction*. Spliit's own blog states it was built as a response to it ([source](https://spliit.app/blog/we-need-an-open-source-alternative-to-splitwise)). One Product Hunt reviewer literally wrote *"Limiting the free tier led me to build this"* ([Product Hunt](https://www.producthunt.com/products/splitwise/reviews)). **The market's discontent is real enough to have spawned a dozen products.** That is both the opportunity and the warning — the opportunity is already crowded.

**Frequency scale used:**

| Level | Definition |
|---|---|
| **Very High** | Recurs across 5+ independent source types; dominant theme; appears unprompted at the top of most discussions |
| **High** | Recurs across 3–4 independent source types |
| **Medium** | Recurs across 2 source types, or appears repeatedly within one |
| **Low** | Observed but isolated; 1 source type, few instances |

### 8.2 Splitify's own review corpus — the honest report

**There is essentially nothing to analyse. This is the finding.**

| Source | What exists | Verdict |
|---|---|---|
| App Store India | **18 ratings, 4.4★** | Statistically meaningless |
| App Store US | **4 ratings, 3.0★** | Statistically meaningless |
| **Total worldwide iOS ratings** | **~22** | **Pre-traction** |
| Google Play | Could not confirm a Findat-published listing exists | Unverified |
| Reddit | **Zero organic discussion found** | No community footprint |
| Product Hunt | **No listing found** | No launch footprint |
| X / Twitter | **No organic discussion found** | No social footprint |
| YouTube | **No reviews found** | No creator coverage |
| Press / blogs | **No independent coverage found.** All descriptive text traces back to Splitify's own store copy | No earned media |

The only visible review content is two App Store blurbs. Paraphrasing rather than quoting at length: one calls it clean, ad-free and easy, singling out the **free bill-scanning** as the standout; another frames it as free with more features than Splitwise ([App Store IN](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540)).

**Analytical caution [A]:** with a corpus of 18 ratings on a weeks-old app, early reviews correlate strongly with founder-adjacent networks. Both surfaced blurbs read as feature-list restatements and both lead on the same "free scanning" hook. **Do not treat the 4.4★ as product validation.** It is a number without a denominator.

**One genuine signal worth keeping:** the 4.4★ (IN) vs 3.0★ (US) gap. Four US ratings is far too small to be conclusive, but it is directionally consistent with the strategic read — the product resonates in India and does not yet have a US-market reason to exist. **[E]/[A]**

### 8.3 Category-wide analysis — Splitwise, where the exploitable discontent lives

#### 8.3.1 Negative feedback and complaints

| # | Theme | Frequency | Evidence | What it means for Splitify |
|---|---|---|---|---|
| 1 | **Daily expense cap on the free tier (~3/day)** — users get locked out mid-trip after a group dinner | **Very High** | [Split-Circle](https://split-circle.com/en/blog/splitwise-daily-limit), [Splitty](https://splittyapp.com/learn/splitwise-free-limits/), [AreWeEven](https://www.areweeven.com/blog/why-people-switching-from-splitwise), [Product Hunt](https://www.producthunt.com/products/splitwise/reviews), [NomadCrew](https://nomadcrew.uk/blog/splitwise-daily-expense-limit-free-alternatives/) | **The single most exploitable weakness in the category.** Also the most contested — everyone is already attacking it |
| 2 | **Ads in the free tier**, including interstitials between entries | **Very High** | [AreWeEven](https://www.areweeven.com/blog/why-people-switching-from-splitwise), [Splitty](https://splittyapp.com/learn/splitwise-vs-splid-vs-settleup/) | Ad-free free tier is now table stakes, not a differentiator |
| 3 | **"Bait-and-switch" resentment** — features that were free became paid | **High** | [AreWeEven](https://www.areweeven.com/blog/why-people-switching-from-splitwise), [Spliit blog](https://spliit.app/blog/we-need-an-open-source-alternative-to-splitwise) | Trust, once spent, does not come back. Splitify must **publish its free-tier limits up front** |
| 4 | **No UPI integration in India** — settling means leaving the app, opening GPay, finding the ID, typing the amount | **Very High (India)** | [Splitwise feedback forum, 458 votes, "Under review"](https://feedback.splitwise.com/forums/162446-general/suggestions/15872739-is-it-possible-to-integrate-upi-unified-payment-s); [Tricount blog](https://tricount.com/en-us/blog/top-splitwise-alternatives-in-india-2025-which-app-should-you-switch-to) | **The India wedge.** Note: also the wedge Niptao, FairShare, Splitkaro and (formerly) goDutch all chose |
| 5 | **Requiring every participant to install and register** kills adoption | **High** | [AreWeEven](https://www.areweeven.com/blog/why-people-switching-from-splitwise); [App Store review re: solo-household use](https://apps.apple.com/us/app/splitwise/id458023433); Splitwise feedback forum "add friends without contact info" — **625 votes** | Splid and Spliit win precisely here. **Splitify's iOS-18 floor makes this worse, not better** |
| 6 | **Dated, cluttered, deeply nested navigation** | **High** | [AreWeEven](https://www.areweeven.com/blog/why-people-switching-from-splitwise), [UX Collective case study](https://uxdesign.cc/splitwise-a-ux-case-study-dc2581971226) | Real but shallow — UI freshness is copyable in a sprint. Not a moat |
| 7 | **"Simplify debts" is confusing** — people don't understand owing someone they never transacted with; buried in settings; **web-only, absent from mobile** | **Medium–High** | [Splitwise feedback forum thread](https://feedback.splitwise.com/forums/162446-general/suggestions/3579249-simplify-debt-for-ios-app) (Splitwise itself concedes the usability problem) | **Underexploited.** Every rival attacks pricing; almost nobody attacks the settlement-math UX |
| 8 | ~~**Price in India — ₹2,499/yr**~~ **CORRECTED: Splitwise is regionally priced in India (₹49–₹1,199).** Price is a **US/EU** complaint, not an India one | Medium (not India-specific) | [App Store IN](https://apps.apple.com/in/app/splitwise/id458023433) [F] | **Splitify has ~no price advantage in India** — near parity. Its real advantage is in the US ($19.99 vs $39.99). See §15.1 |
| 9 | **Trustpilot ~1.8/5 with ~65% one-star** (cited as of Mar 2026) | **Medium** | [via Split-Circle](https://split-circle.com/en/blog/splitwise-daily-limit) — **trustpilot.com returned HTTP 403; unverified at source [E]** | Do not use in any public-facing material without direct verification |
| 10 | **Weak iPad / large-screen support** | **Low–Medium** | [App Store review](https://apps.apple.com/us/app/splitwise/id458023433) — paraphrased: reviewer resorts to the phone to review finances | Niche but cheap to win |
| 11 | **Currency conversion limitations / unclear distribution** | **Medium** | [Product Hunt](https://www.producthunt.com/products/splitwise/reviews) | Splid's 150+ currency handling is the benchmark |
| 12 | **10-second cooldown between expense entries** on free | **Medium** | [Splitty](https://splittyapp.com/learn/splitwise-vs-splid-vs-settleup/) [E] | Deliberate friction as a conversion tactic — the most resented single design choice |

#### 8.3.2 Positive feedback and most-loved features

| # | Theme | Frequency | Evidence |
|---|---|---|---|
| 1 | **Split flexibility** — equal, exact, percentage, shares | **Very High** | [Product Hunt](https://www.producthunt.com/products/splitwise/reviews): *"you can split equally, by exact amounts, by percentages, shares"* |
| 2 | **It removes money friction from relationships** — the emotional job-to-be-done | **Very High** | Praised by NYT and FT per [AppstoreSpy listing summary](https://appstorespy.com/android-google-play/com.Splitwise.SplitwiseMobile-trends-revenue-statistics-downloads-ratings) |
| 3 | **Reliability of the running ledger over months/years** | **High** | [Product Hunt](https://www.producthunt.com/products/splitwise/reviews) |
| 4 | **Network effect — "everyone already has it"** | **Very High** | Implicit across all comparison content; the reason switching costs exist |
| 5 | **Offline operation** (Splid, Settle Up) | **High** | [App Store — Splid](https://apps.apple.com/us/app/splid-split-group-bills/id991473495): *"works perfectly offline"* |
| 6 | **No-account / no-signup entry** (Splid, Spliit) | **High** | [splid.app](https://splid.app/english), [Spliit GitHub](https://github.com/spliit-app/spliit) |
| 7 | **One-time purchase instead of subscription** (Splid) | **High** | [App Store — Splid](https://apps.apple.com/us/app/splid-split-group-bills/id991473495): *"not a subscription app"* |
| 8 | **Fewest-transfers settlement algorithm** (Settle Up) | **Medium** | [App Store — Settle Up](https://apps.apple.com/us/app/settle-up-group-expenses/id737534985): *"calculates the fewest possible transfers to settle all debts"* |
| 9 | **Weighted participants** (Settle Up) | **Medium** | [App Store — Settle Up](https://apps.apple.com/us/app/settle-up-group-expenses/id737534985) — a couple as value 2, singles as 1 |
| 10 | **Longevity / trust** (Splid) | **Medium** | [App Store — Splid](https://apps.apple.com/us/app/splid-split-group-bills/id991473495): *"I've been using Splid since 2018"* |

#### 8.3.3 Most-requested improvements — vote-counted, the highest-quality data in this report

Splitwise's public feedback forum is the only source here with **hard vote counts** rather than impressionistic frequency. This is the closest thing to a ranked demand signal that exists for the category.

| Rank | Request | Votes | Status | Splitify implication |
|---|---|---|---|---|
| 1 | **In-app calculator when entering a bill** | **955** | Started | The #1 request in the entire category is a **calculator**. Trivially cheap. **Ship it** |
| 2 | **Add friends by name only, without email/phone** | **625** | Under review | Directly addresses the onboarding-friction complaint. High value, low cost |
| 3 | **UPI payment integration** | **458** | Under review | **Open for years. Still unshipped. This is the India door standing open** |
| 4 | Plates (bill-splitting companion app) for Android | 350 | Planned | Low relevance |
| 5 | Refunds / reimbursements in mobile | 283 | Under review | Real ledger gap |
| 6 | PayMe by HSBC (Hong Kong) | 262 | Under review | Confirms the pattern: **local payment rails are the top regional ask everywhere** |
| 7 | Square Cash integration | 250 | Blocked (no API) | — |
| 8 | Dark mode | 233 | Started | Table stakes |

Source: [Splitwise feedback forum, mobile category, sorted by votes](https://feedback.splitwise.com/forums/162446-general?category_id=52890) [F]

**The pattern across ranks 3 and 6:** the highest-voted *integration* requests are both **non-US local payment rails**. Splitwise is a US company that has under-served every non-US market's settlement layer for a decade. That is the category's largest structural blind spot, and it is exactly where Splitify's home market sits.

Additional recurring requests seen outside the forum: bringing **"simplify debts" to mobile** ([forum](https://feedback.splitwise.com/forums/162446-general/suggestions/3579249-simplify-debt-for-ios-app)); **solo/personal-mode** use of a splitting app ([App Store](https://apps.apple.com/us/app/splitwise/id458023433)) — which Splitify already satisfies and Tricount just *removed*; and **export without a paywall** (Settle Up's positioning, and now a fresh Tricount gap).

#### 8.3.4 Most-hated UX, ranked

| Rank | UX pain | Frequency | Who does it well |
|---|---|---|---|
| 1 | Being blocked from entering an expense you just incurred | **Very High** | Splid, Tricount, Settle Up, Splitkaro (all uncapped) |
| 2 | Ads interrupting the expense-entry flow | **Very High** | Splid, Tricount, Niptao, FairShare (all ad-free) |
| 3 | Signup wall before you can do anything | **High** | Splid (no account at all), Spliit (link-share), Settle Up (browser join) |
| 4 | Leaving the app to actually pay | **Very High (India)** | Niptao, FairShare, Splitkaro (UPI deep-link) |
| 5 | Enforced 10-second wait between entries | **Medium** | Everyone else |
| 6 | Deep nesting to reach common actions | **High** | Splid, Tricount |
| 7 | Settlement math that users can't follow | **Medium–High** | **Nobody has solved this. Open ground** |
| 8 | Feature exists on web but not mobile | **Medium** | — |

### 8.4 Cross-cutting synthesis

**[A] Three conclusions that follow from the review evidence:**

1. **The category's core product is a commodity.** A free open-source clone (Spliit), a 12.5 MB no-account app (Splid) and a bank-subsidised free app (Tricount) all deliver the core job at 4.8–4.9★. **Nobody will pay for splitting.** They will pay — if at all — for what surrounds it. Splitify's all-in-one bet is the correct read of this. Its execution risk is that all-in-one means competing with Splitwise *and* the entire India PFM sector at once.

2. **"Attack Splitwise's free tier" is a saturated strategy.** Splital, Spliit, NomadCrew, AreWeEven, Splitty, SplitterUp, Split-Circle, Niptao, FairShare and Tricount are all running it. Being cheaper and uncapped than Splitwise is now the *floor*, not a differentiator.

3. **The genuinely under-attacked gaps are three:** (a) **settlement-math legibility** — "simplify debts" is universally confusing and nobody has fixed it; (b) **export and data portability** — Tricount just deleted CSV/PDF export and Statistics from a 14M-download product, stranding those users *right now*; (c) **personal + shared finance in one ledger** — Tricount also just removed Personal mode, and Splitwise never had it. Splitify already ships (c) and is uniquely positioned for (b).

---

# SECTION 9 — Competitive SWOT

Scoped to **Splitify specifically**, not the category.

### Strengths

| # | Strength | Reasoning | Confidence |
|---|---|---|---|
| S1 | **Only app combining splitting + personal finance + bank sync + budgets + net worth + AI assistant** | Verified against every competitor in §7.5. Splitwise has none of it; Tricount just *removed* Personal mode and Statistics; Splid/Spliit/Settle Up are pure splitters. The one axis where Splitify is not merely competitive but alone | **High** [F] |
| S2 | ~~₹999/yr is 60% cheaper than Splitwise in India~~ **WITHDRAWN.** Splitwise's India IAPs are ₹49–₹1,199 [F] — Splitify is at **rough price parity in India**, and ~50% cheaper only in the **US**. Local rival Splitkaro starts at ~₹450/yr | This strength does not survive primary-source verification. Splitify's price story works in a market it is not built for | **Withdrawn** — see §15.1 |
| S3 | **"Import from Splitwise" removes the single largest switching cost** | The category's moat is accumulated ledger history. Splitify attacks it directly, timed against peak Splitwise discontent | **High** [F] |
| S4 | **Release velocity — shipping every few days, v1.4.11** | Splitwise ships monthly at ~50 staff. Splitify can close feature gaps faster than incumbents can respond. The #1 category request (a calculator, 955 votes) is days of work | **High** [F] |
| S5 | **Ad-free free tier with no published daily cap** | Directly neutralises the two Very High complaints against the incumbent | **Medium** — free-tier limits are not published; unverifiable [A] |
| S6 | **India-first focus with founders in-market** | The forum evidence shows Splitwise has left UPI "Under review" for years. Local teams see local settlement problems first | **Medium** [A] |
| S7 | **AI receipt scanning free, where Splitwise caps it at ~3 scans/week** | The one feature both surfaced Splitify reviews lead with | **Medium** ([E] on the Splitwise cap) |

### Weaknesses

| # | Weakness | Reasoning | Severity |
|---|---|---|---|
| W1 | **~22 iOS ratings worldwide. No Reddit, Product Hunt, YouTube, X or press footprint whatsoever** | Not a small brand — **no brand**. Splitkaro, a free domestic rival, has ~11,500 ratings. Splitwise has ~217,000. Roughly a **500x gap to the nearest Indian competitor** | **Critical** [F] |
| W2 | **iOS 18.0 minimum** | Self-inflicted. Excludes iPhone X and older plus every non-upgrader. In a product whose value requires *the whole group* to join, gating on the newest OS breaks the network-effect loop. Splid ships iOS 16+. **The single most fixable critical error found** | **Critical** [F] |
| W3 | **No confirmed UPI deep-link settlement** | The #1 India-specific complaint (458 forum votes), the wedge every India rival already owns, and — post-NPCI-Oct-2025 — the *only* surviving P2P settlement mechanic. If absent, the India thesis has no floor | **Critical if true** [A] — verify immediately |
| W4 | **Brand-name collision, twice over** | `Splitify, LLC` (US) publishes a near-identical AI-budget-plus-bill-split product, now renamed "Cove" — 4.4★/7 ratings ([App Store](https://apps.apple.com/us/app/splitify-splits-and-expenses/id6736849874)). Plus ≥2 unrelated `splitify` packages on Google Play. Trademark and store-search ranking both compromised pre-traction | **High** [F] |
| W5 | **114.8 MB against Splid's 12.5 MB** | ~9x the size for a utility. On India's mid-tier Android base and metered data, install size is a measurable conversion tax | **Medium–High** [F] |
| W6 | ~~Android presence unconfirmed~~ **RESOLVED — not a weakness.** Android is confirmed (`com.akhash.splitify`) and **launched first**, 23 Jul 2025, on a permissive Android 8.0 minimum | Splitify got this right. The iOS-18 gate (W2) remains a genuine and separate error | **Void** [F] |
| W7 | **Bank sync carries permanent RBI Account Aggregator compliance cost** | AA integration means consent architecture, data-security obligations and dependence on a licensed NBFC-AA ([RBI 2025 Directions](https://taxguru.in/rbi/rbi-non-banking-financial-companies-account-aggregator-directions-2025.html)). Pure splitters carry none of this. Splitify's differentiator is also its heaviest cost centre | **Medium–High** [F] |
| W8 | **Competing in two markets at once with one small team** | Bill-splitting *and* Indian PFM (against Walnut, Jupiter, Fi, CRED, moneyview). Two crowded markets, one runway | **High** [A] |
| W9 | **3.0★ from 4 US ratings** | Statistically void, but the only US signal that exists, and it is negative | **Low–Medium** [F] |
| W10 | **Subscription model in a category that has repeatedly proven it won't subscribe** | Splid monetises one-time at $3.99 and holds 4.9★. Tricount abolished Premium. Splitwise's subscription is its most-hated attribute. Splitify is charging recurring in the one category actively rejecting recurring | **High** [A] |
| W11 | **No disclosed funding** | Every serious competitor is funded or bank-owned. goDutch had $1.7M from YC and Matrix and still died | **Medium** [A] |

### Opportunities

| # | Opportunity | Reasoning | Attractiveness |
|---|---|---|---|
| O1 | **NPCI killed P2P collect requests (1 Oct 2025) — the mechanic Google Pay's bill-split depends on** | The largest-distribution India competitor just had its settlement loop broken by the regulator. Payer-initiated UPI deep-links are the only P2P path left. **A regulator-created opening with a limited window** | **Very High** [F] |
| O2 | **Tricount just deleted CSV/PDF export, Personal mode, Statistics and saved custom splits from a 14M-download base** ([source](https://help.tricount.com/articles/what-happened-with-tricount-premium)) | Millions of users lost features **in the last two months**. Splitify already ships personal mode and analytics. A "Tricount removed it, we have it — import here" campaign is a ready-made, time-boxed acquisition play | **Very High** [F] |
| O3 | **The #1 category request is an in-app calculator (955 votes) and it is still not shipped** | Days of engineering to lead the category's most-wanted feature. Ship it, then say so | **High** [F] |
| O4 | **Settlement-math legibility is unsolved by everyone** | Splitwise concedes "simplify debts" confuses users, keeps it buried in settings, and hasn't brought it to mobile. Every rival is fighting on price. **A genuinely visual, explainable "who pays whom and why" is open ground and harder to copy than a price cut** | **High** [F] |
| O5 | ~~Splitwise's India pricing is exposed~~ **DOWNGRADED.** Splitwise prices India locally (₹49–₹1,199) [F]. What remains exposed is its **free-tier cap, its ads, and its missing UPI** — not its price | Attack the experience, not the price tag | **Low–Medium** [F] |
| O6 | **India-specific receipt intelligence — GST-format bills, Swiggy/Zomato/Blinkit orders** | FairShare (GST-aware scanning) and Splitkaro (auto-fetch from delivery apps) prove demand. Splitify has AI scanning already; localising the parser is incremental | **Medium–High** [F] |
| O7 | **Asia-Pacific is the fastest-growing region on mobile-wallet and QR adoption** | 360iResearch names APAC "one of the most dynamic regions"; India is its largest UPI market | **Medium** [E] |
| O8 | **The active Splitwise-migration moment** | Import already built, discontent at a peak, an entire content ecosystem generating switching intent Splitify can capture rather than create | **High** [F] |
| O9 | **Every incumbent's export story just got worse** | Tricount removed it, Splitwise paywalls it, Splid gates it behind Plus. Free unlimited export is cheap to build and a credible trust signal in a category burned by bait-and-switch | **Medium** [F] |

### Threats

| # | Threat | Reasoning | Severity |
|---|---|---|---|
| T1 | **Tricount is free forever and bank-subsidised** | 14M downloads, 4.81★, no revenue pressure because bunq monetises via banking. **It cannot be out-priced by anyone who needs revenue.** If bunq takes India seriously, Splitify's pricing wedge evaporates overnight | **Very High** [F] |
| T2 | **Splitkaro already occupies the India-first position Splitify is targeting** | ~340K downloads, 8.1K Android + 3.4K iOS ratings, free, item/ratio splits, delivery-app receipt fetch, **and Indus Appstore distribution**. Not a future threat — an incumbent Splitify must displace | **Very High** [E] |
| T3 | **goDutch is the precedent** | $1.7M from Y Combinator, Matrix Partners India and GFC; UPI-native from launch; 2020 start. Now 3 lifetime iOS ratings under an unrelated developer. **Being India-first, UPI-native and well-funded was not sufficient** | **Very High** [F] |
| T4 | **UPI apps could absorb splitting natively at any time** | GPay, PhonePe and Paytm own the payment moment. Venmo Groups and Cash App Pools show payment networks bolt splitting on for free once it matters. **The whole category is one product decision away from commoditisation** | **High** [F] |
| T5 | **Splitwise ships UPI** | 458 votes, "Under review", ~$26–30M raised, ~50 staff. If it ships, Splitify's clearest India differentiator disappears and the network effect reasserts | **High** [F] |
| T6 | **Free rivals define the price of splitting as zero** | Tricount, Splitkaro, Niptao, FairShare, Spliit — all free. Splid at a one-time $3.99 with 4.9★. **Splitify must justify a subscription in a market with five credible free options** | **Very High** [F] |
| T7 | **Bank-sync and AI raise trust requirements a 22-rating app cannot meet** | Asking for bank-account access requires brand trust Splitify has not earned. **The all-in-one strategy needs credibility the traction level cannot supply — a chicken-and-egg problem, and the sharpest strategic tension in the business** | **High** [A] |
| T8 | **Name collision with an incumbent US "Splitify, LLC"** | Trademark exposure, store-search dilution, and if the US entity has priority, a forced rename after any brand investment | **Medium–High** [F] |
| T9 | **Total category revenue is small** | Splitwise, the leader, at ~$6.6M after $26–30M raised and 15 years. **The ceiling for a pure play is low.** Splitify must win PFM, not splitting — a far harder, better-capitalised fight | **High** [E] |
| T10 | **Comparison-SEO arms race** | Niptao and FairShare run dedicated `/vs/` page farms. Splitify has no content footprint and is being out-marketed on the exact keywords its buyers search | **Medium** [F] |
| T11 | **Sustained AA/RBI compliance burden** | Regulatory cost on the differentiating feature, borne with no visible funding | **Medium** [F] |

### 9.1 Realistic market position — blunt assessment

**Splitify is pre-traction. Not "early-stage" — pre-traction.**

| Benchmark | Total ratings (all stores, approx.) | Multiple vs Splitify |
|---|---|---|
| Splitwise | ~217,000 | **~9,900x** |
| Tricount | ~150,000 | **~6,800x** |
| Splitkaro (India, free) | ~11,500 | **~520x** |
| Splid | ~3,900 (iOS alone) | **~180x** |
| Settle Up | ~1,700 (iOS alone) | **~77x** |
| **Splitify** | **~22** | **1x** |

Sources: [Splitwise App Store](https://apps.apple.com/us/app/splitwise/id458023433) + [AppBrain](https://www.appbrain.com/app/splitwise/com.Splitwise.SplitwiseMobile); [Tricount AppBrain](https://www.appbrain.com/app/tricount-split-settle-bills/com.tribab.tricount.android); [Splitkaro AppBrain](https://www.appbrain.com/app/splitkaro-split-expenses/com.bsquare.splitkaro); [Splid App Store](https://apps.apple.com/us/app/splid-split-group-bills/id991473495); [Settle Up App Store](https://apps.apple.com/us/app/settle-up-group-expenses/id737534985); [Splitify App Store IN](https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540).

**What this actually means:**

- **Splitify has no market position.** It has a product. Those are different things. It is not the #10 player in India — it is not yet measurable.
- **It is losing to free domestic competitors it may not know about.** Splitkaro was absent from the brief and has ~520x the rating volume, is free, ships item and ratio splits, auto-fetches from delivery apps, and distributes through Indus Appstore. Any competitive plan that omits Splitkaro is incomplete.
- **The strategy is sound; the execution has three critical, fixable errors.** All-in-one is the right read of a commoditised category (§8.4). But: iOS 18 minimum (W2), unconfirmed Android (W6), and unconfirmed UPI deep-links (W3) each independently invalidate the India thesis. **Resolve all three before anything else. Nothing else on this list matters if these are unresolved.**
- **The window is real but short.** Tricount's June 2026 feature removals and the NPCI October 2025 settlement change are both **live, dated, decaying opportunities**. Six to twelve months, not years.
- **Do not compete on price against free.** Five credible free competitors exist, and the price wedge against Splitwise **does not exist in India at all** (₹999 vs ₹999–1,199) — only in the US ($19.99 vs $39.99). The defensible ground is the bundle (S1), the migration path (S3), and settlement-math legibility (O4) — not the price tag.
- **The core tension, stated plainly:** the all-in-one bundle is the only genuine differentiator, and it is also the thing that most requires user trust — bank credentials, transaction history, AI reading finances. **A 22-rating app cannot ask for that.** Splitify must earn trust with the free splitter first and sell the bundle second. Leading with bank sync at this stage inverts the funnel.

**Realistic 12-month ceiling [A]:** with the three critical fixes shipped, an Android launch, UPI deep-links, and disciplined execution on the Tricount-refugee and Splitwise-migration moments, a credible target is **Splitkaro's current position — low hundreds of thousands of downloads, single-digit-thousands of ratings.** That would be genuine success. It would still be ~2% of Splitwise's scale. Any projection above that is not supported by the evidence in this report.

---


---

# SECTION 10 — Feature Gap Analysis: Bakaya vs Splitify

## 10.1 Method and honesty note

**Bakaya's column is derived from the code at HEAD `321cb99`, not from your description of the product.** Every status is backed by a file:line citation in Appendix A. Where a feature is present but lossy, thin, or non-functional, it is marked **PARTIAL** with the specific defect named — a feature that exists in `package.json` but is wired to nothing is not a feature.

**Splitify's column** is marked **[C]** confirmed (observed in a screenshot, policy, or vendor-controlled file), **[V]** vendor-claimed but unverified, or **N** not found.

**Scoring scales:**

| Column | Scale |
|---|---|
| **Importance** | Critical / High / Medium / Low — to *Bakaya's* users and strategy, not to the category in the abstract |
| **Difficulty** | XS (<1 day) · S (1–3 days) · M (1–2 weeks) · L (3–6 weeks) · XL (quarters, or blocked by licensing) |
| **Priority** | P0 ship-blocker · P1 next · P2 this quarter · P3 later · P4 explicitly not now |
| **Business impact** | The mechanism by which it makes money or keeps users, stated concretely |

## 10.2 The ship-blockers — these are not features

These four outrank everything else in this report. Three are defects; one is a store-approval blocker.

| # | Item | Bakaya | Splitify | Importance | Difficulty | Priority | Business impact |
|---|---|---|---|---|---|---|---|
| B1 | **`/api/v1/users` CRUD is authenticated but not role-gated** — any logged-in user can list and mutate other users (`routes/index.ts:89-93`; `user.controller.ts` never checks `role === "admin"`) | **BROKEN** | n/a | **Critical** | XS | **P0** | A user-data breach ends the product. Not in any of your existing audit docs |
| B2 | **Production mobile build cannot boot** — `EXPO_PUBLIC_API_URL: ""` in the production EAS profile, and `constants/api.ts:24-26` throws when unset outside dev | **BROKEN** | n/a | **Critical** | XS | **P0** | You cannot ship at all until this is fixed |
| B3 | **No Apple Sign-In** — `authProvider` enum is `["local","google"]` | **NO** | N | **Critical** | S | **P0** | Apple requires Sign in with Apple wherever third-party SSO is offered. **Blocks App Store approval outright** |
| B4 | **iOS push is dead** — `getDevicePushTokenAsync()` returns an APNs token that firebase-admin cannot target (`lib/push.ts:5-8`) | **NO** | [C] FCM | **High** | M | **P0** | Push is the category's entire retention engine. Half your platforms have none |

## 10.3 Core splitting — where you are at or near parity

| Feature | Bakaya | Splitify | Importance | Difficulty | Priority | Business impact |
|---|---|---|---|---|---|---|
| Create group, add members | **YES** | [C] | Critical | — | — | Table stakes, shipped |
| Split equally | **YES** — server auto-split with floor-to-paise + remainder handling | [C] | Critical | — | — | Shipped, and the remainder handling is correct |
| Split by exact amount | **YES** — server validates sum ±0.01 | [V] | Critical | — | — | Shipped |
| Split by percentage | **PARTIAL** — client computes amounts; **no `splitType` on the model**, so the mode is lost on save and guessed on edit by a `<0.02` heuristic. Percentage silently degrades to exact. Same defect on web | [V] | **High** | S | **P1** | A user who set 60/40 reopens it and sees "exact". Silent data loss in a money app is a trust defect, not a UI nit |
| Split by shares / weights | **NO** | [V] | Medium | S | P2 | Settle Up's weighted-participants (a couple counts as 2) is a named, loved feature. Cheap once `splitType` exists |
| Item-wise split from a receipt | **NO** | [C] | Medium | L | P3 | Commoditised — Splitify, Splitwise Pro, Splitkaro, FairShare all ship it. Not a differentiator |
| Multiple payers on one expense | **NO** | ? | Low | M | P3 | Splid ships it; rarely requested elsewhere |
| Track balances | **YES** — 3 Mongo aggregations, correctly bounded to ≤N rows | [C] | Critical | — | — | Shipped and scales |
| Settle up | **YES** | [C] | Critical | — | — | Shipped |
| **Partial payments** | **YES** — any amount ≤ outstanding pairwise balance; overpayment rejected server-side | [V] | High | — | — | Shipped, and better-guarded than most |
| Debt simplification / suggested transfers | **PARTIAL** — greedy matcher **client-side only**, filtered to debts *you* owe, absent from web and server | N | **High** | M | **P1** | See §10.7 — this is an open competitive lane, not just a gap |
| Settlement confirmation by counterparty | **NO** — settlement is a unilateral assertion, no status field | N | Medium | M | P2 | "I paid you" / "I never got it" is the #1 settlement dispute |
| Expense history | **YES** — paginated with totals | [C] | Critical | — | — | Shipped |
| Group roles (admin/member) | **YES** — enforced on update, invite, member removal, expense edit/delete | N | Medium | — | — | **You are ahead here.** Splitify shows no evidence of roles |
| Promote/demote a member | **NO** — role is hardcoded `"member"` at join; the creator is the only admin, forever | N | Low | S | P3 | Bites when a group creator leaves |

## 10.4 Growth-critical gaps — the viral ceiling

This block matters more than any feature in §10.5. Your invite mechanism structurally caps growth.

| Feature | Bakaya | Splitify | Importance | Difficulty | Priority | Business impact |
|---|---|---|---|---|---|---|
| **Invite by link / QR** | **NO** — no token on `GroupInvitation`, no route | [C] — `/join/*` deep links with a web landing page, store fallback, and cryptographically verified Android App Links | **Critical** | M | **P1** | Splitify beats you here decisively |
| **Invite someone without an account** | **NO** — `invitedUserId` is **required**; `invitation.service.ts:34-35` throws "No registered user with that email" | [C] contact-book invite, but invitee must still clear a name+email+**verified phone** wall | **Critical** | M | **P1** | **This is your hard viral ceiling.** You cannot add a friend who has not already signed up. Splid and Spliit win precisely here; Splitwise lets you split with someone *before* they sign up |
| Placeholder / local participants | **NO** | N | High | M | P2 | Tricount and Settle Up create a usable group with free-text names and no accounts at all |
| **Web-viewable balance, no install** | **NO** | N | **High** | M | **P1** | Removes the single largest leak in the funnel (invite → install). Spliit's entire growth model. Costs one route on a site you already run |
| Contact-book friend discovery | **NO** | [C] | Medium | M | P3 | Carries a permission cost; defer |
| Referral programme | **NO** | N | Low | M | **P4** | Incentivised referral before product-market fit buys installs that churn |

## 10.5 Settlement and payments

| Feature | Bakaya | Splitify | Importance | Difficulty | Priority | Business impact |
|---|---|---|---|---|---|---|
| **UPI deep-link settle-up** | **NO** — in an INR-hardcoded, India-only app | **N** | **Critical** | S | **P1** | The #1 India complaint against Splitwise (458 forum votes, "Under review" for years). **Neither you nor Splitify has it.** Post-NPCI it is the only surviving P2P mechanic — see §7.2 |
| UPI transaction-reference capture | **NO** | N | High | M | P2 | The step *past* parity — Indian rivals deep-link but discard the response payload. See §22 idea #3 |
| Venmo / PayPal | **NO** | N | Low | — | **P4** | US-only, irrelevant |
| Payment reminders / nudges | **NO** | [V] | High | M | **P1** | The category's core retention mechanic. You have push infrastructure and only 3 triggers |
| Record manual settlement | **YES** | [C] | Critical | — | — | Shipped |

## 10.6 Where Bakaya is *ahead* of Splitify

Do not lose these while chasing the gap list.

| Feature | Bakaya | Splitify | Why it matters |
|---|---|---|---|
| **The `Profile` primitive** | **YES** — a private, per-user roster of named real people who need not be users, with per-profile ledgers and 3 of 5 analytics endpoints built around it | **N** | **Nobody in this category has this.** Detailed in §10.8 |
| Group roles and permission enforcement | **YES** | N | Splitify shows no evidence of admin gating |
| Free CSV export | **YES** — streaming, 50k cap | **N** — imports from Splitwise, exports nothing. A deliberate lock-in signal | Tricount just *deleted* export; Splitwise paywalls it. Free export is a cheap, credible trust signal in a category burned by bait-and-switch |
| Server-validated settlement cap | **YES** — overpayment rejected via `computePairwiseOwed` | ? | Correctness others get wrong |
| Refresh-token rotation + deduped silent retry | **YES** | ? | Genuinely good engineering |
| **No ad-tracking, no bank access, no SMS reading** | **YES (by omission)** | Declares all three | **Your strongest untold story.** See §21 |

## 10.7 The three under-attacked lanes

[I] Category-wide review analysis surfaced exactly three gaps that everyone else is *not* fighting over. Every other rival is fighting on price and free-tier limits, which is saturated.

| Lane | Evidence it is open | Bakaya's position |
|---|---|---|
| **Settlement-math legibility** | Splitwise concedes "simplify debts" confuses users, keeps it buried in settings, and has never brought it to mobile (feedback forum thread). Users report owing someone they never transacted with | You have a greedy matcher already — but client-side, one-directional, and absent from web. **Finishing it properly and making it *explainable* is open ground and harder to copy than a price cut** |
| **Data portability** | Tricount deleted CSV/PDF export from a 14M-download product in June 2026. Splitwise paywalls it. Splid gates it | You already ship free CSV. **Extend to group expenses and say so loudly** |
| **Personal + shared in one ledger** | Tricount removed Personal mode; Splitwise never had it; Splid/Spliit/Settle Up are pure splitters | **You already have both halves in one schema.** Splitify is the only other player here, and it needs a bank connection to do what you can do from your own data |

## 10.8 The Profile differentiator — assessed honestly

**What it is.** A `Profile` is a named spending bucket owned by one user — `{name, relationship, avatar, color, isDefault}` — not a second login and not another person's account. Every personal expense carries a `profileId`. The user creates "Mom", "Dad", "Home", "Kids", and gets a per-profile ledger with its own date range, category filter, and net balance.

**Why it is genuinely distinctive.** It serves the Indian joint-household pattern that no splitter serves: **one person pays for many people who are not and never will be app users.** The son with the salary wants to know he spent ₹8,400 on Mom this month, without asking Mom to install anything, create an account, or settle a balance. That is expense *attribution within one wallet* — orthogonal to expense *splitting between wallets*, which is the only thing the entire category models.

Every competitor's data model assumes the counterparty is an account. Yours does not. That asymmetry is the moat.

**Why it does not yet pay off.** Two structural gaps hollow it out:

| Gap | Evidence | Consequence |
|---|---|---|
| **`GroupExpense` has no `profileId`** | `models/GroupExpense.ts:37-74` | Profile attribution vanishes the instant money enters a group. You cannot answer "how much of the Goa trip was Mom's share" — precisely the question the concept promises to answer |
| **Analytics never reads group data** | `analytics.service.ts:1` — every pipeline queries `Expense` only; `GroupExpense` is never joined | Half the product is invisible to its own analytics. Even the personal-side profile view is a partial picture |

Your own `COMPETITIVE_RESEARCH.md` (April 2026) names profile-tagged group expenses as the differentiator. **It does not exist in code.** Until it does, Profiles read as a nice folder feature rather than a wedge.

**The fix is one foreign key and a `$unionWith`.** Estimated 3 person-weeks including UI. It is the highest-leverage change available to you and it is ranked #1 in both the innovation analysis and the RICE model in §12.

## 10.9 Feature-parity gaps — the conventional list

| Feature | Bakaya | Splitify | Importance | Difficulty | Priority | Business impact |
|---|---|---|---|---|---|---|
| **User-settable expense date** | **NO** — everything dated by `createdAt`; back-dating impossible | [C] | **High** | S | **P1** | You cannot log yesterday's dinner. A daily-use blocker, and cheap |
| **Multi-currency** | **NO** — `₹` hardcoded in the formatter *and* in server push bodies; locale pinned `en-IN`; no `currency` field on any model | [V] 150+ with auto-FX | **High (strategic)** | M–L | **P1 (schema only)** | See §20 — the schema decision is cheap now and brutal later |
| Receipt / photo attachments | **NO** — no file field, no upload route, no storage | [C] | Medium | M | P2 | Table stakes for disputes; not a differentiator |
| Recurring expenses | **NO** — "Subscription" is only a category emoji | [V] | Medium | M | P2 | Rent and utilities are the highest-frequency India use case |
| Comments / activity feed / audit trail | **NO** | [C] comments, [V] feed | Medium | M | P2 | The feature Splitwise gets most credit for |
| Search/filter on **group** expenses | **NO** — schema accepts only `page` and `limit` | [C] | Medium | S | P2 | You already ship this for personal expenses. Inconsistent |
| **Group expenses in analytics** | **NO** | [C] unified | **High** | M | **P1** | Blocks the Profile wedge and your best differentiator |
| CSV export for groups | **NO** — personal only | N | Medium | S | P2 | Cheap extension of shipped code |
| PDF export | **NO** | N | Low | M | P3 | — |
| **Dark mode** | **NO** — flat single light palette, zero `useColorScheme` references | Likely absent | Medium | M | P2 | 233 votes on Splitwise's forum. Table stakes, not a differentiator |
| **Offline-first** | **NO — the plumbing is installed and unused.** `PersistQueryClientProvider` + persister + 59-line query-key factory are wired, but **exactly one `useQuery` exists in the app** (the invitation badge). All 9 data screens use imperative `useState`+`useFocusEffect` | ? | **High** | L | **P2** | You have already paid for the infrastructure. Splid's "works perfectly offline" is a top-quoted review line |
| i18n / localisation | **NO** — every string a hardcoded English literal | English only | Low | L | P3 | Only matters if you pursue Western revenue |
| **Accessibility** | **NO** — 2 accessibility props in ~17.8k lines of UI; no labels on icon-only buttons; fixed px font sizes | Not indicated by developer | Medium | M | P2 | Never simplify this away. Also a store-review risk |
| In-app calculator on entry | **NO** | ? | **High** | **XS** | **P1** | **The #1 request in the entire category — 955 votes on Splitwise's forum.** Days of work. See §21 |
| Email notifications / reminders | **NO** — no mail transport anywhere | [C] transactional only | High | M | P2 | Reaches passengers who deleted the app |
| Email verification / password reset | **NO** — `isVerified` exists on the model, no endpoint | [C] (and **reportedly broken**) | **High** | M | **P1** | A lockout in a finance app blocks access to money owed |
| **Product analytics / telemetry** | **NO** | [C] Firebase | **Critical** | S | **P1** | **You have no idea what users do.** Every prioritisation in this report would be better with data |
| **Crash reporting** | **NO** | [I] Crashlytics | **Critical** | S | **P1** | Crashes are currently invisible to you |
| **Tests** | **~0%** — one 17-line file covering FCM token pruning; no test runner in any package.json | ? | **Critical** | M | **P1** | **Zero tests on the splitting math, balance aggregation, or the settlement cap.** In a money app |
| Billing / subscriptions | **NO** — no plan or entitlement field anywhere | [C] RevenueCat | Low | L | **P4** | See §15 — do not build this yet |

---

# SECTION 11 — Missing Features, Grouped by Effort

Everything absent from Bakaya, bucketed. Effort assumes your actual stack and a small team.

## 11.1 Easy Wins — under a week each, disproportionate return

| # | Feature | Effort | Why it earns its place |
|---|---|---|---|
| 1 | **Fix the `/api/v1/users` authorisation hole** | Hours | Security defect, not a feature |
| 2 | **Fix `EXPO_PUBLIC_API_URL` in the production EAS profile** | Hours | You cannot ship without it |
| 3 | **In-app calculator on the amount field** | 1–2 days | The category's #1 request, 955 votes, still unshipped by the incumbent |
| 4 | **Persist `splitType` on `GroupExpense`** | 2 days | Kills the `<0.02` heuristic and the silent percentage→exact degradation |
| 5 | **User-settable expense date** | 2 days | Unblocks logging yesterday's dinner |
| 6 | **Add a `currency` field to the money models** (default INR, no UI yet) | 2 days | Cheap now, brutal to retrofit. See §20.1 |
| 7 | **Crash reporting + product analytics** | 2–3 days | You are flying blind on both correctness and behaviour |
| 8 | **Digit grouping and Indian number formatting audit** | 1 day | Splitify ships `₹624634.57` in its own store screenshots. Don't |
| 9 | **Search/filter on group expenses** | 2 days | You already built it for personal expenses |
| 10 | **CSV export for group expenses** | 2 days | Extends shipped code; feeds the data-portability story |
| 11 | **Deep-link push taps to the right group** | 1 day | Payload lacks `groupName`; taps land on the list |
| 12 | **Create-group returns to the new group, not the list** | Hours | Named in your own UX audit, still open |
| 13 | **Replace blocking success `Alert` with a toast** | 1 day | Named in your own UX audit, still open |

## 11.2 Medium Features — one to three weeks

| # | Feature | Effort | Why |
|---|---|---|---|
| 14 | **Apple Sign-In** | 3–5 days | Blocks App Store approval |
| 15 | **iOS push via APNs** | 1–2 weeks | Half your platforms have no retention mechanic |
| 16 | **Invite by link + no-account participants** | 2 weeks | Your hard viral ceiling |
| 17 | **Web-viewable group balance, no install required** | 1.5 weeks | Removes the largest funnel leak |
| 18 | **UPI deep-link on settle-up** | 3–5 days | The India table stake neither you nor Splitify has |
| 19 | **`profileId` on `GroupExpense` + `$unionWith` in analytics** | 3 weeks | **The wedge.** See §10.8 |
| 20 | **Server-side debt simplification, both directions, on web too** | 1.5 weeks | Under-attacked lane |
| 21 | **Email verification and password reset** | 1 week | Lockout = blocked access to money owed |
| 22 | **Payment reminders (inviter-triggered, not system-triggered)** | 1 week | Category retention engine |
| 23 | **Receipt attachments** | 2 weeks | Requires object storage — your first new infra dependency |
| 24 | **Recurring expenses** | 2 weeks | Rent and utilities, the highest-frequency India case |
| 25 | **Dark mode** | 1.5 weeks | Table stakes; your theme is a flat const object today |
| 26 | **Accessibility pass** | 2 weeks | 2 props in 17.8k lines. Non-negotiable, never "simplified away" |
| 27 | **Test suite for the splitting math, balances, settlement cap** | 1.5 weeks | Zero coverage on money logic today |
| 28 | **Comments / activity feed** | 2 weeks | The feature Splitwise gets most credit for |
| 29 | **Actually migrate screens to TanStack Query** | 2–3 weeks | You have already paid for the infrastructure |

## 11.3 Advanced Features — a quarter or more

| # | Feature | Effort | Why |
|---|---|---|---|
| 30 | **Cross-group netting** (opt-in per pair) | 3 weeks | Splitwise's group isolation is architectural — this stays differentiated |
| 31 | **Hinglish / natural-language expense entry** | 4 weeks | Attacks entry friction, the actual churn cause. ~₹0.05 per parse |
| 32 | **On-device receipt OCR + shared-item apportioning** | 4 weeks | Free, offline, gallery-capable, zero marginal cost — sell it as privacy, not "AI" |
| 33 | **Annual Relationship Statement** | 3 weeks | The growth loop; only computable because of Profiles |
| 34 | **Recurring cash payout tracker** (maid, driver, parents) | 2.5 weeks | Highest India-value-to-effort ratio in the innovation set |
| 35 | **Learned split defaults** | 3 weeks | No LLM needed — a frequency table over `{groupId, category, participantSet}` |
| 36 | **Full offline-first with a mutation queue** | 4–6 weeks | "Add an expense at a restaurant with no signal" is the category's core offline case |
| 37 | **Multi-currency with FX** (beyond the schema field) | 4 weeks | Only if pursuing Western revenue |

## 11.4 Enterprise Features — a different product

Listed for completeness. [I] **My recommendation is not to pursue these.** SME expense management means approvals, GST handling, policy engines, and accounting export, competing against Zoho Expense, Happay and Fyle. It is a pivot, not a lever.

| # | Feature | Why it's a pivot |
|---|---|---|
| 38 | Approval workflows | Requires an org model you do not have |
| 39 | GST-compliant invoicing and reports | Regulated output formats |
| 40 | Accounting integrations (Tally, Zoho Books) | Partner-dependent |
| 41 | Policy engine / spend limits | Enterprise buying cycle |
| 42 | SSO / SCIM / audit logs | Enterprise buying cycle |

## 11.5 Future Features — dependent on scale or licensing you don't have

| # | Feature | Blocker |
|---|---|---|
| 43 | **Bank sync via Account Aggregator** | **Requires NBFC/lending/advisory licence or a rented regulated FIU partner.** Quarters-long compliance detour |
| 44 | **SMS transaction scraping** | **Prohibited by Play policy** unless you are the registered default SMS handler; tightened again July 2026 |
| 45 | Financial-product distribution (cards, loans, insurance referral) | The only India model with real revenue-per-user, but it needs millions of users. PhonePe earns ~8% from distribution *at national scale while losing ₹1,727 Cr/yr* |
| 46 | Own card / prepaid instrument (interchange) | PPI licence, bank partner, capital |
| 47 | Co-presence expense prompts | Background location — highest-friction permission on both stores |

---

# SECTION 12 — Feature Prioritisation

## 12.1 RICE model

**RICE = (Reach × Impact × Confidence) ÷ Effort.**

Stated assumptions, so you can re-run this with your own numbers:

- **Reach** = estimated share of monthly active users touched, 0–100. Since you have **no product analytics** (§10.9), every reach figure is an estimate — installing telemetry is itself a P1 item precisely because it replaces these guesses with data.
- **Impact** = 3 massive · 2 high · 1 medium · 0.5 low · 0.25 minimal
- **Confidence** = 100% strong evidence · 80% good · 50% assumption
- **Effort** = person-weeks for a 2-developer team

Ship-blockers (B1–B4) are excluded from RICE — you do them regardless of score.

| Rank | # | Feature | Reach | Impact | Conf. | Effort (pw) | **RICE** |
|---|---|---|---|---|---|---|---|
| 1 | 5 | User-settable expense date | 80 | 2 | 100% | 0.4 | **400** |
| 2 | 7 | Crash reporting + product analytics | 100 | 2 | 100% | 0.6 | **333** |
| 3 | 11 | Push deep-link to the correct group | 60 | 1 | 100% | 0.2 | **300** |
| 4 | 18 | UPI deep-link on settle-up | 85 | 3 | 90% | 0.8 | **287** |
| 5 | 4 | Persist `splitType` | 45 | 2 | 100% | 0.4 | **225** |
| 6 | 3 | In-app calculator on amount entry | 70 | 1 | 100% | 0.4 | **175** |
| 7 | 16 | Invite by link + no-account participants | 90 | 3 | 90% | 2.0 | **121** |
| 8 | 22 | Payment reminders | 65 | 2 | 80% | 1.0 | **104** |
| 9 | 21 | Email verification + password reset | 30 | 3 | 100% | 1.0 | **90** |
| 10 | 27 | Tests on splitting math, balances, settlement cap | 100 | 1 | 100% | 1.5 | **67** |
| 11 | 17 | Web-viewable balance, no install | 70 | 2 | 70% | 1.5 | **65** |
| 12 | 20 | Server-side debt simplification, both directions | 50 | 2 | 90% | 1.5 | **60** |
| 13 | 19 | **`profileId` on `GroupExpense` + unified analytics** | 55 | 3 | 80% | 3.0 | **44** |
| 14 | 29 | Migrate screens to TanStack Query | 100 | 1 | 70% | 2.5 | **28** |
| 15 | 25 | Dark mode | 40 | 1 | 80% | 1.5 | **21** |
| 16 | 33 | Annual Relationship Statement | 50 | 2 | 60% | 3.0 | **20** |
| 17 | 31 | Hinglish natural-language entry | 40 | 3 | 50% | 4.0 | **15** |
| 18 | 23 | Receipt attachments | 35 | 1 | 80% | 2.0 | **14** |
| 19 | 30 | Cross-group netting | 25 | 2 | 70% | 3.0 | **12** |
| 20 | 32 | On-device receipt OCR | 30 | 1 | 60% | 4.0 | **4.5** |
| — | 43 | Bank sync via Account Aggregator | — | — | — | **blocked** | **n/a** |

**Read rank 13 carefully.** The `profileId` change — your only structural moat — scores mid-table. That is RICE working as designed and failing you: it rewards cheap reach and systematically undervalues durable advantage, because a moat's payoff is neither immediate nor measurable in reach. Ranks 1–12 are things any competent competitor can also do. Rank 13 is the one thing Splitwise, Tricount and Splitify would each need a data migration to match.

**What the model says, in one line:** the highest-return work is small, boring, and mostly already half-built — dates, calculators, split types, telemetry, deep links — and the single biggest strategic item (`profileId` on group expenses) scores mid-table on RICE precisely because RICE rewards cheap reach and undervalues moats. **Do not let RICE alone pick your roadmap.** §20 balances it against strategy.

## 12.2 MoSCoW

### Must Have — the product is defective or unshippable without these

| Item | Why it is a Must, not a Should |
|---|---|
| **Fix `/api/v1/users` authorisation** | Live security hole |
| **Fix the production build** | Cannot ship |
| **Apple Sign-In** | Blocks App Store approval |
| **iOS push** | Half your users have no retention mechanic |
| **Crash reporting + product analytics** | You cannot manage what you cannot see; every other decision improves with it |
| **Tests on splitting math, balances, settlement cap** | Zero coverage on money logic in a money app |
| **Persist `splitType`** | Silent data loss |
| **User-settable expense date** | Cannot log yesterday |
| **Email verification + password reset** | Lockout blocks access to money owed |
| **`currency` field on money models** | Not the UI — just the field. Retrofitting currency into a money schema later is one of the most expensive migrations in this class of product |

### Should Have — significant competitive or growth value

| Item | Why |
|---|---|
| **Invite by link + no-account participants** | Your hard viral ceiling. The single largest growth constraint in the codebase |
| **UPI deep-link settle-up** | India table stake; neither you nor Splitify has it; regulator just advantaged it |
| **In-app calculator** | Category's #1 request, days of work |
| **`profileId` on `GroupExpense` + unified analytics** | Your only structural moat |
| **Server-side debt simplification, both directions, on web** | Under-attacked lane |
| **Payment reminders** | Category retention engine |
| **Web-viewable balance without install** | Largest funnel leak |
| **Accessibility pass** | Never simplify this away |
| **Group expense search/filter, group CSV export** | Cheap consistency wins |

### Could Have — real value, no urgency

Dark mode · receipt attachments · recurring expenses · comments and activity feed · TanStack Query migration · shares/weights split · settlement confirmation by counterparty · role promotion · PDF export · learned split defaults · annual relationship statement · cross-group netting.

### Won't Have Yet — and the reasoning matters more than the list

| Item | Why not now |
|---|---|
| **Bank sync** | Licensing-blocked. Chasing it is a quarters-long compliance detour that also surrenders the privacy position that is your best story |
| **SMS scraping** | Play-policy prohibited for non-default-SMS-handlers. Many Indian expense apps built on this and are now stranded |
| **Billing / subscriptions / paywall** | §15 shows Indian subscription revenue for a splitter is a rounding error. Building billing infrastructure now is speculative work against a business model the evidence does not support |
| **AI finance chat assistant** | Splitify aimed its LLM at *querying* spending. The friction is in *recording* it. Query-side AI is the more impressive demo and the less valuable feature |
| **Net worth tracking** | Requires the bank sync you cannot have, to answer a question your users are not asking you |
| **Item-wise receipt splitting** | Commoditised — four competitors ship it. Not a differentiator |
| **Referral programme** | Incentivised referral before product-market fit buys churn |
| **Enterprise / SME** | A different product with a different buyer |
| **i18n** | Only if you commit to Western revenue. Decide in §20, don't drift into it |

---

# SECTION 13 — Technical Architecture Guess

### 13.1 Confirmed stack components (hard evidence, not inference)

| Layer | Component | Evidence |
|---|---|---|
| Cloud platform | **Google Firebase / GCP**, project ID **`splitify-2bb8c`** | [https://getsplitify.com/__/firebase/init.json](https://getsplitify.com/__/firebase/init.json) returns `{apiKey: AIzaSyACX_qlMz6kf6nXvoaOsnJ0mnAK2x9N94M, authDomain: splitify-2bb8c.firebaseapp.com, databaseURL: "", messagingSenderId: 469304074105, projectId: splitify-2bb8c, storageBucket: splitify-2bb8c.firebasestorage.app}` |
| Marketing site hosting | **Firebase Hosting** (Fastly edge; `x-served-by: cache-maa10227-MAA`, Chennai POP) | DNS TXT `hosting-site=splitify-2bb8c`; `www.getsplitify.com` CNAME → `splitify-2bb8c.web.app`; A record 199.36.158.100 (Firebase Hosting range); HTTP response headers — dig + curl, 6 Aug 2026 |
| Auth | **Firebase Authentication** | `authDomain` above; Firebase-generated AASA reserving `/__/auth/action/` and `/__/auth/handler/` ([apple-app-site-association](https://getsplitify.com/apple-app-site-association)); Identity Toolkit project config for the API key returns `projectId: 469304074105`, `authorizedDomains: [localhost, splitify-2bb8c.firebaseapp.com, splitify-2bb8c.web.app]` (identitytoolkit.googleapis.com public config endpoint, 6 Aug 2026) |
| Object storage | **Cloud Storage for Firebase** — bucket `splitify-2bb8c.firebasestorage.app` | [__/firebase/init.json](https://getsplitify.com/__/firebase/init.json) |
| Push | **Firebase Cloud Messaging** — sender ID 469304074105 | Same; plus Android boot/wake/network permissions ([Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN)) |
| Subscriptions / entitlements | **RevenueCat** | [privacy.html](https://getsplitify.com/privacy.html) — named processor. Implies StoreKit 2 on iOS and Google Play Billing on Android behind RevenueCat's SDK |
| Bank aggregation | **Plaid** | `/plaid/*` app-link path — [.well-known/apple-app-site-association](https://getsplitify.com/.well-known/apple-app-site-association). The path exists to catch Plaid Link's OAuth redirect back into the app |
| LLM / AI | **Google Gemini** and **OpenAI** (both) | [privacy.html](https://getsplitify.com/privacy.html) |
| Analytics | **Firebase Analytics** ("Google Firebase … cloud hosting, analytics") | [privacy.html](https://getsplitify.com/privacy.html) |
| Attribution / ads | **Meta Platforms** (+ Google, RevenueCat for app events) | [privacy.html](https://getsplitify.com/privacy.html) |
| Corporate email | **Google Workspace** | MX → `aspmx.l.google.com` etc. (dig, 6 Aug 2026) |
| DNS registrar/host | **GoDaddy** (`ns09/ns10.domaincontrol.com`) | dig NS, 6 Aug 2026 |
| Email deliverability | SPF via a macro-style include: `v=spf1 include:dc-aa8e722993._spfm.getsplitify.com ~all` | dig TXT, 6 Aug 2026 |

**This is not a guess — the vendor's own Firebase Hosting reserved paths publish the config.** (Note: none of the above is a leaked secret. `init.json` and a Firebase Web API key are public by design; they are identifiers, not credentials. Security posture therefore rests entirely on Firestore/Storage security rules, which are not externally observable.)

### 13.2 Inferred components

| Component | Inference | Reasoning |
|---|---|---|
| Primary database | **Cloud Firestore** (not Realtime Database) | INFERENCE: `databaseURL` is **empty string** in init.json — RTDB is not provisioned on the project. Firestore is the default remaining Firebase datastore and matches the "Real-Time Balances" marketing claim and per-group document/collection shape ([init.json](https://getsplitify.com/__/firebase/init.json)) |
| Server logic | **Cloud Functions for Firebase** (or Cloud Run) | INFERENCE: Plaid webhooks, LLM calls, OCR, and Splitwise import parsing all require server-side execution with secrets; a Firebase-native shop reaches for Functions. Direct probes of `us-central1/asia-south1/asia-southeast1/europe-west1-splitify-2bb8c.cloudfunctions.net` returned 404 at the bare root — **this is inconclusive**, since Google returns 404 at the root for provisioned and unprovisioned projects alike. No function names could be enumerated. |
| Region | **Likely `asia-south1` (Mumbai) or `us-central1`** | INFERENCE, low confidence: India-first user base argues for asia-south1; Firebase defaults and Plaid's US orientation argue for us-central1. **No evidence either way** — do not state a region in the final report |
| Receipt OCR | **LLM-based vision extraction (Gemini and/or GPT), not a dedicated OCR vendor** | INFERENCE: only Gemini and OpenAI are named as processors ([privacy.html](https://getsplitify.com/privacy.html)); no Google Cloud Vision, AWS Textract, Mindee, Veryfi, or Klippa appears. Both named vendors are multimodal, so one pipeline serves both the scanner and the chat assistant. Also explains why "Photos" is declared as collected AND shared with third parties on Play ([Data safety](https://play.google.com/store/apps/datasafety?id=com.akhash.splitify&hl=en_IN)) — the "third party" receiving photos is almost certainly the LLM vendor |
| AI assistant pattern | **Scoped context injection, not full-corpus RAG** | INFERENCE: the UI exposes an explicit "Add Context" chip mechanism with a removable "Home" scope (screenshot 8), and the model's answer states exactly which ledgers it summed. That is a deterministic pre-aggregation + prompt-stuffing design, cheaper and more accurate than embedding search at this data scale |
| SMS/email parsing | **Server-side extraction on ingested message bodies** | INFERENCE: policy says the *content* of SMS/emails is ingested for transaction extraction ([privacy.html](https://getsplitify.com/privacy.html)); Play declares Emails and SMS shared with third parties for "App functionality" ([Data safety](https://play.google.com/store/apps/datasafety?id=com.akhash.splitify&hl=en_IN)) — i.e. message bodies leave the device, plausibly to the same LLM vendors. On-device-only parsing would not require a third-party sharing declaration |
| Crash reporting | **Firebase Crashlytics** | INFERENCE: bundled with the Firebase suite already in use; not independently confirmed |
| Client framework (iOS) | **Undetermined.** Two conflicting signals | INFERENCE both ways: (a) **min iOS 18.0** — an unusually aggressive floor for a 2026 consumer app, which cross-platform frameworks (Flutter/React Native/Expo) do not require; this argues for **native SwiftUI** using recent APIs. (b) **114.8 MB** binary is heavy for a native SwiftUI CRUD app; that argues for a bundled runtime/engine or large asset payload. Android min is **8.0 (API 26)**, i.e. far more permissive than iOS 18 — a genuinely shared cross-platform codebase would not normally produce a 7-major-version asymmetry. **Net lean: two separate native codebases** (also consistent with divergent version tracks, 1.13.2 vs 1.4.11, and the 5.5-month platform gap). Confidence: low-medium. Do not assert this as fact. |
| Team size | **1–3 engineers** | INFERENCE: entirely managed-service stack (Firebase + RevenueCat + Plaid + hosted LLMs) with zero self-operated infrastructure; a static hand-rolled marketing site with `.html` extensions and inline `<style>` blocks ([getsplitify.com/join/](https://getsplitify.com/join/)); a gmail.com support address; the package name literally carrying a personal handle (`com.akhash.splitify`); founder name appearing in demo data. Release cadence (1.4.8/1.4.9/1.4.10/1.4.11 within days) is consistent with one developer iterating fast without a release train |
| Splitwise import mechanism | **Client-side file parse of Splitwise's CSV export, uploaded to the backend** | INFERENCE: screenshot 7 instructs the user to "export your group data" from Splitwise and share/upload the file. There is **no OAuth/API integration with Splitwise** — the wording rules it out. The site's "in one tap" claim is marketing overstatement |

### 13.3 Architecture sketch (INFERENCE, assembled from the confirmed pieces)

```
iOS (com.findat.splitify, min 18.0)   Android (com.akhash.splitify, min 8.0)
        │                                      │
        │  Firebase Auth SDK (email+pw, phone verification)
        │  Firestore SDK (groups, expenses, balances, budgets)
        │  Cloud Storage (receipt images)
        │  FCM (push)                          │
        │  RevenueCat SDK → StoreKit 2 / Play Billing
        │  Plaid Link SDK → returns via https://getsplitify.com/plaid/*
        │  [Android only] SMS read → bank-alert bodies
        └──────────────┬───────────────────────┘
                       ▼
        Firebase backend (project splitify-2bb8c)
        Cloud Functions (inferred): Plaid webhooks, txn normalisation,
        categorisation, budget rollups, invite resolution (/join/*)
                       │
        ┌──────────────┼────────────────┬─────────────────┐
        ▼              ▼                ▼                 ▼
    Plaid API    Gemini + OpenAI   Firebase Analytics   Meta / Google
   (bank data)  (OCR + AI chat)    + RevenueCat        (ad attribution)
```

---


---

# SECTION 14 — Growth Strategy

### 14.1 Headline: the structural virality of expense splitting

Expense splitting is one of a small class of products where **the invite is not a growth feature bolted onto the product — it is the product's core action.** You cannot split a bill with yourself. The unit of value creation (a shared expense) requires a counterparty, so every successful primary action either (a) recruits a user or (b) creates a stub record of a non-user.

This is structurally different from, and stronger than, referral-programme virality:

| Virality type | Trigger | User motivation | Example |
|---|---|---|---|
| Incentivised referral | Marketing prompt | Extrinsic (reward) | "Refer a friend, get ₹100" |
| Social/showoff | Content creation | Status | Strava, Duolingo streaks |
| **Intrinsic / functional** | **Core action itself** | **Self-interest — I need to be paid back** | **Splitwise, Splitify, Venmo, Calendly** |

Intrinsic virality is the strongest form because the inviter is not doing the company a favour — **they are chasing their own money.** The nagging is self-motivated. [INFERENCE]

#### The loop, mechanically

```
User A downloads → creates group → adds members B, C, D (invite)
        → adds expense → B/C/D receive notification of a DEBT
        → debt is a social obligation → B/C/D install to see/settle
        → B/C/D form their OWN groups with E, F, G  ← this branch is the actual growth
        → settle-up event → …repeat
```

The critical, commonly-missed point: **step 4 (B joins A's group) is not viral growth — it is invite conversion.** True virality only occurs at **step 5**, when a recruited member starts their *own* group. A product where invitees only ever join other people's groups has a K-factor that decays to zero once the initial seed network is saturated; it grows linearly with paid acquisition, not exponentially. [INFERENCE]

#### Where the loop leaks — the six leak points

Modelling the cascade as a chain of multiplied conversion rates makes the leakage explicit. **All rates below are illustrative structural placeholders to show the shape of the funnel, NOT measured values for Splitify or any competitor.** [INFERENCE — illustrative model only]

| # | Stage | Leak mechanism |
|---|---|---|
| 1 | Group creation | User adds one expense solo to "try it", never creates a group. Loop never starts. |
| 2 | Invite send | Invite requires the inviter to know contact details / leave the app to share a link. Friction here kills the loop at source. |
| 3 | Invite → install | Recipient sees a WhatsApp link from a friend but installs nothing — they mentally note "I owe Rahul ₹400" and settle in cash. **This is the largest leak in India specifically**, because UPI makes settling *without* the app trivially easy. |
| 4 | Install → activation | Installs, sees the balance, screenshots it, pays over UPI, never returns. Value extracted in one session. |
| 5 | Activation → own-group creation | The compounding step. Most members remain permanently passive participants in one organiser's group. |
| 6 | Retention to next cycle | Trip ends → group goes dormant → app deleted. Trip-based use is inherently episodic. |

**The organiser-passenger asymmetry.** [INFERENCE] Every group has roughly one organiser (creates group, enters expenses, chases settlement) and n−1 passengers. Only the organiser has a job-to-be-done strong enough to sustain retention or justify payment. This has two consequences that drive everything in Section 15:

1. **Monetisable population ≈ organisers only,** i.e. roughly 1/n of the user base, where n is average group size. A splitter with 100k users and average group size 5 may have only ~20k users with any propensity to pay.
2. **Passengers are pure cost** — they consume server, notification and support resources and will essentially never convert. Splitwise's 2023 free-tier limits (below) are best read as a direct response to exactly this cost structure.

#### Cold-start advantage and why it protects Splitwise

Splitwise's moat is not features — it is **installed base as a coordination default.** [INFERENCE] When a group forms, someone says "everyone's on Splitwise, right?" and the answer is usually yes. A challenger must win the *group*, not the user: one holdout forces the whole group back to the incumbent. Winning a 6-person group requires 6 individual switching decisions with no partial credit.

**This is precisely why "Import from Splitwise" exists** and why it is the single most strategically important growth feature Splitify ships. [FACT — feature listed on the App Store description and getsplitify.com, observed 6 Aug 2026] It attacks the switching cost at its only vulnerable point: history loss. Whether it moves groups or only individuals is unknown; if it imports only the individual's balances and not the group's members, it is a data-migration feature masquerading as a switching wedge and will not move groups. [INFERENCE]

### 14.2 Referral programmes and invite mechanics

| Player | Incentivised referral programme | Intrinsic invite mechanic | Evidence |
|---|---|---|---|
| Splitify | **None found** on getsplitify.com or either store listing | Group invite; "Import from Splitwise" | [FACT] getsplitify.com and App Store listing, 6 Aug 2026 — no referral copy present |
| Splitwise | No public consumer referral programme found; discounting is done via promo offers (e.g. a circulated "50% off first year of Pro" offer) | Group invite, settle-up reminders, Venmo/Tink settlement | [FACT] Splitwise blog & Desidime offer listing |
| Splitkaro (India) | Not surfaced | Group invite + **UPI split payments**, priority reminders as a *paid* feature | [FACT] splitkaro.com/faq/premium |
| Spliit (OSS) | N/A — no monetised loop | Shareable web URL, **no install required** | [FACT] github.com/spliit-app/spliit |

**The most important line in that table is Spliit's.** [INFERENCE] A shareable web link with no install requirement removes leak point #3 entirely — the highest-leakage step in the whole funnel. Splitify is app-only, so every invite it sends must survive an App Store/Play install before it converts. A web-viewable group balance (read-only, no signup) would be the single highest-leverage growth change available to Splitify, and it costs one route on a website they already run.

**Assessment of Splitify's referral posture:** [INFERENCE] The absence of any referral programme at this stage is *defensible* — incentivised referral before product-market fit buys installs that churn, and a pre-traction app with 18 iOS ratings and 1,000+ Play installs [FACT, below] has nothing to amplify yet. The gap that actually matters is not the missing referral bounty; it is the missing **frictionless invite surface**.

### 14.3 Retention loops, gamification, push and email

| Loop | Splitwise | Splitify (observable) | Notes |
|---|---|---|---|
| Debt-anxiety loop | Outstanding balance is the app's home-screen hero; you return to make it zero | Same structural mechanic; **v1.4.3 added a "Home tab with analytics"** [FACT, changelog], which competes with balance for hero placement | [INFERENCE] Replacing "who owes what" with analytics dilutes the strongest retention trigger the category has |
| Reminder / nudge | Settle-up reminders, email digests | Push notification entitlement present in the product [FACT — the codebase this report is authored alongside contains push-notification implementation, commit `4853e10`, "feat: implement push notifications for mobile and web"] | — |
| Episodic re-engagement | Trip/event cadence | Same | Both leak at leak point #6 |
| **Daily habit loop** | **Absent** — Splitwise is inherently episodic | **Present, and this is Splitify's real strategic bet:** personal expense tracking + bank sync + budgets + net worth [FACT — App Store description] | See S19 |
| Gamification | Effectively none in category | None observed | [INFERENCE] Streaks/badges are a poor fit — debt is not a game, and gamifying money-owed between friends risks reading as tacky |

**The strategic read on Splitify's personal-finance bolt-on** [INFERENCE]: splitting is episodic (weekly at best, realistically monthly); personal expense tracking with bank sync is *daily*. Adding a daily-frequency surface to an episodic app is a textbook retention play — it converts a product you open on trips into one you open on Tuesdays. It is the same reasoning that pushed Splitwise from splitting into settlement (Venmo, then Tink). Whether it works is a different question: personal finance management is a notoriously low-retention category on its own, and Splitify is now competing with both Splitwise *and* every PFM app simultaneously.

**Push notification strategy — the category's sharpest double edge.** [INFERENCE] Push in a splitting app carries a message no other category can send: *a named human owes you money, or you owe them.* That is the highest-intent notification payload in consumer fintech. It is also socially loaded — an aggressive "Rahul, you still owe Priya ₹400" reads as the app nagging on a friend's behalf, and mis-tuned it damages the *friendship*, which is the thing keeping the group in the product. Correct design is inviter-triggered (the organiser presses "remind"), not system-triggered.

**Email.** Splitwise's long-running email digest is a genuine asset — it reaches passengers who deleted the app. [INFERENCE] Splitify at its stage almost certainly has no email programme beyond transactional; its only listed contact is `splitify.queries@gmail.com` [FACT, getsplitify.com footer, 6 Aug 2026], which is itself a strong signal of pre-infrastructure stage — a company running lifecycle email does not route support through a consumer Gmail address.

### 14.4 App Store Optimisation — Splitify's actual choices

Observed listings, 6 August 2026:

| Field | Splitify (iOS, IN store) | Splitwise (iOS, IN store) | Assessment |
|---|---|---|---|
| Title | **"Splitify - Expense Tracker"** [FACT] | **"Splitwise"** [FACT] | Splitify spends its title's keyword budget on *"Expense Tracker"* — a **personal-finance** term, not a splitting term |
| Subtitle | **"One app. All your finances."** [FACT] | **"Split expenses with friends"** [FACT] | Splitwise's subtitle is pure keyword ("split", "expenses", "friends"). Splitify's is a **brand slogan with near-zero keyword value** |
| Category | Finance [FACT] | Finance, **rank No. 43 Finance (IN)** [FACT] | — |
| IAPs shown | Splitify Pro Yearly ₹999 / Monthly ₹149 / Quarterly ₹399 [FACT] | Splitwise Pro ₹49 / ₹99 / ₹149 / ₹999 / ₹1,199 [FACT] | See S15 — this is the report's most important finding |
| Ratings | 4.4★, 18 ratings (IN) [FACT] | 4.4★, 13k ratings (IN) [FACT] | ~720x rating volume gap |
| Android | "Findat Pvt. Ltd.", **1,000+ installs, 4.8★ / 30 reviews**, IAP **₹149.00–₹999.00 per item**, updated **6 Aug 2026**, listing release date field reads **23 Jul 2025** [FACT — play.google.com listing metadata, retrieved 6 Aug 2026] | — | Play release date of Jul 2025 sits oddly against the "very new" framing; flagged, not resolved |
| Size | 114.8 MB [FACT] | — | Large for a splitter; consistent with a bundled RN + bank-sync + AI-scanner payload [INFERENCE] |

**ASO verdict** [INFERENCE]: Splitify's metadata is **mis-targeted for its own growth thesis.**

1. The subtitle is the second-most-weighted indexed field on the App Store and Splitify spends all 30-ish characters of it on *"One app. All your finances."* — which indexes for nothing anyone searches. Splitwise, by contrast, uses its subtitle as a pure keyword strip. This is a free, same-day fix worth more than any feature on the roadmap.
2. Title targets **"Expense Tracker"**, a category where Splitify competes against Walnut, Money Manager, MoneyView, and every PFM app in India — brutal, high-volume, low-intent-match. It does **not** target **"split"**, where intent is high, the query maps exactly to the product, and the only real competitor is a single incumbent brand name.
3. Splitwise's own brand term is the highest-converting query available to Splitify — a searcher typing "splitwise" in the Indian App Store is a qualified switcher, and Splitify ships the exact feature ("Import from Splitwise") that serves them. Splitify's metadata makes no visible play for it.
4. **Ratings volume is the binding constraint, not keywords.** 18 iOS ratings cannot rank against 13k for any competitive term regardless of metadata quality. And the US listing at **3.0★ / 4 ratings** is actively harmful — at that volume, two more 1★ reviews set the US listing's public reputation for months.

### 14.5 SEO — getsplitify.com vs the category's comparison-content industry

**getsplitify.com posture** [FACT, observed 6 Aug 2026]: single-page marketing site. Title "Splitify – One App. All Your Finances." Five feature sections. Footer: Terms, Privacy, Contact, store badges, Gmail address. **No blog. No pricing page. No comparison pages. No help centre. No sitemap of consequence.** Entire organic surface = one page ranking for a brand term nobody searches yet.

Meanwhile the category has an entire cottage industry of **programmatic comparison-content SEO** aimed squarely at Splitwise's dissatisfied users:

| Site | Play | Evidence |
|---|---|---|
| splitterup.app | Blog: "The 7 Best Expense Splitting Apps in 2026 (Honest Comparison)" (pub. 20 Jan 2026, upd. 30 May 2026), "Is Splitwise Pro Worth It? Here's the Math", roommate guides. Reviews 7 competitors, concludes its own app is best. Sells **$4.99 one-time, rising to $9.99, "never a subscription"** | [FACT] splitterup.app/blog |
| splittyapp.com | "How much is Splitwise Pro? $4.99/month — what's still free", "The 7 best bill splitting apps of 2026" | [FACT] splittyapp.com/learn/ |
| spliit.pro / spliit.app | "Splitwise Alternative: 7 Best Free & Paid Apps Compared (2026)", "Splitwise Free vs Pro: What It Costs, and Is It Worth It?"; open-source positioning | [FACT] spliit.pro/blog, github.com/spliit-app/spliit |
| nomadcrew.uk, tripplanhelper.com, areweeven.com, usefairsplit.com, split-circle.com, partytab.app, goodshare.app, niptao.app, splitwin.app | All running near-identical "Splitwise daily limit / alternatives / pricing" keyword pages | [FACT] search results, 6 Aug 2026 |

**This is the category's defining growth channel and Splitify is not in it.** [INFERENCE] Every one of these sites is farming the same seam: users searching *"splitwise daily limit"*, *"splitwise alternative"*, *"is splitwise pro worth it"*. That seam exists **only because of the 2023 free-tier restriction** (14.6) — Splitwise's monetisation decision manufactured an entire keyword category that its competitors now mine for free.

Splitify has the strongest possible claim to that seam and no page to rank with it:

- It is the only competitor listed here with a shipped **"Import from Splitwise"** migration path.
- Its ₹999/yr is a real price story *outside* India (vs $39.99).
- Missing pages, in priority order: `/vs/splitwise`, `/splitwise-alternative-india`, `/import-from-splitwise`, `/splitwise-daily-limit`, `/pricing`. [INFERENCE — recommendation]

Caveat: this seam is **US/EU-weighted**. Indian users discover apps overwhelmingly through the Play Store and word-of-mouth, not Google blog results. [INFERENCE] For an India-first product, comparison SEO is a *secondary* channel that primarily wins international users — which may in fact be the point, since those are the users who can pay $19.99.

### 14.6 Splitwise's 2023 free-tier limits — the strategic centrepiece

**[FACT]** In 2023 Splitwise introduced a cap on free-tier expense entries (widely reported as ~3–5/day, never officially documented as an exact number; a ~10s cooldown was also reported) plus interstitial ads between expense entries. Sources: itvoice.in, split-circle.com, nomadcrew.uk, splittyapp.com — all observed 6 Aug 2026.

**[FACT]** The backlash was substantial and is still being quoted in 2026 content: *"3 expenses a day? Unskippable ads between expenses? Be serious"*; *"It's now taking a week for my friends and I to add the expenses from one weekend trip!"* [reported in nomadcrew.uk and split-circle.com coverage].

**Why this matters more than any feature comparison** [INFERENCE]:

1. **The limit is aimed exactly at the trip-organiser** — the one user with a real job-to-be-done, the one who enters 15 expenses in a day on holiday, and the only user with any propensity to pay. It is a well-targeted paywall in the economic sense.
2. **But it breaks the viral loop at its most valuable moment.** The organiser hitting the wall mid-trip is the same person who was about to invite five people. Splitwise chose to monetise the exact event that produces its growth. That is a mature-company trade: it implies Splitwise judged its network effect strong enough to survive annoying its power users. On current evidence (13k IN ratings, No. 43 IN Finance, an entire industry of alternative-hunting keyword traffic) that judgement looks *commercially* correct and *strategically* expensive.
3. **It created the market Splitify is entering.** Without the 2023 limits there is no "splitwise alternative" search volume, no comparison-blog industry, and materially less reason for a 2025/26 entrant to exist. Splitify's whole opportunity is downstream of a competitor's pricing decision.
4. **The lesson Splitify should draw is about *what* to limit, not *whether*.** Limiting the core action (adding an expense) is what produced the backlash. Limiting *analysis* (history depth, export, insights, bank sync) would have produced far less, because it does not block the job. [INFERENCE]

### 14.7 Premium conversion tactics and social sharing

**Conversion tactics observed:** Splitify runs a three-tier ladder (monthly/quarterly/yearly) with the **quarterly tier as the decoy** — ₹399/qtr = ₹1,596/yr annualised vs ₹999/yr, making the annual look like a 37% saving against a price nobody should rationally choose. [FACT — prices; INFERENCE — decoy interpretation] The presence of a **quarterly** tier at all is a meaningful India signal: quarterly and weekly plans over-index in India and SEA, reflecting lower purchasing power and shorter commitment appetite [FACT — RevenueCat, State of Subscription Apps].

**No free trial is visible in the IAP list** [FACT — App Store IN listing shows three priced IAPs only]. This matters: trial-to-paid in IN/SEA runs at a **15.2% median vs 34.2% in North America** [FACT — RevenueCat], and trials of 17–32 days convert at 42.5% vs 25.5% for ≤4 days [FACT — RevenueCat]. A long trial is one of the few levers proven to work against low India conversion.

**Social sharing:** the category's natural share artefact is the **settle-up summary** — "here's what everyone owes" pasted into a WhatsApp group. [INFERENCE] In India, WhatsApp *is* the group layer; any splitting app that does not produce a clean, shareable, WhatsApp-native summary image/text with a UPI deep link is leaving its single best distribution surface unused. Splitwise's US equivalent of this is the Venmo/Tink settlement handoff. No evidence either way that Splitify has a WhatsApp-optimised share artefact.

---

# SECTION 15 — Monetisation Opportunities

### 15.1 The finding that reframes everything: Splitwise is regionally priced in India

The brief's premise — that Splitify's ₹999/yr undercuts Splitwise Pro's $39.99/yr by ~44% — **holds in the US and collapses in India.**

**[FACT]** Splitwise's Indian App Store listing shows in-app purchases at **₹49, ₹99, ₹149, ₹999 and ₹1,199** (apps.apple.com/in/app/splitwise/id458023433, observed 6 Aug 2026). Splitwise applies India-specific pricing; it does not charge Indians $39.99 (~₹3,500).

| Market | Splitify Pro yearly | Splitwise Pro yearly | Splitify's price advantage |
|---|---|---|---|
| US | $19.99 [FACT] | $39.99 [FACT] | **~50% cheaper — real** |
| India | ₹999 [FACT] | ₹999–₹1,199 (IAP tiers observed) [FACT] | **~0–17% — effectively parity** |

**[INFERENCE] Splitify has no price advantage in the market it is built for, and a large one in the market it is not built for.** Its India-first product ships with an international-market pricing story. Either the pricing or the geographic focus is wrong.

*(Note: a competitor blog, niptao.app, claims Splitwise Pro is ₹2,499/yr in India. This conflicts with the IAP tiers on Apple's own India storefront. Treat the ₹2,499 figure as unreliable — it originates from a site whose business model is ranking for "Splitwise is expensive" queries.)*

And the real India price floor is lower still: **Splitkaro Premium starts at ₹37.50/month billed annually or quarterly (~₹450/yr)** [FACT — splitkaro.com/faq/premium, observed 6 Aug 2026] — with UPI split payments, item-wise splitting, auto-fetch from Swiggy/Blinkit/Zepto/Zomato, and ad-free included. **Splitify at ₹999/yr is priced at roughly 2.2x the incumbent Indian challenger.** [FACT — arithmetic on cited prices]

### 15.2 Comparative pricing table

| App | Free tier | Paid price | Model | Market | Source (all obs. 6 Aug 2026) |
|---|---|---|---|---|---|
| **Splitwise** | Limited: ~3–5 expenses/day + interstitial ads (since 2023) | $4.99/mo, $39.99/yr; **India IAPs ₹49/99/149/999/1,199** | Subscription + ads | Global | apps.apple.com/in/.../id458023433; splittyapp.com |
| **Splitify** | Yes (extent undisclosed) | ₹149/mo, ₹399/qtr, ₹999/yr ($2.99/$7.99/$19.99); Play shows ₹149–₹999/item | Subscription **+ declared third-party advertising & cross-app tracking** | India-first | apps.apple.com/in/.../id6756657540; play.google.com/…com.akhash.splitify |
| **Splitkaro** | Yes, with ads | **from ₹37.50/mo billed annual/quarterly (~₹450/yr)**; group pricing drops per-person as members added | Subscription, India-native features | India | splitkaro.com/faq/premium |
| **Tricount** | Full function, no ads, no limits | **Free** | Bank-owned (Belfius) — strategic, not standalone | EU-strong | lovemoney.com; goodshare.app |
| **Settle Up** | Yes, strong offline support | **$3.49/mo, $18.99/yr** | Subscription | Global | splitterup.app/blog/best-expense-splitting-apps |
| **Splid** | Yes | **~$4.99 one-time** (intro; rising to $9.99) | **One-time purchase** | Global | splitterup.app/blog |
| **SplitterUp** | Yes | **$4.99 one-time → $9.99**, "never a subscription" | One-time | Global | splitterup.app |
| **Spliit** | Everything | **Free, open source, self-hostable, no install (web)** | None / donations | Global | github.com/spliit-app/spliit |

**Two things jump out.** [INFERENCE]

1. **The category's price floor is zero and structurally so.** Tricount is free because a bank owns it and treats it as acquisition. Spliit is free because it is open source. Neither will ever raise prices. A splitter's paid tier is therefore permanently arbitraged against genuinely good free products — this is not a temporary competitive condition.
2. **The market is drifting to one-time purchases** (Splid, SplitterUp) explicitly marketed *against* subscriptions. That is a direct read on how users feel about paying rent for a bill-splitter, and it is exactly the sentiment the Splitwise backlash created.

### 15.3 India monetisation benchmarks

All **[FACT]**, from RevenueCat, *State of Subscription Apps* (revenuecat.com/state-of-subscription-apps, observed 6 Aug 2026). **These are cross-category medians, not Splitify figures.**

| Metric | India/SEA | North America | Ratio |
|---|---|---|---|
| Download→paid conversion (D35), median | **1.4%** | 2.6% | 1.9x worse |
| Revenue per install, D14 | **$0.08** | $0.38 | **~5x worse** |
| Revenue per install, D60 | **$0.11** | $0.55 | 5x worse |
| Realised LTV per payer, year 1 | **$14** | $32 | 2.3x worse |
| Trial→paid conversion | **15.2%** | 34.2% | 2.3x worse |
| Median annual price point | **$18.32** | $39.99 | 46% of NA |

Also **[FACT — RevenueCat]**: freemium converts at a 2.1% median vs 10.7% for a hard paywall (5x); global download→paid median is 2.0%.

**[FACT]** Card penetration in India is low enough (~8% cited) that card-gated trials structurally fail there; UPI Autopay is the functioning mandate rail (dev.to/paywallpro subscription benchmarks; arpubrothers.com 2025 mobile app report).

**The arithmetic this forces** [INFERENCE — my calculation applying the cited category medians]:

> At the IN/SEA freemium median of ~1.4–2.1% conversion and Splitify's ₹999/yr (~$11.40) list price, **1,000 Indian installs yields roughly 14–21 payers ≈ ₹14,000–21,000/yr gross, before Apple/Google's cut, refunds and churn.** Splitify's Play listing shows **1,000+ installs** [FACT].
>
> Even granting generous assumptions, **an India-only, subscription-only bill-splitter needs on the order of a million installs to clear a single engineer's salary.** That is the whole monetisation problem in one line.

Note the RevenueCat median annual price for IN/SEA is **$18.32** — Splitify's $19.99 international price sits almost exactly on the global-median line while its ₹999 sits *above* the India median. It is priced like an app for Americans.

### 15.4 Monetisation levers assessed, India-specific

| Lever | What it looks like | India viability | Verdict |
|---|---|---|---|
| **Premium subscription** | Current model: ₹149/399/999 | Category benchmark 1.4% conversion, $14 y1 LTV/payer [FACT RevenueCat]; undercut by Splitkaro at ~₹450 and by free Tricount/Spliit | **Weak standalone.** Necessary hygiene, insufficient as the business |
| **Ads** | Splitify's App Store privacy label **declares Third-Party Advertising and cross-app tracking** [FACT, per brief] | Indian mobile CPMs are among the world's lowest; needs enormous scale | **Structurally poor at Splitify's size, and actively damaging** — see 15.5 |
| **Family / household plan** | Shared plan for a flat or household | **Genuinely good fit.** Rent+utilities flatmate splitting is the highest-frequency India use case, and it converts the organiser-passenger asymmetry into an advantage: one payer covers n users. Splitkaro already does per-group pricing that falls with member count [FACT] | **Best available subscription variant** |
| **Business/team plans** | SME expense management, offsites, small-firm reimbursements | Real budgets exist here, but it is a *different product* (approvals, GST, policy, accounting export) against Zoho Expense / Happay / Fyle | **Viable but a pivot, not a lever** |
| **Payment integrations (UPI)** | Settle up via UPI deep link | **Zero MDR on UPI is government policy** [FACT — Inc42; confirmed by Finance Ministry 2025]. Proposed reintroduction is only **0.05–0.07% on >₹2,000 txns for merchants above ₹1–1.5 Cr turnover**, and ~90% of small merchants stay exempt [FACT — Inc42] — none of which applies to **P2P** splitting, which will remain free forever | **Massive UX value, structurally ZERO direct revenue.** Build it, but never model income from it |
| **Partner integrations** | Swiggy/Zomato/Zepto/Blinkit bill auto-fetch | Splitkaro already ships this [FACT]. Genuinely differentiating in India | Feature moat, not revenue |
| **Affiliate revenue** | Credit-card / loan / insurance / MF referral off the back of spend data | **This is how Indian consumer fintech actually earns.** But see the CAC-payback trap in 15.5 | **The only lever with real India economics** |
| **Financial insights as paid product** | Budgets, net worth, category analytics — Splitify ships all of these [FACT] | Consumers won't pay much; the *data* is worth more than the *feature* | Insights are the **acquisition surface for the affiliate model**, not the product being sold |
| **Interchange** | Own card / prepaid instrument | Requires PPI licence, bank partner, capital, compliance | Out of reach at this stage |
| **B2B / data licensing** | Aggregated spend panels | Reputationally lethal for a bank-sync app; AA framework constrains it | Do not |

### 15.5 So: is charging for a bill-splitter viable in India at all?

**[INFERENCE — the core judgement of this section]** No, not as the primary business. Subscriptions in India are a *rounding error on a rounding error* for a category whose price floor is genuinely zero. The evidence chain:

- India/SEA revenue per install is **$0.08 at D14** and LTV/payer **$14/yr** [FACT RevenueCat] — against a bank-sync product carrying real per-user infrastructure cost.
- The two best free competitors (Tricount, Spliit) are free for *structural* reasons that will not change.
- The local paid competitor is at **~₹450/yr**, less than half Splitify's price [FACT].
- Splitwise, with 13k Indian ratings and 15 years of brand [FACT], prices at ₹999–1,199 in India — i.e. the incumbent already occupies Splitify's price point with vastly more trust.

**What the real Indian model looks like.** Indian consumer fintech does not sell software; it sells **distribution of financial products**. But the evidence cuts both ways and honesty requires stating both halves:

- **[FACT]** PhonePe FY25: revenue from operations ₹7,114.9 Cr, of which **payments = 88.5% (₹6,299.7 Cr)**; insurance and lending distribution ₹557.6 Cr (**~8%**, though growing ~208% YoY); other services ₹57.3 Cr. Net loss ₹1,727.4 Cr. (medianama.com, Sept 2025)
- **[FACT]** Third-party UPI apps monetise via lending, distribution partnerships, advertising and subscriptions rather than consumer transaction fees (Inc42).
- **[FACT]** Jupiter follows the neo-bank playbook: free acquisition, monetise via interchange and lending (valueforstartups.in). **Fi Money pivoted to B2B AI after struggling with consumer-facing profitability** (TechCrunch, 2026) — a direct, recent counter-example that the consumer-fintech-to-lending funnel does not automatically work.
- **[FACT]** UPI context: 23.2 bn transactions worth ₹29.9 lakh Cr in May 2026; 55.49 crore users onboarded by June 2026; ~85% of Indian digital payments (aninews.in; ibef.org; NPCI/PIB).

**[INFERENCE] Reading that honestly:** the affiliate/lending model is the only one with sufficient revenue-per-user to work in India — a single successful credit-card referral out-earns several years of ₹999 subscriptions — but PhonePe's own numbers show distribution is still only ~8% of revenue *at national scale and while losing ₹1,727 Cr a year*, and Fi's pivot shows the model failing outright at sub-scale. **The affiliate thesis requires enormous top-of-funnel. Splitify has 1,000+ Play installs.** The gap between the model that works in India and the scale required to run it is the central strategic problem, and no amount of pricing cleverness closes it.

**The most likely honest answer** [INFERENCE]: the viable configuration is **India for users, the West for revenue** — build the daily-habit product in the market where you can acquire cheaply and where UPI/Swiggy integrations create a real feature moat, and monetise the subscription against US/EU users at $19.99 where the price genuinely undercuts Splitwise by 50% and where RPI is ~5x higher. That requires the comparison-SEO channel of 14.5 and an English-language, Splitwise-switcher positioning — neither of which Splitify currently operates.

### 15.6 The advertising/tracking contradiction — a monetisation own-goal

**[FACT, per brief]** Splitify's declared App Store privacy label includes **Third-Party Advertising and cross-app tracking**, in an app that **syncs bank and credit-card accounts** [FACT — App Store description].

**[INFERENCE]** This is the single most self-defeating decision in the product's monetisation design, on three counts:

1. **It contradicts the premium pitch.** The reason to pay ₹999 is to not be the product. A declared ad-tracking label undercuts the value proposition of the very thing being sold.
2. **It is a trust catastrophe for bank sync specifically.** Asking an Indian user to connect their bank account to an 18-rating app from a company whose support address is a Gmail account, whose privacy label says it tracks them across other apps — this is not a conversion problem, it is a *download* problem. Bank sync requires more trust than any other consumer feature and Splitify has spent its trust budget on an ad SDK.
3. **The revenue does not justify it.** At 1,000+ installs, third-party ad revenue is functionally zero. Splitify has taken on the full reputational cost of ad-tracking for none of the benefit — and Splitwise's own 2023 experience shows interstitial ads generate quoted-for-years user anger [FACT].

Almost certainly this is an unexamined SDK default (analytics/attribution library declared conservatively) rather than a deliberate strategy [INFERENCE]. That does not reduce the damage: the label is what users see.

---


---

# SECTION 16 — Security & Privacy

### 16.1 The core contradiction

Splitify sits in the highest-trust consumer software category — an app that reads your bank transactions, your SMS, and your contacts — while simultaneously declaring, on Apple's own privacy label, that data **linked to your identity** (including **financial info**) is used for **Third-Party Advertising** and **may be used to track you across apps and websites owned by other companies** (lead-verified App Store privacy label). Legitimate personal-finance apps almost universally decline that declaration precisely because it is disqualifying for the category.

The Android declaration is, if anything, worse in one specific respect:

> Under "**Data shared** — Data that may be shared with other companies or organisations", Splitify lists **Messages → Emails, SMS or MMS**, purposes: "**App functionality, Analytics, Personalisation**". — [Google Play Data safety](https://play.google.com/store/apps/datasafety?id=com.akhash.splitify&hl=en_IN)

Your bank SMS bodies are declared as shared with third parties for **analytics and personalisation**, not merely for functionality.

### 16.2 Vendor claim vs. verifiable reality

| Vendor claim | Where claimed | Reality | Verdict |
|---|---|---|---|
| "End-to-End Encryption" | [getsplitify.com](https://getsplitify.com/) | Expense data is sent to Google Gemini and OpenAI for processing ([privacy.html](https://getsplitify.com/privacy.html)); receipt photos are declared shared with third parties ([Data safety](https://play.google.com/store/apps/datasafety?id=com.akhash.splitify&hl=en_IN)). E2EE is definitionally impossible when the server and its subprocessors read the plaintext | **False as stated.** At best this means TLS + at-rest encryption |
| "Encryption at rest and in transit" | [getsplitify.com](https://getsplitify.com/) | Play's security practices declare **only** "Data is encrypted in transit" — no at-rest practice is claimed to Google | **Unsupported by the vendor's own regulatory declaration** |
| Ad partners get only "installs, sign-ups, and subscriptions… never expense details or receipt images" | [privacy.html](https://getsplitify.com/privacy.html) | Play Data safety declares Photos, Emails, SMS, App interactions and Personal info as **shared**, with Personalisation and Advertising/marketing among the purposes | **Directly contradicted by the Play declaration.** One of the two documents is wrong; both are legally binding representations |
| "No Stored Credentials… Read-Only Access" | [getsplitify.com](https://getsplitify.com/) | Plausibly true for the **Plaid** channel (token-based, **INFERENCE**). Says nothing about the **SMS/email** channel, which is broader, is not read-only in any meaningful sense, and is invisible on the marketing site | **Technically narrow, materially misleading by omission** |
| "Bank & Credit Card Sync – Securely connect accounts" (India-first app) | [Play description](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN) | The only aggregator evidenced is **Plaid**, whose Indian retail-bank coverage is minimal; the screenshot bank is **Wells Fargo** (US). Indian users are realistically served by **SMS scraping** | **Feature parity by geography is unclear and probably poor for the app's primary market** |

### 16.3 Permission surface

| Platform | Permission | Declared purpose | Comment |
|---|---|---|---|
| Android | `read your text messages (SMS or MMS)` | Bank-alert transaction extraction | **The single highest-risk permission a consumer app can hold.** Google restricts SMS access to apps whose *core functionality* requires it; retention of this permission implies an approved declaration, but bank OTPs and every other sensitive SMS transit the same inbox |
| Android | `read your contacts` | Friend invitations | Contacts are also declared **collected** in the iOS privacy label as linked-to-identity |
| Android | `read phone status and identity` (×2 groups) | — | Device/identity signal; unusual to need |
| Android | `take pictures and videos` (Camera) | Receipt scanning | Justified |
| Android | read/modify USB storage | Receipt images / import file | Legacy-style broad storage scope |
| Android | run at startup, prevent device from sleeping, full network access, view/change network connectivity, receive data from Internet, Play licence check | FCM + billing | Routine |
| iOS | Camera, Photos, Contacts, ATT (tracking) | Per [privacy.html](https://getsplitify.com/privacy.html) | iOS has **no equivalent SMS-read capability** — INFERENCE: the SMS channel is Android-only, and iOS users get email linking instead |

Source for the Android permission list: [Play listing permission payload](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN).

### 16.4 Regulatory posture

| Regime | Status | Evidence |
|---|---|---|
| **India DPDP Act 2023** | **Not mentioned anywhere.** No Data Protection Officer, no consent-manager language, no notice/withdrawal-of-consent framing, no grievance officer | [privacy.html](https://getsplitify.com/privacy.html), [terms.html](https://getsplitify.com/terms.html) |
| **GDPR** | **Not mentioned.** No lawful basis, no data-subject rights section, no EU representative, no international-transfer mechanism — despite $ pricing and a US storefront presence | [privacy.html](https://getsplitify.com/privacy.html) |
| **CCPA** | The **only** privacy regime referenced | [privacy.html](https://getsplitify.com/privacy.html) |
| **India IT Rules / grievance officer** | **Not found** — Indian intermediaries are ordinarily expected to publish a named grievance officer with contact details | [privacy.html](https://getsplitify.com/privacy.html), [contact.html](https://getsplitify.com/contact.html) |
| **RBI / Account Aggregator framework** | Not engaged. No AA, no NBFC-AA partner, no regulated data-fiduciary posture for Indian bank data | No evidence found |

**This is the second major finding:** an India-registered company, headquartered in Tamil Nadu, litigating in Chennai, pricing in ₹, ingesting Indian bank SMS — with a privacy policy that addresses only *California* law and is silent on the DPDP Act it is actually subject to.

### 16.5 Deletion, retention, and children

| Item | Finding | Source |
|---|---|---|
| Deletion route | **Email only** to a gmail.com address; completed "within 60 days" | [privacy.html](https://getsplitify.com/privacy.html) |
| In-app self-serve deletion | **Not found** | — |
| Residual data after deletion | "Shared expense data remains visible to other users" — no anonymisation commitment described | [privacy.html](https://getsplitify.com/privacy.html) |
| Retention schedule for anything else (SMS bodies, receipt images, LLM prompt logs) | **None stated** | [privacy.html](https://getsplitify.com/privacy.html) |
| LLM vendor retention / no-training commitment | **Not stated.** No claim that Gemini/OpenAI are used under zero-retention or no-training terms | [privacy.html](https://getsplitify.com/privacy.html) |
| Children | Policy: service "not intended for use by anyone under the age of 13". Store rating: **12+ on both platforms** | [privacy.html](https://getsplitify.com/privacy.html) vs [iTunes lookup](https://itunes.apple.com/lookup?id=6756657540&country=in) / [Play](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN) |

The 12+ rating against a stated 13+ floor is a small but real compliance inconsistency: the stores are actively marketing the app to a cohort the policy excludes.

### 16.6 Positive security observations (for balance)

- Auth rests on **Firebase Authentication**, a mature managed identity provider — better than a hand-rolled auth layer at this team size ([init.json](https://getsplitify.com/__/firebase/init.json)).
- Firebase Auth `authorizedDomains` is correctly scoped to only `localhost` and the two project domains — no stale or wildcard entries (identitytoolkit public config, 6 Aug 2026).
- **Android App Links are cryptographically verified** via a correctly served `assetlinks.json`, so `/join/*` invite links cannot be hijacked by a lookalike app ([assetlinks.json](https://getsplitify.com/.well-known/assetlinks.json)).
- The Plaid redirect path is scoped to `/plaid/*` and `/join/*` rather than a wildcard `/*` in the hand-authored AASA — good practice ([.well-known/apple-app-site-association](https://getsplitify.com/.well-known/apple-app-site-association)).
- **Mandatory phone verification** genuinely does raise the cost of the fake-account/social-engineering attacks that plague expense-splitting apps, and the developer defends it publicly and coherently ([Play review reply, 23 May 2026](https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN)).
- Using **Plaid** rather than credential-sharing or screen-scraping is the right architectural choice where Plaid coverage exists.
- The AI assistant **explains its own calculation method** to the user rather than emitting a bare number (screenshot 8), and the ToS carries an explicit "not financial advice" disclaimer ([terms.html](https://getsplitify.com/terms.html) §9).

### 16.7 Net assessment

**INFERENCE (analyst judgement, clearly labelled):** Splitify is a competently assembled, fast-moving solo-or-small-team product built entirely on managed services, with a feature surface that credibly exceeds Splitwise's on personal-finance and AI. Its security *architecture* choices (Firebase Auth, Plaid, verified app links) are reasonable. Its security and privacy *posture* is not: it markets encryption guarantees its own regulatory filings do not support, it declares bank-adjacent data as shared for advertising and personalisation, it holds Android SMS-read access whose scope is invisible in its marketing, and it addresses the wrong privacy jurisdiction entirely. For a competitive-intelligence report, the defensible framing is: **strong product velocity, weak trust infrastructure — and in personal finance, trust infrastructure is the product.**

---


---

# SECTION 17 — Performance Analysis

All conclusions here are reasoned from artefact evidence. **I have run no benchmarks and have no crash, ANR, or telemetry data.** Everything is labelled.

**Binary size — 114.8 MB (114,756,608 bytes). OBSERVED.** Large for a finance app with no media library, no maps, and no offline content. The plausible composition (**INFERRED**): a Flutter engine and framework (~15–25 MB per architecture before App Store thinning), the Firebase SDK suite (Auth, Firestore, Analytics, Crashlytics, Messaging — routinely 15–25 MB together), RevenueCat, bundled icon and illustration assets including the raster stock illustration on Add Expense, bundled fonts, and image/vision dependencies for receipt capture. Because Apple reports the *unthinned* universal size, the per-device download is likely materially smaller — but 114.8 MB is still the number a user sees on the store page, and on a metered Indian mobile connection it is a real install-conversion tax. **The size is a symptom of the framework choice, not of feature richness.**

**iOS 18.0 minimum. OBSERVED — and the most questionable technical decision in the product.** For an app first released 5 Jan 2026, requiring iOS 18 excludes every iPhone that cannot run it and every user who has not updated — plausibly 15–25 % of the active iOS base at launch, skewed toward older and cheaper devices, i.e. **exactly the India-first audience the app targets**. Nothing in the observed feature set requires an iOS 18 API: card lists, charts, camera capture, and HTTP calls to an LLM are all long-available. The far more likely explanation (**INFERRED**) is an unexamined default deployment target left at whatever Xcode proposed. This is free addressable market being discarded, and it is a one-line fix.

**Cold start. INFERRED.** A Flutter app of this weight with a Firebase initialisation chain typically lands in the 1.5–2.5 s range on recent iPhones and 2–4 s on mid-tier Android. If the Home tab (v1.4.3) computes analytics at launch rather than serving a cached snapshot, add to that — an analytics home is the worst possible thing to put in front of a cold start unless it renders from cache first.

**Network-bound waits. INFERRED from observed features.** Four unavoidable multi-second operations: receipt OCR/LLM extraction, AI chat generation (Gemini or OpenAI, per the privacy policy), bank-alert sync, and Splitwise import parsing. None can be made instant; all can be made *tolerable* through streaming and progressive disclosure. The AI Chat screenshot shows a complete ~300-word response with **no streaming indicator, no partial text, and no stop control** — consistent with awaiting the whole response and then rendering it. If so, the app's headline AI feature presents a blank grey bubble for several seconds. **The cheapest available performance win in this product is perceived, not actual: stream the tokens.**

**Offline capability. INFERRED, low confidence.** No evidence either way. Two opposing signals: if the backend is Firestore, offline persistence and optimistic local writes come nearly free, which would make "add an expense at a restaurant with no signal" work by default — the single most important offline case for a splitter. But if the app is REST-over-Firebase-Auth, offline was probably never built. Given the feature velocity and the absence of any offline messaging in marketing, I lean toward **partial or absent offline support**. This is the highest-value unknown in this section and the first thing I would test with a device.

**Caching. INFERRED.** Balances are described as "real-time", implying a live subscription rather than a cached read — good for correctness, costly for battery and cold start. The bank-alert feed and AI responses are strong caching candidates; there is no evidence of a caching strategy either way.

**Battery. INFERRED, low confidence.** Likely modest. A live balance subscription and periodic background sync of bank alerts are the two draws; neither is location, audio, or camera-continuous. Receipt capture is bursty. Nothing here suggests a battery problem, and no user has reported one in the three visible reviews.

**Network usage. INFERRED.** Small, frequent JSON payloads for ledger sync; occasional large uploads for receipt images (which, if uploaded uncompressed from a modern camera, are 3–8 MB each — a compression check would be my first profiling step); and LLM request/response bodies that are text-cheap but latency-expensive.

**Release cadence — the one hard signal. OBSERVED.** Eleven releases between 6 Jun and 6 Aug 2026, including 1.4.7 through 1.4.11 within nine days, **every one labelled "Bug fixes & improvements"**. Two readings: healthy continuous delivery, or a post-1.4.0 stability problem being chased. I cannot distinguish them without crash data. What is unambiguous is the **changelog hygiene failure** — twenty of the twenty-five most recent version notes are that identical string, which tells returning users nothing and wastes a free retention surface. The four informative notes ("now split by shares", "historical spending in insights", "spending pace in budgets", "added a home tab") show the team *can* write them and simply does not.

---

# SECTION 18 — Design Inspiration

### The three patterns worth stealing

**1. The natural-language configuration line — "Paid by *Akhash A.* and split *equally*". OBSERVED, Add Expense.**
A sentence in plain English where the variables are the controls. It works for three reasons that compound. Mechanically, it collapses two pickers (payer, split method) into one line and removes a whole screen from the flow. Cognitively, it states the **current default explicitly** rather than leaving the user to assume it — most add-expense forms make you open a split screen just to confirm it says "equally", and this one never does. Psychologically, it exploits the fact that reading a sentence is a single act of comprehension while parsing two labelled dropdowns is two; the teal inline tokens then carry an unmissable affordance without any chrome. Splitwise pioneered the shape and Splitify's execution is clean. **This is the most transferable pattern in the product** and it generalises far beyond expenses — any form with sensible defaults and occasional overrides should consider it.

**2. The Budgets screen's hero-plus-redundant-encoding composition. OBSERVED, Budgets.**
One solid-orange full-bleed card carrying a ring, "80% used", "$1922 of $2400", "$478 remaining", and "⚠ 7 days left this month" — then a uniform list of compact category rows below. It works because of a strict hierarchy decision: **exactly one number is allowed to be large**, and everything else is subordinate. The orange fill does double duty as decoration and as status, so colour carries meaning at the largest available size and is read pre-attentively, before any text is parsed. Then each category row encodes its state **four independent ways** — bar colour, bar length, a worded badge ("NEAR LIMIT" / "ON TRACK"), and a percentage. That redundancy is what makes it robust: it survives colour-blindness, survives a glance too short to read, and survives a screenshot at thumbnail size. And the pairing of "$478 remaining" with "7 days left" is the real insight — a budget is meaningless without a time denominator, and most budget UIs omit it. **Steal the redundancy discipline and the resource-plus-time pairing.**

**3. The removable AI context chip — `🏠 Home ✕` beside "Add Context". OBSERVED, AI Chat.**
A small, visible, dismissible chip showing exactly what data the assistant can see. This solves the central trust problem of AI-over-personal-data, which is not accuracy but **scope ambiguity** — users cannot reason about an answer when they do not know what was consulted. Making scope a visible, manipulable object turns an invisible system state into a direct-manipulation control, and the `✕` makes it reversible, which is what converts anxiety into experimentation. It also improves answers, since a narrowed context produces a better response and the user learns that by doing. Almost no consumer AI feature does this. **Transferable to any assistant over private data.**

**Runners-up worth noting:** the pastel category tiles (44px rounded squares, tint per category, dark line glyph) which make long ledgers scannable at a cost of near zero; the pale-green tinted settlement rows that give a state change a different visual class from a cost; and the Import-from-Splitwise screen's honest two-option framing with a plain "OR" divider, which respects that migration is a chore and does not dress it up.

### What should NOT be copied

- **The signup wall.** Name + email + **verified phone** before first value, on a product whose growth depends on inviting friends. It throttles the exact loop the app needs. Publicly objected to in one of only three visible reviews.
- **Any button decision.** Five treatments with no hierarchy mapping, ALL-CAPS Material labels shipped unedited onto iOS, and a primary action row clipped off-screen with no scroll affordance.
- **The red/green semantic inversion.** Red means "you owe" on the group screen and "you paid" on the personal screen. Never let your fastest visual cue change referent between adjacent contexts.
- **The chart palette divorce.** Donut categories use a generic categorical set unrelated to the pastel tints those same categories carry in every list, so "Rent" has two colours in one app.
- **Unformatted and untidied data.** `₹624634.57` with no digit grouping in an India-first app; `Uber 063015 SF**POOL**` and `CREDIT CARD 3333 PAYME…` shipped raw — in App Store screenshots. Cleaning merchant strings *is* the perceived quality of a transaction feed.
- **The stock illustration.** An orange/blue line-art asset in a teal app, occupying the half-screen where a live split preview belongs. Empty space should be filled with something useful before something decorative.
- **iOS 18.0 as a minimum** for a feature set that needs nothing newer than iOS 15 — free addressable market discarded by an unexamined default.
- **The iPad build.** A stretched phone layout with 700px of dead space between a label and its number. Ship a real layout or ship iPhone-only.
- **"Bug fixes & improvements" ×20.** A free retention surface, wasted.
- **Ending settlement at "mark as paid"** in a UPI market. The moment of highest intent is handed to another app.

---


---

# SECTION 19 — Version Comparison

### 19.1 Splitwise — DOCUMENTED evolution

**[FACT] — all cited.**

| Era | Milestone | Strategic function | Source |
|---|---|---|---|
| 2011 | Founded, originally **"SplitTheRent"**, rent-splitting only; broadened to general expense sharing | Wedge on the highest-frequency, highest-stakes recurring split | en.wikipedia.org/wiki/Splitwise; businessmodelcanvastemplate.com |
| Sept 2013 | **"Settle Up with Splitwise and Venmo"** — settlement via Venmo | Closes the loop: from *tracking* debt to *clearing* it. Payment rail ≠ owned rail | blog.splitwise.com/2013/09/11/introducing-settle-up-with-splitwise-and-venmo/ |
| 2018 | **Splitwise Pro** launches (receipt scanning, currency conversion) | First real monetisation, ~7 years after founding — utility features, not core-action gating | businessmodelcanvastemplate.com |
| ~2023 | **Free-tier daily expense limits (~3–5/day) + interstitial ads** | Monetisation moves from *adding value* to *withholding it*. Substantial backlash (S14.6) | itvoice.in; split-circle.com; nomadcrew.uk |
| Apr 2024 | **Tink (Visa) partnership — pay-by-bank in-app** | Second settlement rail, this time open-banking. Convergence with the bank-sync thesis | pymnts.com/news/payment-methods/2024/tink-teams-with-splitwise-to-offer-pay-by-bank/ |
| 2026 | ~$6.6M est. revenue, 53 employees, ~$29.3M raised (Insight Partners led $20M Series A, Apr 2021) | [ESTIMATE — Growjo/Crunchbase/Tracxn, third-party, unaudited] | growjo.com/company/Splitwise; crunchbase.com |

**[INFERENCE] The shape of that history:** Splitwise took **seven years to charge anything** and **twelve to gate the core action**. It spent the first decade almost purely accumulating the network, then monetised from a position of near-monopoly. Note also what Splitwise *never* did: it never built personal expense tracking or bank sync as a PFM product. It went sideways into **settlement** (Venmo → Tink), not into **budgeting**. Splitwise's thesis is that the money-movement moment is where value sits. Splitify's thesis is the opposite.

Also worth stating plainly: **$6.6M revenue on $29.3M raised after 15 years** [ESTIMATE] is a modest outcome for the category's undisputed global winner. That is the ceiling evidence for anyone modelling a splitter business — and it comes from a company monetising primarily *US* users at $39.99.

### 19.2 Splitify V1 → V2 → V3 — RECONSTRUCTION

> ⚠️ **THIS SECTION IS RECONSTRUCTION AND INFERENCE. IT IS NOT DOCUMENTED HISTORY.** Splitify publishes no roadmap, no version narrative and no changelog beyond store release notes. The versioning below is my analytical framing imposed on observed release dates and the current feature set; Splitify has never described its product in "V1/V2/V3" terms. Only the release dates and feature list are FACT.

**Observed evidence base [FACT]:**

| Version | Date | Note |
|---|---|---|
| 1.3.7 | 25 May 2026 | — |
| 1.3.10 | 12 Jun 2026 | — |
| 1.3.11 | 16 Jun 2026 | — |
| 1.4.3 | 23 Jul 2026 | **"Home tab with analytics"** |
| 1.4.8 → 1.4.11 | early Aug 2026, days apart | 1.4.11 shipped within hours of observation; Play last-updated 6 Aug 2026 |

Current feature set [FACT — App Store description + getsplitify.com]: group splitting; smart splits (equal/amount/percentage/item-wise); **AI receipt scanner**; **import from Splitwise**; **bank & credit-card sync**; auto-categorisation; spending insights; monthly budgets; recurring expenses; **net worth tracking**; **AI finance assistant**.

**Reconstructed phases [INFERENCE — all of it]:**

| Phase | Probable scope | Evidence supporting the reconstruction | Strategic function |
|---|---|---|---|
| **V1 — "Be Splitwise, cheaper"** (≤ 1.3.x) | Groups, splits, balances, settle-up, **Import from Splitwise** | Import feature only makes sense as a launch-era switching wedge; 1.3.x cadence looks like stabilisation of a shipped core | Table-stakes parity + switching path. **Cannot win on this alone** — parity with a 15-year incumbent at 0.1% of its rating volume |
| **V2 — "Add the daily habit"** (1.4.0–1.4.3) | Personal expense tracking, budgets, categorisation, **Home tab with analytics** | 1.4.3's changelog line is the visible seam: the app's front door is restructured around analytics, not balances | Escape episodic retention. Convert a trip app into a daily app |
| **V3 — "Become a finance app"** (1.4.4+ → current) | **Bank/credit-card sync**, net worth, AI receipt scanner, AI assistant | The heaviest features are present now but absent from the reconstructable earlier phases; 114.8 MB binary is consistent with a late-stacked AI + aggregation payload | Own the whole financial picture — and, critically, the **data** |

**Why the "Home tab with analytics" line (1.4.3) is the pivot marker** [INFERENCE]: version numbering is cheap, but *front-door* changes are expensive and deliberate. Moving the home surface from balances to analytics is the moment the product stopped being a splitter with extras and became a finance app with splitting attached. Everything after it — bank sync, net worth, AI assistant — follows from that decision.

**Why a splitter bolts on personal finance and bank sync — the strategic logic** [INFERENCE]:

1. **Retention.** Splitting is episodic (trips, dinners); PFM is daily. Bolting on a daily surface is the only way to raise session frequency without changing the user.
2. **Pricing justification.** ₹999/yr is indefensible for arithmetic that Spliit does free in a browser. It is *arguably* defensible for bank aggregation + AI + net worth. **The feature stack exists to hold up the price.**
3. **ARPU per user is capped, so widen what you sell.** If only ~1/n users (the organisers) will ever pay, you must sell them more per head.
4. **Data.** This is the real one. Bank-sync spend data is the raw material for the only Indian monetisation model with meaningful revenue-per-user — credit-card, loan, insurance and investment referral (15.4/15.5). **A splitter knows who you eat with. A bank-sync app knows what you can borrow.**
5. **The declared advertising/tracking privacy label is consistent with (4)** [FACT that the label exists; INFERENCE that it is connected] — an app that intends to monetise attention or spend data declares exactly those things.

**What this says about their monetisation thesis** [INFERENCE]: Splitify is not really trying to be a better Splitwise. **Splitting is the acquisition wedge — cheap, viral, well-understood — and personal finance is the intended monetisation surface.** The subscription is likely a bridge, not the destination; the destination is financial-product distribution off the back of aggregated spend data. This is the Indian consumer-fintech playbook (15.5) and it is coherent.

**Where the thesis is fragile** [INFERENCE]:

- **It is a scale bet made at 1,000+ installs.** The affiliate model needs millions of users. PhonePe earns only ~8% from distribution *at national scale while losing ₹1,727 Cr/yr* [FACT]; Fi Money abandoned the consumer path entirely [FACT]. The strategy is right and the runway is the problem.
- **Bank sync demands maximum trust at a moment of minimum credibility** — 18 iOS ratings, 3.0★ in the US, a Gmail support address, and a privacy label declaring cross-app tracking [FACT]. These are mutually reinforcing negatives.
- **It abandons the strongest weapon while it still had value.** Every engineering hour in bank sync and net worth is an hour not spent on group virality, WhatsApp share artefacts, a web-viewable balance, or the "swi̇tch from Splitwise" content channel — the things that actually generate the users the thesis depends on.
- **The daily-versus-episodic bet may simply lose.** PFM apps have poor standalone retention; Splitify now competes with Splitwise *and* the entire Indian PFM field at once, with one small team and a 3-day release cadence.
- **The release cadence itself is ambiguous** [INFERENCE]: 1.4.8→1.4.11 in ~6 days is either fast, healthy iteration by a small team, or firefighting after a large, under-tested V3 release. From release dates alone the two are indistinguishable — but a 114.8 MB app that just added bank aggregation and AI makes the second reading at least as plausible as the first.

### 19.3 Head-to-head evolutionary logic

| | Splitwise | Splitify |
|---|---|---|
| Path after splitting | **Settlement** (Venmo 2013 → Tink 2024) [FACT] | **Personal finance + aggregation** (V2/V3) [INFERENCE] |
| Time to first monetisation | ~7 years [FACT] | Present at launch [FACT] |
| Time to gate the core action | ~12 years [FACT] | Unknown; free-tier limits undisclosed |
| Implied thesis | Value sits at the moment money moves | Value sits in the data about where money went |
| Monetisation reality | Subscription, ~$6.6M/yr, mostly Western [ESTIMATE] | Subscription today; affiliate/distribution implied [INFERENCE] |
| Blocking constraint | Network defensible; growth mature | **Distribution. Everything else is downstream of having no users** |

**[INFERENCE]** The instructive contrast is *sequencing*, not direction. Splitwise spent a decade building the network before extracting from it, and even its aggressive 2023 extraction came from a monopoly position. Splitify has assembled a V3-scale feature stack and a V3-scale price on a V1-scale user base. The features are not wrong; the order is.

---


---

# SECTION 20 — Bakaya's Product Roadmap

## 20.1 The one decision to make before reading the roadmap

[I] The monetisation analysis (§15) produces an uncomfortable conclusion: **India/SEA revenue-per-install is $0.08 at D14 against $0.38 in North America, and year-one LTV per payer is $14 against $32.** At category-median conversion, 1,000 Indian installs yields roughly ₹14,000–21,000/year gross. An India-only subscription splitter needs on the order of a million installs to fund a single engineer.

Meanwhile your app is **India-only by construction**: `₹` is hardcoded in the mobile formatter *and* in server-side push notification bodies, the locale is pinned `en-IN`, dates are hard-pinned to `Asia/Kolkata`, and **no model has a `currency` field at all**.

That is a fork, and drifting through it is the expensive option:

| Path | What it means | Cost | My assessment |
|---|---|---|---|
| **A. India-only, free** | Accept near-zero subscription revenue. Build the wedge, grow the graph, decide monetisation later from a position of traction | Low now | **Recommended for the next 6 months** |
| **B. India users, Western revenue** | Multi-currency, i18n, comparison-SEO in English, $19.99 pricing against Splitwise's $39.99 | 6–10 person-weeks before a rupee arrives | Correct eventually, wrong now |
| **C. India-only, paid** | Charge ₹999 against Splitkaro at ~₹450 and free Tricount/Spliit | Low | **Do not.** You would be repeating Splitify's error |

**Recommendation: Path A now, with one exception.** Add the `currency` field to your money models in the next two weeks even though nothing will use it. Retrofitting currency into a money schema after you have production ledgers is among the most expensive migrations in this class of product — every historical amount becomes ambiguous. The field costs two days now. Leaving the knob unturned is not the same as leaving it out.

This is the only Path-B investment I recommend making early, and it is a schema decision, not a product decision.

## 20.2 Version 1.1 — Quick wins (next 2 weeks)

**Theme: stop the bleeding, then ship the cheapest high-return items.**

Nothing here is strategic. All of it is either broken, dangerous, or absurdly cheap relative to return.

| Priority | Item | Effort | Rationale |
|---|---|---|---|
| **P0** | Role-gate `/api/v1/users` CRUD | Hours | Live authorisation hole. Any authenticated user can list and mutate other users |
| **P0** | Fix `EXPO_PUBLIC_API_URL` in the production EAS profile | Hours | The production build cannot boot |
| **P0** | Apple Sign-In | 3–5 days | Blocks App Store approval outright |
| **P0** | Crash reporting (Sentry or Crashlytics) + product analytics | 2–3 days | You currently cannot see crashes or behaviour. Every subsequent prioritisation improves once this lands |
| **P1** | User-settable expense date | 2 days | RICE rank 1. Users cannot log yesterday's dinner |
| **P1** | Persist `splitType` on `GroupExpense` | 2 days | Kills the `<0.02` heuristic; ends silent percentage→exact degradation |
| **P1** | `currency` field on money models (no UI) | 2 days | §20.1 |
| **P1** | In-app calculator on the amount field | 1–2 days | The category's #1 request — 955 votes, still unshipped by the incumbent |
| **P1** | Push deep-link to the correct group | 1 day | Payload lacks `groupName`; taps currently land on the list |
| **P2** | Digit-grouping / `en-IN` formatting audit | 1 day | Splitify ships `₹624634.57` in its own store screenshots |
| **P2** | Create-group → new group; toast instead of blocking `Alert` | 1 day | Both named in your own UX audit and still open |

**Exit criteria:** the app builds and ships, no known authorisation holes, you can see crashes and usage, and no money data is silently lost on edit.

## 20.3 Version 1.2 — Next month

**Theme: close the viral ceiling and the India settlement gap.**

These two items are the highest-leverage non-blocker work available to you, and they are the two places where Splitify beats you or ties you badly.

| Priority | Item | Effort | Rationale |
|---|---|---|---|
| **P1** | **Invite by link + no-account participants** | 2 weeks | `invitedUserId` is required, so you cannot invite anyone who has not already signed up. **This is a hard cap on growth**, not a UX inconvenience |
| **P1** | **UPI deep-link on settle-up** | 3–5 days | Neither you nor Splitify has it. Splitwise has left it "Under review" for years with 458 votes. NPCI's Oct 2025 change killed the *collect-request* mechanic and left payer-initiated deep links standing |
| **P1** | iOS push via APNs | 1–2 weeks | Half your platforms have no retention mechanic |
| **P1** | Email verification + password reset | 1 week | A lockout in a finance app blocks access to money owed. Splitify's reset is *publicly reported broken* — do not repeat it |
| **P1** | Tests on splitting math, balances, settlement cap | 1.5 weeks | Zero coverage on money logic today |
| **P2** | Payment reminders — **inviter-triggered, never system-triggered** | 1 week | See §21 on why this distinction matters |
| **P2** | Group expense search/filter + group CSV export | 4 days | Cheap consistency; feeds the data-portability story |

**Exit criteria:** a user can get a friend into a group with one shared link and no signup on the friend's part, and can settle with one tap into their UPI app.

## 20.4 Version 2 — Next quarter

**Theme: build the moat and finish the settlement story.**

| Priority | Item | Effort | Rationale |
|---|---|---|---|
| **P1** | **`profileId` on `GroupExpense` + `$unionWith` in the analytics pipelines** | 3 weeks | **The wedge.** Your differentiator currently dies at the group boundary. This is the one thing competitors need a data migration to match |
| **P1** | **Server-side debt simplification, both directions, on web and mobile** | 1.5 weeks | An under-attacked lane. Splitwise concedes its version confuses users, buries it in settings, and has never shipped it to mobile |
| **P1** | **Explainable settlement** — show *why* A pays C when A never transacted with C | 1 week | The actual unsolved problem. Nobody in the category has fixed it |
| **P2** | Web-viewable group balance, no install required | 1.5 weeks | Removes the largest single leak in the invite funnel |
| **P2** | Accessibility pass | 2 weeks | 2 accessibility props in ~17.8k lines of UI. Non-negotiable |
| **P2** | Actually migrate screens to TanStack Query | 2–3 weeks | The persister, the query client and a 59-line key factory are already built and serving one integer |
| **P2** | Receipt attachments | 2 weeks | Your first object-storage dependency |
| **P3** | Dark mode | 1.5 weeks | Table stakes, not a differentiator |
| **P3** | Recurring expenses | 2 weeks | Rent and utilities — the highest-frequency India use case |

**Exit criteria:** you can answer "how much of the Goa trip was Mom's share", and a user can understand why the app is telling them to pay a particular person.

## 20.5 Version 3 — 6 months

**Theme: compound the Profile asset into things nobody else can build.**

| Item | Effort | Rationale |
|---|---|---|
| **Recurring cash payout tracker** (maid, cook, driver, parents' allowance) | 2.5 weeks | The highest India-value-to-effort ratio available. Every competitor assumes both parties are app users. Yours does not |
| **Forgiveness Ledger** — "On me" as a third settle action | 1.5 weeks | Every split app's data model contains a lie: balances are either paid or deleted. Making write-off first-class is emotionally honest and makes the annual statement far better |
| **Annual Relationship Statement** | 3 weeks | The growth loop. A *person-based* year-in-review ("you spent ₹47,000 on your brother, and forgave ₹3,200 of it") is far more shareable than a category pie chart, and is only computable because of Profiles |
| **Cross-group netting**, opt-in per pair | 3 weeks | Splitwise's group isolation is architectural. Pairs perfectly with the UPI work |
| **Learned split defaults** | 3 weeks | No LLM required — a frequency table over `{groupId, category, participantSet}` gets most of the value |
| **Comments / activity feed** | 2 weeks | The feature Splitwise gets most credit for |
| **Full offline-first with a mutation queue** | 4–6 weeks | "Add an expense at a restaurant with no signal" is the category's core offline case |

## 20.6 Version 4 — 12 months

**Theme: decide the business, then build for it.**

By this point you should have telemetry, a real user base, and evidence. The items here are deliberately conditional, because committing to them now would be guessing.

| Item | Condition |
|---|---|
| **Hinglish / natural-language expense entry** | If telemetry shows entry abandonment is your churn driver — which is the hypothesis, not yet a fact |
| **On-device receipt OCR** | Sell as privacy and offline capability, not as "AI". Free via ML Kit, zero marginal cost |
| **Multi-currency + i18n + Western positioning** | Only on evidence that India retention is solid and the graph is compounding. Path B from §20.1 |
| **Monetisation** | Only after the above. See §21 on what to charge for — and, more importantly, what never to gate |
| **Enterprise / SME** | [I] I recommend against. It is a different product with a different buyer |
| **Bank sync** | [I] Recommend against indefinitely. Licensing-blocked, and it forfeits the privacy position that is your best story |

## 20.7 What this roadmap deliberately omits, and why

| Omitted | Reason |
|---|---|
| A paywall or billing system | §15: Indian subscription revenue for a splitter is a rounding error. Building billing now is speculative work against a business model the evidence contradicts |
| An AI chat assistant | Splitify aimed its LLM at *querying* spending. The friction is in *recording* it. Query-side AI demos better and delivers less |
| Net worth tracking | Requires the bank sync you cannot have, to answer a question nobody is asking you |
| Item-wise receipt splitting | Four competitors ship it. Parity, not advantage |
| Gamification | Debt between friends is not a game. Streaks on money owed read as tacky |
| A referral programme | Incentivised referral before product-market fit buys installs that churn |

---

# SECTION 21 — Product Recommendations

## 21.1 What should I NEVER copy?

| # | Do not copy | Why |
|---|---|---|
| 1 | **Splitify's signup wall** — name + email + verified phone before any value | It throttles the exact loop the product needs. One of only three public reviews objects to it, and the developer defends rather than defers it. Phone verification belongs at first-friend-add, not first-launch |
| 2 | **Declaring third-party advertising and cross-app tracking on a finance app** | Splitify pays the full reputational cost of ad-tracking for functionally zero revenue at its scale. In a bank-adjacent app, this is disqualifying |
| 3 | **Claiming "End-to-End Encryption" you cannot deliver** | Splitify claims E2EE while sending expense data to Gemini and OpenAI, and its Play declaration claims only encryption in transit. A false security claim is worse than no claim |
| 4 | **Ending settlement at "mark as paid" in a UPI market** | The highest-intent moment in the product, handed to another app |
| 5 | **Gating the core action** | Splitwise's ~3/day free cap monetised the exact event that produces growth, and manufactured the entire "splitwise alternative" keyword industry its rivals now farm. Limit *analysis*, never *entry* |
| 6 | **iOS 18.0 as a minimum** | Free addressable market discarded by an unexamined Xcode default, in a product that needs the *whole group* to install |
| 7 | **"Bug fixes & improvements" ×20** | 20 of Splitify's last 25 changelogs are that identical string. A free retention surface, wasted |
| 8 | **Five button treatments with no hierarchy rule** | Splitify ships filled pills, filled rects, outlined pills, tinted pills and bare text actions with no mapping to rank |
| 9 | **Red/green semantics that invert between screens** | In Splitify, red means "you owe" on the group screen and "you paid" on the personal screen. Never let your fastest visual cue change referent |
| 10 | **Shipping raw data into the UI** | `Uber 063015 SF**POOL**` and `₹624634.57` appear in Splitify's own App Store screenshots. Cleaning merchant strings and formatting numbers *is* the perceived quality of a ledger |
| 11 | **Import without export** | Splitify imports from Splitwise and exports nothing. That is a lock-in signal users notice, and you already do better |

## 21.2 What should I definitely build?

In order of conviction:

1. **`profileId` on `GroupExpense`, plus unified analytics.** Your only structural moat. Everything else on this list can be copied by a competent competitor in a sprint.
2. **Invite by link with no-account participants.** Removes your hard viral ceiling.
3. **UPI deep-link settle-up, then transaction-reference capture.** Deep-linking is table stakes in India; capturing the reference from the response — which Niptao, FairShare and SpendSync all discard — is the step past parity, and it settles the most common dispute in the category.
4. **Explainable debt simplification.** The one genuinely unsolved UX problem, conceded by the incumbent.
5. **The in-app calculator.** 955 votes. Days of work. Then say you shipped it.
6. **Free, unlimited export — of groups too.** Tricount just deleted export from a 14M-download product. Splitwise paywalls it. This is a cheap, credible trust signal in a category burned by bait-and-switch.
7. **The Recurring Cash Payout tracker.** Maid, cook, driver, parents. Invisible to every competitor because their data model requires both parties to be users.

## 21.3 What features are overrated?

| Feature | Why it is overrated |
|---|---|
| **Bank sync** | Splitify's headline feature. It is licensing-blocked for you, reputationally expensive, and — in India — implemented by scraping SMS, which is Play-policy-prohibited for non-default-handlers. You can answer the same user question from your own two ledgers |
| **AI chat assistants** | Impressive in a screenshot, aimed at the wrong end of the funnel. Nobody churns because they couldn't *query* their spending |
| **Net worth tracking** | A PFM checkbox. It requires bank access to be accurate and answers a question a splitting user is not asking |
| **Item-wise receipt scanning** | Genuinely useful, entirely commoditised. Four competitors ship it |
| **Gamification** | Structurally wrong for the category |
| **Dark mode** | Table stakes, not a differentiator. Build it; do not expect credit |
| **Referral bounties** | Intrinsic virality is already the strongest form available to you. A bounty adds churn-prone installs on top of a loop that is not yet working |

## 21.4 What features are underrated?

| Feature | Why it is underrated |
|---|---|
| **An in-app calculator** | The single most-requested feature in the entire category, and it is a keypad |
| **No-account participants** | Splid holds 4.9★ from 3.9K ratings largely on "no signup, works offline". The category rewards restraint far more than features |
| **Number formatting and string cleanup** | Unglamorous, and it is most of what users perceive as "quality" in a ledger |
| **Release notes** | A free retention surface that the entire category wastes |
| **Free export** | Cheap, and it buys trust precisely because rivals are removing it |
| **Settlement-math legibility** | Every rival is fighting on price. Nobody is fighting here, and the incumbent has publicly conceded the problem |
| **Learned split defaults** | Groups have stable, boring habits, and every app makes you re-declare them weekly. Needs no AI |
| **Crash reporting and analytics** | Not a user feature at all. But you currently cannot see what breaks or what people do, and that makes every other decision a guess |

## 21.5 What creates stickiness?

[I] Stickiness in this category comes from **accumulated, irreplaceable, personal history** — not from features.

| Mechanism | Why it sticks |
|---|---|
| **The per-person ledger over years** | A three-year record of what you have spent on your mother cannot be recreated elsewhere. This is a far deeper lock-in than group balances, which zero out and become worthless |
| **Cross-group netting** | Once a pair's ledgers are merged across groups, unpicking them is painful |
| **The Forgiveness Ledger** | Emotional data has no export format |
| **Recurring cash payouts** | Becomes a monthly habit tied to real-world obligations |
| **Unsettled balances** | The classic mechanic — you return to make the number zero |

Note the asymmetry: **group balances are sticky only while non-zero.** A settled group is a dead group. Your Profile ledger is sticky *permanently*, because it is a record rather than an obligation. That is why it is the strategic asset.

## 21.6 What increases retention?

1. **Push done correctly — inviter-triggered, never system-triggered.** Push in this category carries the highest-intent payload in consumer fintech: *a named human owes you money*. It is also socially loaded. An automated "Rahul, you still owe Priya ₹400" reads as the app nagging on a friend's behalf and damages the friendship that keeps the group in the product. Let the organiser press "remind".
2. **A balance-first home screen.** Splitify moved its front door to analytics in v1.4.3, which dilutes the strongest retention trigger the category has. Your home screen should answer "who owes me and what do I do next", not "how am I doing".
3. **The personal ledger as a daily surface.** Splitting is episodic — trips, dinners, monthly rent. Personal tracking is daily. **You already have both halves**, which is the thing Splitify spent a bank integration trying to buy.
4. **Payday-aware reminder timing.** Reminders sent when someone is broke get ignored and then muted.
5. **Fixing the episodic-death problem.** Trip ends → group dormant → app deleted. Profiles and recurring payouts are what survive the trip.

## 21.7 What increases referrals?

The invite in this category is **intrinsic** — you cannot split a bill with yourself, and the inviter is chasing their own money rather than doing you a favour. That is the strongest form of virality in consumer software, and yours is structurally blocked.

| Lever | Impact |
|---|---|
| **Invite by link with no-account participants** | Removes the hard ceiling. Highest-impact growth change available |
| **Web-viewable balance with no install** | Removes the funnel's largest leak. In India specifically, invite→install is the biggest drop, because UPI makes settling *without* the app trivially easy |
| **A WhatsApp-native settle-up artefact** with a UPI deep link | In India, WhatsApp *is* the group layer. A clean shareable summary is the best distribution surface you have and it is currently unused |
| **The Annual Relationship Statement** | Person-based recaps are dramatically more shareable than category pie charts |

**One caution:** getting a friend to *join your group* is invite conversion, not virality. True compounding only happens when that friend creates **their own** group. Instrument that specific event once analytics lands — it is the number that tells you whether you have a growth engine or a treadmill.

## 21.8 What increases revenue?

Honestly, and this is the least comfortable section in the report:

[I] **In India, near-term, essentially nothing you can build will produce meaningful subscription revenue.** The evidence: India/SEA revenue-per-install $0.08 at D14; year-one LTV per payer $14; a free local incumbent (Splitkaro) at ~₹450/yr; two structurally-free rivals (Tricount, bank-subsidised; Spliit, open-source) that will never raise prices; and a category leader that reached only ~$6.6M revenue on ~$29M raised over 15 years.

What follows from that:

1. **Do not build billing yet.** It is speculative work against a model the evidence does not support.
2. **If you ever charge, gate *analysis*, never *entry*.** Splitwise's backlash came from capping the core action. History depth, export, insights and the annual statement are all defensible paid surfaces. Adding an expense never is.
3. **The household/family plan is the best subscription variant available**, because it converts the organiser-passenger asymmetry into an advantage — one payer covers n users, and flatmate rent-and-utilities is India's highest-frequency use case.
4. **The realistic revenue path is Western users at $19.99**, where the price genuinely halves Splitwise and revenue-per-install is ~5× higher. That requires multi-currency, i18n and English comparison-SEO — Path B in §20.1. It is a real option, later.
5. **Never sell the data.** It is the one asset that makes the privacy position credible, and the position is worth more than the data.

---


---

# SECTION 22 — Innovation Opportunities

### Estimating assumptions

All effort figures assume: **2 developers** (one RN/Expo + Next.js, one Bun/Express/MongoDB), no dedicated ML engineer, no dedicated designer; 1 person-week = ~4 focused build days plus review; estimates include API wiring, one screen, and basic tests, but **exclude** app-store review cycles, design polish, and marketing. Anything touching a payment rail or a regulated data pipe is estimated as "integration only" and separately flagged for licensing risk.

### What I verified about the market (checked before writing)

- **Splitwise** ships receipt scanning, currency conversion and recurring expenses behind Pro ($4.99/mo), and has now put a daily expense limit on the free tier ([splitwise.com/pro](https://www.splitwise.com/pro), [splittyapp.com free-limits teardown](https://splittyapp.com/learn/splitwise-free-limits/)). Its receipt scanner is **camera-only — no gallery import** as of 2026 (same source).
- **Splitwise has no UPI integration.** Its only Indian payment tie-up was Paytm on Android in 2017 ([blog.splitwise.com](https://blog.splitwise.com/2017/05/23/announcing-a-splitwise-paytm-integration-for-android/)); the UPI request remains open on its own feedback forum ([feedback.splitwise.com](https://feedback.splitwise.com/forums/162446-general/suggestions/15872739-is-it-possible-to-integrate-upi-unified-payment-s)).
- **But UPI deep-linking is already a solved, commoditised feature among Indian challengers** — Niptao, FairShare and SpendSync all pre-fill a UPI intent from "Settle" ([niptao.app comparison](https://niptao.app/en/blog/best-upi-bill-splitting-apps-india-2025), [fairshareapp.co.in](https://fairshareapp.co.in/blog/top-5-splitwise-alternatives-india.html)). **Plain UPI deep-link is not a differentiator.** Anything I propose here has to go past the intent handoff.
- **Splitify** ships bank + card sync, AI receipt scanner with item-wise auto-split, auto-categorisation, budgets, subscription tracking, net worth and a natural-language AI finance assistant ([getsplitify.com](https://getsplitify.com/)). Its AI is **query-side** ("ask about your spending"), not entry-side.
- **Tricount** is entirely free with no paid tier, but **lost custom splits, sorting and export in v8.0** ([splitpilot.io comparison](https://splitpilot.io/blog/tricount-vs-splitwise/)). **Settle Up** gates receipt photos, categories and recurring behind Premium ($3.49/mo) ([splittalo.com](https://splittalo.com/blog/best-bill-splitting-apps-2026/)).
- **Account Aggregator is closed to us.** A fintech without an NBFC / lending / investment-advisory licence **cannot be an FIU directly** — you must either get licensed or rent a regulated partner's FIU status ([casparser.in state-of-AA 2026](https://casparser.in/blog/state-of-account-aggregator-2026/), [ecorpit.com builder's guide](https://ecorpit.com/account-aggregator-integration-fintech-builders-2026/)). This is the single most important strategic fact in this document.
- **SMS-scraping is also closed.** Google Play forbids `READ_SMS` unless the app is the registered default SMS handler ([Play Console policy](https://support.google.com/googleplay/android-developer/answer/10208820?hl=en)), and 2026 policy tightened further for financial apps ([Play policy announcement, July 2026](https://support.google.com/googleplay/android-developer/answer/17134731?hl=en)).
- **UPI Circle** allows a primary user to delegate spending to a secondary user up to ₹15,000/month without sharing credentials ([PhonePe Business explainer](https://business.phonepe.com/articles/upi-circle-what-it-is-how-it-works-and-who-can-use-it)).
- **Costs:** Google Cloud Vision OCR is **$1.50 per 1,000 pages** after a 1,000/month free tier ([Cloud Vision docs](https://docs.cloud.google.com/vision/docs/ocr), [pricing summary](https://www.buildmvpfast.com/api-costs/ocr)). On-device ML Kit text recognition is **free and offline** via `@react-native-ml-kit/text-recognition` ([npm](https://www.npmjs.com/package/@react-native-ml-kit/text-recognition)) with an Expo module alternative ([expo-mlkit-ocr](https://www.npmjs.com/package/expo-mlkit-ocr)). Claude Haiku 4.5 is **$1/MTok in, $5/MTok out**, halved on the Batch API, with cache hits at $0.10/MTok ([platform.claude.com pricing](https://platform.claude.com/docs/en/about-claude/pricing)) — a 600-token parse costs roughly ₹0.05, so LLM-per-expense is economically trivial; OCR-per-receipt is the cost line that actually matters, which is why on-device wins.
- **Codebase check:** `server/src/models/Expense.ts` has an optional `profileId`; `server/src/models/GroupExpense.ts` has **none**. `Profile.ts` carries a `relationship` string and is scoped `{userId, name}` unique — i.e. Profiles are a *private, per-user roster of real people who need not be app users*. That asymmetry is the basis for ideas 1, 2, 17 and 18 and, as far as I can find, no competitor has an equivalent primitive.

### The 20

Listed in rough descending order of my conviction.

| # | Feature | User problem solved | How it works | Cx | BI | Effort (pw) | Novelty check |
|---|---|---|---|---|---|---|---|
| 1 | Profile↔Group Attribution | "I know my group balances, but not what I actually spend on my brother in a year." | Add optional `profileId` to `GroupExpense` splits: when a group member maps to one of your Profiles, their share of what you paid is attributed to that Profile automatically. | M | H | 3 | Nobody. Splitwise/Tricount/Settle Up/Splid/Splitify have no private per-person ledger primitive at all. |
| 2 | Forgiveness Ledger | Small debts to close people are silently written off, and every app pretends they were settled. | A third settle action, "On me", closes the balance and books the amount to that person's Profile as a gift rather than a payment; year-end shows what you quietly absorbed. | L | M | 1.5 | Nobody models forgiveness. Splitwise only has settle/delete, which destroys the record. |
| 3 | UPI Payment Proof Capture | "I already paid you" / "I never got it" — the #1 settlement dispute in India. | After the UPI intent returns, capture the txn ref from the response payload, store it on the `Settlement`, and show it to both sides; the payee confirms against the ref instead of arguing. | M | H | 2.5 | Indian rivals (Niptao, FairShare, SpendSync) deep-link but discard the response; Splitwise has no UPI at all. |
| 4 | Float Burden Analytics | Balances net to zero but one person is always the group's ATM. | Compute person-days of money fronted per member, not just net owed; surface a "float" leaderboard and the rupee cost of carrying it. | M | M | 2 | Nobody. Every competitor measures net position only, never time-weighted exposure. |
| 5 | Live Trip Burn Forecast | Day 3 of 7 — "can I afford the rest of this trip, and what will I owe at the end?" | Project remaining trip spend from burn rate and per-day category mix, and show each member their forecast final position with a confidence band. | M | M | 3 | No splitting app forecasts. Splitify's insights are retrospective. |
| 6 | Group Budget Pact | Group trips have no agreed ceiling, so overspending is only discovered at settlement. | Members agree a per-head cap up front; live variance is shown to everyone, with a group notification at 80% and a vote required to raise it. | M | L | 3 | Splitify has budgets but **personal-only**; no competitor has a group-consented shared cap. |
| 7 | Hinglish Entry Parser | Typing five fields per expense is why people abandon split apps mid-trip. | One text or voice line — "dinner 1800 mera, Rahul aur Priya ke saath, Priya ne 200 diye" — goes to Haiku with the group roster as cached context and returns a filled, editable expense; multiple expenses per utterance. | M | H | 4 | Splitify's AI is **query-side** ("ask about your spending"); nobody does code-mixed Hinglish **entry**. Cost: ~₹0.05/parse ([Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing)). |
| 8 | On-Device Receipt OCR + Shared-Item Apportioning | Item-splitting is manual, and sending receipts to a server is a privacy cost users notice. | ML Kit reads the receipt entirely on-device (free, offline, works from the gallery), then each line item is assigned to the people who consumed it, with shared items split only among their consumers. | M | M | 4 | Splitify and Splitwise Pro both do AI item-split — **but server-side, and Splitwise is camera-only, no gallery** ([source](https://splittyapp.com/learn/splitwise-free-limits/)). Ours differs on privacy, offline, gallery, and zero marginal cost. |
| 9 | Learned Split Defaults | You re-pick the same custom split every single week for the same group. | Learn per-group, per-category split patterns from history (Rahul never drinks, so bar bills exclude him) and pre-select the split before the user touches it, always overridable. | M | H | 3 | Nobody. All competitors default to equal split forever, regardless of the group's own history. |
| 10 | Payday-Aware Reminder Timing | Reminders sent when someone is broke get ignored and then muted. | Learn each debtor's historical settlement day-of-month and send the nudge on that day instead of a fixed cadence; back off automatically after a non-response. | L | M | 2 | Splitwise sends fixed-schedule reminders. No competitor personalises timing to observed payment behaviour. |
| 11 | Relationship-Toned Reminder Drafting | People don't chase debts because asking is socially expensive, not because they forgot. | Use the Profile `relationship` field plus amount and age of debt to draft a share-ready WhatsApp message at the right register — jokey for a close friend, formal for a colleague. | L | M | 2 | Nobody. Reminders everywhere are templated and tone-deaf. |
| 12 | Cross-Group Netting | You owe someone in "Goa Trip" and they owe you in "Flat Rent"; you settle twice or not at all. | Opt-in per pair: net all balances across every shared group into one figure and clear all of them atomically with a single UPI transfer. | M | H | 3 | Splitwise simplifies debts **within** a group only and deliberately keeps groups isolated. No competitor nets across groups. |
| 13 | Co-Presence Expense Prompt | The expense you forget is the one you didn't log at the table. | An on-device geofence notices you were at a merchant for >20 minutes near a contact and prompts "add an expense?" — location is evaluated locally and never sent to our server. | H | L | 5 | Nobody in split apps. Monzo-style merchant prompts exist in banking apps, but only via bank feed, not co-presence. |
| 14 | Calendar-Event Ephemeral Groups | Every dinner spawns a group that lives forever, and the app fills with dead groups. | A calendar event with attendees creates a scoped group on the day, then prompts to settle and archive itself when the event ends. | M | L | 3 | Nobody links group lifecycle to calendar events. Splitwise groups are permanent by default. |
| 15 | Dispute State + Evidence Trail | Someone edits an expense weeks later and the flat argues in WhatsApp with no record. | Expenses gain an explicit "disputed" state with the receipt, timestamp and confirmation history attached; edits after confirmation require the other party to re-accept. | M | L | 3 | Splitwise has a passive activity feed; no competitor has a first-class dispute state. |
| 16 | Unified True Outflow | Group balances and personal spend are tracked separately, so nobody knows their real monthly number. | Merge personal expenses, your share of group expenses, and actual settlements into one monthly cash-out figure that reconciles to what left your account. | M | H | 3 | Structurally impossible for pure split apps; Splitify approximates it via bank sync, which we can't and shouldn't use. |
| 17 | Recurring Cash Payout Tracker (India) | Maid, cook, driver, milkman, parents' allowance — recurring cash to people who will never install an app. | A Profile gains an expected monthly amount and due date; the app reminds, tracks arrears and advances, and shows a per-person payment history. | L | H | 2.5 | Nobody. Every competitor assumes both parties are users. This is a large, entirely unserved Indian use case. |
| 18 | Annual Relationship Statement | People have no idea who they actually spend money on or with. | A year-end per-person view — what you spent *on* them (Profiles) and *with* them (groups) — rendered as a shareable card. | M | H | 3 | Spotify-Wrapped-style recaps exist in finance apps but are always category-based. A **person-based** recap is only possible because of our Profile model. |
| 19 | Payer Rotation Nomination | The same person fronts everything, and nobody notices until resentment builds. | Before a group outing, nominate who should pay to minimise future settlements and equalise the float from #4. | M | L | 2 | Nobody. Complements #4; on its own it is prescriptive advice users can ignore. |
| 20 | Shared Bill Forecast | Flatmates get blindsided by an ₹8,000 electricity bill at month end. | Predict each recurring shared bill from its own history plus seasonality and push each flatmate their expected share a week before it lands. | M | M | 2.5 | Splitify forecasts **personal** budgets; no competitor forecasts a **shared** obligation per flatmate. |

**1 — Profile↔Group Attribution.** This is the one feature no competitor can copy without rebuilding their data model. `Expense.ts` already has `profileId`; `GroupExpense.ts` does not, so the personal ledger stops at the group boundary and the picture is half-complete. Closing that gap turns Bakaya from "a split app with a side feature" into "the ledger of your money and your people", which is a different product category and a much harder thing to displace.

**2 — Forgiveness Ledger.** Every split app's data model has a lie in it: balances either get paid or get deleted. In reality you eat ₹200 for a close friend and never mention it. Making that a first-class action is emotionally honest, takes about a week and a half, and produces the single most interesting number in the year-end statement — what your generosity actually costs you.

**3 — UPI Payment Proof Capture.** The Indian challengers stop at handing off to the UPI app; the transaction reference in the response is discarded. Capturing it and showing it to both sides converts a recurring social argument into a fact. The one hazard is that the txn ref is self-reported by the payer's device, so it proves intent, not receipt — I would label it "payer-reported reference", not "verified", and keep the confirm-receipt step.

**4 — Float Burden Analytics.** Net-zero balances hide real cost: the person who fronts ₹40,000 for a week has lent the group money. Measuring person-days of exposure surfaces a genuine unfairness that every existing app is blind to. Modest lift on top of existing settlement history.

**5 — Live Trip Burn Forecast.** Solves a question people genuinely ask mid-trip. My honesty caveat is that the forecast is weak exactly when it's most wanted — day 1 or 2 — and a confidently wrong number is worse than no number. Ship it with visible confidence bands or not at all.

**6 — Group Budget Pact.** Structurally novel (all existing budgeting is single-player), but it depends on a group agreeing to a constraint before a holiday, which is a social act most groups won't perform. High concept, low expected adoption.

**7 — Hinglish Entry Parser.** Entry friction is the actual reason split apps get abandoned mid-trip, and Splitify has aimed its AI at the wrong end of the funnel. Code-mixed Hinglish is where a small India-based team can beat a generic model integration, and at Haiku prices ([$1/MTok in](https://platform.claude.com/docs/en/about-claude/pricing)) the unit economics are a rounding error. Cache the group roster as a prompt prefix and cache hits cost $0.10/MTok.

**8 — On-Device Receipt OCR + Shared-Item Apportioning.** Item-level splitting itself is not novel — Splitify and Splitwise Pro both ship it. Three things differ: it runs entirely on-device via free ML Kit, so receipts never leave the phone and marginal cost is zero rather than $1.50/1,000; it works from the gallery, which Splitwise still doesn't; and shared items are apportioned only among their actual consumers. Sell it as privacy and correctness, not as "AI".

**9 — Learned Split Defaults.** The most under-appreciated idea here. Groups have stable, boring habits, and every app makes you re-declare them weekly. This needs no LLM — a frequency table over `{groupId, category, participantSet}` gets most of the value. Cheap, invisible, and it compounds the longer someone uses the app.

**10 — Payday-Aware Reminder Timing.** Reminder fatigue is why notification permission gets revoked. Sending on the day someone historically pays, and backing off after silence, is a small change with a direct retention effect on push opt-in rates.

**11 — Relationship-Toned Reminder Drafting.** The `relationship` field on `Profile` is sitting unused as tone metadata. Drafting the awkward message is a real service; keep the human in the loop and share to WhatsApp rather than sending anything automatically.

**12 — Cross-Group Netting.** Splitwise's per-group isolation is a deliberate design choice that creates a daily annoyance for anyone in multiple groups with the same person. Netting across groups and clearing them all in one UPI transfer is concrete, explicable in one sentence, and pairs perfectly with #3. Must be opt-in per pair — silently merging ledgers would be alarming.

**13 — Co-Presence Expense Prompt.** Technically interesting, and the on-device framing is a genuine differentiator against a bank-sync competitor. But it needs background location, which costs battery, triggers the scariest permission prompt on both stores, invites Play review scrutiny, and will misfire often enough to be annoying. Wrong feature for a small team.

**14 — Calendar-Event Ephemeral Groups.** Real problem (group graveyards), clean solution. The catch is that it needs calendar permission for a benefit users won't understand until they've felt the pain, so it lands better as a retention feature in year two than an acquisition one.

**15 — Dispute State + Evidence Trail.** Correctly identifies a flat-share problem, but it makes the product feel adversarial. Most groups would rather the app stay out of the argument. The lightweight half — locking edits after confirmation and requiring re-acceptance — is worth doing on its own; the full dispute UI is not.

**16 — Unified True Outflow.** This is the honest, privacy-respecting answer to Splitify's bank sync. We can't see your bank, but we can reconcile personal spend, group shares and actual settlements into one number, and unlike a bank feed it's already categorised and attributed. It also directly monetises the fact that Bakaya has both halves of the ledger in one schema.

**17 — Recurring Cash Payout Tracker.** The most commercially under-rated idea in the list. Every Indian urban household pays several people monthly in cash, none of whom will ever install a split app, and no competitor models this because their data model assumes both parties are users. Ours doesn't. Two and a half weeks of work for a use case with genuine daily-habit potential.

**18 — Annual Relationship Statement.** The growth loop. Category-based year-end recaps are everywhere and boring; a person-based one ("you spent ₹47,000 on your brother, and forgave ₹3,200 of it") is emotionally sticky and inherently shareable, and it's only computable because of the Profile model. Build after #1 and #2, since it's the payoff those two make possible.

**19 — Payer Rotation Nomination.** Logically sound, socially inert. Groups don't want an app assigning who pays for dinner, and the advice arrives at exactly the moment nobody is looking at their phone. Fold the fairness insight into #4's analytics and skip the prescriptive layer.

**20 — Shared Bill Forecast.** Genuine value for flat-shares, and the prediction is easy because utility bills are seasonal and regular. Needs 3-4 months of history before it says anything useful, so it's a feature for retained users, not new ones. Simple time-series over past bills; no ML infrastructure required.

### Top 5 to build

1. **Profile↔Group Attribution (#1)** — the only structural moat on this list. It exploits an asymmetry in our schema that Splitwise, Tricount and Splitify would each need a data migration to match, and it unlocks #2, #17 and #18. Build it first because everything else Profile-related depends on it.
2. **Hinglish Entry Parser (#7)** — attacks the actual churn cause. Splitify aimed its LLM at answering questions about spending; the friction is in *recording* it. Code-mixed Indian speech is precisely where a local team out-executes a generic integration, and at ₹0.05 per parse the cost never becomes a reason to gate it.
3. **Cross-Group Netting (#12)** — smallest gap between "obvious once described" and "nobody ships it". Splitwise's group isolation is architectural, so this stays differentiated for a while, and it makes #3 twice as valuable by turning several settlements into one transfer.
4. **UPI Payment Proof Capture (#3)** — UPI deep-linking is already commoditised in India ([niptao.app](https://niptao.app/en/blog/best-upi-bill-splitting-apps-india-2025)), so parity there is table stakes; capturing and surfacing the transaction reference is the step past parity, and it kills the most common settlement argument.
5. **Annual Relationship Statement (#18)** — the distribution strategy, not just a feature. A person-based year-end card is far more shareable than a category pie chart, and no competitor can generate one. Ship after #1 and #2 so it has real data behind it.

**Cheapest addition outside the five:** the Forgiveness Ledger (#2) is ~1.5 person-weeks and makes #18 dramatically better. If there's slack, do it alongside #1.

### 5 traps to avoid

1. **Co-Presence Expense Prompt (#13)** — background location is the highest-friction permission on both platforms, it drains battery, it invites Play Store review scrutiny for a "why does a split app track me" question you must answer perfectly, and false positives are constant. Five person-weeks for a feature that makes users suspicious of a privacy-positioned product.
2. **Group Budget Pact (#6)** — assumes a group will collectively agree to a spending ceiling before a holiday. Groups don't do this. The feature is structurally novel and behaviourally dead; you'd ship it, demo well, and watch adoption sit near zero.
3. **Dispute State (#15)** — introduces conflict into the product surface. Users want the app to keep the peace, not host the fight. Take the 20% (edit-locking after confirmation) and drop the rest.
4. **Payer Rotation Nomination (#19)** — prescriptive social engineering. Nobody will let an app tell them whose turn it is to pay, and the notification lands mid-dinner when phones are away. The underlying fairness metric belongs inside #4, not as a standalone nag.
5. **Live Trip Burn Forecast (#5)** — the honest trap. It looks impressive in a screenshot and is least accurate exactly when users check it hardest, early in a trip. A confidently wrong "you'll owe ₹12,000" destroys more trust than the feature builds. If it ships at all, it ships with wide, visible confidence bands.

**Two meta-traps that aren't on the list, and shouldn't be:**

- **Chasing Splitify's bank sync.** A fintech without an NBFC, lending or investment-advisory licence cannot register as an FIU under the Account Aggregator framework; the routes are get licensed, or rent a regulated partner's FIU status ([casparser.in](https://casparser.in/blog/state-of-account-aggregator-2026/), [ecorpit.com](https://ecorpit.com/account-aggregator-integration-fintech-builders-2026/)). For an early-stage team this is a quarters-long compliance detour that also surrenders the privacy position. Turn the constraint into the pitch: #16 gives the same "what did I actually spend" answer without ever touching a bank account.
- **SMS transaction scraping.** Google Play prohibits `READ_SMS` unless the app is the registered default SMS handler ([Play policy](https://support.google.com/googleplay/android-developer/answer/10208820?hl=en)), tightened again in the July 2026 announcement ([source](https://support.google.com/googleplay/android-developer/answer/17134731?hl=en)). Many Indian expense apps built on this and are now stranded. Don't start.

### Ideas that specifically exploit the Profile concept

`Profile` is a private, per-user roster of named real people — `{userId, name, relationship, color}`, unique on `{userId, name}` — who need not be, and usually aren't, Bakaya users. Every competitor's data model assumes the other party is an account. That asymmetry is the moat, and five of the twenty exploit it directly:

- **#1 Profile↔Group Attribution** is the enabling change: add `profileId` to group-expense splits so the private ledger doesn't stop at the group boundary. Without it the other four are partial.
- **#2 Forgiveness Ledger** books written-off balances to a Profile as a gift instead of destroying the record — only meaningful because there's a per-person ledger to book them into.
- **#11 Relationship-Toned Reminders** reads the already-present, currently-unused `relationship` field as tone metadata. Zero schema change.
- **#17 Recurring Cash Payout Tracker** extends Profiles with an expected amount and due date, serving the maid/driver/parents case that is invisible to every app requiring both parties to sign up. Highest ratio of Indian-market value to build effort in this document.
- **#18 Annual Relationship Statement** is the compounding payoff: a per-person year in review spanning what you spent *on* someone and *with* them. Computable only if #1 lands, shareable in a way category-based recaps never are, and structurally impossible for Splitwise or Splitify to answer.

Sequence them **1 → 2 → 17 → 18**, with 11 dropped in wherever convenient. That ordering builds the moat before it monetises the story.

---

# SECTION 23 — Final Product Strategy

*Written as your product advisor, with the standing caveat that strategy is judgement, not evidence. Everything here is [I] unless it cites a fact established earlier.*

## 23.1 The biggest opportunities

| # | Opportunity | Window |
|---|---|---|
| 1 | **The Profile primitive.** Every competitor's data model assumes the counterparty is an account. Yours does not. That is not a feature gap you can close by shipping — it is a schema difference they would each need a migration to match | Durable, if you finish it |
| 2 | **Tricount just deleted CSV/PDF export, Personal mode, Statistics and saved custom splits** from a 14M-download product | **Live and decaying.** Months, not years |
| 3 | **NPCI killed UPI P2P collect requests (Oct 2025)**, breaking the mechanic Google Pay's bill-split depends on and leaving payer-initiated deep links standing | Regulator-created, limited |
| 4 | **Settlement-math legibility is unsolved by everyone**, and the incumbent has publicly conceded it | Open ground |
| 5 | **Splitwise has left UPI "Under review" for years** with 458 votes, and non-US payment rails are its structural blind spot | Closes the day they ship it |
| 6 | **The privacy contrast.** Splitify reads bank SMS, declares ad-tracking, and claims encryption it does not have. You touch none of that | Yours to claim |

## 23.2 The biggest mistakes to avoid

1. **Chasing Splitify's feature list.** It is a pre-traction app with 48 ratings. Copying its roadmap means copying a strategy that has not been validated by anyone.
2. **Building bank sync.** Licensing-blocked, reputationally expensive, and it forfeits your best story.
3. **Monetising early.** Splitwise took seven years to charge and twelve to gate the core action, from a near-monopoly. Splitify put a V3 price on a V1 user base.
4. **Treating the Profile concept as a folder feature.** It is either your wedge or it is dead weight; right now it is the latter, because attribution stops at the group boundary.
5. **Shipping features on top of four known blockers.** A security hole, a build that cannot boot, no Apple Sign-In, and dead iOS push.
6. **Competing on price against free.** Five credible free competitors exist. Price is not a defensible position here.
7. **Believing your own audit docs.** They are stale. Most of their P0/P1 items have shipped, and the most serious current defect — the authorisation hole — is in none of them.

## 23.3 MVP improvements — the five that matter

If you did only five things from this entire report: fix the authorisation hole and the production build; ship Apple Sign-In; install crash reporting and analytics; ship invite-by-link with no-account participants; and add `profileId` to `GroupExpense`.

The first four make the product shippable and observable. The fifth makes it *yours*.

## 23.4 Version 2 vision, in one sentence

**"The ledger of your money and your people"** — the only app that tracks both what you spend *with* people and what you spend *on* people, including people who will never install it.

## 23.5 Long-term vision (3 years)

[I] The honest framing: **a pure bill-splitter is not a large business.** The category leader reached ~$6.6M revenue on ~$29M raised across 15 years, and the whole global category is estimated at ~$612M — smaller than a single mid-cap SaaS company. Any three-year plan that assumes splitting alone is the business is planning for a small outcome.

The three-year opportunity is not splitting. It is becoming **the personal financial-relationship graph for Indian households** — the record of who you support, who supports you, what you fronted, what you forgave, and what recurs. Splitting is the acquisition wedge. The relationship ledger is the product.

That is a defensible long-term position for three reasons: it compounds with time in a way balances never do; it is computable without bank access, which keeps you out of the licensing trap and on the right side of the privacy argument; and it is structurally impossible for Splitwise, Tricount or Splid to answer, because none of them can model a person who is not a user.

## 23.6 Positioning strategy

| Element | Recommendation |
|---|---|
| **Category** | Not "a Splitwise alternative". That seam is saturated — Splital, Spliit, NomadCrew, AreWeEven, Splitty, SplitterUp, Split-Circle, Niptao, FairShare and Tricount are all farming it |
| **Position** | *"Split with your friends. Track what you spend on your family. One app, no bank access required."* |
| **Primary contrast** | Against Splitify: you do not read their SMS, connect their bank, or track them across apps — and you can still tell them where their money went |
| **Secondary contrast** | Against Splitwise: no daily cap, no ads, free export, and UPI that actually works |
| **What not to lead with** | Price. You have no price advantage worth claiming and the category floor is zero |

## 23.7 Branding recommendations

- **Avoid the "Split-" name trap.** The category is drowning in it — Splitwise, Splitify, Splid, Spliit, Splitkaro, Splitty, SplitterUp, Split-Circle, Splital, SpendSync. Splitify already suffers a live collision with a US "Splitify, LLC" plus multiple same-named Play packages. "Bakaya" (बाकया — what remains, what is owed) is a genuinely better name than anything in this list: it is memorable, ownable, culturally precise, and it means the exact thing the product does.
- **Lean into the Indian-language framing** rather than away from it. It is differentiation you already own and every rival lacks.
- **Do not claim security properties you cannot demonstrate.** Splitify's false E2EE claim is a cautionary example; the trust cost when someone checks is far larger than the marketing benefit.

## 23.8 Go-to-market strategy

| Phase | Channel | Rationale |
|---|---|---|
| **Now** | **The Tricount-refugee campaign** | They just lost export, Personal mode and Statistics. You have all three. Time-boxed and specific |
| **Now** | **Play Store first, iOS second** | India is ~95% Android. Splitify made this call correctly — Android led by 5.5 months |
| **Now** | **WhatsApp-native share artefacts** | WhatsApp *is* the group layer in India. Currently unused by everyone |
| **Next** | **ASO on "split", not "expense tracker"** | Splitify spends its title on "Expense Tracker", competing against every PFM app in India, and its subtitle on a slogan that indexes for nothing. Target high-intent split queries where one incumbent brand is the only real competitor |
| **Next** | **Indus Appstore** | Splitkaro distributes there. Domestic store, low competition |
| **Later** | **English comparison-SEO** | Only if you commit to Path B. It primarily wins Western users — which may be the point, since those are the ones who can pay |

## 23.9 User acquisition ideas

1. **Make the invite work without an install** — a web-viewable balance is worth more than any campaign.
2. **Target the Tricount feature-removal moment** with a specific, honest migration page.
3. **Ship the calculator and say so** — 955 people voted for it on a competitor's forum.
4. **The Annual Relationship Statement as an annual acquisition event** — person-based, shareable, uncopyable.
5. **Recurring-cash-payout users are a distinct, unserved segment** reachable with completely different messaging than bill-splitting.

## 23.10 Retention strategy

Balance-first home; inviter-triggered reminders; the personal ledger as the daily surface that survives the trip ending; profiles and recurring payouts as the permanent record; and real release notes.

## 23.11 Monetisation strategy

**Not yet.** Grow the graph, install telemetry, and revisit with evidence. When you do: gate analysis, never entry; household plans over individual; Western users at $19.99 before Indian users at ₹999; and never sell the data.

## 23.12 Final feature roadmap — the one-page version

| Horizon | Ship | Strategic purpose |
|---|---|---|
| **2 weeks** | Auth hole · production build · Apple Sign-In · crash + analytics · expense date · `splitType` · `currency` field · calculator · push deep-link | Shippable, observable, no silent data loss |
| **1 month** | Invite by link + no-account participants · UPI deep-link · iOS push · password reset · money-logic tests · reminders | Unblock growth; close the India settlement gap |
| **1 quarter** | **`profileId` on `GroupExpense` + unified analytics** · explainable debt simplification · web-viewable balance · accessibility · TanStack migration · receipts | **Build the moat**; own the unsolved lane |
| **6 months** | Recurring cash payouts · Forgiveness Ledger · Annual Relationship Statement · cross-group netting · learned defaults · offline-first | Compound the moat into things nobody else can build |
| **12 months** | *Conditional:* natural-language entry · on-device OCR · multi-currency + i18n · monetisation | Decide with data, not with this report |

**The one-sentence strategy:** fix what is broken, remove the invite ceiling, finish the Profile wedge — and let Splitify spend its runway proving that bank sync and an AI assistant cannot buy a user base.

---

# APPENDIX A — Bakaya Feature Inventory (evidence-based audit)

> Audited at HEAD `321cb99`. Every status carries a `file:line` citation. This is the source of truth for Bakaya's column in Section 10 — not the product description in the brief.


Audited at HEAD `321cb99` (last commit 2026-07-24). All paths relative to
`/Users/shevaitverma/Applications/shevait/bakaya-app/`.

**Headline correction to the brief:** the founder's description undersells the build.
The code contains roughly 2× the described scope. But several of the "extra" features
are thinner than they look, and two of them (offline caching, iOS push) are effectively
non-functional despite the dependencies being installed.

---

## Complete API surface

The server is **not Express** — it is a hand-rolled `Bun.serve` router with a linear
route-matching loop (`server/src/routes/index.ts:166-199`, `server/src/index.ts:15`).
The README's "Bun + Express" claim (`README.md:9`) is wrong.

All routes declared in `server/src/routes/index.ts:75-159`. 56 endpoints:

| Method | Path | Purpose | Line |
|---|---|---|---|
| GET | `/health` `/ready` `/live` | Liveness/readiness probes | 77-79 |
| POST | `/api/v1/auth/register` | Email+password signup; seeds default profile + 19 categories | 83 |
| POST | `/api/v1/auth/login` | Password login; upserts Device w/ fcmToken | 82 |
| POST | `/api/v1/auth/google` | Verifies **Firebase** ID token via Google JWKS | 84 |
| POST | `/api/v1/auth/refresh` | Rotates access+refresh pair | 85 |
| POST | `/api/v1/auth/logout` | Deactivates all Devices + revokes refresh tokens | 86 |
| GET/POST | `/api/v1/users` | List/create users (no admin gate — see gaps) | 89-90 |
| GET/PUT/DELETE | `/api/v1/users/:id` | User CRUD | 91-93 |
| GET/POST | `/api/v1/profiles` | List/create Profiles | 96-97 |
| GET/PUT/DELETE | `/api/v1/profiles/:id` | Profile CRUD | 98-100 |
| GET/POST | `/api/v1/personal-expenses` | List (paginated, filtered) / create | 103-104 |
| GET | `/api/v1/personal-expenses/export` | **Streaming CSV**, 50k row cap | 105 |
| GET/PUT/DELETE | `/api/v1/personal-expenses/:id` | Personal expense CRUD | 106-108 |
| GET/POST | `/api/v1/groups` | List my groups / create | 111-112 |
| GET/PUT/DELETE | `/api/v1/groups/:id` | Group CRUD (update=admin, delete=creator) | 113-115 |
| DELETE | `/api/v1/groups/:id/members/:memberId` | Remove member / leave group | 118 |
| POST/GET | `/api/v1/groups/:id/invitations` | Create (admin-only) / list (admin-only) | 121-122 |
| DELETE | `/api/v1/groups/:id/invitations/:invId` | Cancel invitation | 123 |
| GET | `/api/v1/invitations/me` | My pending invitations | 124 |
| POST | `/api/v1/invitations/:invId/accept` \| `/decline` | Respond to invitation | 125-126 |
| GET/POST | `/api/v1/groups/:id/expenses` | List (paginated + totalAmount) / create | 129-130 |
| GET/PUT/DELETE | `/api/v1/groups/:id/expenses/:expenseId` | Group expense CRUD | 131-133 |
| GET | `/api/v1/groups/:id/balances` | Net balance per user (**raw net, not transfers**) | 136 |
| GET/POST | `/api/v1/groups/:id/settlements` | List / record settlement | 139-140 |
| DELETE | `/api/v1/groups/:id/settlements/:settlementId` | Delete settlement | 141 |
| GET | `/api/v1/analytics/balance` | Income vs expense, burn rate, days remaining | 144 |
| GET | `/api/v1/analytics/summary` | Total + per-profile breakdown | 145 |
| GET | `/api/v1/analytics/by-profile` | Per-profile total + count | 146 |
| GET | `/api/v1/analytics/by-category` | Per-category total + count | 147 |
| GET | `/api/v1/analytics/trends` | Monthly series, IST-bucketed, 6mo default | 148 |
| GET/POST | `/api/v1/categories` | List / create (max 50/user) | 151-152 |
| PUT | `/api/v1/categories/reorder` | Bulk reorder | 153 |
| PUT/DELETE | `/api/v1/categories/:id` | Category CRUD ("Other" undeletable) | 154-155 |
| PUT | `/api/v1/devices/token` | Register FCM token | 158 |

Swagger docs served at `/api-docs` (`server/src/index.ts:52-68`).

---

## Data model — what it actually supports

Nine Mongoose models. **What is conspicuously absent from every one of them:**
`currency`, `date` (user-settable), `attachments`, `recurring`, `tags`, `splitType`,
`archived`, `comments`, `inviteToken`, `__v` optimistic locking.

**User** (`server/src/models/User.ts:29-118`) — email (unique), username (sparse
unique), firstName/lastName/name (auto-computed at `:121-125`), password (bcrypt cost
12 via `Bun.password`, `:128-138`, `select:false`), profilePicture, `authProvider:
"local"|"google"`, googleId (sparse unique), `role: "user"|"admin"`, isActive,
isVerified, lastLoginAt. Indexes: `createdAt:-1`, `{role, isActive}`.

**Profile** (`Profile.ts:16-52`) — userId, name, relationship, avatar, color, isDefault.
Unique index `{userId, name}`. This is the differentiator (see final section).

**Expense** — personal (`Expense.ts:18-69`, collection `personalexpenses`) — userId,
**profileId**, title, amount (min 0), `type: "income"|"expense"`, source (≤50), category
(**free-text string, not a ref**), notes. Indexes `{userId,type,createdAt:-1}`,
`{userId,profileId,createdAt:-1}`.
→ **No date field.** Every expense is dated by `createdAt`. Back-dating is impossible;
confirmed by the Zod schema `server/src/schemas/expense.schema.ts:3-21` which accepts no
date, and by analytics matching on `createdAt` (`analytics.service.ts:38`).

**Group** (`Group.ts:20-64`) — name, description, createdBy, embedded `members[]` with
`{userId, role: "admin"|"member", joinedAt}` (`:20-38`). Indexes `members.userId`,
`createdBy`. No group photo/emoji/type/end-date/archive.

**GroupExpense** (`GroupExpense.ts:37-76`) — groupId, paidBy, title, amount, category
(free-text), notes, embedded `splitAmong[]` of `{userId, amount}`. Index
`{groupId, createdAt:-1}`.
→ **Only resolved amounts are stored.** No `splitType`, so equal/percentage/exact is a
client-side concept that is *lost on save* and reverse-engineered on edit by a heuristic.
→ **No `profileId`** — group expenses cannot be tagged to a Profile. This breaks the app's
own differentiator (see final section).

**Settlement** (`Settlement.ts:15-48`) — groupId, paidBy, paidTo, amount, notes. Index
`{groupId, createdAt:-1}`. No status/confirmation field — a settlement is a unilateral
assertion by the payer, with no counterparty acknowledgement.

**GroupInvitation** (`GroupInvitation.ts:28-87`) — groupId, invitedBy, invitedEmail,
**invitedUserId (required)**, status enum, message (≤200), respondedAt, expiresAt (30d
default, `:20-26`). Partial unique index enforcing one pending invite per (group,user)
at `:79-85`.
→ `invitedUserId` being **required** means you can only invite users who already have an
account (`invitation.service.ts:34-35` throws "No registered user with that email").
There is no invite-a-stranger path.

**Category** (`Category.ts:17-40`) — userId, name (≤30), emoji, color (hex-validated),
isDefault, isActive, order. Case-insensitive unique index per user (`:39`, collation
strength 2). 19 defaults seeded on signup (`server/src/data/defaultCategories.ts`).

**Device** (`Device.ts:17-52`) — userId, deviceId, os, osVersion, fcmToken, isActive,
lastLoginAt. Unique `{userId, deviceId}`.

---

## Implemented today (with evidence)

### Core expense splitting

| Capability | Status | Evidence |
|---|---|---|
| Create groups, add members | **YES** | `server/src/services/group.service.ts:9-19` (creator auto-admin), invite flow `invitation.service.ts:20-91` |
| Group expenses CRUD | **YES** | `groupExpense.service.ts:10-241` |
| Split equally | **YES** | Server auto-split `groupExpense.service.ts:29-40` (floor-to-paise + remainder to member[0]); client `mobile/src/screens/Group/AddGroupExpenseScreen.tsx:209-218` |
| Split by exact amounts | **YES** | Client `AddGroupExpenseScreen.tsx:191-195`; server validates sum ±0.01 `groupExpense.service.ts:54-57` |
| Split by percentage | **PARTIAL** | Client computes and sends amounts `AddGroupExpenseScreen.tsx:196-208`. **The server never learns it was a percentage split** — `models/GroupExpense.ts` has no `splitType`. On edit, mode is guessed by a heuristic: `mobile/src/screens/Group/EditGroupExpenseScreen.tsx:111` treats any near-equal split as "equal" and everything else as "exact", so a percentage split silently degrades to exact on re-open. Same defect on web (`web/src/app/dashboard/groups/[id]/expenses/GroupExpenseForm.tsx:70-76`). |
| Split by shares/weights, itemized | **NO** | No such mode anywhere |
| Track balances | **YES** | `groupExpense.service.ts:243-295` — three Mongo aggregations (paid, owed, settled), rounded at `:292`. Correctly bounded: returns ≤N rows regardless of expense count |
| Settle up | **YES** | `settlement.service.ts:25-75` |
| **Partial payments** | **YES** | Any amount ≤ outstanding pairwise balance is accepted; overpayment rejected at `settlement.service.ts:47-52` via `computePairwiseOwed` (`:13-23`). Mobile pre-fills the full amount but the field is editable and capped: `mobile/src/screens/Group/SettleUpScreen.tsx:136-139` |
| **Debt simplification / suggested transfers** | **PARTIAL — client-side only** | Greedy debtor/creditor matching in `mobile/src/screens/Group/SettleUpScreen.tsx:59-101`. **Not on the server** (`/groups/:id/balances` returns raw net balances only) and **not on web at all**. Also filtered to show only debts where you are the debtor (`SettleUpScreen.tsx:105-108`), so you cannot see the full group settlement plan. The greedy matcher is not provably minimum-cashflow |
| Expense history | **YES** | Paginated group expense list with `totalAmount` aggregate `groupExpense.service.ts:88-116`; personal list `expense.service.ts:15-94` |
| Individual expense tracking | **YES** | Full personal expense CRUD, separate `personalexpenses` collection |
| Settlement confirmation by counterparty | **NO** | `Settlement.ts` has no status field; recording is unilateral |

### Authentication

| Capability | Status | Evidence |
|---|---|---|
| Email + password | **YES** | `server/src/controllers/auth.controller.ts:44-162`; bcrypt cost 12 `models/User.ts:134-137` |
| Google sign-in (native) | **YES** | `@react-native-google-signin` → Firebase ID token → server verifies against Google JWKS `auth.controller.ts:165-305`; JWKS cached 1h `:26-37`. Native hook `mobile/src/hooks/useGoogleSignIn.ts:85-96`. Email-verified check `:205-207`; refuses to auto-link a Google login onto an existing local-password account `:219-221` |
| Google sign-in (web) | **YES** | Firebase `signInWithPopup` `web/src/app/login/page.tsx:23` |
| **Apple sign-in** | **NO** | Zero references anywhere. `models/User.ts:75` enum is `["local","google"]` only. This will **block App Store approval** — Apple requires Sign in with Apple wherever third-party SSO is offered |
| Refresh tokens + rotation | **YES** | `auth.controller.ts:308-362`, rotates both tokens per refresh |
| Silent refresh on 401 | **YES** | `mobile/src/lib/authedFetch.ts` — dedupes concurrent refreshes, retries once, distinguishes server-rejected refresh (logout) from network blip (no logout). Web equivalent `web/src/lib/api-client.ts:99-142` |
| Logout / token revocation | **PARTIAL** | `auth.controller.ts:365-382` deactivates devices + revokes refresh tokens. But revocation is an **in-memory Map** (`server/src/utils/tokenRevocation.ts:25`) — forgotten on restart, single-process only, breaks under any horizontal scaling. Self-documented at `:9-16` |
| Token storage on device | **PARTIAL** | Plain AsyncStorage, unencrypted. `mobile/src/utils/storage.ts:5-9` carries a `TODO(session-hardening)` to move to `expo-secure-store` |
| Email verification / password reset | **NO** | `isVerified` exists on the model but no verification or reset endpoint exists in `routes/index.ts` |

### Notifications

| Capability | Status | Evidence |
|---|---|---|
| Push, Android end-to-end | **YES** | Server FCM sender `server/src/services/notification.service.ts:48-78` with stale-token pruning `:33-45`; client registration `mobile/src/lib/push.ts:59-98`; tap routing `mobile/src/hooks/usePushNotifications.ts:15-26`; wired at `mobile/src/navigation/RootNavigator.tsx:19` |
| Push, **iOS** | **NO** | `mobile/src/lib/push.ts:5-8` states plainly: on iOS `getDevicePushTokenAsync()` returns an **APNs** token, which firebase-admin cannot target. "Full iOS delivery is a later phase." iOS push is dead |
| Push, web | **YES** | `web/src/lib/push.ts:33-88` + service worker |
| Notification triggers | **3 only** | New group expense → all other members (`groupExpense.service.ts:72-83`); settlement → payee (`settlement.service.ts:64-72`); invitation created → invitee, and accepted → inviter (`invitation.service.ts:80-88`, `:227-235`). All fire-and-forget, never block the mutation |
| Deep-link to the right screen | **PARTIAL** | Taps land on the Groups **list**, not the specific group — the payload lacks `groupName`, a required nav param. Documented in-code at `usePushNotifications.ts:18-20`. `mobile/app.json:6-9` declares URL schemes but `mobile/src/App.tsx` passes no `linking` config to NavigationContainer |
| Email notifications, reminders/nudges | **NO** | No mail transport in any package.json |
| In-app notification centre | **NO** | Invitations tab only |

### Analytics

| Capability | Status | Evidence |
|---|---|---|
| Income vs expense, burn rate | **YES** | `analytics.service.ts:193-279` — totals, spentPercentage, dailySpendingRate, dailyBudgetRate, daysRemaining |
| Breakdown by profile | **YES** | `analytics.service.ts:97-148` |
| Breakdown by category | **YES** | `analytics.service.ts:150-191` |
| Monthly trend series | **YES** | `analytics.service.ts:281-348`, IST-bucketed, 6-month default |
| Custom date ranges | **YES** | `analytics.service.ts:11-28`, IST-anchored via `utils/date.ts` |
| **Group spending in analytics** | **NO** | Every analytics pipeline queries the `Expense` model only (`analytics.service.ts:1`, `:37`). `GroupExpense` is never joined. Analytics is blind to all group activity — you cannot see what you spent on trips, or a combined view of personal + shared |
| Charts | **YES** | Hand-rolled SVG: `mobile/src/components/charts/HorizontalBarChart.tsx`, `VerticalBarChart.tsx` |

### Mobile app

Navigation (`mobile/src/navigation/MainTabNavigator.tsx:169-241`): 5 bottom tabs —
Home, Groups, Invitations (with pending badge `:212-213`), Analytics, Profiles — each
wrapping a native stack. `RootNavigator.tsx:36-40` gates on auth state.
`MainNavigator.tsx` is **dead code** (superseded by MainTabNavigator, never imported).

21 screens, ~17.8k lines:

| Screen | Lines | Does |
|---|---|---|
| `Home/HomeScreen` | 989 | Balance card, profile chips filter, recent expenses, quick actions |
| `Auth/LoginScreen` `RegisterScreen` | 322 / 538 | Email+password + Google button |
| `Group/GroupsListScreen` | 571 | Group list |
| `Group/GroupDetailScreen` | 2160 | Balances, expenses, settlements, members, pending invites, invite form, remove member, leave group, delete settlement. Admin gating at `:724, :972, :1070` |
| `Group/AddGroupExpenseScreen` / `Edit…` | 1385 / 1329 | 3 split modes with live allocation validation |
| `Group/SettleUpScreen` | 529 | Greedy-simplified debts, partial settle |
| `Group/CreateGroupScreen` `EditGroupScreen` | 242 / 308 | Group name/description |
| `Expense/AddExpenseScreen` `Edit…` `Detail…` | 919 / 690 / 1094 | Personal CRUD; Detail is the transaction list w/ search, 4 filters, infinite scroll, CSV export |
| `Profile/ProfilesScreen` `Add` `Edit` `ProfileExpenses` | 731 / 312 / 387 / 713 | Profile CRUD + per-profile ledger |
| `Category/CategoriesScreen` | 966 | Category CRUD, emoji + colour picker, reorder |
| `Analytics/AnalyticsScreen` | 905 | 4 analytics endpoints + charts |
| `Invitations/InvitationsScreen` | 389 | Accept/decline |
| `Settings/SettingsScreen` | 244 | **Shows the user's name/email and one Logout row. Nothing else.** No preferences, no currency, no theme, no notification toggles |

UI primitives (`mobile/src/components/`): `Button`, `Input`, `ColorPicker`,
`EmojiPicker`, `DateRangePicker`, `ConfirmationDialog`, `SkeletonLoader`,
`SwipeableExpenseItem`, 2 SVG charts. No toast, no bottom sheet, no avatar component.

### Search, filtering, export

| Capability | Status | Evidence |
|---|---|---|
| Search personal expenses | **YES** | Regex over title+notes, injection-escaped, `server/src/services/expense.service.ts:58-64`. Debounced UI `mobile/src/screens/Expense/ExpenseDetailScreen.tsx:73, 81` |
| Filter by type/profile/category/date range | **YES** | `expense.service.ts:31-56`; UI `ExpenseDetailScreen.tsx:72-79` |
| **Search/filter group expenses** | **NO** | `groupExpense.schema.ts:27-30` accepts only `page` and `limit`. No search, no category filter, no payer filter, no date range on group expenses at all |
| CSV export (personal) | **YES** | Streaming, 50k cap `server/src/controllers/expense.controller.ts:160-227` + `expense.service.ts:99-141`; mobile calls it at `ExpenseDetailScreen.tsx:338` and hands the string to `Share.share` (not a file) |
| **CSV export (group)** | **NO** | Export endpoint covers `personal-expenses` only |
| **PDF export** | **NO** | No PDF library anywhere |

### Roles, permissions, invites

| Capability | Status | Evidence |
|---|---|---|
| Group roles (admin/member) | **YES** | `models/Group.ts:27-31`; enforced on update `group.service.ts:31-34`, invite `invitation.service.ts:29-31`, member removal `group.service.ts:71-76`, expense edit/delete `groupExpense.service.ts:148-153, 229-235`. Delete-group is creator-only `group.service.ts:52-54` |
| Promote/demote a member | **NO** | Role is set once at join (`invitation.service.ts:202-206` hardcodes `"member"`). No endpoint changes it. The creator is the only admin, forever |
| Invite by email | **YES** | `invitation.service.ts:20-91`, 30-day expiry, admin-only |
| **Invite by link / QR** | **NO** | No token field on `GroupInvitation`, no such route. `invitedUserId` is required (`GroupInvitation.ts:47-51`) so the invitee **must already have an account** — a hard viral-growth ceiling |

### Offline, caching, state

| Capability | Status | Evidence |
|---|---|---|
| **Offline support / persisted cache** | **NO — the plumbing is installed but unused** | `mobile/src/App.tsx:66-78` wraps the app in `PersistQueryClientProvider` with a 24h AsyncStorage persister (`mobile/src/lib/persister.ts:9-13`), and `mobile/src/lib/queryClient.ts` + `queryKeys.ts` (59 lines of key factory) are fully built. **But a repo-wide grep finds exactly one `useQuery` in the entire mobile app** — `mobile/src/navigation/MainTabNavigator.tsx:154`, the pending-invitation badge count. All nine data screens (`HomeScreen`, `ExpenseDetailScreen`, `GroupDetailScreen`, `GroupsListScreen`, `ProfilesScreen`, `ProfileExpensesScreen`, `AnalyticsScreen`, `CategoriesScreen`, `InvitationsScreen`) use imperative `useState` + `useFocusEffect` fetching gated by a hand-rolled 30s staleness clock (`mobile/src/lib/staleness.ts:16`). **The persisted cache covers one integer.** Open the app on a plane and every screen is empty |
| Offline mutation queue | **NO** | Nothing anywhere |
| Online/offline detection | **YES (but wired to nothing that matters)** | `mobile/src/hooks/useOnlineManager.ts:10-25` feeds `onlineManager`, which only governs TanStack queries — i.e. the badge |
| Optimistic updates | **PARTIAL** | Hand-rolled on group expense delete only, `GroupDetailScreen.tsx:227-230` |
| Web offline cache | **NO** | Plain `QueryClient`, no persister `web/src/app/providers.tsx:7-21` |

### Cross-cutting

| Capability | Status | Evidence |
|---|---|---|
| **Dark mode / theming** | **NO** | `mobile/src/constants/theme.ts` is a flat const object — a single hardcoded light palette (`:6-48`). Zero references to `useColorScheme`, `prefers-color-scheme`, or any theme switcher in either client. Web `globals.css` likewise defines CSS vars with no dark block |
| **Multi-currency** | **NO** | No `currency` field on any model. `₹` is hardcoded into the formatter (`mobile/src/utils/currency.ts:11,21,45,53`) and into push bodies server-side (`groupExpense.service.ts:80`, `settlement.service.ts:69`). Locale hardcoded `en-IN`. India-only by construction |
| **Receipt / image attachments** | **NO** | No file field on any model, no upload route, no storage config, no image-picker dependency |
| **Recurring expenses** | **NO** | No cron/scheduler; "Subscription" is only a category emoji (`defaultCategories.ts:18`) |
| **Expense comments / activity feed** | **NO** | No Comment model, no audit trail, no edit history |
| **i18n / localisation** | **NO** | Every string is a hardcoded English literal. No i18n library in `mobile/package.json`. Dates hard-pinned to `Asia/Kolkata` (`server/src/utils/date.ts`, `mobile/src/utils/istDate.ts:11`) |
| **Accessibility** | **NO** | Exactly **two** accessibility props in ~17.8k lines of mobile UI — `mobile/src/components/ColorPicker.tsx:59-60`. No labels on any icon-only button (back arrows, FABs, swipe actions), no `accessibilityRole`, no dynamic-type support (all font sizes are fixed px in `theme.ts:97-106`). Web fails contrast on tertiary text per its own audit |
| **Product analytics / telemetry** | **NO** | No Amplitude/Mixpanel/PostHog/Segment/Firebase Analytics. Zero product instrumentation — there is no way to know what users do |
| **Crash reporting** | **NO** | No Sentry/Crashlytics/Bugsnag. Crashes are invisible |
| **Payments / subscriptions / monetisation** | **NO** | No Stripe/Razorpay/RevenueCat/IAP. Not one line of billing code. No plan/entitlement/quota field on `User`. Zero monetisation surface |
| **Tests** | **NO (≈0% coverage)** | **One** test file in the entire repo: `server/src/services/notification.service.test.ts` (17 lines, 2 assertions, covers only stale-FCM-token pruning). No test runner script in any of the three `package.json`s. Zero tests for the splitting math, the balance aggregation, the settlement cap, or any client code |

---

## Not implemented — explicit list

Confirmed absent from the models, routes, and services:

1. Apple Sign-In (App Store blocker)
2. Multi-currency / FX
3. Receipt or photo attachments
4. Recurring / scheduled expenses
5. User-settable expense date (everything is `createdAt`)
6. Comments on expenses; activity feed; edit history / audit trail
7. Invite by link or QR; inviting anyone without an existing account
8. Role promotion/demotion; per-group permission config
9. Server-side debt simplification; suggested transfers on web
10. `splitType` persistence (percentage splits are lossy)
11. Group expenses in analytics
12. Search/filter/date-range on group expenses
13. PDF export; group CSV export
14. Dark mode; any theming
15. i18n; any non-INR locale
16. Meaningful accessibility affordances
17. Product analytics, telemetry, crash reporting
18. Any billing, subscription, entitlement, or paywall code
19. Offline-first behaviour or an offline mutation queue
20. Email notifications, reminders, nudges
21. Email verification, password reset
22. Group archive / end-date / photo / templates
23. Settlement confirmation by the counterparty
24. Friends outside groups; person-to-person balances across groups
25. UPI / payment-app deep links on settle-up (in an India-only app)
26. A meaningful Settings screen (currency, notifications, theme, account deletion)
27. Meaningful test coverage

---

## Known open issues from repo docs (still unfixed)

The five docs (dated ~Apr–Jul 2026) were cross-checked against HEAD. **The two
engineering-bug docs are largely stale — most P0/P1 items have shipped.** Verified
already fixed and to be discounted from any gap analysis: any-member-can-edit-expense,
settlement overpayment, amount-only re-split bug, duplicate split userIds, unrounded
remainder, single-member-group expenses, SettleUp float tolerance, Google sign-in on
native, stale-token override, the 30s throttle staleness bug, ghost split member,
ungated edit/delete/invite, missing server logout, 50-row list cap, lakh threshold,
IST date handling, DateRangePicker keystroke storm, web remove-member no-op, web
edit-expense route, web leave/delete group, design-token drift.

**Still open and confirmed against current code:**

| Issue | Source | Evidence at HEAD |
|---|---|---|
| **Production EAS build cannot start** — `EXPO_PUBLIC_API_URL` is `""` in the production profile, and `constants/api.ts:24-26` throws when it is unset in a non-dev build | MOBILE_CODE_REVIEW B2 (partial fix) | `mobile/eas.json:35` vs `mobile/src/constants/api.ts:24-26` |
| TanStack Query layer is inert — one consumer | B44 | `mobile/src/navigation/MainTabNavigator.tsx:154` is the sole `useQuery` |
| `<0.02` split-mode heuristic; percentage splits degrade to exact on edit | UX M7 | `mobile/src/screens/Group/EditGroupExpenseScreen.tsx:111`; root cause is no `splitType` on `models/GroupExpense.ts` |
| Web has no suggested-transfers view | MATH 2.7 | No `Suggested`/`suggestedTransfers` under `web/src/app/dashboard/groups/` |
| Web uses `window.confirm`/`alert` for 4 destructive actions (regressed — was fewer) | UX W4 | `web/src/app/dashboard/groups/[id]/page.tsx:366, 383, 404, 426` |
| Blocking success `Alert` instead of a toast | UX M12 | `mobile/src/screens/Group/AddGroupExpenseScreen.tsx:236` |
| Create-group returns to the list instead of the new group | UX §1a-4 | `mobile/src/screens/Group/CreateGroupScreen.tsx:68` `goBack()` |
| Group Detail section order buries Expenses below balances/members | UX §5, §7 | mobile `GroupDetailScreen.tsx:768→908→969→1130→1180`; web `[id]/page.tsx:596→…→1099` |
| 93 hardcoded hex values remain across 9 web module CSS files | DESIGN Phase B/E | worst offenders: `groups/[id]/expenses/new/page.module.css` (24), `profiles` (18), `categories` (16) |
| Web accessibility Phase D never done (aria-labels, focus rings, `aria-current`, tertiary contrast ~3.1:1 fails AA) | DESIGN Phase D | unchanged |
| No optimistic locking on concurrent group-expense edits | MATH edge-28 | no `__v` guard in `groupExpense.service.ts:205-209` |
| Deep-link scheme declared but no `linking` config | B45 | `mobile/app.json:6-9` vs `mobile/src/App.tsx` |
| Greedy matcher not provably minimum-cashflow | MATH 2.6 | `SettleUpScreen.tsx:77-98` |
| `models/GroupExpense.ts:58` still allows `min: 0` amounts (service guards it, model doesn't) | MATH 2.2 residual | `server/src/models/GroupExpense.ts:58` |
| No integration tests for the splitting math | MATH P3-15 | one 17-line unit test in the whole repo |

**Not in any doc, found in this audit:**
- `/api/v1/users` CRUD (`routes/index.ts:89-93`) is protected but **not role-gated** — the comment says "admin-level management" but `user.controller.ts` never checks `role === "admin"`. Any authenticated user can list and mutate other users. **This is a live authorisation hole.**
- Firebase client keys and Google OAuth client IDs are committed in plaintext at `mobile/eas.json:20-27`. Client-side keys by design, but they pin the project publicly.
- Refresh-token revocation is per-process in-memory (`server/src/utils/tokenRevocation.ts:25`) — logout does not survive a restart or a second instance.
- Analytics never reads `GroupExpense` (`analytics.service.ts:1`) — a whole half of the product is invisible to its own analytics.
- Rate limiting is per-process in-memory (`middleware/rateLimit.ts:9-10`) — same scaling ceiling.

---

## Where web lags mobile

Web is at roughly **85% of mobile**, and is genuinely at parity on auth (incl. Google +
refresh), push, all five analytics endpoints, categories, profiles, personal expenses,
group CRUD, group expenses with all three split modes, and invitations.

Gaps, ranked:

1. **No group edit page.** `web/src/lib/api/groups.ts:135` `groupsApi.update` is dead code — no `useUpdateGroup` hook, no `/groups/[id]/edit` route. Mobile has `EditGroupScreen`.
2. **No delete-settlement UI.** `useDeleteSettlement` (`web/src/lib/queries/useGroups.ts:134`) and the API method both exist and are never called.
3. **Settle-up is directional only.** `web/src/app/dashboard/groups/[id]/page.tsx:618` — `canSettle = myBalance < 0 && entry.amount > 0`. It is inline in group detail, not a dedicated flow, and shows no simplified transfer plan.
4. **No pagination anywhere.** Every list calls the API with no `page` param (`groups/[id]/page.tsx:222`, `expenses/page.tsx:50`), so lists silently truncate at the server default of 20. Mobile infinite-scrolls (`ExpenseDetailScreen.tsx:211, 750`).
5. **No persisted/offline cache.** `web/src/app/providers.tsx:7-21` — plain QueryClient (staleTime 30s).
6. **CSV export drops filters.** `web/src/lib/api/expenses.ts:109-111` forwards only `startDate`/`endDate`/`type`; a filtered export silently exports everything. Mobile forwards `profileId`, `category`, `search` too.
7. **No category filter** on the transactions list (`expenses/page.tsx:40-48`), despite `ExpenseQueryParams.category` existing.
8. **No Settings page.** Logout is buried on the Profiles page (`profiles/page.tsx:38, 221`); Categories has no nav entry.
9. Edit-mode percentage splits degrade to exact (`GroupExpenseForm.tsx:70-76`) — same defect as mobile.
10. `window.confirm`/`window.alert` for destructive actions where mobile uses a styled dialog.

Web-only advantages: responsive desktop sidebar, and a real file download for CSV
(`web/src/lib/api/expenses.ts:124-132`) versus mobile's `Share.share` of a raw string.

---

## Architecture summary

**Stack.** TypeScript end to end.
- **Server:** Bun runtime, **hand-rolled `Bun.serve` router** (not Express — `server/src/index.ts:15`, `routes/index.ts:166-199`), MongoDB + Mongoose 9, Zod 4 validation, Winston logging, `jose` for JWT, `firebase-admin` for FCM. 5 dependencies total.
- **Web:** Next.js 16 App Router, React 19, TanStack Query, CSS Modules (no Tailwind), Firebase JS SDK.
- **Mobile:** Expo SDK 54, RN 0.81.5, new architecture enabled, React Navigation 7 (bottom tabs + native stacks), `react-native-svg` for hand-rolled charts, `@react-native-google-signin`, `expo-notifications`.

**Request pipeline** (`server/src/index.ts:20-123`): requestId → swagger short-circuit
→ CORS preflight → stricter auth rate limit (10/min/IP) → general rate limit (per-token
or per-IP) → linear route match → `authenticateRequest` for protected routes → handler →
requestId/CORS/security/rate-limit headers. Auth state is passed via a `WeakMap<Request>`
(`middleware/auth.ts:4`) rather than request mutation — clean, and the reason `getAuthUser`
throws loudly if middleware was skipped.

**Auth flow.** Password → bcrypt (Bun native, cost 12) → HS256 access + refresh pair
(separate secrets, `utils/jwt.ts:11-12`). Google → client gets a **Firebase** ID token →
server verifies signature against Google's `securetoken@system` JWKS (cached 1h) with
issuer/audience pinned to the Firebase project → maps to a local User. Clients store both
tokens in plain AsyncStorage / localStorage and refresh transparently on 401 via a shared
deduped promise.

**Data flow (mobile).** The intended architecture is TanStack Query with a persisted
AsyncStorage cache. The actual architecture is imperative `useState` + `useFocusEffect`
fetching, throttled by a global mutation clock (`lib/staleness.ts`): any mutation anywhere
bumps `mutatedAt`, which invalidates every screen's 30s freshness window on next focus.
Crude but functional — and it means the query layer, the persister, and the 59-line
`queryKeys` factory are all dead weight today.

**Deployment.** Docker Compose (`docker-compose.yml` — server + web, healthcheck-gated
dependency, 2GB memory cap) with an nginx reverse proxy (`infra/docker/nginx.conf`) and
Terraform modules for AWS VPC / security groups / load balancer (`infra/terraform/`).
Mobile ships via EAS (`mobile/eas.json`) — with the production profile currently broken.
The single-process in-memory stores (rate limits, token revocation) mean the server
cannot be scaled horizontally as written.

---

## The Profile differentiator

**What it is.** A `Profile` (`server/src/models/Profile.ts:16-52`) is a named
**spending bucket owned by one user** — `{name, relationship, avatar, color, isDefault}` —
not a second login and not another person's account. One is auto-created at signup named
after the user (`profile.service.ts:17-38`, relationship `"self"`, `isDefault: true`), and
every personal expense carries a `profileId` (`models/Expense.ts:26-30`), defaulting to the
user's own profile when omitted (`expense.controller.ts:64-69`).

The user then creates more: "Mom", "Dad", "Home", "Kids". The UI treats them as household
cost centres — `ProfilesScreen.tsx:238` labels the default as `PRIMARY ACCOUNT` and others
as `{RELATIONSHIP} GROUP` or `PERSONAL`, each with a colour and a running total
(`:263`). Tapping one opens `ProfileExpensesScreen` (713 lines), a dedicated per-profile
ledger with its own date range, category filter, income/expense totals, and net balance,
with swipe-to-delete. Profiles are guarded: the default cannot be deleted, and neither can
one with linked expenses (`profile.service.ts:91-102`).

**Why it might matter.** It targets the Indian joint-household pattern that Splitwise
does not serve: *one person pays for many people who are not app users*. The son with the
salary tracks "spent ₹8,400 on Mom this month, ₹3,100 on the house" without asking Mom to
install anything, create an account, or settle a balance. That is a real, unserved job —
it is expense *attribution* within one wallet, orthogonal to expense *splitting* between
wallets. Three of the five analytics endpoints (`summary`, `by-profile`, and the
`profileId` filter on `by-category`/`trends`/`balance`) are built around this axis, so it
is a first-class dimension of the product, not a bolt-on.

**Why it does not yet pay off.** Two structural gaps hollow it out:

1. **`GroupExpense` has no `profileId`** (`server/src/models/GroupExpense.ts:37-74`). Profiles exist only in the personal ledger. The moment money moves through a group — the other half of the app — profile attribution vanishes. You cannot answer "how much of the Goa trip was Mom's share", which is precisely the question the concept promises to answer. The repo's own COMPETITIVE_RESEARCH.md names profile-tagged group expenses as the differentiator; it does not exist in code.
2. **Analytics never reads group data at all** (`analytics.service.ts:1`), so even the personal-side profile view is a partial picture of the user's real spending.

The concept is genuinely distinctive and correctly modelled on the personal side. It is
one foreign key (`profileId` on `GroupExpense`) plus a `$unionWith` in the analytics
pipelines away from being the thing the product is actually about — and until then it
reads as a nice folder feature rather than a wedge.

---

# APPENDIX B — Consolidated Sources

Grouped by the research stream that produced them. All observations dated 6 August 2026 unless stated inline.

## B.1 Business, features, technical architecture, security


**Primary — vendor-controlled**
- https://getsplitify.com/
- https://getsplitify.com/privacy.html (last updated 3 Aug 2026)
- https://getsplitify.com/terms.html (last updated 15 Jun 2026)
- https://getsplitify.com/contact.html
- https://getsplitify.com/join/
- https://getsplitify.com/.well-known/apple-app-site-association — declares `/plaid/*` and `/join/*` for `S2VSF826K9.com.findat.splitify`
- https://getsplitify.com/apple-app-site-association — Firebase-generated; lists `com.akhash.splitify` **and** `com.findat.splitify` under the same team ID
- https://getsplitify.com/.well-known/assetlinks.json — `com.akhash.splitify`, three signing-cert SHA-256 fingerprints
- https://getsplitify.com/__/firebase/init.json — project `splitify-2bb8c`, storage bucket, messagingSenderId
- DNS records for getsplitify.com (dig A/CNAME/TXT/MX/NS, 6 Aug 2026): A 199.36.158.100; `www` CNAME → splitify-2bb8c.web.app; TXT `hosting-site=splitify-2bb8c`; MX → Google Workspace; NS → ns09/ns10.domaincontrol.com
- HTTP response headers for https://getsplitify.com/ (curl -I, 6 Aug 2026)

**Primary — app stores**
- https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540 (incl. 8 iPhone screenshots + 1 iPad screenshot, read directly)
- https://itunes.apple.com/lookup?id=6756657540&country=in — bundleId `com.findat.splitify`, release 5 Jan 2026, v1.4.11 (6 Aug 2026), 114,756,608 bytes, min iOS 18.0, 4.44★/18, 12+, EN only, artistId 1861789652
- https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN — Findat Pvt. Ltd., 4.8★/30, 14 written reviews, 1,000+ installs (internal counter 2,438), released 23 Jul 2025, updated 6 Aug 2026, v1.13.2, min Android 8.0, IAP ₹149–₹999, full permission list, full description, developer address/phone/emails, developer review replies
- https://play.google.com/store/apps/datasafety?id=com.akhash.splitify&hl=en_IN — full Data safety collected/shared matrix and security practices
- https://identitytoolkit.googleapis.com/v1/projects?key=AIzaSyACX_qlMz6kf6nXvoaOsnJ0mnAK2x9N94M — public Firebase Auth project config (authorizedDomains)

**Third-party / corroborating**
- https://appstorespy.com/android-google-play/com.akhash.splitify-trends-revenue-statistics-downloads-ratings — independent corroboration of publisher (Findat Pvt. Ltd.), ~1,000 installs, release 23 Jul 2025
- https://tracxn.com/d/companies/splitify/__xrFxYSJcSGTyk7M1M6dGVEzHMUSPzRWH50pns9ALdt0 — the conflated profile: Splitify LLP (AAI-8069) + Bhoruka Park Pvt Ltd, Bengaluru, website **splitifyapp.com**

**Attempted and failed / returned nothing (documented for completeness)**
- apkpure.com, appbrain.com, apkmirror.com, apkfab.com, apkmonk.com, apkcombo.com/.app, androidrank.org, appfollow.io — all blocked, 403, timed out, or 404 from this environment; the direct Play Store HTML fetch superseded them
- zaubacorp.com, tofler.in, thecompanycheck.com searches for "FINDAT" — no matching entity indexed
- Crunchbase / Entrackr / Inc42 / YourStory / Product Hunt / LinkedIn searches for "Findat" or the getsplitify.com product — **no results**

## B.2 Market, competitors, reviews, SWOT


**Market sizing**
- 360iResearch, Bill Splitting Apps Market — https://www.360iresearch.com/library/intelligence/bill-splitting-apps

**India regulatory**
- Medianama, NPCI to stop P2P collect payments from Oct 1 — https://www.medianama.com/2025/08/223-npci-p2p-collect-payments-oct-1-what-it-means/
- Outlook Money, NPCI to end UPI P2P collect requests — https://www.outlookmoney.com/banking/npci-to-end-upi-p2p-collect-requests-from-october-1-to-reduce-fraud
- Angel One, NPCI to end UPI P2P collect requests — https://www.angelone.in/news/market-updates/npci-to-end-upi-person-to-person-collect-requests-from-october-to-curb-fraud
- RBI NBFC-Account Aggregator Directions 2025 (via TaxGuru) — https://taxguru.in/rbi/rbi-non-banking-financial-companies-account-aggregator-directions-2025.html
- Sahamati, Account Aggregators in India — https://sahamati.org.in/account-aggregators-in-india/
- Google Pay Help (India), Split bills — https://support.google.com/pay/india/answer/11420982?hl=en

**Splitify**
- App Store IN, Splitify – Expense Tracker (Findat Private Limited) — https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540
- App Store US, "Splitify – Splits and Expenses" / now Cove, by Splitify, LLC — https://apps.apple.com/us/app/splitify-splits-and-expenses/id6736849874

**Splitwise**
- Wikipedia — https://en.wikipedia.org/wiki/Splitwise
- App Store US — https://apps.apple.com/us/app/splitwise/id458023433
- AppBrain (Android estimates) — https://www.appbrain.com/app/splitwise/com.Splitwise.SplitwiseMobile
- AppstoreSpy (Android estimates) — https://appstorespy.com/android-google-play/com.Splitwise.SplitwiseMobile-trends-revenue-statistics-downloads-ratings
- Growjo (revenue/headcount/funding estimates) — https://growjo.com/company/Splitwise
- TechCrunch, $20M Series A — https://techcrunch.com/2021/04/28/splitwise-raises-20m-series-a-to-help-everyone-in-the-world-divvy-expenses
- Splitwise feedback forum, mobile ideas by votes — https://feedback.splitwise.com/forums/162446-general?category_id=52890
- Splitwise feedback forum, UPI request (458 votes) — https://feedback.splitwise.com/forums/162446-general/suggestions/15872739-is-it-possible-to-integrate-upi-unified-payment-s
- Splitwise feedback forum, Simplify Debt for iOS — https://feedback.splitwise.com/forums/162446-general/suggestions/3579249-simplify-debt-for-ios-app
- Splitwise blog, Paytm integration (2017) — https://blog.splitwise.com/2017/05/23/announcing-a-splitwise-paytm-integration-for-android/
- Product Hunt reviews — https://www.producthunt.com/products/splitwise/reviews
- UX Collective, Splitwise UX case study — https://uxdesign.cc/splitwise-a-ux-case-study-dc2581971226

**Tricount / bunq**
- Tricount Help Center, What happened with Tricount Premium — https://help.tricount.com/articles/what-happened-with-tricount-premium
- bunq Newsroom, €16.4bn split in 2024 — https://press.bunq.com/246589-from-roommates-to-road-trips-tricount-tallies-16-4-billion-shared-in-2024/
- FinTech Futures, bunq becomes EU's 2nd-largest neobank — https://www.fintechfutures.com/challenger-banks/dutch-challenger-bunq-becomes-eu-s-second-largest-neobank-with-tricount-acquisition
- ThePaypers, bunq acquires Tricount — https://thepaypers.com/fintech/news/bunq-acquires-tricount-app
- AppBrain, Tricount Android — https://www.appbrain.com/app/tricount-split-settle-bills/com.tribab.tricount.android
- bunq on X, new Tricount app — https://x.com/bunq/status/1808967542670516647
- Tricount blog, Top Splitwise alternatives in India — https://tricount.com/en-us/blog/top-splitwise-alternatives-in-india-2025-which-app-should-you-switch-to

**Settle Up**
- App Store — https://apps.apple.com/us/app/settle-up-group-expenses/id737534985
- Premium pricing page — https://settleup.app/premium

**Splid**
- App Store — https://apps.apple.com/us/app/splid-split-group-bills/id991473495
- splid.app — https://splid.app/english
- MWM listing — https://mwm.ai/apps/splid-split-group-bills/991473495
- Similarweb — https://www.similarweb.com/app/google-play/splid.teamturtle.com.splid/statistics/

**Spliit**
- GitHub — https://github.com/spliit-app/spliit
- Spliit blog, We need an open source alternative to Splitwise — https://spliit.app/blog/we-need-an-open-source-alternative-to-splitwise
- OpenAlternative — https://openalternative.co/spliit
- Hostinger, Spliit VPS — https://www.hostinger.com/applications/spliit

**India competitors**
- Splitkaro — https://www.splitkaro.com/
- Splitkaro AppBrain — https://www.appbrain.com/app/splitkaro-split-expenses/com.bsquare.splitkaro
- Splitkaro App Store IN — https://apps.apple.com/in/app/splitkaro-split-bills-fairly/id1573115695
- Splitkaro Indus Appstore — https://www.indusappstore.com/apps/finance/splitkaro/com.bsquare.splitkaro/
- Niptao — https://niptao.app/en
- Niptao, best UPI bill-splitting apps India — https://niptao.app/en/blog/best-upi-bill-splitting-apps-india-2025
- Niptao, Splitwise Pro price India 2026 — https://niptao.app/en/blog/splitwise-pro-price-india-2026
- FairShare — https://fairshareapp.co.in/
- FairShare comparison page — https://fairshareapp.co.in/compare/
- goDutch App Store IN (current listing) — https://apps.apple.com/in/app/godutch-split-group-bills/id1363868328
- Inventiva, goDutch funding and founders — https://www.inventiva.co.in/stories/this-group-payments-startup-founded-by-iit-bombay-alumni-makes-it-easy-to-godutch/
- Dealroom, GoDutch — https://app.dealroom.co/companies/godutch_1
- TechIHD, How to split bills using goDutch — https://techihd.com/godutch-app/

**Adjacent threats**
- TechCrunch, Venmo Groups launch — https://techcrunch.com/2023/11/14/venmo-gets-a-new-way-to-split-expenses-among-groups-like-clubs-teams-trip-buddies-and-more
- PaymentsJournal, Venmo Groups — https://www.paymentsjournal.com/venmo-launches-venmo-groups-to-split-common-expenses/
- Money.com, Cash App Pools — https://money.com/cash-app-pools-split-payments-feature/
- FreshBooks, How Cash App works — https://www.freshbooks.com/hub/accounting/how-cash-app-works
- Wise, Revolut split bill — https://wise.com/ie/blog/split-bill-revolut-ireland
- Splitty, Revolut bill splitting — https://splittyapp.com/learn/revolut-bill-splitting/
- Splitty, Venmo Groups vs Splitwise — https://splittyapp.com/learn/venmo-groups-vs-splitwise/

**Review/comparison content (competitor-authored — treat as [E], directionally corroborative only)**
- Splitty, Splitwise vs Splid vs SettleUp — https://splittyapp.com/learn/splitwise-vs-splid-vs-settleup/
- Splitty, Splitwise free limits — https://splittyapp.com/learn/splitwise-free-limits/
- AreWeEven, Why people are switching from Splitwise — https://www.areweeven.com/blog/why-people-switching-from-splitwise
- Split-Circle, Splitwise daily limit — https://split-circle.com/en/blog/splitwise-daily-limit
- NomadCrew, Splitwise daily expense limit — https://nomadcrew.uk/blog/splitwise-daily-expense-limit-free-alternatives/
- SplitterUp, Is Splitwise Pro worth it — https://splitterup.app/blog/splitwise-pro-worth-it

**Could not verify / access failed**
- trustpilot.com/review/splitwise.com — HTTP 403. The "1.8★, 65% one-star, Mar 2026" figure is second-hand via Split-Circle and is **unverified**
- play.google.com listings — Google Play blocks server-side fetching; all Android metrics are third-party estimates
- appbrain.com direct fetches — connection refused; AppBrain figures obtained via search index
- contri.money/blog/best-splitwise-alternative-india — HTTP 404
- Reddit threads — no direct access; Reddit signal is second-hand via search summaries
- Splitify Google Play listing under Findat Private Limited — **existence not confirmed**

## B.3 Growth, monetisation, version history


All URLs observed **6 August 2026** unless otherwise noted.

**Splitify — primary**
1. https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540 — title, subtitle "One app. All your finances.", description, IAPs ₹149/₹399/₹999, 4.4★/18 ratings, 114.8 MB, Findat Private Limited, version history
2. https://play.google.com/store/apps/details?id=com.akhash.splitify&hl=en_IN — "Findat Pvt. Ltd.", 1,000+ installs, 4.8★/30 reviews, updated 6 Aug 2026, IAP ₹149.00–₹999.00 per item, listing release-date field 23 Jul 2025
3. https://getsplitify.com — single-page site, no blog/pricing/comparison pages, footer contact `splitify.queries@gmail.com`

**Splitwise — primary and pricing**
4. https://apps.apple.com/in/app/splitwise/id458023433 — subtitle "Split expenses with friends", **India IAPs ₹49/₹99/₹149/₹999/₹1,199**, 4.4★/13k ratings, No. 43 Finance (IN)
5. https://blog.splitwise.com/2013/09/11/introducing-settle-up-with-splitwise-and-venmo/ — Venmo settlement, Sept 2013
6. https://www.pymnts.com/news/payment-methods/2024/tink-teams-with-splitwise-to-offer-pay-by-bank/ — Tink/Visa pay-by-bank, April 2024
7. https://en.wikipedia.org/wiki/Splitwise — founded 2011, origin as SplitTheRent
8. https://businessmodelcanvastemplate.com/blogs/brief-history/splitwise-brief-history — Splitwise Pro launch 2018
9. https://growjo.com/company/Splitwise — [ESTIMATE] ~$6.6M revenue, ~53 employees
10. https://www.crunchbase.com/organization/splitwise — [ESTIMATE] ~$29.3M raised; $20M Series A led by Insight Partners, 28 Apr 2021

**Splitwise 2023 free-tier limits and backlash**
11. https://www.itvoice.in/splitwise-has-introduced-restrictions-on-the-number-of-free-expenses-users-can-add
12. https://split-circle.com/en/blog/splitwise-daily-limit
13. https://nomadcrew.uk/blog/splitwise-daily-expense-limit-free-alternatives/ — quoted user backlash
14. https://splittyapp.com/learn/splitwise-free-limits/ — Splitwise Pro $4.99/mo

**Competitor pricing and SEO plays**
15. https://splitkaro.com/faq/premium — Premium from ₹37.50/mo billed annually/quarterly; 15-feature list incl. UPI split payments, Swiggy/Blinkit/Zepto/Zomato auto-fetch; group pricing scales down with members
16. https://splitterup.app/blog/best-expense-splitting-apps — comparison-content play; Settle Up $3.49/mo & $18.99/yr; SplitterUp $4.99 one-time → $9.99, "never a subscription"; pub. 20 Jan 2026, upd. 30 May 2026
17. https://github.com/spliit-app/spliit — free/open-source, self-hostable, no-install web use
18. https://spliit.pro/blog/best-splitwise-alternative-2026/ and https://spliit.pro/blog/splitwise-free-vs-pro-worth-paying/ — comparison keyword pages
19. https://www.lovemoney.com/news/85624/best-free-bill-splitting-apps-tricount-splid-settle-up-acasa-splitwise — Tricount free, no limits, no ads
20. https://goodshare.app/blog/tricount-alternatives/ — Splid ~$4.99 one-time (intro), rising to $9.99
21. https://niptao.app/en/blog/splitwise-price-india-2026 — claims Splitwise Pro ₹2,499/yr in India; **contradicted by source 4 and treated as unreliable**

**India monetisation benchmarks**
22. https://www.revenuecat.com/state-of-subscription-apps — IN/SEA D35 conversion 1.4% vs NA 2.6%; RPI D14 $0.08 vs $0.38; RPI D60 $0.11 vs $0.55; RLTV/payer y1 $14 vs $32; trial→paid 15.2% vs 34.2%; median annual price IN/SEA $18.32 vs NA $39.99; freemium 2.1% vs hard paywall 10.7%; trial length 17–32d 42.5% vs ≤4d 25.5%
23. https://dev.to/paywallpro/global-subscription-app-conversion-benchmarks-3c75 — ~8% India card penetration; card-gated trials fail without UPI Autopay
24. https://arpubrothers.com/blog/2025-saas-mobile-apps-trends/ — 2025 LTV/paywall/pricing benchmarks

**Indian fintech monetisation**
25. https://inc42.com/features/upis-monetisation-moment-why-mdr-is-back-on-the-table/ — six years of zero MDR; proposed 0.05–0.07% on >₹2,000 for merchants >₹1–1.5 Cr turnover, ~90% of small merchants exempt; govt subsidy ₹3,631 Cr FY24 → ₹1,441 Cr FY25 → ₹437 Cr FY26; UPI apps monetise via lending, distribution, ads, subscriptions
26. https://www.medianama.com/2025/09/223-1-5b-ipo-phonepe-7631-cr-revenue-fy25-loss/ — PhonePe FY25: ₹7,114.9 Cr revenue from ops; payments 88.5% (₹6,299.7 Cr); insurance+lending distribution ₹557.6 Cr (~8%, +208% YoY); other ₹57.3 Cr; net loss ₹1,727.4 Cr
27. https://valueforstartups.in/jupiter_money_investor_report — Jupiter: free acquisition → interchange + lending
28. https://techcrunch.com/ (Fi Money coverage, 2026) — Fi pivots to B2B AI after consumer-facing profitability struggles
29. https://techcrunch.com/2026/08/04/india-moves-to-give-its-instant-payments-network-a-business-model/ — UPI business-model reform, 4 Aug 2026

**UPI scale**
30. https://www.aninews.in/news/business/upi-hits-new-high-in-may-2026-with-232-billion-transactions-worth-rs-299-trillion-npci-data-shows20260602155337/ — 23.2 bn txns / ₹29.9 lakh Cr, May 2026; 737.79 mn daily average
31. https://www.ibef.org/news/upi-onboarded-55-49-crore-users-by-june-2026-transactions-reach-us-3-56-trillion-in-fy26 — 55.49 crore users by June 2026; ₹314.23 lakh Cr FY26
32. https://www.pib.gov.in/PressReleasePage.aspx?PRID=2257087 — NPCI decade report; UPI ~85% of Indian digital payments

**Internal**
33. Repository commit `4853e10` "feat: implement push notifications for mobile and web" — push infrastructure present in the codebase this report accompanies

## B.4 UX/UI evidence log


| # | Source | Retrieved | What it established | Reliability |
|---|---|---|---|---|
| E1 | `https://apps.apple.com/in/app/splitify-expense-tracker/id6756657540` | 6 Aug 2026 | IN listing: 4.44/5 from 18 ratings, ₹149/₹399/₹999 IAP, description, version history, privacy card | High — primary |
| E2 | `https://apps.apple.com/us/app/splitify-expense-tracker/id6756657540` | 6 Aug 2026 | US listing: 3.0/5 from 4 ratings, $2.99/$7.99/$19.99, full 25-entry version history with dates, "Developer has not indicated supported accessibility features" | High — primary |
| E3 | `itunes.apple.com/lookup?id=6756657540&country=in` | 6 Aug 2026 | Bundle `com.findat.splitify`; 114,756,608 bytes; min iOS 18.0; v1.4.11 dated 6 Aug 2026; release 5 Jan 2026; EN only; 12+; full description; **8 screenshot URLs + 1 iPad URL** | High — primary API |
| E4 | 8 iOS screenshots at 900×1947, downloaded and **visually inspected** | 6 Aug 2026 | Group detail, Personal expenses, Receipt-scan (stock photo, no UI), Add expense, Insights, Budgets, Splitwise import, AI Chat. All layout, colour, type, button, card, form, and iconography observations | High for what is shown; store creative is curated and **stale** (predates v1.4.3 Home tab) |
| E5 | iPad screenshot at 900×1200, visually inspected | 6 Aug 2026 | **The only view of global navigation**: tab bar Friends / Groups / Activity / Account + docked centre "+" FAB. Also settlement row styling and the poor tablet layout | High |
| E6 | App icon at 512×512, visually inspected | 6 Aug 2026 | Teal gradient, white "S", pie ring, motion dashes | High |
| E7 | `play.google.com/store/apps/details?id=com.akhash.splitify` (raw HTML) | 6 Aug 2026 | **Publisher "Findat Pvt. Ltd."**, `hello@getsplitify.com`, `getsplitify.com/privacy` → **proves this is the target's Android build, not a namesake**. 4.8/5, 29–30 reviews, 1K+ installs, rated 12+, updated 6 Aug 2026, "Data is encrypted in transit" | High — primary |
| E8 | 8 Play screenshots at 720×1280, visually inspected | 6 Aug 2026 | Byte-identical creative and layout to iOS → single cross-platform codebase; Material signatures on both platforms | High |
| E9 | Play review text ×3 + developer replies, extracted from E7 | 6 Aug 2026 | (a) password-reset email not delivered + receipt scanner questioned, Jul 2026; (b) positive — "quick to set up, the design is really clean", Oct 2025; (c) **"Full name? Phone number with verification? Crazy!"** May 2026 — and the developer's reply **confirming phone verification is required** | High for the quotes; **n=3, not a usability study** |
| E10 | `getsplitify.com` (WebFetch + raw HTML/CSS scrape) | 6 Aug 2026 | Full copy and section structure; palette `#0E867E`, `#689E88`, `#388468`, `#ADC7D8`, `#F5F0EE`, `#9C7561` + semantic greens/reds/ambers; `font-family: 'Inter'`; **its Play button points at `com.akhash.splitify`**; **mockup captioned "Email alerts connected"** | High for the site; site mockups are marketing renders, **not app screenshots** |
| E11 | `getsplitify.com/privacy` | 6 Aug 2026 | Signup collects **name, email, phone**; **Google Gemini or OpenAI** for AI; **Firebase** for analytics/hosting; **RevenueCat** for subscriptions; **"bank alert SMS messages and emails"** as the transaction source; **no aggregator named**; 60-day deletion | High — primary |
| E12 | `itunes.apple.com/{in,us}/rss/customerreviews/...` (JSON + XML) | 6 Aug 2026 | **Zero entries returned** — no iOS review text is publicly retrievable | High (negative result) |

**Explicitly not evidenced, and not asserted anywhere above:** dark mode (no dark frame exists in any artefact); onboarding, login, create-group, split-editor, settle-up-form, bank-connect, add-budget, and paywall screens (none screenshotted); loading, error, disabled, focus, and first-run empty states (none screenshotted); all motion and haptics; offline behaviour; push notifications; any measured performance number; any iOS review text. Where these are rated, the rating is marked low-confidence and rests on stated inference.

**Namesakes checked and excluded from all analysis:** "Splitify – Splits and Expenses" / Cove by Splitify LLC (`id6736849874`), `splitify.us`, `splitify.app`, the Figma "Splitify" UI kit, and the Dribbble "Splitify – Easy Expense Sharing" concept shot. The brief's inclusion of `com.akhash.splitify` in this list is incorrect — see E7.
