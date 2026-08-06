/**
 * Minimal server-side PostHog event capture (Blueprint ADR-013's
 * observability stack). Same posture as `sentry.ts`: a plain `fetch` call
 * against PostHog's capture API (a single JSON POST, not a protocol worth a
 * dependency — ADR-0023), config-gated to a silent no-op without
 * `POSTHOG_API_KEY`, fire-and-forget so a request's success never depends on
 * an analytics call landing.
 *
 * Scope, deliberately narrow: PostHog's larger value (page views, funnels,
 * session replay) is frontend work that needs the web client to exist —
 * this only captures the handful of business events only the backend can
 * see at all: a subscription being approved, an AI plan being generated, an
 * account being deleted. Not a general-purpose analytics SDK, three call
 * sites (`payments-approve-intent`, `ai-plan-generate`, `account-delete`).
 */

import { redact } from './logger.ts';

export interface PostHogClient {
  capture(event: string, distinctId: string, properties?: Record<string, unknown>): void;
}

const NOOP_CLIENT: PostHogClient = { capture: () => {} };

export interface PostHogClientOptions {
  /** Region-specific ingest host, e.g. `https://us.i.posthog.com` or
   * `https://eu.i.posthog.com` — PostHog project settings state which one a
   * given API key belongs to. */
  readonly host: string;
  readonly fetchImpl?: typeof fetch;
}

export function createPostHogClient(
  apiKey: string | undefined,
  options: PostHogClientOptions,
): PostHogClient {
  if (apiKey === undefined || apiKey.trim() === '') return NOOP_CLIENT;

  const fetchImpl = options.fetchImpl ?? fetch;
  const host = options.host.replace(/\/$/, '');

  return {
    capture(event, distinctId, properties = {}): void {
      const body = JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        // Reuses the logger's own redaction (see sentry.ts's identical
        // rationale) -- an analytics event is still a place a diagnosed
        // condition or a raw weight value must never end up (Blueprint NFR-6).
        properties: redact(properties),
        timestamp: new Date().toISOString(),
      });

      // Fire-and-forget, deliberately unhandled beyond swallowing the
      // rejection -- see module doc.
      fetchImpl(`${host}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }).catch(() => {});
    },
  };
}
