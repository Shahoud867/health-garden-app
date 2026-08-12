import "fake-indexeddb/auto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { enqueueWrite, getQueuedWrites } from "../../src/lib/offlineQueue"

const mocks = vi.hoisted(() => ({
  addFoodLog: vi.fn(),
  addWorkoutLog: vi.fn(),
  addWaterGlass: vi.fn(),
  upsertWeightLog: vi.fn(),
}))

vi.mock("../../src/lib/api/logs", () => mocks)

describe("hooks/useOfflineSync", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("navigator", { onLine: true })
  })
  afterEach(() => {
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

    await waitFor(() =>
      expect(setSyncStatus).toHaveBeenLastCalledWith("pending"),
    )
    // The second item (water) never got a chance -- order preserved, not
    // skipped-ahead-past-the-failure.
    expect(mocks.addWaterGlass).not.toHaveBeenCalled()
    const remaining = await getQueuedWrites()
    expect(remaining.map((i) => i.type)).toEqual(["weight", "water"])

    // cleanup for other tests
    for (const item of remaining) {
      const { removeQueuedWrite } = await import("../../src/lib/offlineQueue")
      await removeQueuedWrite(item.id)
    }
  })
})
