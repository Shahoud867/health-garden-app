import { useCallback, useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import type { AppState, PlantState } from "../types"
import { getProfile } from "../lib/api/profile"
import {
  getTodayCalories,
  getTodayWorkoutMinutes,
  getTodayWaterGlasses,
  listWeightHistory,
  listFoodLogsForDate,
  listWorkoutLogsForDate,
} from "../lib/api/logs"
import { getGardenState } from "../lib/api/garden"
import {
  getTodayAiChatUsage,
  AI_CHAT_DAILY_CAP_DEFAULT,
  AI_PLAN_REGENERATION_CAP_DEFAULT,
} from "../lib/api/ai"
import { todayLocalDate } from "../lib/date"
import {
  GOAL_TYPE_TO_PLANT,
  GOAL_TYPE_ORDER,
  goalLabel,
} from "../lib/gardenMapping"
import type { UserRow } from "../lib/database.types"
import { normalizeError } from "../lib/errors"
import { withTimeout } from "../lib/timeout"

/** No individual query here should ever take this long against a healthy
 * backend; a stalled connection otherwise hangs this whole load forever
 * with no error a user could act on (see lib/timeout.ts's doc comment). */
const LOAD_TIMEOUT_MS = 15_000

const EMPTY_STATE_DEFAULTS: Omit<AppState, "lang" | "isLoggedIn" | "onboardingComplete" | "isPremium" | "syncStatus"> =
  {
    user: {
      name: "",
      age: 25,
      sex: "female",
      heightCm: 165,
      weightKg: 65,
      activityLevel: "moderate",
      goal: "general_health",
      conditions: [],
      calorieTarget: 2000,
      proteinTarget: 100,
    },
    today: {
      caloriesLogged: 0,
      waterGlasses: 0,
      workoutMinutes: 0,
      foodEntries: [],
      workoutEntries: [],
      weightLog: null,
    },
    garden: [],
    weightHistory: [],
    aiChat: {
      messages: [],
      usedToday: 0,
      dailyCap: AI_CHAT_DAILY_CAP_DEFAULT,
      enabled: true,
    },
    aiPlan: {
      plan: null,
      regenUsed: 0,
      regenCap: AI_PLAN_REGENERATION_CAP_DEFAULT,
    },
  }

function profileToUser(profile: UserRow): AppState["user"] {
  return {
    name: profile.full_name ?? "",
    age: profile.age ?? 25,
    sex: profile.sex ?? "female",
    heightCm: profile.height_cm ?? 165,
    weightKg: profile.weight_kg ?? 65,
    activityLevel: profile.activity_level ?? "moderate",
    goal: profile.goal ?? "general_health",
    conditions: profile.conditions
      ? profile.conditions.split(",").filter(Boolean)
      : [],
    calorieTarget: profile.daily_calorie_target ?? 2000,
    proteinTarget: profile.daily_protein_target_g ?? 100,
  }
}

/**
 * Loads everything a logged-in session needs into the existing `AppState`
 * shape (unchanged, so every screen's props stay the same) from real
 * backend data instead of `App.tsx`'s old hardcoded mock. `onboardingComplete`
 * is derived from `profile.goal` being set — the last field every
 * onboarding path fills in before calling `onComplete` (OnboardingScreen).
 */
export function useAppData(session: Session | null) {
  const [state, setStateRaw] = useState<AppState>({
    lang: "en",
    isPremium: false,
    syncStatus: "synced",
    onboardingComplete: false,
    isLoggedIn: false,
    ...EMPTY_STATE_DEFAULTS,
  })
  const [profile, setProfile] = useState<UserRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const setState = useCallback((patch: Partial<AppState>) => {
    setStateRaw((prev) => ({ ...prev, ...patch }))
  }, [])

  const load = useCallback(async () => {
    if (!session) {
      setStateRaw((prev) => ({
        ...prev,
        isLoggedIn: false,
        onboardingComplete: false,
      }))
      setProfile(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)
    try {
      const authId = session.user.id
      const profileRow = await withTimeout(
        getProfile(authId),
        LOAD_TIMEOUT_MS,
        "Could not load your profile — please check your connection and try again.",
      )
      if (!profileRow) {
        // handle_new_auth_user (migration 0005) creates this row synchronously
        // on signup -- absent here means the row genuinely hasn't landed yet
        // (a rare replication-lag edge case) or signup itself failed
        // partway. Treat as "not onboarded" rather than crash the screen.
        setStateRaw((prev) => ({
          ...prev,
          isLoggedIn: true,
          onboardingComplete: false,
        }))
        setLoading(false)
        return
      }
      setProfile(profileRow)

      const userId = profileRow.id
      const today = todayLocalDate()
      const onboardingComplete = profileRow.goal !== null

      if (!onboardingComplete) {
        setStateRaw((prev) => ({
          ...prev,
          isLoggedIn: true,
          onboardingComplete: false,
          isPremium: profileRow.is_premium,
          user: profileToUser(profileRow),
        }))
        setLoading(false)
        return
      }

      const [
        calories,
        workoutMinutes,
        waterGlasses,
        weightRows,
        gardenRows,
        aiUsage,
        foodEntries,
        workoutEntries,
      ] = await withTimeout(
        Promise.all([
          getTodayCalories(userId, today),
          getTodayWorkoutMinutes(userId, today),
          getTodayWaterGlasses(userId, today),
          listWeightHistory(userId),
          getGardenState(userId),
          getTodayAiChatUsage(userId),
          listFoodLogsForDate(userId, today),
          listWorkoutLogsForDate(userId, today),
        ]),
        LOAD_TIMEOUT_MS,
        "Could not load your data — please check your connection and try again.",
      )

      const garden: PlantState[] = GOAL_TYPE_ORDER.map((goalType) => {
        const row = gardenRows.find((g) => g.goal_type === goalType)
        return {
          type: GOAL_TYPE_TO_PLANT[goalType],
          goal: goalLabel(goalType, "en"),
          goalUr: goalLabel(goalType, "ur"),
          cycleDays: (row?.current_stage ?? 0) as 0 | 1 | 2,
          metToday: row ? !row.is_dormant_today : false,
        }
      })

      const latestWeight =
        weightRows.length > 0 ? weightRows[weightRows.length - 1] : null
      const todayWeightRow = weightRows.find((w) => w.log_date === today)

      setStateRaw((prev) => ({
        ...prev,
        isLoggedIn: true,
        onboardingComplete: true,
        isPremium: profileRow.is_premium,
        user: {
          ...profileToUser(profileRow),
          weightKg:
            latestWeight?.weight_kg ?? profileToUser(profileRow).weightKg,
        },
        today: {
          caloriesLogged: calories,
          waterGlasses,
          workoutMinutes,
          foodEntries: foodEntries.map((f) => ({
            id: String(f.id),
            name: f.foods?.dish_name ?? "Food",
            nameUr: f.foods?.urdu_name ?? "",
            slot: f.meal_slot ?? "snack",
            unit: f.foods?.portion_unit ?? "serving",
            qty: f.quantity,
            calories: f.calories_snapshot,
            protein: f.protein_g_snapshot ?? 0,
          })),
          workoutEntries: workoutEntries.map((w) => ({
            id: String(w.id),
            // exercise_id is null for the curated quick-log catalog
            // (WorkoutScreen's WORKOUTS list isn't tied to real exercises
            // rows) -- falls back to a generic label rather than inventing
            // a name that was never actually recorded.
            name: w.exercises?.exercise_name ?? "Workout",
            nameUr: w.exercises?.urdu_name ?? "",
            category: w.exercises?.category ?? "",
            duration: w.duration_min,
            caloriesBurned: w.calories_burned,
          })),
          weightLog: todayWeightRow?.weight_kg ?? null,
        },
        garden,
        weightHistory: weightRows.map((w) => ({
          date: w.log_date,
          weight: w.weight_kg,
        })),
        aiChat: { ...prev.aiChat, usedToday: aiUsage },
        aiPlan: prev.aiPlan,
      }))
    } catch (err) {
      setLoadError(normalizeError(err).message)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    load()
  }, [load])

  return { state, setState, profile, loading, loadError, refetch: load }
}
