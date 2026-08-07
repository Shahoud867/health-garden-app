import { useMemo } from 'react'
import type { NavProps, AppState } from '../types'
import { t } from '../types'
import { ChevronLeftIcon, Panel, PageTitle, SectionLabel } from '../components/Primitives'

interface Props extends NavProps {
  state: AppState
  setState: (p: Partial<AppState>) => void
}

const PLAN_STEPS = [
  { day: 'Mon', title: 'Meal balance', note: 'Keep one plate lighter on carbs' },
  { day: 'Tue', title: 'Walk after lunch', note: '10-15 minutes is enough' },
  { day: 'Wed', title: 'Hydration push', note: 'Aim to finish water early' },
  { day: 'Thu', title: 'Protein focus', note: 'Prioritize a protein-rich lunch' },
  { day: 'Fri', title: 'Easy movement', note: 'Gentle workout or stretching' },
  { day: 'Sat', title: 'Consistency check', note: 'Log something, even if small' },
  { day: 'Sun', title: 'Reset and reflect', note: 'Review what felt easiest' },
]

export default function AIPlanScreen({ navigate, lang, isPremium, state, setState }: Props) {
  const used = state.aiPlan.regenUsed
  const locked = !isPremium
  const hasPlan = Boolean(state.aiPlan.plan)

  const planText = useMemo(() => {
    return PLAN_STEPS.map((step) => `${step.day}: ${step.title} — ${step.note}`).join('\n')
  }, [])

  const generate = () => {
    setState({
      aiPlan: {
        plan: planText,
        regenUsed: 0,
        regenCap: 2,
      },
    })
  }

  const regenerate = () => {
    if (used >= state.aiPlan.regenCap) return
    setState({
      aiPlan: {
        plan: planText,
        regenUsed: used + 1,
        regenCap: state.aiPlan.regenCap,
      },
    })
  }

  if (locked) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6">
        <button onClick={() => navigate('premium')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]">
          <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
        </button>
        <Panel className="px-5 py-8 text-center">
          <PageTitle
            eyebrow={lang === 'ur' ? 'پریمیم فیچر' : 'Premium feature'}
            title={lang === 'ur' ? 'ہفتہ وار منصوبہ' : 'Weekly plan'}
            subtitle={t('premiumDesc', lang)}
            align="center"
          />
          <button
            type="button"
            onClick={() => navigate('premium')}
            className="mt-8 rounded-full bg-[#d96d20] px-7 py-3 font-extrabold text-white shadow-[0_10px_24px_rgba(217,109,32,0.18)]"
          >
            {t('upgrade', lang)}
          </button>
        </Panel>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-6">
      <button onClick={() => navigate('home')} className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]">
        <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
      </button>

      <PageTitle
        eyebrow={lang === 'ur' ? 'اے آئی منصوبہ' : 'AI plan'}
        title={lang === 'ur' ? 'اس ہفتے کے نرم اشارے' : 'Gentle guidance for the week'}
        subtitle={lang === 'ur'
          ? 'یہ منصوبہ آپ کے حالیہ رجحان کے مطابق ایک آسان، غیر سخت ہفتہ بناتا ہے۔'
          : 'A calm weekly structure based on your recent consistency.'}
      />

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={generate}
          className="flex-1 rounded-full bg-[#6c9e36] px-5 py-3 font-extrabold text-white shadow-[0_10px_24px_rgba(108,158,54,0.18)]"
        >
          {hasPlan ? (lang === 'ur' ? 'دوبارہ بنائیں' : 'Generate again') : (lang === 'ur' ? 'منصوبہ بنائیں' : 'Generate plan')}
        </button>
        <button
          type="button"
          onClick={regenerate}
          disabled={used >= state.aiPlan.regenCap}
          className="rounded-full border border-[#e6d5ba] bg-[#fff8ee] px-4 py-3 font-bold text-[#2c2418] disabled:opacity-50"
        >
          {lang === 'ur'
            ? `${used}/${state.aiPlan.regenCap} بار`
            : `${used}/${state.aiPlan.regenCap} used`}
        </button>
      </div>

      {hasPlan ? (
        <Panel className="mt-5 p-5">
          <SectionLabel>{lang === 'ur' ? 'ہفتہ وار خاکہ' : 'Weekly outline'}</SectionLabel>
          <div className="space-y-3">
            {PLAN_STEPS.map((step, i) => (
              <div key={step.day} className="flex items-start gap-3 rounded-2xl border border-[#f0e1c7] bg-white/70 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff1da] text-sm font-black text-[#d96d20]">
                  {i + 1}
                </div>
                <div>
                  <div className="font-bold text-[#2c2418]">{lang === 'ur' ? step.title : `${step.day} · ${step.title}`}</div>
                  <div className="mt-1 text-sm text-[#6e5d4a]">{lang === 'ur' ? step.note : step.note}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : (
        <Panel className="mt-5 p-6 text-center">
          <p className="text-[15px] leading-7 text-[#6e5d4a]">
            {lang === 'ur'
              ? 'منصوبہ ابھی نہیں بنا۔ ایک بٹن دبائیں اور شروع کریں۔'
              : 'Your weekly plan is ready when you are.'}
          </p>
        </Panel>
      )}
    </main>
  )
}

