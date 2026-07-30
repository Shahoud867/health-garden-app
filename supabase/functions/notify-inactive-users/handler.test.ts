import { assertEquals, assertRejects } from '@std/assert';
import { AppError } from '../_shared/http/errors.ts';
import {
  type InactiveUsersQueryClient,
  type PushSendResult,
  type PushTokenPruneClient,
  sendEngagementNudges,
} from './handler.ts';

const subscriptions = [
  { user_id: 'user-1', endpoint: 'https://push.example/a', p256dh: 'p1', auth: 'a1' },
  { user_id: 'user-2', endpoint: 'https://push.example/b', p256dh: 'p2', auth: 'a2' },
  { user_id: 'user-3', endpoint: 'https://push.example/c', p256dh: 'p3', auth: 'a3' },
];

function fakeQueryDb(
  rows: readonly Record<string, unknown>[] = subscriptions,
): InactiveUsersQueryClient {
  return {
    rpc: (_fn: 'find_inactive_users_for_nudge') => Promise.resolve({ data: rows, error: null }),
  };
}

function fakePruneDb(pruned: string[][]): PushTokenPruneClient {
  return {
    from: (_table: string) => ({
      delete: () => ({
        in: (_column: string, values: readonly string[]) => {
          pruned.push([...values]);
          return Promise.resolve({ error: null });
        },
      }),
    }),
  };
}

Deno.test('sendEngagementNudges', async (t) => {
  await t.step('sends to every inactive-user subscription', async () => {
    const pruned: string[][] = [];
    const sendPush = (sub: { endpoint: string }): Promise<PushSendResult> =>
      Promise.resolve({ endpoint: sub.endpoint, ok: true });

    const result = await sendEngagementNudges({
      queryDb: fakeQueryDb(),
      pruneDb: fakePruneDb(pruned),
      sendPush,
    });

    assertEquals(result, { notified: 3, pruned: 0 });
    assertEquals(pruned.length, 0);
  });

  await t.step('prunes only subscriptions that failed with 404 or 410', async () => {
    const pruned: string[][] = [];
    const sendPush = (sub: { endpoint: string }): Promise<PushSendResult> => {
      if (sub.endpoint.endsWith('/a')) return Promise.resolve({ endpoint: sub.endpoint, ok: true });
      if (sub.endpoint.endsWith('/b')) {
        return Promise.resolve({ endpoint: sub.endpoint, ok: false, statusCode: 410 });
      }
      // /c fails with a transient 503 -- must NOT be pruned, it may still be valid.
      return Promise.resolve({ endpoint: sub.endpoint, ok: false, statusCode: 503 });
    };

    const result = await sendEngagementNudges({
      queryDb: fakeQueryDb(),
      pruneDb: fakePruneDb(pruned),
      sendPush,
    });

    assertEquals(result, { notified: 1, pruned: 1 });
    assertEquals(pruned, [['https://push.example/b']]);
  });

  await t.step('is a no-op when there are no inactive users with subscriptions', async () => {
    const pruned: string[][] = [];
    const sendPush = (sub: { endpoint: string }): Promise<PushSendResult> =>
      Promise.resolve({ endpoint: sub.endpoint, ok: true });

    const result = await sendEngagementNudges({
      queryDb: fakeQueryDb([]),
      pruneDb: fakePruneDb(pruned),
      sendPush,
    });

    assertEquals(result, { notified: 0, pruned: 0 });
  });

  await t.step('surfaces a query failure as an AppError', async () => {
    const queryDb: InactiveUsersQueryClient = {
      rpc: () => Promise.resolve({ data: null, error: { message: 'boom' } }),
    };
    const error = await assertRejects(
      () =>
        sendEngagementNudges({
          queryDb,
          pruneDb: fakePruneDb([]),
          sendPush: () => Promise.resolve({ endpoint: 'x', ok: true }),
        }),
      AppError,
    );
    assertEquals((error as AppError).code, 'internal_error');
  });
});
