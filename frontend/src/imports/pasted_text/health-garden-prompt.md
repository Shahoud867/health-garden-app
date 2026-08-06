# Health Garden — Frontend Build Prompt for Figma Make

## What this is

Build the complete frontend (structure, content, screens, flows, states, and interaction
behavior) for **Health Garden** — a Pakistani-market health & habit-tracking web app. This is a
**web app (responsive, mobile-first, installable PWA)**, not a native app — build it as a
responsive React web app that works from a budget Android phone's browser up to desktop.

**Design** color palette: bg

#F6EFDF

surface

#FCF7EC

primary

#7C9A5C

terracotta

#E0824A

sky blue

#4FA3C4

sun gold

#F0B93E

ink text

#3A342A

theme: soothing garden. for the garden growth stages, refer to the attached image. (it should be exact). use suitable typrography

The backend for this product is already fully built (Postgres + Supabase Auth + Edge Functions).
This prompt describes exactly what that backend supports so the frontend's data, fields, limits,
and states are all real — nothing here is speculative.

---

## Product in one paragraph

Health Garden pairs Pakistani-native food/workout/water logging (local units like katori/cup/
piece) with a **permanent, non-punitive "garden"** that grows as habits stick — it never resets
and never shows decay or dying plants, only growth or a calm "resting today" state. The app is
condition-aware (diabetes/PCOS/joint-safe filtering), fully bilingual (Urdu + English, with true
RTL mirroring for Urdu, not just a translated font), and offline-first (every log action works
with no connection and syncs later). A premium tier unlocks a cost-capped AI coach (chat +
weekly AI-generated plan). Payments are currently a manual, human-reviewed transfer-verification
flow (JazzCash/Easypaisa), not a card checkout.

**Tone is a hard requirement, not a preference:** calm, plain, non-punitive, gender-neutral, never
guilt-driven, never exclamation-heavy "gamified hype" copy. Example of the actual copy voice used
for an engagement nudge: *"Your garden's still waiting for today's log — even a small one
counts."* Match that register everywhere — reassuring, never alarming, never cutesy.

---

## User roles

- **Free user** — full logging, garden mechanic, condition filtering, weight tracking. Zero live
  AI calls, ever (this is enforced server-side, not just hidden in the UI).
- **Premium user** — everything free users get, plus capped daily AI chat and a weekly
  AI-generated plan (limited regenerations).
- Admin/founder review happens in a separate internal tool (Retool) — **do not build an admin
  surface**, it's out of scope for this frontend entirely.

---

## Global/cross-cutting requirements (apply to every screen)

1. **Bilingual, true RTL support.** Every screen needs English and Urdu content. Switching
   language flips the entire layout direction (LTR ↔ RTL) — mirrored navigation, mirrored icons,
   mirrored text alignment — not just translated strings in a fixed-direction layout.
