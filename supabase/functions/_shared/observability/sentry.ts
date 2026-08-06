/**
 * Minimal Sentry error reporting (Blueprint ADR-013's observability stack —
 * Sentry + PostHog + UptimeRobot + Retool).
 *
 * A handful of `fetch` calls against Sentry's envelope ingestion API, not the
 * `@sentry/*` SDK — the same "plain fetch over an SDK dependency" reasoning
 * already applied to Gemini and Turnstile (ADR-0023, `gemini-provider.ts`'s
 * own doc comment): Sentry's envelope format is a specific JSON/text shape,
 * not a cryptographic protocol the way VAPID/Web Push genuinely was (which
 * *did* pull in a real library, `web-push`, for exactly that reason).
 *
 * Config-gated and fails silent, not fails closed: with no `SENTRY_DSN` set,
 * every call is a no-op. Nothing about local dev, CI, or a fresh deploy
 * before a Sentry project exists should ever require one to function —
 * error reporting is an operational nicety layered on top of the logger
 * (still the source of truth, per `logger.ts`'s own doc comment), never a
 * dependency the request path can fail on. The one real HTTP call this makes
 * is deliberately fire-and-forget: reporting an error must never become a
 * second way for a request to hang or fail differently than it already has.
 */

import { redact } from './logger.ts';

export interface SentryReporter {
  captureException(error: unknown, context: Record<string, unknown>): void;
}

interface ParsedDsn {
  readonly publicKey: string;
  readonly host: string;
  readonly projectId: string;
}

/** A Sentry DSN is `https://<public_key>@<host>/<project_id>` — parsed with
 * the platform URL parser rather than a hand-rolled regex, and never throws:
 * a malformed DSN degrades to no-op reporting, not a cold-start failure. */
function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\//, '');
    if (publicKey === '' || projectId === '') return null;
    return { publicKey, host: url.host, projectId };
  } catch {
    return null;
  }
}

const NOOP_REPORTER: SentryReporter = {
  captureException: () => {},
};

export interface SentryReporterOptions {
  readonly environment: string;
  readonly fetchImpl?: typeof fetch;
}

/**
 * Builds a reporter for the given DSN, or a no-op when unset/malformed.
 *
 * Reuses `logger.ts`'s own `redact()` on the context before it ever leaves
 * the process — this system logs diagnosed conditions, weight, and food
 * intake (Blueprint NFR-6); an error-reporting side channel that bypassed
 * the logger's redaction would quietly reopen the exact leak that module
 * exists to close.
 */
export function createSentryReporter(
  dsn: string | undefined,
  options: SentryReporterOptions,
): SentryReporter {
  if (dsn === undefined || dsn.trim() === '') return NOOP_REPORTER;

  const parsed = parseDsn(dsn);
  if (parsed === null) return NOOP_REPORTER;

  const fetchImpl = options.fetchImpl ?? fetch;
  const ingestUrl = `https://${parsed.host}/api/${parsed.projectId}/envelope/`;

  return {
    captureException(error, context): void {
      const eventId = crypto.randomUUID().replace(/-/g, '');
      const timestamp = new Date().toISOString();

      const isError = error instanceof Error;
      const event = {
        event_id: eventId,
        timestamp,
        platform: 'other',
        environment: options.environment,
        level: 'error',
        exception: {
          values: [
            {
              type: isError ? error.name : 'Error',
              value: isError ? error.message : String(error),
              stacktrace: isError && error.stack !== undefined
                ? { frames: [{ filename: 'edge-function', function: error.stack }] }
                : undefined,
            },
          ],
        },
        extra: redact(context),
      };

      const envelopeHeader = JSON.stringify({ event_id: eventId, sent_at: timestamp });
      const itemHeader = JSON.stringify({ type: 'event' });
      const body = `${envelopeHeader}\n${itemHeader}\n${JSON.stringify(event)}\n`;

      const authHeader = `Sentry sentry_version=7, sentry_client=health-garden-edge/1.0, ` +
        `sentry_key=${parsed.publicKey}`;

      // Deliberately unawaited by the caller (see module doc) -- the
      // .catch() here only stops an unhandled-rejection warning, it is not
      // error handling.
      fetchImpl(ingestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-sentry-envelope',
          'X-Sentry-Auth': authHeader,
        },
        body,
      }).catch(() => {});
    },
  };
}
