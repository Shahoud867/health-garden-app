# Architecture Decision Records

ADR-001 through ADR-022 are recorded in Appendix A of
[`Health-Garden-System-Architecture-Blueprint.md`](../../Health-Garden-System-Architecture-Blueprint.md)
(v2.3) and are the architectural baseline for this repository. They are summarised below for
reference; the blueprint remains authoritative. Numbers 017–018 are intentionally unused by the
blueprint — implementation-level ADRs (decisions made during coding that the blueprint sets
direction for but doesn't dictate precisely) are recorded as individual files in this directory
starting at **ADR-0023**, so there is never a numbering collision between the two.

## Baseline (Blueprint Appendix A)

| ADR | Decision                                                                               |
| --- | -------------------------------------------------------------------------------------- |
| 001 | BaaS-first architecture on Supabase                                                    |
| 002 | Garden state as a derived aggregate, never an incremented counter                      |
| 003 | AI limited to server-side Gemini calls behind a hard pre-call quota gate               |
| 004 | Offline-first persistence with idempotent sync via client-generated UUIDs              |
| 005 | `expo-secure-store` for auth tokens — mobile (Track B), reinstated if/when it ships    |
| 006 | Row Level Security as the sole authorization mechanism                                 |
| 007 | No traditional ORM; Supabase-generated TypeScript types                                |
| 008 | Interim manual payment verification bridging the SECP/merchant-account gap             |
| 009 | Weight-trend tracking reinstated as committed MVP scope                                |
| 010 | Config-driven feature flags and thresholds (`app_config`)                              |
| 011 | No Docker/Kubernetes in production; self-hosted Supabase reserved as the exit path     |
| 012 | Supabase CLI migrations as Infrastructure as Code                                      |
| 013 | Sentry + PostHog + UptimeRobot + Retool as the free observability/admin stack          |
| 014 | `pgvector` reserved as the AI-personalisation seed, not adopted at MVP                 |
| 015 | `expo-updates` OTA channel — mobile (Track B), reinstated if/when it ships             |
| 016 | Condition-specific programs (diabetes, PCOS, joint pain) designed now, activated later |
| 019 | Web-first launch; React Native mobile port gated behind production retention data      |
| 020 | httpOnly-cookie session storage via `@supabase/ssr` for the web client                 |
| 021 | Authenticated routes always dynamically rendered, `Cache-Control: private, no-store`   |
| 022 | AI provider abstraction with prompt-injection hardening as a first-class concern       |

## Implementation decisions

| ADR                                              | Decision                                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [0023](0023-declarative-edge-function-kernel.md) | A declarative endpoint factory as the Edge Function kernel                                            |
| [0024](0024-garden-write-protection.md)          | SELECT-only RLS for derived/protected values; all writes via SECURITY DEFINER                         |
| [0025](0025-payments-approve-admin-auth.md)      | Founder-only access via real user JWT + email allowlist, not a roles table                            |
| [0026](0026-garden-mechanic-v2.md)               | Cycle-based growth, event-driven planting, 25-slot board, `permanent_garden` as an append-only ledger |
| [0027](0027-ai-plan-retrieval-grounding.md)      | Retrieval-grounded AI plan generation from real database candidates, not free-text invention          |
