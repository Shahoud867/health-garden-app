# Health Garden

Pakistani-native health app pairing local-unit food/workout tracking with a permanent,
non-punitive "garden" that grows as habits stick — never resets. Condition-aware
(diabetes/PCOS/joint-safe), offline-first, bilingual Urdu/English, with a cost-capped AI coach
for premium plans/chat. **Web-first** (Next.js PWA) — a React Native port is a separate, later
track gated behind real-user retention data, not a launch requirement.

> **Architecture is specified before it is built.** The authoritative design document is
> [`Health-Garden-System-Architecture-Blueprint.md`](../Health-Garden-System-Architecture-Blueprint.md)
> (**v2.3**). Every decision in this repository traces to a section or ADR in that document. If
> code and blueprint disagree, one of them is a bug — resolve it, do not let them drift.
>
> **Status: pre-implementation.** Nothing beyond project tooling exists yet — this repository was
> rebuilt from an empty state; see the status table below for what's actually done.

---

## Status

| Phase                                    | Scope                                                          | State       |
| ---------------------------------------- | -------------------------------------------------------------- | ----------- |
| **1 — Project Foundation**               | Repo, tooling, git hooks, CI skeleton, docs                    | ✅ Complete |
| 2 — Core Infrastructure                  | Edge Function kernel, `/health` endpoint                       | ⏳ Next     |
| 3 — Database Layer                       | Schema, RLS, garden engine, seed data                          | ⏳ Planned  |
| 4 — Auth & Security                      | Supabase Auth wiring, session cookies, headers, bot protection | ⏳ Planned  |
| 5 — Core Business Logic                  | `ai-chat`, `ai-plan-generate`, `payments-*` Edge Functions     | ⏳ Planned  |
| 6 — Background Processing                | `pg_cron` jobs (garden reset, watchdogs, reconciliation)       | ⏳ Planned  |
| 7 — External Integrations                | Gemini (via provider abstraction), Web Push, payment providers | ⏳ Planned  |
| 8 — Production Readiness                 | Monitoring, CI/CD hardening, deployment                        | ⏳ Planned  |
| _(then, frontend)_ Next.js web client    | Only begins once the backend above is complete                 | ⏳ Planned  |
| _(conditional)_ React Native mobile port | Only if the retention gate (Blueprint §13.6) clears            | Gated       |

This phase breakdown is a **client-agnostic backend-first sequencing** agreed for this
implementation round — it maps onto the blueprint's own phases (§13.2) but is ordered so every
layer is independently verifiable before the next one depends on it. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the full mapping rationale.

---

## Architecture in one paragraph

There is no custom backend server. Supabase provides Postgres, Auth, Storage, and a Deno-based
Edge Function runtime; the client talks **directly** to Postgres through PostgREST, with every
access governed by Row Level Security rather than hand-written middleware (ADR-001, ADR-006).
Edge Functions exist only for work a client must not be trusted with — anything holding a secret
(the Gemini API key), or enforcing a rule a client could otherwise bypass (AI usage caps, payment
verification). Scheduled work runs inside Postgres via `pg_cron`. No ORM, no repository layer, no
dependency-injection container, and no message queue — each was deliberately left out because the
architecture doesn't need it, not because it was forgotten (see `docs/adr/README.md`).

```
Web/Mobile client ──┬── PostgREST ──→ Postgres (RLS enforces authorization)
                     └── Edge Functions ──→ Gemini / payment providers  (secrets live here)
                                          ↑
                                    pg_cron (scheduled jobs)
```

---

## Requirements

| Tool         | Version               | Why                                                                     |
| ------------ | --------------------- | ----------------------------------------------------------------------- |
| Node.js      | ≥ 20 (24 recommended) | Tooling only — not a runtime dependency of the product                  |
| Docker       | Any current version   | Runs the local Supabase stack (the only place Docker appears — ADR-011) |
| Deno         | Provided via npm      | Edge Function runtime, tests, lint, format                              |
| Supabase CLI | Provided via npm      | Migrations, local stack, type generation                                |
| gitleaks     | Optional, recommended | Local secret scanning; CI runs it regardless                            |

Deno and the Supabase CLI install with `npm ci` — no global installs required.

---

## Getting started

```bash
npm ci
```

```bash
cp .env.example .env
```

Start the local stack once Phase 2+ adds something to run against it:

```bash
npm run db:start
```

Verify tooling now (Phase 1 has no application code yet, so this checks formatting/lint only):

```bash
npx prettier --check . && npx eslint .
```

---

## Commands

| Command                                      | Purpose                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| `npm run format` / `format:check`            | Apply / check formatting across the whole repo                                  |
| `npm run lint` / `lint:fix`                  | Lint (ESLint for tooling, `deno lint` for functions once they exist)            |
| `npm run verify`                             | Full gate: format check, lint, typecheck, test — meaningful from Phase 2 onward |
| `npm run db:start` / `db:stop` / `db:status` | Local Supabase stack lifecycle                                                  |
| `npm run db:reset`                           | Rebuild the local database from migrations                                      |
| `npm run test:db`                            | Run pgTAP tests under `supabase/tests/database/`                                |
| `npm run types:generate`                     | Regenerate TypeScript types from the live schema (ADR-007)                      |
| `npm run functions:serve`                    | Serve Edge Functions locally                                                    |

---

## Security essentials

- **Never** use the service-role client to satisfy a user-facing read — it bypasses RLS, the one
  layer a modified client cannot defeat.
- Secrets live in Supabase Edge Function secrets and GitHub Actions secrets. Never in code, never
  in a committed file. `gitleaks` runs pre-commit and over full history in CI.
- Every authenticated route (once the web client exists) is dynamically rendered with
  `Cache-Control: private, no-store` — never statically cached (ADR-021). This is the single most
  severe hazard the web-first architecture introduces; see the blueprint §4.11 before touching
  rendering configuration.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for commit conventions, the definition of done, and how to
record an architecture decision.
