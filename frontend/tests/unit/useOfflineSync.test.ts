import "fake-indexeddb/auto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, renderHook, waitFor } from "@testing-library/react"
import {
  enqueueWrite,
  getQueuedWrites,
  removeQueuedWrite,
} from "../../src/lib/offlineQueue"

const mocks = vi.hoisted(() => ({
  addFoodLog: vi.fn(),
  addWorkoutLog: vi.fn(),
  addWaterGlass: vi.fn(),
  upsertWeightLog: vi.fn(),
}))

vi.mock("../../src/lib/api/logs", () => mocks)

describe("hooks/useOfflineSync", () => {
  beforeEach(async () => {
    // `resetAllMocks`, not `clearAllMocks` -- clearing only wipes call
    // history, it leaves a prior test's `mockRejectedValue`/`mockResolvedValue`
    // implementation in place. Reset guarantees each test starts from a
    // blank `vi.fn()` with no leftover behaviour from the test before it.
    vi.resetAllMocks()
    vi.stubGlobal("navigator", { onLine: true })
    // The offline queue lives in a real (if fake) IndexedDB shared across
    // this whole file, not reset per test by fake-indexeddb itself -- start
    // every test from a genuinely empty queue rather than relying on each
    // test to have fully cleaned up after itself.
    for (const item of await getQueuedWrites()) {
      await removeQueuedWrite(item.id)
    }
  })
  afterEach(() => {
    // `renderHook`'s component tree is never unmounted otherwise -- without
    // this, a hook instance (and its `window` online/offline listeners)
    // from one test stays mounted into the next, the exact class of
    // cross-test leakage that made this suite flaky (this project's
    // vitest.config.ts doesn't set `test.globals`, so @testing-library/react's
    // own implicit auto-cleanup-on-afterEach never registers).
    cleanup()
    vi.unstubAllGlobals()
  })

  it('sets "offline" and never attempts to replay when navigator.onLine is false', async () => {
    vi.stubGlobal("navigator", { onLine: false })
    const { useOfflineSync } = await import("../../src/hooks/useOfflineSync")
    const refetch = vi.fn().mockResolvedValue(undefined)
    const setSyncStatus = vi.fn()

    renderHook(() => useOfflineSync(refetch, setSyncStatus))

    await waitFor(() => expect(setSyncStatus).toHaveBeenCalledWith("offline"))
    expect(mocks.upsertWeightLog).not.toHaveBeenCalled()
  })

  it('sets "synced" immediately when online with an empty queue', async () => {
    const { useOfflineSync } = await import("../../src/hooks/useOfflineSync")
    const refetch = vi.fn().mockResolvedValue(undefined)
    const setSyncStatus = vi.fn()

    renderHook(() => useOfflineSync(refetch, setSyncStatus))

    await waitFor(() => expect(setSyncStatus).toHaveBeenCalledWith("synced"))
  })

  it('replays every queued write in order, removes each on success, refetches once, and ends "synced"', async () => {
    mocks.upsertWeightLog.mockResolvedValue({ id: 1, weight_kg: 71.5 })
    mocks.addWaterGlass.mockResolvedValue(undefined)
    await enqueueWrite("weight", {
      userId: "u1",
      weightKg: 71.5,
      date: "2026-08-13",
    })
    await enqueueWrite("water", { userId: "u1", date: "2026-08-13" })

    const { useOfflineSync } = await import("../../src/hooks/useOfflineSync")
    const refetch = vi.fn().mockResolvedValue(undefined)
    const setSyncStatus = vi.fn()

    renderHook(() => useOfflineSync(refetch, setSyncStatus))

    await waitFor(() =>
      expect(setSyncStatus).toHaveBeenLastCalledWith("synced"),
    )
    expect(mocks.upsertWeightLog).toHaveBeenCalledWith("u1", 71.5, "2026-08-13")
    expect(mocks.addWaterGlass).toHaveBeenCalledWith("u1", "2026-08-13")
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(await getQueuedWrites()).toEqual([])
  })

  it("stops replaying and leaves the rest queued if one item fails for a real (non-offline) reason", async () => {
    mocks.upsertWeightLog.mockRejectedValue(new Error("validation failed"))
    mocks.addWaterGlass.mockResolvedValue(undefined)
    await enqueueWrite("weight", {
      userId: "u2",
      weightKg: 71.5,
      date: "2026-08-13",
    })
    await enqueueWrite("water", { userId: "u2", date: "2026-08-13" })

    const { useOfflineSync } = await import("../../src/hooks/useOfflineSync")
    const refetch = vi.fn().mockResolvedValue(undefined)
    const setSyncStatus = vi.fn()

    renderHook(() => useOfflineSync(refetch, setSyncStatus))

    // Not `waitFor(() => expect(setSyncStatus).toHaveBeenLastCalledWith("pending"))`
    // -- `drain()` sets "pending" twice for this scenario (once
    // optimistically before the replay loop even starts, once again after
    // it settles), so that assertion could pass on the *first* call and let
    // this test's own assertions race ahead of the loop that's still
    // running. `toHaveBeenCalledTimes(2)` is the precise, unambiguous
    // signal that `drain()` has reached its *second* (final) call for this
    // exact code path -- unlike the queue's own contents, which look
    // identical before the loop starts and after it stops on the first
    // item's rejection (nothing has been removed either way), so polling
    // the queue can't distinguish "hasn't started" from "already finished".
    await waitFor(() => expect(setSyncStatus).toHaveBeenCalledTimes(2))

    expect(mocks.upsertWeightLog).toHaveBeenCalledTimes(1)
    // The second item (water) never got a chance -- order preserved, not
    // skipped-ahead-past-the-failure.
    expect(mocks.addWaterGlass).not.toHaveBeenCalled()
    const remaining = await getQueuedWrites()
    expect(remaining.map((i) => i.type)).toEqual(["weight", "water"])
  })
})
