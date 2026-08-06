import { assertEquals, assertRejects } from '@std/assert';
import { AppError } from '../_shared/http/errors.ts';
import { SAFE_FALLBACK_MESSAGE } from '../_shared/ai/output-safety.ts';
import type { AiProvider, PlanRequest, UserContext } from '../_shared/ai/provider.ts';
import {
  type ChatResponse,
  type ChatServiceClient,
  type ChatUserClient,
  handleChatMessage,
} from './handler.ts';

interface Options {
  isPremium?: boolean;
  conditions?: string | null;
  aiChatEnabled?: boolean;
  aiDailyCap?: number;
  usageCountAfterIncrement?: number;
  gardenRows?: readonly {
    goal_type: string;
    plant_type: string;
    current_stage: number;
  }[];
  chatReply?: string;
  chatThrows?: boolean;
}

function fakeUserDb(options: Options): ChatUserClient {
  return {
    from: (table: string) => ({
      select: (_columns: string) => {
        if (table === 'users') {
          return Promise.resolve({
            data: [
              {
                id: 'user-1',
                is_premium: options.isPremium ?? true,
                conditions: options.conditions ?? null,
              },
            ],
            error: null,
          });
        }
        if (table === 'garden_state') {
          return Promise.resolve({ data: options.gardenRows ?? [], error: null });
        }
        return Promise.resolve({ data: [], error: null });
      },
    }),
  };
}

function fakeServiceDb(
  options: Options,
  calls: { incrementCalled: boolean },
): ChatServiceClient {
  return {
    from: (_table: string) => ({
      select: (_columns: string) => ({
        in: (_column: string, _values: readonly string[]) =>
          Promise.resolve({
            data: [
              { key: 'ai_chat_enabled', value: options.aiChatEnabled ?? true },
              { key: 'ai_daily_cap', value: options.aiDailyCap ?? 15 },
            ],
            error: null,
          }),
      }),
    }),
    rpc: (_fn: 'increment_daily_ai_usage', _args: { p_user_id: string }) => {
      calls.incrementCalled = true;
      return Promise.resolve({ data: options.usageCountAfterIncrement ?? 1, error: null });
    },
  };
}

function fakeProvider(options: Options, calls: { chatCalled: boolean }): AiProvider {
  return {
    chat: (_message: string, _context: UserContext) => {
      calls.chatCalled = true;
      if (options.chatThrows) return Promise.reject(new Error('Gemini timed out'));
      return Promise.resolve(options.chatReply ?? 'Here is some encouragement.');
    },
    generatePlan: (_request: PlanRequest) =>
      Promise.resolve({ text: 'unused', generatedWith: 'test' }),
  };
}

async function run(
  options: Options,
): Promise<{ result: ChatResponse; calls: { incrementCalled: boolean; chatCalled: boolean } }> {
  const calls = { incrementCalled: false, chatCalled: false };
  const result = await handleChatMessage({
    userDb: fakeUserDb(options),
    serviceDb: fakeServiceDb(options, calls),
    aiProvider: fakeProvider(options, calls),
    message: 'How am I doing?',
  });
  return { result, calls };
}

Deno.test('handleChatMessage', async (t) => {
  await t.step('rejects a non-premium user before touching Gemini', async () => {
    const calls = { incrementCalled: false, chatCalled: false };
    const error = await assertRejects(
      () =>
        handleChatMessage({
          userDb: fakeUserDb({ isPremium: false }),
          serviceDb: fakeServiceDb({}, calls),
          aiProvider: fakeProvider({}, calls),
          message: 'hi',
        }),
      AppError,
    );
    assertEquals((error as AppError).code, 'upgrade_required');
    assertEquals(calls.incrementCalled, false);
    assertEquals(calls.chatCalled, false);
  });

  await t.step('rejects when the ai_chat_enabled kill switch is off', async () => {
    const calls = { incrementCalled: false, chatCalled: false };
    const error = await assertRejects(
      () =>
        handleChatMessage({
          userDb: fakeUserDb({}),
          serviceDb: fakeServiceDb({ aiChatEnabled: false }, calls),
          aiProvider: fakeProvider({}, calls),
          message: 'hi',
        }),
      AppError,
    );
    assertEquals((error as AppError).code, 'feature_disabled');
    assertEquals(calls.chatCalled, false);
  });

  await t.step('increments usage, then rejects over cap without ever calling Gemini', async () => {
    const calls = { incrementCalled: false, chatCalled: false };
    const error = await assertRejects(
      () =>
        handleChatMessage({
          userDb: fakeUserDb({}),
          serviceDb: fakeServiceDb({ aiDailyCap: 15, usageCountAfterIncrement: 16 }, calls),
          aiProvider: fakeProvider({}, calls),
          message: 'hi',
        }),
      AppError,
    );
    assertEquals((error as AppError).code, 'daily_cap_reached');
    // The cap check happens strictly before the external call (§4.3, ADR-003) --
    // the increment itself already happened (that's the point), but Gemini
    // must never be reached once it's over cap.
    assertEquals(calls.incrementCalled, true);
    assertEquals(calls.chatCalled, false);
  });

  await t.step('returns the reply on a normal successful call', async () => {
    const { result, calls } = await run({ chatReply: 'Great job logging today!' });
    assertEquals(result.reply, 'Great job logging today!');
    assertEquals(calls.incrementCalled, true);
    assertEquals(calls.chatCalled, true);
  });

  await t.step('replaces an unsafe response with the safe fallback message', async () => {
    const { result } = await run({ chatReply: 'Take 500mg of metformin daily.' });
    assertEquals(result.reply, SAFE_FALLBACK_MESSAGE);
  });

  await t.step('degrades to a templated message when Gemini fails, never throwing', async () => {
    const { result } = await run({
      chatThrows: true,
      gardenRows: [{ goal_type: 'hydration', plant_type: 'mint', current_stage: 2 }],
    });
    assertEquals(result.reply.includes('mint'), true);
  });
});
