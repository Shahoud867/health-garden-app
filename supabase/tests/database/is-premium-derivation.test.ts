import { afterEach, describe, expect, it } from 'vitest';
import { createTestUser, deleteTestUser, serviceRoleClient, type TestUser } from './helpers';

describe('users.is_premium derivation (§5.5, ADR-0024)', () => {
  let user: TestUser | undefined;

  afterEach(async () => {
    if (user) await deleteTestUser(user);
    user = undefined;
  });

  it('becomes true when an active subscription is written, via the subscriptions trigger', async () => {
    user = await createTestUser();

    const { data: before } = await serviceRoleClient
      .from('users')
      .select('is_premium')
      .eq('id', user.userId)
      .single();
    expect(before?.is_premium).toBe(false);

    const { error } = await serviceRoleClient.from('subscriptions').insert({
      user_id: user.userId,
      provider: 'manual_interim',
      status: 'active',
      amount_pkr: 500,
      current_period_start: '2026-01-01',
      current_period_end: '2026-12-31',
    });
    expect(error).toBeNull();

    const { data: after } = await serviceRoleClient
      .from('users')
      .select('is_premium')
      .eq('id', user.userId)
      .single();
    expect(after?.is_premium).toBe(true);
  });

  it("cannot be forged by the owning user's own PATCH of their profile", async () => {
    user = await createTestUser();

    // No active subscription exists. Attempt to self-grant premium via the
    // exact same UPDATE a legitimate profile edit would use.
    const { error } = await user.client
      .from('users')
      .update({ is_premium: true, full_name: 'Test User' })
      .eq('id', user.userId);
    expect(error).toBeNull(); // the UPDATE itself is permitted (full_name is legitimate)

    const { data } = await user.client
      .from('users')
      .select('is_premium, full_name')
      .eq('id', user.userId)
      .single();
    expect(data?.full_name).toBe('Test User'); // the legitimate field did change
    expect(data?.is_premium).toBe(false); // is_premium was silently forced back to the truth
  });

  it('reverts to false once the client-scoped RLS-visible subscription lapses', async () => {
    user = await createTestUser();

    await serviceRoleClient.from('subscriptions').insert({
      user_id: user.userId,
      provider: 'manual_interim',
      status: 'active',
      amount_pkr: 500,
      current_period_start: '2020-01-01',
      current_period_end: '2020-01-31', // already expired
    });

    const { data } = await serviceRoleClient
      .from('users')
      .select('is_premium')
      .eq('id', user.userId)
      .single();
    expect(data?.is_premium).toBe(false); // current_period_end < CURRENT_DATE, not active
  });
});
