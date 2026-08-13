import { useState } from "react"
import type { NavProps, AppState } from "../types"
import { CYCLE_LENGTH } from "../types"
import PlantImage from "../components/PlantImage"
import PushPromptBanner from "../components/PushPromptBanner"
import { usePushPrompt } from "../hooks/usePushPrompt"
import {
  ActionTile,
  FlameIcon,
  MiniIconBadge,
  Panel,
  SectionLabel,
  StatTile,
  WaterIcon,
  ActivityIcon,
  LeafIcon,
} from "../components/Primitives"

interface Props extends NavProps {
  state: AppState
  setState: (p: Partial<AppState>) => void
  userId: string
}

const GARDEN_META = [
  {
    type: "cactus" as const,
    labelEn: "Sugar-free",
    labelUr: "شوگر فری",
    color: "#d96d20",
  },
  {
    type: "sunflower" as const,
    labelEn: "Movement",
    labelUr: "حرکت",
    color: "#6c9e36",
  },
  {
    type: "bellflower" as const,
    labelEn: "Hydration",
    labelUr: "پانی",
    color: "#3b8f9f",
  },
  {
    type: "bamboo" as const,
    labelEn: "Protein",
    labelUr: "پروٹین",
    color: "#dca11b",
  },
  {
    type: "succulent" as const,
    labelEn: "Consistency",
    labelUr: "تسلسل",
    color: "#7c7d4b",
  },
] as const

