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
  /** A short, human-readable line, e.g. "hydration: 2/3 days into their current mint" —
   * never raw health metrics (weight, symptom severity) passed to a third-party model.
   * Plan generation (below) is a deliberate, documented exception to that rule — see
   * PlanRequest.recentActivity. */
  readonly recentGardenSummary: string;
}

export type PlanType = 'diet' | 'workout';

/** One of the six fixed regeneration reasons a user can pick when tapping
 * "Adjust this plan" (docs/adr/0027-ai-plan-retrieval-grounding.md, §6). A
 * closed enum, never free text — the chip itself cannot carry a prompt
 * injection the way an open "tell the AI what to change" box could. */
export type RegenerationReason =
  | 'too_repetitive'
  | 'too_expensive'
  | 'no_time_to_cook'
  | 'want_more_protein'
  | 'too_much_dairy'
  | 'make_it_lighter';

/** A recipe the retrieval layer (candidate_recipes_for_user, migration
 * 0013) has already vetted for this user's conditions, allergies, dislikes,
 * and budget — the model may only ever pick from this list, never invent a
 * dish, which is what keeps every suggested meal loggable against a real
 * `recipes` row. */
export interface RecipeCandidate {
  readonly id: number;
  readonly name: string;
  readonly urduName: string | null;
  readonly calories: number | null;
  readonly proteinG: number | null;
  readonly costPkr: number | null;
}

/** Same guarantee as {@link RecipeCandidate}, for exercises
 * (candidate_exercises_for_user, migration 0013). */
export interface ExerciseCandidate {
  readonly id: number;
  readonly name: string;
  readonly urduName: string | null;
  readonly category: string | null;
  readonly metValue: number;
  readonly intensityLevel: string | null;
}

/**
 * The last two weeks of logged behaviour (recent_activity_summary, migration
 * 0013) — turns a plan that reads identically in week 1 and week 20 into one
 * that responds to reality.
 *
 * Sending this to a third-party model is a conscious, documented departure
 * from {@link UserContext}'s "never raw health metrics" rule: a weight-goal
 * plan cannot be built without weight. Defensible for plan generation
 * specifically because it is a deliberate, low-frequency action the user
 * initiates by tapping a labelled button — not a blanket policy change to
 * every AI call.
 */
export interface RecentActivity {
  readonly avgDailyCalories: number | null;
  readonly workoutDaysLast14: number | null;
  readonly latestWeightKg: number | null;
}

/** Everything plan generation needs about the caller's profile, goals, and
 * retrieval-grounded candidates. Replaces the old five-field UserProfile,
 * which had no candidate list and so could only ask the model to invent
 * dishes from its own training data. */
export interface PlanRequest {
  readonly planType: PlanType;
  /** 7 for a weekly diet plan, ~28-31 for a monthly workout plan (the exact
   * day count of the calendar month in question) — sizes the plan, never
   * stored. */
  readonly periodDays: number;
  readonly goal: string | null;
  readonly conditions: readonly string[];
  readonly activityLevel: string | null;
  readonly dailyCalorieTarget: number | null;
  readonly dailyProteinTargetG: number | null;
  readonly mealsPerDay: number;
  readonly workoutDaysPerWeek: number;
  readonly workoutSessionMinutes: number;
  readonly recentActivity: RecentActivity;
  /** Populated for plan_type 'diet', empty otherwise. */
  readonly candidateRecipes: readonly RecipeCandidate[];
  /** Populated for plan_type 'workout', empty otherwise. */
  readonly candidateExercises: readonly ExerciseCandidate[];
  /** Set only when regenerating via a fixed chip; null on a first
   * generation. */
  readonly adjustmentReason: RegenerationReason | null;
}

/**
 * Deliberately free text, not a parsed nested structure: an LLM is unreliable
 * at producing strictly-valid structured output without a lot of extra
 * retry/repair engineering that a weekly, low-frequency feature doesn't
 * justify (Blueprint §5.1's "simple, correct at current scale" principle,
 * applied here). `plan_content` (JSONB) stores this shape directly. The
 * rigid one-line-per-item output format (plan-prompt.ts) is what makes this
 * parseable client-side later without needing the model to emit valid JSON.
 */
export interface PlanContent {
  readonly text: string;
  readonly generatedWith: string;
}

export interface AiProvider {
  chat(message: string, context: UserContext): Promise<string>;
  generatePlan(request: PlanRequest): Promise<PlanContent>;
}
