import { afterEach, describe, expect, it } from 'vitest';
import { createTestUser, deleteTestUser, serviceRoleClient, type TestUser } from './helpers';

describe('submit_payment_intent_if_under_limit (ADR-0024, Phase 8 security review)', () => {
  let user: TestUser | undefined;

  afterEach(async () => {
    if (user) await deleteTestUser(user);
    user = undefined;
  });

  it('rejects a direct call from an authenticated user', async () => {
    user = await createTestUser();
    const { error } = await user.client.rpc('submit_payment_intent_if_under_limit', {
      p_user_id: user.userId,
      p_amount_pkr: 500,
      p_method: 'jazzcash_manual',
      p_reference: 'TXN1',
      p_max_pending: 3,
    });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/permission denied/i);
  });

  it('inserts a row and returns its id when under the limit', async () => {
    user = await createTestUser();
    const { data, error } = await serviceRoleClient.rpc('submit_payment_intent_if_under_limit', {
      p_user_id: user.userId,
      p_amount_pkr: 500,
      p_method: 'jazzcash_manual',
      p_reference: 'TXN1',
      p_max_pending: 3,
    });
    expect(error).toBeNull();
    expect(typeof data).toBe('number');

    const { data: rows } = await serviceRoleClient
      .from('payment_intents')
      .select('id, status, amount_pkr')
      .eq('user_id', user.userId);
    expect(rows).toHaveLength(1);
    expect(rows![0]!.id).toBe(data);
    expect(rows![0]!.status).toBe('pending_review');
  });

  it('returns NULL, not an error, once the caller is at the pending limit -- and inserts nothing', async () => {
    user = await createTestUser();
    for (let i = 0; i < 3; i += 1) {
      const { data, error } = await serviceRoleClient.rpc('submit_payment_intent_if_under_limit', {
        p_user_id: user.userId,
        p_amount_pkr: 500,
        p_method: 'jazzcash_manual',
        p_reference: `TXN${i}`,
        p_max_pending: 3,
      });
      expect(error).toBeNull();
      expect(data).not.toBeNull();
    }

    const { data: fourth, error: fourthError } = await serviceRoleClient.rpc(
      'submit_payment_intent_if_under_limit',
      {
        p_user_id: user.userId,
        p_amount_pkr: 500,
        p_method: 'jazzcash_manual',
        p_reference: 'TXN-over-limit',
        p_max_pending: 3,
      },
    );
    expect(fourthError).toBeNull();
    expect(fourth).toBeNull();

    const { data: rows } = await serviceRoleClient
      .from('payment_intents')
      .select('id')
      .eq('user_id', user.userId);
    expect(rows).toHaveLength(3); // the 4th call inserted nothing
  });

  it("does not count another user's pending submissions toward this user's limit", async () => {
    const userA = await createTestUser();
    const userB = await createTestUser();
    user = userA; // ensures cleanup even if an assertion below throws

    for (let i = 0; i < 3; i += 1) {
      await serviceRoleClient.rpc('submit_payment_intent_if_under_limit', {
        p_user_id: userA.userId,
        p_amount_pkr: 500,
        p_method: 'jazzcash_manual',
        p_reference: `A${i}`,
        p_max_pending: 3,
      });
    }

    const { data, error } = await serviceRoleClient.rpc('submit_payment_intent_if_under_limit', {
      p_user_id: userB.userId,
      p_amount_pkr: 500,
      p_method: 'easypaisa_manual',
      p_reference: 'B0',
      p_max_pending: 3,
    });
    expect(error).toBeNull();
    expect(data).not.toBeNull(); // userB's own count is still 0

    await deleteTestUser(userB);
  });
});
