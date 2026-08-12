import "fake-indexeddb/auto"
import { beforeEach, describe, expect, it } from "vitest"
import {
  enqueueWrite,
  getQueuedWrites,
  removeQueuedWrite,
  isOfflineLikeError,
} from "../../src/lib/offlineQueue"
import { AppError } from "../../src/lib/errors"

// A fresh fake-indexeddb database per test would need re-importing the
// module or tearing down IDBFactory -- simpler and just as real: use a
// distinct payload/type per test so queues never collide, and always clean
// up what a test adds. The persistence mechanism under test doesn't care
// which test added what, only that add/get/remove round-trip correctly.

describe("lib/offlineQueue", () => {
  it("enqueueWrite + getQueuedWrites round-trips a real write with an id and timestamp", async () => {
    const item = await enqueueWrite("weight", {
      userId: "u1",
      weightKg: 71.5,
      date: "2026-08-13",
    })
    expect(item.id).toBeTruthy()
    expect(item.type).toBe("weight")
    expect(item.createdAt).toBeTruthy()

    const all = await getQueuedWrites()
    const found = all.find((i) => i.id === item.id)
    expect(found).toBeDefined()
    expect(found?.payload).toEqual({
      userId: "u1",
      weightKg: 71.5,
      date: "2026-08-13",
    })

    await removeQueuedWrite(item.id) // cleanup
  })

  it("removeQueuedWrite actually removes the item, not just marks it", async () => {
    const item = await enqueueWrite("water", {
      userId: "u2",
      date: "2026-08-13",
    })
    await removeQueuedWrite(item.id)

    const all = await getQueuedWrites()
    expect(all.find((i) => i.id === item.id)).toBeUndefined()
  })

  it("getQueuedWrites returns items oldest-first", async () => {
    const first = await enqueueWrite("food", {
      userId: "u3",
      entry: { seq: 1 },
    })
    await new Promise((r) => setTimeout(r, 5)) // ensure a distinct createdAt
    const second = await enqueueWrite("food", {
      userId: "u3",
      entry: { seq: 2 },
    })

    const all = await getQueuedWrites()
    const firstIdx = all.findIndex((i) => i.id === first.id)
    const secondIdx = all.findIndex((i) => i.id === second.id)
    expect(firstIdx).toBeLessThan(secondIdx)

    await removeQueuedWrite(first.id)
    await removeQueuedWrite(second.id)
  })
})

describe("lib/offlineQueue isOfflineLikeError", () => {
  it('is true for an AppError with code "network_error"', () => {
    expect(isOfflineLikeError(new AppError("network_error", "offline"))).toBe(
      true,
    )
  })

  it('is true for an AppError with code "timeout"', () => {
    expect(isOfflineLikeError(new AppError("timeout", "too slow"))).toBe(true)
  })

  it("is false for a real, definitive server error (e.g. a validation failure) -- must not be queued and silently retried", () => {
    expect(isOfflineLikeError(new AppError("23514", "Invalid value"))).toBe(
      false,
    )
  })

  it("is false for a plain Error or a non-Error value", () => {
    expect(isOfflineLikeError(new Error("boom"))).toBe(false)
    expect(isOfflineLikeError("a string")).toBe(false)
    expect(isOfflineLikeError(null)).toBe(false)
  })
})
