import { afterEach, describe, expect, it } from 'vitest';
import {
  createTestUser,
  deleteTestUser,
  newPgClient,
  serviceRoleClient,
  type TestUser,
} from './helpers';

function subtractDays(isoDate: string, offset: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

async function runArchiveSweep(): Promise<void> {
  const pgClient = newPgClient();
  await pgClient.connect();
  try {
    await pgClient.query('SELECT archive_and_reset_stale_garden_rows()');
  } finally {
    await pgClient.end();
  }
}

describe('archive_and_reset_stale_garden_rows (roadmap §6.4)', () => {
  let user: TestUser | undefined;

  afterEach(async () => {
    if (user) await deleteTestUser(user);
    user = undefined;
  });

  it('archives a single stale week into permanent_garden and resets the row', async () => {
    user = await createTestUser();

    const { data: goalRow } = await serviceRoleClient
      .from('garden_state')
      .select('id, current_week_start')
      .eq('user_id', user.userId)
      .eq('goal_type', 'hydration')
      .single();

    // Exactly one week back (a multiple of 7), not an arbitrary day count:
    // the walk-forward loop advances by 7 days per iteration, so an offset
    // that isn't week-aligned relative to current_week_start makes the
    // number of stale weeks it finds depend on which day of the current
    // week "today" happens to be (verified: offset 10 produced 1 archived
    // row Monday-Thursday and 2 Friday-Sunday, a real CI failure this
    // fixes, not a flaky one -- it reproduced every time on the wrong days).
    const staleWeekStart = subtractDays(goalRow!.current_week_start as string, 7);
    await serviceRoleClient
      .from('garden_state')
      .update({ current_week_start: staleWeekStart, current_stage: 2, days_succeeded_this_week: 5 })
      .eq('id', goalRow!.id);

    await runArchiveSweep();

    const { data: archived } = await serviceRoleClient
      .from('permanent_garden')
      .select('week_completed, final_stage_reached')
      .eq('user_id', user.userId)
      .eq('plant_type', 'mint');
    expect(archived).toHaveLength(1);
    expect(archived![0]!.final_stage_reached).toBe(2);
    expect(archived![0]!.week_completed).toBe(staleWeekStart);

    const { data: reset } = await serviceRoleClient
      .from('garden_state')
      .select('current_stage, days_succeeded_this_week, current_week_start')
      .eq('id', goalRow!.id)
      .single();
    expect(reset?.current_stage).toBe(0);
    expect(reset?.days_succeeded_this_week).toBe(0);
    expect(reset?.current_week_start).not.toBe(staleWeekStart);
  });

  it('walks forward through multiple missed weeks, producing one permanent_garden row per week', async () => {
    user = await createTestUser();

    const { data: goalRow } = await serviceRoleClient
      .from('garden_state')
      .select('id, current_week_start')
      .eq('user_id', user.userId)
      .eq('goal_type', 'movement')
      .single();

    // 3 full weeks stale.
    const staleWeekStart = subtractDays(goalRow!.current_week_start as string, 21);
    await serviceRoleClient
      .from('garden_state')
      .update({ current_week_start: staleWeekStart, current_stage: 3, days_succeeded_this_week: 6 })
      .eq('id', goalRow!.id);

    await runArchiveSweep();

    const { data: archived } = await serviceRoleClient
      .from('permanent_garden')
      .select('final_stage_reached')
      .eq('user_id', user.userId)
      .eq('plant_type', 'sapling')
      .order('week_completed', { ascending: true });

    expect(archived).toHaveLength(3);
    expect(archived![0]!.final_stage_reached).toBe(3); // the first missed week keeps its real stage
    expect(archived![1]!.final_stage_reached).toBe(0); // later weeks have no activity data
    expect(archived![2]!.final_stage_reached).toBe(0);

    const { data: reset } = await serviceRoleClient
      .from('garden_state')
      .select('current_week_start')
      .eq('id', goalRow!.id)
      .single();
    // The row should now be caught up to the current, in-progress week.
    expect(new Date(reset!.current_week_start as string).getTime()).toBeGreaterThan(
      new Date(staleWeekStart).getTime(),
    );
  });

  it('is a no-op when nothing is stale', async () => {
    user = await createTestUser();

    const { data: before } = await serviceRoleClient
      .from('permanent_garden')
      .select('id')
      .eq('user_id', user.userId);
    expect(before).toHaveLength(0);

    await runArchiveSweep();

    const { data: after } = await serviceRoleClient
      .from('permanent_garden')
      .select('id')
      .eq('user_id', user.userId);
    expect(after).toHaveLength(0);
  });
});
