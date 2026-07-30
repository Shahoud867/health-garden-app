/**
 * The Gemini-timeout fallback (Blueprint §2.13): "a templated free-tier-style
 * message... the premium AI feature degrades gracefully to the free-tier
 * experience rather than failing open or failing hard." Mirrors the exact
 * threshold template the free tier's motivation message already uses
 * (Founder_B_Backend_Roadmap.md §7.2) — this is not a new design, just that
 * same template reached from a different trigger (an unavailable Gemini
 * response instead of "no AI call for this tier at all").
 */

export interface GardenHighlight {
  readonly goalType: string;
  readonly plantType: string;
  readonly daysSucceededThisWeek: number;
}

const GOAL_LABELS: Record<string, string> = {
  hydration: 'hydration',
  sugar_free: 'low-sugar day',
  protein: 'protein',
  movement: 'movement',
  consistency: 'consistency',
};

/** Picks the best-performing goal this week and applies the roadmap §7.2
 * template — the same message a free-tier user would see, since a timed-out
 * premium call should degrade to exactly that experience, not a worse one. */
export function buildFallbackMessage(highlights: readonly GardenHighlight[]): string {
  if (highlights.length === 0) {
    return "We couldn't reach your coach just now, but every log helps your garden grow — try logging something today.";
  }

  const best = highlights.reduce((top, current) =>
    current.daysSucceededThisWeek > top.daysSucceededThisWeek ? current : top
  );
  const goalName = GOAL_LABELS[best.goalType] ?? best.goalType;
  const days = best.daysSucceededThisWeek;

  if (days >= 6) {
    return `We couldn't reach your coach just now, but you're doing great: you hit your ${goalName} goal ${days}/7 days this week — your ${best.plantType} is thriving.`;
  }
  if (days >= 3) {
    return `We couldn't reach your coach just now. Good progress on ${goalName} — ${days}/7 days this week. Keep it up.`;
  }
  return `We couldn't reach your coach just now. Your ${best.plantType} is still small — try logging ${goalName} today to help it grow.`;
}
