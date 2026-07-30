import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { cronJobsSnapshotPath } from './global-setup';
import {
  createTestUser,
  deleteTestUser,
  newPgClient,
  serviceRoleClient,
  type TestUser,
} from './helpers';

/** "Today" as the database's Asia/Karachi CURRENT_DATE would compute it
 * (§5.10, G-16) -- PKT is UTC+5 with no DST, so this is a fixed offset, not
 * a real timezone conversion. Using `new Date().toISOString()` directly
 * would be UTC's today, which can differ from the database's for several
 * hours a day -- exactly the class of bug the timezone fix exists to avoid,
 * so test fixtures have to respect it too, not just production code. */
function karachiToday(): string {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

describe('pg_cron/pg_net background jobs (§4.6)', () => {
  it('registered all four background jobs with their expected schedules', () => {
    // global-setup.ts unschedules every job for the run's duration (a live
    // job could otherwise fire mid-suite and process the same rows a test
    // is asserting about) -- it captures this exact snapshot first, so this
    // reads that rather than querying cron.job, which is empty by now.
    const snapshot = JSON.parse(readFileSync(cronJobsSnapshotPath(), 'utf-8')) as {
      jobname: string;
      schedule: string;
    }[];

    expect(snapshot).toEqual([
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
      log_date: karachiToday(),
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
    const today = karachiToday();

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
