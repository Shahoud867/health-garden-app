import { useEffect, useState } from "react"
import type { NavProps, AppState } from "../types"
import { t } from "../types"
import {
  addWaterGlass,
  removeLastWaterGlass,
  getWaterHistory,
} from "../lib/api/logs"
import { localDateDaysAgo, todayLocalDate } from "../lib/date"
import { useToast } from "../hooks/useToast"
import { track } from "../lib/analytics"
import { enqueueWrite, isOfflineLikeError } from "../lib/offlineQueue"
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

const WEEK_DAY_LABELS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const WEEK_DAY_LABELS_UR = [
  "پیر",
  "منگل",
  "بدھ",
  "جمعرات",
  "جمعہ",
  "ہفتہ",
  "اتوار",
]

export default function WaterScreen({
  navigate,
  lang,
  state,
  setState,
  userId,
  refetch,
}: Props) {
  const { showToast } = useToast()
  const glasses = state.today.waterGlasses
  // Personalized at onboarding from body weight (~33ml/kg, a standard
  // public-health heuristic -- see OnboardingScreen's identical comment),
  // not the same flat "8 glasses" every user used to see regardless of
  // their own weight or activity level.
  const goal = state.user.waterTarget
  const [pending, setPending] = useState(false)
  const [weekTotals, setWeekTotals] = useState<number[]>([])

  useEffect(() => {
    const dates = Array.from({ length: 7 }, (_, i) => localDateDaysAgo(6 - i)) // oldest -> today, left to right
    getWaterHistory(userId, dates)
      .then((totals) => setWeekTotals(dates.map((d) => totals[d] ?? 0)))
      .catch(() => {
        // Non-critical: the weekly chart just stays empty if this fails.
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, glasses])

  /** Queues offline like the other three logging screens (see
   * WeightScreen's identical comment) -- but also, uniquely among them,
   * updates the on-screen count optimistically either way. A glass count is
   * simple and safe to predict client-side (glasses + 1, always), unlike
   * weight/garden state, which only the server's own derivation can
   * actually produce -- so there's no reason to make this one wait. */
  const addGlass = async () => {
    if (pending) return
    setPending(true)
    const today = todayLocalDate()

    if (!navigator.onLine) {
      await enqueueWrite("water", { userId, date: today })
      setState({
        today: { ...state.today, waterGlasses: state.today.waterGlasses + 1 },
        syncStatus: "pending",
      })
      setPending(false)
      return
    }

    try {
      await addWaterGlass(userId)
      track("log_created", { type: "water" })
      await refetch()
    } catch (err) {
      if (isOfflineLikeError(err)) {
        await enqueueWrite("water", { userId, date: today })
        setState({
          today: {
            ...state.today,
            waterGlasses: state.today.waterGlasses + 1,
          },
          syncStatus: "pending",
        })
      } else {
        showToast(
          err instanceof Error ? err.message : "Could not log that glass.",
          "error",
        )
      }
    } finally {
      setPending(false)
    }
  }

  // Deliberately not offline-queued: "remove the most recent glass" needs
  // to know which real row that is, which a client that might already have
  // its own unsynced queued glasses can't safely determine offline. Still
  // requires connectivity, same as before this change -- undoing an
  // uncertain server-side state blindly would be worse than just asking to
  // wait for a connection.
  const removeGlass = async () => {
    if (pending || glasses === 0) return
    setPending(true)
    try {
      await removeLastWaterGlass(userId)
      await refetch()
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not update that.",
        "error",
      )
    } finally {
      setPending(false)
    }
  }

  const todayIndex = 6 // rightmost bar is always today, given the oldest-to-today ordering above

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
          eyebrow={lang === "ur" ? "پانی" : "Water"}
          title={t("logWater", lang)}
          subtitle={
            lang === "ur"
              ? "ایک ٹیپ میں ایک گلاس، اور پیش رفت فوراً نظر آتی ہے۔"
              : "One tap to add a glass, with progress visible instantly."
          }
        />

        <Panel tone="cool" className="mt-6 p-5 text-center">
          <div
            className="mx-auto mb-3 flex h-[220px] w-[220px] items-center justify-center rounded-full border-[14px] border-[#d7ecf1] bg-white/75"
            style={{ borderTopColor: "#3b8f9f", borderRightColor: "#8fd0df" }}
          >
            <div className="text-center">
              <div
                data-testid="water-glass-count"
                className="text-[56px] font-black leading-none text-[#3b8f9f]"
              >
                {glasses}
              </div>
              <div className="mt-1 text-sm font-bold text-[#6e5d4a]">
                {lang === "ur" ? `${goal} میں سے` : `of ${goal} glasses`}
              </div>
              {glasses >= goal && (
                <div className="mt-2 text-xs font-extrabold text-[#6c9e36]">
                  {lang === "ur" ? "ہدف پورا!" : "Goal reached!"}
                </div>
              )}
            </div>
          </div>

          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {Array.from({ length: Math.max(goal, glasses) }).map((_, i) => (
              <span
                key={i}
                className="h-3 w-3 rounded-full border"
                style={{
                  background: i < glasses ? "#3b8f9f" : "#fff",
                  borderColor: i < glasses ? "#3b8f9f" : "#cde2e8",
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-5">
            <button
              onClick={removeGlass}
              disabled={glasses === 0 || pending}
              aria-label={
                lang === "ur" ? "ایک گلاس کم کریں" : "Remove one glass"
              }
              className="h-16 w-16 rounded-full bg-[#eadcc7] text-2xl font-black text-[#2c2418] disabled:opacity-50"
            >
              −
            </button>
            <button
              onClick={addGlass}
              disabled={pending}
              aria-label={
                lang === "ur" ? "ایک گلاس شامل کریں" : "Add one glass"
              }
              className="flex h-20 w-20 items-center justify-center rounded-full bg-[#3b8f9f] text-3xl font-black text-white shadow-[0_12px_24px_rgba(59,143,159,0.18)] disabled:opacity-70"
            >
              {pending ? <Spinner size={22} color="#fff" /> : "+"}
            </button>
          </div>

          <p className="mt-5 text-sm leading-7 text-[#6e5d4a]">
            {lang === "ur"
              ? "ایک ٹیپ سے ایک گلاس شامل کریں۔ روزانہ آٹھ گلاس ہدف ہے۔"
              : "One tap to add a glass. The daily goal is eight glasses."}
          </p>
        </Panel>

        <Panel className="mt-6 p-5">
          <SectionLabel>{lang === "ur" ? "اس ہفتے" : "This week"}</SectionLabel>
          <div className="grid grid-cols-7 gap-2">
            {(lang === "ur" ? WEEK_DAY_LABELS_UR : WEEK_DAY_LABELS_EN).map(
              (d, i) => {
                const val = i === todayIndex ? glasses : (weekTotals[i] ?? 0)
                return (
                  <div key={d + i} className="flex flex-col items-center gap-2">
                    <div className="flex h-24 w-8 items-end rounded-full bg-[#f3ead7] p-1">
                      <div
                        className="w-full rounded-full bg-[#3b8f9f]"
                        style={{
                          height: `${Math.max((val / goal) * 100, val > 0 ? 12 : 2)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#7b6851]">
                      {d}
                    </span>
                  </div>
                )
              },
            )}
          </div>
        </Panel>

        <div className="mt-6 rounded-[26px] border border-[#e6d5ba] bg-[#fff8ee] p-5">
          <p className="text-[15px] font-bold text-[#2c2418]">
            {lang === "ur"
              ? "چھوٹی پیش رفت بھی اہم ہے۔"
              : "Small progress still counts."}
          </p>
          <div className="mt-2 text-sm leading-7 text-[#6e5d4a]">
            {lang === "ur"
              ? "اپنے دن میں پانی کا ایک گلاس شامل کریں اور رفتار کو پرسکون رکھیں۔"
              : "Add one more glass and keep the pace calm."}
          </div>
        </div>
      </div>
    </div>
  )
}
