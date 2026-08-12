import { redact } from "./redact"

/**
 * Client-side mirror of `_shared/observability/sentry.ts`'s posture: a
 * handful of `fetch` calls against Sentry's envelope ingestion API, not the
 * `@sentry/*` SDK -- same "plain fetch over a dependency" reasoning
 * (ADR-0023), and the same reason it matters more here: this app just spent
 * real effort code-splitting the bundle down (see the perf commit), and
 * `@sentry/react` alone is well over 100KB before any of its optional
 * integrations, which would undo a meaningful share of that.
 *
 * Config-gated and fails silent: with no `VITE_SENTRY_DSN` set, every call
 * is a no-op -- local dev and a fresh deploy before a Sentry project exists
 * should never require one to run. Wired into ErrorBoundary as the
 * catch-all last line of defense; console.error stays too (see that
 * component's own doc comment) since a reporting call failing must never be
 * the only place an error was visible.
 */

export interface SentryReporter {
  captureException(error: unknown, context: Record<string, unknown>): void
}

interface ParsedDsn {
  publicKey: string
  host: string
  projectId: string
}

function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn)
    const publicKey = url.username
    const projectId = url.pathname.replace(/^\//, "")
    if (publicKey === "" || projectId === "") return null
    return { publicKey, host: url.host, projectId }
  } catch {
    return null
  }
}

const NOOP_REPORTER: SentryReporter = { captureException: () => {} }

export interface SentryReporterOptions {
  environment: string
  fetchImpl?: typeof fetch
}

export function createSentryReporter(
  dsn: string | undefined,
  options: SentryReporterOptions,
): SentryReporter {
  if (!dsn || dsn.trim() === "") return NOOP_REPORTER

  const parsed = parseDsn(dsn)
  if (parsed === null) return NOOP_REPORTER

  const fetchImpl = options.fetchImpl ?? fetch
  const ingestUrl = `https://${parsed.host}/api/${parsed.projectId}/envelope/`

  return {
    captureException(error, context) {
      const eventId = crypto.randomUUID().replace(/-/g, "")
      const timestamp = new Date().toISOString()
      const isError = error instanceof Error

      const event = {
        event_id: eventId,
        timestamp,
        platform: "javascript",
        environment: options.environment,
        level: "error",
        request: {
          url: typeof location !== "undefined" ? location.href : undefined,
          headers: {
            "User-Agent":
              typeof navigator !== "undefined"
                ? navigator.userAgent
                : undefined,
          },
        },
        exception: {
          values: [
            {
              type: isError ? error.name : "Error",
              value: isError ? error.message : String(error),
              // Not real symbolication (no source-map upload pipeline here) --
              // one frame carrying the raw stack string is enough to find the
              // failure in Sentry's UI, matching the backend reporter's own
              // deliberate simplification for the same reason.
              stacktrace:
                isError && error.stack
                  ? { frames: [{ filename: "web", function: error.stack }] }
                  : undefined,
            },
          ],
        },
        extra: redact(context),
      }

      const envelopeHeader = JSON.stringify({
        event_id: eventId,
        sent_at: timestamp,
      })
      const itemHeader = JSON.stringify({ type: "event" })
      const body = `${envelopeHeader}\n${itemHeader}\n${JSON.stringify(event)}\n`
      const authHeader =
        `Sentry sentry_version=7, sentry_client=health-garden-web/1.0, ` +
        `sentry_key=${parsed.publicKey}`

      fetchImpl(ingestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-sentry-envelope",
          "X-Sentry-Auth": authHeader,
        },
        body,
        keepalive: true,
      }).catch(() => {})
    },
  }
}
