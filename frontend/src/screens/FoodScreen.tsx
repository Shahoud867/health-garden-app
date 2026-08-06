import { useState } from 'react'
import type { NavProps, AppState, FoodEntry } from '../types'
import { t } from '../types'
import SyncBadge from '../components/SyncBadge'
import { ChevronLeftIcon, Panel, PageTitle, SectionLabel } from '../components/Primitives'

interface Props extends NavProps {
  state: AppState
  setState: (p: Partial<AppState>) => void
}

interface FoodItem {
  name: string
  nameUr: string
  unit: string
  calories: number
  protein: number
}

const FOOD_DB: FoodItem[] = [
  { name: 'Dal Chawal', nameUr: 'دال چاول', unit: 'katori', calories: 320, protein: 12 },
  { name: 'Roti', nameUr: 'روٹی', unit: 'piece', calories: 90, protein: 3 },
  { name: 'Chicken Karahi', nameUr: 'چکن کڑاہی', unit: 'katori', calories: 380, protein: 32 },
  { name: 'Dahi', nameUr: 'دہی', unit: 'katori', calories: 100, protein: 9 },
  { name: 'Paratha', nameUr: 'پراٹھا', unit: 'piece', calories: 260, protein: 6 },
  { name: 'Nihari', nameUr: 'نہاری', unit: 'bowl', calories: 420, protein: 36 },
  { name: 'Saag', nameUr: 'ساگ', unit: 'katori', calories: 180, protein: 8 },
  { name: 'Aloo Gobi', nameUr: 'آلو گوبھی', unit: 'katori', calories: 160, protein: 5 },
  { name: 'Kheer', nameUr: 'کھیر', unit: 'bowl', calories: 220, protein: 6 },
  { name: 'Biryani', nameUr: 'بریانی', unit: 'plate', calories: 480, protein: 22 },
]

type Slot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

/**
 * Serving units a portion can be logged in, with how much each one holds
 * relative to the dish's own base unit -- so switching from katori to plate
 * scales the calories instead of only relabelling them.
 */
const UNIT_OPTIONS: { val: string; en: string; ur: string; factor: number }[] = [
  { val: 'katori', en: 'Katori', ur: 'کٹوری', factor: 1 },
  { val: 'cup', en: 'Cup', ur: 'کپ', factor: 1.25 },
  { val: 'bowl', en: 'Bowl', ur: 'پیالہ', factor: 1.5 },
  { val: 'plate', en: 'Plate', ur: 'پلیٹ', factor: 2 },
  { val: 'piece', en: 'Piece', ur: 'عدد', factor: 1 },
  { val: 'tbsp', en: 'Tbsp', ur: 'چمچ', factor: 0.25 },
  { val: 'glass', en: 'Glass', ur: 'گلاس', factor: 1.5 },
]

/** How much a chosen unit holds compared with the dish's own base unit. */
function unitScale(baseUnit: string, chosenUnit: string): number {
  const base = UNIT_OPTIONS.find((u) => u.val === baseUnit)?.factor ?? 1
  const chosen = UNIT_OPTIONS.find((u) => u.val === chosenUnit)?.factor ?? 1
  return chosen / base
}

