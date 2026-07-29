# Contributing

This project is built by two part-time founders. The conventions below exist to protect against
the failure mode that actually threatens a team that size: **losing shared context** (Blueprint
§14.2). They are lightweight on purpose.

---

## Before you start

Read the relevant section of
[`Health-Garden-System-Architecture-Blueprint.md`](../Health-Garden-System-Architecture-Blueprint.md)
(v2.3). It is the single source of truth. Implementation follows it; where implementation must
diverge, the blueprint is updated **first** and an ADR records why.

---

## This repository's phase sequencing vs. the blueprint's

The blueprint's own roadmap (§13.2) sequences work by _product milestone_ (validate → content →
build → launch → scale). This repository's day-to-day implementation order instead sequences by
_architectural layer_, so each layer is independently testable before the next depends on it:

| This repo's phase           | Blueprint concept it implements                                                        |
| --------------------------- | -------------------------------------------------------------------------------------- |
| 1. Project Foundation       | Tooling/process prerequisites implied throughout §9, §13.4                             |
| 2. Core Infrastructure      | The Edge Function kernel pattern (§2, §6), `/health` (§6.2, §10.2)                     |
| 3. Database Layer           | §5 in full — schema, RLS, the garden engine (ADR-002), seed data                       |
| 4. Auth & Security          | §7 — Supabase Auth, session cookies (ADR-020), headers (§7.11), bot protection (§7.12) |
| 5. Core Business Logic      | §6.2/§6.6 — `ai-chat`, `ai-plan-generate`, `payments-*` Edge Functions                 |
| 6. Background Processing    | §4.6 — `pg_cron` jobs                                                                  |
| 7. External Integrations    | §2.10/§2.11/§6.6 — Gemini, Web Push, payment providers                                 |
| 8. Production Readiness     | §9–§10 — monitoring, CI/CD, deployment                                                 |
| _(then)_ Web client         | §3.1a — Next.js PWA, built only once the backend above is stable                       |
| _(conditional)_ Mobile port | §11.12 — only if the retention gate (§13.6) clears                                     |

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

---

## Branching and review

Work on a branch, open a pull request, let CI run. Two people means formal review is often
impractical — but a PR gives CI a place to run and leaves a written record of intent, which is the
point.

Never commit directly to `main`.
