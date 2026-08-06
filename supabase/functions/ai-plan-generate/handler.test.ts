import { assertEquals, assertRejects } from '@std/assert';
import { AppError } from '../_shared/http/errors.ts';
import { SAFE_FALLBACK_MESSAGE } from '../_shared/ai/output-safety.ts';
import { GeminiRequestError } from '../_shared/ai/gemini-provider.ts';
import type { AiProvider, PlanRequest, UserContext } from '../_shared/ai/provider.ts';
import {
  generateAiPlan,
  type PlanGenerateResponse,
  type PlanServiceClient,
  type PlanUserClient,
} from './handler.ts';

interface Options {
  isPremium?: boolean;
  aiChatEnabled?: boolean;
  regenerationsCap?: number;
  existingPlan?: { id: number; regenerations_used: number } | null;
  planText?: string;
  generateThrows?: boolean;
  periodStart?: string;
}

interface Writes {
  inserted: Record<string, unknown>[];
  updated: { row: Record<string, unknown>; id: unknown }[];
  generateCalled: boolean;
  planRequest?: PlanRequest;
}

function fakeUserDb(options: Options): PlanUserClient {
  return {
    from: (_table: string) => ({
      select: (_columns: string) =>
        Promise.resolve({
          data: [
            {
              id: 'user-1',
              is_premium: options.isPremium ?? true,
              goal: 'lose_weight',
              conditions: null,
              activity_level: 'moderate',
              daily_calorie_target: 1800,
              daily_protein_target_g: 90,
              meals_per_day: 3,
              workout_days_per_week: 3,
              workout_session_minutes: 30,
            },
          ],
          error: null,
        }),
    }),
  };
}

type SelectResult = { data: readonly Record<string, unknown>[] | null; error: null };
type InResult = { data: readonly { key: string; value: unknown }[] | null; error: null };

interface Chain {
  eq(column: string, value: unknown): Promise<SelectResult> & Chain;
  in(column: string, values: readonly string[]): Promise<InResult>;
}

/** One `.select()` chain shape satisfying both the ai_plans `.eq()` path and
 * app_config's `.in()` path -- matches PlanServiceClient's unified
 * SelectChain exactly. `Object.assign` onto a real Promise (rather than a
 * hand-rolled `.then()`) is the same pattern payments-submit-intent's test
 * already uses for the same "awaitable and further chainable" shape. */
function selectChain(
  eqRows: readonly Record<string, unknown>[],
  inRows: readonly { key: string; value: unknown }[],
): Promise<SelectResult> & Chain {
  const chain: Chain = {
    eq: (_column: string, _value: unknown) => selectChain(eqRows, inRows),
    in: (_column: string, _values: readonly string[]) =>
      Promise.resolve({ data: inRows, error: null }),
  };
  return Object.assign(Promise.resolve({ data: eqRows, error: null }), chain);
}

function fakeServiceDb(options: Options, writes: Writes): PlanServiceClient {
  return {
    from: (table: string) => ({
      select: (_columns: string) => {
        if (table === 'app_config') {
          return selectChain([], [
            { key: 'ai_chat_enabled', value: options.aiChatEnabled ?? true },
            { key: 'ai_plan_regenerations_cap', value: options.regenerationsCap ?? 2 },
          ]);
        }
        return selectChain(options.existingPlan ? [options.existingPlan] : [], []);
      },
      insert: (row: Record<string, unknown>) => {
        writes.inserted.push(row);
        return Promise.resolve({ error: null });
      },
      update: (row: Record<string, unknown>) => ({
        eq: (_column: string, id: unknown) => {
          writes.updated.push({ row, id });
          return Promise.resolve({ error: null });
        },
      }),
    }),
    rpc: (fn: string, _args?: Record<string, unknown>) => {
      if (fn === 'current_week_start' || fn === 'current_month_start') {
        return Promise.resolve({ data: options.periodStart ?? '2026-08-03', error: null });
      }
      if (fn === 'candidate_recipes_for_user') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              recipe_name: 'Daal Chawal',
              urdu_name: null,
              calories_per_serving: 400,
              protein_g: 15,
              cost_pkr_per_serving: null,
            },
          ],
          error: null,
        });
      }
      if (fn === 'candidate_exercises_for_user') {
        return Promise.resolve({
          data: [
            {
              id: 7,
              exercise_name: 'Squats',
              urdu_name: null,
              category: 'Legs',
              met_value: 3.8,
              intensity_level: 'Moderate',
            },
          ],
          error: null,
        });
      }
      if (fn === 'recent_activity_summary') {
        return Promise.resolve({
          data: [{ avg_daily_calories: null, workout_days_last_14: null, latest_weight_kg: null }],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    },
  };
}

function fakeProvider(options: Options, writes: Writes): AiProvider {
  return {
    chat: (_message: string, _context: UserContext) => Promise.resolve('unused'),
    generatePlan: (request: PlanRequest) => {
      writes.generateCalled = true;
      writes.planRequest = request;
      if (options.generateThrows) {
        return Promise.reject(new GeminiRequestError('Gemini timed out'));
      }
      return Promise.resolve({
        text: options.planText ?? 'Day 1: eat well.',
        generatedWith: 'test',
      });
    },
  };
}

