import { supabase } from "../supabase"
import { normalizeError } from "../errors"
import { invokeFunction } from "./client"
import { withTimeout, QUERY_TIMEOUT_MS } from "../timeout"
import type { PaymentMethod, SubscriptionRow } from "../database.types"

/**
 * `/functions/v1/payments-submit-intent` (§6.2, ADR-008) — the interim
 * manual-verification path. `createJazzCashCheckout` below (ADR-0028) is
 * the real-time alternative for JazzCash; this one remains the fallback for
 * Easypaisa and for a customer JazzCash's hosted checkout doesn't work for.
 * Requires a Cloudflare Turnstile token (§7.12) — see `components/Turnstile.tsx`.
 */
export async function submitPaymentIntent(
  amountPkr: number,
  method: PaymentMethod,
  reference: string,
  turnstileToken: string,
): Promise<{ intentId: number; status: "pending_review" }> {
  return invokeFunction("payments-submit-intent", {
    amountPkr,
    method,
    reference,
    turnstileToken,
  })
}

/** The signed `pp_*` field set `payments-jazzcash-create` returns — every
 * value is a string because these are submitted as a real HTML form POST
 * (JazzCash's hosted checkout expects form-encoded fields, not JSON). */
export type JazzCashCheckoutFields = Record<string, string>

export interface JazzCashCheckoutResponse {
  checkoutUrl: string
  fields: JazzCashCheckoutFields
}

/**
 * `/functions/v1/payments-jazzcash-create` (ADR-0028) — the real-time
 * checkout path. The charge amount is fixed server-side; nothing here can
 * name its own price. Returns a signed field set for `submitJazzCashCheckout`
 * to auto-submit as a hidden form POST to JazzCash's hosted checkout page —
 * this call alone does not charge anything.
 */
export async function createJazzCashCheckout(): Promise<JazzCashCheckoutResponse> {
  return invokeFunction("payments-jazzcash-create")
}

/**
 * Builds and submits a hidden form POST to JazzCash's hosted checkout page —
 * a real full-page navigation away from this app, not a `fetch()`. This is
 * how JazzCash's hosted-checkout mode works: the customer pays on JazzCash's
 * own page, and their browser is later redirected back to `/premium` by
 * `payments-jazzcash-webhook` once JazzCash's callback has been verified
 * (ADR-0028). Nothing runs in this app after `form.submit()` — the tab
 * navigates away.
 */
export function submitJazzCashCheckout(
  checkout: JazzCashCheckoutResponse,
): void {
  const form = document.createElement("form")
  form.method = "POST"
  form.action = checkout.checkoutUrl
  form.style.display = "none"
  for (const [name, value] of Object.entries(checkout.fields)) {
    const input = document.createElement("input")
    input.type = "hidden"
    input.name = name
    input.value = value
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
}

/** Read-only (§6.1) — `subscriptions` is SELECT-only for the authenticated role (0006_commerce.sql). */
export async function getActiveSubscription(
  userId: string,
): Promise<SubscriptionRow | null> {
  const { data, error } = await withTimeout(
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
    QUERY_TIMEOUT_MS,
    "Could not load your subscription — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)
  return data as SubscriptionRow | null
}

export interface PaymentIntentStatusRow {
  id: number
  status: "pending_review" | "approved" | "rejected"
  amount_pkr: number
  created_at: string
}

export async function getLatestPaymentIntent(
  userId: string,
): Promise<PaymentIntentStatusRow | null> {
  const { data, error } = await withTimeout(
    supabase
      .from("payment_intents")
      .select("id, status, amount_pkr, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    QUERY_TIMEOUT_MS,
    "Could not load your payment status — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)
  return data as PaymentIntentStatusRow | null
}
