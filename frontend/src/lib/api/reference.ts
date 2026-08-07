import { supabase } from "../supabase"
import { normalizeError } from "../errors"
import type { ExerciseRow, FoodRow } from "../database.types"

/**
 * `foods`/`exercises` are public reference data — RLS grants read access to
 * everyone, auth or not (0002_reference_tables.sql), so these calls need no
 * user context at all.
 */

export async function searchFoods(
  query: string,
  limit = 20,
): Promise<FoodRow[]> {
  if (query.trim().length === 0) return []
  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .or(`dish_name.ilike.%${query}%,urdu_name.ilike.%${query}%`)
    .limit(limit)
  if (error) throw normalizeError(error)
  return (data ?? []) as FoodRow[]
}

export async function listUsualFoods(limit = 6): Promise<FoodRow[]> {
  // No per-user "usuals" history table exists yet (see README's "Remaining
  // work") -- verified, most commonly logged dishes stand in as a reasonable
  // default until that's built.
  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .eq("verified", "Y")
    .order("dish_name", { ascending: true })
    .limit(limit)
  if (error) throw normalizeError(error)
  return (data ?? []) as FoodRow[]
}

export async function searchExercises(
  query: string,
  limit = 20,
): Promise<ExerciseRow[]> {
  const q = supabase.from("exercises").select("*").limit(limit)
  const { data, error } = await (query.trim().length > 0
    ? q.or(`exercise_name.ilike.%${query}%,urdu_name.ilike.%${query}%`)
    : q)
  if (error) throw normalizeError(error)
  return (data ?? []) as ExerciseRow[]
}
