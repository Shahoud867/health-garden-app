import type { AppState } from "../types"

type User = AppState["user"]

/**
 * Canned coach answers for the quick actions.
 *
 * These stand in for the real Edge Functions and are written to match what
 * the backend can actually produce, so the UI does not promise anything the
 * server cannot deliver:
 *
 *  - Plans are built only from dishes and exercises in the app's own
 *    database, filtered by the user's conditions before the model sees them,
 *    so every suggestion is a real, loggable item.
 *  - Nothing here diagnoses or treats. Conditions only ever *remove* unsafe
 *    suggestions or add a gentle note.
 *  - Diet and workout plans come from the weekly/monthly plan endpoint, which
 *    is cached per period and does not spend a chat message. Only the free
 *    "suggest foods" style question is an actual chat turn.
 */
export type QuickActionId = "diet_plan" | "workout_plan" | "suggest_foods"

export interface QuickAction {
  id: QuickActionId
  en: string
  ur: string
  /** Plan actions are cached server-side and don't count against the daily chat cap. */
  countsAgainstChatCap: boolean
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "diet_plan",
    en: "Get my diet plan",
    ur: "میرا کھانے کا پلان",
    countsAgainstChatCap: false,
  },
  {
    id: "workout_plan",
    en: "Get my workout plan",
    ur: "میری ورزش کا پلان",
    countsAgainstChatCap: false,
  },
  {
    id: "suggest_foods",
    en: "Suggest foods for today",
    ur: "آج کے لیے کھانے تجویز کریں",
    countsAgainstChatCap: true,
  },
]

/** Keys match users.goal's CHECK constraint exactly. */
const GOAL_LABEL: Record<string, { en: string; ur: string }> = {
  lose_weight: { en: "losing weight steadily", ur: "آہستہ آہستہ وزن کم کرنا" },
  gain_weight: { en: "gaining weight steadily", ur: "آہستہ آہستہ وزن بڑھانا" },
  build_muscle: { en: "building strength", ur: "طاقت بڑھانا" },
  maintain: { en: "holding steady", ur: "وزن برقرار رکھنا" },
  general_health: { en: "staying healthy overall", ur: "مجموعی صحت" },
}

/** Gentle, non-diagnostic notes — these mirror the filters applied server-side. */
const CONDITION_NOTE: Record<string, { en: string; ur: string }> = {
  diabetes: {
    en: "Sugary dishes are left out, and meals are spaced to keep energy even.",
    ur: "میٹھے کھانے شامل نہیں، اور کھانے کے وقفے متوازن رکھے گئے ہیں۔",
  },
  pcos: {
    en: "Higher-protein, lower-refined-carb options are favoured.",
    ur: "زیادہ پروٹین اور کم میدہ والے کھانے ترجیح میں ہیں۔",
  },
  knee_pain: {
    en: "Movement is kept low-impact and knee-friendly.",
    ur: "ورزش گھٹنوں کے لیے نرم رکھی گئی ہے۔",
  },
  obesity: {
    en: "Portions lean lighter, with filling, high-volume dishes.",
    ur: "حصے ہلکے رکھے گئے ہیں، پیٹ بھرنے والے کھانوں کے ساتھ۔",
  },
  hypertension: {
    en: "Low-salt cooking is assumed throughout.",
    ur: "کم نمک والا پکوان فرض کیا گیا ہے۔",
  },
}

function pick(lang: "en" | "ur", v: { en: string; ur: string }) {
  return lang === "ur" ? v.ur : v.en
}

function conditionLines(user: User, lang: "en" | "ur"): string {
  const notes = user.conditions
    .map((c) => CONDITION_NOTE[c])
    .filter((n): n is { en: string; ur: string } => Boolean(n))
    .map((n) => pick(lang, n))
  return notes.length > 0 ? `\n\n${notes.join(" ")}` : ""
}

export function quickActionPrompt(
  id: QuickActionId,
  lang: "en" | "ur",
): string {
  const a = QUICK_ACTIONS.find((q) => q.id === id)!
  return lang === "ur" ? a.ur : a.en
}

export function quickActionReply(
  id: QuickActionId,
  user: User,
  lang: "en" | "ur",
): string {
  const goal = pick(lang, GOAL_LABEL[user.goal] ?? GOAL_LABEL.general_health)
  const notes = conditionLines(user, lang)

  if (id === "diet_plan") {
    return lang === "ur"
      ? `آپ کے ہدف (${goal}) اور روزانہ ${user.calorieTarget} کیلوریز کے لیے اس ہفتے کا خاکہ:\n\n` +
          `• ناشتہ — انڈا اور روٹی، یا دہی کے ساتھ پراٹھا\n` +
          `• دوپہر — دال چاول ایک کٹوری، سلاد کے ساتھ\n` +
          `• رات — چکن کڑاہی ایک کٹوری، ایک روٹی\n\n` +
          `پروٹین کا ہدف تقریباً ${user.proteinTarget} گرام روزانہ ہے۔${notes}`
      : `Here's this week's outline for ${goal}, at about ${user.calorieTarget} kcal a day:\n\n` +
          `• Breakfast — egg with roti, or paratha with dahi\n` +
          `• Lunch — one katori dal chawal with salad\n` +
          `• Dinner — one katori chicken karahi with a roti\n\n` +
          `That lands near your ${user.proteinTarget}g protein target.${notes}`
  }

  if (id === "workout_plan") {
    return lang === "ur"
      ? `اس مہینے کے لیے ہلکا آغاز، ${goal} کے مطابق:\n\n` +
          `• ہفتے میں 3 دن — 20 منٹ تیز چہل قدمی\n` +
          `• 2 دن — گھر پر ہلکی طاقت کی مشقیں\n` +
          `• باقی دن — نرم اسٹریچنگ\n\n` +
          `ہر ہفتے 5 منٹ بڑھائیں، جلدی نہیں۔${notes}`
      : `A gentle month, shaped around ${goal}:\n\n` +
          `• 3 days a week — 20 minutes of brisk walking\n` +
          `• 2 days — light bodyweight strength at home\n` +
          `• Remaining days — easy stretching\n\n` +
          `Add five minutes a week, no rush.${notes}`
  }

  return lang === "ur"
    ? `آج کے لیے کچھ تجاویز، آپ کے ${user.calorieTarget} کیلوریز کے ہدف کو مدِنظر رکھتے ہوئے:\n\n` +
        `• دال چاول — ایک کٹوری، 320 کیلوریز\n` +
        `• دہی — ایک کٹوری، 100 کیلوریز\n` +
        `• ساگ روٹی کے ساتھ — تقریباً 270 کیلوریز\n\n` +
        `یہ سب ایپ میں موجود ہیں، ایک ٹیپ سے درج کر سکتے ہیں۔${notes}`
    : `A few ideas for today, against your ${user.calorieTarget} kcal target:\n\n` +
        `• Dal chawal — one katori, 320 kcal\n` +
        `• Dahi — one katori, 100 kcal\n` +
        `• Saag with a roti — about 270 kcal\n\n` +
        `All three are in the app, so you can log them in one tap.${notes}`
}
