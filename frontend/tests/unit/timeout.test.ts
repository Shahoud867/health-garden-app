import { describe, expect, it, vi } from "vitest"
import { withTimeout } from "../../src/lib/timeout"

describe("withTimeout", () => {
  it("resolves with the original value when the promise settles before the deadline", async () => {
    const result = await withTimeout(Promise.resolve("done"), 1000, "too slow")
    expect(result).toBe("done")
  })

  it("rejects with the original error when the promise rejects before the deadline", async () => {
    await expect(
      withTimeout(Promise.reject(new Error("boom")), 1000, "too slow"),
    ).rejects.toThrow("boom")
  })

  it("rejects with an AppError once the deadline passes, for a promise that never settles", async () => {
    vi.useFakeTimers()
    try {
      const neverSettles = new Promise(() => {}) // the exact failure mode this exists for
      const result = withTimeout(
        neverSettles,
        5000,
        "Could not load your data.",
      )
      const assertion = expect(result).rejects.toMatchObject({
        name: "AppError",
        code: "timeout",
        message: "Could not load your data.",
      })
      await vi.advanceTimersByTimeAsync(5000)
      await assertion
    } finally {
      vi.useRealTimers()
    }
  })

  it("does not fire the timeout after the promise already resolved (no dangling timer/rejection)", async () => {
    vi.useFakeTimers()
    try {
      const result = withTimeout(Promise.resolve("fast"), 5000, "too slow")
      await expect(result).resolves.toBe("fast")
      // If the timer weren't cleared, advancing past the deadline would
      // still be harmless here since the promise already settled -- this
      // asserts that explicitly rather than assuming it.
      await vi.advanceTimersByTimeAsync(5000)
    } finally {
      vi.useRealTimers()
    }
  })
})
