import { FunctionsHttpError } from "@supabase/supabase-js"
import { supabase } from "../supabase"
import { AppError, normalizeError } from "../errors"
import { withTimeout, FUNCTION_TIMEOUT_MS } from "../timeout"

/**
 * Calls a custom Edge Function (§6.2) and unwraps its `{error, message}`
 * failure convention (§6.5) into an `AppError` — the one place that shape is
 * parsed, so every `lib/api/*` caller just gets a typed success value or a
 * thrown `AppError`.
 *
 * `supabase.functions.invoke` already attaches the caller's JWT from the
 * persisted session automatically; nothing here handles auth headers.
 *
 * Wrapped in `withTimeout` -- this is the single chokepoint every Edge
 * Function call (ai-chat, ai-plan-generate, payments-submit-intent,
 * account-export, account-delete) goes through, so one wrap covers all of
 * them (see lib/timeout.ts's doc comment for why this exists at all).
 */
export async function invokeFunction<TResponse>(
  name: string,
  body?: Record<string, unknown>,
  options?: { method?: "GET" | "POST" },
): Promise<TResponse> {
  const { data, error } = await withTimeout(
    supabase.functions.invoke<TResponse>(name, {
      body,
      method: options?.method,
    }),
    FUNCTION_TIMEOUT_MS,
    "The server took too long to respond — please check your connection and try again.",
  )

  if (error) {
    if (error instanceof FunctionsHttpError) {
      // The Edge Function's own JSON body ({error, message} — §6.5) is on
      // the raw Response, one async step away from the SDK's synchronous
      // error object.
      try {
        const body = (await error.context.json()) as {
          error?: string
          message?: string
        }
        if (body?.message) {
          throw new AppError(body.error ?? "function_error", body.message)
        }
      } catch (parseErr) {
        if (parseErr instanceof AppError) throw parseErr
        // Body wasn't JSON (e.g. a gateway timeout HTML page) — fall through
        // to the generic normalizer below.
      }
    }
    throw normalizeError(error)
  }

  if (data === null || data === undefined) {
    throw new AppError(
      "empty_response",
      "The server returned an empty response.",
    )
  }

  return data
}
