import { supabase } from "../supabase"
import { normalizeError } from "../errors"
import { todayLocalDate } from "../date"
import type {
  FoodLogRow,
  WorkoutLogRow,
  WaterLogRow,
  WeightLogRow,
} from "../database.types"

/**
 * Direct PostgREST access (§6.1) for every logging table — RLS
 * ("Users manage own X logs", 0004_logs.sql) already scopes every row to
 * `user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())`, so these
 * calls only ever need `user_id`, never `auth_id`.
 *
 * A DB trigger recomputes `garden_state` synchronously on every insert/
 * delete here (migration 0005) — nothing in this file touches the garden;
 * `api/garden.ts` just re-reads it after a successful write.
 */

// --- Food -------------------------------------------------------------

export interface FoodLogWithFood extends FoodLogRow {
  foods: {
    dish_name: string
    urdu_name: string | null
    portion_unit: string
  } | null
}

export async function listFoodLogsForDate(
  userId: string,
  date: string,
): Promise<FoodLogWithFood[]> {
  // Embedded resource (PostgREST's FK-based join, §6.1) -- one round trip
  // instead of N+1 lookups to show the real dish name in "today's log"
  // rather than a bare food_id.
  const { data, error } = await supabase
    .from("food_logs")
    .select("*, foods ( dish_name, urdu_name, portion_unit )")
    .eq("user_id", userId)
    .eq("log_date", date)
    .order("created_at", { ascending: true })
  if (error) throw normalizeError(error)
  return (data ?? []) as unknown as FoodLogWithFood[]
}

export async function addFoodLog(
  userId: string,
  entry: {
    foodId?: number
    mealSlot: FoodLogRow["meal_slot"]
    quantity: number
    caloriesSnapshot: number
    proteinGSnapshot?: number | null
    sugarFlagSnapshot?: "Y" | "N" | null
    logDate?: string
  },
): Promise<FoodLogRow> {
  const { data, error } = await supabase
    .from("food_logs")
    .insert({
      user_id: userId,
      food_id: entry.foodId ?? null,
      client_uuid: crypto.randomUUID(),
      log_date: entry.logDate ?? todayLocalDate(),
      meal_slot: entry.mealSlot,
      quantity: entry.quantity,
      calories_snapshot: entry.caloriesSnapshot,
      protein_g_snapshot: entry.proteinGSnapshot ?? null,
      sugar_flag_snapshot: entry.sugarFlagSnapshot ?? null,
      source: "manual",
    })
    .select("*")
    .single()
  if (error) throw normalizeError(error)
  return data as FoodLogRow
}

export async function deleteFoodLog(logId: number): Promise<void> {
  const { error } = await supabase.from("food_logs").delete().eq("id", logId)
  if (error) throw normalizeError(error)
}

// --- Workout ------------------------------------------------------------

export interface WorkoutLogWithExercise extends WorkoutLogRow {
  exercises: {
    exercise_name: string
    urdu_name: string | null
    category: string | null
  } | null
}

export async function listWorkoutLogsForDate(
  userId: string,
  date: string,
): Promise<WorkoutLogWithExercise[]> {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("*, exercises ( exercise_name, urdu_name, category )")
    .eq("user_id", userId)
    .eq("log_date", date)
    .order("created_at", { ascending: true })
  if (error) throw normalizeError(error)
  return (data ?? []) as unknown as WorkoutLogWithExercise[]
}

export async function addWorkoutLog(
  userId: string,
  entry: {
    exerciseId?: number
    durationMin: number
    caloriesBurned: number
    logDate?: string
  },
): Promise<WorkoutLogRow> {
  const { data, error } = await supabase
    .from("workout_logs")
    .insert({
      user_id: userId,
      exercise_id: entry.exerciseId ?? null,
      client_uuid: crypto.randomUUID(),
      log_date: entry.logDate ?? todayLocalDate(),
      duration_min: entry.durationMin,
      calories_burned: entry.caloriesBurned,
      source: "manual",
    })
    .select("*")
    .single()
  if (error) throw normalizeError(error)
  return data as WorkoutLogRow
}

