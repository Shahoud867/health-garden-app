import type { NavProps, AppState } from '../types'
import { t } from '../types'
import SyncBadge from '../components/SyncBadge'
import { ChevronLeftIcon, Panel, PageTitle, SectionLabel } from '../components/Primitives'

interface Props extends NavProps {
  state: AppState
  setState: (p: Partial<AppState>) => void
}

const GOAL = 8

export default function WaterScreen({ navigate, lang, state, setState }: Props) {
  const glasses = state.today.waterGlasses

  const addGlass = () => {
    setState({ today: { ...state.today, waterGlasses: Math.min(glasses + 1, 16) }, syncStatus: 'pending' })
  }

  const removeGlass = () => {
    setState({ today: { ...state.today, waterGlasses: Math.max(0, glasses - 1) }, syncStatus: 'pending' })
  }

  const pct = Math.min(glasses / GOAL, 1)

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
          eyebrow={lang === 'ur' ? 'پانی' : 'Water'}
          title={t('logWater', lang)}
          subtitle={lang === 'ur'
            ? 'ایک ٹیپ میں ایک گلاس، اور پیش رفت فوراً نظر آتی ہے۔'
            : 'One tap to add a glass, with progress visible instantly.'}
        />

        <Panel tone="cool" className="mt-6 p-5 text-center">
          <div className="mx-auto mb-3 flex h-[220px] w-[220px] items-center justify-center rounded-full border-[14px] border-[#d7ecf1] bg-white/75" style={{ borderTopColor: '#3b8f9f', borderRightColor: '#8fd0df' }}>
            <div className="text-center">
              <div className="text-[56px] font-black leading-none text-[#3b8f9f]">{glasses}</div>
              <div className="mt-1 text-sm font-bold text-[#6e5d4a]">
                {lang === 'ur' ? `${GOAL} میں سے` : `of ${GOAL} glasses`}
              </div>
              {glasses >= GOAL && <div className="mt-2 text-xs font-extrabold text-[#6c9e36]">{lang === 'ur' ? 'ہدف پورا!' : 'Goal reached!'}</div>}
            </div>
          </div>

          <div className="mb-6 flex justify-center gap-2">
            {Array.from({ length: GOAL }).map((_, i) => (
              <span
                key={i}
                className="h-3 w-3 rounded-full border"
                style={{
                  background: i < glasses ? '#3b8f9f' : '#fff',
                  borderColor: i < glasses ? '#3b8f9f' : '#cde2e8',
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-5">
            <button
              onClick={removeGlass}
              disabled={glasses === 0}
              className="h-16 w-16 rounded-full bg-[#eadcc7] text-2xl font-black text-[#2c2418] disabled:opacity-50"
            >
              −
            </button>
            <button
              onClick={addGlass}
              className="h-20 w-20 rounded-full bg-[#3b8f9f] text-3xl font-black text-white shadow-[0_12px_24px_rgba(59,143,159,0.18)]"
            >
              +
            </button>
          </div>

          <p className="mt-5 text-sm leading-7 text-[#6e5d4a]">
            {lang === 'ur'
              ? 'ایک ٹیپ سے ایک گلاس شامل کریں۔ روزانہ آٹھ گلاس ہدف ہے۔'
              : 'One tap to add a glass. The daily goal is eight glasses.'}
          </p>
        </Panel>

        <Panel className="mt-6 p-5">
          <SectionLabel>{lang === 'ur' ? 'اس ہفتے' : 'This week'}</SectionLabel>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => {
              const val = [6, 8, 5, 7, 8, 4, glasses][i] || 0
              return (
                <div key={d} className="flex flex-col items-center gap-2">
                  <div className="flex h-24 w-8 items-end rounded-full bg-[#f3ead7] p-1">
                    <div className="w-full rounded-full bg-[#3b8f9f]" style={{ height: `${Math.max((val / GOAL) * 100, 12)}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-[#7b6851]">
                    {lang === 'ur' ? ['پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ', 'اتوار'][i] : d}
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>

        <div className="mt-6 rounded-[26px] border border-[#e6d5ba] bg-[#fff8ee] p-5">
          <p className="text-[15px] font-bold text-[#2c2418]">
            {lang === 'ur' ? 'چھوٹی پیش رفت بھی اہم ہے۔' : 'Small progress still counts.'}
          </p>
          <div className="mt-2 text-sm leading-7 text-[#6e5d4a]">
            {lang === 'ur'
              ? 'اپنے دن میں پانی کا ایک گلاس شامل کریں اور رفتار کو پرسکون رکھیں۔'
              : 'Add one more glass and keep the pace calm.'}
          </div>
        </div>
      </div>
    </div>
  )
}

