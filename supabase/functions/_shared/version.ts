/**
 * API versioning (Blueprint §6.1).
 *
 * Two independent version axes exist and must not be conflated:
 *
 *  1. TRANSPORT version — the `/functions/v1/*` path segment, owned by the
 *     Supabase platform. It changes only if Supabase changes its invoke path.
 *
 *  2. CONTRACT version — this module. It identifies the request/response shape
 *     Health Garden itself promises. Clients send `X-HG-API-Version`; the server
 *     echoes it back so a mismatch is diagnosable from logs alone rather than
 *     surfacing as an unexplained parse failure on the device.
 *
 * A breaking contract change is additive: introduce v2 handling alongside v1 and
 * retire v1 only once telemetry shows no clients on it. For the database, the
 * equivalent strategy is a new Postgres schema (`api_v2`) rather than mutating
 * `public` in place (Blueprint §6.1).
 */

/** Current contract version served by this deployment. */
export const API_VERSION = '1' as const;

/** Contract versions this deployment still accepts. */
export const SUPPORTED_API_VERSIONS: readonly string[] = ['1'];

/** Request header a client uses to declare the contract version it expects. */
export const API_VERSION_HEADER = 'X-HG-API-Version';

/** Response header carrying the contract version that actually served a request. */
export const API_VERSION_RESPONSE_HEADER = 'X-HG-API-Version';

/** Response header carrying the correlation id for a request (Blueprint §10.1). */
export const REQUEST_ID_HEADER = 'X-HG-Request-Id';

/**
 * Determines whether a client-declared contract version can be served.
 *
 * An absent version is treated as compatible: early client builds predate the
 * header, and rejecting them would break existing installs for no safety gain.
 */
export function isSupportedApiVersion(version: string | null): boolean {
  if (version === null || version.trim() === '') return true;
  return SUPPORTED_API_VERSIONS.includes(version.trim());
}
