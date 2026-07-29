/**
 * The Edge Function kernel: a declarative endpoint factory.
 *
 * This is the closest thing the system has to a "backend framework" (see
 * ADR-0023 for why a framework was rejected in favour of this), and it is
 * deliberately small. The blueprint's operating constraint is a two-person,
 * part-time team (NFR-7), so the design goal was the least machinery that still
 * guarantees every endpoint gets correlation ids, structured logging, a typed
 * error envelope, validation, CORS, and auth — uniformly, without each function
 * re-implementing them and drifting.
 *
 * A configuration object was chosen over a chained middleware pipeline. Chained
 * middleware is more flexible, but expressing "this middleware adds `auth` to
 * the context" in the type system requires generic gymnastics that make the
 * resulting compiler errors difficult to read. A declarative shape gives the
 * same guarantees with types a newcomer can follow (KISS, YAGNI).
 *
 * Cross-cutting concerns are applied in a fixed order — CORS, version, method,
 * auth, body validation, handler — because that order is itself a security
 * property: rejecting on method and credentials happens before any request body
 * is parsed, so unauthenticated callers cannot reach the parser.
 */

import type { ZodType } from '../deps.ts';
import { type AppConfig, getConfig } from '../config/env.ts';
import { createLogger, type Logger } from '../observability/logger.ts';
import { type AuthContext, resolveAuthContext } from '../auth/context.ts';
import { AppError, Errors, toAppError } from './errors.ts';
import { errorResponse, jsonResponse, noContentResponse } from './response.ts';
import { buildPreflightResponse } from './cors.ts';
import { API_VERSION_HEADER, isSupportedApiVersion } from '../version.ts';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/** Authentication requirement for an endpoint. */
export type AuthRequirement =
  /** Reject the request unless a valid session is presented. */
  | 'required'
  /** Resolve a session when present; proceed anonymously otherwise. */
  | 'optional'
  /** Do not attempt resolution. For public probes only. */
  | 'none';

/** Everything a handler receives. */
export interface EndpointContext<TBody> {
  readonly req: Request;
  readonly url: URL;
  /** Correlation id, echoed to the client and present on every log record. */
  readonly requestId: string;
  readonly logger: Logger;
  readonly config: AppConfig;
  /** Validated body. `undefined` when the endpoint declares no schema. */
  readonly body: TBody;
  /** Non-null whenever `auth` is `'required'`. */
  readonly auth: AuthContext | null;
}

/**
 * What a handler may return.
 *
 * Generic over the payload rather than fixed to `Record<string, unknown>`: a
 * TypeScript `interface` has no implicit index signature, so a concrete response
 * interface would not satisfy that constraint and every handler would be forced
 * to widen its return type — discarding exactly the type information worth
 * keeping. Parameterising instead lets each endpoint declare a precise response
 * shape that flows through to callers.
 */
export type HandlerResult<TResult> = Response | TResult | null | void;

export interface EndpointConfig<TBody, TResult> {
  /** Stable identifier used in logs and metrics. Conventionally the route name. */
  readonly name: string;
  readonly methods: readonly HttpMethod[];
  readonly auth: AuthRequirement;
  /**
   * Schema for the JSON request body.
   *
   * Validation runs before the handler, so a handler never sees an unvalidated
   * shape — defence in depth beneath Postgres CHECK constraints (Blueprint §6.3).
   */
  readonly bodySchema?: ZodType<TBody>;
  readonly handler: (
    ctx: EndpointContext<TBody>,
  ) => Promise<HandlerResult<TResult>> | HandlerResult<TResult>;
}

/** Generates a correlation id, preferring the platform-provided one. */
function resolveRequestId(request: Request): string {
  return (
    request.headers.get('x-request-id') ??
      request.headers.get('sb-request-id') ??
      crypto.randomUUID()
  );
}

async function parseAndValidateBody<TBody>(
  request: Request,
  schema: ZodType<TBody> | undefined,
): Promise<TBody> {
  if (schema === undefined) return undefined as TBody;

  let raw: unknown;
  try {
    const text = await request.text();
    raw = text.trim() === '' ? {} : JSON.parse(text);
  } catch (cause) {
    throw Errors.invalidPayload({
      userMessage: 'We could not read that request. Please try again.',
      details: { reason: 'malformed_json' },
      cause,
    });
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    // Field paths are safe to log (they are schema metadata, not user values)
    // and are the difference between a debuggable 400 and a guessing game.
    throw Errors.invalidPayload({
      details: {
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
        })),
      },
    });
  }

  return result.data;
}

