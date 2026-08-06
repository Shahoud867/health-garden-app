import { useState } from 'react'
import type { NavProps, AppState, PlantState } from '../types'
import { t } from '../types'
import PlantImage from '../components/PlantImage'
import GardenBoard from '../components/GardenBoard'
import { DEFAULT_THEME_SLUG, themeBySlug } from '../data/gardenThemes'
import { ChevronLeftIcon, Panel, PageTitle, SectionLabel } from '../components/Primitives'

interface Props extends NavProps {
  state: AppState
}

type PlantType = PlantState['type']

const PLANT_META: Record<string, { labelEn: string; labelUr: string; goalEn: string; goalUr: string; color: string }> = {
  cactus: { labelEn: 'Cactus', labelUr: 'کیکٹس', goalEn: 'Sugar-free', goalUr: 'شکر سے پاک', color: '#d96d20' },
  sunflower: { labelEn: 'Sunflower', labelUr: 'سورج مکھی', goalEn: 'Movement', goalUr: 'حرکت', color: '#6c9e36' },
  bellflower: { labelEn: 'Mint', labelUr: 'پودینہ', goalEn: 'Hydration', goalUr: 'پانی', color: '#3b8f9f' },
  bamboo: { labelEn: 'Wheat Stalk', labelUr: 'بانس', goalEn: 'Protein', goalUr: 'پروٹین', color: '#e3ab25' },
  succulent: { labelEn: 'Succulent', labelUr: 'سکیو لَنت', goalEn: 'Consistency', goalUr: 'تسلسل', color: '#7c7d4b' },
}

const PLANT_ORDER: PlantType[] = ['cactus', 'sunflower', 'bellflower', 'bamboo', 'succulent']

function stageFromDays(days: number): 0 | 1 | 2 | 3 {
  if (days <= 1) return 0
  if (days <= 3) return 1
  if (days <= 5) return 2
  return 3
}

/**
 * Which fully-grown plants currently sit in the permanent garden.
 *
 * Placeholder until this screen is wired to the backend, which stores one
 * permanent_garden row per earned plant with its own board and slot index.
 * Derived from the weekly mock data so the board still reflects real
 * progress: every completed cycle a habit has finished contributes one plant,
 * cycling through the five kinds in a stable order.
 */
function earnedPlants(garden: PlantState[]): PlantType[] {
  const perHabit = garden.map((p) => ({ type: p.type, cycles: Math.floor(p.daysThisWeek / 2) }))
  const total = perHabit.reduce((sum, p) => sum + p.cycles, 0)
  const out: PlantType[] = []
  let i = 0
  while (out.length < total) {
    const habit = perHabit[i % perHabit.length]
    if (habit.cycles > 0) {
      out.push(habit.type)
      habit.cycles -= 1
    }
    i += 1
    if (i > 500) break // belt-and-braces against an unexpected input
  }
  return out
}

/**
 * Gardens the user has already filled.
 *
 * Placeholder until the backend supplies them: each completed board is a
 * permanent_garden `board_number` whose 25 slots are all taken, so the real
 * version reads the theme and plant types straight from those rows.
 */
const COMPLETED_GARDENS: { themeSlug: string; finishedOn: string; seed: number }[] = [
  { themeSlug: 'candyland', finishedOn: 'May 2025', seed: 7 },
  { themeSlug: 'beach', finishedOn: 'April 2025', seed: 3 },
]

/** Deterministic plant mix for a finished board -- stable across re-renders. */
function fillBoard(count: number, seed: number): PlantType[] {
  return Array.from({ length: count }, (_, i) => PLANT_ORDER[(i * seed + seed) % PLANT_ORDER.length])
}

