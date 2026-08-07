import { useEffect, useState } from "react"
import type { NavProps, AppState } from "../types"
import { t } from "../types"
import { searchFoods, listUsualFoods } from "../lib/api/reference"
import { addFoodLog, deleteFoodLog } from "../lib/api/logs"
import { useToast } from "../hooks/useToast"
import type { FoodRow } from "../lib/database.types"
import SyncBadge from "../components/SyncBadge"
import { Spinner, Skeleton } from "../components/Loading"
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

type Slot = "breakfast" | "lunch" | "dinner" | "snack"

/**
 * Serving units a portion can be logged in, with how much each one holds
 * relative to the dish's own base unit -- so switching from katori to plate
 * scales the calories instead of only relabelling them.
 */
const UNIT_OPTIONS: { val: string; en: string; ur: string; factor: number }[] = [
  { val: "katori", en: "Katori", ur: "کٹوری", factor: 1 },
  { val: "cup", en: "Cup", ur: "کپ", factor: 1.25 },
  { val: "bowl", en: "Bowl", ur: "پیالہ", factor: 1.5 },
  { val: "plate", en: "Plate", ur: "پلیٹ", factor: 2 },
  { val: "piece", en: "Piece", ur: "عدد", factor: 1 },
  { val: "tbsp", en: "Tbsp", ur: "چمچ", factor: 0.25 },
  { val: "glass", en: "Glass", ur: "گلاس", factor: 1.5 },
]

function unitScale(baseUnit: string, chosenUnit: string): number {
  const base = UNIT_OPTIONS.find((u) => u.val === baseUnit)?.factor ?? 1
  const chosen = UNIT_OPTIONS.find((u) => u.val === chosenUnit)?.factor ?? 1
  return chosen / base
}

