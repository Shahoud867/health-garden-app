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
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { z } from '../_shared/deps.ts';
import { Errors } from '../_shared/http/errors.ts';
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

export interface SubmitIntentClient {
  from(table: string): {
    select(columns: string):
      & {
        eq(
          column: string,
          value: unknown,
        ): {
          eq(
            column2: string,
            value2: unknown,
          ): {
            gte(
              column3: string,
              value3: string,
            ): PromiseLike<{
              data: readonly Record<string, unknown>[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      }
      & PromiseLike<{
        data: readonly Record<string, unknown>[] | null;
        error: { message: string } | null;
      }>;
    insert(row: Record<string, unknown>): {
      select(columns: string): {
        single(): PromiseLike<{
          data: Record<string, unknown> | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

export async function submitPaymentIntent(deps: {
  readonly userDb: SubmitIntentClient;
  readonly turnstileSecretKey: string;
  readonly fetchImpl?: typeof fetch;
  readonly body: z.infer<typeof bodySchema>;
}): Promise<SubmitIntentResponse> {
  const { userDb, turnstileSecretKey, fetchImpl, body } = deps;

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

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentRows, error: recentError } = await userDb
    .from('payment_intents')
    .select('id')
    .eq('user_id', profile.id)
    .eq('status', 'pending_review')
    .gte('created_at', since);
  if (recentError !== null) {
    throw Errors.internal({ details: { step: 'check_rate_limit', message: recentError.message } });
  }
  if ((recentRows ?? []).length >= MAX_PENDING_PER_24H) {
    throw Errors.rateLimited({
      userMessage:
        'You already have pending submissions under review. Please wait before submitting another.',
    });
  }

  const { data: inserted, error: insertError } = await userDb
    .from('payment_intents')
    .insert({
      user_id: profile.id,
      amount_pkr: body.amountPkr,
      method: body.method,
      user_submitted_reference: body.reference,
    })
    .select('id')
    .single();
  if (insertError !== null || inserted === null) {
    throw Errors.internal({ details: { step: 'insert_intent', message: insertError?.message } });
  }

  return { intentId: (inserted as unknown as { id: number }).id, status: 'pending_review' };
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
      userDb: ctx.auth!.db as unknown as SubmitIntentClient,
      turnstileSecretKey,
      body: ctx.body,
    });
  },
});
