/**
 * Auth for cron-triggered Edge Functions (Blueprint §4.6).
 *
 * `notify-inactive-users`, `gemini-quota-watchdog`, and `payment-reconciliation`
 * are called only by `invoke_edge_function()` (migration 0011), never by a
 * user -- there is no "who" to resolve a session for, only "the scheduler."
 * This is a different situation from `payments-approve-intent` (ADR-0025),
 * which needs a real, attributable founder identity: checking the caller's
 * bearer token against the service-role key directly is the correct
 * mechanism here, not a workaround, because that is genuinely what
 * authenticates the request (the same key `invoke_edge_function()` sends).
 *
 * These endpoints use `auth: 'none'` in the kernel (skipping user-JWT
 * resolution entirely, the same as `/health`) and call `isServiceRoleCaller`
 * as the first thing their handler does.
 */

import { extractBearerToken } from '../auth/context.ts';

/** XOR-accumulate comparison -- deliberately not `===`, so a mismatch takes
 * the same time regardless of where the first differing byte falls. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** True only if the request's Authorization bearer token exactly matches
 * the configured service-role key. */
export function isServiceRoleCaller(request: Request, serviceRoleKey: string): boolean {
  const token = extractBearerToken(request.headers.get('Authorization'));
  if (token === null) return false;
  return timingSafeEqual(token, serviceRoleKey);
}