export default function FoodScreen({
  navigate,
  lang,
  state,
  userId,
  refetch,
}: Props) {
  const { showToast } = useToast()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<FoodRow[]>([])
  const [searching, setSearching] = useState(false)
  const [usuals, setUsuals] = useState<FoodRow[]>([])
  const [usualsLoading, setUsualsLoading] = useState(true)
  const [slot, setSlot] = useState<Slot>("breakfast")
  const [qty, setQty] = useState(1)
  const [selected, setSelected] = useState<FoodRow | null>(null)
  const [unit, setUnit] = useState("katori")
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    listUsualFoods()
      .then(setUsuals)
      .catch((err) =>
        showToast(
          err instanceof Error ? err.message : "Could not load foods.",
          "error",
        ),
      )
      .finally(() => setUsualsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([])
      return
    }
    setSearching(true)
    const handle = window.setTimeout(() => {
      searchFoods(query)
        .then(setResults)
        .catch((err) =>
          showToast(
            err instanceof Error ? err.message : "Search failed.",
            "error",
          ),
        )
        .finally(() => setSearching(false))
    }, 300) // debounce -- avoids a query per keystroke
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const grouped = (["breakfast", "lunch", "dinner", "snack"] as const)
    .map((s) => ({
      slot: s,
      entries: state.today.foodEntries.filter((e) => e.slot === s),
    }))
    .filter((g) => g.entries.length > 0)

  const logFood = async (food: FoodRow) => {
    const scale = qty * unitScale(food.portion_unit, unit)
    setSaving(true)
    try {
      await addFoodLog(userId, {
        foodId: food.id,
        mealSlot: slot,
        quantity: qty,
        caloriesSnapshot: Math.round((food.calories ?? 0) * scale),
        proteinGSnapshot: food.protein_g
          ? Math.round(food.protein_g * scale * 10) / 10
          : null,
        sugarFlagSnapshot: food.sugar_flag,
      })
      await refetch()
      setSelected(null)
      setQuery("")
      showToast(lang === "ur" ? "کھانا درج ہو گیا" : "Meal logged.", "success")
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not log that meal.",
        "error",
      )
    } finally {
      setSaving(false)
    }
  }

  const removeEntry = async (id: string) => {
    setRemovingId(id)
    try {
      await deleteFoodLog(Number(id))
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

  const slotLabels: Record<Slot, string> = {
    breakfast: t("breakfast", lang),
    lunch: t("lunch", lang),
    dinner: t("dinner", lang),
    snack: t("snack", lang),
  }

  const inputStyle = {
    width: "100%",
    borderRadius: 18,
    border: "1.5px solid #e6d5ba",
    background: "#fffaf1",
    color: "#2c2418",
    fontSize: 15,
    fontFamily: "'Nunito', sans-serif",
    outline: "none",
    padding: "13px 14px",
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
          eyebrow={lang === "ur" ? "کھانا" : "Food"}
          title={t("logMeal", lang)}
          subtitle={
            lang === "ur"
              ? "مقامی یونٹوں میں کھانا تلاش کریں، مقدار منتخب کریں، اور ایک ہی قدم میں لاگ کریں۔"
              : "Search in local units, pick a quantity, and log in one smooth flow."
          }
        />

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {(["breakfast", "lunch", "dinner", "snack"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className="shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold"
              style={{
                background: slot === s ? "#6c9e36" : "#fff8ee",
                borderColor: slot === s ? "#6c9e36" : "#e6d5ba",
                color: slot === s ? "#fff" : "#2c2418",
              }}
            >
              {slotLabels[s]}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search", lang)}
            style={inputStyle}
            aria-label={t("search", lang)}
          />
        </div>

        {query.length > 0 && (
          <Panel className="mt-4 overflow-hidden">
            {searching ? (
              <div className="space-y-2 p-4">
                <Skeleton height={48} />
                <Skeleton height={48} />
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#6e5d4a]">
                {t("noResults", lang)}
              </div>
            ) : (
              <div className="divide-y divide-[#eadcc7]">
                {results.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => {
                      setSelected(food)
                      setUnit(food.portion_unit)
                      setQuery("")
                    }}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                  >
                    <div>
                      <div className="text-[15px] font-extrabold text-[#2c2418]">
                        {food.dish_name}
                      </div>
                      <div className="mt-1 text-xs text-[#6e5d4a]">
                        {food.urdu_name} · {lang === "ur" ? "فی" : "per"}{" "}
                        {food.portion_unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-[#d96d20]">
                        {food.calories ?? "—"} cal
                      </div>
                      <div className="mt-1 text-xs text-[#6e5d4a]">
                        {food.protein_g ?? 0}g protein
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        )}

        {selected && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2c2418]/28 p-4">
            <Panel className="mx-auto flex max-h-[76vh] w-full max-w-[380px] flex-col overflow-hidden rounded-[30px] p-5">
              <div className="mb-4 flex shrink-0 items-start justify-between">
                <div>
                  <div className="font-heading text-[22px] font-semibold text-[#241f15]">
                    {selected.dish_name}
                  </div>
                  <div className="mt-1 text-sm text-[#6e5d4a]">
                    {selected.urdu_name}
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
                <div className="mb-3">
                  <div className="mb-2 text-sm font-bold text-[#2c2418]">
                    {lang === "ur" ? "پیمانہ" : "Serving unit"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {UNIT_OPTIONS.map((u) => (
                      <button
                        key={u.val}
                        onClick={() => setUnit(u.val)}
                        className="rounded-full border px-3.5 py-1.5 text-[13px] font-extrabold transition-colors"
                        style={{
                          background: unit === u.val ? "#6c9e36" : "#fffaf1",
                          borderColor: unit === u.val ? "#6c9e36" : "#e6d5ba",
                          color: unit === u.val ? "#ffffff" : "#2c2418",
                        }}
                      >
                        {lang === "ur" ? u.ur : u.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between rounded-[22px] bg-[#fff8ee] p-4">
                  <span className="text-sm font-bold text-[#2c2418]">
                    {lang === "ur" ? "مقدار" : "Quantity"}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQty(Math.max(0.5, qty - 0.5))}
                      className="h-10 w-10 rounded-full bg-[#eadcc7] text-xl font-bold"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-xl font-black text-[#2c2418]">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(qty + 0.5)}
                      className="h-10 w-10 rounded-full bg-[#6c9e36] text-xl font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] bg-[#fff8ee] p-4 text-center">
                    <div className="text-sm font-bold text-[#8b6f46]">
                      {lang === "ur" ? "کیلوریز" : "Calories"}
                    </div>
                    <div className="mt-1 text-[22px] font-black text-[#d96d20]">
                      {Math.round(
                        (selected.calories ?? 0) *
                          qty *
                          unitScale(selected.portion_unit, unit),
                      )}
                    </div>
                  </div>
                  <div className="rounded-[22px] bg-[#fff8ee] p-4 text-center">
                    <div className="text-sm font-bold text-[#8b6f46]">
                      {lang === "ur" ? "پروٹین" : "Protein"}
                    </div>
                    <div className="mt-1 text-[22px] font-black text-[#3b8f9f]">
                      {Math.round(
                        (selected.protein_g ?? 0) *
                          qty *
                          unitScale(selected.portion_unit, unit),
                      )}
                      g
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => logFood(selected)}
                disabled={saving}
                className="mt-4 flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#6c9e36] px-5 py-3.5 font-extrabold text-white shadow-[0_12px_26px_rgba(108,158,54,0.16)] disabled:opacity-70"
              >
                {saving && <Spinner size={16} color="#fff" />}
                {t("log", lang)} {slotLabels[slot]}
              </button>
            </Panel>
          </div>
        )}

        {query.length === 0 && (
          <div className="mt-6">
            <SectionLabel>{t("usuals", lang)}</SectionLabel>
            {usualsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                <Skeleton height={78} />
                <Skeleton height={78} />
                <Skeleton height={78} />
                <Skeleton height={78} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {usuals.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => {
                      setSelected(food)
                      setUnit(food.portion_unit)
                    }}
                    className="rounded-[20px] border border-[#e6d5ba] bg-[#fff8ee] p-4 text-left"
                  >
                    <div className="text-[15px] font-extrabold text-[#2c2418]">
                      {food.dish_name}
                    </div>
                    <div className="mt-1 text-[11px] text-[#6e5d4a]">
                      {food.urdu_name} · {food.calories ?? "—"} cal
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <SectionLabel>
            {lang === "ur" ? "آج کا لاگ" : "Today's log"}
          </SectionLabel>
          {grouped.length > 0 ? (
            <div className="space-y-4">
              {grouped.map((g) => (
                <Panel key={g.slot} className="overflow-hidden">
                  <div className="border-b border-[#eadcc7] px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#8b6f46]">
                    {slotLabels[g.slot]}
                  </div>
                  <div className="divide-y divide-[#eadcc7]">
                    {g.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between px-4 py-4"
                      >
                        <div>
                          <div className="text-[15px] font-extrabold text-[#2c2418]">
                            {entry.name}
                          </div>
                          <div className="mt-1 text-xs text-[#6e5d4a]">
                            {entry.qty} × {entry.unit} · {entry.calories} cal
                          </div>
                        </div>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          disabled={removingId === entry.id}
                          aria-label={
                            lang === "ur" ? "حذف کریں" : "Remove entry"
                          }
                          className="rounded-full bg-[#fff1da] px-3 py-1.5 text-sm font-extrabold text-[#d96d20] disabled:opacity-50"
                        >
                          {removingId === entry.id ? (
                            <Spinner size={12} color="#d96d20" />
                          ) : (
                            "×"
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </Panel>
              ))}

              <Panel
                className="flex items-center justify-between px-4 py-4"
                style={{ background: "#e3ab25", borderColor: "#e3ab25" }}
              >
                <span className="text-sm font-extrabold text-[#2c2418]">
                  {lang === "ur" ? "کل" : "Total"}
                </span>
                <span className="text-sm font-black text-[#2c2418]">
                  {state.today.caloriesLogged} / {state.user.calorieTarget} cal
                </span>
              </Panel>
            </div>
          ) : (
            <Panel className="mt-2 p-6 text-center">
              <p className="text-sm leading-7 text-[#6e5d4a]">
                {lang === "ur"
                  ? "ابھی کچھ درج نہیں ہوا۔ اوپر سے تلاش کر کے شروع کریں۔"
                  : "Nothing logged yet. Search above to add a meal."}
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
