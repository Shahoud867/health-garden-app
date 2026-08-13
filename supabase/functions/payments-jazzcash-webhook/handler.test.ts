import { assertEquals } from '@std/assert';
import type { Logger } from '../_shared/observability/logger.ts';
import type { PostHogClient } from '../_shared/observability/posthog.ts';
import type { SentryReporter } from '../_shared/observability/sentry.ts';
import { processJazzCashCallback, type WebhookDbClient } from './handler.ts';

const SALT = 'saltsalt1234';
const APP_URL = 'https://example.com';

async function signFields(
  fields: Record<string, string>,
  salt: string,
): Promise<Record<string, string>> {
  const order = Object.keys(fields).sort((a, b) => a.localeCompare(b));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(salt),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const message = [salt, ...order.map((k) => fields[k])].join('&');
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const pp_SecureHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return { ...fields, pp_SecureHash };
}

interface TxnFixture {
  id: number;
  user_id: string;
  amount_pkr: number;
  status: string;
}

interface Calls {
  updates: Record<string, unknown>[];
  inserts: { table: string; row: Record<string, unknown> }[];
  analyticsCaptured: { event: string; distinctId: string; properties?: Record<string, unknown> }[];
  sentryCaptured: { error: unknown; context: Record<string, unknown> }[];
}

/** Builds a fake DB that resolves `payment_gateway_transactions` lookups by
 * `txn_ref_no` to a fixed row, and records every update/insert. */
function fakeDbWithLookup(
  txn: TxnFixture | null,
  calls: Calls,
  options: { failInsertTable?: string } = {},
): WebhookDbClient {
  return {
    from: (table: string) => ({
      select: (_columns: string) => ({
        eq: (_column: string, _value: unknown) =>
          Promise.resolve({ data: txn === null ? [] : [txn], error: null }),
      }),
      update: (row: Record<string, unknown>) => ({
        eq: (_column: string, _value: unknown) => {
          calls.updates.push(row);
          if (txn !== null) Object.assign(txn, row);
          return Promise.resolve({ error: null });
        },
      }),
      insert: (row: Record<string, unknown>) => {
        calls.inserts.push({ table, row });
        if (options.failInsertTable === table) {
          return Promise.resolve({ error: { message: `${table} insert failed` } });
        }
        return Promise.resolve({ error: null });
      },
    }),
  } as unknown as WebhookDbClient;
}

function fakeAnalytics(calls: Calls): PostHogClient {
  return {
    capture: (event, distinctId, properties) => {
      calls.analyticsCaptured.push({ event, distinctId, properties });
    },
  };
}

function fakeSentry(calls: Calls): SentryReporter {
  return {
    captureException: (error, context) => {
      calls.sentryCaptured.push({ error, context });
    },
  };
}

function fakeLogger(): Logger {
  const noop = () => {};
  const logger: Logger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    child: () => logger,
  };
  return logger;
}

function newCalls(): Calls {
  return { updates: [], inserts: [], analyticsCaptured: [], sentryCaptured: [] };
}

