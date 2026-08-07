import { useEffect, useState } from "react"
import type { NavProps, AppState, PlantState } from "../types"
import { t, CYCLE_LENGTH } from "../types"
import { getPermanentGarden } from "../lib/api/garden"
import { useToast } from "../hooks/useToast"
import type { PermanentGardenRow } from "../lib/database.types"
import PlantImage from "../components/PlantImage"
import GardenBoard from "../components/GardenBoard"
import { Skeleton } from "../components/Loading"
import {
  GARDEN_THEMES,
  DEFAULT_THEME_SLUG,
  themeBySlug,
} from "../data/gardenThemes"
import {
  ChevronLeftIcon,
  Panel,
  PageTitle,
  SectionLabel,
} from "../components/Primitives"

interface Props extends NavProps {
  state: AppState
  userId: string
}

type PlantType = PlantState["type"]

const PLANT_META: Record<string, {
  labelEn: string
  labelUr: string
  goalEn: string
  goalUr: string
  color: string
}> = {
  cactus: {
    labelEn: "Cactus",
    labelUr: "کیکٹس",
    goalEn: "Sugar-free",
    goalUr: "شکر سے پاک",
    color: "#d96d20",
  },
  sunflower: {
    labelEn: "Sunflower",
    labelUr: "سورج مکھی",
    goalEn: "Movement",
    goalUr: "حرکت",
    color: "#6c9e36",
  },
  bellflower: {
    labelEn: "Mint",
    labelUr: "پودینہ",
    goalEn: "Hydration",
    goalUr: "پانی",
    color: "#3b8f9f",
  },
  bamboo: {
    labelEn: "Wheat Stalk",
    labelUr: "بانس",
    goalEn: "Protein",
    goalUr: "پروٹین",
    color: "#e3ab25",
  },
  succulent: {
    labelEn: "Succulent",
    labelUr: "سکیو لَنت",
    goalEn: "Consistency",
    goalUr: "تسلسل",
    color: "#7c7d4b",
  },
}

const PLANT_ORDER: PlantType[] = [
  "cactus",
  "sunflower",
  "bellflower",
  "bamboo",
  "succulent",
]

/** A plant's artwork stage is how many qualifying days it has banked in the
 * current cycle -- 0-2 in progress, 3 completes and graduates it. */
function stageFromCycle(cycleDays: number): 0 | 1 | 2 | 3 {
  return Math.min(cycleDays, CYCLE_LENGTH) as 0 | 1 | 2 | 3
}

function PlantProgress({
  plant,
  lang,
}: {
  plant: PlantState
  lang: Props["lang"]
}) {
  const meta = PLANT_META[plant.type]
  const stage = stageFromCycle(plant.cycleDays)
  const isResting = !plant.metToday

  const pct = Math.min(100, (plant.cycleDays / CYCLE_LENGTH) * 100)

  return (
    <div className="flex items-center gap-3 border-b border-[#eadcc7] py-3 last:border-b-0">
      <div className="flex h-12 w-12 shrink-0 items-end justify-center">
        <PlantImage
          plant={plant.type}
          stage={stage}
          dormant={isResting}
          size={46}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="truncate text-sm font-extrabold text-[#2c2418]">
            {lang === "ur" ? meta.labelUr : meta.labelEn}
          </div>
          <div
            className="shrink-0 text-sm font-extrabold"
            style={{ color: isResting ? "#8b6f46" : meta.color }}
          >
            {plant.cycleDays}/{CYCLE_LENGTH}
          </div>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#f3ead7]">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${pct}%`,
              background: isResting ? "#d9c7a8" : meta.color,
            }}
          />
        </div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b6f46]">
          {isResting
            ? lang === "ur"
              ? "آج آرام"
              : "Resting today"
            : lang === "ur"
              ? meta.goalUr
              : meta.goalEn}
        </div>
      </div>
    </div>
  )
}

