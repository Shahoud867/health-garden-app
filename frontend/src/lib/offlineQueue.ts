/**
 * IndexedDB-backed queue for writes made while offline. Matches this app's
 * own "offline-aware" design goal (App.tsx's own prior comment: "'pending'
 * never applies here" -- see useOfflineSync.ts, which is what actually
 * makes it apply now) and the target market's real connectivity reality
 * (Pakistan-based users, called out elsewhere in this codebase as a real,
 * not hypothetical, consideration).
 *
 * No library -- raw IndexedDB, matching this codebase's established "no
 * dependency for a simple thing" posture (Web Push and the observability
 * clients are equally dependency-free). A single object store, no indexes:
 * this only ever needs "all pending items, oldest first" and "remove one by
 * id," which `getAll()` plus a client-side sort covers without one.
 */

import { AppError } from "./errors"

/**
 * A write is worth queuing only when the request never actually reached (or
 * completed with) the server -- a real network failure or a `withTimeout`
 * timeout (lib/timeout.ts). Any other AppError (validation, RLS, auth) means
 * the server gave a real, definitive answer; queuing and silently retrying
 * that later wouldn't fix anything, it would just hide a real error the
 * user needs to see and act on now.
 */
export function isOfflineLikeError(err: unknown): boolean {
  return (
    err instanceof AppError &&
    (err.code === "network_error" || err.code === "timeout")
  )
}

const DB_NAME = "health-garden-offline"
const DB_VERSION = 1
const STORE_NAME = "pending_writes"

export type QueuedWriteType = "food" | "workout" | "water" | "weight"

export interface QueuedWrite {
  id: string
  type: QueuedWriteType
  payload: unknown
  createdAt: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function enqueueWrite(
  type: QueuedWriteType,
  payload: unknown,
): Promise<QueuedWrite> {
  const db = await openDb()
  const item: QueuedWrite = {
    id: crypto.randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).add(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
  return item
}

/** Oldest first -- replay order matters (e.g. two weight logs for the same
 * day should apply in the order they were actually made). */
export async function getQueuedWrites(): Promise<QueuedWrite[]> {
  const db = await openDb()
  const items = await new Promise<QueuedWrite[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result as QueuedWrite[])
    req.onerror = () => reject(req.error)
  })
  db.close()
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function removeQueuedWrite(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
