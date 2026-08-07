import { supabase } from "../supabase"
import { normalizeError } from "../errors"
import { invokeFunction } from "./client"
import { todayLocalDate } from "../date"
import type { PlanType } from "../database.types"

/**
 * Both caps live in `app_config`, which is unreadable by any client — RLS
 * enabled with zero policies, deliberately (migration 0009: "app_config:
 * deliberately zero policies... RLS-default-deny"). These mirror the Edge
 * Functions' own fallback defaults (`configNumber(..., 15)` / `(..., 2)`)
 * for a best-effort progress display only; the real limit is still enforced
 * server-side on every call regardless of what this shows, and a call that
 * hits the true cap surfaces `daily_cap_reached` from `sendChatMessage`/
 * `generateAiPlan` either way.
 */
export const AI_CHAT_DAILY_CAP_DEFAULT = 15
export const AI_PLAN_REGENERATION_CAP_DEFAULT = 2

export async function getTodayAiChatUsage(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("daily_ai_usage")
    .select("message_count")
    .eq("user_id", userId)
    .eq("usage_date", todayLocalDate())
    .maybeSingle()
  if (error) throw normalizeError(error)
  return (data as { message_count: number } | null)?.message_count ?? 0
}

export async function getPlanRegenerationsUsed(
  userId: string,
  planType: PlanType,
  periodStart: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("ai_plans")
    .select("regenerations_used")
    .eq("user_id", userId)
    .eq("plan_type", planType)
    .eq("period_start", periodStart)
    .maybeSingle()
  if (error) throw normalizeError(error)
  return (
    (data as { regenerations_used: number } | null)?.regenerations_used ?? 0
  )
}

/** Most recent stored plan for this user/type, if any (`ai_plans` is SELECT-own via RLS, 0007). */
export async function getLatestAiPlan(
  userId: string,
  planType: PlanType,
): Promise<{ text: string; periodStart: string } | null> {
  const { data, error } = await supabase
    .from("ai_plans")
    .select("plan_content, period_start")
    .eq("user_id", userId)
    .eq("plan_type", planType)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw normalizeError(error)
  if (!data) return null
  const row = data as { plan_content: { text?: string }; period_start: string }
  return { text: row.plan_content?.text ?? "", periodStart: row.period_start }
}

/** `/functions/v1/ai-chat` (§6.2) — `{message}` -> `{reply}`. */
export async function sendChatMessage(message: string): Promise<string> {
  const { reply } = await invokeFunction<{ reply: string }>("ai-chat", {
    message,
  })
  return reply
}

// Matches supabase/functions/_shared/validation/schema.ts's regenerationReasonSchema
// exactly -- diet-plan-only, six fixed chips, never free text (ADR-0027).
export type RegenerationReason = "too_repetitive" | "too_expensive" | "no_time_to_cook" | "want_more_protein" | "too_much_dairy" | "make_it_lighter"

/**
 * `/functions/v1/ai-plan-generate` (§6.2, ADR-0027) — retrieval-grounded:
 * the model can only reference real recipes/exercises already filtered
 * server-side, never invent one. `regenerateReason` is diet-plan-only, one
 * of six fixed chips (never free text — ADR-0027).
 */
export async function generateAiPlan(
  planType: PlanType,
  regenerateReason?: RegenerationReason,
): Promise<string> {
  const { plan } = await invokeFunction<{ plan: { text: string } }>(
    "ai-plan-generate",
    {
      plan_type: planType,
      ...(regenerateReason ? { regenerate_reason: regenerateReason } : {}),
    },
  )
  return plan.text
}
