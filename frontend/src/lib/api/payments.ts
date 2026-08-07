import { supabase } from "../supabase"
import { normalizeError } from "../errors"
import { invokeFunction } from "./client"
import type { PaymentMethod, SubscriptionRow } from "../database.types"

/**
 * `/functions/v1/payments-submit-intent` (§6.2, ADR-008) — the interim
 * manual-verification path (real merchant API integration is documented as
 * remaining work in the README, not yet available). Requires a Cloudflare
 * Turnstile token (§7.12) — see `components/Turnstile.tsx`.
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

/** Read-only (§6.1) — `subscriptions` is SELECT-only for the authenticated role (0006_commerce.sql). */
export async function getActiveSubscription(
  userId: string,
): Promise<SubscriptionRow | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle()
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
  const { data, error } = await supabase
    .from("payment_intents")
    .select("id, status, amount_pkr, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw normalizeError(error)
  return data as PaymentIntentStatusRow | null
}
