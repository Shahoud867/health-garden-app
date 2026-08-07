/**
 * increment_daily_ai_usage (migration 0010, ADR-003) is the atomic
 * check-and-increment RPC the entire AI cost-control design depends on --
 * the one thing standing between this project and an unbounded Gemini bill.
 * It had zero DB-level test coverage (only a mocked/fake RPC in
 * ai-chat/handler.test.ts), found during a full backend audit. Fixed here:
 * privilege lockdown, correctness across repeated calls, and per-user/
 * per-day isolation -- against real Postgres, not a fake.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  createTestUser,
  deleteTestUser,
  karachiToday,
  serviceRoleClient,
  type TestUser,
} from './helpers';

describe('increment_daily_ai_usage (ADR-003)', () => {
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
    const { error } = await userA.client.rpc('increment_daily_ai_usage', {
      p_user_id: userA.userId,
    });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/permission denied/i);
  });

  it('creates a row at count 1 on the first call today, and increments on each subsequent call', async () => {
    userA = await createTestUser();

    const { data: first, error: e1 } = await serviceRoleClient.rpc('increment_daily_ai_usage', {
      p_user_id: userA.userId,
    });
    expect(e1).toBeNull();
    expect(first).toBe(1);

    const { data: second, error: e2 } = await serviceRoleClient.rpc('increment_daily_ai_usage', {
      p_user_id: userA.userId,
    });
    expect(e2).toBeNull();
    expect(second).toBe(2);

    const { data: third } = await serviceRoleClient.rpc('increment_daily_ai_usage', {
      p_user_id: userA.userId,
    });
    expect(third).toBe(3);

    // Exactly one row for today, count matches the last call's return value --
    // proves the RPC is genuinely incrementing the stored row, not just
    // returning a computed value disconnected from what's persisted.
    const today = karachiToday();
    const { data: rows } = await serviceRoleClient
      .from('daily_ai_usage')
      .select('message_count')
      .eq('user_id', userA.userId)
      .eq('usage_date', today);
    expect(rows).toHaveLength(1);
    expect(rows![0]!.message_count).toBe(3);
  });

  it("never lets one user's usage affect another user's count", async () => {
    userA = await createTestUser();
    userB = await createTestUser();

    await serviceRoleClient.rpc('increment_daily_ai_usage', { p_user_id: userA.userId });
    await serviceRoleClient.rpc('increment_daily_ai_usage', { p_user_id: userA.userId });
    const { data: bCount } = await serviceRoleClient.rpc('increment_daily_ai_usage', {
      p_user_id: userB.userId,
    });
    expect(bCount).toBe(1); // userA's two calls didn't leak into userB's count
  });

  it('does not double-count a pre-existing row for today (ON CONFLICT DO UPDATE, not a fresh insert)', async () => {
    userA = await createTestUser();
    const today = karachiToday();

    // Seed a row directly, simulating an earlier call this same day.
    await serviceRoleClient
      .from('daily_ai_usage')
      .insert({ user_id: userA.userId, usage_date: today, message_count: 5 });

    const { data, error } = await serviceRoleClient.rpc('increment_daily_ai_usage', {
      p_user_id: userA.userId,
    });
    expect(error).toBeNull();
    expect(data).toBe(6); // continues from the existing count, no duplicate row / no reset to 1

    const { data: rows } = await serviceRoleClient
      .from('daily_ai_usage')
      .select('id')
      .eq('user_id', userA.userId)
      .eq('usage_date', today);
    expect(rows).toHaveLength(1); // still exactly one row for the day
  });
});
