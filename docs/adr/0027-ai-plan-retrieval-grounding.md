# ADR-0027 — Retrieval-grounded AI plan generation, not free-text invention

**Status:** Accepted
**Date:** 2026-08-06

## Context

`ai-plan-generate` as built sent Gemini five scalar fields (goal, activity level, conditions,
calorie/protein targets) and asked it to write a free-text "7-day meal and movement outline...
using locally available Pakistani foods where possible." Reviewed against the actual schema
(`personalized-plans-implementation.md`, a backend-owner-audience proposal document, cited against
real line numbers rather than memory) this cannot deliver a genuinely personalized plan:

- No food preference data existed on `users` at all (diet type, allergies, dislikes, budget).
- The ~600-recipe database was never consulted — the prompt asked Gemini to invent "Pakistani
  foods" from its own training data, meaning **a plan could reference dishes that don't exist in
  this database, which a user then cannot log** — the feature actively failed to connect to the
  rest of the product.
- Condition safety was hinted at in the prompt text, not enforced by anything the database could
  guarantee.
- Logged behaviour (food/workout history, weight trend) never reached the prompt, so a plan read
  identically in week 1 and week 20.
- `maxOutputTokens: 512` (≈350-400 words) for 7 days of meals _and_ movement is roughly one terse
  line per day.

Separately, `gemini-provider.ts` hardcoded `gemini-2.0-flash`, which Google retired 1 June 2026 — by
the time this was reviewed (August 2026) the feature was silently broken in any environment pointed
at a live key: chat degrades quietly to a templated fallback (nobody notices), plan generation fails
loudly. Fixed as a config-value change (`GEMINI_MODEL` already read from the environment;
`gemini-3.5-flash` is Google's current recommended replacement), independent of everything else in
this ADR.

A zero-budget constraint shapes the design: Gemini's free tier binds on **requests per day**, not
tokens. Chat is the expensive feature (≈80 daily-active chatters exhausts the whole project's daily
quota at the seeded caps); plans are one call/user/week (diet) plus one/user/month (workout) —
functionally free on the metric that actually binds. This means spending tokens generously on plans
while keeping every plan-related action off the chat cap entirely is the one design choice that
makes rich personalization affordable without a paid tier.

## Decision

**Ground the model in real, pre-filtered candidates instead of asking it to invent.** Two new
`SECURITY DEFINER` retrieval functions (migration 0013)
— `candidate_recipes_for_user`/`candidate_exercises_for_user` — filter in plain SQL on this user's
conditions, allergies, dislikes, budget, and equipment access, then the prompt says: _"here are N
dishes/exercises our database already vetted for this person — build a plan using only these,
referenced by id."_ Filtering in SQL is free, deterministic, auditable, and makes condition safety a
database guarantee rather than a prompt hint; at current content scale (≈600 recipes, 8 exercises)
tag/numeric filtering is both sufficient and fast — no embeddings or vector store needed.

Concretely:

- **`ai_plans` gains `plan_type` ('diet'|'workout') and `period_start`/`period_kind`**, replacing
  the single `week_start` — a weekly diet plan and a monthly workout plan can now coexist for the
  same user, sharing one regeneration-cap config value (`ai_plan_regenerations_cap`) rather than
  introducing a second cap before there is any evidence the two need different limits.
- **`users` gains preference columns** (`food_allergies`, `disliked_food_tags`,
  `daily_food_budget_pkr`, `meals_per_day`, `workout_days_per_week`, `workout_session_minutes`,
  `equipment_access`) written via the existing self-service RLS `UPDATE` policy — no new endpoint
  needed, since these are plain user-owned data, unlike the derived/protected values ADR-0024
  covers. **`diet_type` is deliberately not added yet** — `recipes` has no vegetarian/diet
  classification to enforce it against, and adding the column without enforcement would be a prompt
  hint dressed up as a guarantee, the exact failure mode this ADR exists to fix. v1 personalizes on
  allergies, dislikes, and budget only.
- **A rigid, parseable output format** (`Day N | Meal | <id> | <dish name> | <portion>` for diet,
  `Day N | <id> | <exercise name> | <duration>` for workout) — not JSON. A small model gets JSON
  wrong often enough to need retry/repair engineering a weekly, low-frequency feature doesn't
  justify; a fixed one-line-per-item format is trivially parseable client-side later without asking
  the model for strict structure now.
- **Three preset actions, never free-text plan requests**: "make my meal plan," "make my workout
  plan," and "adjust this plan" (the last backed by one of six fixed reason chips —
  `too_repetitive`, `too_expensive`, `no_time_to_cook`, `want_more_protein`, `too_much_dairy`,
  `make_it_lighter` — each mapped server-side to a fixed prompt clause). A chip is a closed enum; it
  structurally cannot carry a prompt injection the way an open "tell the AI what to change" text box
  could.
- **Two weeks of logged behaviour (`recent_activity_summary`: avg calories, workout days, latest
  weight) are sent to Gemini for plan generation.** This is a conscious, narrow departure from
  `UserContext`'s documented "never send raw health metrics to a third-party model" rule (chat
  path) — defensible specifically here because a weight-goal plan cannot be built without weight,
  and because plan generation is a deliberate, low-frequency, user-initiated action, not a blanket
  policy change to every AI call. Recorded here rather than left as a quiet drift, per the source
  proposal's own explicit flag on this point.
- **Token ceilings raised** to ~2000 (diet) / ~1200 (workout), replacing the shared 512.

## Consequences

**Makes easy.** Every suggested meal/exercise maps to a real database row a user can tap to log —
the model can only ever pick from the candidate list it was given. Condition safety for exercises is
enforced today (`exercises.exclude_conditions` is populated for the curated 8-row seed set); the
budget/condition filters for recipes are written to activate correctly the moment content work
populates the columns they depend on, without a further code change.

**Makes hard / known gaps, verified against the real content, not assumed.**
`recipes.condition_tags` is 0% populated in the current dataset — the condition-safety clause for
recipes is a structural no-op until a content pass tags them; the exercise side is unaffected.
`recipes.cost_pkr_per_serving` is likewise 0% populated — the budget filter is written NULL-safe
specifically because of this (an un-NULL-safe version would silently return zero candidates for
every budget-conscious user). Neither gap blocks this ADR; both are pre-existing content-coverage
facts this design was written against rather than around.

**Cost.** One migration (retrieval + activity-summary functions), a rewrite of
`ai-plan-generate`'s handler and the `AiProvider`/`PlanRequest` interface (`UserProfile` is
replaced outright, not extended — the five-field shape had no room for candidates or activity data),
a new `plan-prompt.ts` module (unit-tested independently of any Gemini call), and a config default
fix (`gemini-3.5-flash`) that is unrelated in cause but bundled here because nothing else in this
feature is verifiable while the model is dead.

## Alternatives considered

**Embeddings/vector search over the recipe set.** Rejected at current scale (~600 recipes): tag
matching plus numeric filters already narrow the candidate set correctly and cheaply; a vector store
adds infrastructure and cost with no accuracy benefit this data volume would surface.

**Ask the model for JSON output.** Rejected — see "rigid, parseable output format" above. Revisit
only if a future, more capable model (or a larger token/latency budget) makes structured output
reliable enough to skip the plain-text intermediate format.

**Give plan generation its own, higher chat-style cap instead of grounding it.** Would not have
fixed the actual defect (invented dishes, no condition enforcement) — more tokens spent asking the
model to invent more elaborately is still inventing.
