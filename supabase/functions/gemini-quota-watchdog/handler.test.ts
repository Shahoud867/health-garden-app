import { assertEquals, assertRejects } from '@std/assert';
import { AppError } from '../_shared/http/errors.ts';
import { type AiConfigClient, checkGeminiQuota, type UsageSumClient } from './handler.ts';

interface Options {
  totalUsageToday?: number;
  currentlyEnabled?: boolean;
}

interface Calls {
  errorLogs: unknown[];
  updates: Record<string, unknown>[];
}

function fakeUsageDb(options: Options): UsageSumClient {
  return {
    rpc: (_fn: 'sum_todays_ai_usage') =>
      Promise.resolve({ data: options.totalUsageToday ?? 0, error: null }),
  };
}

function fakeConfigDb(options: Options, calls: Calls): AiConfigClient {
  return {
    from: (_table: string) => ({
      select: (_columns: string) => ({
        eq: (_column: string, _value: unknown) =>
          Promise.resolve({
            data: [{ value: options.currentlyEnabled ?? true }],
            error: null,
          }),
      }),
      update: (row: Record<string, unknown>) => ({
        eq: (_column: string, _value: unknown) => {
          calls.updates.push(row);
          return Promise.resolve({ error: null });
        },
      }),
    }),
  };
}

function fakeLogger(calls: Calls): { error: (event: string, context: unknown) => void } {
  return {
    error: (_event: string, context: unknown) => {
      calls.errorLogs.push(context);
    },
  };
}

Deno.test('checkGeminiQuota', async (t) => {
  await t.step('does nothing when usage is under the threshold', async () => {
    const calls: Calls = { errorLogs: [], updates: [] };
    const result = await checkGeminiQuota({
      usageDb: fakeUsageDb({ totalUsageToday: 500 }),
      configDb: fakeConfigDb({}, calls),
      logger: fakeLogger(calls),
    });

    assertEquals(result, { totalUsageToday: 500, threshold: 1200, disabledJustNow: false });
    assertEquals(calls.updates.length, 0);
    assertEquals(calls.errorLogs.length, 0);
  });

  await t.step('disables ai_chat_enabled and logs once the threshold is crossed', async () => {
    const calls: Calls = { errorLogs: [], updates: [] };
    const result = await checkGeminiQuota({
      usageDb: fakeUsageDb({ totalUsageToday: 1250 }),
      configDb: fakeConfigDb({ currentlyEnabled: true }, calls),
      logger: fakeLogger(calls),
    });

    assertEquals(result, { totalUsageToday: 1250, threshold: 1200, disabledJustNow: true });
    assertEquals(calls.updates.length, 1);
    assertEquals(calls.updates[0]?.value, false);
    assertEquals(calls.errorLogs.length, 1);
  });

  await t.step('does not re-disable or re-log once already disabled', async () => {
    const calls: Calls = { errorLogs: [], updates: [] };
    const result = await checkGeminiQuota({
      usageDb: fakeUsageDb({ totalUsageToday: 1400 }),
      configDb: fakeConfigDb({ currentlyEnabled: false }, calls),
      logger: fakeLogger(calls),
    });

    assertEquals(result.disabledJustNow, false);
    assertEquals(calls.updates.length, 0);
    assertEquals(calls.errorLogs.length, 0);
  });

  await t.step('surfaces a usage-sum failure as an AppError', async () => {
    const calls: Calls = { errorLogs: [], updates: [] };
    const usageDb: UsageSumClient = {
      rpc: () => Promise.resolve({ data: null, error: { message: 'boom' } }),
    };
    const error = await assertRejects(
      () =>
        checkGeminiQuota({ usageDb, configDb: fakeConfigDb({}, calls), logger: fakeLogger(calls) }),
      AppError,
    );
    assertEquals((error as AppError).code, 'internal_error');
  });
});
