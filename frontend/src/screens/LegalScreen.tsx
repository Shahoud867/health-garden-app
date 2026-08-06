import type { NavProps } from '../types'
import { t } from '../types'
import { ChevronLeftIcon, Panel, PageTitle } from '../components/Primitives'

interface Props extends NavProps {
  doc: 'privacy' | 'terms' | 'about'
  /**
   * Where Back returns to. These pages are reachable both from the landing
   * footer while signed out and from Profile once signed in, so the caller
   * decides — sending a signed-out reader to Profile would bounce them
   * straight into the login screen.
   */
  backTo: 'landing' | 'profile'
}

const UPDATED = 'August 2026'

/** A heading plus paragraphs. Body strings render one <p> each. */
type Block = { h?: string; p: string[] }

function Doc({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => (
        <div key={i}>
          {b.h && (
            <h2 className="font-heading mb-2 text-[17px] font-semibold text-[#241f15]">{b.h}</h2>
          )}
          {b.p.map((para, j) => (
            <p key={j} className="mb-2 text-[13.5px] leading-[1.75] text-[#5f523f] last:mb-0">
              {para}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}

const PRIVACY: Block[] = [
  {
    p: [
      'Health Garden is a personal wellness tracker. This page explains what we collect, why, who else sees it, and how to get it back or delete it. Plain language, no filler.',
    ],
  },
  {
    h: 'What we collect',
    p: [
      'Account details: your email address and password. Passwords are hashed by our authentication provider — we never see or store the original.',
      'Profile details you enter during setup: name, age, sex, height, weight, activity level, your goal, and any health conditions you choose to tell us about.',
      'What you log: meals and portions, water, workouts, and weight over time.',
      'If you subscribe: the payment method you chose and the transaction reference you enter. We never receive or store your card, wallet PIN, or bank credentials.',
      'Basic technical data: error reports and anonymous usage statistics that tell us which screens are slow or broken.',
    ],
  },
  {
    h: 'Why we collect it',
    p: [
      'To calculate your daily calorie and protein targets, to show your logs back to you, to grow your garden, and — if you are on Premium — to generate meal and workout suggestions that fit your goal and conditions.',
      'We do not sell your data. We do not share it with advertisers. We do not build advertising profiles.',
    ],
  },
  {
    h: 'Health information',
    p: [
      'Health conditions, weight, and food logs are sensitive. You choose whether to share conditions at all — the app works without them, you simply get less tailored suggestions.',
      'Conditions are used to hide things that may not suit you, such as sugary dishes for someone with diabetes or high-impact exercises for someone with knee pain. They are never used to diagnose you or to draw medical conclusions.',
    ],
  },
  {
    h: 'Who else processes your data',
    p: [
      'Supabase — hosts our database and handles sign-in.',
      'Google Gemini — generates Premium AI replies and plans. Free users’ data is never sent to it.',
      'Cloudflare Turnstile — checks that sign-ups and payment submissions come from a person, not a script.',
      'Sentry and PostHog — receive crash reports and anonymous usage statistics.',
      'Each receives only what it needs to do its job. None of them are permitted to sell your data.',
    ],
  },
  {
    h: 'AI and your data',
    p: [
      'This matters, so we are being direct about it. Premium AI features run on Google’s Gemini API. While we remain on its free tier, Google may retain and use the content sent to it to improve their models. That content can include your goal, your targets, the conditions you listed, and a summary of your recent activity.',
      'If you would rather no health information reach an AI provider, do not use the AI coach or plan generation. Every other part of Health Garden works fully without them, and nothing is sent to Gemini unless you open those features.',
    ],
  },
  {
    h: 'Your rights',
    p: [
      'Export: you can download everything we hold about you at any time, from Profile → Data & Privacy.',
      'Deletion: you can delete your account from the same place. Deletion is permanent and removes your profile, every log, your garden, and your subscription record. We cannot recover it afterwards.',
      'Correction: your profile details can be edited at any time in Profile.',
    ],
  },
  {
    h: 'How long we keep it',
    p: [
      'While your account exists. Once you delete your account the data goes with it. Anonymous, aggregated statistics that cannot identify you may be retained.',
    ],
  },
  {
    h: 'Children',
    p: [
      'Health Garden is not intended for anyone under 16. We do not knowingly collect data from children. If you believe a child has created an account, contact us and we will remove it.',
    ],
  },
  {
    h: 'Changes and contact',
    p: [
      'If we change how your data is used in a way that materially affects you, we will tell you in the app rather than quietly editing this page.',
      'Questions, corrections, or complaints: contact us through the details on the About page.',
    ],
  },
]

const TERMS: Block[] = [
  {
    p: [
      'These terms cover your use of Health Garden. Using the app means you accept them.',
    ],
  },
  {
    h: 'Health Garden is not medical advice',
    p: [
      'This is the most important thing on this page. Health Garden is a wellness tracker, not a medical device, and not a substitute for a doctor, dietitian, or any qualified healthcare professional.',
      'Nothing in the app — including calorie and protein targets, meal and workout suggestions, condition-based filtering, and anything the AI coach says — is a diagnosis, a treatment plan, or medical advice. Targets are estimates from standard formulas, not clinical prescriptions.',
      'Always consult a qualified healthcare provider before changing your diet or exercise routine, especially if you are pregnant, nursing, managing a medical condition, or taking medication. If you think you are having a medical emergency, contact emergency services — do not use this app.',
    ],
  },
  {
    h: 'Your account',
    p: [
      'You need an account to use the app. Keep your password to yourself; you are responsible for what happens under your account. Give us accurate information — targets calculated from wrong details will be wrong.',
      'One account per person. Do not share, sell, or transfer your account.',
    ],
  },
  {
    h: 'Nutrition and exercise data',
    p: [
      'Our food and exercise database is compiled from published sources and is provided in good faith, but values are approximate. Portion sizes vary, recipes vary between households, and calorie burn depends on your body and effort. Treat every number as a useful estimate, not a measurement.',
    ],
  },
  {
    h: 'Premium subscription',
    p: [
      'Premium costs PKR 299 per month and unlocks AI chat and AI-generated plans. Everything else — logging, your garden, weight tracking, and bilingual support — is free and stays free.',
      'Payment is currently made by manual transfer through JazzCash or Easypaisa. You send the amount and enter your transaction reference; we verify it by hand. Verification is usually quick but is not instant, and Premium activates only once verified.',
      'AI usage is capped daily to keep the service running for everyone. If you reach the cap, it resets the next day. We may also temporarily disable AI features if costs or provider limits require it — the rest of the app keeps working.',
      'Refunds: if a payment is verified but Premium does not activate, contact us and we will fix it or refund that period. We do not refund partly-used months where the service worked as described.',
    ],
  },
  {
    h: 'Fair use',
    p: [
      'Do not attempt to break into other people’s accounts, scrape or bulk-extract our database, submit fraudulent payment references, script or automate access, or try to bypass usage limits. We may suspend accounts that do.',
    ],
  },
  {
    h: 'Availability',
    p: [
      'We aim to keep Health Garden available and your data safe, but we cannot promise uninterrupted service. Features may change, and free features may change over time. Your logs remain yours and exportable regardless.',
    ],
  },
  {
    h: 'Liability',
    p: [
      'Health Garden is provided as-is. To the fullest extent the law allows, we are not liable for health outcomes, decisions you make based on information in the app, or losses arising from its use. Nothing here limits liability that cannot lawfully be limited.',
    ],
  },
  {
    h: 'Ending your use',
    p: [
      'You can delete your account at any time from Profile → Data & Privacy. We may close accounts that breach these terms. On closure your data is deleted as described in the Privacy Policy.',
    ],
  },
  {
    h: 'Changes',
    p: [
      'We may update these terms. Material changes will be announced in the app. Continuing to use Health Garden after a change means you accept the updated terms.',
    ],
  },
]

const ABOUT: Block[] = [
  {
    p: [
      'Health Garden is a health tracker built for Pakistan, by a two-person team.',
    ],
  },
  {
    h: 'Why we built it',
    p: [
      'Most health apps are built somewhere else. They ask you to weigh food in grams, offer dishes nobody around you eats, and count a day you did not log as a day you failed.',
      'We wanted the opposite: log a katori of daal or a roti the way you would actually say it, in Urdu or English, and be met with encouragement rather than a broken streak.',
    ],
  },
  {
    h: 'The garden',
    p: [
      'Five plants, each tied to one habit — water, no junk food, movement, your main goal, and consistency. Meet a habit for the day and its plant grows a little. Three days and it is fully grown, and it gets planted in your garden for good.',
      'Your garden never shrinks. Plants do not wilt, die, or get taken away. On a day you miss, a plant simply rests — and rests are part of it. Fill a garden and a new one opens, while the old one stays in your collection.',
    ],
  },
  {
    h: 'What we believe',
    p: [
      'Guilt is a poor motivator and a worse habit. Nothing in this app is designed to shame you into opening it.',
      'Your data is yours. Export it or delete it whenever you like, without asking us.',
      'Local first. Pakistani dishes, local portion units, Urdu throughout, and prices that make sense here.',
    ],
  },
  {
    h: 'A word of caution',
    p: [
      'We are not doctors and Health Garden is not medical software. It can help you notice patterns and build habits, but it cannot examine you. For anything concerning your health, please see a qualified professional.',
    ],
  },
  {
    h: 'Get in touch',
    p: [
      'Found a bug, want a dish added, or think something in the app is wrong? We would genuinely like to know. Contact details are published alongside the app listing.',
    ],
  },
]

const DOCS = {
  privacy: { blocks: PRIVACY, eyebrowEn: 'Privacy', eyebrowUr: 'رازداری' },
  terms: { blocks: TERMS, eyebrowEn: 'Terms', eyebrowUr: 'شرائط' },
  about: { blocks: ABOUT, eyebrowEn: 'About', eyebrowUr: 'تعارف' },
}

export default function LegalScreen({ navigate, lang, doc, backTo }: Props) {
  const { blocks, eyebrowEn, eyebrowUr } = DOCS[doc]

  return (
    <div className="min-h-screen px-5 pb-24 pt-5">
      <div className="mx-auto max-w-[460px]">
        <button
          onClick={() => navigate(backTo)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]"
        >
          <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
        </button>

        <PageTitle eyebrow={lang === 'ur' ? eyebrowUr : eyebrowEn} title={t(doc, lang)} />

        <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-[#8b6f46]">
          {lang === 'ur' ? 'آخری تازہ کاری' : 'Last updated'} — {UPDATED}
        </p>

        {lang === 'ur' && (
          <Panel tone="warm" className="mt-4 p-4">
            <p className="text-[13px] leading-[1.9] text-[#5f523f]">
              یہ صفحہ فی الحال صرف انگریزی میں دستیاب ہے۔ اردو ترجمہ جلد شامل کیا جائے گا۔
            </p>
          </Panel>
        )}

        <Panel className="mt-4 p-5">
          <Doc blocks={blocks} />
        </Panel>
      </div>
    </div>
  )
}
