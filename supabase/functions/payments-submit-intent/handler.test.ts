import { assertEquals, assertRejects } from '@std/assert';
import { AppError } from '../_shared/http/errors.ts';
import { type SubmitIntentClient, submitPaymentIntent } from './handler.ts';

interface Options {
  recentPendingCount?: number;
}

interface Writes {
  inserted: Record<string, unknown>[];
}

type IntentQueryResult = {
  data: readonly Record<string, unknown>[] | null;
  error: { message: string } | null;
};

interface Chain {
  eq(column: string, value: unknown): Chain;
  gte(column: string, value: string): Promise<IntentQueryResult>;
}

function chainablePromise(result: IntentQueryResult): Promise<IntentQueryResult> & Chain {
  const chain: Chain = {
    eq: (_c: string, _v: unknown) => chain,
    gte: (_c: string, _v: string) => Promise.resolve(result),
  };
  return Object.assign(Promise.resolve(result), chain);
}

function fakeUserDb(options: Options, writes: Writes): SubmitIntentClient {
  return {
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: (_columns: string) => chainablePromise({ data: [{ id: 'user-1' }], error: null }),
          insert: (_row: Record<string, unknown>) => ({
            select: (_c: string) => ({
              single: () => Promise.resolve({ data: null, error: { message: 'unused' } }),
            }),
          }),
        };
      }
      // payment_intents
      const pendingRows = Array.from({ length: options.recentPendingCount ?? 0 }, (_, i) => ({
        id: i,
      }));
      return {
        select: (_columns: string) => chainablePromise({ data: pendingRows, error: null }),
        insert: (row: Record<string, unknown>) => {
          writes.inserted.push(row);
          return {
            select: (_c: string) => ({
              single: () => Promise.resolve({ data: { id: 42 }, error: null }),
            }),
          };
        },
      };
    },
  };
}

const validBody = {
  amountPkr: 500,
  method: 'jazzcash_manual' as const,
  reference: 'TXN123',
  turnstileToken: 'a-real-token',
};

function fetchAlwaysSucceeds(): typeof fetch {
  return (() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    })) as unknown as typeof fetch;
}

function fetchAlwaysFails(): typeof fetch {
  return (() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: false, 'error-codes': ['invalid-input-response'] }),
    })) as unknown as typeof fetch;
}

Deno.test('submitPaymentIntent', async (t) => {
  await t.step(
    'rejects when Turnstile verification fails, before touching the database',
    async () => {
      const writes: Writes = { inserted: [] };
      const error = await assertRejects(
        () =>
          submitPaymentIntent({
            userDb: fakeUserDb({}, writes),
            turnstileSecretKey: 'secret',
            fetchImpl: fetchAlwaysFails(),
            body: validBody,
          }),
        AppError,
      );
      assertEquals((error as AppError).code, 'forbidden');
      assertEquals(writes.inserted.length, 0);
    },
  );

  await t.step('rejects once the 24h pending-submission rate limit is hit', async () => {
    const writes: Writes = { inserted: [] };
    const error = await assertRejects(
      () =>
        submitPaymentIntent({
          userDb: fakeUserDb({ recentPendingCount: 3 }, writes),
          turnstileSecretKey: 'secret',
          fetchImpl: fetchAlwaysSucceeds(),
          body: validBody,
        }),
      AppError,
    );
    assertEquals((error as AppError).code, 'rate_limited');
    assertEquals(writes.inserted.length, 0);
  });

  await t.step(
    'creates a payment_intents row when under the rate limit and Turnstile passes',
    async () => {
      const writes: Writes = { inserted: [] };
      const result = await submitPaymentIntent({
        userDb: fakeUserDb({ recentPendingCount: 1 }, writes),
        turnstileSecretKey: 'secret',
        fetchImpl: fetchAlwaysSucceeds(),
        body: validBody,
      });
      assertEquals(result, { intentId: 42, status: 'pending_review' });
      assertEquals(writes.inserted.length, 1);
      assertEquals(writes.inserted[0]?.user_id, 'user-1');
      assertEquals(writes.inserted[0]?.amount_pkr, 500);
    },
  );
});
