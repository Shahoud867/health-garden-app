import { useCallback, useEffect, useRef } from "react"
import {
  getQueuedWrites,
  removeQueuedWrite,
  type QueuedWrite,
} from "../lib/offlineQueue"
import {
  addFoodLog,
  addWorkoutLog,
  addWaterGlass,
  upsertWeightLog,
} from "../lib/api/logs"
import type { SyncStatus } from "../types"

interface FoodPayload {
  userId: string
  entry: Parameters<typeof addFoodLog>[1]
}
interface WorkoutPayload {
  userId: string
  entry: Parameters<typeof addWorkoutLog>[1]
}
interface WaterPayload {
  userId: string
  date?: string
}
interface WeightPayload {
  userId: string
  weightKg: number
  date?: string
}

async function replayOne(item: QueuedWrite): Promise<void> {
  switch (item.type) {
    case "food": {
      const p = item.payload as FoodPayload
      await addFoodLog(p.userId, p.entry)
      return
    }
    case "workout": {
      const p = item.payload as WorkoutPayload
      await addWorkoutLog(p.userId, p.entry)
      return
    }
    case "water": {
      const p = item.payload as WaterPayload
      await addWaterGlass(p.userId, p.date)
      return
    }
    case "weight": {
      const p = item.payload as WeightPayload
      await upsertWeightLog(p.userId, p.weightKg, p.date)
      return
    }
  }
}

/**
 * Drains the offline write queue (see lib/offlineQueue.ts) whenever the
 * browser comes back online, and once on mount (covers the case where the
 * app was closed offline with items still queued, then reopened already
 * online -- no `online` event ever fires in that case, since nothing
 * transitioned).
 *
 * Owns `syncStatus` end to end -- App.tsx no longer sets it directly from
 * the raw browser online/offline events, since "online" and "fully synced"
 * aren't the same thing the moment a queue might still have items in it.
 */
export function useOfflineSync(
  refetch: () => Promise<void>,
  setSyncStatus: (s: SyncStatus) => void,
): { drain: () => Promise<void> } {
  const draining = useRef(false)

  const drain = useCallback(async () => {
    if (draining.current) return
    if (!navigator.onLine) {
      setSyncStatus("offline")
      return
    }
    draining.current = true
    try {
      const items = await getQueuedWrites()
      if (items.length === 0) {
        setSyncStatus("synced")
        return
      }
      setSyncStatus("pending")
      let replayedAny = false
      for (const item of items) {
        try {
          await replayOne(item)
          await removeQueuedWrite(item.id)
          replayedAny = true
        } catch {
          // A real failure once we know we're online (not just "was
          // offline") -- stop here rather than skip ahead and risk
          // replaying out of order; the rest stay queued for the next
          // online event or app open.
          break
        }
      }
      // One refetch after the whole batch, not one per item -- garden_state
      // and today's totals only need to reflect the end result.
      if (replayedAny) await refetch()
      const remaining = await getQueuedWrites()
      setSyncStatus(remaining.length > 0 ? "pending" : "synced")
    } finally {
      draining.current = false
    }
  }, [refetch, setSyncStatus])

  useEffect(() => {
    drain()
    const onOnline = () => drain()
    const onOffline = () => setSyncStatus("offline")
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [drain, setSyncStatus])

  return { drain }
}
