/**
 * Real-time JazzCash checkout — callback side (ADR-0028). JazzCash's own
 * browser (the customer's, redirected off the hosted checkout page) POSTs
 * form-encoded `pp_*` response fields directly here — there is no Supabase
 * session to check (`auth: 'none'`, and `verify_jwt = false` in
 * `supabase/config.toml`, since the platform gateway would otherwise reject
 * the call before this code ever runs). Trust instead rests entirely on
 * `pp_SecureHash` — the same model Stripe/most gateways use for webhooks,
 * where a shared-secret signature substitutes for a session.
 *
 * Fails closed without exception: a missing/unknown txn ref, a hash
 * mismatch, or any write failure all resolve to a `failed`-flavoured
 * redirect and never touch `subscriptions`. The one asymmetric case is
 * "payment verified, but the subscription insert itself then failed" —
 * that's surfaced loudly to Sentry (a real "we took the money and didn't
 * deliver" defect worth paging a human for, not something to silently
 * swallow) but still redirects the customer to a success page, since the
 * charge itself is not in question at that point, only our own bookkeeping.
 *
 * Every terminal state returns a real HTTP redirect (303, POST→GET) back
 * into the web app rather than a JSON error body — unlike every other
 * endpoint in this codebase, the caller here is a customer's browser doing
 * a full-page navigation, not a fetch() client that can parse `{error,
 * message}`.
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { Errors } from '../_shared/http/errors.ts';
import { createServiceRoleClient } from '../_shared/auth/context.ts';
import { createPostHogClient, type PostHogClient } from '../_shared/observability/posthog.ts';
import { createSentryReporter, type SentryReporter } from '../_shared/observability/sentry.ts';
import type { Logger } from '../_shared/observability/logger.ts';
import {
  type CheckoutCallbackFields,
  isSuccessResponseCode,
  verifyResponseHash,
} from '../_shared/payments/jazzcash.ts';

// Mirrors `payments-approve-intent`'s own constant of the same name and
// value -- kept as a separate local definition rather than a shared import,
// matching that pair's existing precedent of two independent handlers under
// different trust models, not one shared activation module.
const SUBSCRIPTION_PERIOD_DAYS = 30;

interface TransactionRow {
  readonly id: number;
  readonly user_id: string;
  readonly amount_pkr: number;
  readonly status: string;
}

export interface WebhookDbClient {
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

function formDataToFields(formData: FormData): CheckoutCallbackFields {
  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') fields[key] = value;
  }
  return fields;
}

export async function processJazzCashCallback(deps: {
  readonly serviceDb: WebhookDbClient;
  readonly fields: CheckoutCallbackFields;
  readonly integritySalt: string;
  readonly appUrl: string;
  readonly analytics: PostHogClient;
  readonly sentry: SentryReporter;
  readonly logger: Logger;
}): Promise<string> {
  const { serviceDb, fields, integritySalt, appUrl, analytics, sentry, logger } = deps;
  const failureRedirect = `${appUrl}/premium?payment=failed`;
  const successRedirect = `${appUrl}/premium?payment=success`;

  const txnRefNo = fields.pp_TxnRefNo;
  if (txnRefNo === undefined || txnRefNo.trim() === '') {
    logger.warn('jazzcash_webhook_missing_txn_ref', { receivedKeys: Object.keys(fields) });
    return failureRedirect;
  }

  const { data: txnRows, error: txnError } = await serviceDb
    .from('payment_gateway_transactions')
    .select('id, user_id, amount_pkr, status')
    .eq('txn_ref_no', txnRefNo);
  const txn = (txnRows?.[0] as unknown as TransactionRow | undefined) ?? null;
  if (txnError !== null || txn === null) {
    logger.warn('jazzcash_webhook_unknown_txn', { txnRefNo, message: txnError?.message });
    return failureRedirect;
  }

  // Idempotency: a gateway callback can be delivered more than once. A
  // transaction already resolved replays its existing outcome rather than
  // re-verifying or double-activating a subscription.
  if (txn.status !== 'initiated') {
    return txn.status === 'completed' ? successRedirect : failureRedirect;
  }

  const hashValid = await verifyResponseHash(fields, integritySalt);
  if (!hashValid) {
    logger.error('jazzcash_webhook_hash_mismatch', { txnRefNo, userId: txn.user_id });
    sentry.captureException(new Error(`JazzCash callback hash mismatch for txn ${txnRefNo}`), {
      txnRefNo,
      userId: txn.user_id,
    });

    await serviceDb
      .from('payment_gateway_transactions')
      .update({
        status: 'verification_failed',
        provider_response_code: fields.pp_ResponseCode ?? null,
        provider_response_message: fields.pp_ResponseMessage ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', txn.id);

    return failureRedirect;
  }

  const success = isSuccessResponseCode(fields.pp_ResponseCode);
  const { error: updateError } = await serviceDb
    .from('payment_gateway_transactions')
    .update({
      status: success ? 'completed' : 'failed',
      provider_response_code: fields.pp_ResponseCode ?? null,
      provider_response_message: fields.pp_ResponseMessage ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', txn.id);
  if (updateError !== null) {
    logger.error('jazzcash_webhook_update_failed', { txnRefNo, message: updateError.message });
    sentry.captureException(new Error('Failed to update payment_gateway_transactions'), {
      txnRefNo,
      message: updateError.message,
    });
    return failureRedirect;
  }

  if (!success) {
    return failureRedirect;
  }

  const periodStart = new Date();
  const periodEnd = new Date(
    periodStart.getTime() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  );

  const { error: subscriptionError } = await serviceDb.from('subscriptions').insert({
    user_id: txn.user_id,
    provider: 'jazzcash',
    provider_reference: txnRefNo,
    status: 'active',
    amount_pkr: txn.amount_pkr,
    current_period_start: periodStart.toISOString().slice(0, 10),
    current_period_end: periodEnd.toISOString().slice(0, 10),
  });
  if (subscriptionError !== null) {
    logger.error('jazzcash_webhook_subscription_insert_failed', {
      txnRefNo,
      message: subscriptionError.message,
    });
    sentry.captureException(
      new Error('JazzCash payment verified but subscription activation failed'),
      { txnRefNo, userId: txn.user_id, message: subscriptionError.message },
    );
    // See module doc: the charge itself genuinely succeeded here, so the
    // customer is not shown a failure -- only our own write is broken, and
    // that is now a paged, human-followed-up defect, not a silent one.
    return successRedirect;
  }

  // Fire-and-forget, after the write that actually matters has already
  // succeeded -- matches `payments-approve-intent`'s own ordering.
  analytics.capture('subscription_activated', txn.user_id, {
    amount_pkr: txn.amount_pkr,
    provider: 'jazzcash',
  });

  const { error: auditError } = await serviceDb.from('audit_log').insert({
    user_id: txn.user_id,
    event_type: 'jazzcash_subscription_activated',
    event_payload: { txn_ref_no: txnRefNo, amount_pkr: txn.amount_pkr },
  });
  if (auditError !== null) {
    logger.error('jazzcash_webhook_audit_log_failed', { txnRefNo, message: auditError.message });
  }

  return successRedirect;
}

export const handlePaymentsJazzCashWebhook = defineEndpoint<undefined, void>({
  name: 'payments-jazzcash-webhook',
  methods: ['POST'],
  auth: 'none',
  handler: async (ctx) => {
    const integritySalt = Deno.env.get('JAZZCASH_INTEGRITY_SALT');
    const appUrl = Deno.env.get('PUBLIC_APP_URL');
    if (
      integritySalt === undefined || integritySalt.trim() === '' ||
      appUrl === undefined || appUrl.trim() === ''
    ) {
      throw Errors.internal({ details: { step: 'missing_jazzcash_webhook_config' } });
    }

    let fields: CheckoutCallbackFields;
    try {
      fields = formDataToFields(await ctx.req.formData());
    } catch (cause) {
      throw Errors.invalidPayload({ details: { step: 'parse_form_data' }, cause });
    }

    const redirectTo = await processJazzCashCallback({
      serviceDb: createServiceRoleClient(ctx.config) as unknown as WebhookDbClient,
      fields,
      integritySalt: integritySalt.trim(),
      appUrl: appUrl.trim().replace(/\/$/, ''),
      analytics: createPostHogClient(ctx.config.posthogApiKey, { host: ctx.config.posthogHost }),
      sentry: createSentryReporter(ctx.config.sentryDsn, { environment: ctx.config.environment }),
      logger: ctx.logger,
    });

    return Response.redirect(redirectTo, 303);
  },
});
