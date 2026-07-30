/**
 * Engagement-nudge notifications (Blueprint §4.6, §2.8). Cron-triggered
 * (migration 0011's 'engagement-nudge' schedule) via invoke_edge_function(),
 * never by a user -- see `_shared/security/service-role-auth.ts` for why
 * that check, not a user JWT, gates this endpoint.
 *
 * Web Push (VAPID) rather than Expo Push, per the v2.2 web-first pivot
 * (ADR-019, §2.8) -- "fewer moving parts... no intermediary push service to
 * depend on." A subscription that fails with 404/410 is gone for good (the
 * browser unregistered it) and is pruned from push_tokens rather than
 * retried forever.
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { Errors } from '../_shared/http/errors.ts';
import { isServiceRoleCaller } from '../_shared/security/service-role-auth.ts';
import { createServiceRoleClient } from '../_shared/auth/context.ts';
import { webpush } from '../_shared/deps.ts';

// Plain, restrained tone (NFR-9) -- no exclamation marks, no guilt.
const NUDGE_BODY = "Your garden's still waiting for today's log — even a small one counts.";

export interface NotifyInactiveUsersResponse {
  readonly notified: number;
  readonly pruned: number;
}

interface Subscription {
  readonly endpoint: string;
  readonly p256dh: string;
  readonly auth: string;
}

export interface PushSendResult {
  readonly endpoint: string;
  readonly ok: boolean;
  readonly statusCode?: number;
}

export interface InactiveUsersQueryClient {
  rpc(fn: 'find_inactive_users_for_nudge'): PromiseLike<{
    data: readonly Record<string, unknown>[] | null;
    error: { message: string } | null;
  }>;
}

export interface PushTokenPruneClient {
  from(table: string): {
    delete(): {
      in(
        column: string,
        values: readonly string[],
      ): PromiseLike<{ error: { message: string } | null }>;
    };
  };
}

/**
 * The nudge core, factored out for the same reason every cron-triggered
 * handler's core is: `sendPush` wraps a real cryptographic protocol call
 * this suite has no live push service to exercise against, exactly the
 * shape of problem `GeminiProvider`'s injectable fetch already solves for a
 * different external dependency.
 */
export async function sendEngagementNudges(deps: {
  readonly queryDb: InactiveUsersQueryClient;
  readonly pruneDb: PushTokenPruneClient;
  readonly sendPush: (subscription: Subscription) => Promise<PushSendResult>;
}): Promise<NotifyInactiveUsersResponse> {
  const { queryDb, pruneDb, sendPush } = deps;

  const { data, error } = await queryDb.rpc('find_inactive_users_for_nudge');
  if (error !== null) {
    throw Errors.internal({ details: { step: 'find_inactive_users', message: error.message } });
  }
  const subscriptions = (data ?? []) as unknown as readonly Subscription[];

  const results = await Promise.all(subscriptions.map((subscription) => sendPush(subscription)));

  const deadEndpoints = results
    .filter((result) => !result.ok && (result.statusCode === 404 || result.statusCode === 410))
    .map((result) => result.endpoint);

  if (deadEndpoints.length > 0) {
    const { error: pruneError } = await pruneDb.from('push_tokens').delete().in(
      'endpoint',
      deadEndpoints,
    );
    if (pruneError !== null) {
      throw Errors.internal({
        details: { step: 'prune_dead_tokens', message: pruneError.message },
      });
    }
  }

  return {
    notified: results.filter((result) => result.ok).length,
    pruned: deadEndpoints.length,
  };
}

let vapidConfigured = false;

function sendViaWebPush(subscription: Subscription): Promise<PushSendResult> {
  if (!vapidConfigured) {
    const subject = Deno.env.get('VAPID_SUBJECT');
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!subject || !publicKey || !privateKey) {
      throw Errors.internal({ details: { step: 'missing_vapid_config' } });
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  }

  return webpush
    .sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({ body: NUDGE_BODY }),
    )
    .then(() => ({ endpoint: subscription.endpoint, ok: true }))
    .catch((cause: { statusCode?: number }) => ({
      endpoint: subscription.endpoint,
      ok: false,
      statusCode: cause.statusCode,
    }));
}

export const handleNotifyInactiveUsers = defineEndpoint<undefined, NotifyInactiveUsersResponse>({
  name: 'notify-inactive-users',
  methods: ['POST'],
  auth: 'none',
  handler: (ctx) => {
    if (!isServiceRoleCaller(ctx.req, ctx.config.supabaseServiceRoleKey)) {
      throw Errors.forbidden();
    }

    const serviceDb = createServiceRoleClient(ctx.config);
    return sendEngagementNudges({
      queryDb: serviceDb as unknown as InactiveUsersQueryClient,
      pruneDb: serviceDb as unknown as PushTokenPruneClient,
      sendPush: sendViaWebPush,
    });
  },
});
