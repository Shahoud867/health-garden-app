import { useState } from 'react'
import type { NavProps, AppState } from '../types'
import { t } from '../types'
import PlantSVG from '../components/PlantSVG'
import {
  ChevronLeftIcon,
  Panel,
  PageTitle,
  SectionLabel,
} from '../components/Primitives'

interface Props extends NavProps {
  onComplete: (user: AppState['user']) => void
}

const STEPS = ['disclaimer', 'profile', 'activity', 'goal', 'conditions', 'targets'] as const
type Step = typeof STEPS[number]

/**
 * Conditions offered at onboarding. Beyond the original three, these are the
 * concerns most commonly reported in Pakistan, so most users can pick rather
 * than type. 'other' reveals a free-text field; 'none' clears the rest.
 */
const CONDITION_OPTIONS: { val: string; en: string; ur: string }[] = [
  { val: 'diabetes', en: t('conditionDiabetes', 'en'), ur: t('conditionDiabetes', 'ur') },
  { val: 'pcos', en: t('conditionPCOS', 'en'), ur: t('conditionPCOS', 'ur') },
  { val: 'knee_pain', en: t('conditionJoint', 'en'), ur: t('conditionJoint', 'ur') },
  { val: 'obesity', en: 'Obesity', ur: 'موٹاپا' },
  { val: 'hypertension', en: 'High blood pressure', ur: 'بلڈ پریشر' },
  { val: 'cholesterol', en: 'High cholesterol', ur: 'کولیسٹرول' },
  { val: 'thyroid', en: 'Thyroid problems', ur: 'تھائیرائیڈ' },
  { val: 'anaemia', en: 'Anaemia / low iron', ur: 'خون کی کمی' },
  { val: 'acidity', en: 'Acidity or reflux', ur: 'تیزابیت' },
  { val: 'asthma', en: 'Asthma', ur: 'دمہ' },
  { val: 'back_pain', en: 'Back pain', ur: 'کمر درد' },
  { val: 'pregnancy', en: 'Pregnant or nursing', ur: 'حمل یا دودھ پلانا' },
  { val: 'other', en: 'Other', ur: 'دیگر' },
  { val: 'none', en: t('conditionNone', 'en'), ur: t('conditionNone', 'ur') },
]

