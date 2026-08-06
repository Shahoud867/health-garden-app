/**
 * Retrieval-grounded AI plan generation (Blueprint §6.2,
 * docs/adr/0027-ai-plan-retrieval-grounding.md).
 *
 * Two plan types share this endpoint: a weekly diet plan and a monthly
 * workout plan (ai_plans.plan_type/period_kind, migration 0007). Both are
 * naturally low-frequency by design — the uniqueness constraint on
 * `ai_plans (user_id, plan_type, period_start)` is the concurrency backstop,
 * the same reasoning as before this rewrite: a rare concurrent double-submit
 * wastes at most one extra Gemini call, never corrupts data.
 *
 * Retrieval happens before generation: candidate_recipes_for_user /
 * candidate_exercises_for_user (migration 0013) already filtered on this
 * user's conditions, allergies, dislikes, budget, and equipment access — the
 * model is asked to build a plan using only those candidates, referenced by
 * id, never to invent dishes or exercises from its own training data. This
 * is what keeps every suggested item loggable against a real database row.
 *
 * Unlike `ai-chat`, a Gemini failure here returns `upstream_unavailable`
 * rather than a templated fallback — there is no free-tier equivalent of "a
 * full plan" to degrade to, and a plan-generation click failing with a clear
 * "try again" error is ordinary UX for a deliberate action.
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { z } from '../_shared/deps.ts';
import { Errors } from '../_shared/http/errors.ts';
import { createServiceRoleClient } from '../_shared/auth/context.ts';
import {
  type AppConfigClient,
  configBoolean,
  configNumber,
  readAppConfig,
} from '../_shared/config/app-config.ts';
import { parseConditionsTag } from '../_shared/validation/conditions.ts';
import { planTypeSchema, regenerationReasonSchema } from '../_shared/validation/schema.ts';
import type {
  AiProvider,
  ExerciseCandidate,
  PlanType,
  RecipeCandidate,
  RegenerationReason,
} from '../_shared/ai/provider.ts';
import { createGeminiProviderFromEnv, GeminiRequestError } from '../_shared/ai/gemini-provider.ts';
import { checkOutputSafety, SAFE_FALLBACK_MESSAGE } from '../_shared/ai/output-safety.ts';
import { createPostHogClient, type PostHogClient } from '../_shared/observability/posthog.ts';

const bodySchema = z.object({
  plan_type: planTypeSchema,
  regenerate_reason: regenerationReasonSchema.optional(),
});

export interface PlanGenerateResponse {
  readonly plan: { readonly text: string };
}

interface ProfileRow {
  readonly id: string;
  readonly is_premium: boolean;
  readonly goal: string | null;
  readonly conditions: string | null;
  readonly activity_level: string | null;
  readonly daily_calorie_target: number | null;
  readonly daily_protein_target_g: number | null;
  readonly meals_per_day: number;
  readonly workout_days_per_week: number;
  readonly workout_session_minutes: number;
}

interface ExistingPlanRow {
  readonly id: number;
  readonly regenerations_used: number;
}

interface RecipeCandidateRow {
  readonly id: number;
  readonly recipe_name: string;
  readonly urdu_name: string | null;
  readonly calories_per_serving: number | null;
  readonly protein_g: number | null;
  readonly cost_pkr_per_serving: number | null;
}

interface ExerciseCandidateRow {
  readonly id: number;
  readonly exercise_name: string;
  readonly urdu_name: string | null;
  readonly category: string | null;
  readonly met_value: number;
  readonly intensity_level: string | null;
}

interface ActivitySummaryRow {
  readonly avg_daily_calories: number | null;
  readonly workout_days_last_14: number | null;
  readonly latest_weight_kg: number | null;
}

/** Same non-overloaded, generic-string shape as every other Phase 4/5
 * handler's fake-injectable client (see ai-chat/handler.ts's ChatUserClient
 * doc comment for why: literal table overloads blow up `deno check` against
 * supabase-js's own generic query builder). */
export interface PlanUserClient {
  from(table: string): {
    select(columns: string): PromiseLike<{
      data: readonly Record<string, unknown>[] | null;
      error: { message: string } | null;
    }>;
  };
}

/**
 * Chained `.eq()` filters, arbitrarily deep and always awaitable at any
 * point — models the real query builder's shape more closely than a
 * fixed-depth version, since this handler now needs a three-column filter
 * (user_id, plan_type, period_start) where the old weekly-only version only
 * ever needed two.
 *
 * Also carries `.in()`: PlanServiceClient extends AppConfigClient, whose own
 * `from('app_config')` requires `select(columns).in(...)` — redeclaring
 * `from()` below with a table param of `string` (wider than AppConfigClient's
 * literal `'app_config'`) only type-checks as a valid interface extension if
 * this return shape is a superset covering both needs in one place, the same
 * "one unified from(), not colliding overloads" fix already applied to
 * payments-approve-intent's handler.
 */
