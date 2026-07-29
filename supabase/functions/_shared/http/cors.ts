/**
 * CORS policy for Edge Functions.
 *
 * The web client (Next.js) makes browser-origin requests, so unlike a purely
 * native mobile client, CORS is a real concern here, not just a convenience for
 * local tooling. The permissive `*` origin is still acceptable because every
 * endpoint is independently authenticated (session cookie or JWT, per ADR-020)
 * and authorised by RLS (ADR-006) — CORS is not doing security work here, it is
 * only controlling which browser contexts may *read* a response.
 */

import { API_VERSION_HEADER, REQUEST_ID_HEADER } from '../version.ts';

export const CORS_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': [
    'authorization',
    'x-client-info',
    'apikey',
    'content-type',
    API_VERSION_HEADER.toLowerCase(),
  ].join(', '),
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Expose-Headers': [
    REQUEST_ID_HEADER.toLowerCase(),
    API_VERSION_HEADER.toLowerCase(),
  ].join(', '),
});

/** Builds the response to a CORS preflight request. */
export function buildPreflightResponse(): Response {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
}
