import type { NavProps } from '../types'
import { t } from '../types'
import { ChevronLeftIcon, Panel, PageTitle, SectionLabel } from '../components/Primitives'

export default function PricingScreen({ navigate, lang }: NavProps) {
  return (
    <div className="min-h-screen px-5 pb-24 pt-5">
      <div className="mx-auto max-w-[460px]">
        <button onClick={() => navigate('landing')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]">
          <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
        </button>

        <PageTitle
          eyebrow={lang === 'ur' ? 'منصوبے' : 'Plans'}
          title={lang === 'ur' ? 'آپ کے لیے صاف، واضح قیمتیں' : 'Clear, simple pricing'}
          subtitle={lang === 'ur'
            ? 'مفت شروع کریں۔ جب چاہیں پریمیم پر جائیں۔'
            : 'Start free and upgrade whenever it feels right.'}
        />

        <div className="mt-7 grid gap-4">
          <Panel className="p-5">
            <SectionLabel>{t('freePlan', lang)}</SectionLabel>
            <div className="text-[24px] font-black text-[#6c9e36]">{lang === 'ur' ? 'ہمیشہ مفت' : 'Free forever'}</div>
            <ul className="mt-4 space-y-2 text-[14px] leading-7 text-[#5f523f]">
              {[
                lang === 'ur' ? 'کھانا، پانی اور ورزش لاگ' : 'Food, water, and workout logging',
                lang === 'ur' ? 'باغیچہ جو کبھی نہیں گرتا' : 'A garden that never regresses',
                lang === 'ur' ? 'وزن اور رجحان' : 'Weight and trends',
                lang === 'ur' ? 'اردو + انگریزی' : 'Urdu + English',
                lang === 'ur' ? 'آف لائن پہلے' : 'Offline-first',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-0.5 text-[#6c9e36]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate('signup')}
              className="mt-5 w-full rounded-full bg-[#6c9e36] px-5 py-3.5 font-extrabold text-white"
            >
              {t('signUpCta', lang)}
            </button>
          </Panel>

          <Panel className="p-5 bg-[#2d2418] border-[#463522]">
            <SectionLabel>{t('premiumPlan', lang)}</SectionLabel>
            <div className="text-[24px] font-black text-[#f0b93e]">
              PKR 299 <span className="text-[14px] font-bold text-[#c6b097]">{t('perMonth', lang)}</span>
            </div>
            <ul className="mt-4 space-y-2 text-[14px] leading-7 text-[#f7ebda]">
              {[
                lang === 'ur' ? 'مفت کے تمام فیچرز' : 'Everything in Free',
                lang === 'ur' ? 'روزانہ اے آئی چیٹ' : 'Daily AI chat',
                lang === 'ur' ? 'ہفتہ وار منصوبہ' : 'Weekly plan',
                lang === 'ur' ? 'گہری بصیرتیں' : 'Deeper insights',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-0.5 text-[#f0b93e]">✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate('signup')}
              className="mt-5 w-full rounded-full bg-[#f0b93e] px-5 py-3.5 font-extrabold text-[#2c2418]"
            >
              {lang === 'ur' ? 'پریمیم شروع کریں' : 'Start Premium'}
            </button>
          </Panel>
        </div>

        <Panel className="mt-5 p-5">
          <SectionLabel>{lang === 'ur' ? 'ادائیگی' : 'Payment'}</SectionLabel>
          <p className="text-[14px] leading-7 text-[#5f523f]">
            {lang === 'ur'
              ? 'ادائیگی دستی ٹرانسفر کے ذریعے ہے۔ کوئی خودکار چارج نہیں۔'
              : 'Payment is via manual transfer. No automatic charges.'}
          </p>
        </Panel>
      </div>
    </div>
  )
}
