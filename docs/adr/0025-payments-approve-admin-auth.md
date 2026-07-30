# ADR-0025 — Founder-only access via real user JWT + email allowlist, not a roles table

**Status:** Accepted
**Date:** 2026-07-29

## Context

Blueprint §6.2's endpoint table lists `payments-approve-intent`'s auth requirement as "Admin JWT
(Retool)" — a founder reviews a `payment_intents` submission and approves or rejects it. But
§7.3 deliberately keeps this system's authorization model to exactly two roles (free/premium,
modeled as `users.is_premium`), stating explicitly that a `roles`/`memberships` table is not built
until B2B/family roles are activated (§11.4) — which they are not. There is no admin role to check
against anywhere in the schema.

Two ways to make "Admin JWT" concrete were considered, and this was surfaced to the user for a
decision before writing code, per the standing "flag a critical ambiguity, wait for approval"
instruction:

1. **The service-role key as a bearer token.** Retool already holds this key server-side (it's
   already documented as "SECRET... Edge Functions only" everywhere else in this codebase). Simple
   to wire up in Retool. Rejected: it repurposes a platform-wide, bypass-everything secret as a
   per-endpoint credential, and `payment_intents.reviewed_by` — which the schema (migration 0006)
   already types as `REFERENCES users(id)` — would have nothing real to reference; both founders
   would be indistinguishable in the audit trail.
2. **A real Supabase Auth user + an email allowlist.** The founder signs in normally, the same way
   any user does. The Edge Function checks their email against `ADMIN_EMAILS` before permitting the
   action.

## Decision

Use option 2. `reviewed_by` records the approving founder's own `users.id` — a real, resolvable
identity, not a shared secret standing in for "someone with the master key acted." `ADMIN_EMAILS`
(a comma-separated env var, checked case-insensitively) gates the action; everything else about the
request goes through the standard kernel auth path (`auth: 'required'`, a real JWT, `resolveAuthContext`)
unchanged. No new kernel mechanism, no new schema.

## Consequences

**Makes easy.** `payment_intents.reviewed_by`/`audit_log` entries are meaningful and attributable —
if there are ever two founders, the record shows which one acted, not just "someone with the key."
Retool needs nothing more exotic than a normal logged-in session to call the endpoint.

**Makes hard.** Onboarding a new admin is an env var change (a deploy), not a database write — an
acceptable cost at two founders, revisit if the reviewer set grows past a handful of people (the
same trigger §7.3 already names for a real `roles` table).

**Cost.** One small allowlist-check function (`isAdminEmail`), unit-tested directly. Zero new
schema, zero new kernel auth mode.

## Alternatives considered

**A dedicated `admin` boolean or role column on `users`.** More conventional, but is exactly the
"proper roles/memberships model" §7.3 says to build only once B2B/family roles are activated —
introducing it now for a two-person admin set would be the premature complexity that section
explicitly warns against.
