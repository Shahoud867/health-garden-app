import { env } from "./env"
import { createPostHogClient } from "./observability/posthog"
import { createSentryReporter } from "./observability/sentry"

/**
 * The one call site every screen/hook reaches for instead of importing
 * `observability/{posthog,sentry}.ts` directly -- owns the anonymous/real
 * distinct-id switch so call sites never have to think about it.
 *
 * Both underlying clients are already no-ops without a configured key
 * (see their own doc comments); this file adds nothing that changes that --
 * `track()`/`reportError()` are always safe to call, everywhere, whether or
 * not analytics/error-reporting are actually wired up in this environment.
 */

const ANON_ID_KEY = "hg_anon_id"

function getOrCreateAnonId(): string {
  try {
    const existing = localStorage.getItem(ANON_ID_KEY)
    if (existing) return existing
    const created = crypto.randomUUID()
    localStorage.setItem(ANON_ID_KEY, created)
    return created
  } catch {
    // localStorage unavailable (private browsing in some browsers, or a
    // security policy) -- a fresh id per call still lets capture() work,
    // just without cross-call correlation for this one visitor.
    return crypto.randomUUID()
  }
}

let currentUserId: string | null = null

const posthog = createPostHogClient(env.posthogApiKey, {
  host: env.posthogHost,
})

const sentry = createSentryReporter(env.sentryDsn, {
  environment: import.meta.env.MODE,
})

/** Call once a real user id is known (post-login/signup) so subsequent
 * events attribute to them instead of the anonymous pre-auth id. */
export function identify(userId: string): void {
  currentUserId = userId
}

/** Call on logout -- events after this go back to a fresh anonymous id
 * rather than continuing to attribute to the account that just signed out. */
export function resetIdentity(): void {
  currentUserId = null
}

export function track(
  event: string,
  properties?: Record<string, unknown>,
): void {
  posthog.capture(event, currentUserId ?? getOrCreateAnonId(), properties)
}

export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  sentry.captureException(error, {
    ...context,
    userId: currentUserId ?? undefined,
  })
}