async function run(
  options: Options,
  planType: 'diet' | 'workout' = 'diet',
  regenerateReason: PlanRequest['adjustmentReason'] = null,
): Promise<{ result: PlanGenerateResponse; writes: Writes }> {
  const writes: Writes = { inserted: [], updated: [], generateCalled: false };
  const result = await generateAiPlan({
    userDb: fakeUserDb(options),
    serviceDb: fakeServiceDb(options, writes),
    aiProvider: fakeProvider(options, writes),
    planType,
    regenerateReason,
  });
  return { result, writes };
}

Deno.test('generateAiPlan', async (t) => {
  await t.step('rejects a non-premium user before touching Gemini', async () => {
    const writes: Writes = { inserted: [], updated: [], generateCalled: false };
    const error = await assertRejects(
      () =>
        generateAiPlan({
          userDb: fakeUserDb({ isPremium: false }),
          serviceDb: fakeServiceDb({}, writes),
          aiProvider: fakeProvider({}, writes),
          planType: 'diet',
          regenerateReason: null,
        }),
      AppError,
    );
    assertEquals((error as AppError).code, 'upgrade_required');
    assertEquals(writes.generateCalled, false);
  });

  await t.step('rejects when the ai_chat_enabled kill switch is off', async () => {
    const error = await assertRejects(
      () => run({ aiChatEnabled: false }).then((r) => r.result),
      AppError,
    );
    assertEquals((error as AppError).code, 'feature_disabled');
  });

  await t.step('rejects a regenerate_reason on a workout plan', async () => {
    const error = await assertRejects(
      () => run({}, 'workout', 'too_repetitive').then((r) => r.result),
      AppError,
    );
    assertEquals((error as AppError).code, 'invalid_payload');
  });

  await t.step('generates and inserts a new diet plan when none exists this period', async () => {
    const { result, writes } = await run({ existingPlan: null }, 'diet');
    assertEquals(result.plan.text, 'Day 1: eat well.');
    assertEquals(writes.inserted.length, 1);
    assertEquals(writes.inserted[0]?.regenerations_used, 0);
    assertEquals(writes.inserted[0]?.plan_type, 'diet');
    assertEquals(writes.inserted[0]?.period_kind, 'week');
    assertEquals(writes.updated.length, 0);
    assertEquals(writes.planRequest?.candidateRecipes.length, 1);
    assertEquals(writes.planRequest?.candidateExercises.length, 0);
  });

  await t.step('generates a workout plan using exercise candidates, not recipes', async () => {
    const { writes } = await run({ existingPlan: null }, 'workout');
    assertEquals(writes.inserted[0]?.plan_type, 'workout');
    assertEquals(writes.inserted[0]?.period_kind, 'month');
    assertEquals(writes.planRequest?.candidateExercises.length, 1);
    assertEquals(writes.planRequest?.candidateRecipes.length, 0);
  });

  await t.step('regenerates and updates when under the regeneration cap', async () => {
    const { writes } = await run(
      { existingPlan: { id: 7, regenerations_used: 1 }, regenerationsCap: 2 },
      'diet',
      'too_repetitive',
    );
    assertEquals(writes.inserted.length, 0);
    assertEquals(writes.updated.length, 1);
    assertEquals(writes.updated[0]?.id, 7);
    const updatedRow = writes.updated[0]?.row as { regenerations_used: number };
    assertEquals(updatedRow.regenerations_used, 2);
    assertEquals(writes.planRequest?.adjustmentReason, 'too_repetitive');
  });

  await t.step('rejects a regenerate_reason when there is no existing plan to adjust', async () => {
    const error = await assertRejects(
      () => run({ existingPlan: null }, 'diet', 'too_repetitive').then((r) => r.result),
      AppError,
    );
    assertEquals((error as AppError).code, 'invalid_payload');
  });

  await t.step('rejects once the regeneration cap is reached, without calling Gemini', async () => {
    const writes: Writes = { inserted: [], updated: [], generateCalled: false };
    const error = await assertRejects(
      () =>
        generateAiPlan({
          userDb: fakeUserDb({}),
          serviceDb: fakeServiceDb(
            { existingPlan: { id: 7, regenerations_used: 2 }, regenerationsCap: 2 },
            writes,
          ),
          aiProvider: fakeProvider({}, writes),
          planType: 'diet',
          regenerateReason: null,
        }),
      AppError,
    );
    assertEquals((error as AppError).code, 'plan_regeneration_cap_reached');
    assertEquals(writes.generateCalled, false);
  });

  await t.step('surfaces upstream_unavailable on a Gemini failure, writing nothing', async () => {
    const writes: Writes = { inserted: [], updated: [], generateCalled: false };
    const error = await assertRejects(
      () =>
        generateAiPlan({
          userDb: fakeUserDb({}),
          serviceDb: fakeServiceDb({ generateThrows: true, existingPlan: null }, writes),
          aiProvider: fakeProvider({ generateThrows: true }, writes),
          planType: 'diet',
          regenerateReason: null,
        }),
      AppError,
    );
    assertEquals((error as AppError).code, 'upstream_unavailable');
    assertEquals(writes.inserted.length, 0);
  });

  await t.step('stores the safe fallback message when generated content is unsafe', async () => {
    const { result } = await run({ existingPlan: null, planText: 'Take 500mg metformin daily.' });
    assertEquals(result.plan.text, SAFE_FALLBACK_MESSAGE);
  });
});
