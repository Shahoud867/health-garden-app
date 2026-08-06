/**
 * Right-to-erasure account deletion (Blueprint §7.9, closes G-8).
 *
 * Deletes only the caller's own account, never an id supplied in the request
 * -- the target is always `ctx.auth.authId`, resolved from the caller's own
 * validated session, so there is no field here for a client to substitute
 * someone else's account into. The actual erasure is one call:
 * `auth.admin.deleteUser`, which removes the `auth.users` row that
 * `users.auth_id` cascades from (migration 0003) -- every other table in the
 * schema cascades from `users.id` in turn (migrations 0004-0009), so this one
 * admin call is what makes deletion structurally complete rather than a
 * hand-maintained checklist of tables to also clean up.
 *
 * The audit_log entry is written *before* the delete, not after: audit_log.user_id
 * still needs to reference a live `users.id` row at insert time. It survives the
 * subsequent cascade because that column is ON DELETE SET NULL (migration 0009),
 * not ON DELETE CASCADE -- the record of "this account was deleted" is exactly
 * the one row this schema is designed to keep around after the account it
 * describes is gone.
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { z } from '../_shared/deps.ts';
import { Errors } from '../_shared/http/errors.ts';
import { createServiceRoleClient } from '../_shared/auth/context.ts';
import { createPostHogClient, type PostHogClient } from '../_shared/observability/posthog.ts';

const bodySchema = z.object({
  // A deliberately unergonomic body shape for a deliberately irreversible
  // action -- this is not meant to be easy to trigger by accident.
  confirm: z.literal(true),
});

export interface AccountDeleteResponse {
  readonly deleted: true;
}

/** The minimal client shapes this handler needs, narrowed for fake injection
 * in tests -- resolving a real session/performing a real admin deletion both
 * need a live Supabase stack (Blueprint §13.5). */
export interface UserRowClient {
  from(table: 'users'): {
    select(columns: string): {
      single(): PromiseLike<{ data: { id: string } | null; error: { message: string } | null }>;
    };
  };
}

export interface AuditLogClient {
  from(table: 'audit_log'): {
    insert(row: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
  };
}

export interface AdminAuthClient {
  auth: {
    admin: {
      deleteUser(authId: string): PromiseLike<{ error: { message: string } | null }>;
    };
  };
}

/**
 * The deletion core, factored out of `handleAccountDelete` for the same
 * reason `account-export`'s core is factored out: a Deno unit test has no
 * live Supabase Auth server to resolve a real session or perform a real
 * admin deletion against.
 */
export async function deleteAccount(deps: {
  readonly userDb: UserRowClient;
  readonly serviceDb: AuditLogClient & AdminAuthClient;
  readonly authId: string;
  readonly analytics: PostHogClient;
}): Promise<AccountDeleteResponse> {
  const { userDb, serviceDb, authId, analytics } = deps;

  const { data: profile, error: profileError } = await userDb.from('users').select('id').single();
  if (profileError !== null || profile === null) {
    throw Errors.internal({ details: { step: 'resolve_profile', message: profileError?.message } });
  }

  const { error: auditError } = await serviceDb.from('audit_log').insert({
    user_id: profile.id,
    event_type: 'account_deletion_requested',
    event_payload: { requested_at: new Date().toISOString() },
  });
  if (auditError !== null) {
    throw Errors.internal({ details: { step: 'write_audit_log', message: auditError.message } });
  }

  const { error: deleteError } = await serviceDb.auth.admin.deleteUser(authId);
  if (deleteError !== null) {
    throw Errors.internal({ details: { step: 'delete_auth_user', message: deleteError.message } });
  }

  // After the fact, on the id that -- unlike authId -- audit_log itself
  // still references post-cascade (see module doc). Fire-and-forget: never
  // the reason a real deletion fails.
  analytics.capture('account_deleted', profile.id);

  return { deleted: true };
}

export const handleAccountDelete = defineEndpoint<
  z.infer<typeof bodySchema>,
  AccountDeleteResponse
>({
  name: 'account-delete',
  methods: ['POST'],
  auth: 'required',
  bodySchema,
  handler: (ctx) => {
    const serviceDb = createServiceRoleClient(ctx.config);
    return deleteAccount({
      userDb: ctx.auth!.db,
      serviceDb,
      authId: ctx.auth!.authId,
      analytics: createPostHogClient(ctx.config.posthogApiKey, { host: ctx.config.posthogHost }),
    });
  },
});
