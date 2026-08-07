import { supabase } from "../supabase"
import { normalizeError } from "../errors"
import { withTimeout, QUERY_TIMEOUT_MS } from "../timeout"
import type { GardenStateRow, PermanentGardenRow } from "../database.types"

/**
 * SELECT-only (ADR-0024) — `garden_state`/`permanent_garden` are never
 * written by the client. Every log insert/delete recomputes them
 * server-side via a trigger (migration 0005); these calls just re-read the
 * result afterward.
 */

export async function getGardenState(
  userId: string,
): Promise<GardenStateRow[]> {
  const { data, error } = await withTimeout(
    supabase.from("garden_state").select("*").eq("user_id", userId),
    QUERY_TIMEOUT_MS,
    "Could not load your garden — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)
  return (data ?? []) as GardenStateRow[]
}

export async function getPermanentGarden(
  userId: string,
): Promise<PermanentGardenRow[]> {
  const { data, error } = await withTimeout(
    supabase
      .from("permanent_garden")
      .select("*")
      .eq("user_id", userId)
      .order("completed_on", { ascending: true }),
    QUERY_TIMEOUT_MS,
    "Could not load your garden — please check your connection and try again.",
  )
  if (error) throw normalizeError(error)
  return (data ?? []) as PermanentGardenRow[]
}