export default function FoodScreen({ navigate, lang, state, setState }: Props) {
  const [query, setQuery] = useState('')
  const [slot, setSlot] = useState<Slot>('breakfast')
  const [qty, setQty] = useState(1)
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [unit, setUnit] = useState('katori')

  const results = query.length > 0
    ? FOOD_DB.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()) || f.nameUr.includes(query))
    : []

  const usuals = FOOD_DB.slice(0, 6)

  const grouped = (['breakfast', 'lunch', 'dinner', 'snack'] as const)
    .map((s) => ({ slot: s, entries: state.today.foodEntries.filter((e) => e.slot === s) }))
    .filter((g) => g.entries.length > 0)

  const logFood = (food: FoodItem) => {
    const scale = qty * unitScale(food.unit, unit)
    const entry: FoodEntry = {
      id: `${Date.now()}`,
      name: food.name,
      nameUr: food.nameUr,
      slot,
      qty,
      unit,
      calories: Math.round(food.calories * scale),
      protein: Math.round(food.protein * scale),
    }
    setState({
      today: {
        ...state.today,
        foodEntries: [...state.today.foodEntries, entry],
        caloriesLogged: state.today.caloriesLogged + entry.calories,
      },
      syncStatus: 'pending',
    })
    setSelected(null)
    setQuery('')
  }

  const removeEntry = (id: string) => {
    const entry = state.today.foodEntries.find((e) => e.id === id)
    if (!entry) return
    setState({
      today: {
        ...state.today,
        foodEntries: state.today.foodEntries.filter((e) => e.id !== id),
        caloriesLogged: Math.max(0, state.today.caloriesLogged - entry.calories),
      },
      syncStatus: 'pending',
    })
  }

  const slotLabels: Record<Slot, string> = {
    breakfast: t('breakfast', lang),
    lunch: t('lunch', lang),
    dinner: t('dinner', lang),
    snack: t('snack', lang),
  }

  const inputStyle = {
    width: '100%',
    borderRadius: 18,
    border: '1.5px solid #e6d5ba',
    background: '#fffaf1',
    color: '#2c2418',
    fontSize: 15,
    fontFamily: "'Nunito', sans-serif",
    outline: 'none',
    padding: '13px 14px',
  }

  return (
    <div className="min-h-screen px-5 pb-24 pt-5">
      <div className="mx-auto max-w-[460px]">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('home')} className="inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]">
            <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
          </button>
          <SyncBadge status={state.syncStatus} lang={lang} />
        </div>

        <PageTitle
          eyebrow={lang === 'ur' ? 'کھانا' : 'Food'}
          title={t('logMeal', lang)}
          subtitle={lang === 'ur'
            ? 'مقامی یونٹوں میں کھانا تلاش کریں، مقدار منتخب کریں، اور ایک ہی قدم میں لاگ کریں۔'
            : 'Search in local units, pick a quantity, and log in one smooth flow.'}
        />

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className="shrink-0 rounded-full border px-4 py-2 text-sm font-extrabold"
              style={{
                background: slot === s ? '#6c9e36' : '#fff8ee',
                borderColor: slot === s ? '#6c9e36' : '#e6d5ba',
                color: slot === s ? '#fff' : '#2c2418',
              }}
            >
              {slotLabels[s]}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('search', lang)} style={inputStyle} />
        </div>

        {query.length > 0 && (
          <Panel className="mt-4 overflow-hidden">
            {results.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#6e5d4a]">{t('noResults', lang)}</div>
            ) : (
              <div className="divide-y divide-[#eadcc7]">
                {results.map((food) => (
                  <button
                    key={food.name}
                    onClick={() => {
                      setSelected(food)
                      setUnit(food.unit)
                      setQuery('')
                    }}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                  >
                    <div>
                      <div className="text-[15px] font-extrabold text-[#2c2418]">{food.name}</div>
                      <div className="mt-1 text-xs text-[#6e5d4a]">
                        {food.nameUr} · {lang === 'ur' ? 'فی' : 'per'} {food.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-[#d96d20]">{food.calories} cal</div>
                      <div className="mt-1 text-xs text-[#6e5d4a]">{food.protein}g protein</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        )}

        {selected && (
          // z-[60]: above the bottom nav (also z-50), which otherwise paints
          // over the sheet and clips the log button.
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2c2418]/28 p-4">
            {/* A floating card rather than an edge-anchored sheet: centred and
                inset on all sides, so on a short phone screen it can never run
                past the top or sit under the bottom nav. Scrolls internally. */}
            <Panel className="mx-auto flex max-h-[76vh] w-full max-w-[380px] flex-col overflow-hidden rounded-[30px] p-5">
              <div className="mb-4 flex shrink-0 items-start justify-between">
                <div>
                  <div className="font-heading text-[22px] font-semibold text-[#241f15]">{selected.name}</div>
                  <div className="mt-1 text-sm text-[#6e5d4a]">{selected.nameUr}</div>
                </div>
                <button onClick={() => setSelected(null)} className="text-2xl leading-none text-[#6e5d4a]">×</button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mb-3">
                  <div className="mb-2 text-sm font-bold text-[#2c2418]">
                    {lang === 'ur' ? 'پیمانہ' : 'Serving unit'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {UNIT_OPTIONS.map((u) => (
                      <button
                        key={u.val}
                        onClick={() => setUnit(u.val)}
                        className="rounded-full border px-3.5 py-1.5 text-[13px] font-extrabold transition-colors"
                        style={{
                          background: unit === u.val ? '#6c9e36' : '#fffaf1',
                          borderColor: unit === u.val ? '#6c9e36' : '#e6d5ba',
                          color: unit === u.val ? '#ffffff' : '#2c2418',
                        }}
                      >
                        {lang === 'ur' ? u.ur : u.en}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between rounded-[22px] bg-[#fff8ee] p-4">
                  <span className="text-sm font-bold text-[#2c2418]">
                    {lang === 'ur' ? 'مقدار' : 'Quantity'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQty(Math.max(0.5, qty - 0.5))} className="h-10 w-10 rounded-full bg-[#eadcc7] text-xl font-bold">−</button>
                    <span className="w-10 text-center text-xl font-black text-[#2c2418]">{qty}</span>
                    <button onClick={() => setQty(qty + 0.5)} className="h-10 w-10 rounded-full bg-[#6c9e36] text-xl font-bold text-white">+</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] bg-[#fff8ee] p-4 text-center">
                    <div className="text-sm font-bold text-[#8b6f46]">{lang === 'ur' ? 'کیلوریز' : 'Calories'}</div>
                    <div className="mt-1 text-[22px] font-black text-[#d96d20]">
                      {Math.round(selected.calories * qty * unitScale(selected.unit, unit))}
                    </div>
                  </div>
                  <div className="rounded-[22px] bg-[#fff8ee] p-4 text-center">
                    <div className="text-sm font-bold text-[#8b6f46]">{lang === 'ur' ? 'پروٹین' : 'Protein'}</div>
                    <div className="mt-1 text-[22px] font-black text-[#3b8f9f]">
                      {Math.round(selected.protein * qty * unitScale(selected.unit, unit))}g
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => logFood(selected)}
                className="mt-4 w-full shrink-0 rounded-full bg-[#6c9e36] px-5 py-3.5 font-extrabold text-white shadow-[0_12px_26px_rgba(108,158,54,0.16)]"
              >
                {t('log', lang)} {slotLabels[slot]}
              </button>
            </Panel>
          </div>
        )}

        {query.length === 0 && (
          <>
            <div className="mt-6">
              <SectionLabel>{t('usuals', lang)}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {usuals.map((food) => (
                  <button
                    key={food.name}
                    onClick={() => {
                      setSelected(food)
                      setUnit(food.unit)
                    }}
                    className="rounded-[20px] border border-[#e6d5ba] bg-[#fff8ee] p-4 text-left"
                  >
                    <div className="text-[15px] font-extrabold text-[#2c2418]">{food.name}</div>
                    <div className="mt-1 text-[11px] text-[#6e5d4a]">
                      {food.nameUr} · {food.calories} cal
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="mt-6">
          <SectionLabel>{lang === 'ur' ? 'آج کا لاگ' : "Today's log"}</SectionLabel>
          {grouped.length > 0 ? (
            <div className="space-y-4">
              {grouped.map((g) => (
                <Panel key={g.slot} className="overflow-hidden">
                  <div className="border-b border-[#eadcc7] px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#8b6f46]">
                    {slotLabels[g.slot]}
                  </div>
                  <div className="divide-y divide-[#eadcc7]">
                    {g.entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between px-4 py-4">
                        <div>
                          <div className="text-[15px] font-extrabold text-[#2c2418]">{entry.name}</div>
                          <div className="mt-1 text-xs text-[#6e5d4a]">
                            {entry.qty} × {entry.unit} · {entry.calories} cal
                          </div>
                        </div>
                        <button onClick={() => removeEntry(entry.id)} className="rounded-full bg-[#fff1da] px-3 py-1.5 text-sm font-extrabold text-[#d96d20]">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </Panel>
              ))}

              <Panel
                className="flex items-center justify-between px-4 py-4"
                style={{ background: '#e3ab25', borderColor: '#e3ab25' }}
              >
                <span className="text-sm font-extrabold text-[#2c2418]">{lang === 'ur' ? 'کل' : 'Total'}</span>
                <span className="text-sm font-black text-[#2c2418]">
                  {state.today.caloriesLogged} / {state.user.calorieTarget} cal
                </span>
              </Panel>
            </div>
          ) : (
            <Panel className="mt-2 p-6 text-center">
              <p className="text-sm leading-7 text-[#6e5d4a]">
                {lang === 'ur' ? 'ابھی کچھ درج نہیں ہوا۔ اوپر سے تلاش کر کے شروع کریں۔' : 'Nothing logged yet. Search above to add a meal.'}
              </p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
