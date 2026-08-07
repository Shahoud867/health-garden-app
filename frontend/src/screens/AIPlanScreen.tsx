import { useEffect, useState } from "react"
import type { NavProps, AppState } from "../types"
import { t } from "../types"
import {
  generateAiPlan,
  getLatestAiPlan,
  getPlanRegenerationsUsed,
  type RegenerationReason,
} from "../lib/api/ai"
import { useToast } from "../hooks/useToast"
import {
  ChevronLeftIcon,
  Panel,
  PageTitle,
  SectionLabel,
} from "../components/Primitives"
import { Spinner, Skeleton } from "../components/Loading"

interface Props extends NavProps {
  state: AppState
  setState: (p: Partial<AppState>) => void
  userId: string
}

type PlanKind = "diet" | "workout"

const REGEN_REASONS: { id: RegenerationReason; en: string; ur: string }[] = [
  { id: "too_repetitive", en: "Too repetitive", ur: "بہت دہرایا ہوا" },
  { id: "too_expensive", en: "Too expensive", ur: "بہت مہنگا" },
  {
    id: "no_time_to_cook",
    en: "Don't have time to cook",
    ur: "پکانے کا وقت نہیں",
  },
  {
    id: "want_more_protein",
    en: "Want more protein",
    ur: "زیادہ پروٹین چاہیے",
  },
  {
    id: "too_much_dairy",
    en: "Too much dairy",
    ur: "بہت زیادہ دودھ والی اشیاء",
  },
  { id: "make_it_lighter", en: "Make it lighter", ur: "ہلکا بنائیں" },
]

