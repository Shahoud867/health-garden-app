import { useEffect, useState } from "react"
import type { NavProps } from "../types"
import { t } from "../types"
import {
  submitPaymentIntent,
  getActiveSubscription,
  getLatestPaymentIntent,
} from "../lib/api/payments"
import { useToast } from "../hooks/useToast"
import { env } from "../lib/env"
import { Turnstile } from "../components/Turnstile"
import { Spinner, Skeleton } from "../components/Loading"
import {
  ChevronLeftIcon,
  Panel,
  PageTitle,
  SectionLabel,
} from "../components/Primitives"

interface Props extends NavProps {
  onUpgrade: () => void
  userId: string
}

type PayStep = "compare" | "pay" | "verify" | "confirm"

const PAYMENT_NUMBERS: Record<"jazzcash" | "easypaisa", string> = {
  jazzcash: "03001234567",
  easypaisa: "03321234567",
}

export default function PremiumScreen({
  navigate,
  lang,
  isPremium,
  onUpgrade,
  userId,
}: Props) {
  const { showToast } = useToast()
  const [step, setStep] = useState<PayStep>("compare")
  const [method, setMethod] = useState<"jazzcash" | "easypaisa">("jazzcash")
  const [txRef, setTxRef] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [pendingReview, setPendingReview] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [subscriptionUntil, setSubscriptionUntil] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (!userId) return
    Promise.all([
      getLatestPaymentIntent(userId),
      isPremium ? getActiveSubscription(userId) : Promise.resolve(null),
    ])
      .then(([intent, subscription]) => {
        setPendingReview(intent?.status === "pending_review")
        setSubscriptionUntil(subscription?.current_period_end ?? null)
      })
      .catch(() => {
        // Non-critical -- the form still works without knowing prior state.
      })
      .finally(() => setCheckingExisting(false))
  }, [userId, isPremium])

  const submit = async () => {
    if (!txRef.trim() || !turnstileToken) return
    setSubmitting(true)
    try {
      await submitPaymentIntent(
        299,
        `${method}_manual`,
        txRef.trim(),
        turnstileToken,
      )
      setStep("confirm")
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not submit your payment.",
        "error",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const fieldStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 16,
    border: "1.5px solid #e6d5ba",
    background: "#fffaf1",
    color: "#2c2418",
    fontSize: 15,
    fontFamily: "'Nunito', sans-serif",
  }

  if (isPremium) {
    return (
      <div className="min-h-screen px-5 pb-24 pt-5">
        <div className="mx-auto max-w-[460px]">
          <button
            onClick={() => navigate("profile")}
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]"
          >
            <ChevronLeftIcon className="h-4 w-4" /> {t("back", lang)}
          </button>
          <PageTitle
            eyebrow={lang === "ur" ? "سبسکرپشن" : "Subscription"}
            title={t("subscriptionStatus", lang)}
            subtitle={
              lang === "ur"
                ? "آپ کا پریمیم اکاؤنٹ فعال ہے۔"
                : "Your premium account is active."
            }
          />
          <Panel className="mt-6 p-5">
            <SectionLabel>{t("premiumPlan", lang)}</SectionLabel>
            <div className="text-[22px] font-black text-[#6c9e36]">
              {t("approved", lang)}
            </div>
            {checkingExisting ? (
              <Skeleton className="mt-2" height={20} />
            ) : (
              <p className="mt-2 text-sm leading-7 text-[#6e5d4a]">
                {subscriptionUntil
                  ? lang === "ur"
                    ? `فعال سبسکرپشن — ${subscriptionUntil} تک`
                    : `Active subscription — until ${subscriptionUntil}`
                  : lang === "ur"
                    ? "فعال سبسکرپشن"
                    : "Active subscription"}
              </p>
            )}
          </Panel>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 pb-24 pt-5">
      <div className="mx-auto max-w-[460px]">
        <button
          onClick={() => navigate("profile")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#7b6851]"
        >
          <ChevronLeftIcon className="h-4 w-4" /> {t("back", lang)}
        </button>
        <PageTitle
          eyebrow={lang === "ur" ? "پریمیم" : "Premium"}
          title={t("upgrade", lang)}
          subtitle={
            lang === "ur"
              ? "سادہ، دستی ادائیگی، اور واضح جائزہ۔"
              : "Simple manual payment with a clear review flow."
          }
        />

        {step !== "compare" && (
          <div className="mt-6 flex gap-2">
            {(["pay", "verify", "confirm"] as PayStep[]).map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div
                  className="grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold"
                  style={{
                    background:
                      step === s ||
                      (["confirm", "verify"].includes(step) &&
                        i < ["pay", "verify", "confirm"].indexOf(step))
                        ? "#6c9e36"
                        : "#eadcc7",
                    color:
                      step === s ||
                      i < ["pay", "verify", "confirm"].indexOf(step)
                        ? "#fff"
                        : "#7b6851",
                  }}
                >
                  {i + 1}
                </div>
                {i < 2 && <div className="h-px flex-1 bg-[#eadcc7]" />}
              </div>
            ))}
          </div>
        )}

        {step === "compare" && (
          <>
            <div className="mt-6 grid gap-4">
              <Panel className="p-5">
                <SectionLabel>{t("freePlan", lang)}</SectionLabel>
                <ul className="space-y-2 text-sm leading-7 text-[#5f523f]">
                  {[
                    lang === "ur" ? "کھانا لاگ" : "Food log",
                    lang === "ur" ? "باغیچہ" : "Garden",
                    lang === "ur" ? "پانی" : "Water",
                    lang === "ur" ? "وزن" : "Weight",
                  ].map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-[#6c9e36]">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel className="p-5 bg-[#2d2418] border-[#463522]">
                <SectionLabel>{t("premiumPlan", lang)}</SectionLabel>
                <div className="text-[24px] font-black text-[#f0b93e]">
                  PKR 299{" "}
                  <span className="text-[14px] font-bold text-[#c6b097]">
                    {t("perMonth", lang)}
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-sm leading-7 text-[#f7ebda]">
                  {[
                    lang === "ur" ? "اے آئی چیٹ" : "AI chat",
                    lang === "ur" ? "ہفتہ وار منصوبہ" : "Weekly plan",
                    lang === "ur" ? "اعلیٰ بصیرتیں" : "Advanced insights",
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
              onClick={() => setStep("pay")}
              className="mt-6 w-full rounded-full bg-[#6c9e36] px-5 py-3.5 font-extrabold text-white"
            >
              {lang === "ur" ? "پریمیم حاصل کریں" : "Get Premium"}
            </button>
          </>
        )}

        {step === "pay" && (
          <Panel className="mt-6 p-5">
            <SectionLabel>
              {lang === "ur" ? "ادائیگی کا طریقہ" : "Payment method"}
            </SectionLabel>
            <div className="mt-3 flex gap-3">
              {(["jazzcash", "easypaisa"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className="flex-1 rounded-[18px] border px-4 py-3 font-extrabold"
                  style={{
                    background: method === m ? "#6c9e36" : "#fff8ee",
                    borderColor: method === m ? "#6c9e36" : "#e6d5ba",
                    color: method === m ? "#fff" : "#2c2418",
                  }}
                >
                  {t(m, lang)}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-[22px] bg-[#fff1da] p-4">
              <div className="text-[14px] font-black text-[#2c2418]">
                {PAYMENT_NUMBERS[method]}
              </div>
              <div className="mt-1 text-[22px] font-black text-[#d96d20]">
                PKR 299
              </div>
              <p className="mt-2 text-sm leading-7 text-[#6e5d4a]">
                {t("paymentNote", lang)}
              </p>
            </div>

            <button
              onClick={() => setStep("verify")}
              className="mt-4 w-full rounded-full bg-[#6c9e36] px-5 py-3.5 font-extrabold text-white"
            >
              {lang === "ur" ? "ادائیگی کر دی ہے" : "I've paid"}
            </button>
          </Panel>
        )}

        {step === "verify" && (
          <Panel className="mt-6 p-5">
            <SectionLabel>
              {lang === "ur" ? "تصدیق" : "Verification"}
            </SectionLabel>
            {checkingExisting ? (
              <Skeleton height={60} />
            ) : pendingReview ? (
              <div className="rounded-[22px] bg-[#fff1da] p-4 text-sm leading-7 text-[#6e5d4a]">
                {lang === "ur"
                  ? "آپ کی ایک درخواست پہلے سے زیر جائزہ ہے۔ براہ کرم فیصلے کا انتظار کریں۔"
                  : "You already have a submission pending review. Please wait before submitting another."}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="premium-tx-ref"
                    className="mb-1.5 block text-sm font-bold text-[#5f523f]"
                  >
                    {t("txRef", lang)}
                  </label>
                  <input
                    id="premium-tx-ref"
                    type="text"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    style={fieldStyle}
                    placeholder="e.g. TXN12345678"
                  />
                </div>
                {env.turnstileSiteKey ? (
                  <Turnstile
                    siteKey={env.turnstileSiteKey}
                    onToken={setTurnstileToken}
                  />
                ) : (
                  <p className="rounded-2xl border border-[#e6d5ba] bg-[#fff8ee] p-3 text-xs leading-6 text-[#8b6f46]">
                    {lang === "ur"
                      ? "ادائیگی کی تصدیق فی الحال ترتیب نہیں دی گئی۔"
                      : "Payment verification isn't configured yet — see README for setup."}
                  </p>
                )}
                <button
                  onClick={submit}
                  disabled={!txRef.trim() || !turnstileToken || submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 font-extrabold text-white disabled:bg-[#c8d8b0]"
                  style={{
                    background:
                      !txRef.trim() || !turnstileToken || submitting
                        ? undefined
                        : "#6c9e36",
                  }}
                >
                  {submitting && <Spinner size={16} color="#fff" />}
                  {t("submit", lang)}
                </button>
              </div>
            )}
          </Panel>
        )}

        {step === "confirm" && (
          <Panel className="mt-6 p-6 text-center">
            <div className="text-5xl">🌿</div>
            <PageTitle
              eyebrow={lang === "ur" ? "جمع ہو گیا" : "Submitted"}
              title={lang === "ur" ? "شکریہ!" : "Submitted!"}
              subtitle={
                lang === "ur"
                  ? "آپ کی ادائیگی 24-48 گھنٹوں میں چیک کی جائے گی۔"
                  : "Your payment will be reviewed within 24–48 hours."
              }
              align="center"
            />
            <button
              onClick={() => {
                onUpgrade()
                navigate("home")
              }}
              className="mt-6 rounded-full bg-[#6c9e36] px-7 py-3.5 font-extrabold text-white"
            >
              {lang === "ur" ? "گھر واپس" : "Back to home"}
            </button>
          </Panel>
        )}
      </div>
    </div>
  )
}
