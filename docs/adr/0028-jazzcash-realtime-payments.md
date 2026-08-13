# ADR-0028 — JazzCash Mobile Wallet as the first real-time payment gateway

**Status:** Accepted
**Date:** 2026-08-13

## Context

`payments-submit-intent`/`payments-approve-intent` (ADR-0025) is an interim manual-review flow —
a user pastes a transaction ID after transferring money by hand to a JazzCash/Easypaisa number,
and a founder eyeballs it before activating a subscription. That table's own doc comment
(migration 0006) names it explicitly as a bridge "until a real merchant API exists." The founders
requested that bridge be replaced urgently, with the explicit constraint that the replacement be
"authentic" — a real, verifiable integration, not a shortcut around it.

That constraint ruled out the fastest options. No legitimate Pakistani payment processor —
JazzCash, Easypaisa, or an aggregator (Simpaisa, RapidGateway) — issues live merchant credentials
without completing real KYC/business verification, which only the founders can complete (it
requires business registration documents, a bank account, and identity verification this
integration cannot substitute for). "Urgent" and "skip verification" are in tension for anything
that moves real money; this ADR is scoped to the part that is legitimately buildable ahead of
that approval — the integration code itself — so the moment real credentials exist, going live is
a `supabase secrets set` away, not another development cycle.

Two shapes of real integration were considered:

1. **A Pakistan-native wallet gateway** (JazzCash/Easypaisa direct, or an aggregator in front of
   both). Settles in PKR, matches the rails the manual flow already asks users to transfer to
   (`subscriptions.provider` already had `'jazzcash'` as a valid value since migration 0006, years
   ahead of this being built), and carries the lowest processing fees (~1.5–2.5%) of any option
   researched. Onboarding requires a registered Pakistani business.
2. **A Merchant-of-Record platform** (Paddle, Lemon Squeezy). Both explicitly support
   Pakistan-domiciled founders, unlike Stripe, and handle global tax/compliance automatically —
   but only for international card payments, not local wallets, at roughly double the processing
   fee (~5%+), and would leave the JazzCash/Easypaisa numbers currently advertised to users
   unusable.

The founders chose option 1 (JazzCash direct) when this trade-off was surfaced.

JazzCash's own public sandbox documentation names every request field (`pp_Version` through
`ppmpf_5`) but does not publish the exact `pp_SecureHash` algorithm. Guessing a hash algorithm for
code that moves real money was rejected outright. Instead, the request-side algorithm was sourced
from `zfhassaan/jazzcash` (MIT-licensed, github.com/zfhassaan/jazzcash), a real, published,
working open-source implementation — not reproduced verbatim, but used to verify the exact fixed
field order and salting scheme (`_shared/payments/jazzcash.ts` documents this in full). No
equivalent verified source was found for the **response**/webhook side; JazzCash's docs describe
the general shape ("fields sorted in ascending alphabetical order") but no real tested
implementation of the response hash was located. That half is flagged explicitly as needing
sandbox confirmation — see Consequences.

## Decision

Add a real-time checkout path alongside the existing manual one, not replacing it yet:

- **New table**, `payment_gateway_transactions` (migration 0015), not an extension of
  `payment_intents` — that table's whole shape (`pending_review`/`approved`/`rejected`, a
  `reviewed_by` founder) models a human judgement call a cryptographically-verified gateway
  transaction never needs. A `verification_failed` status is distinct from `failed`: the latter is
  JazzCash's own decline; the former means the callback's hash didn't match what was computed —
  the system doesn't know if the payment happened, so it never assumes it did.
- **`payments-jazzcash-create`** (authenticated, real Supabase session): derives the charge amount
  from a fixed server-side constant (`PREMIUM_PRICE_PKR = 299`), never from the request body —
  the client cannot name its own price. Signs the checkout fields server-side and returns them for
  the frontend to auto-submit as a hidden form POST to JazzCash's hosted checkout page.
- **`payments-jazzcash-webhook`** (`auth: 'none'`, `verify_jwt = false`): JazzCash's own callback
  target. Has no Supabase session to check — trust rests entirely on `pp_SecureHash`, verified
  before any state changes. On a verified success it activates a subscription using the exact same
  shape `payments-approve-intent` already writes (`provider`, `status: 'active'`,
  `current_period_end` = now + 30 days), so both payment paths converge on one subscription model.
  Every terminal outcome is a real HTTP redirect back into the web app (`/premium?payment=...`),
  not a JSON error body, since the caller here is a customer's browser mid-navigation, not a
  fetch() client.
- **Both handlers read JazzCash's four secrets directly via `Deno.env.get()`**, not through the
  shared `AppConfig` — matching `payments-submit-intent`'s own precedent for `TURNSTILE_SECRET_KEY`:
  most endpoints have no reason to require these at cold start, so only these two functions should
  ever be able to fail to boot over them.
- The manual flow (`payments-submit-intent`/`payments-approve-intent`) is **not removed**. It
  remains the fallback for a customer JazzCash's hosted checkout doesn't work for, and for
  Easypaisa, which has no equivalent real integration yet.

## Consequences

This makes real, automatic activation possible the moment genuine JazzCash merchant credentials
exist — no further engineering work, only configuration. It also means founders no longer need to
manually review every JazzCash payment once credentials are live.

It does not make this production-ready today. Three things must happen before real money should
ever touch this path, and none of them are things this session can do:

1. **Real JazzCash merchant credentials**, obtained by the founders directly through JazzCash's own
   onboarding (business registration + KYC). Nothing in this codebase can substitute for that.
2. **Sandbox validation of the response/webhook hash**, specifically. The request-side hash
   algorithm is sourced from real, tested code; the response side is this codebase's own
   best-evidence reconstruction of the same algorithm applied to JazzCash's documented general rule,
   not verified against a real transaction. `verifyResponseHash`'s own doc comment carries this flag.
   Run one real sandbox transaction and confirm the computed hash matches JazzCash's before trusting
   this in production — if it doesn't, every callback fails closed (no false activations), but real
   payments would also never activate until the field order is corrected.
3. **`JAZZCASH_RETURN_URL`/`PUBLIC_APP_URL` set to this deployment's real, public URLs** — placeholder
   or local values would mean JazzCash's hosted page can never successfully call back.

Easypaisa is out of scope for this round. The manual `easypaisa_manual` path in
`payments-submit-intent` is unaffected and remains the only way to pay via Easypaisa until a
similar real integration is built for it.

## Alternatives considered

- **Simpaisa/RapidGateway (aggregator in front of JazzCash+Easypaisa+cards+Raast).** Would unify
  both wallets and cards behind one integration and one KYC process — a strictly better long-term
  answer than JazzCash direct. Not chosen for this first pass because no equivalent real,
  verifiable open-source reference implementation of its hash/signing scheme was found the way
  `zfhassaan/jazzcash` provided for JazzCash; revisit once Easypaisa support is prioritized.
- **Paddle/Lemon Squeezy (Merchant of Record).** Genuinely simpler compliance story and explicitly
  supports Pakistan-domiciled founders, but only for card payments — it would not serve the wallet
  payments this audience actually uses, and roughly doubles the processing fee. Worth adding later
  as a second, parallel path for card-paying users, not as a JazzCash replacement.
- **Skip verification and fabricate a "good enough" flow.** Rejected outright — see Context. No
  legitimate processor allows it, and building around it would mean either lying to the founders
  about what "authentic" means or building something that cannot legally move money.