export default function GardenScreen({ navigate, lang, state, userId }: Props) {
  const { showToast } = useToast()
  const [tab, setTab] = useState<"week" | "gardens" | "history">("week")
  const { garden } = state
  const totalMet = garden.filter((p) => p.metToday).length
  const allResting = totalMet === 0

  const [permanentGarden, setPermanentGarden] =
    useState<PermanentGardenRow[] | null>(null)

  useEffect(() => {
    getPermanentGarden(userId)
      .then(setPermanentGarden)
      .catch((err) =>
        showToast(
          err instanceof Error
            ? err.message
            : "Could not load your garden history.",
          "error",
        ),
      )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const theme = themeBySlug(DEFAULT_THEME_SLUG)
  const currentBoardNumber = permanentGarden
    ? Math.max(0, ...permanentGarden.map((p) => p.board_number))
    : 0
  const inProgress = (permanentGarden ?? []).filter(
    (p) => p.board_number === currentBoardNumber,
  )
  // permanent_garden stores the backend's plant_type (mint/cactus/wheat_stalk/
  // sapling/succulent), not the frontend's art-name -- BACKEND_PLANT_TO_FRONTEND
  // (below) maps each row directly.
  const plantedTypes = inProgress
    .sort((a, b) => a.slot_index - b.slot_index)
    .map((p) => BACKEND_PLANT_TO_FRONTEND[p.plant_type])
  const capacity = theme.slots.length

  const completedBoardNumbers = Array.from(
    new Set(
      (permanentGarden ?? [])
        .filter(
          (p) =>
            p.board_number !== currentBoardNumber ||
            inProgress.length >= capacity,
        )
        .map((p) => p.board_number),
    ),
  ).sort((a, b) => a - b)

  const recentlyCompleted = [...(permanentGarden ?? [])]
    .sort((a, b) => b.completed_on.localeCompare(a.completed_on))
    .slice(0, 12)

  return (
    <div className="min-h-screen px-5 pb-10 pt-5">
      <div className="mx-auto max-w-[460px]">
        <button
          onClick={() => navigate("home")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]"
        >
          <ChevronLeftIcon className="h-4 w-4" /> {t("back", lang)}
        </button>

        <PageTitle
          eyebrow={lang === "ur" ? "باغیچہ" : "Garden"}
          title={t("garden", lang)}
        />

        <div className="mt-6 inline-flex rounded-full bg-[#f3ead7] p-1">
          {([
            ["week", lang === "ur" ? "اس ہفتے" : "This week"],
            ["gardens", lang === "ur" ? "میرے باغیچے" : "My gardens"],
            ["history", lang === "ur" ? "تاریخ" : "History"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="rounded-full px-4 py-2 text-[13px] font-extrabold"
              style={{
                background: tab === k ? "#fff8ee" : "transparent",
                color: tab === k ? "#2c2418" : "#7b6851",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "week" && (
          <>
            <div className="mt-5 flex items-end justify-between gap-3">
              <div>
                <div className="font-heading text-[22px] font-semibold text-[#241f15]">
                  {lang === "ur" ? "آپ کا باغیچہ" : "Your garden"}
                </div>
                <div className="mt-1 text-sm text-[#6e5d4a]">
                  {lang === "ur"
                    ? "ہر مکمل پودا یہاں ہمیشہ کے لیے لگ جاتا ہے۔"
                    : "Every plant you finish growing is planted here for good."}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[28px] font-black leading-none text-[#6c9e36]">
                  {plantedTypes.length}
                </div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b6f46]">
                  {lang === "ur" ? `${capacity} میں سے` : `of ${capacity}`}
                </div>
              </div>
            </div>

            {permanentGarden === null ? (
              <Skeleton className="mt-4" height={220} />
            ) : (
              <div className="mt-4 -mx-5 w-screen max-w-none translate-x-[calc(50%-50vw)] sm:mx-0 sm:w-auto sm:translate-x-0">
                <GardenBoard
                  theme={theme}
                  plants={plantedTypes}
                  rounded={false}
                />
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#8b6f46]">
              <span>{theme.name}</span>
              <span>
                {plantedTypes.length >= capacity
                  ? lang === "ur"
                    ? "باغیچہ مکمل"
                    : "Garden full"
                  : lang === "ur"
                    ? `${capacity - plantedTypes.length} جگہیں باقی`
                    : `${capacity - plantedTypes.length} spots left`}
              </span>
            </div>

            {allResting && (
              <Panel className="mt-4 p-4">
                <p className="text-sm leading-7 text-[#6e5d4a]">
                  {lang === "ur"
                    ? "آپ کا باغیچہ آج کی لاگ کا انتظار کر رہا ہے۔ ایک چھوٹا قدم بھی اہم ہے۔"
                    : "Your garden is waiting for today’s log. Even a small step counts."}
                </p>
              </Panel>
            )}

            <Panel className="mt-5 p-5">
              <SectionLabel>
                {lang === "ur" ? "اس ہفتے بڑھ رہے ہیں" : "Growing this week"}
              </SectionLabel>
              {garden.map((plant) => (
                <PlantProgress key={plant.type} plant={plant} lang={lang} />
              ))}
            </Panel>
          </>
        )}

        {tab === "gardens" && (
          <div className="mt-5 space-y-4">
            {permanentGarden === null ? (
              <Skeleton height={200} />
            ) : completedBoardNumbers.length === 0 ? (
              <Panel className="p-5">
                <p className="text-sm leading-7 text-[#6e5d4a]">
                  {lang === "ur"
                    ? "جب آپ کا پہلا باغیچہ مکمل ہوگا، وہ یہاں محفوظ ہو جائے گا۔"
                    : "When you fill your first garden, it will be saved here."}
                </p>
              </Panel>
            ) : (
              completedBoardNumbers.map((boardNumber) => {
                const gTheme =
                  GARDEN_THEMES[boardNumber % GARDEN_THEMES.length] ?? theme
                const rows = (permanentGarden ?? [])
                  .filter((p) => p.board_number === boardNumber)
                  .sort((a, b) => a.slot_index - b.slot_index)
                const finishedOn =
                  rows.length > 0 ? rows[rows.length - 1].completed_on : ""
                return (
                  <Panel key={boardNumber} className="overflow-hidden p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="font-heading text-[18px] font-semibold text-[#241f15]">
                          {gTheme.name}
                        </div>
                        <div className="mt-0.5 text-xs text-[#8b6f46]">
                          {finishedOn}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[20px] font-black leading-none text-[#6c9e36]">
                          {rows.length}
                        </div>
                        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b6f46]">
                          {lang === "ur" ? "پودے" : "plants"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <GardenBoard
                        theme={gTheme}
                        plants={rows.map(
                          (r) => BACKEND_PLANT_TO_FRONTEND[r.plant_type],
                        )}
                      />
                    </div>
                  </Panel>
                )
              })
            )}
            <p className="text-center text-xs text-[#8b6f46]">
              {lang === "ur"
                ? "ہر مکمل باغیچہ ہمیشہ کے لیے یہاں رہتا ہے۔"
                : "Every garden you complete stays here for good."}
            </p>
          </div>
        )}

        {tab === "history" && (
          <div className="mt-5">
            <Panel className="p-5">
              <SectionLabel>
                {lang === "ur" ? "حال ہی میں مکمل ہوئے" : "Recently completed"}
              </SectionLabel>
              {permanentGarden === null ? (
                <Skeleton height={120} />
              ) : recentlyCompleted.length === 0 ? (
                <p className="py-6 text-center text-sm leading-7 text-[#6e5d4a]">
                  {lang === "ur"
                    ? "ابھی تک کوئی پودا مکمل نہیں ہوا۔"
                    : "No plants finished growing yet."}
                </p>
              ) : (
                <div className="space-y-3">
                  {recentlyCompleted.map((p) => {
                    const frontendType = BACKEND_PLANT_TO_FRONTEND[p.plant_type]
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-[22px] border border-[#e6d5ba] bg-[#fffaf1] p-3"
                      >
                        <PlantImage plant={frontendType} stage={3} size={40} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-extrabold text-[#2c2418]">
                            {lang === "ur"
                              ? PLANT_META[frontendType].labelUr
                              : PLANT_META[frontendType].labelEn}
                          </div>
                          <div className="text-xs text-[#8b6f46]">
                            {p.completed_on}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <p className="mt-4 text-center text-xs text-[#8b6f46]">
                {lang === "ur"
                  ? "مزید پودے مکمل ہونے پر یہاں محفوظ ہوں گے۔"
                  : "More plants will appear here as you keep logging."}
              </p>
            </Panel>
          </div>
        )}
      </div>
    </div>
  )
}

// Direct backend plant_type -> frontend art-name map (see lib/gardenMapping.ts
// for the goal_type-keyed version used elsewhere). permanent_garden rows
// carry plant_type directly, so no goal_type round-trip is needed here.
const BACKEND_PLANT_TO_FRONTEND: Record<PermanentGardenRow["plant_type"], PlantType> =
  {
    mint: "bellflower",
    cactus: "cactus",
    wheat_stalk: "bamboo",
    sapling: "sunflower",
    succulent: "succulent",
  }
