import type { NavProps } from '../types'
import { t } from '../types'
import PlantSVG from '../components/PlantSVG'
import { BellIcon, Panel, PageTitle, SectionLabel } from '../components/Primitives'

export default function LandingScreen({ navigate, lang, setLang }: NavProps) {
  return (
    <div className="min-h-screen pb-16">
      <div className="px-5 pt-4">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
              className="rounded-full border border-[#e7d7bb] bg-[#fff8ee] px-3.5 py-1.5 text-[12px] font-extrabold text-[#2c2418]"
            >
              {lang === 'en' ? 'اردو' : 'English'}
            </button>
            <button
              type="button"
              onClick={() => navigate('login')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e7d7bb] bg-[#fff8ee] text-[#2c2418]"
              aria-label={t('logIn', lang)}
            >
              <BellIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-start gap-4">
          <div className="flex-1">
            <PageTitle
              eyebrow={lang === 'ur' ? 'خوش آمدید' : 'Welcome'}
              title={t('heroTitle', lang)}
              subtitle={t('heroSub', lang)}
            />
          </div>

          <div className="shrink-0">
            <div
              className="flex h-[124px] w-[124px] items-center justify-center rounded-full border-[8px] border-[#f0c35b]/50 bg-[#fff7e1]"
              style={{ borderTopColor: '#f0b93e' }}
            >
              <PlantSVG plant="succulent" stage={3} size={64} />
            </div>
          </div>
        </div>

        {/* Full-width CTAs: outside the row above so the plant medallion no
            longer caps how wide they can grow. */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('signup')}
            className="w-full rounded-2xl bg-[#6c9e36] px-5 py-3.5 text-[14px] font-extrabold text-white shadow-[0_12px_28px_rgba(108,158,54,0.18)] sm:flex-1"
          >
            {t('signUpCta', lang)}
          </button>
          <button
            type="button"
            onClick={() => navigate('pricing')}
            className="w-full rounded-2xl border border-[#e6d5ba] bg-[#fff8ee] px-5 py-3.5 text-[14px] font-extrabold text-[#2c2418] sm:flex-1"
          >
            {t('pricingCta', lang)}
          </button>
        </div>

        <Panel tone="warm" className="mt-7 p-4">
          <SectionLabel>{t('howItWorks', lang)}</SectionLabel>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 rounded-[22px] bg-white/60 p-3.5">
              <div className="text-xl">🍽️</div>
              <div>
                <div className="font-bold text-[#2c2418]">{t('step1', lang)}</div>
                <div className="mt-0.5 text-[13px] text-[#6e5d4a]">{t('step1sub', lang)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[22px] bg-white/60 p-3.5">
              <div className="text-xl">💧</div>
              <div>
                <div className="font-bold text-[#2c2418]">{t('step2', lang)}</div>
                <div className="mt-0.5 text-[13px] text-[#6e5d4a]">{t('step2sub', lang)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[22px] bg-white/60 p-3.5">
              <div className="text-xl">🌱</div>
              <div>
                <div className="font-bold text-[#2c2418]">{t('step3', lang)}</div>
                <div className="mt-0.5 text-[13px] text-[#6e5d4a]">{t('step3sub', lang)}</div>
              </div>
            </div>
          </div>
        </Panel>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Panel className="p-4">
            <div className="text-[13px] font-extrabold text-[#d96d20]">{t('freePlan', lang)}</div>
            <div className="mt-1 text-[22px] font-black text-[#241f15]">{lang === 'ur' ? 'مفت' : 'Free'}</div>
            <p className="mt-2 text-[13px] leading-[1.55] text-[#6e5d4a]">
              {lang === 'ur'
                ? 'کھانا، پانی، ورزش، وزن، اور باغیچہ۔'
                : 'Logging, garden growth, weight tracking, and bilingual support.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('signup')}
              className="mt-4 w-full rounded-full bg-[#6c9e36] px-4 py-2.5 text-[14px] font-extrabold text-white"
            >
              {t('signUpCta', lang)}
            </button>
          </Panel>

          <Panel className="p-4">
            <div className="text-[13px] font-extrabold text-[#e3ab25]">{t('premiumPlan', lang)}</div>
            <div className="mt-1 text-[22px] font-black text-[#241f15]">PKR 299</div>
            <p className="mt-2 text-[13px] leading-[1.55] text-[#6e5d4a]">
              {lang === 'ur'
                ? 'اے آئی کوچ، ہفتہ وار منصوبہ، اور گہری بصیرتیں۔'
                : 'AI coach, weekly plan, and deeper insights.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('pricing')}
              className="mt-4 w-full rounded-full border border-[#e6d5ba] bg-[#fff8ee] px-4 py-2.5 text-[14px] font-extrabold text-[#2c2418]"
            >
              {t('upgrade', lang)}
            </button>
          </Panel>
        </div>

        <Panel className="mt-7 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-[22px] font-semibold tracking-[-0.04em] text-[#241f15]">
                {lang === 'ur' ? 'آہستہ، نرم، مستقل' : 'Slow, steady, supportive'}
              </h2>
              <p className="mt-2 text-[13px] leading-[1.55] text-[#6e5d4a]">
                {lang === 'ur'
                  ? 'یہ جگہ آپ کو شرمندہ کرنے کے لیے نہیں، بلکہ سہارا دینے کے لیے بنائی گئی ہے۔'
                  : 'Built to support you, not shame you.'}
              </p>
            </div>
            <div className="text-4xl">🌿</div>
          </div>
        </Panel>

        <footer className="mt-7 border-t border-[#eadcc7] py-7 text-center">
          <div className="flex justify-center gap-5">
            {[t('privacy', lang), t('terms', lang), t('about', lang)].map((label) => (
              <button key={label} type="button" className="text-sm font-bold text-[#6e5d4a]">
                {label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold leading-6 text-[#8a7761]">
            {t('legalNote', lang)}
          </p>
        </footer>
      </div>

    </div>
  )
}
