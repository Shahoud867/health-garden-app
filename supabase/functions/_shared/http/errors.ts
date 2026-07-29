/**
 * Typed error taxonomy (Blueprint §6.5, §4.9).
 *
 * Every Edge Function failure resolves to exactly one {@link ErrorCode}, never a
 * bare 500. The contract is `{ error, message }`: `error` is a stable machine
 * token the client branches on, `message` is user-facing copy.
 *
 * Two properties matter and are enforced structurally:
 *
 *  1. `message` is always safe to display. It is written to the product's tone
 *     guardrail — plain and respectful, never alarming (Blueprint NFR-9) —
 *     because this app touches food and body image, where a punitive or panicky
 *     error string does real harm (Blueprint §3.3).
 *
 *  2. Internal diagnostics travel in `details`, which is logged and never
 *     serialised into a response. Stack traces and upstream provider errors
 *     must not leak to a client (OWASP — Security Misconfiguration, §7.10).
 */

/** Stable machine-readable failure tokens. */
export const ErrorCode = {
  /** Request body or parameters failed validation. */
  INVALID_PAYLOAD: 'invalid_payload',
  /** No valid credentials were presented. */
  UNAUTHENTICATED: 'unauthenticated',
  /** Authenticated, but not permitted to perform this action. */
  FORBIDDEN: 'forbidden',
  /** Action requires an active premium subscription (Blueprint §6.2). */
  UPGRADE_REQUIRED: 'upgrade_required',
  /** Daily AI coaching cap exhausted (Blueprint §5.2, ADR-003). */
  DAILY_CAP_REACHED: 'daily_cap_reached',
  /** Weekly AI plan already generated (Blueprint §6.2). */
  ALREADY_GENERATED_THIS_WEEK: 'already_generated_this_week',
  /** Feature disabled at runtime via `app_config` kill switch (ADR-010). */
  FEATURE_DISABLED: 'feature_disabled',
  /** Requested resource does not exist or is not visible to this caller. */
  NOT_FOUND: 'not_found',
  /** HTTP method not permitted for this endpoint. */
  METHOD_NOT_ALLOWED: 'method_not_allowed',
  /** Client-declared API contract version is not served (Blueprint §6.1). */
  UNSUPPORTED_API_VERSION: 'unsupported_api_version',
  /** Too many requests. */
  RATE_LIMITED: 'rate_limited',
  /** A third-party dependency failed or timed out (Blueprint §2.13). */
  UPSTREAM_UNAVAILABLE: 'upstream_unavailable',
  /** Unclassified server-side failure. */
  INTERNAL_ERROR: 'internal_error',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** HTTP status paired with each error code. */
const ERROR_STATUS: Readonly<Record<ErrorCode, number>> = Object.freeze({
  [ErrorCode.INVALID_PAYLOAD]: 400,
  [ErrorCode.UNAUTHENTICATED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.UPGRADE_REQUIRED]: 403,
  [ErrorCode.DAILY_CAP_REACHED]: 429,
  [ErrorCode.ALREADY_GENERATED_THIS_WEEK]: 409,
  [ErrorCode.FEATURE_DISABLED]: 503,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.METHOD_NOT_ALLOWED]: 405,
  [ErrorCode.UNSUPPORTED_API_VERSION]: 400,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.UPSTREAM_UNAVAILABLE]: 503,
  [ErrorCode.INTERNAL_ERROR]: 500,
});

/**
 * Default user-facing copy per code.
 *
 * Deliberately plain: no exclamation marks, no apology spirals, no blame. Each
 * states what happened and what the user can do next (Blueprint §6.5, NFR-9).
 */
const DEFAULT_MESSAGE: Readonly<Record<ErrorCode, string>> = Object.freeze({
  [ErrorCode.INVALID_PAYLOAD]:
    'Some of the details sent were not valid. Please check and try again.',
  [ErrorCode.UNAUTHENTICATED]: 'Please sign in to continue.',
  [ErrorCode.FORBIDDEN]: 'You do not have access to this.',
  [ErrorCode.UPGRADE_REQUIRED]:
    'This is a premium feature. Upgrade to unlock AI coaching and weekly plans.',
  [ErrorCode.DAILY_CAP_REACHED]: "You've reached today's coaching limit — chat again tomorrow.",
  [ErrorCode.ALREADY_GENERATED_THIS_WEEK]:
    'Your plan for this week is already ready. You can generate a new one next week.',
  [ErrorCode.FEATURE_DISABLED]:
    'This feature is temporarily unavailable. Everything else still works.',
  [ErrorCode.NOT_FOUND]: 'We could not find what you were looking for.',
  [ErrorCode.METHOD_NOT_ALLOWED]: 'That action is not supported here.',
  [ErrorCode.UNSUPPORTED_API_VERSION]: 'Please update the app to continue.',
  [ErrorCode.RATE_LIMITED]: 'Too many requests just now. Please wait a moment and try again.',
  [ErrorCode.UPSTREAM_UNAVAILABLE]:
    'A service we rely on is not responding right now. Please try again shortly.',
  [ErrorCode.INTERNAL_ERROR]: 'Something went wrong on our side. Your logged data is safe.',
});

