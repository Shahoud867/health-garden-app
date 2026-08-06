import { useState } from 'react'
import type { NavProps, AppState } from '../types'
import { t } from '../types'
import PlantSVG from '../components/PlantSVG'
import { ChevronLeftIcon, Panel, PageTitle, SectionLabel } from '../components/Primitives'

interface Props extends NavProps {
  state: AppState
  setState: (p: Partial<AppState>) => void
  onLogout: () => void
}

export default function ProfileScreen({ navigate, lang, setLang, isPremium, state, setState, onLogout }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: state.user.name,
    heightCm: String(state.user.heightCm),
    weightKg: String(state.user.weightKg),
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(false)

  const save = () => {
    setState({
      user: {
        ...state.user,
        name: form.name,
        heightCm: parseFloat(form.heightCm) || state.user.heightCm,
        weightKg: parseFloat(form.weightKg) || state.user.weightKg,
      },
    })
    setEditing(false)
  }

  const fieldStyle = {
    width: '100%',
    borderRadius: 16,
    border: '1.5px solid #e6d5ba',
    background: '#fffaf1',
    color: '#2c2418',
    fontSize: 14,
    fontFamily: "'Nunito', sans-serif",
    outline: 'none',
    padding: '11px 12px',
  }

  const Row = ({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) => (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-center justify-between py-3.5 text-left"
    >
      <span className="text-sm font-semibold text-[#2c2418]">{label}</span>
      <span className="text-sm text-[#6e5d4a]">{value || '›'}</span>
    </button>
  )

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <SectionLabel>{title}</SectionLabel>
      <Panel className="p-4">{children}</Panel>
    </div>
  )

  return (
    <div className="min-h-screen px-5 pb-24 pt-5">
      <div className="mx-auto max-w-[460px]">
        <button onClick={() => navigate('home')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]">
          <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
        </button>

        <PageTitle
          eyebrow={lang === 'ur' ? 'آپ کا اکاؤنٹ' : 'Your account'}
          title={t('profile', lang)}
          subtitle={lang === 'ur'
            ? 'ترجیحات، زبان، اور رازداری ایک جگہ۔'
            : 'Preferences, language, and privacy in one place.'}
        />

        <div className="mt-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1da]">
            <PlantSVG plant="succulent" stage={2} size={42} />
          </div>
          <div>
            <div className="font-heading text-[22px] font-semibold text-[#241f15]">
              {state.user.name || (lang === 'ur' ? 'صارف' : 'User')}
            </div>
            {isPremium && (
              <span className="mt-1 inline-flex rounded-full bg-[#f0b93e] px-3 py-1 text-xs font-extrabold text-[#2c2418]">
                ✦ {t('premium', lang)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Section title={lang === 'ur' ? 'پروفائل' : 'Profile'}>
            {editing ? (
              <div className="space-y-3 py-1">
                {[
                  { label: lang === 'ur' ? 'نام' : 'Name', key: 'name', type: 'text' as const },
                  { label: lang === 'ur' ? 'قد (cm)' : 'Height (cm)', key: 'heightCm', type: 'number' as const },
                  { label: lang === 'ur' ? 'وزن (kg)' : 'Weight (kg)', key: 'weightKg', type: 'number' as const },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-[#8b6f46]">{f.label}</label>
                    <input
                      type={f.type}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      style={fieldStyle}
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <button onClick={save} className="flex-1 rounded-full bg-[#6c9e36] px-4 py-3 font-extrabold text-white">
                    {t('save', lang)}
                  </button>
                  <button onClick={() => setEditing(false)} className="flex-1 rounded-full border border-[#e6d5ba] bg-[#fff8ee] px-4 py-3 font-extrabold text-[#2c2418]">
                    {t('cancel', lang)}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Row label={lang === 'ur' ? 'نام' : 'Name'} value={state.user.name} />
                <Row label={lang === 'ur' ? 'عمر' : 'Age'} value={`${state.user.age}`} />
                <Row label={lang === 'ur' ? 'قد' : 'Height'} value={`${state.user.heightCm} cm`} />
                <Row label={lang === 'ur' ? 'وزن' : 'Weight'} value={`${state.user.weightKg} kg`} />
                <Row label={lang === 'ur' ? 'ترمیم' : 'Edit profile'} onPress={() => setEditing(true)} />
              </>
            )}
          </Section>

          <Section title={lang === 'ur' ? 'زبان' : 'Language'}>
            <div className="grid grid-cols-2 gap-2">
              {(['en', 'ur'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="rounded-[18px] border px-4 py-3 font-extrabold transition-all"
                  style={{
                    background: lang === l ? '#6c9e36' : '#fffaf1',
                    borderColor: lang === l ? '#6c9e36' : '#e6d5ba',
                    color: lang === l ? '#fff' : '#2c2418',
                  }}
                >
                  {l === 'en' ? 'English' : 'اردو'}
                </button>
              ))}
            </div>
          </Section>

          <Section title={t('notifPref', lang)}>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-semibold text-[#2c2418]">
                {lang === 'ur' ? 'روزانہ یاددہانی' : 'Daily reminders'}
              </span>
              <button
                onClick={() => setNotifEnabled(!notifEnabled)}
                className="relative h-7 w-14 rounded-full transition-colors"
                style={{ background: notifEnabled ? '#6c9e36' : '#e6d5ba' }}
              >
                <span
                  className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all"
                  style={{ left: notifEnabled ? 'calc(100% - 22px)' : 4 }}
                />
              </button>
            </div>
            <Row label={lang === 'ur' ? 'اجازت دوبارہ مانگیں' : 'Re-request notification permission'} />
          </Section>

          <Section title={t('billing', lang)}>
            {isPremium ? (
              <Row label={lang === 'ur' ? 'فعال پریمیم' : 'Premium active'} value={lang === 'ur' ? 'جولائی 2025 تک' : 'Until July 2025'} />
            ) : (
              <Row label={lang === 'ur' ? 'مفت منصوبہ' : 'Free plan'} onPress={() => navigate('premium')} />
            )}
            <Row label={lang === 'ur' ? 'ادائیگی کی تاریخ' : 'Payment history'} />
          </Section>

          <Section title={t('installApp', lang)}>
            <Row label="Android / Chrome" value={lang === 'ur' ? 'ہوم اسکرین پر شامل کریں' : 'Add to Home Screen'} />
            <Row label="iOS Safari" value={lang === 'ur' ? 'Share → Add to Home Screen' : 'Share → Add to Home Screen'} />
          </Section>

          <Section title={lang === 'ur' ? 'ڈیٹا اور رازداری' : 'Data & Privacy'}>
            <Row label={t('exportData', lang)} />
            <Row label={t('privacy', lang)} />
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3.5 text-left"
            >
              <span className="text-sm font-semibold text-[#d96d20]">{t('deleteAccount', lang)}</span>
            </button>
          </Section>

          <Section title={lang === 'ur' ? 'معلومات' : 'Info'}>
            <Row label={t('terms', lang)} />
            <Row label={t('about', lang)} />
          </Section>

          <button
            onClick={onLogout}
            className="mb-4 w-full rounded-full border border-[#c95f1d] bg-[#d96d20] px-5 py-3.5 font-extrabold text-white shadow-[0_12px_26px_rgba(217,109,32,0.2)]"
          >
            {t('logOut', lang)}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2418]/35 px-5">
          <Panel className="w-full max-w-[420px] p-6">
            <PageTitle
              eyebrow={lang === 'ur' ? 'حذف' : 'Delete account'}
              title={t('deleteAccount', lang)}
              subtitle={lang === 'ur'
                ? 'آپ کا تمام ڈیٹا، باغیچہ، اور لاگز مستقل طور پر حذف ہو جائیں گے۔'
                : 'All your data, garden history, and logs will be permanently deleted.'}
            />
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-full border border-[#e6d5ba] bg-[#fff8ee] px-4 py-3 font-extrabold text-[#2c2418]">
                {t('cancel', lang)}
              </button>
              <button onClick={onLogout} className="flex-1 rounded-full bg-[#d96d20] px-4 py-3 font-extrabold text-white">
                {lang === 'ur' ? 'حذف کریں' : 'Delete'}
              </button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}