2. **Offline-first.** Every logging action (food/workout/water/weight) must work with no network
   and reflect instantly in the UI (optimistic update) before any server confirmation. Include a
   calm, persistent, non-alarming sync-status indicator (e.g., "Saved on this device — will sync
   when online" / "All synced"). Never block a user's interaction on network state.
3. **Loading, empty, and error states for everything.** Every list/data view needs a skeleton/
   loading state, a designed empty state (first-time-use copy, not just blank space), and a calm
   error/retry state (network failure, generic server error) — never red-heavy or alarming.
4. **Accessibility (WCAG 2.1 AA).** Full keyboard navigation, visible focus states, proper
   labeling for screen readers, adequate touch-target sizes, sufficient contrast independent of
   whatever color gets chosen later.
5. **Responsive, mobile-first.** Design for a small budget-Android screen as the primary target;
   scale cleanly up to tablet and desktop widths.
6. **PWA installability.** Include a non-intrusive "Install app" / "Add to Home Screen" prompt
   surface (contextual banner, not a blocking modal), plus a notification-permission prompt that
   appears at a sensible moment (not immediately on first load).
7. **No decay/punitive visuals, ever.** Garden plants only ever grow or rest ("dormant today").
   There is no wilting, dying, shrinking, or "you failed" state anywhere in the product.

---

## Screen-by-screen requirements

### A. Public / marketing (unauthenticated)

- **Landing page** — value proposition, how the garden mechanic works, free vs. premium teaser,
  sign-up CTA, footer with legal links (privacy policy, terms — placeholder pages are fine).
- **Pricing page** — free tier feature list vs. premium tier feature list (AI chat + AI weekly
  plan are the premium differentiators), PKR pricing display, upgrade CTA.

### B. Authentication

- **Sign up** — email + password, plus a "Continue with Google" option.
- **Log in** — email + password, plus Google option, "forgot password" link.
- **Forgot / reset password** flow.
- **Email verification notice** state (post-signup, before first login completes).

### C. Onboarding (mandatory, sequential, blocks access to the rest of the app until complete)

1. **Medical disclaimer gate** — a clear, mandatory disclaimer screen/modal ("this app does not
   provide medical advice/diagnoses; consult a doctor") that must be explicitly accepted before
   any other screen is reachable. Cannot be dismissed without accepting.
2. **Basic profile** — full name, age, sex, height (cm), weight (kg).
3. **Activity level** — single-select (e.g., sedentary / lightly active / moderately active / very
   active — illustrative labels, exact wording is a content decision, not fixed).
4. **Goal** — single-select primary goal (e.g., lose weight / maintain / build strength / general
   health — illustrative, not fixed).
5. **Conditions** — multi-select health conditions relevant to filtering (e.g., diabetes, PCOS,
   knee/joint pain, or "none of these"). This drives food/exercise filtering later, so make clear
   it's used to hide unsafe recommendations, not just profile trivia.
6. **Computed targets summary** — before finishing, show the user's calculated daily calorie
   target and daily protein target (computed server-side from the above) as a friendly summary
   screen, then proceed to Home.

### D. Home / Today dashboard

- Greeting + current date.
- Today's snapshot: calories logged vs. target, water glasses vs. goal, workout minutes logged.
- A compact garden preview (all 5 plants, current stage at a glance) with a link to the full
  Garden view.
- Quick-log entry points: Log a meal, Log water, Log a workout, Log weight — each one tap away.
- Sync-status indicator and (contextually) the install/notification prompts described above.

### E. Food logging

- **Search** — search-as-you-type over a food database; results show dish name (with Urdu name),
  serving unit in **local terms** (katori / cup / piece / etc.), and calorie/macro info at a
  glance. Include a clear empty/no-results state.
- **"Your Usuals"** — a quick-access strip/grid of the user's top 10 most-logged meals, tappable
  to log in one step.
- **Meal slot selector** — breakfast / lunch / dinner / snack.
- **Quantity adjuster** — stepper for number of portions (in the food's native local unit).
- **Today's food log** — list grouped by meal slot, each entry editable/removable, running total
  visible.

### F. Workout logging

- **Browse by category** (e.g., cardio, strength, joint-friendly/knee-safe, etc.).
- **One-tap logging** with an adjustable reps/duration stepper (not a multi-field form).
- Show the calculated calorie burn for the logged entry.
- **Today's workout log** list, editable/removable entries.

### G. Water logging

- Simple glass counter — one tap adds a glass, one tap removes; visual progress toward the daily
  8-glass goal.
- Log history for the day.

### H. Weight tracking

- Simple "log today's weight" input.
- A trend chart over time (weekly/monthly toggle) — this is a committed, permanent feature, not
  an afterthought.

### I. Garden (the core retention mechanic — most important screen in the product)

- **Five plants, each tied to a specific weekly goal:**
  | Plant | Goal it represents |
  |---|---|
  | Mint | Hydration (8 glasses/day) |
  | Cactus | Sugar-free days |
  | Wheat Stalk | Hitting daily protein target |
  | Sapling | Movement (any logged workout that day) |
  | Succulent | Overall consistency (logged *something* that day) |
- **Four growth stages per plant (0–3)**, driven by days-succeeded-this-week out of 7 (roughly:
  0–1 days = stage 0, 2–3 = stage 1, 4–5 = stage 2, 6–7 = stage 3). Show current stage and
  progress toward the next one ("3/7 days this week — 1 more day to grow").
- **"Resting today" (dormant) state** — when today's goal isn't yet met, the plant shows a calm
  "resting" indicator, never a warning/negative/red state. This is a first-class visual state, not
  an edge case.
- **Permanent Garden / history view** — a separate view showing every completed week's plants,
  preserved forever as a growing collection/timeline. This is the emotional payoff of "the garden
  never resets" — treat it as a meaningful, browsable archive, not a buried settings sub-page.
- **Share a milestone** — generate a shareable image/card of current garden progress with a
  "Share" action (WhatsApp is the primary target audience's dominant share channel).

### J. Condition-specific insight cards (only shown if relevant to the user's selected conditions)

These are **informational overlays, not new garden plants or gamified elements** — they must not
visually compete with or dilute the 5-plant garden.

- **Diabetes Management** — glycemic-index-aware food callouts, meal-timing tips, a trend view of
  sugar-free days.
- **PCOS Support** — hormone-friendly exercise callouts, educational tips, and an **optional**,
  clearly-opt-in daily symptom check-in (1–5 severity scale + notes).
- **Joint-Friendly** — knee-safe exercise callouts, and an optional pain-trend check-in (1–5
  scale), charted the same way as the weight trend.

Treat these as content/insight cards woven into relevant screens (e.g., a card on Home or in Food/
Workout logging), not a whole separate app section.

### K. AI Coach (premium-gated)

- **Free-user teaser/locked state** — clear explanation that AI chat is a premium feature, with an
  upgrade CTA. Never shows a broken/error-like state to free users — it's a deliberate locked
  feature, framed positively.
- **Chat interface** — message list (user + AI turns), text input (soft cap around 2000
  characters), send button.
- **Daily cap indicator** — e.g., "6 of 15 messages used today," with a friendly "cap reached, see
  you tomorrow" state once exhausted (not an error).
- **Feature-disabled (kill-switch) state** — a calm "AI coach is temporarily unavailable" message,
  framed like planned maintenance, never like a crash.
- **Fallback-reply state** — when the AI backend is slow/unavailable, the system still returns a
  normal-looking templated reply referencing the user's garden progress. This should render as an
  ordinary chat message, never flagged to the user as degraded/an error.
- **Persistent disclaimer** — a footer/banner reminding the user this isn't a substitute for
  professional medical advice.

### L. AI Weekly Plan (premium-gated)

- Free-user locked/teaser state (same pattern as AI Coach).
- **Generate** button producing a structured, readable weekly plan.
- **Regenerate** with a visible "X of 2 regenerations used this week" indicator; once the cap is
  hit, regenerate becomes disabled with a clear explanation (not hidden).
- **Error/retry state** — if generation fails, show a real, retryable error (distinct from the AI
  Coach's silent fallback — a failed plan generation is a legitimate "try again" moment, not
  something to paper over).

### M. Premium / paywall / payments

- **Plan comparison** — free vs. premium feature list, upgrade CTA used consistently everywhere
  premium is gated (AI Coach lock, AI Plan lock, Profile).
- **Payment submission flow** (this is a *manual, human-reviewed* transfer, not a card checkout):
  - Amount and payment method selector (JazzCash manual transfer / Easypaisa manual transfer).
  - Clear instructions for where/how to send the manual transfer.
  - A transaction-reference input field the user fills in after paying.
  - A bot/abuse-verification challenge before submission (framed simply as "quick verification,"
    no need to over-explain the mechanism).
  - **Rate-limit state** — a friendly message if the user already has pending submissions under
    review ("you have pending submissions — please wait for review before submitting another").
- **Submission confirmation** — clear "pending review" status with expectation-setting copy about
  review turnaround.
- **Subscription status view** — pending / approved / rejected states, and once active, the
  current billing period.

### N. Profile & settings

- View/edit profile fields (name, age, sex, height, weight, activity level, goal, conditions).
- **Language toggle** (Urdu ⇄ English) — must visibly demonstrate the RTL flip.
- Notification preferences (enable/disable push; a way to re-trigger the browser permission
  prompt).
- Subscription/billing status and history.
- **Data & privacy** — "Export my data" action and a clearly-explained, confirmation-gated
  "Delete my account" flow (make the permanence of deletion explicit in the copy).
- Logout.
- Install-app instructions (flag that iOS Safari specifically requires installing to Home Screen
  for notifications to work).
- About/legal links.

---

## Explicit non-goals for this build

- No admin/founder tooling (handled by a separate internal tool).
- No real payment-gateway checkout UI (card payments aren't live yet — only the manual transfer
  flow above).
- No native-app-specific UI (this is a web app; native mobile is a possible future, separate
  build).
- No visual design system, color palette, iconography, or illustration style — leave all of that
  open/neutral, as stated at the top.
