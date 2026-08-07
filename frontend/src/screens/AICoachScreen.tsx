import { useEffect, useRef, useState } from 'react'
import type { NavProps, AppState } from '../types'
import { t } from '../types'
import { ChevronLeftIcon, Panel, PageTitle, SectionLabel } from '../components/Primitives'
import PlantImage from '../components/PlantImage'
import { QUICK_ACTIONS, quickActionPrompt, quickActionReply, type QuickActionId } from './aiCoachReplies'

interface Props extends NavProps {
  state: AppState
  setState: (p: Partial<AppState>) => void
}

const FALLBACK_REPLIES = [
  "Your garden is growing steadily — you've been consistent with water this week. That's something worth building on.",
  'Small steps count. Even logging one meal today keeps momentum going.',
  'Based on your recent activity, a 20-minute walk after lunch could be a gentle addition.',
]

export default function AICoachScreen({ navigate, lang, isPremium, state, setState }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const seeded = useRef(false)

  const { aiChat } = state
  const capped = aiChat.usedToday >= aiChat.dailyCap
  const disabled = !aiChat.enabled

  // Scroll the message list itself, not via scrollIntoView -- that walks up to
  // the nearest scrollable ancestor (the page) and drags the whole screen
  // down, cutting off the header the moment the chat opens.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [aiChat.messages])

  // Sample exchange so the screen shows a real conversation rather than an
  // empty shell. Stands in for history the backend would return; seeded once,
  // and only when there is nothing to show.
  useEffect(() => {
    if (seeded.current || aiChat.messages.length > 0) return
    seeded.current = true
    setState({
      aiChat: {
        ...aiChat,
        messages: [
          {
            role: 'user',
            text: lang === 'ur' ? 'ناشتے میں کیا لوں؟' : 'What should I have for breakfast?',
            time: '08:12',
          },
          {
            role: 'ai',
            text:
              lang === 'ur'
                ? 'انڈا اور ایک روٹی اچھا آغاز ہے — تقریباً 180 کیلوریز اور 9 گرام پروٹین۔ ساتھ دہی لیں تو پیٹ دیر تک بھرا رہے گا۔'
                : 'An egg with one roti is a solid start — about 180 kcal and 9g protein. Add a katori of dahi if you want it to hold you longer.',
            time: '08:12',
          },
        ],
      },
    })
    // Seeding is a one-time bootstrap, not a reaction to changing values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const send = () => {
    if (!input.trim() || loading || capped) return
    const userMsg = { role: 'user' as const, text: input.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setInput('')
    setLoading(true)

    setState({
      aiChat: {
        ...aiChat,
        messages: [...aiChat.messages, userMsg],
        usedToday: aiChat.usedToday + 1,
      },
    })

    setTimeout(() => {
      const reply = FALLBACK_REPLIES[aiChat.messages.length % FALLBACK_REPLIES.length]
      setState({
        aiChat: {
          ...state.aiChat,
          messages: [...state.aiChat.messages, userMsg, { role: 'ai', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
          usedToday: state.aiChat.usedToday + 1,
        },
      })
      setLoading(false)
    }, 900)
  }

  /**
   * Quick actions. Plan requests come from the cached weekly/monthly plan
   * endpoint, so they deliberately do not spend one of the day's chat
   * messages -- only the open-ended question does.
   */
  const runQuickAction = (id: QuickActionId) => {
    if (loading) return
    const action = QUICK_ACTIONS.find((a) => a.id === id)!
    if (action.countsAgainstChatCap && capped) return

    const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = { role: 'user' as const, text: quickActionPrompt(id, lang), time: now() }
    setLoading(true)
    setState({ aiChat: { ...aiChat, messages: [...aiChat.messages, userMsg] } })

    setTimeout(() => {
      setState({
        aiChat: {
          ...state.aiChat,
          messages: [
            ...state.aiChat.messages,
            userMsg,
            { role: 'ai', text: quickActionReply(id, state.user, lang), time: now() },
          ],
          usedToday: state.aiChat.usedToday + (action.countsAgainstChatCap ? 1 : 0),
        },
      })
      setLoading(false)
    }, 900)
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen px-5 pb-24 pt-5">
        <div className="mx-auto max-w-[460px]">
          <button onClick={() => navigate('home')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]">
            <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
          </button>
          <Panel className="px-5 py-8 text-center">
            <PageTitle
              eyebrow={lang === 'ur' ? 'پریمیم' : 'Premium'}
              title={t('premiumTeaser', lang)}
              subtitle={t('premiumDesc', lang)}
              align="center"
            />
            <button onClick={() => navigate('premium')} className="mt-7 rounded-full bg-[#6c9e36] px-7 py-3.5 font-extrabold text-white">
              {t('upgrade', lang)}
            </button>
          </Panel>
        </div>
      </div>
    )
  }

  if (disabled) {
    return (
      <div className="min-h-screen px-5 pb-24 pt-5">
        <div className="mx-auto max-w-[460px]">
          <button onClick={() => navigate('home')} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]">
            <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
          </button>
          <Panel className="px-5 py-8 text-center">
            <PageTitle
              eyebrow={lang === 'ur' ? 'عارضی طور پر دستیاب نہیں' : 'Temporarily unavailable'}
              title={t('aiDisabled', lang)}
              subtitle={lang === 'ur' ? 'براہ کرم کچھ دیر بعد دوبارہ دیکھیں۔' : 'Please check back shortly.'}
              align="center"
            />
          </Panel>
        </div>
      </div>
    )
  }

  return (
    // Fixed-height column so the composer sits at the bottom of the screen and
    // the message list takes whatever space is left, instead of the page
    // growing and pushing the input below the fold.
    <div className="flex h-[100dvh] flex-col px-5 pt-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-[460px] min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('home')} className="inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]">
            <ChevronLeftIcon className="h-4 w-4" /> {t('back', lang)}
          </button>
          <div className="rounded-full bg-[#fff1da] px-3 py-1.5 text-xs font-extrabold text-[#8e641c]">
            {capped ? (lang === 'ur' ? 'حد پوری' : 'Limit reached') : `${aiChat.usedToday} / ${aiChat.dailyCap} ${lang === 'ur' ? 'پیغام' : 'messages'}`}
          </div>
        </div>

        {/* Banner: greets by name and states plainly what the coach knows, so
            the tailored answers below don't feel like they came from nowhere. */}
        <Panel tone="warm" className="mt-4 overflow-hidden p-0">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-14 w-14 shrink-0 items-end justify-center rounded-full bg-[#fff6df] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <PlantImage plant="succulent" stage={3} size={46} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-heading text-[20px] font-semibold leading-tight text-[#241f15]">
                {lang === 'ur' ? 'آپ کا باغبان' : 'Your garden coach'}
              </div>
              <p className="mt-1 text-[12px] leading-[1.5] text-[#6e5d4a]">
                {lang === 'ur'
                  ? 'آپ کے اہداف، صحت کی معلومات اور روزمرہ لاگ کو دیکھ کر مشورہ دیتا ہے۔'
                  : 'Advice shaped by your goals, health notes, and what you log.'}
              </p>
            </div>
          </div>
        </Panel>

        {/* Preset prompts: the user never has to phrase a request. */}
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((a) => {
            const blocked = loading || (a.countsAgainstChatCap && capped)
            return (
              <button
                key={a.id}
                onClick={() => runQuickAction(a.id)}
                disabled={blocked}
                className="rounded-full border border-[#e6d5ba] bg-[#fffaf1] px-3.5 py-2 text-[12.5px] font-extrabold text-[#2c2418] transition-colors disabled:opacity-45"
              >
                {lang === 'ur' ? a.ur : a.en}
              </button>
            )
          })}
        </div>

        <Panel className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-[#eadcc7] px-4 py-3">
            <SectionLabel>{lang === 'ur' ? 'پیغامات' : 'Messages'}</SectionLabel>
          </div>
          <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {aiChat.messages.length === 0 && (
              <div className="rounded-[22px] bg-[#fff8ee] p-5 text-center">
                <div className="text-4xl">🌿</div>
                <p className="mt-3 text-sm leading-7 text-[#6e5d4a]">
                  {lang === 'ur'
                    ? 'اوپر دیے گئے بٹن دبائیں، یا اپنا سوال لکھیں — خوراک، ورزش، یا روزمرہ عادتوں کے بارے میں۔'
                    : 'Tap a suggestion above, or ask anything about food, exercise, or your routines.'}
                </p>
              </div>
            )}

            {aiChat.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[82%] rounded-[22px] px-4 py-3"
                  style={{
                    background: msg.role === 'user' ? '#6c9e36' : '#fff8ee',
                    color: msg.role === 'user' ? '#fff' : '#2c2418',
                    border: msg.role === 'ai' ? '1px solid #e6d5ba' : 'none',
                  }}
                >
                  {/* pre-line: plan answers come back as short bulleted lines. */}
                  <p className="whitespace-pre-line text-[14px] leading-7">{msg.text}</p>
                  <p className="mt-1 text-[10px] font-bold opacity-60">{msg.time}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-[22px] border border-[#e6d5ba] bg-[#fff8ee] px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-2 w-2 rounded-full bg-[#6c9e36] pulse-soft" style={{ animationDelay: `${i * 0.16}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {capped && !loading && (
              <div className="rounded-[22px] bg-[#fff1da] px-4 py-3 text-center">
                <p className="text-sm leading-7 text-[#8e641c]">{t('aiCapped', lang)}</p>
              </div>
            )}

          </div>
        </Panel>

        <div className="mt-3 flex shrink-0 items-end gap-2 rounded-[24px] border border-[#e6d5ba] bg-[#fffaf1] p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 2000))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={lang === 'ur' ? 'پیغام لکھیں…' : 'Ask something…'}
            rows={1}
            disabled={capped}
            className="min-h-[46px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[14px] outline-none"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading || capped}
            className="h-12 w-12 rounded-full bg-[#6c9e36] text-lg font-black text-white disabled:bg-[#c8d8b0]"
          >
            →
          </button>
        </div>

        {/* Plain fine print, no container -- the last thing on the screen. */}
        <p className="mt-2 shrink-0 text-center text-[10px] leading-[1.5] text-[#9c8a72]">
          {t('disclaimer', lang)}
        </p>
      </div>
    </div>
  )
}
