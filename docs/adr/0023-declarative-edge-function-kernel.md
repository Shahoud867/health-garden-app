# ADR-0023 — A declarative endpoint factory as the Edge Function kernel

**Status:** Accepted
**Date:** 2026-07-29

## Context

The blueprint establishes _that_ Edge Functions carry all secret-holding and tamper-sensitive
logic (ADR-001, §2.3), but not _how_ they are structured internally. Left unspecified, each
function would independently re-implement correlation ids, logging, error shaping, CORS,
validation, and auth resolution — and they would drift, because there would be no single place
that defines them.

Three constraints shape the answer:

1. The `{ error, message }` envelope (§6.5) and structured logging (§10.1) are contracts, not
   conventions. A function that quietly returns a bare 500 breaks client error handling.
2. Ordering of cross-cutting checks is a security property. Method and credential rejection must
   happen before request-body parsing, so unauthenticated callers never reach the parser.
3. The maintainers are two part-time, non-specialist engineers (NFR-7). Machinery they cannot
   read is machinery they will work around.

## Decision

Cross-cutting concerns live in a single kernel at `supabase/functions/_shared/`, exposed through
one declarative factory:

```ts
defineEndpoint({ name, methods, auth, bodySchema, handler });
```

The factory applies, in fixed order: CORS preflight → correlation id → configuration and logger
construction → API version gate → method gate → auth resolution → body validation → handler, all
inside an error boundary that normalises any throw into a typed `AppError`.

Each function is split into `handler.ts` (logic, importable) and `index.ts` (calls `Deno.serve`,
nothing else), so handlers are testable without binding a port.

Every response defaults to `Cache-Control: private, no-store` (Blueprint §4.11, ADR-021) — this
is not a kernel-specific choice so much as the kernel being the one place that guarantee is
easiest to enforce for every Edge Function response, alongside the equivalent rule the web
client's own routing layer enforces for page responses.

## Consequences

**Makes easy.** A new endpoint is a configuration object and a function body; it inherits every
guarantee automatically. Cross-cutting behaviour changes in one file and applies everywhere.
Handlers are plain functions over a context, so unit tests need no HTTP server.

**Makes hard.** Per-endpoint deviation from the pipeline is deliberately awkward. An endpoint
needing a genuinely different order must extend the kernel rather than opt out — acceptable, since
that pressure is what keeps the guarantees real.

**Cost.** One indirection between a request and a handler. The factory is roughly 150 lines and
must be understood before debugging an unfamiliar failure.

**Rules out.** Per-function middleware composition. Adding it later is possible but would
reintroduce the type complexity rejected below.

## Alternatives considered

**Chained middleware (`(next) => (ctx) => Response`).** More flexible and familiar from Express.
Rejected because expressing "this middleware adds `auth` to the context" in TypeScript requires
generic accumulation whose compiler errors are notoriously difficult to read — a poor trade
against constraint 3.

**No kernel; a shared helper library each function calls manually.** Simplest to understand, but
makes every guarantee opt-in. A function that forgets to call the error wrapper returns an
unenveloped 500, and nothing catches it. Guarantees that depend on remembering are not guarantees.

**A full framework (Hono, Oak).** Well-built and would work. Rejected as unjustified surface area:
the routing, static file serving, and template rendering they provide are unused here, since
Supabase already routes one function per path. It would also add a dependency on the hot path of
every request for no capability the ~150-line kernel does not already supply — the same reasoning
that ruled out a traditional backend framework more broadly for this project.
