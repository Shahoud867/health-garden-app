import { AuthApiError } from "@supabase/supabase-js"

/**
 * One error shape for the whole app. Every function in `lib/api/*` throws
 * this (never a raw Supabase/Postgrest/fetch error) so every screen can
 * catch one type and show `error.message` directly, regardless of whether
 * the failure came from PostgREST, an Edge Function, Supabase Auth, or the
 * network.
 */
export class AppError extends Error {
  /** Machine-readable — matches an Edge Function's `error` field (§6.5) where one exists. */
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = "AppError"
    this.code = code
  }
}

/**
 * Every Edge Function returns `{error, message}` on failure (§6.5) — this is
 * the shape `supabase.functions.invoke` surfaces on a non-2xx response
 * (as `error.context`, once parsed), and also what a Postgrest error's
 * `.message`/`.code` roughly maps to. Centralizing the mapping here means an
 * Edge Function can add a new error code without any screen needing to
 * change.
 */
export function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) return err

  // Supabase Auth errors carry a stable `.code` since supabase-js v2.
  if (err instanceof AuthApiError) {
    return new AppError(err.code ?? "auth_error", humanizeAuthError(err))
  }

  if (isPostgrestLikeError(err)) {
    return new AppError(
      err.code || "database_error",
      humanizePostgrestError(err),
    )
  }

  // supabase.functions.invoke rejects with a FunctionsHttpError whose
  // `.context` is the Response; the body is the Edge Function's own
  // {error, message} JSON, but reading it requires an async call the
  // synchronous catch site doesn't have. `invokeFunction` in `api/client.ts`
  // reads it eagerly and throws AppError directly, so this branch is the
  // fallback for anything that slips through un-parsed.
  if (err instanceof Error) {
    if (
      err.message === "Failed to fetch" ||
      err.message.includes("NetworkError")
    ) {
      return new AppError(
        "network_error",
        "Could not reach the server — check your connection and try again.",
      )
    }
    return new AppError("unknown_error", err.message)
  }

  return new AppError(
    "unknown_error",
    "Something went wrong. Please try again.",
  )
}

interface PostgrestLikeError {
  message: string
  code?: string
  details?: string | null
  hint?: string | null
}

function isPostgrestLikeError(err: unknown): err is PostgrestLikeError {
  // `PostgrestError` (@supabase/postgrest-js) genuinely extends `Error` and
  // always carries a `.code` string -- a network `TypeError` ("Failed to
  // fetch") or a plain `Error` never do. Requiring `'code' in err` is what
  // keeps those from being misrouted through this branch before they ever
  // reach the `instanceof Error` network-error check below: caught by a
  // unit test (tests/unit/errors.test.ts) that construed a real TypeError
  // and found it was silently swallowed here, never reaching that check.
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string" &&
    "code" in err
  )
}

function humanizeAuthError(err: AuthApiError): string {
  switch (err.code) {
    case "invalid_credentials":
      return "That email or password is incorrect."
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists — try logging in instead."
    case "weak_password":
      return "That password is too weak — use at least 8 characters."
    case "email_not_confirmed":
      return "Please confirm your email before logging in — check your inbox."
    case "over_request_rate_limit":
      return "Too many attempts — please wait a moment and try again."
    default:
      return err.message
  }
}

function humanizePostgrestError({ code, message }: PostgrestLikeError): string {
  // Postgres CHECK/NOT NULL/UNIQUE violations surface with these SQLSTATEs;
  // RLS denial surfaces as PostgREST's own 'PGRST301'/42501. None of these
  // should ever show raw SQL to a user.
  switch (code) {
    case "23505":
      return "That entry already exists."
    case "23514":
    case "23502":
      return "Some of the values entered are not valid — please check and try again."
    case "42501":
    case "PGRST301":
      return "You don't have permission to do that."
    default:
      return message || "Something went wrong saving that."
  }
}