interface SelectChain extends
  PromiseLike<{
    data: readonly Record<string, unknown>[] | null;
    error: { message: string } | null;
  }> {
  eq(column: string, value: unknown): SelectChain;
  in(
    column: string,
    values: readonly string[],
  ): PromiseLike<{
    data: readonly { key: string; value: unknown }[] | null;
    error: { message: string } | null;
  }>;
}

export interface PlanServiceClient extends AppConfigClient {
  from(table: string): {
    select(columns: string): SelectChain;
    insert(row: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
    update(row: Record<string, unknown>): {
      eq(column: string, value: unknown): PromiseLike<{ error: { message: string } | null }>;
    };
  };
  // A generic `fn: string` signature, not per-call literal overloads: this
  // handler makes five different RPC calls (period resolution, retrieval x2,
  // activity summary) with different shapes, and a literal-overloaded
  // version runs into the same `deno check` "type instantiation is
  // excessively deep" cliff documented on ChatServiceClient -- the fix there
  // was staying generic, applied here for the same reason.
  rpc(
    fn: string,
    args?: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

/** The last day of the calendar month periodStartIso (`YYYY-MM-DD`, the 1st
 * of that month) falls in. The extracted month number is already
 * 1-indexed, which happens to equal JS Date's 0-indexed *next* month --
 * `Date.UTC(year, month, 0)` reads as "day 0 of that next month", i.e. the
 * last day of the month just ended. Not a coincidence to "simplify" away. */
function daysInMonth(periodStartIso: string): number {
  const [year, month] = periodStartIso.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * The plan-generation core, factored out for the same reason every other
 * Phase 4/5/6 handler factors its core out: resolving a real session needs a
 * live Supabase Auth server a Deno unit test does not have.
 */
export async function generateAiPlan(deps: {
  readonly userDb: PlanUserClient;
  readonly serviceDb: PlanServiceClient;
  readonly aiProvider: AiProvider;
  readonly planType: PlanType;
  readonly regenerateReason: RegenerationReason | null;
  readonly analytics: PostHogClient;
}): Promise<PlanGenerateResponse> {
  const { userDb, serviceDb, aiProvider, planType, regenerateReason, analytics } = deps;

  // Adjustment chips are scoped to the diet-plan regeneration action (§6 of
  // the source proposal names it "Adjust this week's plan", diet-specific) --
  // reject rather than silently ignore a mismatched request.
  if (regenerateReason !== null && planType !== 'diet') {
    throw Errors.invalidPayload({
      details: { step: 'validate_regenerate_reason' },
      userMessage: 'Adjustment reasons are only available for meal plans right now.',
    });
  }

  const { data: profileRows, error: profileError } = await userDb
    .from('users')
    .select(
      'id, is_premium, goal, conditions, activity_level, daily_calorie_target, daily_protein_target_g, meals_per_day, workout_days_per_week, workout_session_minutes',
    );
  const profile = (profileRows?.[0] as unknown as ProfileRow | undefined) ?? null;
  if (profileError !== null || profile === null) {
    throw Errors.internal({ details: { step: 'resolve_profile', message: profileError?.message } });
  }
  if (!profile.is_premium) {
    throw Errors.upgradeRequired();
  }

  const config = await readAppConfig(serviceDb, ['ai_chat_enabled', 'ai_plan_regenerations_cap']);
  if (!configBoolean(config, 'ai_chat_enabled', true)) {
    throw Errors.featureDisabled();
  }
  const regenerationCap = configNumber(config, 'ai_plan_regenerations_cap', 2);

  const periodFn = planType === 'diet' ? 'current_week_start' : 'current_month_start';
  const { data: periodStartRaw, error: periodError } = await serviceDb.rpc(periodFn, {});
  const periodStart = periodStartRaw as string | null;
  if (periodError !== null || periodStart === null) {
    throw Errors.internal({
      details: { step: 'resolve_period_start', message: periodError?.message },
    });
  }
  const periodDays = planType === 'diet' ? 7 : daysInMonth(periodStart);

  const { data: existingRows, error: existingError } = await serviceDb
    .from('ai_plans')
    .select('id, regenerations_used')
    .eq('user_id', profile.id)
    .eq('plan_type', planType)
    .eq('period_start', periodStart);
  if (existingError !== null) {
    throw Errors.internal({
      details: { step: 'read_existing_plan', message: existingError.message },
    });
  }
  const existing = (existingRows?.[0] as unknown as ExistingPlanRow | undefined) ?? null;

  if (existing !== null && existing.regenerations_used >= regenerationCap) {
    throw Errors.planRegenerationCapReached();
  }
  if (regenerateReason !== null && existing === null) {
    throw Errors.invalidPayload({
      details: { step: 'validate_regenerate_reason' },
      userMessage: 'There is no plan yet to adjust — generate one first.',
    });
  }

  // Retrieval: only fetch the candidate set the chosen plan type needs.
  let candidateRecipes: readonly RecipeCandidate[] = [];
  let candidateExercises: readonly ExerciseCandidate[] = [];
  if (planType === 'diet') {
    const { data, error } = await serviceDb.rpc('candidate_recipes_for_user', {
      p_user_id: profile.id,
    });
    if (error !== null) {
      throw Errors.internal({ details: { step: 'candidate_recipes', message: error.message } });
    }
    candidateRecipes = ((data ?? []) as unknown as readonly RecipeCandidateRow[]).map((r) => ({
      id: r.id,
      name: r.recipe_name,
      urduName: r.urdu_name,
      calories: r.calories_per_serving,
      proteinG: r.protein_g,
      costPkr: r.cost_pkr_per_serving,
    }));
  } else {
    const { data, error } = await serviceDb.rpc('candidate_exercises_for_user', {
      p_user_id: profile.id,
    });
    if (error !== null) {
      throw Errors.internal({ details: { step: 'candidate_exercises', message: error.message } });
    }
    candidateExercises = ((data ?? []) as unknown as readonly ExerciseCandidateRow[]).map((e) => ({
      id: e.id,
      name: e.exercise_name,
      urduName: e.urdu_name,
      category: e.category,
      metValue: e.met_value,
      intensityLevel: e.intensity_level,
    }));
  }

  const { data: activityData, error: activityError } = await serviceDb.rpc(
    'recent_activity_summary',
    {
      p_user_id: profile.id,
    },
  );
  if (activityError !== null) {
    throw Errors.internal({ details: { step: 'recent_activity', message: activityError.message } });
  }
  const activityRow =
    ((activityData as unknown as readonly ActivitySummaryRow[] | null) ?? [])[0] ??
      null;

  let planText: string;
  try {
    const plan = await aiProvider.generatePlan({
      planType,
      periodDays,
      goal: profile.goal,
      conditions: parseConditionsTag(profile.conditions),
      activityLevel: profile.activity_level,
      dailyCalorieTarget: profile.daily_calorie_target,
      dailyProteinTargetG: profile.daily_protein_target_g,
      mealsPerDay: profile.meals_per_day,
      workoutDaysPerWeek: profile.workout_days_per_week,
      workoutSessionMinutes: profile.workout_session_minutes,
      recentActivity: {
        avgDailyCalories: activityRow?.avg_daily_calories ?? null,
        workoutDaysLast14: activityRow?.workout_days_last_14 ?? null,
        latestWeightKg: activityRow?.latest_weight_kg ?? null,
      },
      candidateRecipes,
      candidateExercises,
      adjustmentReason: regenerateReason,
    });
    const safety = checkOutputSafety(plan.text);
    planText = safety.safe ? plan.text : SAFE_FALLBACK_MESSAGE;
  } catch (cause) {
    if (cause instanceof GeminiRequestError) {
      throw Errors.upstreamUnavailable({ details: { message: cause.message } });
    }
    throw cause;
  }

  if (existing === null) {
    const { error: insertError } = await serviceDb.from('ai_plans').insert({
      user_id: profile.id,
      plan_type: planType,
      period_start: periodStart,
      period_kind: planType === 'diet' ? 'week' : 'month',
      regenerations_used: 0,
      plan_content: { text: planText },
    });
    if (insertError !== null) {
      throw Errors.internal({ details: { step: 'insert_plan', message: insertError.message } });
    }
  } else {
    const { error: updateError } = await serviceDb
      .from('ai_plans')
      .update({
        plan_content: { text: planText },
        regenerations_used: existing.regenerations_used + 1,
      })
      .eq('id', existing.id);
    if (updateError !== null) {
      throw Errors.internal({ details: { step: 'update_plan', message: updateError.message } });
    }
  }

  // Fire-and-forget, only once the write it describes has actually
  // succeeded (same reasoning as payments-approve-intent's analytics call).
  analytics.capture('ai_plan_generated', profile.id, {
    plan_type: planType,
    is_regeneration: existing !== null,
  });

  return { plan: { text: planText } };
}

let cachedProvider: AiProvider | undefined;

export const handleAiPlanGenerate = defineEndpoint<
  z.infer<typeof bodySchema>,
  PlanGenerateResponse
>({
  name: 'ai-plan-generate',
  methods: ['POST'],
  auth: 'required',
  bodySchema,
  handler: (ctx) => {
    cachedProvider ??= createGeminiProviderFromEnv();
    return generateAiPlan({
      userDb: ctx.auth!.db,
      serviceDb: createServiceRoleClient(ctx.config) as unknown as PlanServiceClient,
      aiProvider: cachedProvider,
      planType: ctx.body.plan_type,
      regenerateReason: ctx.body.regenerate_reason ?? null,
      analytics: createPostHogClient(ctx.config.posthogApiKey, { host: ctx.config.posthogHost }),
    });
  },
});
