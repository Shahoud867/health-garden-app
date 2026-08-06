import { assertEquals, assertRejects } from '@std/assert';
import { AppError } from '../_shared/http/errors.ts';
import {
  type AtomicSubmitClient,
  type ProfileLookupClient,
  submitPaymentIntent,
} from './handler.ts';

interface Options {
  /** `null` simulates the atomic RPC finding the caller already at the
   * limit (migration 0014's NULL-means-rate-limited contract). */
  rpcResult?: number | null;
}

interface Calls {
  rpcArgs: Record<string, unknown> | undefined;
}

function fakeUserDb(): ProfileLookupClient {
  return {
    from: (_table: string) => ({
      select: (_columns: string) => Promise.resolve({ data: [{ id: 'user-1' }], error: null }),
    }),
  };
}

function fakeServiceDb(options: Options, calls: Calls): AtomicSubmitClient {
  // `'rpcResult' in options`, not `options.rpcResult ?? 42` -- the whole
  // point of this fake is to distinguish "return null" (rate limited) from
  // "unset" (default to a successful id), and `??` cannot tell an explicit
  // `null` apart from an absent property.
  const data = 'rpcResult' in options ? options.rpcResult! : 42;
  return {
    rpc: (_fn: string, args: Record<string, unknown>) => {
      calls.rpcArgs = args;
      return Promise.resolve({ data, error: null });
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
      const calls: Calls = { rpcArgs: undefined };
      const error = await assertRejects(
        () =>
          submitPaymentIntent({
            userDb: fakeUserDb(),
            serviceDb: fakeServiceDb({}, calls),
            turnstileSecretKey: 'secret',
            fetchImpl: fetchAlwaysFails(),
            body: validBody,
          }),
        AppError,
      );
      assertEquals((error as AppError).code, 'forbidden');
      assertEquals(calls.rpcArgs, undefined);
    },
  );

  await t.step('rejects once the atomic RPC reports the caller is over the limit', async () => {
    const calls: Calls = { rpcArgs: undefined };
    const error = await assertRejects(
      () =>
        submitPaymentIntent({
          userDb: fakeUserDb(),
          serviceDb: fakeServiceDb({ rpcResult: null }, calls),
          turnstileSecretKey: 'secret',
          fetchImpl: fetchAlwaysSucceeds(),
          body: validBody,
        }),
      AppError,
    );
    assertEquals((error as AppError).code, 'rate_limited');
  });

  await t.step(
    'creates a payment_intents row via the atomic RPC when under the limit and Turnstile passes',
    async () => {
      const calls: Calls = { rpcArgs: undefined };
      const result = await submitPaymentIntent({
        userDb: fakeUserDb(),
        serviceDb: fakeServiceDb({ rpcResult: 42 }, calls),
        turnstileSecretKey: 'secret',
        fetchImpl: fetchAlwaysSucceeds(),
        body: validBody,
      });
      assertEquals(result, { intentId: 42, status: 'pending_review' });
      // The check-and-write happens inside one RPC call, not a separate
      // count-then-insert -- this is the whole point of the fix (module doc).
      assertEquals(calls.rpcArgs, {
        p_user_id: 'user-1',
        p_amount_pkr: 500,
        p_method: 'jazzcash_manual',
        p_reference: 'TXN123',
        p_max_pending: 3,
      });
    },
  );
});