export default function HomeScreen({ navigate, lang, state, userId }: Props) {
  const { user, today, garden } = state
  const firstName =
    user.name?.trim().split(/\s+/)[0] || (lang === "ur" ? "دوست" : "there")
  const habitsMet = garden.filter((plant) => plant.metToday).length
  const streak = Math.min(7, Math.max(2, habitsMet + 1))
  // Personalized from body weight at onboarding -- see WaterScreen's
  // identical comment for the formula. No longer the same flat number
  // every user saw regardless of who they are.
  const waterGoal = user.waterTarget
  const activeGoal = 30
  const [showWhyTargets, setShowWhyTargets] = useState(false)
  const weeklyProgress = Math.round((habitsMet / 5) * 100)
  const hasLoggedToday =
    today.caloriesLogged > 0 ||
    today.waterGlasses > 0 ||
    today.workoutMinutes > 0 ||
    today.weightLog !== null
  const pushPrompt = usePushPrompt(hasLoggedToday, userId, lang)

  return (
    <div className="min-h-screen pb-24 pt-3">
      <div className="px-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-[0.92rem] font-extrabold text-[#d96d20]">
              {lang === "ur" ? `ہیلو ${firstName}!` : `Hey ${firstName}!`} 👋
            </p>
            <h1 className="mt-1.5 max-w-[8.5ch] text-[clamp(1.35rem,3.3vw,1.9rem)] font-semibold leading-[1] tracking-[-0.06em] text-[#241f15]">
              {lang === "ur"
                ? "ہر اچھا قدم\nآپ کو بڑھاتا ہے۔"
                : "Every good choice\ngrows you."}
            </h1>
            <p className="mt-2.5 max-w-[28ch] text-[11.5px] leading-[1.45] text-[#6e5d4a]">
              {lang === "ur"
                ? "خوراک، پانی، اور حرکت کو آسانی سے ٹریک کریں۔"
                : "Track food, water, movement, and habits with ease."}
            </p>
          </div>

          <Panel tone="warm" className="w-[142px] shrink-0 px-4 py-3">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff6df] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <FlameIcon className="h-6 w-6 text-[#d96d20]" />
              </div>
              <div className="text-center">
                <p className="text-[12px] font-extrabold text-[#2c2418]">
                  {lang === "ur" ? "7 دن کا تسلسل" : "7 Day Streak"}
                </p>
                <p className="mt-0.5 text-[10px] text-[#5f523f]">
                  {lang === "ur"
                    ? "آپ بہت اچھا کر رہے ہیں!"
                    : "You're on fire!"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                  <span
                    key={day}
                    className="inline-flex h-2.5 w-2.5 rounded-full border border-[#efb66c]"
                    style={{
                      background: index < streak ? "#d96d20" : "#fff8ee",
                    }}
                  />
                ))}
              </div>
            </div>
          </Panel>
        </div>

        {pushPrompt.visible && (
          <div className="mt-3">
            <PushPromptBanner
              lang={lang}
              enabling={pushPrompt.enabling}
              onEnable={pushPrompt.enable}
              onDismiss={pushPrompt.dismiss}
            />
          </div>
        )}

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          <StatTile
            title={lang === "ur" ? "کیلوریز" : "Calories"}
            value={today.caloriesLogged}
            subtext={`/ ${user.calorieTarget} cal`}
            color="#d96d20"
            icon={<FlameIcon className="h-5 w-5" />}
          />
          <StatTile
            title={lang === "ur" ? "پانی" : "Water"}
            value={today.waterGlasses}
            subtext={`/ ${waterGoal} glasses`}
            color="#3b8f9f"
            icon={<WaterIcon className="h-5 w-5" />}
          />
          <StatTile
            title={lang === "ur" ? "سرگرمی" : "Activity"}
            value={today.workoutMinutes}
            subtext={`/ ${activeGoal} min`}
            color="#6c9e36"
            icon={<ActivityIcon className="h-5 w-5" />}
          />
          <StatTile
            title={lang === "ur" ? "عادتیں" : "Habits"}
            value={habitsMet}
            subtext={`/ 5 habits`}
            color="#e3ab25"
            icon={<LeafIcon className="h-5 w-5" />}
          />
        </div>

        <button
          onClick={() => setShowWhyTargets((v) => !v)}
          className="mt-2 text-[11px] font-bold text-[#8b6f46] underline decoration-dotted underline-offset-2"
        >
          {lang === "ur" ? "یہ اہداف کیوں؟" : "Why these numbers?"}
        </button>
        {showWhyTargets && (
          <p className="mt-1.5 text-[11.5px] leading-[1.55] text-[#6e5d4a]">
            {lang === "ur"
              ? "یہ اہداف آپ کے اپنے وزن، سرگرمی، اور مقصد سے شمار کیے گئے ہیں — ہر کسی کے لیے ایک جیسے نہیں۔ یہ تخمینے ہیں، طبی نسخہ نہیں۔"
              : `These targets are calculated from your own profile — ${user.weightKg}kg, your activity level, and your goal — not the same numbers everyone sees. Standard formulas, not a medical prescription.`}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-[#eadcc7] pt-3.5">
          <div>
            <h2 className="font-heading text-[18px] font-semibold tracking-[-0.04em] text-[#241f15]">
              {lang === "ur" ? "آج ایک نظر میں" : "Today at a glance"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("weight")}
            className="text-[12px] font-extrabold text-[#d96d20]"
          >
            {lang === "ur" ? "سب دیکھیں" : "See all"} →
          </button>
        </div>

        <Panel className="mt-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-[22px] font-semibold tracking-[-0.04em] text-[#241f15]">
                {lang === "ur" ? "آپ کا باغ" : "Your Garden"}
              </h2>
              <p className="mt-1 text-[13px] text-[#6e5d4a]">
                {lang === "ur"
                  ? "ہر پودا ایک عادت کی نمائندگی کرتا ہے۔"
                  : "Each plant reflects a habit you are growing."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("garden")}
              className="text-[14px] font-extrabold text-[#6c9e36]"
            >
              {lang === "ur" ? "باغ دیکھیں" : "View garden"} →
            </button>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-1.5 rounded-[24px] bg-[#fff8ee] px-3 py-3">
            {GARDEN_META.map((meta) => {
              const plant = garden.find((p) => p.type === meta.type)!
              const stage = Math.min(
                CYCLE_LENGTH,
                plant.cycleDays,
              ) as 0 | 1 | 2 | 3
              return (
                <div
                  key={meta.type}
                  className="flex flex-col items-center text-center"
                >
                  {/* Fixed-height box so the five plants share one ground line
                      despite the artwork varying in height. */}
                  <div className="flex h-11 items-end justify-center">
                    <PlantImage
                      plant={meta.type}
                      stage={stage}
                      dormant={!plant.metToday}
                      size={44}
                    />
                  </div>
                  <div className="mt-1.5 text-[11px] font-bold text-[#241f15]">
                    {lang === "ur" ? meta.labelUr : meta.labelEn}
                  </div>
                  <div
                    className="mt-0.5 text-[11px] font-extrabold"
                    style={{ color: meta.color }}
                  >
                    {plant.cycleDays}/{CYCLE_LENGTH}
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>

        <div className="mt-6">
          <h2 className="font-heading text-[22px] font-semibold tracking-[-0.04em] text-[#241f15]">
            {lang === "ur"
              ? "آپ کیا کرنا چاہیں گے؟"
              : "What would you like to do?"}
          </h2>

          <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
            <ActionTile
              title={lang === "ur" ? "کھانا درج کریں" : "Log a Meal"}
              subtitle={
                lang === "ur" ? "اپنی خوراک ٹریک کریں" : "Track your nutrition"
              }
              onClick={() => navigate("food")}
              color="#d96d20"
              icon={<span className="text-xl">🍽️</span>}
            />
            <ActionTile
              title={lang === "ur" ? "پانی درج کریں" : "Log Water"}
              subtitle={lang === "ur" ? "ہائیڈریٹ رہیں" : "Stay hydrated"}
              onClick={() => navigate("water")}
              color="#3b8f9f"
              icon={<span className="text-xl">💧</span>}
            />
            <ActionTile
              title={lang === "ur" ? "ورزش درج کریں" : "Log a Workout"}
              subtitle={
                lang === "ur" ? "اپنے جسم کو حرکت دیں" : "Move your body"
              }
              onClick={() => navigate("workout")}
              color="#6c9e36"
              icon={<span className="text-xl">🏃</span>}
            />
            <ActionTile
              title={lang === "ur" ? "وزن ٹریک کریں" : "Track Weight"}
              subtitle={
                lang === "ur" ? "ہفتہ وار رجحان دیکھیں" : "See your trend"
              }
              onClick={() => navigate("weight")}
              color="#e3ab25"
              icon={<span className="text-xl">⚖️</span>}
            />
          </div>
        </div>

        <Panel
          tone="warm"
          className="mt-6 flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <MiniIconBadge color="#e3ab25">
              <span className="text-xl">🏆</span>
            </MiniIconBadge>
            <div>
              <p className="text-[16px] font-extrabold text-[#241f15]">
                {lang === "ur"
                  ? "آپ بہت اچھا کر رہے ہیں!"
                  : "You're doing amazing!"}{" "}
                ✨
              </p>
              <p className="mt-1 text-[13px] leading-[1.55] text-[#5f523f]">
                {lang === "ur"
                  ? `آپ نے اس ہفتے کے ${weeklyProgress}% اہداف پورے کیے ہیں۔`
                  : `You've completed ${weeklyProgress}% of your weekly goals. Keep it up!`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("garden-history")}
            className="rounded-full bg-[#f0b93e] px-5 py-2.5 text-[14px] font-extrabold text-[#2c2418] shadow-[0_10px_22px_rgba(240,185,62,0.2)]"
          >
            {lang === "ur" ? "پیش رفت دیکھیں" : "View Progress"} →
          </button>
        </Panel>

        {state.user.conditions.includes("diabetes") && (
          <Panel className="mt-6 p-4">
            <SectionLabel>
              {lang === "ur" ? "ذیابیطس کا نرم اشارہ" : "Diabetes tip"}
            </SectionLabel>
            <p className="text-[13px] leading-[1.55] text-[#5f523f]">
              {lang === "ur"
                ? "کھانے کے بعد تھوڑی چہل قدمی بلڈ شوگر کو متوازن رکھنے میں مدد دے سکتی ہے۔"
                : "A short walk after meals can help keep blood sugar balanced."}
            </p>
          </Panel>
        )}
      </div>
    </div>
  )
}
