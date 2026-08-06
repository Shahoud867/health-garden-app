import { afterEach, describe, expect, it } from 'vitest';
import { createTestUser, deleteTestUser, newPgClient, type TestUser } from './helpers';

describe('new-user seeding (handle_new_auth_user, seed_garden_state_for_new_user)', () => {
  let user: TestUser | undefined;

  afterEach(async () => {
    if (user) await deleteTestUser(user);
    user = undefined;
  });

  it('creates exactly the 5 launch plants, at stage 0, for a new signup', async () => {
    user = await createTestUser();

    const { data, error } = await user.client
      .from('garden_state')
      .select('goal_type, plant_type, current_stage, cycle_started_on')
      .eq('user_id', user.userId)
      .order('goal_type');

    expect(error).toBeNull();
    expect(data).toHaveLength(5);

    const byGoal = Object.fromEntries((data ?? []).map((row) => [row.goal_type, row]));
    expect(byGoal.hydration.plant_type).toBe('mint');
    expect(byGoal.sugar_free.plant_type).toBe('cactus');
    expect(byGoal.protein.plant_type).toBe('wheat_stalk');
    expect(byGoal.movement.plant_type).toBe('sapling');
    expect(byGoal.consistency.plant_type).toBe('succulent');

    for (const row of data ?? []) {
      expect(row.current_stage).toBe(0);
      // Seeded with a fresh cycle starting today (migration 0005) -- not
      // asserting an exact date (timezone-sensitive, §5.10), just that it's
      // a real, non-null date every plant got at signup.
      expect(row.cycle_started_on).not.toBeNull();
    }
  });

  it('is idempotent: re-seeding an already-seeded user creates no duplicates', async () => {
    user = await createTestUser();

    // seed_garden_state_for_new_user has EXECUTE revoked from every client
    // role (ADR-0024) -- call it directly as the superuser, the same
    // privilege level the handle_new_auth_user trigger itself runs at, to
    // exercise the ON CONFLICT DO NOTHING guarantee a retried trigger
    // invocation would depend on.
    const pgClient = newPgClient();
    await pgClient.connect();
    try {
      await pgClient.query('SELECT seed_garden_state_for_new_user($1)', [user.userId]);
    } finally {
      await pgClient.end();
    }

    const { data } = await user.client.from('garden_state').select('id').eq('user_id', user.userId);
    expect(data).toHaveLength(5);
  });
});