export default function OnboardingScreen({ lang, navigate, onComplete }: Props) {
  const [step, setStep] = useState<Step>('disclaimer')
  const [form, setForm] = useState({
    name: '',
    age: '',
    sex: 'female',
    heightCm: '',
    weightKg: '',
    activityLevel: '',
    goal: '',
    conditions: [] as string[],
    otherCondition: '',
  })

  const stepIndex = STEPS.indexOf(step)
  const progress = (stepIndex / (STEPS.length - 1)) * 100

  const calorieTarget = (() => {
    const w = parseFloat(form.weightKg) || 65
    const h = parseFloat(form.heightCm) || 165
    const a = parseFloat(form.age) || 30
    const bmr = form.sex === 'male' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161
    const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }[form.activityLevel] || 1.375
    const base = bmr * mult
    if (form.goal === 'lose_weight') return Math.round(base - 500)
    if (form.goal === 'gain_weight') return Math.round(base + 400)
    if (form.goal === 'build_muscle') return Math.round(base + 200)
    return Math.round(base)
  })()

  const proteinTarget = Math.round((parseFloat(form.weightKg) || 65) * 1.6)

  const next = () => {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1])
      return
    }
    onComplete({
      name: form.name,
      age: parseInt(form.age) || 25,
      sex: form.sex,
      heightCm: parseFloat(form.heightCm) || 165,
      weightKg: parseFloat(form.weightKg) || 65,
      activityLevel: form.activityLevel || 'moderate',
      goal: form.goal || 'general_health',
      // Free text replaces the 'other' marker so downstream code sees a real
      // condition rather than a placeholder value.
      conditions: form.conditions.flatMap((c) =>
        c === 'other' ? (form.otherCondition.trim() ? [form.otherCondition.trim()] : []) : [c],
      ),
      calorieTarget,
      proteinTarget,
    })
  }

  /** Step back through onboarding; only leave the flow from the first step. */
  const back = () => {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
    else navigate('login')
  }

  const toggleCondition = (c: string) => {
    if (c === 'none') {
      setForm({ ...form, conditions: [] })
      return
    }
    const existing = form.conditions.filter((x) => x !== 'none')
    setForm({ ...form, conditions: existing.includes(c) ? existing.filter((x) => x !== c) : [...existing, c] })
  }

  const fieldStyle = {
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

  const optionButton = (val: string, label: string, selected: boolean, onSelect: () => void) => (
    <button
      key={val}
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-[22px] border px-4 py-4 text-left font-bold transition-all"
      style={{
        background: selected ? '#6c9e36' : '#fffaf1',
        borderColor: selected ? '#6c9e36' : '#e6d5ba',
        color: selected ? '#fff' : '#2c2418',
      }}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm">
        {selected ? '✓' : '•'}
      </span>
      <span>{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen px-5 pb-24 pt-5">
      <div className="mx-auto max-w-[460px]">
        <button onClick={back} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]">
          <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
        </button>

        {step !== 'disclaimer' && (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[#8b6f46]">
              <span>{lang === 'ur' ? 'مرحلہ' : 'Step'} {stepIndex} {lang === 'ur' ? 'میں سے' : 'of'} {STEPS.length - 1}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#eadcc7]">
              <div className="h-full rounded-full bg-[#6c9e36] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <Panel className="px-5 py-7">
          {step === 'disclaimer' && (
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff1da]">
                <PlantSVG plant="succulent" stage={1} size={58} />
              </div>
              <PageTitle
                eyebrow={lang === 'ur' ? 'اہم' : 'Important'}
                title="Health Garden"
                subtitle={t('medDisclaimer', lang)}
                align="center"
              />
              <button
                onClick={next}
                className="mt-7 rounded-full bg-[#6c9e36] px-7 py-3.5 font-extrabold text-white shadow-[0_12px_26px_rgba(108,158,54,0.16)]"
              >
                {t('medAccept', lang)}
              </button>
            </div>
          )}

          {step === 'profile' && (
            <>
              <SectionLabel>{lang === 'ur' ? 'آپ کے بارے میں' : 'About you'}</SectionLabel>
              <PageTitle
                title={lang === 'ur' ? 'اپنی بنیاد بتائیں' : 'Build your baseline'}
                subtitle={lang === 'ur' ? 'یہ معلومات آپ کے اہداف کو ذاتی بناتی ہیں۔' : 'These details help personalize your goals.'}
              />
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-[#5f523f]">{t('name', lang)}</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={fieldStyle} placeholder={lang === 'ur' ? 'آپ کا نام' : 'Your name'} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-[#5f523f]">{lang === 'ur' ? 'عمر' : 'Age'}</label>
                    <input type="number" min="10" max="100" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} style={fieldStyle} placeholder="25" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-[#5f523f]">{lang === 'ur' ? 'جنس' : 'Sex'}</label>
                    <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} style={fieldStyle}>
                      <option value="female">{lang === 'ur' ? 'خاتون' : 'Female'}</option>
                      <option value="male">{lang === 'ur' ? 'مرد' : 'Male'}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-[#5f523f]">{lang === 'ur' ? 'قد (cm)' : 'Height (cm)'}</label>
                    <input type="number" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} style={fieldStyle} placeholder="165" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-[#5f523f]">{lang === 'ur' ? 'وزن (kg)' : 'Weight (kg)'}</label>
                    <input type="number" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} style={fieldStyle} placeholder="65" />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 'activity' && (
            <>
              <SectionLabel>{lang === 'ur' ? 'سرگرمی' : 'Activity'}</SectionLabel>
              <PageTitle
                title={lang === 'ur' ? 'ایک معمولی ہفتہ کیسا ہے؟' : 'What does a typical week look like?'}
                subtitle={lang === 'ur' ? 'بس قریب ترین انتخاب کریں۔' : 'Choose the closest fit.'}
              />
              <div className="mt-6 space-y-3">
                {[
                  { val: 'sedentary', en: t('actSedentary', 'en'), ur: t('actSedentary', 'ur') },
                  { val: 'light', en: t('actLight', 'en'), ur: t('actLight', 'ur') },
                  { val: 'moderate', en: t('actModerate', 'en'), ur: t('actModerate', 'ur') },
                  { val: 'active', en: t('actVery', 'en'), ur: t('actVery', 'ur') },
                ].map((o) => optionButton(o.val, lang === 'ur' ? o.ur : o.en, form.activityLevel === o.val, () => setForm({ ...form, activityLevel: o.val })))}
              </div>
            </>
          )}

          {step === 'goal' && (
            <>
              <SectionLabel>{lang === 'ur' ? 'مقصد' : 'Goal'}</SectionLabel>
              <PageTitle
                title={lang === 'ur' ? 'آپ کیا حاصل کرنا چاہتے ہیں؟' : 'What would you like to work toward?'}
                subtitle={lang === 'ur' ? 'ایک بنیادی مقصد منتخب کریں۔' : 'Choose one main focus.'}
              />
              <div className="mt-6 space-y-3">
                {[
                  // Values match users.goal's CHECK constraint exactly -- the
                  // garden's primary-goal plant branches on this string, so a
                  // near-miss silently fails that plant every day.
                  { val: 'lose_weight', en: t('goalLose', 'en'), ur: t('goalLose', 'ur') },
                  { val: 'gain_weight', en: t('goalGain', 'en'), ur: t('goalGain', 'ur') },
                  { val: 'maintain', en: t('goalMaintain', 'en'), ur: t('goalMaintain', 'ur') },
                  { val: 'build_muscle', en: t('goalStrength', 'en'), ur: t('goalStrength', 'ur') },
                  { val: 'general_health', en: t('goalGeneral', 'en'), ur: t('goalGeneral', 'ur') },
                ].map((o) => optionButton(o.val, lang === 'ur' ? o.ur : o.en, form.goal === o.val, () => setForm({ ...form, goal: o.val })))}
              </div>
            </>
          )}

          {step === 'conditions' && (
            <>
              <SectionLabel>{lang === 'ur' ? 'صحت' : 'Health'}</SectionLabel>
              <PageTitle
                title={lang === 'ur' ? 'کیا کوئی خاص خیال رکھنا ہے؟' : 'Anything we should be mindful of?'}
                subtitle={lang === 'ur'
                  ? 'یہ محفوظ تجاویز دکھانے کے لیے استعمال ہوتا ہے۔'
                  : 'This helps hide unsafe recommendations.'}
              />
              {/* Scrolls rather than pushing Continue off-screen as the list grows. */}
              <div className="mt-6 max-h-[46vh] space-y-3 overflow-y-auto pr-1">
                {CONDITION_OPTIONS.map((o) => {
                  const selected = o.val === 'none' ? form.conditions.length === 0 : form.conditions.includes(o.val)
                  return optionButton(o.val, lang === 'ur' ? o.ur : o.en, selected, () => toggleCondition(o.val))
                })}

                {form.conditions.includes('other') && (
                  <input
                    value={form.otherCondition}
                    onChange={(e) => setForm({ ...form, otherCondition: e.target.value })}
                    placeholder={lang === 'ur' ? 'اپنی حالت لکھیں' : 'Type your condition'}
                    className="w-full rounded-2xl border border-[#e6d5ba] bg-[#fffaf1] px-4 py-3 text-[15px] text-[#2c2418] outline-none placeholder:text-[#b3a189] focus:border-[#6c9e36]"
                  />
                )}
              </div>
            </>
          )}

          {step === 'targets' && (
            <div className="text-center">
              <div className="mx-auto flex justify-center gap-4">
                <PlantSVG plant="bamboo" stage={2} size={58} />
                <PlantSVG plant="sunflower" stage={2} size={58} />
              </div>
              <PageTitle
                eyebrow={lang === 'ur' ? 'خلاصہ' : 'Summary'}
                title={t('computedTitle', lang)}
                subtitle={t('computedSub', lang)}
                align="center"
              />
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-[24px] border border-[#e6d5ba] bg-[#fffaf1] p-5 text-center">
                  <div className="text-[28px] font-black text-[#6c9e36]">{calorieTarget}</div>
                  <div className="mt-1 text-sm text-[#6e5d4a]">{lang === 'ur' ? 'روزانہ کیلوریز' : 'daily calories'}</div>
                </div>
                <div className="rounded-[24px] border border-[#e6d5ba] bg-[#fffaf1] p-5 text-center">
                  <div className="text-[28px] font-black text-[#3b8f9f]">{proteinTarget}g</div>
                  <div className="mt-1 text-sm text-[#6e5d4a]">{lang === 'ur' ? 'روزانہ پروٹین' : 'daily protein'}</div>
                </div>
              </div>
              {form.name && (
                <p className="mt-5 text-[15px] font-semibold italic text-[#2c2418]">
                  {lang === 'ur' ? `${form.name}، آپ کا باغیچہ انتظار کر رہا ہے۔` : `${form.name}, your garden is waiting.`}
                </p>
              )}
            </div>
          )}

          {step !== 'disclaimer' && (
            <button
              onClick={next}
              disabled={(step === 'activity' && !form.activityLevel) || (step === 'goal' && !form.goal)}
              className="mt-8 w-full rounded-full px-5 py-3.5 font-extrabold text-white shadow-[0_12px_26px_rgba(108,158,54,0.16)] disabled:opacity-60"
              style={{ background: '#6c9e36' }}
            >
              {step === 'targets' ? (lang === 'ur' ? 'باغیچہ شروع کریں' : 'Start my garden') : t('continue', lang)}
            </button>
          )}
        </Panel>
      </div>
    </div>
  )
}
