import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { redact } from "../../src/lib/observability/redact"
import { createPostHogClient } from "../../src/lib/observability/posthog"
import { createSentryReporter } from "../../src/lib/observability/sentry"

describe("lib/observability/redact", () => {
  it("redacts a top-level key matching a sensitive pattern", () => {
    const out = redact({
      email: "a@b.com",
      weight_kg: 71.5,
      goal: "general_health",
    })
    expect(out.email).toBe("[redacted]")
    expect(out.weight_kg).toBe("[redacted]")
    expect(out.goal).toBe("general_health") // not sensitive -- passes through
  })

  it("redacts nested objects recursively, not just the top level", () => {
    const out = redact({ user: { full_name: "Jane Doe", age: 30 } })
    expect((out.user as Record<string, unknown>).full_name).toBe("[redacted]")
    expect((out.user as Record<string, unknown>).age).toBe(30)
  })

  it("redacts sensitive keys inside array elements too", () => {
    const out = redact({
      logs: [{ condition: "diabetes" }, { condition: "pcos" }],
    })
    const logs = out.logs as Record<string, unknown>[]
    expect(logs[0].condition).toBe("[redacted]")
    expect(logs[1].condition).toBe("[redacted]")
  })

  it("truncates very long strings instead of shipping them whole", () => {
    const out = redact({ note: "x".repeat(1000) })
    expect((out.note as string).length).toBeLessThan(1000)
  })
})

describe("lib/observability/posthog", () => {
  it("never calls fetch when no API key is configured (silent no-op)", () => {
    const fetchImpl = vi.fn()
    const client = createPostHogClient(undefined, {
      host: "https://us.i.posthog.com",
      fetchImpl,
    })
    client.capture("test_event", "user-1")
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("posts to the configured host with the event, distinct_id, and redacted properties when an API key is set", () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    const client = createPostHogClient("real-key", {
      host: "https://us.i.posthog.com/",
      fetchImpl,
    })
    client.capture("onboarding_completed", "user-1", {
      email: "a@b.com",
      goal: "lose_weight",
    })

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe("https://us.i.posthog.com/capture/") // trailing slash normalized
    const body = JSON.parse(init.body)
    expect(body.api_key).toBe("real-key")
    expect(body.event).toBe("onboarding_completed")
    expect(body.distinct_id).toBe("user-1")
    expect(body.properties.email).toBe("[redacted]")
    expect(body.properties.goal).toBe("lose_weight")
  })
})

describe("lib/observability/sentry", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", {
      randomUUID: () => "11111111-1111-1111-1111-111111111111",
    })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("never calls fetch when no DSN is configured (silent no-op)", () => {
    const fetchImpl = vi.fn()
    const reporter = createSentryReporter(undefined, {
      environment: "test",
      fetchImpl,
    })
    reporter.captureException(new Error("boom"), {})
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("never calls fetch for a malformed DSN instead of throwing", () => {
    const fetchImpl = vi.fn()
    const reporter = createSentryReporter("not-a-real-dsn", {
      environment: "test",
      fetchImpl,
    })
    expect(() => reporter.captureException(new Error("boom"), {})).not.toThrow()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("posts a real envelope to the parsed ingest URL with a redacted extra context", () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    const reporter = createSentryReporter(
      "https://publickey@o123.ingest.sentry.io/456",
      {
        environment: "test",
        fetchImpl,
      },
    )
    reporter.captureException(new Error("save failed"), {
      weight: 71.5,
      screen: "weight",
    })

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe("https://o123.ingest.sentry.io/api/456/envelope/")
    expect(init.headers["X-Sentry-Auth"]).toContain("sentry_key=publickey")
    const lines = (init.body as string).trim().split("\n")
    expect(lines).toHaveLength(3) // envelope header, item header, event
    const event = JSON.parse(lines[2])
    expect(event.exception.values[0].value).toBe("save failed")
    expect(event.extra.weight).toBe("[redacted]")
    expect(event.extra.screen).toBe("weight")
  })
})
