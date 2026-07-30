import { randomUUID } from 'node:crypto';
import { afterEach, beforeAll, afterAll, describe, expect, it } from 'vitest';
import {
  createTestUser,
  deleteTestUser,
  newPgClient,
  serviceRoleClient,
  type TestUser,
} from './helpers';

describe('pg_cron/pg_net background jobs (§4.6)', () => {
  const client = newPgClient();

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it('registers all four background jobs with their expected schedules', async () => {
    const { rows } = await client.query<{ jobname: string; schedule: string }>(
      'SELECT jobname, schedule FROM cron.job WHERE jobname IN ' +
        "('weekly-garden-archival', 'engagement-nudge', 'gemini-quota-watchdog', 'payment-reconciliation') " +
        'ORDER BY jobname',
    );

    expect(rows).toEqual([
      { jobname: 'engagement-nudge', schedule: '0 13 * * *' },
      { jobname: 'gemini-quota-watchdog', schedule: '*/30 * * * *' },
      { jobname: 'payment-reconciliation', schedule: '0 4 * * *' },
      { jobname: 'weekly-garden-archival', schedule: '0 19 * * 0' },
    ]);
  });
});

describe('invoke_edge_function privilege lockdown (ADR-0024)', () => {
  let user: TestUser | undefined;

  afterEach(async () => {
    if (user) await deleteTestUser(user);
    user = undefined;
  });

  it('rejects a direct call from an authenticated user', async () => {
    user = await createTestUser();
    const { error } = await user.client.rpc('invoke_edge_function', {
      p_function_name: 'health',
    });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/permission denied/i);
  });

  it('succeeds when called from a privileged context and returns a request id', async () => {
    const pgClient = newPgClient();
    await pgClient.connect();
    try {
      const { rows } = await pgClient.query<{ invoke_edge_function: string }>(
        "SELECT invoke_edge_function('health') ",
      );
      expect(rows[0]?.invoke_edge_function).not.toBeNull();
    } finally {
      await pgClient.end();
    }
  });
});

describe('find_inactive_users_for_nudge privilege lockdown and correctness', () => {
  let user: TestUser | undefined;

  afterEach(async () => {
    if (user) await deleteTestUser(user);
    user = undefined;
  });

  it('rejects a direct call from an authenticated user', async () => {
    user = await createTestUser();
    const { error } = await user.client.rpc('find_inactive_users_for_nudge');
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/permission denied/i);
  });

  it('finds a subscribed user who has not logged today, and excludes one who has', async () => {
    const inactiveUser = await createTestUser();
    const activeUser = await createTestUser();
    user = inactiveUser; // ensures cleanup even if an assertion below throws

    await inactiveUser.client.from('push_tokens').insert({
      user_id: inactiveUser.userId,
      endpoint: `https://push.example/${randomUUID()}`,
      p256dh: 'p256dh-value',
      auth: 'auth-value',
    });
    await activeUser.client.from('push_tokens').insert({
      user_id: activeUser.userId,
      endpoint: `https://push.example/${randomUUID()}`,
      p256dh: 'p256dh-value',
      auth: 'auth-value',
    });
    await activeUser.client.from('water_logs').insert({
      user_id: activeUser.userId,
      client_uuid: randomUUID(),
      log_date: new Date().toISOString().slice(0, 10),
      glasses_logged: 1,
    });

    const { data, error } = await serviceRoleClient.rpc('find_inactive_users_for_nudge');
    expect(error).toBeNull();

    const userIds = (data ?? []).map((row: { user_id: string }) => row.user_id);
    expect(userIds).toContain(inactiveUser.userId);
    expect(userIds).not.toContain(activeUser.userId);

    await deleteTestUser(activeUser);
  });
});

describe('sum_todays_ai_usage privilege lockdown and correctness', () => {
  let userA: TestUser | undefined;
  let userB: TestUser | undefined;

  afterEach(async () => {
    if (userA) await deleteTestUser(userA);
    if (userB) await deleteTestUser(userB);
    userA = undefined;
    userB = undefined;
  });

  it('rejects a direct call from an authenticated user', async () => {
    userA = await createTestUser();
    const { error } = await userA.client.rpc('sum_todays_ai_usage');
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/permission denied/i);
  });

  it("sums message_count across every user's row for today", async () => {
    userA = await createTestUser();
    userB = await createTestUser();
    const today = new Date().toISOString().slice(0, 10);

    const { data: before } = await serviceRoleClient.rpc('sum_todays_ai_usage');
    const baseline = (before as number) ?? 0;

    await serviceRoleClient.from('daily_ai_usage').insert([
      { user_id: userA.userId, usage_date: today, message_count: 3 },
      { user_id: userB.userId, usage_date: today, message_count: 5 },
    ]);

    const { data: after, error } = await serviceRoleClient.rpc('sum_todays_ai_usage');
    expect(error).toBeNull();
    expect(after).toBe(baseline + 8);
  });
});
