/**
 * Response construction (Blueprint §6.5).
 *
 * All responses are built here so that correlation headers, contract version,
 * CORS, and cache directives are applied uniformly. A handler that constructs a
 * bare `new Response()` bypasses observability and is treated as a defect.
 *
 * Every response defaults to `Cache-Control: no-store`. This is not incidental:
 * it is half of the rendering/caching-safety rule (Blueprint §4.11, ADR-021) —
 * an Edge Function response must never be cacheable by a shared layer, since it
 * is frequently user-scoped data. The other half (Next.js route rendering mode)
 * is enforced when the web client is built (Phase 5+).
 */

import { CORS_HEADERS } from './cors.ts';
import { AppError, type ErrorResponseBody } from './errors.ts';
import { API_VERSION, API_VERSION_RESPONSE_HEADER, REQUEST_ID_HEADER } from '../version.ts';

export interface ResponseMeta {
  readonly requestId: string;
  /** Extra headers merged last; may override defaults when deliberate. */
  readonly headers?: Record<string, string>;
}

function baseHeaders(requestId: string, extra?: Record<string, string>): Headers {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    // Responses are user-scoped and must never be reused across identities by
    // an intermediary cache (Blueprint §7, §4.11, ADR-021).
    'Cache-Control': 'private, no-store',
    // Defensive hardening for any future browser-based consumer.
    'X-Content-Type-Options': 'nosniff',
    [REQUEST_ID_HEADER]: requestId,
    [API_VERSION_RESPONSE_HEADER]: API_VERSION,
    ...CORS_HEADERS,
  });
  if (extra !== undefined) {
    for (const [key, value] of Object.entries(extra)) headers.set(key, value);
  }
  return headers;
}

/** Builds a success response with a JSON body. */
export function jsonResponse<T>(body: T, meta: ResponseMeta, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: baseHeaders(meta.requestId, meta.headers),
  });
}

/** Builds a 204 response with no body. */
export function noContentResponse(meta: ResponseMeta): Response {
  return new Response(null, { status: 204, headers: baseHeaders(meta.requestId, meta.headers) });
}

/** Builds the `{ error, message }` response for an {@link AppError}. */
export function errorResponse(error: AppError, meta: ResponseMeta): Response {
  const body: ErrorResponseBody = error.toResponseBody();
  return new Response(JSON.stringify(body), {
    status: error.httpStatus,
    headers: baseHeaders(meta.requestId, meta.headers),
  });
}