/** The wire format for every error response (Blueprint §6.5). */
export interface ErrorResponseBody {
  readonly error: ErrorCode;
  readonly message: string;
}

/**
 * An application error carrying everything needed to build a safe response.
 *
 * Construct via the {@link Errors} helpers rather than directly, so status and
 * default copy stay consistent across call sites.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  /** User-facing copy. Safe to display verbatim. */
  readonly userMessage: string;
  /** Internal diagnostics. Logged, never serialised into a response. */
  readonly details: Record<string, unknown> | undefined;

  constructor(
    code: ErrorCode,
    options: {
      readonly userMessage?: string;
      readonly details?: Record<string, unknown>;
      readonly cause?: unknown;
    } = {},
  ) {
    const userMessage = options.userMessage ?? DEFAULT_MESSAGE[code];
    // `Error.message` carries the code for log/stack readability; user-facing
    // copy is kept separately so the two can never be confused at a call site.
    super(`${code}: ${userMessage}`);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = ERROR_STATUS[code];
    this.userMessage = userMessage;
    this.details = options.details;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }

  /** Projects this error to its wire representation. */
  toResponseBody(): ErrorResponseBody {
    return { error: this.code, message: this.userMessage };
  }

  /** Type guard usable across module boundaries without `instanceof` pitfalls. */
  static is(value: unknown): value is AppError {
    return value instanceof AppError || (value as AppError | null)?.name === 'AppError';
  }
}

type ErrorOptions = {
  readonly userMessage?: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: unknown;
};

/** Named constructors for each error code. */
export const Errors = {
  invalidPayload: (options?: ErrorOptions): AppError =>
    new AppError(ErrorCode.INVALID_PAYLOAD, options),
  unauthenticated: (options?: ErrorOptions): AppError =>
    new AppError(ErrorCode.UNAUTHENTICATED, options),
  forbidden: (options?: ErrorOptions): AppError => new AppError(ErrorCode.FORBIDDEN, options),
  upgradeRequired: (options?: ErrorOptions): AppError =>
    new AppError(ErrorCode.UPGRADE_REQUIRED, options),
  dailyCapReached: (options?: ErrorOptions): AppError =>
    new AppError(ErrorCode.DAILY_CAP_REACHED, options),
  alreadyGeneratedThisWeek: (options?: ErrorOptions): AppError =>
    new AppError(ErrorCode.ALREADY_GENERATED_THIS_WEEK, options),
  featureDisabled: (options?: ErrorOptions): AppError =>
    new AppError(ErrorCode.FEATURE_DISABLED, options),
  notFound: (options?: ErrorOptions): AppError => new AppError(ErrorCode.NOT_FOUND, options),
  methodNotAllowed: (options?: ErrorOptions): AppError =>
    new AppError(ErrorCode.METHOD_NOT_ALLOWED, options),
  unsupportedApiVersion: (options?: ErrorOptions): AppError =>
    new AppError(ErrorCode.UNSUPPORTED_API_VERSION, options),
  rateLimited: (options?: ErrorOptions): AppError => new AppError(ErrorCode.RATE_LIMITED, options),
  upstreamUnavailable: (options?: ErrorOptions): AppError =>
    new AppError(ErrorCode.UPSTREAM_UNAVAILABLE, options),
  internal: (options?: ErrorOptions): AppError => new AppError(ErrorCode.INTERNAL_ERROR, options),
} as const;

/**
 * Normalises any thrown value into an {@link AppError}.
 *
 * Unrecognised throws collapse to `internal_error` with the original preserved
 * in `details` for logging — a client never sees the underlying message, which
 * may embed connection strings or upstream provider internals.
 */
export function toAppError(thrown: unknown): AppError {
  if (AppError.is(thrown)) return thrown;

  if (thrown instanceof Error) {
    return Errors.internal({
      details: { originalName: thrown.name, originalMessage: thrown.message },
      cause: thrown,
    });
  }

  return Errors.internal({ details: { thrown: String(thrown) } });
}
