import { useState } from "react"
import type { NavProps, AppState } from "../types"
import { t } from "../types"
import { addWorkoutLog, deleteWorkoutLog } from "../lib/api/logs"
import { useToast } from "../hooks/useToast"
import { track } from "../lib/analytics"
import SyncBadge from "../components/SyncBadge"
import { Spinner } from "../components/Loading"
import {
  ChevronLeftIcon,
  Panel,
  PageTitle,
  SectionLabel,
} from "../components/Primitives"

interface Props extends NavProps {
  state: AppState
  setState: (p: Partial<AppState>) => void
  userId: string
  refetch: () => Promise<void>
}

const WORKOUTS = [
  {
    id: "walk",
    name: "Brisk Walk",
    nameUr: "تیز چہل قدمی",
    cat: "cardio",
    calPerMin: 5,
    icon: "🚶",
    jointSafe: true,
  },
  {
    id: "run",
    name: "Running",
    nameUr: "دوڑنا",
    cat: "cardio",
    calPerMin: 9,
    icon: "🏃",
    jointSafe: false,
  },
  {
    id: "cycle",
    name: "Cycling",
    nameUr: "سائیکلنگ",
    cat: "cardio",
    calPerMin: 7,
    icon: "🚴",
    jointSafe: true,
  },
  {
    id: "swim",
    name: "Swimming",
    nameUr: "تیراکی",
    cat: "cardio",
    calPerMin: 8,
    icon: "🏊",
    jointSafe: true,
  },
  {
    id: "yoga",
    name: "Yoga",
    nameUr: "یوگا",
    cat: "joint",
    calPerMin: 4,
    icon: "🧘",
    jointSafe: true,
  },
  {
    id: "stretch",
    name: "Stretching",
    nameUr: "اسٹریچنگ",
    cat: "joint",
    calPerMin: 3,
    icon: "🤸",
    jointSafe: true,
  },
  {
    id: "squat",
    name: "Bodyweight Squats",
    nameUr: "اسکواٹ",
    cat: "strength",
    calPerMin: 6,
    icon: "🏋",
    jointSafe: false,
  },
  {
    id: "pushup",
    name: "Push-ups",
    nameUr: "پش اپ",
    cat: "strength",
    calPerMin: 5,
    icon: "💪",
    jointSafe: false,
  },
  {
    id: "plank",
    name: "Plank",
    nameUr: "پلانک",
    cat: "strength",
    calPerMin: 4,
    icon: "⚡",
    jointSafe: true,
  },
] as const

type Cat = "all" | "cardio" | "strength" | "joint"