function toResponse(result: unknown, requestId: string): Response {
  if (result instanceof Response) return result;
  if (result === null || result === undefined) return noContentResponse({ requestId });
  return jsonResponse(result, { requestId });
}

/**
 * Builds a fully-wrapped request handler from a declarative configuration.
 *
 * @example
 * ```ts
 * Deno.serve(defineEndpoint({
 *   name: 'ai-chat',
 *   methods: ['POST'],
 *   auth: 'required',
 *   bodySchema: z.object({ message: z.string().min(1).max(2000) }),
 *   handler: async (ctx) => ({ reply: await coach(ctx.auth!.db, ctx.body.message) }),
 * }));
 * ```
 */
export function defineEndpoint<TBody = undefined, TResult = unknown>(
  endpoint: EndpointConfig<TBody, TResult>,
): (request: Request) => Promise<Response> {
  return async function handleRequest(request: Request): Promise<Response> {
    // Preflight is answered before anything else: it carries no credentials and
    // must not be subjected to auth or version checks.
    if (request.method === 'OPTIONS') return buildPreflightResponse();

    const requestId = resolveRequestId(request);
    const startedAt = Date.now();

    let logger: Logger = createLogger({ level: 'info' });
    let config: AppConfig;

    try {
      config = getConfig();
      logger = createLogger({
        level: config.logLevel,
        baseContext: {
          request_id: requestId,
          endpoint: endpoint.name,
          method: request.method,
          environment: config.environment,
        },
      });
    } catch (cause) {
      // Misconfiguration is an operator fault, not a caller fault. Surface it
      // loudly in logs; return an opaque 500 so nothing about the environment
      // leaks to the client (Blueprint §7.10).
      logger.error('configuration_error', { error: cause });
      return errorResponse(toAppError(cause), { requestId });
    }

    try {
      const url = new URL(request.url);

      if (!isSupportedApiVersion(request.headers.get(API_VERSION_HEADER))) {
        throw Errors.unsupportedApiVersion({
          details: { requested: request.headers.get(API_VERSION_HEADER) },
        });
      }

      if (!endpoint.methods.includes(request.method as HttpMethod)) {
        throw Errors.methodNotAllowed({
          details: { received: request.method, allowed: endpoint.methods },
        });
      }

      let auth: AuthContext | null = null;
      if (endpoint.auth !== 'none') {
        auth = await resolveAuthContext(request, config);
        if (auth === null && endpoint.auth === 'required') {
          throw Errors.unauthenticated({ details: { reason: 'missing_bearer_token' } });
        }
      }

      // Bind the caller to the log stream. `auth_id` is a pseudonymous UUID, not
      // a direct identifier, so it is safe to record and is what makes a
      // production incident traceable to a single account (Blueprint §7.9).
      if (auth !== null) {
        logger = logger.child({ auth_id: auth.authId });
      }

      logger.debug('request_received');

      const body = await parseAndValidateBody(request, endpoint.bodySchema);
      const result = await endpoint.handler({
        req: request,
        url,
        requestId,
        logger,
        config,
        body,
        auth,
      });

      const response = toResponse(result, requestId);
      logger.info('request_completed', {
        status: response.status,
        duration_ms: Date.now() - startedAt,
      });
      return response;
    } catch (thrown) {
      const appError = toAppError(thrown);
      const duration = Date.now() - startedAt;

      // 5xx indicates a fault we own; 4xx is expected traffic (a cap hit, a
      // stale client) and would otherwise generate alert noise at volume.
      const logAtErrorLevel = appError.httpStatus >= 500;
      const record = {
        error_code: appError.code,
        status: appError.httpStatus,
        duration_ms: duration,
        details: appError.details,
        ...(logAtErrorLevel ? { error: appError.cause ?? appError } : {}),
      };

      if (logAtErrorLevel) logger.error('request_failed', record);
      else logger.warn('request_rejected', record);

      return errorResponse(appError, { requestId });
    }
  };
}

export { AppError, Errors };
