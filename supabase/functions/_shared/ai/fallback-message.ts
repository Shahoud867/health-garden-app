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
  /** Qualifying days into the plant's current growth cycle (0-2 — garden
   * mechanic v2, migration 0005): reaching 3 is a graduation event, not a
   * value this ever persists as, so 2 is the best in-progress value there
   * is. Replaces the old weekly 0-7 days_succeeded_this_week. */
  readonly currentStage: number;
}

const GOAL_LABELS: Record<string, string> = {
  hydration: 'hydration',
  sugar_free: 'low-sugar day',
  protein: 'protein',
  movement: 'movement',
  consistency: 'consistency',
};

/** Picks the plant furthest into its current cycle and applies the roadmap
 * §7.2 template — the same message a free-tier user would see, since a
 * timed-out premium call should degrade to exactly that experience, not a
 * worse one. Thresholds are scaled to the 0-2 in-progress range (garden
 * mechanic v2): 2 is "one qualifying day from a new plant", not a mid-range
 * value the way 6/7 was under the old weekly scale. */
export function buildFallbackMessage(highlights: readonly GardenHighlight[]): string {
  if (highlights.length === 0) {
    return "We couldn't reach your coach just now, but every log helps your garden grow — try logging something today.";
  }

  const best = highlights.reduce((top, current) =>
    current.currentStage > top.currentStage ? current : top
  );
  const goalName = GOAL_LABELS[best.goalType] ?? best.goalType;
  const stage = best.currentStage;

  if (stage >= 2) {
    return `We couldn't reach your coach just now, but you're doing great: one more day of ${goalName} and your ${best.plantType} is fully grown.`;
  }
  if (stage >= 1) {
    return `We couldn't reach your coach just now. Good progress on ${goalName} — keep it up and your ${best.plantType} will keep growing.`;
  }
  return `We couldn't reach your coach just now. Your ${best.plantType} is just getting started — try logging ${goalName} today to help it grow.`;
}
