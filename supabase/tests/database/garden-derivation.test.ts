import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestUser, deleteTestUser, type TestUser } from './helpers';

function addDays(isoDate: string, offset: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

describe('garden derivation engine (§5.3, ADR-002) — the highest-value tests in the codebase', () => {
  let user: TestUser | undefined;

  afterEach(async () => {
    if (user) await deleteTestUser(user);
    user = undefined;
  });

  it('recomputes days_succeeded_this_week/current_stage from food_logs, idempotently, and follows edits/deletes', async () => {
    user = await createTestUser();

    const { error: profileError } = await user.client
      .from('users')
      .update({ daily_protein_target_g: 50 })
      .eq('id', user.userId);
    expect(profileError).toBeNull();

    const { data: goalRow, error: goalError } = await user.client
      .from('garden_state')
      .select('current_week_start')
      .eq('user_id', user.userId)
      .eq('goal_type', 'protein')
      .single();
    expect(goalError).toBeNull();
    const weekStart = goalRow!.current_week_start as string;
    const day = (offset: number) => addDays(weekStart, offset);

    // Day 0: a single log clears the 50g target.
    await user.client.from('food_logs').insert({
      user_id: user.userId,
      client_uuid: randomUUID(),
      log_date: day(0),
      calories_snapshot: 500,
      protein_g_snapshot: 60,
      source: 'manual',
    });

    // Day 1: clears the target only when both logs are summed (30 + 25 = 55g)
    // -- proves the derivation sums same-day logs, not just the last one.
    await user.client.from('food_logs').insert([
      {
        user_id: user.userId,
        client_uuid: randomUUID(),
        log_date: day(1),
        calories_snapshot: 200,
        protein_g_snapshot: 30,
        source: 'manual',
      },
      {
        user_id: user.userId,
        client_uuid: randomUUID(),
        log_date: day(1),
        calories_snapshot: 200,
        protein_g_snapshot: 25,
        source: 'manual',
      },
    ]);

    // Day 2: below target, does not qualify.
    await user.client.from('food_logs').insert({
      user_id: user.userId,
      client_uuid: randomUUID(),
      log_date: day(2),
      calories_snapshot: 150,
      protein_g_snapshot: 20,
      source: 'manual',
    });

    const { data: afterInsert } = await user.client
      .from('garden_state')
      .select('days_succeeded_this_week, current_stage')
      .eq('user_id', user.userId)
      .eq('goal_type', 'protein')
      .single();
    expect(afterInsert?.days_succeeded_this_week).toBe(2);
    expect(afterInsert?.current_stage).toBe(1); // 2-3 days -> stage 1

    // Idempotency: a second log on an already-qualifying day must not double
    // count -- the count is COUNT(DISTINCT log_date), never an increment.
    await user.client.from('food_logs').insert({
      user_id: user.userId,
      client_uuid: randomUUID(),
      log_date: day(0),
      calories_snapshot: 100,
      protein_g_snapshot: 15,
      source: 'manual',
    });
    const { data: afterDuplicateDay } = await user.client
      .from('garden_state')
      .select('days_succeeded_this_week')
      .eq('user_id', user.userId)
      .eq('goal_type', 'protein')
      .single();
    expect(afterDuplicateDay?.days_succeeded_this_week).toBe(2);

    // Deleting every log for a qualifying day must recompute the count down
    // -- proves the AFTER DELETE trigger (extended beyond the blueprint's
    // AFTER-INSERT-only sketch, §5.3) actually fires.
    const { data: day0Logs } = await user.client
      .from('food_logs')
      .select('id')
      .eq('user_id', user.userId)
      .eq('log_date', day(0));
    await user.client
      .from('food_logs')
      .delete()
      .in(
        'id',
        (day0Logs ?? []).map((log) => log.id),
      );

    const { data: afterDelete } = await user.client
      .from('garden_state')
      .select('days_succeeded_this_week, current_stage')
      .eq('user_id', user.userId)
      .eq('goal_type', 'protein')
      .single();
    expect(afterDelete?.days_succeeded_this_week).toBe(1); // only day 1 remains
    expect(afterDelete?.current_stage).toBe(0); // <2 days -> stage 0
  });

  it("computes the sugar_free goal as 'logged something, and none of it was flagged sugary'", async () => {
    user = await createTestUser();

    const { data: goalRow } = await user.client
      .from('garden_state')
      .select('current_week_start')
      .eq('user_id', user.userId)
      .eq('goal_type', 'sugar_free')
      .single();
    const weekStart = goalRow!.current_week_start as string;
    const day = (offset: number) => addDays(weekStart, offset);

    // Day 0: qualifies -- logged, nothing sugar-flagged.
    await user.client.from('food_logs').insert({
      user_id: user.userId,
      client_uuid: randomUUID(),
      log_date: day(0),
      calories_snapshot: 300,
      sugar_flag_snapshot: 'N',
      source: 'manual',
    });

    // Day 1: does not qualify -- one sugary item breaks the whole day, even
    // alongside a non-sugary log.
    await user.client.from('food_logs').insert([
      {
        user_id: user.userId,
        client_uuid: randomUUID(),
        log_date: day(1),
        calories_snapshot: 200,
        sugar_flag_snapshot: 'N',
        source: 'manual',
      },
      {
        user_id: user.userId,
        client_uuid: randomUUID(),
        log_date: day(1),
        calories_snapshot: 250,
        sugar_flag_snapshot: 'Y',
        source: 'manual',
      },
    ]);

    const { data } = await user.client
      .from('garden_state')
      .select('days_succeeded_this_week')
      .eq('user_id', user.userId)
      .eq('goal_type', 'sugar_free')
      .single();
    expect(data?.days_succeeded_this_week).toBe(1);
  });
});
