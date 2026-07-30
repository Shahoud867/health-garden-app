import { assertEquals, assertRejects } from '@std/assert';
import { AppError } from '../_shared/http/errors.ts';
import { reconcileStalePaymentIntents, type StaleIntentsClient } from './handler.ts';

interface Calls {
  warnings: unknown[];
  ltCutoffs: string[];
}

function fakeServiceDb(
  rows: readonly Record<string, unknown>[],
  calls: Calls,
): StaleIntentsClient {
  return {
    from: (_table: string) => ({
      select: (_columns: string) => ({
        eq: (_column: string, _value: unknown) => ({
          lt: (_column2: string, value2: string) => {
            calls.ltCutoffs.push(value2);
            return Promise.resolve({ data: rows, error: null });
          },
        }),
      }),
    }),
  };
}

function fakeLogger(calls: Calls): { warn: (event: string, context: unknown) => void } {
  return {
    warn: (_event: string, context: unknown) => {
      calls.warnings.push(context);
    },
  };
}

Deno.test('reconcileStalePaymentIntents', async (t) => {
  await t.step('logs each stale intent and returns the count', async () => {
    const calls: Calls = { warnings: [], ltCutoffs: [] };
    const staleRows = [
      { id: 1, user_id: 'user-1', amount_pkr: 500, created_at: '2026-01-01T00:00:00Z' },
      { id: 2, user_id: 'user-2', amount_pkr: 1000, created_at: '2026-01-02T00:00:00Z' },
    ];

    const result = await reconcileStalePaymentIntents({
      serviceDb: fakeServiceDb(staleRows, calls),
      logger: fakeLogger(calls),
    });

    assertEquals(result, { staleCount: 2 });
    assertEquals(calls.warnings.length, 2);
  });

  await t.step('is a no-op when nothing is stale', async () => {
    const calls: Calls = { warnings: [], ltCutoffs: [] };
    const result = await reconcileStalePaymentIntents({
      serviceDb: fakeServiceDb([], calls),
      logger: fakeLogger(calls),
    });

    assertEquals(result, { staleCount: 0 });
    assertEquals(calls.warnings.length, 0);
  });

  await t.step('queries with a 48h-ago cutoff relative to the injected clock', async () => {
    const calls: Calls = { warnings: [], ltCutoffs: [] };
    const now = new Date('2026-03-10T12:00:00.000Z');

    await reconcileStalePaymentIntents({
      serviceDb: fakeServiceDb([], calls),
      logger: fakeLogger(calls),
      now,
    });

    assertEquals(calls.ltCutoffs, ['2026-03-08T12:00:00.000Z']);
  });

  await t.step('surfaces a query failure as an AppError', async () => {
    const serviceDb: StaleIntentsClient = {
      from: (_table: string) => ({
        select: (_columns: string) => ({
          eq: (_column: string, _value: unknown) => ({
            lt: (_column2: string, _value2: string) =>
              Promise.resolve({ data: null, error: { message: 'boom' } }),
          }),
        }),
      }),
    };
    const calls: Calls = { warnings: [], ltCutoffs: [] };
    const error = await assertRejects(
      () => reconcileStalePaymentIntents({ serviceDb, logger: fakeLogger(calls) }),
      AppError,
    );
    assertEquals((error as AppError).code, 'internal_error');
  });
});