export default function AIPlanScreen({
  navigate,
  lang,
  isPremium,
  state,
  setState,
  userId,
}: Props) {
  const { showToast } = useToast()
  const [planKind, setPlanKind] = useState<PlanKind>("diet")
  const [generating, setGenerating] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [showReasons, setShowReasons] = useState(false)
  const used = state.aiPlan.regenUsed
  const locked = !isPremium
  const hasPlan = Boolean(state.aiPlan.plan)

  // Load whatever plan already exists for this type/period (if any) so a
  // returning user sees their real plan instead of an empty state every visit.
  useEffect(() => {
    if (locked || !userId) return
    let cancelled = false
    setLoadingExisting(true)
    getLatestAiPlan(userId, planKind)
      .then(async (existing) => {
        if (cancelled) return
        if (!existing) {
          setState({
            aiPlan: {
              plan: null,
              regenUsed: 0,
              regenCap: state.aiPlan.regenCap,
            },
          })
          return
        }
        const regenUsed =
          planKind === "diet"
            ? await getPlanRegenerationsUsed(
                userId,
                planKind,
                existing.periodStart,
              )
            : 0
        if (cancelled) return
        setState({
          aiPlan: {
            plan: existing.text,
            regenUsed,
            regenCap: state.aiPlan.regenCap,
          },
        })
      })
      .catch((err) =>
        showToast(
          err instanceof Error ? err.message : "Could not load your plan.",
          "error",
        ),
      )
      .finally(() => {
        if (!cancelled) setLoadingExisting(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately
    // re-runs only when the selected plan type or user changes, not on every
    // aiPlan/state update this effect itself may trigger.
  }, [planKind, userId, locked])

  const generate = async (regenerateReason?: RegenerationReason) => {
    setGenerating(true)
    setShowReasons(false)
    try {
      const text = await generateAiPlan(planKind, regenerateReason)
      setState({
        aiPlan: {
          plan: text,
          regenUsed: regenerateReason ? used + 1 : state.aiPlan.regenUsed,
          regenCap: state.aiPlan.regenCap,
        },
      })
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not generate a plan.",
        "error",
      )
    } finally {
      setGenerating(false)
    }
  }

  if (locked) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6">
        <button
          onClick={() => navigate("premium")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]"
        >
          <ChevronLeftIcon className="h-4 w-4" /> {t("back", lang)}
        </button>
        <Panel className="px-5 py-8 text-center">
          <PageTitle
            eyebrow={lang === "ur" ? "پریمیم فیچر" : "Premium feature"}
            title={lang === "ur" ? "ہفتہ وار منصوبہ" : "Weekly plan"}
            subtitle={t("premiumDesc", lang)}
            align="center"
          />
          <button
            type="button"
            onClick={() => navigate("premium")}
            className="mt-8 rounded-full bg-[#d96d20] px-7 py-3 font-extrabold text-white shadow-[0_10px_24px_rgba(217,109,32,0.18)]"
          >
            {t("upgrade", lang)}
          </button>
        </Panel>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-6">
      <button
        onClick={() => navigate("home")}
        className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]"
      >
        <ChevronLeftIcon className="h-4 w-4" /> {t("back", lang)}
      </button>

      <PageTitle
        eyebrow={lang === "ur" ? "اے آئی منصوبہ" : "AI plan"}
        title={
          lang === "ur"
            ? "اس ہفتے کے نرم اشارے"
            : "Gentle guidance for the week"
        }
        subtitle={
          lang === "ur"
            ? "یہ منصوبہ آپ کی اپنی خوراک اور ورزش کی فہرست سے، آپ کے حالیہ رجحان کے مطابق بنتا ہے۔"
            : "Built only from real dishes and exercises in the app, shaped by your recent consistency."
        }
      />

      <div className="mt-5 flex gap-2">
        {(["diet", "workout"] as PlanKind[]).map((k) => (
          <button
            key={k}
            onClick={() => setPlanKind(k)}
            className="flex-1 rounded-full border px-4 py-2.5 text-sm font-extrabold"
            style={{
              background: planKind === k ? "#6c9e36" : "#fff8ee",
              borderColor: planKind === k ? "#6c9e36" : "#e6d5ba",
              color: planKind === k ? "#fff" : "#2c2418",
            }}
          >
            {k === "diet"
              ? lang === "ur"
                ? "خوراک"
                : "Diet"
              : lang === "ur"
                ? "ورزش"
                : "Workout"}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => generate()}
          disabled={generating}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#6c9e36] px-5 py-3 font-extrabold text-white shadow-[0_10px_24px_rgba(108,158,54,0.18)] disabled:opacity-70"
        >
          {generating && <Spinner size={16} color="#fff" />}
          {hasPlan
            ? lang === "ur"
              ? "دوبارہ بنائیں"
              : "Generate again"
            : lang === "ur"
              ? "منصوبہ بنائیں"
              : "Generate plan"}
        </button>
        {planKind === "diet" && (
          <button
            type="button"
            onClick={() => setShowReasons(true)}
            disabled={used >= state.aiPlan.regenCap || generating || !hasPlan}
            className="rounded-full border border-[#e6d5ba] bg-[#fff8ee] px-4 py-3 font-bold text-[#2c2418] disabled:opacity-50"
          >
            {lang === "ur"
              ? `${used}/${state.aiPlan.regenCap} بار`
              : `${used}/${state.aiPlan.regenCap} used`}
          </button>
        )}
      </div>

      {showReasons && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2c2418]/28 p-4">
          <Panel className="mx-auto w-full max-w-[380px] rounded-[30px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-heading text-[18px] font-semibold text-[#241f15]">
                {lang === "ur" ? "کیوں دوبارہ بنائیں؟" : "Why regenerate?"}
              </div>
              <button
                onClick={() => setShowReasons(false)}
                className="text-2xl leading-none text-[#6e5d4a]"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {REGEN_REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => generate(r.id)}
                  className="w-full rounded-2xl border border-[#e6d5ba] bg-[#fffaf1] px-4 py-3 text-left text-sm font-bold text-[#2c2418]"
                >
                  {lang === "ur" ? r.ur : r.en}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {loadingExisting ? (
        <div className="mt-5 space-y-2">
          <Skeleton height={80} />
        </div>
      ) : hasPlan ? (
        <Panel className="mt-5 p-5">
          <SectionLabel>
            {lang === "ur" ? "آپ کا منصوبہ" : "Your plan"}
          </SectionLabel>
          <p className="whitespace-pre-line text-[14px] leading-7 text-[#2c2418]">
            {state.aiPlan.plan}
          </p>
        </Panel>
      ) : (
        <Panel className="mt-5 p-6 text-center">
          <p className="text-[15px] leading-7 text-[#6e5d4a]">
            {lang === "ur"
              ? "منصوبہ ابھی نہیں بنا۔ ایک بٹن دبائیں اور شروع کریں۔"
              : "Your weekly plan is ready when you are."}
          </p>
        </Panel>
      )}
    </main>
  )
}
