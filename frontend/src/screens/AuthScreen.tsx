import { useState } from 'react'
import type { NavProps } from '../types'
import { t } from '../types'
import PlantSVG from '../components/PlantSVG'
import {
  ChevronLeftIcon,
  LeafIcon,
  Panel,
  PageTitle,
  SectionLabel,
} from '../components/Primitives'

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'email-verify'

interface AuthScreenProps extends NavProps {
  mode: AuthMode
  onAuth: () => void
}

export default function AuthScreen({ navigate, lang, setLang, mode, onAuth }: AuthScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (mode === 'forgot-password') {
        setSubmitted(true)
        return
      }
      if (mode === 'signup') {
        navigate('email-verify')
        return
      }
      onAuth()
    }, 700)
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

  if (mode === 'email-verify') {
    return (
      <div className="min-h-screen px-5 pb-24 pt-5">
        <button onClick={() => navigate('landing')} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]">
          <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
        </button>
        <Panel className="mx-auto max-w-[420px] px-6 py-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff1da]">
            <PlantSVG plant="bellflower" stage={1} size={58} />
          </div>
          <PageTitle
            eyebrow={lang === 'ur' ? 'ای میل چیک کریں' : 'Check your email'}
            title={t('verifyEmail', lang)}
            subtitle={t('verifyEmailSub', lang)}
            align="center"
          />
          <button
            onClick={() => navigate('login')}
            className="mt-8 rounded-full bg-[#6c9e36] px-7 py-3.5 font-extrabold text-white"
          >
            {t('logIn', lang)}
          </button>
        </Panel>
      </div>
    )
  }

  if (mode === 'forgot-password' && submitted) {
    return (
      <div className="min-h-screen px-5 pb-24 pt-5">
        <Panel className="mx-auto mt-20 max-w-[420px] px-6 py-8 text-center">
          <div className="text-5xl">📬</div>
          <PageTitle
            eyebrow={lang === 'ur' ? 'لنک بھیج دیا گیا' : 'Reset link sent'}
            title={t('resetSent', lang)}
            subtitle={lang === 'ur'
              ? 'چند لمحوں میں اپنا انباکس چیک کریں۔'
              : 'Please check your inbox in a moment.'}
            align="center"
          />
          <button
            onClick={() => navigate('login')}
            className="mt-6 rounded-full border border-[#e6d5ba] bg-[#fff8ee] px-6 py-3 font-extrabold text-[#2c2418]"
          >
            {t('back', lang)}
          </button>
        </Panel>
      </div>
    )
  }

  const titles: Record<AuthMode, string> = {
    login: t('logIn', lang),
    signup: t('signUp', lang),
    'forgot-password': t('forgotPassword', lang).replace('?', ''),
    'email-verify': t('verifyEmail', lang),
  }

  return (
    <div className="min-h-screen px-5 pb-24 pt-5">
      <div className="mx-auto max-w-[460px]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(mode === 'login' || mode === 'signup' ? 'landing' : 'login')}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]"
          >
            <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
          </button>
          <button
            onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
            className="rounded-full border border-[#e6d5ba] bg-[#fff8ee] px-4 py-2 text-sm font-extrabold text-[#2c2418]"
          >
            {lang === 'en' ? 'اردو' : 'English'}
          </button>
        </div>

        <Panel className="mt-6 px-5 py-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <PageTitle
                eyebrow={mode === 'signup' ? (lang === 'ur' ? 'نیا سفر' : 'New journey') : (lang === 'ur' ? 'واپسی' : 'Welcome back')}
                title={titles[mode]}
                subtitle={mode === 'signup'
                  ? (lang === 'ur' ? 'اپنا باغیچہ شروع کریں۔' : 'Start growing your garden.')
                  : (lang === 'ur' ? 'آہستگی سے، مستقل مزاجی کے ساتھ۔' : 'Steady progress, one day at a time.')}
              />
            </div>
            <div className="hidden sm:block">
              <PlantSVG plant={mode === 'signup' ? 'sunflower' : 'succulent'} stage={mode === 'signup' ? 1 : 2} size={64} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-bold text-[#5f523f]">{t('name', lang)}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'ur' ? 'آپ کا پورا نام' : 'Your full name'}
                  style={fieldStyle}
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#5f523f]">{t('email', lang)}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={fieldStyle}
              />
            </div>

            {mode !== 'forgot-password' && (
              <div>
                <label className="mb-1.5 block text-sm font-bold text-[#5f523f]">{t('password', lang)}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={fieldStyle}
                />
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => navigate('forgot-password')}
                    className="mt-2 text-sm font-bold text-[#d96d20]"
                  >
                    {t('forgotPassword', lang)}
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full px-5 py-3.5 font-extrabold text-white shadow-[0_12px_26px_rgba(108,158,54,0.16)] disabled:opacity-70"
              style={{ background: loading ? '#9fc26d' : '#6c9e36' }}
            >
              {loading ? t('loading', lang) : titles[mode]}
            </button>
          </form>

          {mode !== 'forgot-password' && (
            <>
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#eadcc7]" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8b6f46]">
                  {t('orContinue', lang)}
                </span>
                <div className="h-px flex-1 bg-[#eadcc7]" />
              </div>

              <button
                type="button"
                onClick={onAuth}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-[#e6d5ba] bg-[#fff8ee] px-5 py-3.5 font-extrabold text-[#2c2418]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm">
                  <LeafIcon className="h-4 w-4 text-[#6c9e36]" />
                </span>
                {t('google', lang)}
              </button>
            </>
          )}

          <div className="mt-6 text-center text-sm text-[#6e5d4a]">
            {mode === 'login' ? (
              <>
                {lang === 'ur' ? 'اکاؤنٹ نہیں؟ ' : "Don't have an account? "}
                <button onClick={() => navigate('signup')} className="font-extrabold text-[#d96d20]">
                  {t('signUp', lang)}
                </button>
              </>
            ) : mode === 'signup' ? (
              <>
                {lang === 'ur' ? 'پہلے سے اکاؤنٹ ہے؟ ' : 'Already have an account? '}
                <button onClick={() => navigate('login')} className="font-extrabold text-[#d96d20]">
                  {t('logIn', lang)}
                </button>
              </>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  )
}

