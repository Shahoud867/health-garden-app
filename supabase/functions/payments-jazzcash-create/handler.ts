/**
 * Real-time JazzCash checkout — creation side (ADR-0028; the "Pakistan
 * wallet gateway" path chosen over Merchant-of-Record precisely because it
 * covers the local wallet rails `payments-submit-intent`'s manual flow
 * already asks users to transfer to — see `_shared/payments/jazzcash.ts`
 * for the hash algorithm this leans on).
 *
 * The other half is `payments-jazzcash-webhook`, which runs under a
 * completely different trust model: this endpoint requires a real
 * Supabase session, the webhook has none (JazzCash calls it directly, with
 * no way to carry a Supabase bearer token) and is secured entirely by
 * `pp_SecureHash` instead — the same "different trust level, different
 * function" split `payments-submit-intent`/`payments-approve-intent`
 * already established.
 *
 * The charge amount is a fixed, server-side constant, never taken from the
 * request body — a client that could name its own price is a client that
 * could buy premium for one rupee. `payments-submit-intent`'s `amountPkr`
 * body field predates this endpoint and is a pre-existing gap in the manual
 * flow (a founder reviews every submission by hand there, so a mismatched
 * amount is caught by a human before any subscription activates) — not a
 * pattern worth repeating here, where activation is fully automatic.
 */

import { defineEndpoint } from '../_shared/http/endpoint.ts';
import { Errors } from '../_shared/http/errors.ts';
import { createServiceRoleClient } from '../_shared/auth/context.ts';
import {
  buildCheckoutFields,
  type CheckoutRequestFields,
  checkoutUrlFor,
  generateTxnRefNo,
  type JazzCashCredentials,
} from '../_shared/payments/jazzcash.ts';

/** PKR 299/month — the same fixed price already shown to the user on
 * `PricingScreen`/`PremiumScreen` and sent (client-supplied, but
 * human-reviewed) through the manual flow's `amountPkr` field. Kept as one
 * named constant here rather than read from a table: changing the real
 * price is a product decision that should touch this line under review,
 * not a runtime toggle a compromised config row could silently alter. */
export const PREMIUM_PRICE_PKR = 299;

export interface CreateCheckoutResponse {
  readonly checkoutUrl: string;
  readonly fields: CheckoutRequestFields;
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

export interface InsertTransactionClient {
  from(table: string): {
    insert(row: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
  };
}

/** Reads and validates the four JazzCash secrets directly from the
 * environment, matching `payments-submit-intent`'s precedent for
 * feature-specific secrets: most endpoints have no reason to require these
 * at cold start, so only this handler and the webhook should be able to
 * fail to boot over them (`_shared/config/env.ts`'s own reasoning, applied
 * the same way here). */
export function readJazzCashCredentials(env: (key: string) => string | undefined): {
  readonly credentials: JazzCashCredentials;
  readonly returnUrl: string;
} {
  const merchantId = env('JAZZCASH_MERCHANT_ID');
  const password = env('JAZZCASH_PASSWORD');
  const integritySalt = env('JAZZCASH_INTEGRITY_SALT');
  const mode = env('JAZZCASH_MODE');
  const returnUrl = env('JAZZCASH_RETURN_URL');

  if (
    merchantId === undefined || merchantId.trim() === '' ||
    password === undefined || password.trim() === '' ||
    integritySalt === undefined || integritySalt.trim() === '' ||
    returnUrl === undefined || returnUrl.trim() === ''
  ) {
    throw Errors.internal({ details: { step: 'missing_jazzcash_config' } });
  }
  if (mode !== 'sandbox' && mode !== 'production') {
    throw Errors.internal({ details: { step: 'invalid_jazzcash_mode', received: mode } });
  }

  return {
    credentials: {
      merchantId: merchantId.trim(),
      password: password.trim(),
      integritySalt: integritySalt.trim(),
      mode,
    },
    returnUrl: returnUrl.trim(),
  };
}

export async function createJazzCashCheckout(deps: {
  readonly userDb: ProfileLookupClient;
  readonly serviceDb: InsertTransactionClient;
  readonly credentials: JazzCashCredentials;
  readonly returnUrl: string;
}): Promise<CreateCheckoutResponse> {
  const { userDb, serviceDb, credentials, returnUrl } = deps;

  const { data: profileRows, error: profileError } = await userDb.from('users').select('id');
  const profile = (profileRows?.[0] as unknown as ProfileRow | undefined) ?? null;
  if (profileError !== null || profile === null) {
    throw Errors.internal({ details: { step: 'resolve_profile', message: profileError?.message } });
  }

  const txnRefNo = generateTxnRefNo();

  const { error: insertError } = await serviceDb.from('payment_gateway_transactions').insert({
    user_id: profile.id,
    provider: 'jazzcash',
    txn_ref_no: txnRefNo,
    amount_pkr: PREMIUM_PRICE_PKR,
    status: 'initiated',
  });
  if (insertError !== null) {
    throw Errors.internal({
      details: { step: 'insert_transaction', message: insertError.message },
    });
  }

  const fields = await buildCheckoutFields({
    credentials,
    amountPkr: PREMIUM_PRICE_PKR,
    txnRefNo,
    billReference: txnRefNo,
    description: 'Health Garden Premium — 30 days',
    returnUrl,
  });

  return { checkoutUrl: checkoutUrlFor(credentials.mode), fields };
}

export const handlePaymentsJazzCashCreate = defineEndpoint<undefined, CreateCheckoutResponse>({
  name: 'payments-jazzcash-create',
  methods: ['POST'],
  auth: 'required',
  handler: (ctx) => {
    const { credentials, returnUrl } = readJazzCashCredentials((key) => Deno.env.get(key));
    return createJazzCashCheckout({
      userDb: ctx.auth!.db as unknown as ProfileLookupClient,
      serviceDb: createServiceRoleClient(ctx.config) as unknown as InsertTransactionClient,
      credentials,
      returnUrl,
    });
  },
});
