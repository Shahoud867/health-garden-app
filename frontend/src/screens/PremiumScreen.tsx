import { useState } from 'react'
import type { NavProps } from '../types'
import { t } from '../types'
import { ChevronLeftIcon, Panel, PageTitle, SectionLabel } from '../components/Primitives'

interface Props extends NavProps {
  onUpgrade: () => void
}

type PayStep = 'compare' | 'pay' | 'verify' | 'confirm'

export default function PremiumScreen({ navigate, lang, isPremium, onUpgrade }: Props) {
  const [step, setStep] = useState<PayStep>('compare')
  const [method, setMethod] = useState<'jazzcash' | 'easypaisa'>('jazzcash')
  const [txRef, setTxRef] = useState('')
  const [answer, setAnswer] = useState('')
  const [hasExisting] = useState(false)
  const captcha = { q: '7 + 3', a: '10' }

  const submit = () => {
    if (answer !== captcha.a) return
    setStep('confirm')
    setTimeout(onUpgrade, 800)
  }

  const fieldStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 16,
    border: '1.5px solid #e6d5ba',
    background: '#fffaf1',
    color: '#2c2418',
    fontSize: 15,
    fontFamily: "'Nunito', sans-serif",
  }

  if (isPremium) {
    return (
      <div className="min-h-screen px-5 pb-24 pt-5">
        <div className="mx-auto max-w-[460px]">
          <button onClick={() => navigate('profile')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]">
            <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
          </button>
          <PageTitle
            eyebrow={lang === 'ur' ? 'سبسکرپشن' : 'Subscription'}
            title={t('subscriptionStatus', lang)}
            subtitle={lang === 'ur'
              ? 'آپ کا پریمیم اکاؤنٹ فعال ہے۔'
              : 'Your premium account is active.'}
          />
          <Panel className="mt-6 p-5">
            <SectionLabel>{t('premiumPlan', lang)}</SectionLabel>
            <div className="text-[22px] font-black text-[#6c9e36]">{t('approved', lang)}</div>
            <p className="mt-2 text-sm leading-7 text-[#6e5d4a]">
              {lang === 'ur' ? 'فعال سبسکرپشن — جولائی 2025 تک' : 'Active subscription — until July 2025'}
            </p>
          </Panel>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 pb-24 pt-5">
      <div className="mx-auto max-w-[460px]">
        <button onClick={() => navigate('profile')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]">
          <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
        </button>
        <PageTitle
          eyebrow={lang === 'ur' ? 'پریمیم' : 'Premium'}
          title={t('upgrade', lang)}
          subtitle={lang === 'ur'
            ? 'سادہ، دستی ادائیگی، اور واضح جائزہ۔'
            : 'Simple manual payment with a clear review flow.'}
        />

        {step !== 'compare' && (
          <div className="mt-6 flex gap-2">
            {(['pay', 'verify', 'confirm'] as PayStep[]).map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div
                  className="grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold"
                  style={{
                    background:
                      step === s || (['confirm', 'verify'].includes(step) && i < ['pay', 'verify', 'confirm'].indexOf(step))
                        ? '#6c9e36'
                        : '#eadcc7',
                    color:
                      step === s || i < ['pay', 'verify', 'confirm'].indexOf(step) ? '#fff' : '#7b6851',
                  }}
                >
                  {i + 1}
                </div>
                {i < 2 && <div className="h-px flex-1 bg-[#eadcc7]" />}
              </div>
            ))}
          </div>
        )}

        {step === 'compare' && (
          <>
            <div className="mt-6 grid gap-4">
              <Panel className="p-5">
                <SectionLabel>{t('freePlan', lang)}</SectionLabel>
                <ul className="space-y-2 text-sm leading-7 text-[#5f523f]">
                  {[
                    lang === 'ur' ? 'کھانا لاگ' : 'Food log',
                    lang === 'ur' ? 'باغیچہ' : 'Garden',
                    lang === 'ur' ? 'پانی' : 'Water',
                    lang === 'ur' ? 'وزن' : 'Weight',
                  ].map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-[#6c9e36]">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel className="p-5 bg-[#2d2418] border-[#463522]">
                <SectionLabel>{t('premiumPlan', lang)}</SectionLabel>
                <div className="text-[24px] font-black text-[#f0b93e]">PKR 299 <span className="text-[14px] font-bold text-[#c6b097]">{t('perMonth', lang)}</span></div>
                <ul className="mt-4 space-y-2 text-sm leading-7 text-[#f7ebda]">
                  {[
                    lang === 'ur' ? 'اے آئی چیٹ' : 'AI chat',
                    lang === 'ur' ? 'ہفتہ وار منصوبہ' : 'Weekly plan',
                    lang === 'ur' ? 'اعلیٰ بصیرتیں' : 'Advanced insights',
                  ].map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-[#f0b93e]">✦</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
            <button
              onClick={() => setStep('pay')}
              className="mt-6 w-full rounded-full bg-[#6c9e36] px-5 py-3.5 font-extrabold text-white"
            >
              {lang === 'ur' ? 'پریمیم حاصل کریں' : 'Get Premium'}
            </button>
          </>
        )}

        {step === 'pay' && (
          <Panel className="mt-6 p-5">
            <SectionLabel>{lang === 'ur' ? 'ادائیگی کا طریقہ' : 'Payment method'}</SectionLabel>
            <div className="mt-3 flex gap-3">
              {(['jazzcash', 'easypaisa'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className="flex-1 rounded-[18px] border px-4 py-3 font-extrabold"
                  style={{
                    background: method === m ? '#6c9e36' : '#fff8ee',
                    borderColor: method === m ? '#6c9e36' : '#e6d5ba',
                    color: method === m ? '#fff' : '#2c2418',
                  }}
                >
                  {t(m, lang)}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-[22px] bg-[#fff1da] p-4">
              <div className="text-[14px] font-black text-[#2c2418]">{method === 'jazzcash' ? '03001234567' : '03321234567'}</div>
              <div className="mt-1 text-[22px] font-black text-[#d96d20]">PKR 299</div>
              <p className="mt-2 text-sm leading-7 text-[#6e5d4a]">{t('paymentNote', lang)}</p>
            </div>

            <button onClick={() => setStep('verify')} className="mt-4 w-full rounded-full bg-[#6c9e36] px-5 py-3.5 font-extrabold text-white">
              {lang === 'ur' ? 'ادائیگی کر دی ہے' : "I've paid"}
            </button>
          </Panel>
        )}

        {step === 'verify' && (
          <Panel className="mt-6 p-5">
            <SectionLabel>{lang === 'ur' ? 'تصدیق' : 'Verification'}</SectionLabel>
            {hasExisting ? (
              <div className="rounded-[22px] bg-[#fff1da] p-4 text-sm leading-7 text-[#6e5d4a]">
                {lang === 'ur'
                  ? 'آپ کی ایک درخواست پہلے سے زیر جائزہ ہے۔ براہ کرم فیصلے کا انتظار کریں۔'
                  : 'You already have a submission pending review. Please wait before submitting another.'}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-[#5f523f]">{t('txRef', lang)}</label>
                  <input type="text" value={txRef} onChange={(e) => setTxRef(e.target.value)} style={fieldStyle} placeholder="e.g. TXN12345678" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-[#5f523f]">
                    {t('verifyHuman', lang)} {captcha.q} =
                  </label>
                  <input type="number" value={answer} onChange={(e) => setAnswer(e.target.value)} style={fieldStyle} placeholder="?" />
                </div>
                <button
                  onClick={submit}
                  disabled={!txRef || answer !== captcha.a}
                  className="w-full rounded-full px-5 py-3.5 font-extrabold text-white disabled:bg-[#c8d8b0]"
                  style={{ background: !txRef || answer !== captcha.a ? undefined : '#6c9e36' }}
                >
                  {t('submit', lang)}
                </button>
              </div>
            )}
          </Panel>
        )}

        {step === 'confirm' && (
          <Panel className="mt-6 p-6 text-center">
            <div className="text-5xl">🌿</div>
            <PageTitle
              eyebrow={lang === 'ur' ? 'جمع ہو گیا' : 'Submitted'}
              title={lang === 'ur' ? 'شکریہ!' : 'Submitted!'}
              subtitle={lang === 'ur'
                ? 'آپ کی ادائیگی 24-48 گھنٹوں میں چیک کی جائے گی۔'
                : 'Your payment will be reviewed within 24–48 hours.'}
              align="center"
            />
            <button
              onClick={() => navigate('home')}
              className="mt-6 rounded-full bg-[#6c9e36] px-7 py-3.5 font-extrabold text-white"
            >
              {lang === 'ur' ? 'گھر واپس' : 'Back to home'}
            </button>
          </Panel>
        )}
      </div>
    </div>
  )
}