export async function deleteWorkoutLog(logId: number): Promise<void> {
  const { error } = await supabase.from("workout_logs").delete().eq("id", logId)
  if (error) throw normalizeError(error)
}

// --- Water ----------------------------------------------------------------
// One row per "+1 glass" tap (no natural single aggregate row to upsert --
// water_logs has no UNIQUE(user_id, log_date), unlike weight_logs). "-1"
// removes the most recently logged glass for today, giving the UI's tap
// counter a natural undo without ever going negative server-side.

export async function getTodayWaterGlasses(
  userId: string,
  date: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("water_logs")
    .select("glasses_logged")
    .eq("user_id", userId)
    .eq("log_date", date)
  if (error) throw normalizeError(error)
  return (data ?? []).reduce(
    (sum, row) => sum + (row as { glasses_logged: number }).glasses_logged,
    0,
  )
}

export async function addWaterGlass(
  userId: string,
  date?: string,
): Promise<void> {
  const { error } = await supabase.from("water_logs").insert({
    user_id: userId,
    client_uuid: crypto.randomUUID(),
    log_date: date ?? todayLocalDate(),
    glasses_logged: 1,
  })
  if (error) throw normalizeError(error)
}

export async function removeLastWaterGlass(
  userId: string,
  date?: string,
): Promise<void> {
  const logDate = date ?? todayLocalDate()
  const { data, error } = await supabase
    .from("water_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("log_date", logDate)
    .order("created_at", { ascending: false })
    .limit(1)
  if (error) throw normalizeError(error)
  const last = (data ?? [])[0] as { id: number } | undefined
  if (!last) return // nothing to remove -- silently a no-op, matching the UI's disabled-at-zero button
  const { error: deleteError } = await supabase
    .from("water_logs")
    .delete()
    .eq("id", last.id)
  if (deleteError) throw normalizeError(deleteError)
}

/** Daily glasses for the last `days` days (device-local dates), oldest first — for the weekly chart. */
export async function getWaterHistory(
  userId: string,
  dates: string[],
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("water_logs")
    .select("log_date, glasses_logged")
    .eq("user_id", userId)
    .in("log_date", dates)
  if (error) throw normalizeError(error)
  const totals: Record<string, number> = {}
  for (const row of (data ?? []) as {
    log_date: string
    glasses_logged: number
  }[]) {
    totals[row.log_date] = (totals[row.log_date] ?? 0) + row.glasses_logged
  }
  return totals
}

// --- Weight -----------------------------------------------------------------
// UNIQUE(user_id, log_date) (0004_logs.sql) makes this a true upsert: logging
// again the same day overwrites, matching WeightScreen's "today's weight"
// single-value semantics exactly.

export async function upsertWeightLog(
  userId: string,
  weightKg: number,
  date?: string,
): Promise<WeightLogRow> {
  const { data, error } = await supabase
    .from("weight_logs")
    .upsert(
      {
        user_id: userId,
        log_date: date ?? todayLocalDate(),
        weight_kg: weightKg,
        source: "manual",
      },
      { onConflict: "user_id,log_date" },
    )
    .select("*")
    .single()
  if (error) throw normalizeError(error)
  return data as WeightLogRow
}

export async function listWeightHistory(
  userId: string,
  limit = 28,
): Promise<WeightLogRow[]> {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(limit)
  if (error) throw normalizeError(error)
  return ((data ?? []) as WeightLogRow[]).reverse() // oldest first, for chart rendering
}

// --- Today's aggregate (HomeScreen) ----------------------------------------

export async function getTodayCalories(
  userId: string,
  date: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("food_logs")
    .select("calories_snapshot")
    .eq("user_id", userId)
    .eq("log_date", date)
  if (error) throw normalizeError(error)
  return (data ?? []).reduce(
    (sum, row) =>
      sum + (row as { calories_snapshot: number }).calories_snapshot,
    0,
  )
}

export async function getTodayWorkoutMinutes(
  userId: string,
  date: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("duration_min")
    .eq("user_id", userId)
    .eq("log_date", date)
  if (error) throw normalizeError(error)
  return (data ?? []).reduce(
    (sum, row) => sum + (row as { duration_min: number }).duration_min,
    0,
  )
}
