/**
 * Interim manual payment verification — submission side (Blueprint §6.2,
 * §7.12, §12.6, ADR-008). The other half, `payments-approve-intent`, is a
 * separate function since it runs under a completely different trust level
 * (a founder, not the submitting user).
 *
 * Two protections before the row is ever created (§7.12, closes G-20): a
 * Cloudflare Turnstile check (a public URL has none of a Play Store
 * listing's natural friction against scripted abuse) and a per-user rate
 * limit, since a bot that gets past Turnstile once could otherwise flood the
 * founders' manual review queue from a single account.
 *
 * The rate-limit check-and-insert is one atomic call
 * (`submit_payment_intent_if_under_limit`, migration 0014), not a separate
 * count-then-insert in this handler — two concurrent submissions could
 * otherwise both read "still under the limit" before either committed,
 * bypassing MAX_PENDING_PER_24H. Found during the Phase 8 security review;
 * the same class of race `increment_daily_ai_usage` (ADR-003) already closed
 * for the AI cap.
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { z } from '../_shared/deps.ts';
import { Errors } from '../_shared/http/errors.ts';
import { createServiceRoleClient } from '../_shared/auth/context.ts';
import { verifyTurnstileToken } from '../_shared/security/turnstile.ts';

const MAX_PENDING_PER_24H = 3;

const bodySchema = z.object({
  amountPkr: z.number().int().positive(),
  method: z.enum(['jazzcash_manual', 'easypaisa_manual']),
  reference: z.string().min(1).max(255),
  turnstileToken: z.string().min(1),
});

export interface SubmitIntentResponse {
  readonly intentId: number;
  readonly status: 'pending_review';
}

interface ProfileRow {
  readonly id: string;
}

export interface ProfileLookupClient {
  from(table: string): {
    select(columns: string): PromiseLike<{
      data: readonly Record<string, unknown>[] | null;
      error: { message: string } | null;
    }>;
  };
}

/** Generic `fn: string` signature, not a literal overload -- the same
 * `deno check` "type instantiation is excessively deep" cliff documented on
 * every other narrow RPC-calling interface in this codebase applies here
 * too. */
export interface AtomicSubmitClient {
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ data: number | null; error: { message: string } | null }>;
}

export async function submitPaymentIntent(deps: {
  readonly userDb: ProfileLookupClient;
  readonly serviceDb: AtomicSubmitClient;
  readonly turnstileSecretKey: string;
  readonly fetchImpl?: typeof fetch;
  readonly body: z.infer<typeof bodySchema>;
}): Promise<SubmitIntentResponse> {
  const { userDb, serviceDb, turnstileSecretKey, fetchImpl, body } = deps;

  const verification = await verifyTurnstileToken({
    secretKey: turnstileSecretKey,
    token: body.turnstileToken,
    fetchImpl,
  });
  if (!verification.success) {
    throw Errors.forbidden({
      userMessage: 'We could not verify that request. Please try again.',
      details: { turnstileErrors: verification.errorCodes },
    });
  }

  const { data: profileRows, error: profileError } = await userDb.from('users').select('id');
  const profile = (profileRows?.[0] as unknown as ProfileRow | undefined) ?? null;
  if (profileError !== null || profile === null) {
    throw Errors.internal({ details: { step: 'resolve_profile', message: profileError?.message } });
  }

  const { data: newIntentId, error: submitError } = await serviceDb.rpc(
    'submit_payment_intent_if_under_limit',
    {
      p_user_id: profile.id,
      p_amount_pkr: body.amountPkr,
      p_method: body.method,
      p_reference: body.reference,
      p_max_pending: MAX_PENDING_PER_24H,
    },
  );
  if (submitError !== null) {
    throw Errors.internal({ details: { step: 'submit_intent', message: submitError.message } });
  }
  if (newIntentId === null) {
    throw Errors.rateLimited({
      userMessage:
        'You already have pending submissions under review. Please wait before submitting another.',
    });
  }

  return { intentId: newIntentId, status: 'pending_review' };
}

export const handlePaymentsSubmitIntent = defineEndpoint<
  z.infer<typeof bodySchema>,
  SubmitIntentResponse
>({
  name: 'payments-submit-intent',
  methods: ['POST'],
  auth: 'required',
  bodySchema,
  handler: (ctx) => {
    const turnstileSecretKey = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (turnstileSecretKey === undefined || turnstileSecretKey.trim() === '') {
      throw Errors.internal({ details: { step: 'missing_turnstile_secret' } });
    }
    return submitPaymentIntent({
      userDb: ctx.auth!.db as unknown as ProfileLookupClient,
      serviceDb: createServiceRoleClient(ctx.config) as unknown as AtomicSubmitClient,
      turnstileSecretKey,
      body: ctx.body,
    });
  },
});
