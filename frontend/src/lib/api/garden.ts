import { supabase } from "../supabase"
import { normalizeError } from "../errors"
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
  const { data, error } = await supabase
    .from("garden_state")
    .select("*")
    .eq("user_id", userId)
  if (error) throw normalizeError(error)
  return (data ?? []) as GardenStateRow[]
}

export async function getPermanentGarden(
  userId: string,
): Promise<PermanentGardenRow[]> {
  const { data, error } = await supabase
    .from("permanent_garden")
    .select("*")
    .eq("user_id", userId)
    .order("completed_on", { ascending: true })
  if (error) throw normalizeError(error)
  return (data ?? []) as PermanentGardenRow[]
}
