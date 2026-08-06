import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestUser, deleteTestUser, serviceRoleClient, type TestUser } from './helpers';

function addDays(isoDate: string, offset: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

/**
 * Backdates a goal's cycle_started_on `daysAgo` days before today and
 * returns the new value.
 *
 * A fresh signup seeds cycle_started_on at CURRENT_DATE (migration 0005),
 * so a test using day offsets 0/1/2 from that value without backdating
 * would land on tomorrow/the day after -- genuinely future dates.
 * daily_goal_success (migration 0005) bounds its range at CURRENT_DATE by
 * design (a day cannot legitimately qualify before it happens), so those
 * logs would silently fall outside the counted range and the test would
 * assert the wrong thing. Backdating instead means every day offset used
 * below lands in the past, which is also the only way this ever happens for
 * a real user (§4.4's offline-first backdating, pastOrPresentDateSchema's
 * "permitted without bound" tolerance).
 */
async function backdateCycle(userId: string, goalType: string, daysAgo: number): Promise<string> {
  const { data } = await serviceRoleClient
    .from('garden_state')
    .select('cycle_started_on')
    .eq('user_id', userId)
    .eq('goal_type', goalType)
    .single();
  const newStart = addDays(data!.cycle_started_on as string, -daysAgo);
  await serviceRoleClient
    .from('garden_state')
    .update({ cycle_started_on: newStart })
    .eq('user_id', userId)
    .eq('goal_type', goalType);
  return newStart;
}

async function insertFoodLog(
  userId: string,
  logDate: string,
  overrides: Partial<{
    calories_snapshot: number;
    protein_g_snapshot: number;
    sugar_flag_snapshot: 'Y' | 'N';
  }> = {},
): Promise<void> {
  await serviceRoleClient.from('food_logs').insert({
    user_id: userId,
    client_uuid: randomUUID(),
    log_date: logDate,
    calories_snapshot: overrides.calories_snapshot ?? 500,
    protein_g_snapshot: overrides.protein_g_snapshot ?? 20,
    sugar_flag_snapshot: overrides.sugar_flag_snapshot ?? 'N',
    source: 'manual',
  });
}

async function readGardenRow(
  userId: string,
  goalType: string,
): Promise<{ current_stage: number; cycle_started_on: string; is_dormant_today: boolean }> {
  const { data } = await serviceRoleClient
    .from('garden_state')
    .select('current_stage, cycle_started_on, is_dormant_today')
    .eq('user_id', userId)
    .eq('goal_type', goalType)
    .single();
  return data as { current_stage: number; cycle_started_on: string; is_dormant_today: boolean };
}

describe('garden derivation engine v2 (garden mechanic v2, ADR-0026) — the highest-value tests in the codebase', () => {
  let user: TestUser | undefined;

  afterEach(async () => {
    if (user) await deleteTestUser(user);
    user = undefined;
  });

  it('advances one stage per qualifying day, idempotently, and follows edits/deletes', async () => {
    user = await createTestUser();
    await serviceRoleClient
      .from('users')
      .update({ daily_protein_target_g: 50 })
      .eq('id', user.userId);
    const start = await backdateCycle(user.userId, 'protein', 10);
    const day = (offset: number) => addDays(start, offset);

    // Day 0: a single log clears the 50g target -> stage 1.
    await insertFoodLog(user.userId, day(0), { protein_g_snapshot: 60 });
    expect((await readGardenRow(user.userId, 'protein')).current_stage).toBe(1);

    // Day 1: clears the target only when both logs are summed (30 + 25 = 55g)
    // -- proves the derivation sums same-day logs, not just the last one.
    // -> stage 2.
    await insertFoodLog(user.userId, day(1), { protein_g_snapshot: 30 });
    await insertFoodLog(user.userId, day(1), { protein_g_snapshot: 25 });
    expect((await readGardenRow(user.userId, 'protein')).current_stage).toBe(2);

    // Day 2: below target, does not qualify -- stays at stage 2, not 3.
    await insertFoodLog(user.userId, day(2), { protein_g_snapshot: 20 });
    expect((await readGardenRow(user.userId, 'protein')).current_stage).toBe(2);

    // Idempotency: a second log on an already-qualifying day must not double
    // count -- the count is qualifying calendar days, never an increment.
    await insertFoodLog(user.userId, day(0), { protein_g_snapshot: 15 });
    expect((await readGardenRow(user.userId, 'protein')).current_stage).toBe(2);

    // Deleting every log for a qualifying day must recompute the count down
    // -- proves the AFTER DELETE trigger (extended beyond the blueprint's
    // AFTER-INSERT-only sketch, §5.3) actually fires.
    const { data: day0Logs } = await serviceRoleClient
      .from('food_logs')
      .select('id')
      .eq('user_id', user.userId)
      .eq('log_date', day(0));
    await serviceRoleClient
      .from('food_logs')
      .delete()
      .in(
        'id',
        (day0Logs ?? []).map((log) => log.id),
      );
    expect((await readGardenRow(user.userId, 'protein')).current_stage).toBe(1); // only day 1 remains
  });

  it('graduates a plant into permanent_garden on the 3rd qualifying day and starts a fresh cycle', async () => {
    user = await createTestUser();
    await serviceRoleClient
      .from('users')
      .update({ daily_protein_target_g: 50 })
      .eq('id', user.userId);
    const start = await backdateCycle(user.userId, 'protein', 10);
    const day = (offset: number) => addDays(start, offset);

    await insertFoodLog(user.userId, day(0), { protein_g_snapshot: 60 });
    await insertFoodLog(user.userId, day(1), { protein_g_snapshot: 60 });

    const { data: beforeGraduation } = await serviceRoleClient
      .from('permanent_garden')
      .select('id')
      .eq('user_id', user.userId)
      .eq('plant_type', 'wheat_stalk');
    expect(beforeGraduation).toHaveLength(0);

    // The 3rd qualifying day graduates the plant.
    await insertFoodLog(user.userId, day(2), { protein_g_snapshot: 60 });

    const { data: archived } = await serviceRoleClient
      .from('permanent_garden')
      .select('plant_type, slot_index, board_number, completed_on')
      .eq('user_id', user.userId)
      .eq('plant_type', 'wheat_stalk');
    expect(archived).toHaveLength(1);
    expect(archived![0]!.completed_on).toBe(day(2));
    expect(archived![0]!.board_number).toBe(0);
    expect(archived![0]!.slot_index).toBe(0);

    const after = await readGardenRow(user.userId, 'protein');
    expect(after.current_stage).toBe(0); // fresh cycle, not left at 3
    expect(after.cycle_started_on).toBe(day(3)); // the day after graduation
  });

  it('rolls over to board_number 1, slot_index 0 on the 26th plant a user ever earns', async () => {
    user = await createTestUser();

    // Seeds 25 already-earned plants directly (service-role bypasses the
    // insert-only client restriction, same as every other white-box test in
    // this suite) rather than logging 75 real qualifying days -- what's
    // under test is sync_garden_state's board/slot arithmetic
    // (v_next_index / 25, v_next_index % 25) for the boundary case, not the
    // per-day derivation the tests above already cover. The 26th plant is
    // still earned through the real trigger path, not seeded.
    const seedRows = Array.from({ length: 25 }, (_, slot) => ({
      user_id: user!.userId,
      plant_type: 'mint',
      board_number: 0,
      slot_index: slot,
      completed_on: '2026-01-01',
    }));
    const { error: seedError } = await serviceRoleClient.from('permanent_garden').insert(seedRows);
    expect(seedError).toBeNull();

    await serviceRoleClient
      .from('users')
      .update({ daily_protein_target_g: 50 })
      .eq('id', user.userId);
    const start = await backdateCycle(user.userId, 'protein', 10);
    for (let offset = 0; offset < 3; offset += 1) {
      await insertFoodLog(user.userId, addDays(start, offset), { protein_g_snapshot: 60 });
    }

    const { data: latest } = await serviceRoleClient
      .from('permanent_garden')
      .select('board_number, slot_index')
      .eq('user_id', user.userId)
      .eq('plant_type', 'wheat_stalk')
      .single();
    expect(latest?.board_number).toBe(1);
    expect(latest?.slot_index).toBe(0);
  });

  it("computes sugar_free as 'logged something, and none of it was flagged sugary', per day", async () => {
    user = await createTestUser();
    const start = await backdateCycle(user.userId, 'sugar_free', 10);
    const day = (offset: number) => addDays(start, offset);

    // Day 0: qualifies -- logged, nothing sugar-flagged.
    await insertFoodLog(user.userId, day(0), { sugar_flag_snapshot: 'N' });
    expect((await readGardenRow(user.userId, 'sugar_free')).current_stage).toBe(1);

    // Day 1: does not qualify -- one sugary item breaks the whole day, even
    // alongside a non-sugary log.
    await insertFoodLog(user.userId, day(1), { sugar_flag_snapshot: 'N' });
    await insertFoodLog(user.userId, day(1), { sugar_flag_snapshot: 'Y' });
    expect((await readGardenRow(user.userId, 'sugar_free')).current_stage).toBe(1); // unchanged
  });

  it('uses the personalised hydration target, falling back to 8 glasses when unset', async () => {
    user = await createTestUser();
    const start = await backdateCycle(user.userId, 'hydration', 10);

    // No daily_water_target_glasses set -- falls back to 8. 7 glasses must
    // not qualify.
    await serviceRoleClient.from('water_logs').insert({
      user_id: user.userId,
      client_uuid: randomUUID(),
      log_date: start,
      glasses_logged: 7,
    });
    expect((await readGardenRow(user.userId, 'hydration')).current_stage).toBe(0);

    await serviceRoleClient.from('water_logs').insert({
      user_id: user.userId,
      client_uuid: randomUUID(),
      log_date: start,
      glasses_logged: 1,
    });
    expect((await readGardenRow(user.userId, 'hydration')).current_stage).toBe(1);

    // Personalise the target to 12. Recomputation always evaluates every day
    // in the open cycle against the *current* target (ADR-002's "derived
    // from source, not incremented" guarantee applies to the target too) --
    // so this also re-evaluates the already-logged start day, which drops
    // back below the new target and makes the plant regress to stage 0. Not
    // a bug: a plant only ever locks in a completed day at graduation
    // (§7.3's accepted idempotency stance), not before.
    await serviceRoleClient
      .from('users')
      .update({ daily_water_target_glasses: 12 })
      .eq('id', user.userId);
    const day1 = addDays(start, 1);
    await serviceRoleClient.from('water_logs').insert({
      user_id: user.userId,
      client_uuid: randomUUID(),
      log_date: day1,
      glasses_logged: 8, // the old hardcoded default -- no longer enough
    });
    expect((await readGardenRow(user.userId, 'hydration')).current_stage).toBe(0);

    // Genuinely clearing the new target on a fresh day counts again.
    const day2 = addDays(start, 2);
    await serviceRoleClient.from('water_logs').insert({
      user_id: user.userId,
      client_uuid: randomUUID(),
      log_date: day2,
      glasses_logged: 12,
    });
    expect((await readGardenRow(user.userId, 'hydration')).current_stage).toBe(1);
  });

  it("branches the primary-goal plant on the user's own goal (lose_weight)", async () => {
    user = await createTestUser();
    await serviceRoleClient
      .from('users')
      .update({ goal: 'lose_weight', daily_calorie_target: 1800 })
      .eq('id', user.userId);
    const start = await backdateCycle(user.userId, 'protein', 10);

    // Over target -- must not qualify for a lose_weight user, even though
    // this would have qualified under the old always-protein rule.
    await insertFoodLog(user.userId, start, { calories_snapshot: 2200, protein_g_snapshot: 200 });
    expect((await readGardenRow(user.userId, 'protein')).current_stage).toBe(0);

    // Under target -- qualifies.
    const day1 = addDays(start, 1);
    await insertFoodLog(user.userId, day1, { calories_snapshot: 1700, protein_g_snapshot: 5 });
    expect((await readGardenRow(user.userId, 'protein')).current_stage).toBe(1);
  });

  it("branches the primary-goal plant on the user's own goal (build_muscle, protein-based)", async () => {
    user = await createTestUser();
    await serviceRoleClient
      .from('users')
      .update({ goal: 'build_muscle', daily_protein_target_g: 100 })
      .eq('id', user.userId);
    const start = await backdateCycle(user.userId, 'protein', 10);

    await insertFoodLog(user.userId, start, { protein_g_snapshot: 50 }); // below target
    expect((await readGardenRow(user.userId, 'protein')).current_stage).toBe(0);

    const day1 = addDays(start, 1);
    await insertFoodLog(user.userId, day1, { protein_g_snapshot: 120 }); // clears target
    expect((await readGardenRow(user.userId, 'protein')).current_stage).toBe(1);
  });

  it('never succeeds the primary-goal plant when the relevant target is unset', async () => {
    user = await createTestUser();
    // No goal, no targets set at all (createTestUser leaves them NULL).
    const start = await backdateCycle(user.userId, 'protein', 10);
    await insertFoodLog(user.userId, start, { calories_snapshot: 1500, protein_g_snapshot: 200 });
    expect((await readGardenRow(user.userId, 'protein')).current_stage).toBe(0);
  });

  it('requires all four other goals on the same day for consistency', async () => {
    user = await createTestUser();
    await serviceRoleClient
      .from('users')
      .update({ goal: 'build_muscle', daily_protein_target_g: 50 })
      .eq('id', user.userId);
    const start = await backdateCycle(user.userId, 'consistency', 10);

    // Hits hydration and movement, but not protein or sugar_free -- must not
    // count for consistency.
    await serviceRoleClient.from('water_logs').insert({
      user_id: user.userId,
      client_uuid: randomUUID(),
      log_date: start,
      glasses_logged: 8,
    });
    await serviceRoleClient.from('workout_logs').insert({
      user_id: user.userId,
      client_uuid: randomUUID(),
      log_date: start,
      duration_min: 30,
      calories_burned: 200,
    });
    await insertFoodLog(user.userId, start, { protein_g_snapshot: 10, sugar_flag_snapshot: 'Y' });
    expect((await readGardenRow(user.userId, 'consistency')).current_stage).toBe(0);

    // Day 1: all four goals met -- counts.
    const day1 = addDays(start, 1);
    await serviceRoleClient.from('water_logs').insert({
      user_id: user.userId,
      client_uuid: randomUUID(),
      log_date: day1,
      glasses_logged: 8,
    });
    await serviceRoleClient.from('workout_logs').insert({
      user_id: user.userId,
      client_uuid: randomUUID(),
      log_date: day1,
      duration_min: 30,
      calories_burned: 200,
    });
    await insertFoodLog(user.userId, day1, { protein_g_snapshot: 60, sugar_flag_snapshot: 'N' });
    expect((await readGardenRow(user.userId, 'consistency')).current_stage).toBe(1);
  });

  it('marks is_dormant_today when today itself has not met the goal, without losing progress', async () => {
    user = await createTestUser();
    await serviceRoleClient
      .from('users')
      .update({ daily_protein_target_g: 50 })
      .eq('id', user.userId);
    const start = await backdateCycle(user.userId, 'protein', 10);
    const today = new Date().toISOString().slice(0, 10);

    // A qualifying day 10 days ago, nothing logged today yet -- is_dormant_today
    // reflects whether *today* specifically met the goal, independent of
    // whatever stage past days already earned.
    await insertFoodLog(user.userId, start, { protein_g_snapshot: 60 });
    const afterBackdatedDay = await readGardenRow(user.userId, 'protein');
    expect(afterBackdatedDay.current_stage).toBe(1);
    expect(afterBackdatedDay.is_dormant_today).toBe(true);

    // A too-small log today still leaves today short of the target -- still
    // dormant, but the stage already earned must not regress. This is the
    // "plants rest, never wilt" guarantee.
    await insertFoodLog(user.userId, today, { protein_g_snapshot: 5 });
    const afterLowToday = await readGardenRow(user.userId, 'protein');
    expect(afterLowToday.is_dormant_today).toBe(true);
    expect(afterLowToday.current_stage).toBe(1); // unchanged, not reset

    // Topping up today's total (5g + 60g = 65g) past the target clears
    // is_dormant_today, and -- since this is now a second distinct
    // qualifying day -- the stage advances too.
    await insertFoodLog(user.userId, today, { protein_g_snapshot: 60 });
    const afterToday = await readGardenRow(user.userId, 'protein');
    expect(afterToday.is_dormant_today).toBe(false);
    expect(afterToday.current_stage).toBe(2);
  });
});
