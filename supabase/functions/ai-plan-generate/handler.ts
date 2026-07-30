/**
 * Weekly AI plan generation (Blueprint §6.2, roadmap §7.3 Feature 2).
 *
 * Naturally low-frequency by design — at most one generation plus a handful
 * of regenerations per user per week, so this does not need the same
 * atomic-RPC treatment `ai-chat`'s per-message cap does (§4.3's concurrency
 * concern is about rapid-fire chat, not a deliberate, once-a-week action).
 * The uniqueness constraint on `ai_plans (user_id, week_start)` is still the
 * backstop: a rare concurrent double-submit wastes at most one extra Gemini
 * call, never corrupts data (one of the two writes loses the race).
 *
 * Unlike `ai-chat`, a Gemini failure here returns `upstream_unavailable`
 * rather than a templated fallback — there is no free-tier equivalent of "a
 * full 7-day plan" to degrade to (§2.13's fallback example is chat-shaped),
 * and a plan-generation click failing with a clear "try again" error is
 * ordinary UX for a deliberate action, not the graceful-degradation problem
 * live chat has.
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
import type { AiProvider } from '../_shared/ai/provider.ts';
import { createGeminiProviderFromEnv, GeminiRequestError } from '../_shared/ai/gemini-provider.ts';
import { checkOutputSafety, SAFE_FALLBACK_MESSAGE } from '../_shared/ai/output-safety.ts';

const bodySchema = z.object({});

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
}

interface ExistingPlanRow {
  readonly id: number;
  readonly regenerations_used: number;
}

/** Same non-overloaded, generic-string shape as every other Phase 4/5
 * handler's fake-injectable client (see ai-chat/handler.ts's ChatUserClient
 * doc comment for why: literal table overloads blow up `deno check` against
 * supabase-js's real generic client types). */
export interface PlanUserClient {
  from(table: string): {
    select(columns: string): PromiseLike<{
      data: readonly Record<string, unknown>[] | null;
      error: { message: string } | null;
    }>;
  };
}

export interface PlanServiceClient extends AppConfigClient {
  from(table: string): {
    select(columns: string): {
      in(
        column: string,
        values: readonly string[],
      ): PromiseLike<{
        data: readonly { key: string; value: unknown }[] | null;
        error: { message: string } | null;
      }>;
      eq(
        column: string,
        value: unknown,
      ): {
        eq(
          column2: string,
          value2: unknown,
        ): PromiseLike<{
          data: readonly Record<string, unknown>[] | null;
          error: { message: string } | null;
        }>;
      };
    };
    insert(row: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
    update(row: Record<string, unknown>): {
      eq(column: string, value: unknown): PromiseLike<{ error: { message: string } | null }>;
    };
  };
  rpc(
    fn: 'current_week_start',
    args: Record<string, never>,
  ): PromiseLike<{ data: string | null; error: { message: string } | null }>;
}

export async function generateWeeklyPlan(deps: {
  readonly userDb: PlanUserClient;
  readonly serviceDb: PlanServiceClient;
  readonly aiProvider: AiProvider;
}): Promise<PlanGenerateResponse> {
  const { userDb, serviceDb, aiProvider } = deps;

  const { data: profileRows, error: profileError } = await userDb
    .from('users')
    .select(
      'id, is_premium, goal, conditions, activity_level, daily_calorie_target, daily_protein_target_g',
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

  const { data: weekStart, error: weekError } = await serviceDb.rpc('current_week_start', {});
  if (weekError !== null || weekStart === null) {
    throw Errors.internal({ details: { step: 'resolve_week_start', message: weekError?.message } });
  }

  const { data: existingRows, error: existingError } = await serviceDb
    .from('ai_plans')
    .select('id, regenerations_used')
    .eq('user_id', profile.id)
    .eq('week_start', weekStart);
  if (existingError !== null) {
    throw Errors.internal({
      details: { step: 'read_existing_plan', message: existingError.message },
    });
  }
  const existing = (existingRows?.[0] as unknown as ExistingPlanRow | undefined) ?? null;

  if (existing !== null && existing.regenerations_used >= regenerationCap) {
    throw Errors.alreadyGeneratedThisWeek();
  }

  let planText: string;
  try {
    const plan = await aiProvider.generatePlan({
      goal: profile.goal,
      conditions: parseConditionsTag(profile.conditions),
      activityLevel: profile.activity_level,
      dailyCalorieTarget: profile.daily_calorie_target,
      dailyProteinTargetG: profile.daily_protein_target_g,
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
      week_start: weekStart,
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
    return generateWeeklyPlan({
      userDb: ctx.auth!.db,
      serviceDb: createServiceRoleClient(ctx.config) as unknown as PlanServiceClient,
      aiProvider: cachedProvider,
    });
  },
});
