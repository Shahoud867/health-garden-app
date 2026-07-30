/**
 * Payment reconciliation (Blueprint §4.6, §2.13, ADR-008). Cron-triggered
 * daily via invoke_edge_function() -- see `_shared/security/service-role-auth.ts`
 * for the auth mechanism.
 *
 * Closes the gap a missed/delayed webhook would otherwise leave: interim
 * intents don't have a webhook to miss (a founder reviews them manually,
 * ADR-008), but a submission can still sit unreviewed if nobody notices it
 * in the Retool queue. This surfaces anything stuck in `pending_review`
 * past 48h so a founder catches it even if the queue itself was overlooked
 * -- a structured log, not an audit_log write, since "still stale" polled
 * once a day for the same intent is a recurring observation, not a discrete
 * event worth a permanent record (unlike an actual approval/rejection).
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { Errors } from '../_shared/http/errors.ts';
import { isServiceRoleCaller } from '../_shared/security/service-role-auth.ts';
import { createServiceRoleClient } from '../_shared/auth/context.ts';
import type { Logger } from '../_shared/observability/logger.ts';

const STALE_AFTER_HOURS = 48;

export interface ReconciliationResponse {
  readonly staleCount: number;
}

interface StaleIntentRow {
  readonly id: number;
  readonly user_id: string;
  readonly amount_pkr: number;
  readonly created_at: string;
}

export interface StaleIntentsClient {
  from(table: string): {
    select(columns: string): {
      eq(
        column: string,
        value: unknown,
      ): {
        lt(column2: string, value2: string): PromiseLike<{
          data: readonly Record<string, unknown>[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

export async function reconcileStalePaymentIntents(deps: {
  readonly serviceDb: StaleIntentsClient;
  readonly logger: Pick<Logger, 'warn'>;
  readonly now?: Date;
}): Promise<ReconciliationResponse> {
  const { serviceDb, logger, now = new Date() } = deps;

  const cutoff = new Date(now.getTime() - STALE_AFTER_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await serviceDb
    .from('payment_intents')
    .select('id, user_id, amount_pkr, created_at')
    .eq('status', 'pending_review')
    .lt('created_at', cutoff);
  if (error !== null) {
    throw Errors.internal({ details: { step: 'find_stale_intents', message: error.message } });
  }

  const staleIntents = (data ?? []) as unknown as readonly StaleIntentRow[];

  for (const intent of staleIntents) {
    logger.warn('payment_intent_stale', {
      intentId: intent.id,
      userId: intent.user_id,
      amountPkr: intent.amount_pkr,
      submittedAt: intent.created_at,
    });
  }

  return { staleCount: staleIntents.length };
}

export const handlePaymentReconciliation = defineEndpoint<undefined, ReconciliationResponse>({
  name: 'payment-reconciliation',
  methods: ['POST'],
  auth: 'none',
  handler: (ctx) => {
    if (!isServiceRoleCaller(ctx.req, ctx.config.supabaseServiceRoleKey)) {
      throw Errors.forbidden();
    }

    return reconcileStalePaymentIntents({
      serviceDb: createServiceRoleClient(ctx.config) as unknown as StaleIntentsClient,
      logger: ctx.logger,
    });
  },
});
