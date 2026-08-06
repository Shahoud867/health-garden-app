# Operations (Phase 8 — Production Readiness)

The observability stack this document sets up is ADR-013's: **Sentry + PostHog + UptimeRobot +
Retool**. Retool is covered by `payments-approve-intent` (ADR-0025) and needs no separate setup
here. The other three are config-gated integrations already built into the code — this document is
the one-time, human-clicking-buttons setup each needs, since none of it is reachable from an
unauthenticated API key a coding session can hold.

None of these three accounts exist yet as of this writing. **Nothing in local dev, CI, or a fresh
deploy requires any of them** — every integration below degrades to a silent no-op without its
credential set, by design (`_shared/observability/sentry.ts`, `_shared/observability/posthog.ts`,
and `/health` itself needs no credential at all). Set each up whenever it's actually wanted, in any
order, at zero risk to anything already running.

---

## UptimeRobot — uptime monitoring

The `/health` endpoint (`supabase/functions/health`, Phase 2) already exists and needs no auth —
it's the reference endpoint precisely so a monitor has something to hit from day one.

**Setup** (uptimerobot.com, free tier is sufficient):

1. Add New Monitor → **HTTP(s)**.
2. URL: `https://<project-ref>.supabase.co/functions/v1/health` (the deployed project's URL, not
   the local `127.0.0.1:54321` one).
3. Monitoring interval: 5 minutes (the free tier's floor; adequate for a pre-launch/low-traffic
   service).
4. Alert contacts: add the founders' emails (and/or a phone number for SMS, if on a paid tier).
5. Expected response: HTTP `200`, body `{"status":"ok"}` — leave keyword monitoring off unless a
   false-positive rate from transient 5xx blips becomes an actual problem; a bare status-code check
   is enough for a two-person team's first monitor.

No code change needed on this repo's side for the setup itself — `/health` is deliberately already
shaped for this (`Blueprint §6.2, §10.2`).

---

## Sentry — error tracking

Wired into the Edge Function kernel already: every 5xx (`_shared/http/endpoint.ts`'s error
boundary) reports automatically once configured, with the exact same PII redaction the logger
applies (`_shared/observability/sentry.ts`). 4xx (expected traffic — a cap hit, a stale client) is
never reported; that would be alert noise, not a fault.

**Setup** (sentry.io, free tier is sufficient at this scale):

1. Create a project — platform "Other" (this isn't a JS/browser SDK integration, just a plain
   `fetch` POST to the ingest API, per ADR-0023's "no dependency where a few fetch calls suffice"
   reasoning, same as Gemini/Turnstile).
2. Project Settings → Client Keys (DSN) → copy the DSN.
3. Set it as `SENTRY_DSN` for each deployed environment: `supabase secrets set SENTRY_DSN=<dsn> --project-ref <ref>`
   (staging and production separately — each Supabase project has its own secret store). **Never**
   commit it to a tracked file; `.env.example` documents the variable, not a real value.
4. Nothing else to configure — the kernel reports every unhandled/5xx error automatically from
   that point on, tagged with the deployment's `APP_ENV` (`local`/`development`/`staging`/`production`).

---

## PostHog — business-event analytics

Deliberately narrow in scope right now: only three backend-observable business events are
captured (`_shared/observability/posthog.ts`) —

| Event                    | Fired from                | When                                            |
| ------------------------ | ------------------------- | ----------------------------------------------- |
| `subscription_activated` | `payments-approve-intent` | An admin approves a payment submission          |
| `ai_plan_generated`      | `ai-plan-generate`        | A diet or workout plan is generated/regenerated |
| `account_deleted`        | `account-delete`          | A user erases their account                     |

Page views, funnels, and session replay — PostHog's larger value — are frontend work that needs the
web client to exist first; adding that scaffolding now would be speculative against a client that
isn't built yet (the same "no placeholder work" reasoning that keeps Phase 7's real payment
gateway deferred, see the README status table).

**Setup** (posthog.com, free tier is sufficient at this scale):

