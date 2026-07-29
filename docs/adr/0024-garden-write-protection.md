# ADR-0024 — SELECT-only RLS for derived/protected values; all writes via SECURITY DEFINER

**Status:** Accepted
**Date:** 2026-07-29

## Context

The source roadmap (`Founder_B_Backend_Roadmap.md` §4.8) specifies `FOR ALL USING (...)` RLS
policies for `garden_state` and `permanent_garden` — the same blanket-ownership pattern used for
genuinely user-authored data like `food_logs`. Building Phase 3 (Database Layer) against that
policy literally would have let any authenticated user's own client `PATCH garden_state.current_stage`
or `POST` a fabricated `permanent_garden` row directly through PostgREST, bypassing:

- ADR-002 — `garden_state`'s counters must never be independently mutable, only derived.
- §5.4 — `permanent_garden` is "insert-only... enforced at the database level, not by convention
  alone." The blueprint's own trigger only blocks `UPDATE`/`DELETE`; `FOR ALL` RLS still permits a
  direct client `INSERT`, which the trigger does not.

This was flagged to the user before any code was written, per the standing instruction to surface
a critical flaw and wait for approval rather than silently deviate. Approved before migration 0005
was written.

The same category of gap turned up a second time, independently, while building migration 0006:
`users` RLS (migration 0003) legitimately allows a user to `UPDATE` their own profile row, but RLS
is row-level, not column-level — it cannot stop that same `UPDATE` from also setting
`is_premium = true`. §5.5 already establishes `is_premium` as "derived, trigger-maintained... rather
than an independently-writable column," so this is the identical principle applied to a second
value, not a new decision requiring separate approval.

## Decision

Any value the architecture treats as _derived_ rather than _user-authored_ gets two layers, not one:

1. **RLS grants `SELECT` only** to the authenticated role (`garden_state`, `permanent_garden`,
   `subscriptions`, `daily_ai_usage`, `ai_plans`) — no `INSERT`/`UPDATE`/`DELETE` policy exists for
   that role at all, which is a default-deny under Postgres RLS.
2. **All writes happen through a `SECURITY DEFINER` function** (`sync_garden_state`,
   `seed_garden_state_for_new_user`, `archive_and_reset_stale_garden_rows`, and the trigger
   functions in migration 0006), which runs with the function owner's privileges and so bypasses
   RLS entirely — but only ever writes the derived value it computes, never a client-supplied one.

Where a value is only _partially_ protected — `users.is_premium` sits in a row the client
legitimately needs to `UPDATE` for other fields (name, weight, goals) — a `BEFORE INSERT OR UPDATE`
trigger (`enforce_is_premium_derivation`) recomputes and overwrites that one column unconditionally,
discarding whatever the client sent, rather than relying on RLS to protect a single column it
cannot see at that granularity.

The five internal helper functions this pattern depends on
(`compute_days_succeeded`, `did_goal_succeed_on_date`, `sync_garden_state`,
`seed_garden_state_for_new_user`, `archive_and_reset_stale_garden_rows`) additionally have `EXECUTE`
revoked from `PUBLIC`/`anon`/`authenticated`, since PostgREST exposes every `public`-schema function
as an RPC endpoint by default — without the revoke, a client could call
`rpc/seed_garden_state_for_new_user` with an arbitrary `user_id`, even though the write it performs
is itself idempotent and harmless.

## Consequences

**Makes easy.** A client can never make `garden_state`, `permanent_garden`, `subscriptions`,
`is_premium`, AI usage, or AI plan content say anything other than the truth the derivation logic
computed — the guarantee §5.4 and ADR-002 already claim for `permanent_garden` alone now holds
uniformly across every value in the schema with the same shape of risk.

**Makes hard.** A future feature that legitimately needs a client to influence one of these values
(e.g., an admin override) must go through a new, explicit `SECURITY DEFINER` function with its own
authorization check — it cannot be added as a quick RLS policy relaxation, which is the point.

**Cost.** One additional trigger (`enforce_is_premium_derivation`) and five `REVOKE` statements
beyond what the blueprint's SQL sketches show. Zero additional tables or client-facing complexity —
reads are unaffected; `GET /rest/v1/garden_state` still works exactly as §6.1 describes.

## Alternatives considered

**Column-level `REVOKE`/`GRANT` on `users.is_premium` instead of a `BEFORE` trigger.** Postgres
supports column-level privileges, and PostgREST respects them. Rejected because a client `PATCH`
touching a restricted column fails the _entire_ request rather than silently keeping the server
truth — worse UX for a routine profile edit that happens to include an unrelated field, for no
correctness benefit the trigger doesn't already provide.

**Leave `FOR ALL` as specified and rely on Edge Function-only writes by convention.** This is
exactly the "convention, not database enforcement" gap §5.4 already explicitly rejects for
`permanent_garden` elsewhere in the same document — extending that same weaker standard to the rest
of the derived-value surface would have been inconsistent with the blueprint's own stated bar.
