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

| Phase                                     | Scope                                                           | State       |
| ----------------------------------------- | --------------------------------------------------------------- | ----------- |
| **1 — Project Foundation**                | Repo, tooling, git hooks, CI skeleton, docs                     | ✅ Complete |
| **2 — Core Infrastructure**               | Edge Function kernel (42 tests), `/health` endpoint             | ✅ Complete |
| **3 — Database Layer**                    | Schema (22 tables), RLS, garden engine, seed data               | ✅ Complete |
| **4 — Auth & Security (backend portion)** | Auth config hardening, account export/delete, Turnstile utility | ✅ Complete |
| 5 — Core Business Logic                   | `ai-chat`, `ai-plan-generate`, `payments-*` Edge Functions      | ⏳ Next     |
| 6 — Background Processing                 | `pg_cron` jobs (garden reset, watchdogs, reconciliation)        | ⏳ Planned  |
| 7 — External Integrations                 | Gemini (via provider abstraction), Web Push, payment providers  | ⏳ Planned  |
| 8 — Production Readiness                  | Monitoring, CI/CD hardening, deployment                         | ⏳ Planned  |
| _(then, frontend)_ Next.js web client     | Only begins once the backend above is complete                  | ⏳ Planned  |
| _(conditional)_ React Native mobile port  | Only if the retention gate (Blueprint §13.6) clears             | Gated       |

This phase breakdown is a **client-agnostic backend-first sequencing** agreed for this
implementation round — it maps onto the blueprint's own phases (§13.2) but is ordered so every
layer is independently verifiable before the next one depends on it. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the full mapping rationale.

**Phase 4 is a split, not a full "Auth & Security."** Session cookies (ADR-020), the security-headers
middleware (§7.11), and CSRF/XSS mitigations (§7.6) are Next.js middleware by definition (the
blueprint says so explicitly) — there is no way to build them before the web client exists without
jumping ahead of backend-first. What's genuinely backend — Turnstile's server-side verification
call, account export/deletion (§7.9), and Supabase Auth's own rate-limit/password-policy config —
is built now; the rest is deferred to the web client phase, tracked there, not silently dropped.

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

Run the kernel's test suite (no Supabase stack needed for this one):

```bash
npm run verify
```

Start the local stack — needed for the database test suite, and for anything touching a table:

```bash
npm run db:start
```

Populate `.env` with the values `supabase status` just printed, then run the database suite:

```bash
npm run test:db
```

---

## Commands

| Command                                      | Purpose                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| `npm run format` / `format:check`            | Apply / check formatting across the whole repo                                  |
| `npm run lint` / `lint:fix`                  | Lint (ESLint for tooling, `deno lint` for functions once they exist)            |
| `npm run verify`                             | Full gate: format check, lint, typecheck, test — meaningful from Phase 2 onward |
| `npm run db:start` / `db:stop` / `db:status` | Local Supabase stack lifecycle                                                  |
| `npm run db:reset`                           | Rebuild the local database from migrations + `seed.sql`                         |
| `npm run db:lint`                            | Lint the schema itself (`supabase db lint`)                                     |
| `npm run test:db`                            | Vitest suite under `supabase/tests/database/` — needs the local stack running   |
| `npm run types:generate`                     | Regenerate TypeScript types from the live schema (ADR-007)                      |
| `npm run functions:serve`                    | Serve Edge Functions locally                                                    |
| `npm test` / `test:watch` / `test:coverage`  | Edge Function unit tests (Deno test runner)                                     |
| `npm run typecheck`                          | `deno check` (Edge Functions) + `tsc --noEmit` (Node-side: the database suite)  |

---

## Repository layout

```
supabase/
  config.toml            Local stack definition — infrastructure as code (ADR-012)
  migrations/             Numbered SQL, applied in order (§5.9) — schema, RLS, functions, triggers
  seed.sql                Bootstrap/dev data, applied after migrations by db:reset / db:start
  tests/database/         Vitest suite against a live local stack (§13.5) — see helpers.ts
  functions/
    _shared/              The kernel — every function composes from here
      config/env.ts         Validated configuration, fails fast at cold start
      observability/        Structured logging with PII redaction (§7.9)
      http/                  Error taxonomy, response envelope, CORS, endpoint factory
      auth/                  JWT resolution and RLS-scoped client construction
      validation/            Shared zod schemas mirroring database constraints
      security/              Turnstile verification (§7.12) — not wired in until Phase 5
      deps.ts                Single point of external dependency control
      version.ts             API contract versioning (§6.1)
    health/                Reference endpoint — liveness probe (§6.2, §10.2)
      handler.ts             Logic, importable by tests
      index.ts               Runtime entrypoint; contains nothing else
    account-export/        Right-to-access data export (§7.9)
    account-delete/         Right-to-erasure account deletion (§7.9)
docs/adr/                 Architecture Decision Records
.github/workflows/        CI pipeline
```

### Writing a new Edge Function

Every function follows the same two-file split, so handlers stay testable without binding a port:

```ts
// supabase/functions/<name>/handler.ts
import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { z } from '../_shared/deps.ts';

export const handleThing = defineEndpoint({
  name: 'thing',
  methods: ['POST'],
  auth: 'required',
  bodySchema: z.object({ value: z.string().min(1) }),
  handler: async (ctx) => {
    // ctx.auth.db is scoped to the caller — RLS applies to every query.
    return { ok: true };
  },
});
```

```ts
// supabase/functions/<name>/index.ts
import { handleThing } from './handler.ts';
Deno.serve(handleThing);
```

The kernel supplies correlation ids, structured logging, the `{ error, message }` envelope,
validation, CORS, method gating, auth resolution, and `Cache-Control: private, no-store` on every
response. A handler that builds a bare `Response` or throws an untyped error bypasses those
guarantees and should be treated as a defect.

Register the function's JWT policy in `supabase/config.toml` — omit it and it defaults to
requiring a JWT, which is the safe direction to fail.

---

## Security essentials

- **Never** use the service-role client to satisfy a user-facing read — it bypasses RLS, the one
  layer a modified client cannot defeat.
- Secrets live in Supabase Edge Function secrets and GitHub Actions secrets. Never in code, never
  in a committed file. `gitleaks` runs pre-commit and over full history in CI.
- Every Edge Function response defaults to `Cache-Control: private, no-store` (see
  `_shared/http/response.ts`) — half of the rendering/caching-safety rule (ADR-021); the other
  half is enforced in the Next.js route-rendering config once the web client exists. This is the
  single most severe hazard the web-first architecture introduces; see the blueprint §4.11 before
  touching either half.
- Derived/protected values (`garden_state`, `permanent_garden`, `subscriptions`, `users.is_premium`,
  AI usage/plans) are never client-writable, even to the owning user's own row — RLS grants
  `SELECT` only, and every write goes through a `SECURITY DEFINER` function (ADR-0024). Adding a
  client-facing write path to any of these is a defect, not a feature — see
  `docs/adr/0024-garden-write-protection.md` before changing one.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for commit conventions, the definition of done, and how to
record an architecture decision.
