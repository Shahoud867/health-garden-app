import { assertEquals, assertStringIncludes } from '@std/assert';
import { buildPlanUserPrompt, maxOutputTokensFor } from './plan-prompt.ts';
import type { PlanRequest } from './provider.ts';

function dietRequest(overrides: Partial<PlanRequest> = {}): PlanRequest {
  return {
    planType: 'diet',
    periodDays: 7,
    goal: 'lose_weight',
    conditions: [],
    activityLevel: 'moderate',
    dailyCalorieTarget: 1800,
    dailyProteinTargetG: 90,
    mealsPerDay: 3,
    workoutDaysPerWeek: 3,
    workoutSessionMinutes: 30,
    recentActivity: { avgDailyCalories: null, workoutDaysLast14: null, latestWeightKg: null },
    candidateRecipes: [
      {
        id: 42,
        name: 'Daal Chawal',
        urduName: 'دال چاول',
        calories: 400,
        proteinG: 15,
        costPkr: 80,
      },
    ],
    candidateExercises: [],
    adjustmentReason: null,
    ...overrides,
  };
}

Deno.test('buildPlanUserPrompt (diet)', async (t) => {
  await t.step('lists candidate recipes by exact id, and forbids inventing dishes', () => {
    const prompt = buildPlanUserPrompt(dietRequest());
    assertStringIncludes(prompt, 'id=42');
    assertStringIncludes(prompt, 'Daal Chawal');
    assertStringIncludes(prompt, 'Do not invent dishes');
  });

  await t.step('never mentions exercises for a diet plan', () => {
    const prompt = buildPlanUserPrompt(dietRequest());
    assertEquals(prompt.toLowerCase().includes('workout plan'), false);
  });

  await t.step('reports no logged history for a brand-new user', () => {
    const prompt = buildPlanUserPrompt(dietRequest());
    assertStringIncludes(prompt, 'no logged history yet');
  });

  await t.step('renders recent activity when present', () => {
    const prompt = buildPlanUserPrompt(
      dietRequest({
        recentActivity: { avgDailyCalories: 1850, workoutDaysLast14: 5, latestWeightKg: 74 },
      }),
    );
    assertStringIncludes(prompt, '1850 kcal/day');
    assertStringIncludes(prompt, 'moved on 5 of the last 14 days');
    assertStringIncludes(prompt, '74 kg');
  });

  await t.step('appends the adjustment clause only when regenerating', () => {
    const fresh = buildPlanUserPrompt(dietRequest({ adjustmentReason: null }));
    assertEquals(fresh.includes('too repetitive'), false);

    const regenerated = buildPlanUserPrompt(dietRequest({ adjustmentReason: 'too_repetitive' }));
    assertStringIncludes(regenerated, 'too repetitive');
  });

  await t.step('requires the rigid one-line-per-meal output format', () => {
    const prompt = buildPlanUserPrompt(dietRequest());
    assertStringIncludes(prompt, 'Day N | Meal | <id> | <dish name> | <portion');
  });
});

Deno.test('buildPlanUserPrompt (workout)', () => {
  const prompt = buildPlanUserPrompt(
    dietRequest({
      planType: 'workout',
      periodDays: 30,
      candidateRecipes: [],
      candidateExercises: [
        {
          id: 7,
          name: 'Squats',
          urduName: null,
          category: 'Legs',
          metValue: 3.8,
          intensityLevel: 'Moderate',
        },
      ],
    }),
  );
  assertStringIncludes(prompt, 'id=7');
  assertStringIncludes(prompt, 'Squats');
  assertStringIncludes(prompt, '3 sessions per week');
  assertStringIncludes(prompt, 'Do not invent exercises');
  assertEquals(prompt.toLowerCase().includes('meal plan'), false);
});

Deno.test('maxOutputTokensFor', () => {
  assertEquals(maxOutputTokensFor('diet'), 2000);
  assertEquals(maxOutputTokensFor('workout'), 1200);
});