function PlantProgress({ plant, lang }: { plant: PlantState; lang: Props['lang'] }) {
  const meta = PLANT_META[plant.type]
  const stage = stageFromDays(plant.daysThisWeek)
  const isResting = !plant.metToday
  const pct = Math.min(100, (plant.daysThisWeek / 7) * 100)

  return (
    <div className="flex items-center gap-3 border-b border-[#eadcc7] py-3 last:border-b-0">
      <div className="flex h-12 w-12 shrink-0 items-end justify-center">
        <PlantImage plant={plant.type} stage={stage} dormant={isResting} size={46} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="truncate text-sm font-extrabold text-[#2c2418]">
            {lang === 'ur' ? meta.labelUr : meta.labelEn}
          </div>
          <div className="shrink-0 text-sm font-extrabold" style={{ color: isResting ? '#8b6f46' : meta.color }}>
            {plant.daysThisWeek}/7
          </div>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#f3ead7]">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${pct}%`, background: isResting ? '#d9c7a8' : meta.color }}
          />
        </div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b6f46]">
          {isResting
            ? lang === 'ur' ? 'آج آرام' : 'Resting today'
            : lang === 'ur' ? meta.goalUr : meta.goalEn}
        </div>
      </div>
    </div>
  )
}

export default function GardenScreen({ navigate, lang, state }: Props) {
  const [tab, setTab] = useState<'week' | 'gardens' | 'history'>('week')
  const { garden } = state
  const totalMet = garden.filter((p) => p.metToday).length
  const allResting = totalMet === 0

  const theme = themeBySlug(DEFAULT_THEME_SLUG)
  const planted = earnedPlants(garden)
  const capacity = theme.slots.length

  return (
    <div className="min-h-screen px-5 pb-10 pt-5">
      <div className="mx-auto max-w-[460px]">
        <button onClick={() => navigate('home')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]">
          <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
        </button>

        <PageTitle
          eyebrow={lang === 'ur' ? 'باغیچہ' : 'Garden'}
          title={t('garden', lang)}
        />

        <div className="mt-6 inline-flex rounded-full bg-[#f3ead7] p-1">
          {([
            ['week', lang === 'ur' ? 'اس ہفتے' : 'This week'],
            ['gardens', lang === 'ur' ? 'میرے باغیچے' : 'My gardens'],
            ['history', lang === 'ur' ? 'تاریخ' : 'History'],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="rounded-full px-4 py-2 text-[13px] font-extrabold"
              style={{
                background: tab === k ? '#fff8ee' : 'transparent',
                color: tab === k ? '#2c2418' : '#7b6851',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'week' && (
          <>
            <div className="mt-5 flex items-end justify-between gap-3">
              <div>
                <div className="font-heading text-[22px] font-semibold text-[#241f15]">
                  {lang === 'ur' ? 'آپ کا باغیچہ' : 'Your garden'}
                </div>
                <div className="mt-1 text-sm text-[#6e5d4a]">
                  {lang === 'ur'
                    ? 'ہر مکمل پودا یہاں ہمیشہ کے لیے لگ جاتا ہے۔'
                    : 'Every plant you finish growing is planted here for good.'}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[28px] font-black leading-none text-[#6c9e36]">{planted.length}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b6f46]">
                  {lang === 'ur' ? `${capacity} میں سے` : `of ${capacity}`}
                </div>
              </div>
            </div>

            {/* Full-bleed: cancels the page's px-5 and the max-w wrapper so the
                field art spans the viewport. Height follows the art's ratio. */}
            <div className="mt-4 -mx-5 w-screen max-w-none translate-x-[calc(50%-50vw)] sm:mx-0 sm:w-auto sm:translate-x-0">
              <GardenBoard theme={theme} plants={planted} rounded={false} />
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#8b6f46]">
              <span>{theme.name}</span>
              <span>
                {planted.length >= capacity
                  ? lang === 'ur' ? 'باغیچہ مکمل' : 'Garden full'
                  : lang === 'ur'
                    ? `${capacity - planted.length} جگہیں باقی`
                    : `${capacity - planted.length} spots left`}
              </span>
            </div>

            {allResting && (
              <Panel className="mt-4 p-4">
                <p className="text-sm leading-7 text-[#6e5d4a]">
                  {lang === 'ur'
                    ? 'آپ کا باغیچہ آج کی لاگ کا انتظار کر رہا ہے۔ ایک چھوٹا قدم بھی اہم ہے۔'
                    : "Your garden is waiting for today’s log. Even a small step counts."}
                </p>
              </Panel>
            )}

            <Panel className="mt-5 p-5">
              <SectionLabel>{lang === 'ur' ? 'اس ہفتے بڑھ رہے ہیں' : 'Growing this week'}</SectionLabel>
              {garden.map((plant) => (
                <PlantProgress key={plant.type} plant={plant} lang={lang} />
              ))}
            </Panel>
          </>
        )}

        {tab === 'gardens' && (
          <div className="mt-5 space-y-4">
            {COMPLETED_GARDENS.length === 0 && (
              <Panel className="p-5">
                <p className="text-sm leading-7 text-[#6e5d4a]">
                  {lang === 'ur'
                    ? 'جب آپ کا پہلا باغیچہ مکمل ہوگا، وہ یہاں محفوظ ہو جائے گا۔'
                    : 'When you fill your first garden, it will be saved here.'}
                </p>
              </Panel>
            )}
            {COMPLETED_GARDENS.map((g) => {
              const gTheme = themeBySlug(g.themeSlug)
              return (
                <Panel key={g.themeSlug + g.finishedOn} className="overflow-hidden p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="font-heading text-[18px] font-semibold text-[#241f15]">{gTheme.name}</div>
                      <div className="mt-0.5 text-xs text-[#8b6f46]">{g.finishedOn}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[20px] font-black leading-none text-[#6c9e36]">{gTheme.slots.length}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b6f46]">
                        {lang === 'ur' ? 'پودے' : 'plants'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <GardenBoard theme={gTheme} plants={fillBoard(gTheme.slots.length, g.seed)} />
                  </div>
                </Panel>
              )
            })}
            <p className="text-center text-xs text-[#8b6f46]">
              {lang === 'ur'
                ? 'ہر مکمل باغیچہ ہمیشہ کے لیے یہاں رہتا ہے۔'
                : 'Every garden you complete stays here for good.'}
            </p>
          </div>
        )}

        {tab === 'history' && (
          <div className="mt-5">
            <Panel className="p-5">
              <SectionLabel>{lang === 'ur' ? 'محفوظ ہفتے' : 'Saved weeks'}</SectionLabel>
              <div className="space-y-3">
                {[
                  { label: 'June 23–29, 2025', stages: [3, 2, 3, 1, 2] as const },
                  { label: 'June 16–22, 2025', stages: [2, 2, 1, 0, 1] as const },
                  { label: 'June 9–15, 2025', stages: [1, 1, 2, 1, 1] as const },
                ].map((week) => (
                  <div key={week.label} className="rounded-[22px] border border-[#e6d5ba] bg-[#fffaf1] p-4">
                    <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#8b6f46]">{week.label}</div>
                    <div className="grid grid-cols-5 gap-2">
                      {PLANT_ORDER.map((type, idx) => (
                        <div key={type} className="flex flex-col items-center">
                          <div className="flex h-11 items-end justify-center">
                            <PlantImage plant={type} stage={week.stages[idx] ?? 1} size={42} />
                          </div>
                          <div className="mt-1 text-[10px] font-bold text-[#7b6851]">{lang === 'ur' ? PLANT_META[type].labelUr : PLANT_META[type].labelEn}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-[#8b6f46]">
                {lang === 'ur' ? 'مزید ہفتے جمع ہونے پر یہاں محفوظ ہوں گے۔' : 'More weeks will appear here as you keep logging.'}
              </p>
            </Panel>
          </div>
        )}
      </div>
    </div>
  )
}
