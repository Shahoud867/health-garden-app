import { assertEquals, assertRejects } from '@std/assert';
import { AppError } from '../_shared/http/errors.ts';
import {
  type AdminAuthClient,
  type AuditLogClient,
  deleteAccount,
  type UserRowClient,
} from './handler.ts';

interface FakeState {
  auditInserts: Record<string, unknown>[];
  deletedAuthIds: string[];
}

function fakeDeps(overrides?: {
  profile?: { id: string } | null;
  profileError?: string;
  auditError?: string;
  deleteError?: string;
}): { userDb: UserRowClient; serviceDb: AuditLogClient & AdminAuthClient; state: FakeState } {
  const state: FakeState = { auditInserts: [], deletedAuthIds: [] };

  const userDb: UserRowClient = {
    from: () => ({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: overrides?.profileError ? null : (overrides?.profile ?? { id: 'user-1' }),
            error: overrides?.profileError ? { message: overrides.profileError } : null,
          }),
      }),
    }),
  };

  const serviceDb: AuditLogClient & AdminAuthClient = {
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        if (overrides?.auditError) {
          return Promise.resolve({ error: { message: overrides.auditError } });
        }
        state.auditInserts.push(row);
        return Promise.resolve({ error: null });
      },
    }),
    auth: {
      admin: {
        deleteUser: (authId: string) => {
          if (overrides?.deleteError) {
            return Promise.resolve({ error: { message: overrides.deleteError } });
          }
          state.deletedAuthIds.push(authId);
          return Promise.resolve({ error: null });
        },
      },
    },
  };

  return { userDb, serviceDb, state };
}

Deno.test('deleteAccount', async (t) => {
  await t.step('writes an audit entry before deleting the auth user', async () => {
    const { userDb, serviceDb, state } = fakeDeps({ profile: { id: 'user-42' } });

    const result = await deleteAccount({ userDb, serviceDb, authId: 'auth-42' });

    assertEquals(result, { deleted: true });
    assertEquals(state.auditInserts.length, 1);
    assertEquals(state.auditInserts[0]?.user_id, 'user-42');
    assertEquals(state.auditInserts[0]?.event_type, 'account_deletion_requested');
    assertEquals(state.deletedAuthIds, ['auth-42']);
  });

  await t.step('never accepts a caller-supplied target -- only ctx.auth.authId', async () => {
    const { userDb, serviceDb, state } = fakeDeps();
    await deleteAccount({ userDb, serviceDb, authId: 'the-callers-own-auth-id' });
    assertEquals(state.deletedAuthIds, ['the-callers-own-auth-id']);
  });

  await t.step('fails and does not delete when the profile cannot be resolved', async () => {
    const { userDb, serviceDb, state } = fakeDeps({ profileError: 'row not found' });

    const error = await assertRejects(
      () => deleteAccount({ userDb, serviceDb, authId: 'auth-1' }),
      AppError,
    );
    assertEquals((error as AppError).details?.step, 'resolve_profile');
    assertEquals(state.deletedAuthIds, []);
  });

  await t.step('fails and does not delete when the audit write fails', async () => {
    const { userDb, serviceDb, state } = fakeDeps({ auditError: 'insert failed' });

    const error = await assertRejects(
      () => deleteAccount({ userDb, serviceDb, authId: 'auth-1' }),
      AppError,
    );
    assertEquals((error as AppError).details?.step, 'write_audit_log');
    assertEquals(state.deletedAuthIds, []);
  });

  await t.step('surfaces a failure from the actual auth deletion', async () => {
    const { userDb, serviceDb } = fakeDeps({ deleteError: 'GoTrue unavailable' });

    const error = await assertRejects(
      () => deleteAccount({ userDb, serviceDb, authId: 'auth-1' }),
      AppError,
    );
    assertEquals((error as AppError).details?.step, 'delete_auth_user');
  });
});
