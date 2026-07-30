import { assertEquals, assertRejects } from '@std/assert';
import { AppError } from '../_shared/http/errors.ts';
import { SAFE_FALLBACK_MESSAGE } from '../_shared/ai/output-safety.ts';
import { GeminiRequestError } from '../_shared/ai/gemini-provider.ts';
import type { AiProvider, UserContext, UserProfile } from '../_shared/ai/provider.ts';
import {
  generateWeeklyPlan,
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
}

interface Writes {
  inserted: Record<string, unknown>[];
  updated: { row: Record<string, unknown>; id: unknown }[];
  generateCalled: boolean;
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
              goal: 'weight_loss',
              conditions: null,
              activity_level: 'moderate',
              daily_calorie_target: 1800,
              daily_protein_target_g: 90,
            },
          ],
          error: null,
        }),
    }),
  };
}

function fakeServiceDb(options: Options, writes: Writes): PlanServiceClient {
  return {
    from: (_table: string) => ({
      select: (_columns: string) => ({
        in: (_column: string, _values: readonly string[]) =>
          Promise.resolve({
            data: [
              { key: 'ai_chat_enabled', value: options.aiChatEnabled ?? true },
              { key: 'ai_plan_regenerations_cap', value: options.regenerationsCap ?? 2 },
            ],
            error: null,
          }),
        eq: (_c1: string, _v1: unknown) => ({
          eq: (_c2: string, _v2: unknown) =>
            Promise.resolve({
              data: options.existingPlan ? [options.existingPlan] : [],
              error: null,
            }),
        }),
      }),
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
    rpc: (_fn: 'current_week_start', _args: Record<string, never>) =>
      Promise.resolve({ data: '2026-01-05', error: null }),
  };
}

function fakeProvider(options: Options, writes: Writes): AiProvider {
  return {
    chat: (_message: string, _context: UserContext) => Promise.resolve('unused'),
    generatePlan: (_profile: UserProfile) => {
      writes.generateCalled = true;
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
): Promise<{ result: PlanGenerateResponse; writes: Writes }> {
  const writes: Writes = { inserted: [], updated: [], generateCalled: false };
  const result = await generateWeeklyPlan({
    userDb: fakeUserDb(options),
    serviceDb: fakeServiceDb(options, writes),
    aiProvider: fakeProvider(options, writes),
  });
  return { result, writes };
}

Deno.test('generateWeeklyPlan', async (t) => {
  await t.step('rejects a non-premium user before touching Gemini', async () => {
    const writes: Writes = { inserted: [], updated: [], generateCalled: false };
    const error = await assertRejects(
      () =>
        generateWeeklyPlan({
          userDb: fakeUserDb({ isPremium: false }),
          serviceDb: fakeServiceDb({}, writes),
          aiProvider: fakeProvider({}, writes),
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

  await t.step('generates and inserts a new plan when none exists this week', async () => {
    const { result, writes } = await run({ existingPlan: null });
    assertEquals(result.plan.text, 'Day 1: eat well.');
    assertEquals(writes.inserted.length, 1);
    assertEquals(writes.inserted[0]?.regenerations_used, 0);
    assertEquals(writes.updated.length, 0);
  });

  await t.step('regenerates and updates when under the regeneration cap', async () => {
    const { writes } = await run({
      existingPlan: { id: 7, regenerations_used: 1 },
      regenerationsCap: 2,
    });
    assertEquals(writes.inserted.length, 0);
    assertEquals(writes.updated.length, 1);
    assertEquals(writes.updated[0]?.id, 7);
    const updatedRow = writes.updated[0]?.row as { regenerations_used: number };
    assertEquals(updatedRow.regenerations_used, 2);
  });

  await t.step('rejects once the regeneration cap is reached, without calling Gemini', async () => {
    const writes: Writes = { inserted: [], updated: [], generateCalled: false };
    const error = await assertRejects(
      () =>
        generateWeeklyPlan({
          userDb: fakeUserDb({}),
          serviceDb: fakeServiceDb(
            { existingPlan: { id: 7, regenerations_used: 2 }, regenerationsCap: 2 },
            writes,
          ),
          aiProvider: fakeProvider({}, writes),
        }),
      AppError,
    );
    assertEquals((error as AppError).code, 'already_generated_this_week');
    assertEquals(writes.generateCalled, false);
  });

  await t.step('surfaces upstream_unavailable on a Gemini failure, writing nothing', async () => {
    const writes: Writes = { inserted: [], updated: [], generateCalled: false };
    const error = await assertRejects(
      () =>
        generateWeeklyPlan({
          userDb: fakeUserDb({}),
          serviceDb: fakeServiceDb({ generateThrows: true, existingPlan: null }, writes),
          aiProvider: fakeProvider({ generateThrows: true }, writes),
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