Deno.test('processJazzCashCallback', async (t) => {
  await t.step('redirects to failure when pp_TxnRefNo is missing', async () => {
    const calls = newCalls();
    const redirectTo = await processJazzCashCallback({
      serviceDb: fakeDbWithLookup(null, calls),
      fields: { pp_ResponseCode: '000' },
      integritySalt: SALT,
      appUrl: APP_URL,
      analytics: fakeAnalytics(calls),
      sentry: fakeSentry(calls),
      logger: fakeLogger(),
    });
    assertEquals(redirectTo, `${APP_URL}/premium?payment=failed`);
    assertEquals(calls.updates.length, 0);
  });

  await t.step('redirects to failure when the txn ref is unknown', async () => {
    const calls = newCalls();
    const redirectTo = await processJazzCashCallback({
      serviceDb: fakeDbWithLookup(null, calls),
      fields: { pp_TxnRefNo: 'T-does-not-exist', pp_ResponseCode: '000' },
      integritySalt: SALT,
      appUrl: APP_URL,
      analytics: fakeAnalytics(calls),
      sentry: fakeSentry(calls),
      logger: fakeLogger(),
    });
    assertEquals(redirectTo, `${APP_URL}/premium?payment=failed`);
  });

  await t.step(
    'replays the stored outcome for an already-resolved transaction (idempotency)',
    async () => {
      const calls = newCalls();
      const completedTxn: TxnFixture = {
        id: 1,
        user_id: 'user-1',
        amount_pkr: 299,
        status: 'completed',
      };
      const redirectTo = await processJazzCashCallback({
        serviceDb: fakeDbWithLookup(completedTxn, calls),
        fields: { pp_TxnRefNo: 'T1', pp_ResponseCode: '000' },
        integritySalt: SALT,
        appUrl: APP_URL,
        analytics: fakeAnalytics(calls),
        sentry: fakeSentry(calls),
        logger: fakeLogger(),
      });
      assertEquals(redirectTo, `${APP_URL}/premium?payment=success`);
      // No re-verification or re-activation work for an already-resolved row.
      assertEquals(calls.updates.length, 0);
      assertEquals(calls.inserts.length, 0);
    },
  );

  await t.step(
    'fails closed on a hash mismatch: verification_failed, no subscription, Sentry alerted',
    async () => {
      const calls = newCalls();
      const txn: TxnFixture = { id: 1, user_id: 'user-1', amount_pkr: 299, status: 'initiated' };
      const redirectTo = await processJazzCashCallback({
        serviceDb: fakeDbWithLookup(txn, calls),
        fields: { pp_TxnRefNo: 'T1', pp_ResponseCode: '000', pp_SecureHash: 'tampered-hash' },
        integritySalt: SALT,
        appUrl: APP_URL,
        analytics: fakeAnalytics(calls),
        sentry: fakeSentry(calls),
        logger: fakeLogger(),
      });
      assertEquals(redirectTo, `${APP_URL}/premium?payment=failed`);
      assertEquals(calls.updates[0]?.status, 'verification_failed');
      assertEquals(calls.inserts.find((i) => i.table === 'subscriptions'), undefined);
      assertEquals(calls.sentryCaptured.length, 1);
    },
  );

  await t.step(
    'a verified decline (valid hash, non-000 code) marks failed, activates nothing',
    async () => {
      const calls = newCalls();
      const txn: TxnFixture = { id: 1, user_id: 'user-1', amount_pkr: 299, status: 'initiated' };
      const fields = await signFields(
        { pp_TxnRefNo: 'T1', pp_ResponseCode: '121', pp_ResponseMessage: 'Declined' },
        SALT,
      );
      const redirectTo = await processJazzCashCallback({
        serviceDb: fakeDbWithLookup(txn, calls),
        fields,
        integritySalt: SALT,
        appUrl: APP_URL,
        analytics: fakeAnalytics(calls),
        sentry: fakeSentry(calls),
        logger: fakeLogger(),
      });
      assertEquals(redirectTo, `${APP_URL}/premium?payment=failed`);
      assertEquals(calls.updates[0]?.status, 'failed');
      assertEquals(calls.inserts.find((i) => i.table === 'subscriptions'), undefined);
    },
  );

  await t.step('a verified success activates a subscription and logs an audit entry', async () => {
    const calls = newCalls();
    const txn: TxnFixture = { id: 1, user_id: 'user-1', amount_pkr: 299, status: 'initiated' };
    const fields = await signFields(
      { pp_TxnRefNo: 'T1', pp_ResponseCode: '000', pp_ResponseMessage: 'Success' },
      SALT,
    );
    const redirectTo = await processJazzCashCallback({
      serviceDb: fakeDbWithLookup(txn, calls),
      fields,
      integritySalt: SALT,
      appUrl: APP_URL,
      analytics: fakeAnalytics(calls),
      sentry: fakeSentry(calls),
      logger: fakeLogger(),
    });

    assertEquals(redirectTo, `${APP_URL}/premium?payment=success`);
    assertEquals(calls.updates[0]?.status, 'completed');

    const subscriptionInsert = calls.inserts.find((i) => i.table === 'subscriptions');
    assertEquals(subscriptionInsert?.row.provider, 'jazzcash');
    assertEquals(subscriptionInsert?.row.status, 'active');
    assertEquals(subscriptionInsert?.row.user_id, 'user-1');
    assertEquals(subscriptionInsert?.row.amount_pkr, 299);

    const auditInsert = calls.inserts.find((i) => i.table === 'audit_log');
    assertEquals(auditInsert?.row.event_type, 'jazzcash_subscription_activated');

    assertEquals(calls.analyticsCaptured[0]?.event, 'subscription_activated');
    assertEquals(calls.analyticsCaptured[0]?.distinctId, 'user-1');
  });

  await t.step(
    'still redirects to success (but alerts Sentry) when the verified payment cannot be recorded as a subscription',
    async () => {
      const calls = newCalls();
      const txn: TxnFixture = { id: 1, user_id: 'user-1', amount_pkr: 299, status: 'initiated' };
      const fields = await signFields({ pp_TxnRefNo: 'T1', pp_ResponseCode: '000' }, SALT);
      const redirectTo = await processJazzCashCallback({
        serviceDb: fakeDbWithLookup(txn, calls, { failInsertTable: 'subscriptions' }),
        fields,
        integritySalt: SALT,
        appUrl: APP_URL,
        analytics: fakeAnalytics(calls),
        sentry: fakeSentry(calls),
        logger: fakeLogger(),
      });

      assertEquals(redirectTo, `${APP_URL}/premium?payment=success`);
      assertEquals(calls.sentryCaptured.length, 1);
      assertEquals(calls.analyticsCaptured.length, 0);
    },
  );
});