export default function WorkoutScreen({
  navigate,
  lang,
  state,
  userId,
  refetch,
}: Props) {
  const { showToast } = useToast()
  const [cat, setCat] = useState<Cat>("all")
  const [selected, setSelected] = useState<typeof WORKOUTS[number] | null>(null)
  const [duration, setDuration] = useState(20)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const hasJointCondition = state.user.conditions.includes("knee_pain")

  const filtered = WORKOUTS.filter((w) => {
    if (hasJointCondition && !w.jointSafe) return false
    if (cat === "all") return true
    return w.cat === cat
  })

  const log = async () => {
    if (!selected) return
    setSaving(true)
    try {
      // WORKOUTS is a curated quick-log catalog, not tied to real exercises
      // rows -- exerciseId is intentionally omitted (workout_logs.exercise_id
      // is nullable, migration 0004); duration/caloriesBurned are what the
      // garden's "movement" goal and today's totals actually key on.
      await addWorkoutLog(userId, {
        durationMin: duration,
        caloriesBurned: selected.calPerMin * duration,
      })
      track("log_created", { type: "workout" })
      await refetch()
      setSelected(null)
      showToast(
        lang === "ur" ? "ورزش درج ہو گئی" : "Workout logged.",
        "success",
      )
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not log that workout.",
        "error",
      )
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    setRemovingId(id)
    try {
      await deleteWorkoutLog(Number(id))
      await refetch()
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not remove that entry.",
        "error",
      )
    } finally {
      setRemovingId(null)
    }
  }

  const catLabel: Record<Cat, string> = {
    all: lang === "ur" ? "سب" : "All",
    cardio: lang === "ur" ? "کارڈیو" : "Cardio",
    strength: lang === "ur" ? "طاقت" : "Strength",
    joint: lang === "ur" ? "جوڑوں کے لیے محفوظ" : "Joint-friendly",
  }

  return (
    <div className="min-h-screen px-5 pb-24 pt-5">
      <div className="mx-auto max-w-[460px]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("home")}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]"
          >
            <ChevronLeftIcon className="h-4 w-4" /> {t("back", lang)}
          </button>
          <SyncBadge status={state.syncStatus} lang={lang} />
        </div>

        <PageTitle
          eyebrow={lang === "ur" ? "ورزش" : "Workout"}
          title={t("logWorkout", lang)}
          subtitle={
            lang === "ur"
              ? "ایک سادہ ٹیپ، دورانیہ منتخب کریں، اور کیلوریز خود حساب ہو جائیں۔"
              : "Tap once, choose a duration, and let calories calculate automatically."
          }
        />

        {hasJointCondition && (
          <Panel tone="soft" className="mt-5 px-4 py-3">
            <p className="text-sm font-bold text-[#d96d20]">
              {lang === "ur"
                ? "جوڑوں کے لیے محفوظ ورزشیں دکھائی جا رہی ہیں۔"
                : "Showing joint-safe exercises for you."}
            </p>
          </Panel>
        )}

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {(["all", "cardio", "strength", "joint"] as Cat[]).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold"
              style={{
                background: cat === c ? "#6c9e36" : "#fff8ee",
                borderColor: cat === c ? "#6c9e36" : "#e6d5ba",
                color: cat === c ? "#fff" : "#2c2418",
              }}
            >
              {catLabel[c]}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {filtered.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                setSelected(w)
                setDuration(20)
              }}
              className="rounded-[22px] border border-[#e6d5ba] bg-[#fff8ee] p-4 text-left"
            >
              <div className="text-2xl">{w.icon}</div>
              <div className="mt-3 text-[15px] font-extrabold text-[#2c2418]">
                {w.name}
              </div>
              <div className="mt-1 text-xs text-[#6e5d4a]">{w.nameUr}</div>
              <div className="mt-2 text-xs font-bold text-[#6c9e36]">
                ~{w.calPerMin * 20} cal / 20 min
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2c2418]/28 p-4">
            <Panel className="mx-auto flex max-h-[76vh] w-full max-w-[380px] flex-col overflow-hidden rounded-[30px] p-5">
              <div className="mb-4 flex shrink-0 items-start justify-between">
                <div>
                  <div className="font-heading text-[22px] font-semibold text-[#241f15]">
                    {selected.icon} {selected.name}
                  </div>
                  <div className="mt-1 text-sm text-[#6e5d4a]">
                    {selected.nameUr}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-2xl leading-none text-[#6e5d4a]"
                >
                  ×
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mb-4 flex items-center justify-between rounded-[22px] bg-[#fff8ee] p-4">
                  <span className="text-sm font-bold text-[#2c2418]">
                    {lang === "ur" ? "دورانیہ" : "Duration"} (min)
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDuration(Math.max(5, duration - 5))}
                      className="h-10 w-10 rounded-full bg-[#eadcc7] text-xl font-bold"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-xl font-black text-[#2c2418]">
                      {duration}
                    </span>
                    <button
                      onClick={() => setDuration(duration + 5)}
                      className="h-10 w-10 rounded-full bg-[#6c9e36] text-xl font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="rounded-[22px] bg-[#fff1da] p-4 text-center">
                  <span className="text-sm font-bold text-[#8b6f46]">
                    {lang === "ur" ? "جلائی گئی کیلوریز" : "Calories burned"}
                  </span>
                  <div className="mt-1 text-[24px] font-black text-[#d96d20]">
                    ~{selected.calPerMin * duration}
                  </div>
                </div>
              </div>

              <button
                onClick={log}
                disabled={saving}
                className="mt-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#6c9e36] px-5 py-3.5 font-extrabold text-white shadow-[0_12px_26px_rgba(108,158,54,0.16)] disabled:opacity-70"
              >
                {saving && <Spinner size={16} color="#fff" />}
                {t("log", lang)} {duration} {lang === "ur" ? "منٹ" : "min"}
              </button>
            </Panel>
          </div>
        )}

        {state.today.workoutEntries.length > 0 && (
          <div className="mt-6">
            <SectionLabel>
              {lang === "ur" ? "آج کی ورزش" : "Today's workouts"}
            </SectionLabel>
            <div className="space-y-2">
              {state.today.workoutEntries.map((e) => (
                <Panel
                  key={e.id}
                  className="flex items-center justify-between px-4 py-4"
                >
                  <div>
                    <div className="text-[15px] font-extrabold text-[#2c2418]">
                      {e.name}
                    </div>
                    <div className="mt-1 text-xs text-[#6e5d4a]">
                      {e.duration} min · {e.caloriesBurned} cal
                    </div>
                  </div>
                  <button
                    onClick={() => remove(e.id)}
                    disabled={removingId === e.id}
                    aria-label={lang === "ur" ? "حذف کریں" : "Remove entry"}
                    className="rounded-full bg-[#fff1da] px-3 py-1.5 text-sm font-extrabold text-[#d96d20] disabled:opacity-50"
                  >
                    {removingId === e.id ? (
                      <Spinner size={12} color="#d96d20" />
                    ) : (
                      "×"
                    )}
                  </button>
                </Panel>
              ))}
              <Panel
                tone="warm"
                className="flex items-center justify-between px-4 py-4"
              >
                <span className="text-sm font-extrabold text-[#2c2418]">
                  {lang === "ur" ? "کل" : "Total"}
                </span>
                <span className="text-sm font-black text-[#6c9e36]">
                  {state.today.workoutMinutes} min
                </span>
              </Panel>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
