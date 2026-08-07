import { AppError } from "./errors"

/**
 * Races a promise against a deadline. supabase-js's underlying `fetch`
 * calls have no built-in timeout (neither does the browser's own `fetch`
 * without an explicit `AbortController`) -- a genuinely stalled connection
 * (a dropped network, a wedged local Postgres connection under load, a
 * proxy that swallows the response) leaves the original promise neither
 * resolving nor rejecting, ever. Without this, the caller's `await` -- and
 * everything downstream of it, like a loading spinner or a disabled submit
 * button -- hangs forever with no error a user could act on. Found via a
 * real, reproducible E2E timeout (WeightScreen's save button never
 * resolved to either its "Saved" state or an error toast) that traced back
 * to exactly this gap -- first patched in useAppData's refetch, then found
 * to be systemic: every direct PostgREST call in lib/api/* (and every Edge
 * Function invocation through api/client.ts) had the identical gap, not
 * just the one this was originally caught on.
 *
 * Takes `PromiseLike<T>`, not `Promise<T>` -- supabase-js's query builders
 * (`PostgrestBuilder` et al.) only implement `.then()`, not the full
 * `Promise` interface, so `Promise<T>` would reject a raw
 * `supabase.from(...)...` chain passed in directly.
 */
export function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AppError("timeout", message))
    }, ms)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

/** Generous bound for a single direct PostgREST query or mutation. */
export const QUERY_TIMEOUT_MS = 15_000

/** Edge Function invocations can legitimately run longer than a single
 * query (AI generation in particular), so these get more room. */
export const FUNCTION_TIMEOUT_MS = 30_000
