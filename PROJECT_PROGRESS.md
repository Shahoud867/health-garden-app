# Project Progress Summary

Health Garden is a health and habit-tracking app for the Pakistani market. Instead of showing users boring charts, it grows a virtual "garden" that reflects how well they're sticking to their health goals (drinking water, eating well, exercising, etc.). This document explains, in plain language, everything built so far.

Everything below is built on **Supabase**, a hosting service that provides a database, user accounts (login/signup), file storage, and small pieces of backend code ("Edge Functions") all in one place. Think of it as the app's engine room — none of this is visible to users directly, but it's what makes every feature possible.

---

## Phase 1: Project Foundation

- Set up the basic tools, folder structure, and quality checks (automatic formatting, spell-checking code, etc.) every future phase would build on.
- Established the "rulebook" for the project — a blueprint document that all future decisions must follow, so the two founders stay on the same page even working separately.
- Set up automated checks ("CI") that run every time code is changed, so mistakes are caught immediately instead of after launch.

## Phase 2: Core Infrastructure

- Built the reusable "skeleton" that every backend feature plugs into — handling things like checking if a user is logged in, validating requests, and reporting errors consistently, so each new feature doesn't have to reinvent this from scratch.
- Added a basic `/health` check endpoint — a simple way to confirm the backend is alive and responding, useful for monitoring later.
- This reduced future bugs by making sure every feature handles errors and security the same, proven way.

## Phase 3: Database Layer

- Designed and built the full database: user profiles, food/exercise/water logs, recipes, and the "garden" data that turns habits into visual progress.
- Built the "garden engine" — the logic that decides how a user's virtual plants grow or wilt based on their real-world habit tracking.
- Locked down the database so users can only ever see and change their own data, never anyone else's — enforced by the database itself, not just the app's code (a much stronger guarantee).
- Wrote automated tests for all of this and loaded realistic sample data, so the database can be trusted before anything is built on top of it.

## Phase 4: Auth & Security

- Added the ability for a user to **export all their own data** or **permanently delete their account**, which is both good practice and a common legal requirement.
- Added "Turnstile" bot-verification (like a modern CAPTCHA) to protect certain actions from automated abuse.
- Hardened login security settings, like requiring stronger passwords and limiting how often someone can attempt to log in, to reduce the risk of hacked accounts.

## Phase 5: Core Business Logic

- Connected the app to Google's Gemini AI so users can chat for health guidance and get AI-generated weekly plans — with strict safety rules so the AI never gives medical dosages/diagnoses and always defers serious questions to a real doctor.
- Added daily limits on AI usage per user so costs stay predictable and the service can't be abused, with the limit checked _before_ every AI call (never after).
- If the AI service is briefly unavailable, the app quietly falls back to a helpful template message instead of showing an error to the user.
- Built an interim (manual/human-reviewed) payment system, since a full automated payment provider isn't in place yet — users submit proof of payment, and an admin reviews and approves it.
- Documented exactly who is allowed to act as an admin and why, so this power is narrowly and safely scoped.

## Phase 6: Background Processing

- Set up scheduled, automatic jobs that run in the background without any user action:
  - Weekly "garden archival" — moves each week's completed garden progress into permanent history and resets for the new week.
  - Engagement nudges — sends a push notification to users who haven't logged any activity that day, to gently encourage them back.
  - An AI usage "watchdog" — automatically disables the AI chat feature if usage gets dangerously close to the daily budget, protecting the project from surprise costs.
  - Payment reconciliation — automatically flags payment submissions that have sat unreviewed too long.
- Added real Web Push notification support (the standard, secure way browsers deliver notifications) and fixed the underlying data storage for it, which had been set up incorrectly earlier.
- Stored sensitive keys (like the credentials the background jobs use to call the app) in a properly encrypted secrets vault, rather than in a plain settings table.
- Found and fixed a subtle bug where a test's math didn't line up with how the weekly archival job actually counts days — the kind of bug that only shows up on certain days of the week — ensuring the automated tests are fully reliable.

---

## Current Status

- **Phases 1 through 6 are complete and verified** — the database, login/security, AI features, interim payments, and all background automation are built, tested, and passing all automated checks.
- The backend is in a solid, working state: a user's account, habit logs, garden progress, AI conversations, and payments can all be created, protected, and processed correctly.
- The project is ready to move into **connecting real payment providers** and eventually **building the actual visible app (website/mobile) that users will interact with** — the engine is built; the storefront and dashboard come next.

## Next Steps

1. **Phase 7 — External Integrations**: Connect a real payment provider (e.g., for card/bank payments) once the app has enough users to justify it — for now, needs a scoping discussion since that trigger point hasn't been reached yet.
2. **Phase 8 — Production Readiness**: Add full monitoring/alerting and finalize the deployment pipeline so the app can run reliably in the real world.
3. **Web App**: Build the actual website (the part users see and click on) that connects to everything built so far.
4. **Mobile App (conditional)**: Only pursued later, if user retention data shows it's worth the investment.
