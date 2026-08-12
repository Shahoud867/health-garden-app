import { useState } from "react"
import type { NavProps, AppState } from "../types"
import { t } from "../types"
import { upsertWeightLog } from "../lib/api/logs"
import { todayLocalDate } from "../lib/date"
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

type Period = "weekly" | "monthly"

export default function WeightScreen({
  navigate,
  lang,
  state,
  setState,
  userId,
  refetch,
}: Props) {
  const { showToast } = useToast()
  const [period, setPeriod] = useState<Period>("weekly")
  const [inputVal, setInputVal] = useState(String(state.user.weightKg))
  const [saving, setSaving] = useState(false)
  const [logged, setLogged] = useState(false)

  const logWeight = async () => {
    const w = parseFloat(inputVal)
    if (Number.isNaN(w) || w < 20 || w > 300) {
      showToast(
        lang === "ur"
          ? "براہ کرم درست وزن درج کریں۔"
          : "Please enter a valid weight (20–300kg).",
        "error",
      )
      return
    }
    setSaving(true)
    const today = todayLocalDate()

    // Offline (or a connection too flaky to reach the server at all) is
    // known upfront -- no reason to wait out a 15s timeout to discover
    // what navigator.onLine already knows. A save made offline still queues
    // and still reflects locally; it just isn't real until it replays.
    if (!navigator.onLine) {
      await enqueueWrite("weight", { userId, weightKg: w, date: today })
      setState({ syncStatus: "pending" })
      setLogged(true)
      setSaving(false)
      showToast(t("syncPending", lang), "success")
      return
    }

    try {
      await upsertWeightLog(userId, w, today)
      track("log_created", { type: "weight" })
      await refetch()
      setLogged(true)
    } catch (err) {
      if (isOfflineLikeError(err)) {
        // navigator.onLine reported true but the request still never
        // reached the server -- a real, if less common, gap that flag has
        // (e.g. a captive portal, or connectivity that dropped between the
        // check above and this request). Same outcome either way: queue it.
        await enqueueWrite("weight", { userId, weightKg: w, date: today })
        setState({ syncStatus: "pending" })
        setLogged(true)
        showToast(t("syncPending", lang), "success")
      } else {
        showToast(
          err instanceof Error ? err.message : "Could not save your weight.",
          "error",
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const history = state.weightHistory.slice(-28)
  const displayData = period === "weekly" ? history.slice(-7) : history
  const minW =
    displayData.length > 0
      ? Math.min(...displayData.map((d) => d.weight)) - 2
      : 0
  const maxW =
    displayData.length > 0
      ? Math.max(...displayData.map((d) => d.weight)) + 2
      : 100

  const W = 300
  const H = 108
  const xScale = (i: number) =>
    displayData.length > 1 ? (i / (displayData.length - 1)) * W : W / 2
  const yScale = (w: number) => H - ((w - minW) / (maxW - minW)) * H

  const pathD =
    displayData.length > 1
      ? displayData
          .map(
            (d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)},${yScale(d.weight)}`,
          )
          .join(" ")
      : ""

  const areaD = pathD
    ? `${pathD} L ${xScale(displayData.length - 1)},${H} L ${xScale(0)},${H} Z`
    : ""

  const latestWeight = state.today.weightLog || state.user.weightKg
  const startWeight =
    history.length > 0 ? history[0].weight : state.user.weightKg
  const delta = latestWeight - startWeight

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
          eyebrow={lang === "ur" ? "وزن" : "Weight"}
          title={t("logWeight", lang)}
          subtitle={
            lang === "ur"
              ? "ایک ہلکا، پرسکون لاگ اور ایک صاف رجحان چارٹ۔"
              : "A simple, calm log with a clean trend chart."
          }
        />

        <Panel className="mt-6 p-5">
          <SectionLabel>
            {lang === "ur" ? "آج کا وزن" : "Today's weight"}
          </SectionLabel>
          <div className="flex items-end gap-3">
            <input
              type="number"
              min="20"
              max="300"
              step="0.1"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value)
                setLogged(false)
              }}
              className="flex-1 border-0 bg-transparent text-center text-[42px] font-black tracking-[-0.05em] text-[#2c2418] outline-none"
              aria-label={
                lang === "ur" ? "وزن کلوگرام میں" : "Weight in kilograms"
              }
            />
            <span className="pb-2 text-lg font-bold text-[#6e5d4a]">kg</span>
          </div>
          <button
            onClick={logWeight}
            disabled={saving}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 font-extrabold text-white shadow-[0_12px_26px_rgba(108,158,54,0.16)] disabled:opacity-80"
            style={{ background: logged ? "#9fc26d" : "#6c9e36" }}
          >
            {saving && <Spinner size={16} color="#fff" />}
            {logged ? (lang === "ur" ? "✓ محفوظ" : "✓ Saved") : t("save", lang)}
          </button>
        </Panel>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            {
              label: lang === "ur" ? "موجودہ" : "Current",
              val: `${latestWeight}kg`,
              color: "#2c2418",
              testid: "weight-current",
            },
            {
              label: lang === "ur" ? "ابتدائی" : "Start",
              val: `${startWeight}kg`,
              color: "#6e5d4a",
              testid: "weight-start",
            },
            {
              label: lang === "ur" ? "تبدیلی" : "Change",
              val: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}kg`,
              color: delta <= 0 ? "#6c9e36" : "#d96d20",
              testid: "weight-change",
            },
            // "Current" and "Start" render the exact same text for a
            // first-ever weight log (history has just the one entry, so
            // history[0] *is* today's) -- distinct testids, not shared
            // text, are what let a caller (or a test) tell these apart
            // unambiguously regardless of that coincidence.
          ].map((s) => (
            <Panel key={s.label} className="px-3 py-4 text-center">
              <div
                className="text-[18px] font-black"
                style={{ color: s.color }}
                data-testid={s.testid}
              >
                {s.val}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b6f46]">
                {s.label}
              </div>
            </Panel>
          ))}
        </div>

        <Panel className="mt-5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-[22px] font-semibold text-[#241f15]">
              {lang === "ur" ? "وزن کا رجحان" : "Weight trend"}
            </h2>
            <div className="flex gap-1 rounded-full bg-[#f3ead7] p-1">
              {([
                ["weekly", lang === "ur" ? "ہفتہ" : "Week"],
                ["monthly", lang === "ur" ? "مہینہ" : "Month"],
              ] as [Period, string][]).map(([p, l]) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="rounded-full px-3 py-1 text-xs font-extrabold"
                  style={{
                    background: period === p ? "#6c9e36" : "transparent",
                    color: period === p ? "#fff" : "#6e5d4a",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {displayData.length < 2 ? (
            <div className="py-8 text-center text-sm text-[#6e5d4a]">
              {lang === "ur"
                ? "رجحان دیکھنے کے لیے کچھ دن لاگ کریں۔"
                : "Log for a few days to see your trend."}
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${W} ${H + 20}`}
              className="w-full overflow-visible"
            >
              <defs>
                <linearGradient id="weight-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6c9e36" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#6c9e36" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <line
                  key={f}
                  x1="0"
                  y1={f * H}
                  x2={W}
                  y2={f * H}
                  stroke="#eadcc7"
                  strokeWidth="1"
                />
              ))}
              <path d={areaD} fill="url(#weight-grad)" />
              <path
                d={pathD}
                fill="none"
                stroke="#6c9e36"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {displayData.map((d, i) => (
                <circle
                  key={i}
                  cx={xScale(i)}
                  cy={yScale(d.weight)}
                  r="3.5"
                  fill="#6c9e36"
                  stroke="#fff8ee"
                  strokeWidth="2"
                />
              ))}
              {displayData.map(
                (d, i) =>
                  (i === 0 || i === displayData.length - 1) && (
                    <text
                      key={i}
                      x={xScale(i)}
                      y={H + 16}
                      textAnchor="middle"
                      style={{
                        fontSize: 9,
                        fill: "#6e5d4a",
                        fontFamily: "'Nunito', sans-serif",
                      }}
                    >
                      {d.date.slice(5)}
                    </text>
                  ),
              )}
            </svg>
          )}
        </Panel>
      </div>
    </div>
  )
}