1. Create a project. Note **which region** it's in (US or EU) — this determines the ingest host.
2. Project Settings → copy the **Project API Key**.
3. Set `POSTHOG_API_KEY` (per-environment, via `supabase secrets set`, same as `SENTRY_DSN` above)
   and, if the project is EU-region, `POSTHOG_HOST=https://eu.i.posthog.com` (defaults to the US
   host otherwise).
4. Nothing else to configure — the three events above start flowing the moment the key is set.

---

## Deployment (Supabase + CI/CD)

**Current state: this repository has never been deployed anywhere.** Every phase so far has been
verified against a local Supabase stack (`supabase start`, CI's `database` job) — there is no
staging or production Supabase project yet. This section is the pipeline for when one is created,
not a description of something already running.

### One-time setup, per environment (staging, then production)

1. Create the Supabase project (dashboard) — note the project ref.
2. Link it locally once: `npx supabase link --project-ref <ref>`.
3. Push the schema: `npx supabase db push` — applies every migration in `supabase/migrations/` in
   order, exactly as CI already verifies against a fresh local stack (ADR-012, Infrastructure as
   Code — never a dashboard edit).
4. Push the auth hardening in `config.toml`'s `[auth]`/`[auth.rate_limit]`/`[auth.email]` sections
   (Phase 4 — `minimum_password_length`, rate limits, `enable_confirmations`) with
   `npx supabase config push --project-ref <ref>`, the CLI's own "config as code" mechanism for
   exactly this — the alternative is re-clicking the same settings by hand in the Dashboard per
   environment, which is the dashboard-edit drift ADR-012 exists to prevent, just for auth config
   instead of schema. **Verify afterward, don't just trust the push** — `supabase/cli#3148` is an
   open, confirmed bug where some auth settings (`auth.password_requirements` reported so far)
   silently fail to sync; specifically re-check `enable_confirmations` is `true` in the Dashboard
   (Authentication → Providers → Email) for staging/production, since a silent no-op here would
   leave email verification off in the one place it actually matters — `config.toml` only sets it
   `false` for local convenience.
5. Seed **only** the non-content rows a real environment needs — `app_config`'s real values
   (`edge_functions_base_url` pointed at this project, `gemini_quota_daily_threshold` re-checked
   per the README's note) and the Vault secret `invoke_edge_function()` needs
   (`SELECT vault.create_secret('<this project's own service-role key>', 'service_role_key');`).
   **Never** run `seed.sql` wholesale against a real environment — it also contains local-only
   values (`edge_functions_base_url` pointed at `127.0.0.1`) and the full foods/recipes dataset,
   which a production environment presumably wants sourced from the same migration/seed pipeline
   deliberately, not accidentally re-seeded on every deploy.
6. Deploy Edge Functions: `npx supabase functions deploy` (all of them; add `--no-verify-jwt` only
   for functions whose kernel config already sets `auth: 'none'` — the three cron-triggered ones
   and `health`).
7. Set every secret from `.env.example`'s SECRET-marked rows via `supabase secrets set` — this
   repository's CI already does the equivalent for the local/CI stack
   (`.github/workflows/ci.yml`'s `database` job); a real environment needs the same set done once,
   by a human, since a real Gemini/Turnstile/Sentry/PostHog credential must never sit in a
   committed file or a CI secret meant for a different purpose.
8. Point `app_config.edge_functions_base_url` at this project's real Edge Functions URL
   (`https://<ref>.supabase.co/functions/v1`) and re-run the Vault secret step (4-5 above) with
   this project's own service-role key — `pg_cron`'s three scheduled jobs
   (`0011_cron_jobs.sql`) will not reach a real Edge Function without both.

### What's already automated (CI, not yet CD)

`.github/workflows/ci.yml` verifies every push/PR against a **fresh, disposable** local Supabase
stack — it proves the migrations/functions are correct, but it never touches a real deployed
project (by design: CI has no business holding a production credential). Turning this into genuine
continuous deployment — a `deploy` job that runs `supabase db push` + `functions deploy` against
staging on merge to `main`, and production on a tag/release — is the next real step here, but it
needs a staging Supabase project and its secrets configured in GitHub Actions (Settings → Secrets
and variables → Actions) before it can exist. Scaffolding a deploy workflow against a project that
doesn't exist would be exactly the kind of placeholder this project's own conventions rule out
(CONTRIBUTING.md).
