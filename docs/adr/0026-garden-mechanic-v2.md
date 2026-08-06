# ADR-0026 — Garden mechanic v2: cycle-based growth, event-driven planting, 25-slot board

**Status:** Accepted
**Date:** 2026-08-06

## Context

The garden engine as built (migration 0005, original version; ADR-002; Blueprint §5.3/§5.4) modeled
growth as **weekly**: a plant's stage was `days_succeeded_out_of_7`, reset every Monday by a
`pg_cron` sweep (`archive_and_reset_stale_garden_rows`, §6.4) that archived _every_ plant into
`permanent_garden` at whatever stage it reached — including stage 0, meaning a bad week still
permanently recorded a "failure" row.

The frontend garden board was subsequently built (`web/src/lib/garden/themes.ts`,
`garden-board.tsx`, still mock-data-driven — no backend wiring exists yet) against a materially
different model, surfaced in `garden-mechanic-v2-backend-impact.md` (frontend-authored proposal
document): a 5x5, 25-slot board per theme, filled back-to-front with no gaps; **only fully-grown
plants ever appear**; growth is per-qualifying-day, not week-bounded. The current engine cannot
produce that board — the contradiction is structural, not cosmetic, and nothing about the original
engine was _wrong_: it correctly implemented the model it was specified against. The model changed.

Several sub-decisions the proposal document left open were resolved with the user (see the
document's own G-1 through G-8 open-questions list) before implementation:

- **Board size:** 25 slots / 5x5 (already fixed by the user's explicit UI constraint, matching what
  the frontend's captured art/coordinates use).
- **Cycle length:** 3 qualifying days per plant (not 4) — stage 0 is a visible sprout present at
  cycle start, matching the 4 art frames as stages 0-3 with stage 3 as a graduation event, never a
  stored resting value.
- **Cactus definition:** stays "no sugar" (reuses the existing `sugar_flag` column) rather than "no
  junk food," which would need a new column and a ~1,300-row content-classification pass with no
  content owner assigned yet.
- **Primary-goal plant for `maintain`/`general_health` users:** succeeds within a ±10% band of the
  daily calorie target, rather than falling back to the protein rule.

## Decision

1. **`garden_state.cycle_started_on`** (DATE) replaces `current_week_start` +
   `days_succeeded_this_week`. Stage is always recomputed as "qualifying days since
   `cycle_started_on`" (`daily_goal_success`, a new set-based table function returning all five
   goals' per-day pass/fail in one query — replacing the old per-goal-type `compute_days_succeeded`
   / `did_goal_succeed_on_date` pair, since consistency now depends on the other four goals for the
   _same day_ and a per-date PL/pgSQL loop calling four subqueries each would not perform
   acceptably inside a trigger firing on every log write).
2. **Reaching 3 qualifying days is a graduation event**, handled inside `sync_garden_state` itself
   (a `SECURITY DEFINER` trigger-adjacent function, already the only code path allowed to write
   `garden_state`/`permanent_garden`): insert into `permanent_garden`, reset `cycle_started_on` to
   the day after the graduating day, loop to catch up any backlog in one call. A stage of 3 is
   therefore never actually stored — `current_stage` observed via a client SELECT is always 0-2.
3. **`archive_and_reset_stale_garden_rows()` and its weekly `pg_cron` entry are deleted outright**,
   not deprecated — there is no weekly sweep left to run; planting is now driven entirely by log
   writes.
4. **`permanent_garden` gains `board_number`/`slot_index`/`completed_on`**, replacing
   `week_completed`/`final_stage_reached` (always-max under v2, so dropped rather than kept
   nullable — this project has no deployed production database yet, so there is no historical data
   to preserve). Slot assignment is `COUNT(*) FROM permanent_garden WHERE user_id = ...` at the
   moment of insert (`board_number = n/25`, `slot_index = n%25` for the _n_-th plant a user ever
   earns) — derivable, but stored explicitly rather than recomputed, which survives any future
   "user rearranges their garden" feature without a migration.
5. **Hydration moves from a hardcoded `>= 8`** to `users.daily_water_target_glasses`, falling back
   to 8 when unset. **The primary-goal plant (`wheat_stalk`) branches on `users.goal`** instead of
   always meaning "hit your protein target" — `users.goal` gains a `CHECK` constraint (it was
   previously an unconstrained `VARCHAR`) since an unrecognised value would now silently fail this
   plant's rule every day rather than error at the edge.
6. **Idempotency stance for `permanent_garden` (the proposal's own §7.3, flagged as needing an
   explicit decision):** _accepted, once earned, never revoked._ Under v2 this table is written
   live, mid-cycle, by a trigger — a user can graduate a plant, then delete the log that made the
   final qualifying day count, and recomputing from source would say the plant should not have
   graduated. The table's insert-only guarantee means it stays planted regardless. This is a
   conscious choice, not an oversight: it fits the product's non-punitive philosophy exactly, and
   the "distinct qualifying days since `cycle_started_on`" design already prevents farming the same
   day twice by deleting and re-logging it. **This narrows ADR-002's recompute-from-source
   guarantee to `garden_state` only** — `permanent_garden` is now an append-only ledger of earned
   events, not a re-derivable aggregate.

## Consequences

**Makes easy.** The board the frontend already built now has a real backend to query — a planted
row carries `board_number`/`slot_index`/`plant_type` directly, so wiring real data in is a fetch,
not a redesign. A bad day/week no longer permanently records a stage-0 "failure"; an inactive user
simply has plants that stopped advancing, which is _more_ aligned with the "plants rest, never
wilt" rule than the behaviour it replaces.

**Makes hard.** `garden_state` and `permanent_garden` no longer share one derivation guarantee —
future readers must know `permanent_garden` is a ledger, not a snapshot recomputable from
`food_logs`/`workout_logs`/`water_logs` alone. Raising a target (e.g. `daily_water_target_glasses`)
retroactively re-evaluates every day in the _current, unfinished_ cycle against the new value, which
can make a plant regress from stage 1 to 0 — a real, if narrow, behaviour class worth knowing about
before debugging what looks like data loss.

**Cost.** One migration touching `users`/`garden_state`/`permanent_garden` schema, a full rewrite of
the derivation and sync functions, deletion of the weekly cron job and its test coverage, and a
rewrite of `garden-derivation.test.ts` (now covering per-day growth, graduation, board-slot
rollover, and the goal-branching primary plant — the single highest-value test file in the
codebase, per `CONTRIBUTING.md`'s own testing-priority table).

## Alternatives considered

**Keep weekly growth, add a board rendering layer on top that only shows "completed" weeks.** Would
have avoided the engine rewrite, but the frontend's board explicitly assumes fully-grown plants
only and a 3-day cadence per plant (~15-20 days to fill a 25-slot board across 5 plant types) — a
weekly cadence (max 5 plants/week) would fill a board roughly 3x slower than the art/UX was designed
for, and would still record stage-0 failure rows the non-punitive product philosophy argues against.

**4 qualifying days per plant instead of 3.** Considered because the art has 4 frames; rejected
because stage 3 is never actually stored (graduation is instantaneous), so a 4-day cycle would mean
the 4th frame is _also_ never observed by a client — it would exist in the art but be unreachable in
any UI state, which is a worse mismatch than treating the 4 frames as stages 0-3 with 3 doubling as
the graduation trigger.
