/**
 * Retrieval-grounded plan prompt building
 * (docs/adr/0027-ai-plan-retrieval-grounding.md).
 *
 * Replaces the old five-field mail-merge ("Goal: X, invent a plan") with:
 * "here are candidates our own database already vetted for this person —
 * build a plan using only these, referencing them by id." Kept as a plain
 * function returning a string, not folded into GeminiProvider, so any future
 * AiProvider implementation gets the same grounded prompt for free (ADR-022).
 */

import type {
  ExerciseCandidate,
  PlanRequest,
  RecipeCandidate,
  RegenerationReason,
} from './provider.ts';

const ADJUSTMENT_CLAUSES: Record<RegenerationReason, string> = {
  too_repetitive:
    'The previous plan felt too repetitive — vary the dishes/exercises more this time.',
  too_expensive: 'The previous plan was too expensive — favor lower-cost options this time.',
  no_time_to_cook: 'This person has little time to cook — favor quick, simple dishes.',
  want_more_protein: 'This person wants more protein than the previous plan had.',
  too_much_dairy: 'The previous plan had too much dairy — reduce dairy-heavy dishes.',
  make_it_lighter:
    'This person wants something lighter — favor lower-calorie/lower-intensity options within the target.',
};

function formatConditions(conditions: readonly string[]): string {
  return conditions.length > 0 ? conditions.join(', ') : 'none noted';
}

function formatRecentActivity(request: PlanRequest): string {
  const { avgDailyCalories, workoutDaysLast14, latestWeightKg } = request.recentActivity;
  if (avgDailyCalories === null && workoutDaysLast14 === null && latestWeightKg === null) {
    return 'no logged history yet';
  }
  const parts = [
    avgDailyCalories !== null ? `averaging ${avgDailyCalories} kcal/day` : null,
    workoutDaysLast14 !== null ? `moved on ${workoutDaysLast14} of the last 14 days` : null,
    latestWeightKg !== null ? `latest weight ${latestWeightKg} kg` : null,
  ].filter((part): part is string => part !== null);
  return `Last 2 weeks: ${parts.join(', ')}.`;
}

function formatRecipeCandidates(candidates: readonly RecipeCandidate[]): string {
  return candidates
    .map((c, i) => {
      const name = c.urduName !== null ? `${c.name} (${c.urduName})` : c.name;
      const kcal = c.calories !== null ? `${c.calories} kcal` : 'kcal unknown';
      const protein = c.proteinG !== null ? `${c.proteinG}g protein` : 'protein unknown';
      const cost = c.costPkr !== null ? `~Rs.${c.costPkr}/serving` : 'cost unknown';
      return `${i + 1}. id=${c.id} | ${name} | ${kcal} | ${protein} | ${cost}`;
    })
    .join('\n');
}

function formatExerciseCandidates(candidates: readonly ExerciseCandidate[]): string {
  return candidates
    .map((c, i) => {
      const name = c.urduName !== null ? `${c.name} (${c.urduName})` : c.name;
      const category = c.category ?? 'general';
      const intensity = c.intensityLevel ?? 'unspecified';
      return `${
        i + 1
      }. id=${c.id} | ${name} | ${category} | MET ${c.metValue} | ${intensity} intensity`;
    })
    .join('\n');
}

function buildDietPrompt(request: PlanRequest): string {
  const perMealCalories = request.dailyCalorieTarget !== null
    ? Math.round(request.dailyCalorieTarget / Math.max(request.mealsPerDay, 1))
    : null;

  return `Build a ${request.periodDays}-day meal plan for this person.

USE ONLY these dishes. Refer to each by its exact id and name.
Do not invent dishes or suggest anything not on this list.
${formatRecipeCandidates(request.candidateRecipes)}

PERSON
Goal: ${request.goal ?? 'not specified'}   Activity: ${request.activityLevel ?? 'not specified'}
Daily target: ${request.dailyCalorieTarget ?? 'not specified'} kcal${
    perMealCalories !== null ? ` (~${perMealCalories} kcal/meal)` : ''
  }, ${request.dailyProteinTargetG ?? 'not specified'}g protein
Meals per day: ${request.mealsPerDay}
Conditions to be mindful of (do not diagnose or treat): ${formatConditions(request.conditions)}
Recent pattern: ${formatRecentActivity(request)}
${request.adjustmentReason !== null ? ADJUSTMENT_CLAUSES[request.adjustmentReason] : ''}

RULES
- Each day must total roughly the calorie target (within ~10%).
- Do not repeat the same dish more than twice in the whole plan.
- Output one line per meal, in this exact format:
  Day N | Meal | <id> | <dish name> | <portion in katori/cup/piece>
- After the plan, add 2 short encouraging lines. No medical advice.`;
}

function buildWorkoutPrompt(request: PlanRequest): string {
  return `Build a ${request.periodDays}-day workout plan for this person, at ${request.workoutDaysPerWeek} sessions per week, ${request.workoutSessionMinutes} minutes per session.

USE ONLY these exercises. Refer to each by its exact id and name.
Do not invent exercises or suggest anything not on this list.
${formatExerciseCandidates(request.candidateExercises)}

PERSON
Goal: ${request.goal ?? 'not specified'}   Activity: ${request.activityLevel ?? 'not specified'}
Conditions to be mindful of (do not diagnose or treat): ${formatConditions(request.conditions)}
Recent pattern: ${formatRecentActivity(request)}
${request.adjustmentReason !== null ? ADJUSTMENT_CLAUSES[request.adjustmentReason] : ''}

RULES
- Spread sessions evenly across the period; leave rest days between sessions where sensible.
- Do not repeat the same exercise more than 3 times in the whole plan.
- Output one line per exercise, in this exact format:
  Day N | <id> | <exercise name> | <duration in minutes>
- After the plan, add 2 short encouraging lines. No medical advice.`;
}

/** The single entry point gemini-provider.ts (or any future AiProvider
 * implementation) calls — branches on plan_type, never needs its own copy
 * of either template. */
export function buildPlanUserPrompt(request: PlanRequest): string {
  return request.planType === 'diet' ? buildDietPrompt(request) : buildWorkoutPrompt(request);
}

/** Diet plans get more headroom than workout plans (7 days of meals needs
 * more output than one line per exercise session) — both are far above the
 * old 512, which the source proposal measured as "one terse line per day"
 * for either shape. */
export function maxOutputTokensFor(planType: PlanRequest['planType']): number {
  return planType === 'diet' ? 2000 : 1200;
}
