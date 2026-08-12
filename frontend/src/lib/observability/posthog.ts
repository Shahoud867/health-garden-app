import { redact } from "./redact"

/**
 * Client-side mirror of `_shared/observability/posthog.ts`'s posture: a
 * plain `fetch` POST against PostHog's capture API, not the `posthog-js`
 * SDK (ADR-0023's "not a protocol worth a dependency" reasoning applies
 * just as much here -- capture is one JSON request, and this app just spent
 * real effort code-splitting the bundle down; a ~50KB analytics SDK is a
 * worse trade than one small fetch wrapper). Config-gated to a silent
 * no-op without a real API key, exactly like every other optional
 * integration in this codebase (Turnstile, VAPID push).
 */

export interface PostHogClient {
  capture(
    event: string,
    distinctId: string,
    properties?: Record<string, unknown>,
  ): void
}

const NOOP_CLIENT: PostHogClient = { capture: () => {} }

export interface PostHogClientOptions {
  host: string
  fetchImpl?: typeof fetch
}

export function createPostHogClient(
  apiKey: string | undefined,
  options: PostHogClientOptions,
): PostHogClient {
  if (!apiKey || apiKey.trim() === "") return NOOP_CLIENT

  const fetchImpl = options.fetchImpl ?? fetch
  const host = options.host.replace(/\/$/, "")

  return {
    capture(event, distinctId, properties = {}) {
      const body = JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: {
          ...redact(properties),
          $lib: "health-garden-web-fetch",
        },
        timestamp: new Date().toISOString(),
      })

      // Fire-and-forget -- an analytics call must never become a reason a
      // real user action (a save, a navigation) waits on it or fails
      // because of it.
      fetchImpl(`${host}/capture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true, // survives a navigation/tab-close right after firing
      }).catch(() => {})
    },
  }
}
