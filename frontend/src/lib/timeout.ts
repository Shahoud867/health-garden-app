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
 * to exactly this gap in useAppData's refetch, not a bug in the query
 * itself.
 */
export function withTimeout<T>(
  promise: Promise<T>,
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
