/**
 * Cloudflare Turnstile server-side verification (Blueprint §7.12, closes G-20).
 *
 * Not wired into any endpoint yet — Phase 4 builds and tests this in isolation;
 * Phase 5's `payments-submit-intent` (and the web client's signup form, once it
 * exists) are its first real callers. Kept independent of the shared
 * fail-fast `AppConfig` (config/env.ts) deliberately: most endpoints — `/health`
 * included — have no reason to require `TURNSTILE_SECRET_KEY` at cold start,
 * so only the handful of endpoints that actually gate on Turnstile should ever
 * be able to fail to boot over it.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerifyOptions {
  /** The site's secret key (SECRET — server-side only, Blueprint §7.4/§9.4). */
  readonly secretKey: string;
  /** The token the client submitted from the Turnstile widget response. */
  readonly token: string;
  /** The caller's IP, if available — Cloudflare uses it as an extra signal. */
  readonly remoteIp?: string;
  /** Injectable for tests; defaults to the ambient `fetch`. */
  readonly fetchImpl?: typeof fetch;
}

export interface TurnstileVerifyResult {
  readonly success: boolean;
  /** Cloudflare's machine-readable failure reasons, e.g. `timeout-or-duplicate`. */
  readonly errorCodes: readonly string[];
}

interface TurnstileApiResponse {
  readonly success: boolean;
  readonly ['error-codes']?: readonly string[];
}

/**
 * Verifies a Turnstile token against Cloudflare's siteverify endpoint.
 *
 * Fails closed: any network error, non-2xx response, or malformed body is
 * treated as a failed verification rather than thrown past the caller —
 * bot-gating an endpoint should never itself become the reason a legitimate
 * request 500s. Callers that need to distinguish "Cloudflare is down" from
 * "this token is invalid" for their own alerting can inspect `errorCodes`.
 */
export async function verifyTurnstileToken(
  options: TurnstileVerifyOptions,
): Promise<TurnstileVerifyResult> {
  const { secretKey, token, remoteIp, fetchImpl = fetch } = options;

  if (token.trim() === '') {
    return { success: false, errorCodes: ['missing-input-response'] };
  }

  const body = new URLSearchParams({ secret: secretKey, response: token });
  if (remoteIp !== undefined && remoteIp !== '') {
    body.set('remoteip', remoteIp);
  }

  try {
    const response = await fetchImpl(VERIFY_URL, { method: 'POST', body });
    if (!response.ok) {
      return { success: false, errorCodes: [`http-${response.status}`] };
    }

    const parsed = (await response.json()) as TurnstileApiResponse;
    return {
      success: parsed.success === true,
      errorCodes: parsed['error-codes'] ?? [],
    };
  } catch {
    return { success: false, errorCodes: ['network-error'] };
  }
}
