import { assertEquals, assertRejects } from '@std/assert';
import { AppError } from '../_shared/http/errors.ts';
import {
  createJazzCashCheckout,
  type InsertTransactionClient,
  PREMIUM_PRICE_PKR,
  type ProfileLookupClient,
  readJazzCashCredentials,
} from './handler.ts';

const CREDENTIALS = {
  merchantId: 'MC12345',
  password: 'pw12345',
  integritySalt: 'saltsalt1234',
  mode: 'sandbox' as const,
};

function fakeUserDb(profile: { id: string } | null = { id: 'user-1' }): ProfileLookupClient {
  return {
    from: (_table: string) => ({
      select: (_columns: string) =>
        Promise.resolve({ data: profile === null ? [] : [profile], error: null }),
    }),
  };
}

interface Calls {
  insertedRow: Record<string, unknown> | undefined;
}

function fakeServiceDb(calls: Calls): InsertTransactionClient {
  return {
    from: (_table: string) => ({
      insert: (row: Record<string, unknown>) => {
        calls.insertedRow = row;
        return Promise.resolve({ error: null });
      },
    }),
  };
}

Deno.test('readJazzCashCredentials', async (t) => {
  const fullEnv: Record<string, string> = {
    JAZZCASH_MERCHANT_ID: 'MC1',
    JAZZCASH_PASSWORD: 'pw',
    JAZZCASH_INTEGRITY_SALT: 'salt',
    JAZZCASH_MODE: 'sandbox',
    JAZZCASH_RETURN_URL: 'https://example.com/cb',
  };

  await t.step('reads a complete, valid configuration', () => {
    const result = readJazzCashCredentials((key) => fullEnv[key]);
    assertEquals(result.credentials.merchantId, 'MC1');
    assertEquals(result.credentials.mode, 'sandbox');
    assertEquals(result.returnUrl, 'https://example.com/cb');
  });

  await t.step('throws internal when any secret is missing', () => {
    const withoutSalt = { ...fullEnv, JAZZCASH_INTEGRITY_SALT: undefined };
    let thrown: unknown;
    try {
      readJazzCashCredentials((key) => withoutSalt[key as keyof typeof withoutSalt]);
    } catch (error) {
      thrown = error;
    }
    assertEquals(thrown instanceof AppError, true);
    assertEquals((thrown as AppError).code, 'internal_error');
  });

  await t.step('throws internal when JAZZCASH_MODE is neither sandbox nor production', () => {
    const badMode: Record<string, string> = { ...fullEnv, JAZZCASH_MODE: 'live' };
    let thrown: unknown;
    try {
      readJazzCashCredentials((key) => badMode[key]);
    } catch (error) {
      thrown = error;
    }
    assertEquals(thrown instanceof AppError, true);
  });
});

Deno.test('createJazzCashCheckout', async (t) => {
  await t.step('inserts an initiated transaction at the fixed premium price', async () => {
    const calls: Calls = { insertedRow: undefined };
    const result = await createJazzCashCheckout({
      userDb: fakeUserDb(),
      serviceDb: fakeServiceDb(calls),
      credentials: CREDENTIALS,
      returnUrl: 'https://example.com/cb',
    });

    assertEquals(calls.insertedRow?.user_id, 'user-1');
    assertEquals(calls.insertedRow?.provider, 'jazzcash');
    assertEquals(calls.insertedRow?.amount_pkr, PREMIUM_PRICE_PKR);
    assertEquals(calls.insertedRow?.status, 'initiated');
    assertEquals(result.fields.pp_Amount, String(PREMIUM_PRICE_PKR * 100));
    assertEquals(result.checkoutUrl.includes('sandbox'), true);
  });

  await t.step('fails when the caller has no resolvable profile row', async () => {
    const calls: Calls = { insertedRow: undefined };
    const error = await assertRejects(
      () =>
        createJazzCashCheckout({
          userDb: fakeUserDb(null),
          serviceDb: fakeServiceDb(calls),
          credentials: CREDENTIALS,
          returnUrl: 'https://example.com/cb',
        }),
      AppError,
    );
    assertEquals((error as AppError).code, 'internal_error');
    assertEquals(calls.insertedRow, undefined);
  });

  await t.step('the checkout fields carry the same txn ref as the inserted row', async () => {
    const calls: Calls = { insertedRow: undefined };
    const result = await createJazzCashCheckout({
      userDb: fakeUserDb(),
      serviceDb: fakeServiceDb(calls),
      credentials: CREDENTIALS,
      returnUrl: 'https://example.com/cb',
    });
    assertEquals(result.fields.pp_TxnRefNo, calls.insertedRow?.txn_ref_no);
  });
});
