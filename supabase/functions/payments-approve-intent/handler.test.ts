import { assertEquals, assertRejects } from '@std/assert';
import { AppError } from '../_shared/http/errors.ts';
import { type ApproveIntentClient, approvePaymentIntent, isAdminEmail } from './handler.ts';

Deno.test('isAdminEmail', async (t) => {
  await t.step('matches an email in the allowlist case-insensitively', () => {
    assertEquals(
      isAdminEmail('Founder@Example.com', 'founder@example.com,other@example.com'),
      true,
    );
  });

  await t.step('rejects an email not in the allowlist', () => {
    assertEquals(isAdminEmail('stranger@example.com', 'founder@example.com'), false);
  });

  await t.step('rejects when the allowlist is unset', () => {
    assertEquals(isAdminEmail('founder@example.com', undefined), false);
  });

  await t.step('rejects a null/empty caller email', () => {
    assertEquals(isAdminEmail(null, 'founder@example.com'), false);
    assertEquals(isAdminEmail('', 'founder@example.com'), false);
  });
});

interface Options {
  intent?: { id: number; user_id: string; amount_pkr: number; status: string } | null;
}

interface Writes {
  intentUpdates: Record<string, unknown>[];
  subscriptionInserts: Record<string, unknown>[];
  auditInserts: Record<string, unknown>[];
}

function fakeServiceDb(options: Options, writes: Writes): ApproveIntentClient {
  return {
    from: (table: string) => ({
      select: (_columns: string) => ({
        eq: (_column: string, _value: unknown) =>
          Promise.resolve({
            data: (table === 'payment_intents' && options.intent
              ? [options.intent]
              : []) as readonly Record<string, unknown>[],
            error: null,
          }),
      }),
      update: (row: Record<string, unknown>) => ({
        eq: (_column: string, _value: unknown) => {
          writes.intentUpdates.push(row);
          return Promise.resolve({ error: null });
        },
      }),
      insert: (row: Record<string, unknown>) => {
        if (table === 'subscriptions') writes.subscriptionInserts.push(row);
        if (table === 'audit_log') writes.auditInserts.push(row);
        return Promise.resolve({ error: null });
      },
    }),
  };
}

const defaultIntent = { id: 1, user_id: 'user-1', amount_pkr: 500, status: 'pending_review' };

Deno.test('approvePaymentIntent', async (t) => {
  await t.step(
    'approving activates a subscription and syncs is_premium via the DB trigger',
    async () => {
      const writes: Writes = { intentUpdates: [], subscriptionInserts: [], auditInserts: [] };
      const result = await approvePaymentIntent({
        serviceDb: fakeServiceDb({ intent: defaultIntent }, writes),
        reviewerUserId: 'admin-1',
        intentId: 1,
        decision: 'approved',
      });

      assertEquals(result, { status: 'approved' });
      assertEquals(writes.intentUpdates[0]?.status, 'approved');
      assertEquals(writes.intentUpdates[0]?.reviewed_by, 'admin-1');
      assertEquals(writes.subscriptionInserts.length, 1);
      assertEquals(writes.subscriptionInserts[0]?.user_id, 'user-1');
      assertEquals(writes.subscriptionInserts[0]?.amount_pkr, 500);
      assertEquals(writes.subscriptionInserts[0]?.status, 'active');
      assertEquals(writes.auditInserts[0]?.event_type, 'payment_intent_approved');
    },
  );

  await t.step('rejecting never creates a subscription', async () => {
    const writes: Writes = { intentUpdates: [], subscriptionInserts: [], auditInserts: [] };
    const result = await approvePaymentIntent({
      serviceDb: fakeServiceDb({ intent: defaultIntent }, writes),
      reviewerUserId: 'admin-1',
      intentId: 1,
      decision: 'rejected',
    });

    assertEquals(result, { status: 'rejected' });
    assertEquals(writes.intentUpdates[0]?.status, 'rejected');
    assertEquals(writes.subscriptionInserts.length, 0);
    assertEquals(writes.auditInserts[0]?.event_type, 'payment_intent_rejected');
  });

  await t.step('throws not_found for a nonexistent intent', async () => {
    const writes: Writes = { intentUpdates: [], subscriptionInserts: [], auditInserts: [] };
    const error = await assertRejects(
      () =>
        approvePaymentIntent({
          serviceDb: fakeServiceDb({ intent: null }, writes),
          reviewerUserId: 'admin-1',
          intentId: 999,
          decision: 'approved',
        }),
      AppError,
    );
    assertEquals((error as AppError).code, 'not_found');
  });

  await t.step('refuses to re-review an already-reviewed intent', async () => {
    const writes: Writes = { intentUpdates: [], subscriptionInserts: [], auditInserts: [] };
    const error = await assertRejects(
      () =>
        approvePaymentIntent({
          serviceDb: fakeServiceDb({ intent: { ...defaultIntent, status: 'approved' } }, writes),
          reviewerUserId: 'admin-1',
          intentId: 1,
          decision: 'approved',
        }),
      AppError,
    );
    assertEquals((error as AppError).code, 'invalid_payload');
    assertEquals(writes.intentUpdates.length, 0);
  });
});
