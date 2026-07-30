/**
 * The AI provider abstraction (Blueprint §6.6, ADR-022).
 *
 * `ai-chat` and `ai-plan-generate` depend on this interface, never on the
 * Gemini SDK/REST shape directly — the same "no hard vendor lock-in"
 * discipline already applied to Supabase (ADR-011) and hosting (§3.1a),
 * extended to the one remaining unabstracted dependency. Swapping or adding
 * a provider is a new adapter, not a rewrite of every call site.
 */

/** What the chat feature needs about the caller to frame a response —
 * never diagnostic data, only enough for tone and relevance. */
export interface UserContext {
  readonly conditions: readonly string[];
  /** A short, human-readable line, e.g. "3/7 days on your hydration goal this week" —
   * never raw health metrics (weight, symptom severity) passed to a third-party model. */
  readonly recentGardenSummary: string;
}

/** What plan generation needs about the caller's profile and goals. */
export interface UserProfile {
  readonly goal: string | null;
  readonly conditions: readonly string[];
  readonly activityLevel: string | null;
  readonly dailyCalorieTarget: number | null;
  readonly dailyProteinTargetG: number | null;
}

/**
 * Deliberately free text, not a parsed nested structure: an LLM is unreliable
 * at producing strictly-valid structured output without a lot of extra
 * retry/repair engineering that a weekly, low-frequency feature doesn't
 * justify (Blueprint §5.1's "simple, correct at current scale" principle,
 * applied here). `plan_content` (JSONB) stores this shape directly.
 */
export interface PlanContent {
  readonly text: string;
  readonly generatedWith: string;
}

export interface AiProvider {
  chat(message: string, context: UserContext): Promise<string>;
  generatePlan(profile: UserProfile): Promise<PlanContent>;
}
