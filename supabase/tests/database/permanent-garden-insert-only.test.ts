import { afterEach, describe, expect, it } from 'vitest';
import { createTestUser, deleteTestUser, serviceRoleClient, type TestUser } from './helpers';

describe('permanent_garden insert-only guarantee (§5.4)', () => {
  let user: TestUser | undefined;

  afterEach(async () => {
    if (user) await deleteTestUser(user);
    user = undefined;
  });

  it('rejects UPDATE and DELETE even for the service-role client — structural, not RLS-dependent', async () => {
    user = await createTestUser();

    // Using the service-role client (bypasses RLS entirely) isolates what's
    // actually being tested: the BEFORE trigger itself, not RLS getting
    // there first. If this still fails, the guarantee is enforced by the
    // database, not by which role is asking.
    const { data: inserted, error: insertError } = await serviceRoleClient
      .from('permanent_garden')
      .insert({
        user_id: user.userId,
        plant_type: 'mint',
        week_completed: '2026-01-01',
        final_stage_reached: 2,
      })
      .select('id')
      .single();
    expect(insertError).toBeNull();

    const { error: updateError } = await serviceRoleClient
      .from('permanent_garden')
      .update({ final_stage_reached: 3 })
      .eq('id', inserted!.id);
    expect(updateError).not.toBeNull();
    expect(updateError?.message).toMatch(/insert-only/i);

    const { error: deleteError } = await serviceRoleClient
      .from('permanent_garden')
      .delete()
      .eq('id', inserted!.id);
    expect(deleteError).not.toBeNull();
    expect(deleteError?.message).toMatch(/insert-only/i);
  });
});
