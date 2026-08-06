# Contributing

This project is built by two part-time founders. The conventions below exist to protect against
the failure mode that actually threatens a team that size: **losing shared context** (Blueprint
§14.2). They are lightweight on purpose.

---

## Before you start

Read the relevant section of
[`Health-Garden-System-Architecture-Blueprint.md`](Health-Garden-System-Architecture-Blueprint.md)
(v2.3). It is the single source of truth. Implementation follows it; where implementation must
diverge, the blueprint is updated **first** and an ADR records why.

---

## This repository's phase sequencing vs. the blueprint's

The blueprint's own roadmap (§13.2) sequences work by _product milestone_ (validate → content →
build → launch → scale). This repository's day-to-day implementation order instead sequences by
_architectural layer_, so each layer is independently testable before the next depends on it:

| This repo's phase                         | Blueprint concept it implements                                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Project Foundation                     | Tooling/process prerequisites implied throughout §9, §13.4                                                                                                                                             |
| 2. Core Infrastructure                    | The Edge Function kernel pattern (§2, §6), `/health` (§6.2, §10.2)                                                                                                                                     |
| 3. Database Layer                         | §5 in full — schema, RLS, the garden engine (ADR-002), seed data                                                                                                                                       |
| 4. Auth & Security (backend portion)      | §7.9/§7.12's backend halves — account export/deletion, Turnstile verification, Auth rate-limit/password config                                                                                         |
| 5. Core Business Logic (interim payments) | §6.2/§6.6 — `ai-chat`, `ai-plan-generate`, `payments-submit-intent`/`payments-approve-intent` (ADR-008's manual path only; `payments-create-checkout`/`payments-webhook` wait for a real merchant API) |
| 6. Background Processing                  | §4.6 — `pg_cron`/`pg_net`: garden archival, engagement nudges (Web Push), quota watchdog, payment reconciliation                                                                                       |
| 7. External Integrations                  | Real merchant-API payments once ADR-008's cutover trigger fires (Web Push shipped in Phase 6, alongside the job that uses it)                                                                          |
| 8. Production Readiness                   | §9–§10 — monitoring, CI/CD, deployment                                                                                                                                                                 |
| _(then)_ Web client                       | §3.1a — Next.js PWA; also where ADR-020 (session cookies), §7.11 (security headers), and §7.6's CSRF/XSS mitigations land, since all three are Next.js middleware by definition, not backend work      |
| _(conditional)_ Mobile port               | §11.12 — only if the retention gate (§13.6) clears                                                                                                                                                     |

Three things this repository deliberately does **not** have, because the blueprint's own ADRs rule
them out rather than merely omitting them — do not reintroduce them without first amending the
blueprint:

- **No ORM** (ADR-007) — `supabase gen types typescript` is the single schema-definition source of
  truth; a second one (Prisma/Drizzle) would drift from it.
- **No repository/DAO layer** — the Supabase client + RLS _is_ the data-access layer; wrapping it
  in another abstraction adds indirection with nothing left to abstract.
- **No message queue** (§2.7, §3.4) — `pg_cron` + Edge Functions cover every background job
  identified in the blueprint; a queue (even Upstash Redis, which is free) is reserved for the
  100K-user tier (§8.2), not built speculatively now.

---

## Commit convention

Conventional Commits, enforced by a `commit-msg` hook:

```
<type>(<scope>): <subject>
```

**Types:** `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `revert`

**Scopes:** `kernel`, `db`, `auth`, `tracker`, `garden`, `ai`, `payments`, `jobs`, `obs`,
`security`, `web`, `ci`, `docs`, `deps`, `config`

```
feat(garden): derive weekly counts from source logs
fix(kernel): keep redaction inside the logging error boundary
docs(adr): record interim payment verification decision
```

Subject line in the imperative mood, no trailing period. Explain _why_ in the body when the reason
is not obvious from the diff — that body is what makes the history worth having.

---

## Definition of done

A change is done when all of the following hold:

- [ ] `npm run verify` passes (format, lint, typecheck, test)
- [ ] New logic has tests — especially anything computing a number a user sees
- [ ] Any new table has RLS policies, and they are tested
- [ ] No secret is introduced into a tracked file
- [ ] Schema changes are migration files, never dashboard edits (ADR-012)
- [ ] Public functions carry a doc comment explaining intent, not mechanics
- [ ] The blueprint is updated if the change alters an architectural decision

---

## Testing expectations

Priority follows blast radius, not coverage percentage:

| Priority | What                                                 | Why                                                                                          |
| -------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Highest  | Garden derivation, MET calorie math, BMR calculation | A wrong number here silently corrupts the product's core promise                             |
| High     | AI cap enforcement, payment state transitions        | These protect the budget and real money                                                      |
| High     | RLS policies                                         | The only authorization layer a modified client cannot bypass                                 |
| High     | Rendering/caching safety (ADR-021)                   | The web pivot's single most severe hazard class — cross-user data leakage via a shared cache |
| Medium   | Kernel behaviour                                     | Extend when adding cross-cutting concerns                                                    |
| Low      | Straight-through CRUD                                | PostgREST and RLS already cover it                                                           |

Test behaviour, not implementation. A test that breaks when you rename a private function without
changing behaviour is a maintenance cost, not a safety net.

---

## Architecture Decision Records

Record a decision when it is expensive to reverse, non-obvious to a newcomer, or a deviation from
the blueprint. Copy `docs/adr/TEMPLATE.md`, number it starting at **0023** (see
`docs/adr/README.md` for why), and keep it short — half a page is usually right.

Do not record routine choices any reasonable engineer would make the same way.

---

## Security rules that are not negotiable

1. **Never** use the service-role client to satisfy a user-facing read. It bypasses RLS entirely.
2. **Never** commit a secret. `gitleaks` runs pre-commit and over full history in CI. If it fires
   on a false positive, add a narrowly scoped allowlist rule — do not bypass with `--no-verify`.
3. **Never** log a raw health, identity, or credential value. The logger (Phase 2) redacts by key
   pattern; do not defeat it by interpolating a sensitive value into a message string.
4. **Never** check an AI usage cap after calling the model. The check exists to prevent the call
   (ADR-003); checking afterwards has already spent the quota.
5. **Never** `UPDATE` or `DELETE` `permanent_garden`. A database trigger rejects it (§5.4), and
   that trigger is a product guarantee, not a technical detail.
6. **Never** allow an authenticated route to be statically generated or cached at a shared layer
   (ADR-021). This is how one user's private data gets served to another user.
7. **Never** add a client-facing `INSERT`/`UPDATE`/`DELETE` policy to a derived/protected value
   (`garden_state`, `permanent_garden`, `subscriptions`, `users.is_premium`, AI usage/plans, ADR-0024)
   — even scoped to the owning user's own row. A write to one of these goes through a new or
   existing `SECURITY DEFINER` function, never a relaxed RLS policy.
8. **Never** call Gemini directly from an Edge Function, and never return its response without the
   output-safety check (`_shared/ai/output-safety.ts`, ADR-022). Go through `AiProvider` so a future
   provider swap is a new adapter, not a rewrite of every call site — and so the prompt-injection
   defenses are structurally impossible to skip by accident.
9. **Never** let the Gemini quota watchdog auto-re-enable `ai_chat_enabled`. Disable-only, always —
   a kill switch that quietly resets itself once usage drops isn't a kill switch.
10. **Never** put a genuine secret (a service-role key, a signing key) in `app_config`. It has zero
    client policies, but it is still a plain table — non-secret runtime settings go there;
    anything a `pg_dump` or replica should never reveal in plaintext goes in Supabase Vault instead
    (`invoke_edge_function()`, migration 0011).

---

## Branching and review

Work on a branch, open a pull request, let CI run. Two people means formal review is often
impractical — but a PR gives CI a place to run and leaves a written record of intent, which is the
point.

Never commit directly to `main`.

**This is a written rule, not yet an enforced one** — nothing on GitHub currently stops a direct
push to `main`, and both founders have done it (harmlessly so far, but a real conflict is a matter
of when, not if, once two people are pushing independently). Whoever has repo admin access should
turn on branch protection once, in the GitHub UI (Settings → Branches → Add branch protection rule
→ branch name pattern `main`):

- **Require a pull request before merging** — this alone is what makes "never commit directly to
  main" true instead of aspirational.
- **Require status checks to pass before merging**, and select all three CI jobs (`Format, lint,
typecheck, test`, `Database schema, RLS, garden engine`, `Secret scan`) — a broken branch can no
  longer reach `main` at all, closing the exact gap that let an unformatted file and a bad seed row
  sit on `main` red for several commits before anyone noticed.
- **Do not** require approving reviews from a second person — CONTRIBUTING already states formal
  review is impractical at two people; requiring it here would just be friction with no one to
  provide it. Revisit if the team grows.

This is a five-minute, one-time setting — GitHub doesn't expose it over the unauthenticated public
API, so it has to be a human clicking the toggle, not something a coding session can do for you.
