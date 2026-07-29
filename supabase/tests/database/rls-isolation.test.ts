import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestUser, deleteTestUser, type TestUser } from './helpers';

describe('RLS isolation', () => {
  let userA: TestUser | undefined;
  let userB: TestUser | undefined;

  afterEach(async () => {
    if (userA) await deleteTestUser(userA);
    if (userB) await deleteTestUser(userB);
    userA = undefined;
    userB = undefined;
  });

  it('a user can read and write their own food_logs', async () => {
    userA = await createTestUser();

    const { error: insertError } = await userA.client.from('food_logs').insert({
      user_id: userA.userId,
      client_uuid: randomUUID(),
      log_date: '2026-01-01',
      calories_snapshot: 100,
      source: 'manual',
    });
    expect(insertError).toBeNull();

    const { data, error } = await userA.client
      .from('food_logs')
      .select('id')
      .eq('user_id', userA.userId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("a user cannot read another user's food_logs", async () => {
    userA = await createTestUser();
    userB = await createTestUser();

    await userA.client.from('food_logs').insert({
      user_id: userA.userId,
      client_uuid: randomUUID(),
      log_date: '2026-01-01',
      calories_snapshot: 100,
      source: 'manual',
    });

    const { data, error } = await userB.client
      .from('food_logs')
      .select('id')
      .eq('user_id', userA.userId);

    expect(error).toBeNull();
    expect(data).toHaveLength(0); // RLS silently filters rather than erroring on SELECT
  });

  it("a user cannot insert a food_log under another user's user_id", async () => {
    userA = await createTestUser();
    userB = await createTestUser();

    const { error } = await userB.client.from('food_logs').insert({
      user_id: userA.userId,
      client_uuid: randomUUID(),
      log_date: '2026-01-01',
      calories_snapshot: 100,
      source: 'manual',
    });

    // A WITH CHECK violation on INSERT is a hard error (unlike UPDATE/DELETE
    // matching zero rows silently) -- see the garden_state test below for
    // the contrasting case.
    expect(error).not.toBeNull();
  });

  it("garden_state rejects a direct client UPDATE, even to the user's own row (ADR-0024)", async () => {
    userA = await createTestUser();

    const { data: before } = await userA.client
      .from('garden_state')
      .select('id, current_stage')
      .eq('user_id', userA.userId)
      .eq('goal_type', 'hydration')
      .single();

    const { error } = await userA.client
      .from('garden_state')
      .update({ current_stage: 3 })
      .eq('id', before!.id);

    // No UPDATE policy exists for the authenticated role at all -- RLS
    // silently matches zero rows rather than raising.
    expect(error).toBeNull();

    const { data: after } = await userA.client
      .from('garden_state')
      .select('current_stage')
      .eq('id', before!.id)
      .single();

    expect(after?.current_stage).toBe(before?.current_stage);
    expect(after?.current_stage).not.toBe(3);
  });

  it('permanent_garden rejects a direct client INSERT (ADR-0024)', async () => {
    userA = await createTestUser();

    const { error } = await userA.client.from('permanent_garden').insert({
      user_id: userA.userId,
      plant_type: 'mint',
      week_completed: '2026-01-01',
      final_stage_reached: 3,
    });

    expect(error).not.toBeNull();
  });

  it('app_config is unreachable by any client role', async () => {
    userA = await createTestUser();

    const { data, error } = await userA.client.from('app_config').select('key');

    // Zero policies at all -- default-deny returns an empty result for
    // SELECT, not an error (same UPDATE/DELETE-style silence as above).
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
