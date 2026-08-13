import { afterEach, describe, expect, it } from 'vitest';
import { createTestUser, deleteTestUser, serviceRoleClient, type TestUser } from './helpers';

/**
 * `payment_gateway_transactions` (migration 0015, ADR-0028) — SELECT-only
 * for the authenticated role, same posture as `subscriptions`/
 * `payment_intents` (migration 0006): real payment state is written only by
 * `payments-jazzcash-create`/`payments-jazzcash-webhook` via the
 * service-role client, never directly by a user's own session.
 */
describe('payment_gateway_transactions RLS', () => {
  let userA: TestUser | undefined;
  let userB: TestUser | undefined;

  afterEach(async () => {
    if (userA) await deleteTestUser(userA);
    if (userB) await deleteTestUser(userB);
    userA = undefined;
    userB = undefined;
  });

  it('a user can read their own gateway transaction once the service role creates it', async () => {
    userA = await createTestUser();

    const { error: insertError } = await serviceRoleClient
      .from('payment_gateway_transactions')
      .insert({
        user_id: userA.userId,
        provider: 'jazzcash',
        txn_ref_no: 'T-test-1',
        amount_pkr: 299,
        status: 'initiated',
      });
    expect(insertError).toBeNull();

    const { data, error } = await userA.client
      .from('payment_gateway_transactions')
      .select('id, status, amount_pkr')
      .eq('user_id', userA.userId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0]!.status).toBe('initiated');
  });

  it("a user cannot read another user's gateway transaction", async () => {
    userA = await createTestUser();
    userB = await createTestUser();

    await serviceRoleClient.from('payment_gateway_transactions').insert({
      user_id: userA.userId,
      provider: 'jazzcash',
      txn_ref_no: 'T-test-2',
      amount_pkr: 299,
      status: 'initiated',
    });

    const { data, error } = await userB.client
      .from('payment_gateway_transactions')
      .select('id')
      .eq('user_id', userA.userId);

    expect(error).toBeNull();
    expect(data).toHaveLength(0); // RLS silently filters rather than erroring on SELECT
  });

  it('a user cannot insert their own gateway transaction directly', async () => {
    userA = await createTestUser();

    const { error } = await userA.client.from('payment_gateway_transactions').insert({
      user_id: userA.userId,
      provider: 'jazzcash',
      txn_ref_no: 'T-test-3',
      amount_pkr: 299,
      status: 'initiated',
    });

    expect(error).not.toBeNull();
  });

  it('a user cannot update their own gateway transaction directly (e.g. to fake a completed status)', async () => {
    userA = await createTestUser();

    await serviceRoleClient.from('payment_gateway_transactions').insert({
      user_id: userA.userId,
      provider: 'jazzcash',
      txn_ref_no: 'T-test-4',
      amount_pkr: 299,
      status: 'initiated',
    });

    const { error } = await userA.client
      .from('payment_gateway_transactions')
      .update({ status: 'completed' })
      .eq('user_id', userA.userId);

    expect(error).not.toBeNull();

    const { data } = await serviceRoleClient
      .from('payment_gateway_transactions')
      .select('status')
      .eq('user_id', userA.userId)
      .single();
    expect(data!.status).toBe('initiated'); // unchanged
  });

  it('rejects a non-positive amount_pkr at the database level', async () => {
    userA = await createTestUser();

    const { error } = await serviceRoleClient.from('payment_gateway_transactions').insert({
      user_id: userA.userId,
      provider: 'jazzcash',
      txn_ref_no: 'T-test-5',
      amount_pkr: 0,
      status: 'initiated',
    });

    expect(error).not.toBeNull();
  });

  it('rejects a duplicate txn_ref_no', async () => {
    userA = await createTestUser();

    const { error: firstError } = await serviceRoleClient
      .from('payment_gateway_transactions')
      .insert({
        user_id: userA.userId,
        provider: 'jazzcash',
        txn_ref_no: 'T-test-duplicate',
        amount_pkr: 299,
        status: 'initiated',
      });
    expect(firstError).toBeNull();

    const { error: secondError } = await serviceRoleClient
      .from('payment_gateway_transactions')
      .insert({
        user_id: userA.userId,
        provider: 'jazzcash',
        txn_ref_no: 'T-test-duplicate',
        amount_pkr: 299,
        status: 'initiated',
      });
    expect(secondError).not.toBeNull();
  });

  it('rejects an unrecognised status value', async () => {
    userA = await createTestUser();

    const { error } = await serviceRoleClient.from('payment_gateway_transactions').insert({
      user_id: userA.userId,
      provider: 'jazzcash',
      txn_ref_no: 'T-test-6',
      amount_pkr: 299,
      status: 'not_a_real_status',
    });

    expect(error).not.toBeNull();
  });
});
