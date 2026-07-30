/**
 * Interim manual payment verification — approval side (Blueprint §6.2,
 * §12.6, ADR-008; admin-auth mechanism recorded in ADR-0025).
 *
 * "Admin JWT (Retool)" in §6.2's endpoint table has no roles table to check
 * against (§7.3 deliberately keeps authorization to just `is_premium`) --
 * the founder signs in as a real Supabase Auth user, and this handler checks
 * their email against an allowlist before permitting the action. This is why
 * `payment_intents.reviewed_by` references `users(id)`: the reviewer is a
 * real, resolvable user, not a bare shared secret.
 *
 * Every write here goes through the service-role client deliberately --
 * payment_intents/subscriptions/audit_log all deny direct writes to the
 * authenticated role (ADR-0024), and an admin reviewing *another* user's
 * intent has no RLS-granted access to that row via their own session either
 * way. This is exactly the "administrative action already gated by a
 * separate authorization check" case the kernel's service-role doc
 * anticipates (`_shared/auth/context.ts`).
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { z } from '../_shared/deps.ts';
import { Errors } from '../_shared/http/errors.ts';
import { createServiceRoleClient } from '../_shared/auth/context.ts';

const SUBSCRIPTION_PERIOD_DAYS = 30;

const bodySchema = z.object({
  intentId: z.number().int().positive(),
  decision: z.enum(['approved', 'rejected']),
});

export interface ApproveIntentResponse {
  readonly status: 'approved' | 'rejected';
}

interface IntentRow {
  readonly id: number;
  readonly user_id: string;
  readonly amount_pkr: number;
  readonly status: string;
}

export interface ApproveIntentClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: unknown): PromiseLike<{
        data: readonly Record<string, unknown>[] | null;
        error: { message: string } | null;
      }>;
    };
    update(row: Record<string, unknown>): {
      eq(column: string, value: unknown): PromiseLike<{ error: { message: string } | null }>;
    };
    insert(row: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
  };
}

/** Checks the caller's email against ADMIN_EMAILS (comma-separated, case-insensitive). */
export function isAdminEmail(
  email: string | null | undefined,
  adminEmailsEnv: string | undefined,
): boolean {
  if (email === null || email === undefined || email.trim() === '') return false;
  const allowlist = (adminEmailsEnv ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
  return allowlist.includes(email.trim().toLowerCase());
}

export async function approvePaymentIntent(deps: {
  readonly serviceDb: ApproveIntentClient;
  readonly reviewerUserId: string;
  readonly intentId: number;
  readonly decision: 'approved' | 'rejected';
}): Promise<ApproveIntentResponse> {
  const { serviceDb, reviewerUserId, intentId, decision } = deps;

  const { data: intentRows, error: intentError } = await serviceDb
    .from('payment_intents')
    .select('id, user_id, amount_pkr, status')
    .eq('id', intentId);
  const intent = (intentRows?.[0] as unknown as IntentRow | undefined) ?? null;
  if (intentError !== null || intent === null) {
    throw Errors.notFound({ userMessage: 'That payment submission could not be found.' });
  }
  if (intent.status !== 'pending_review') {
    throw Errors.invalidPayload({
      userMessage: 'This submission has already been reviewed.',
      details: { currentStatus: intent.status },
    });
  }

  const { error: updateError } = await serviceDb
    .from('payment_intents')
    .update({
      status: decision,
      reviewed_by: reviewerUserId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', intentId);
  if (updateError !== null) {
    throw Errors.internal({ details: { step: 'update_intent', message: updateError.message } });
  }

  if (decision === 'approved') {
    const periodStart = new Date();
    const periodEnd = new Date(
      periodStart.getTime() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );

    const { error: subscriptionError } = await serviceDb.from('subscriptions').insert({
      user_id: intent.user_id,
      provider: 'manual_interim',
      status: 'active',
      amount_pkr: intent.amount_pkr,
      current_period_start: periodStart.toISOString().slice(0, 10),
      current_period_end: periodEnd.toISOString().slice(0, 10),
    });
    if (subscriptionError !== null) {
      throw Errors.internal({
        details: { step: 'insert_subscription', message: subscriptionError.message },
      });
    }
  }

  const { error: auditError } = await serviceDb.from('audit_log').insert({
    user_id: intent.user_id,
    event_type: decision === 'approved' ? 'payment_intent_approved' : 'payment_intent_rejected',
    event_payload: { intent_id: intentId, reviewed_by: reviewerUserId },
  });
  if (auditError !== null) {
    throw Errors.internal({ details: { step: 'write_audit_log', message: auditError.message } });
  }

  return { status: decision };
}

export const handlePaymentsApproveIntent = defineEndpoint<
  z.infer<typeof bodySchema>,
  ApproveIntentResponse
>({
  name: 'payments-approve-intent',
  methods: ['POST'],
  auth: 'required',
  bodySchema,
  handler: async (ctx) => {
    if (!isAdminEmail(ctx.auth!.user.email, Deno.env.get('ADMIN_EMAILS'))) {
      throw Errors.forbidden();
    }

    const serviceDb = createServiceRoleClient(ctx.config);
    const { data: reviewerRows, error: reviewerError } = await serviceDb
      .from('users')
      .select('id')
      .eq('auth_id', ctx.auth!.authId);
    const reviewer = (reviewerRows?.[0] as unknown as { id: string } | undefined) ?? null;
    if (reviewerError !== null || reviewer === null) {
      throw Errors.internal({
        details: { step: 'resolve_reviewer', message: reviewerError?.message },
      });
    }

    return approvePaymentIntent({
      serviceDb: serviceDb as unknown as ApproveIntentClient,
      reviewerUserId: reviewer.id,
      intentId: ctx.body.intentId,
      decision: ctx.body.decision,
    });
  },
});
