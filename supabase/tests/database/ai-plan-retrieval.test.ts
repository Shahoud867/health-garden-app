/**
 * Safety-critical retrieval tests for migration 0013 (docs/adr/0027), named
 * explicitly by the source proposal as required: "tests asserting a
 * diabetic user never receives a sugar-flagged recipe and a knee-pain user
 * never receives an excluded exercise." Missed in the original round --
 * added here once noticed, against real Postgres and real (or
 * test-inserted, where the live content can't be relied on) data, not
 * mocked handler-level fakes.
 *
 * Recipes are still an actively-changing, externally-scraped dataset, so
 * the sugar_flag test inserts its own controlled fixture rows rather than
 * assuming today's seed data shape. Exercises are a small, founder-curated,
 * static 8-row set (unrelated to that in-progress scrape), so the
 * knee-pain test queries the real seed data directly -- more representative
 * of the actual guarantee the function provides.
 */
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestUser, deleteTestUser, serviceRoleClient, type TestUser } from './helpers';

describe('candidate_recipes_for_user (ADR-0024/0027)', () => {
  let user: TestUser | undefined;
  const insertedRecipeIds: number[] = [];

  afterEach(async () => {
    if (user) await deleteTestUser(user);
    user = undefined;
    if (insertedRecipeIds.length > 0) {
      await serviceRoleClient.from('recipes').delete().in('id', insertedRecipeIds);
      insertedRecipeIds.length = 0;
    }
  });

  it('rejects a direct call from an authenticated user', async () => {
    user = await createTestUser();
    const { error } = await user.client.rpc('candidate_recipes_for_user', {
      p_user_id: user.userId,
    });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/permission denied/i);
  });

  it('never returns a sugar-flagged recipe for a diabetic user, and does return a safe one', async () => {
    user = await createTestUser();
    await serviceRoleClient.from('users').update({ conditions: 'diabetes' }).eq('id', user.userId);

    const marker = randomUUID().slice(0, 8);
    const { data: sugary } = await serviceRoleClient
      .from('recipes')
      .insert({
        recipe_name: `TEST_SUGARY_${marker}`,
        ingredients: 'sugar, water',
        steps: 'mix',
        calories_per_serving: 300,
        sugar_flag: 'Y',
      })
      .select('id')
      .single();
    const { data: safe } = await serviceRoleClient
      .from('recipes')
      .insert({
        recipe_name: `TEST_SAFE_${marker}`,
        ingredients: 'lentils, water',
        steps: 'boil',
        calories_per_serving: 300,
        sugar_flag: 'N',
      })
      .select('id')
      .single();
    insertedRecipeIds.push(sugary!.id, safe!.id);

    // A large limit, not the function's own default of 40 -- this needs the
    // *entire* filtered set to reliably assert a specific id's absence,
    // not just whatever a capped/randomised sample happened to include.
    const { data: candidates, error } = await serviceRoleClient.rpc('candidate_recipes_for_user', {
      p_user_id: user.userId,
      p_limit: 5000,
    });
    expect(error).toBeNull();

    const ids = (candidates ?? []).map((c: { id: number }) => c.id);
    expect(ids).not.toContain(sugary!.id);
    expect(ids).toContain(safe!.id);
  });

  it('is NULL-safe on budget: a recipe with no cost recorded is never excluded by a budget filter', async () => {
    user = await createTestUser();
    await serviceRoleClient
      .from('users')
      .update({ daily_food_budget_pkr: 200, meals_per_day: 3 })
      .eq('id', user.userId);

    const marker = randomUUID().slice(0, 8);
    const { data: noCostRecipe } = await serviceRoleClient
      .from('recipes')
      .insert({
        recipe_name: `TEST_NOCOST_${marker}`,
        ingredients: 'rice, water',
        steps: 'boil',
        calories_per_serving: 300,
        sugar_flag: 'N',
        cost_pkr_per_serving: null,
      })
      .select('id')
      .single();
    insertedRecipeIds.push(noCostRecipe!.id);

    const { data: candidates, error } = await serviceRoleClient.rpc('candidate_recipes_for_user', {
      p_user_id: user.userId,
      p_limit: 5000,
    });
    expect(error).toBeNull();
    const ids = (candidates ?? []).map((c: { id: number }) => c.id);
    expect(ids).toContain(noCostRecipe!.id);
  });

  it('excludes a recipe matching a food allergy by ingredient text', async () => {
    user = await createTestUser();
    await serviceRoleClient.from('users').update({ food_allergies: 'peanut' }).eq('id', user.userId);

    const marker = randomUUID().slice(0, 8);
    const { data: allergenic } = await serviceRoleClient
      .from('recipes')
      .insert({
        recipe_name: `TEST_PEANUT_${marker}`,
        ingredients: 'peanut butter, bread',
        steps: 'spread',
        calories_per_serving: 300,
        sugar_flag: 'N',
      })
      .select('id')
      .single();
    insertedRecipeIds.push(allergenic!.id);

    const { data: candidates, error } = await serviceRoleClient.rpc('candidate_recipes_for_user', {
      p_user_id: user.userId,
      p_limit: 5000,
    });
    expect(error).toBeNull();
    const ids = (candidates ?? []).map((c: { id: number }) => c.id);
    expect(ids).not.toContain(allergenic!.id);
  });
});

describe('candidate_exercises_for_user (ADR-0024/0027)', () => {
  let user: TestUser | undefined;

  afterEach(async () => {
    if (user) await deleteTestUser(user);
    user = undefined;
  });

  it('rejects a direct call from an authenticated user', async () => {
    user = await createTestUser();
    const { error } = await user.client.rpc('candidate_exercises_for_user', {
      p_user_id: user.userId,
    });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/permission denied/i);
  });

  it('never returns a knee-pain-excluded exercise for a knee-pain user, and does return it otherwise', async () => {
    const { data: kneeExcluded } = await serviceRoleClient
      .from('exercises')
      .select('id')
      .ilike('exclude_conditions', '%knee_pain%')
      .limit(1)
      .single();
    // The curated seed set (§5.1) is expected to include at least one --
    // fail loudly rather than silently pass a test that checked nothing.
    expect(kneeExcluded).not.toBeNull();

    user = await createTestUser();
    await serviceRoleClient.from('users').update({ conditions: 'knee_pain' }).eq('id', user.userId);

    const { data: withCondition, error: e1 } = await serviceRoleClient.rpc(
      'candidate_exercises_for_user',
      { p_user_id: user.userId, p_limit: 100 },
    );
    expect(e1).toBeNull();
    expect((withCondition ?? []).map((r: { id: number }) => r.id)).not.toContain(kneeExcluded!.id);

    await serviceRoleClient.from('users').update({ conditions: null }).eq('id', user.userId);
    const { data: withoutCondition, error: e2 } = await serviceRoleClient.rpc(
      'candidate_exercises_for_user',
      { p_user_id: user.userId, p_limit: 100 },
    );
    expect(e2).toBeNull();
    expect((withoutCondition ?? []).map((r: { id: number }) => r.id)).toContain(kneeExcluded!.id);
  });
});

describe('recent_activity_summary (ADR-0024/0027)', () => {
  let user: TestUser | undefined;

  afterEach(async () => {
    if (user) await deleteTestUser(user);
    user = undefined;
  });

  it('rejects a direct call from an authenticated user', async () => {
    user = await createTestUser();
    const { error } = await user.client.rpc('recent_activity_summary', { p_user_id: user.userId });
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/permission denied/i);
  });

  it('summarises logged calories, workout days, and latest weight over the last 14 days', async () => {
    user = await createTestUser();
    const today = new Date().toISOString().slice(0, 10);

    await serviceRoleClient.from('food_logs').insert([
      {
        user_id: user.userId,
        client_uuid: randomUUID(),
        log_date: today,
        calories_snapshot: 1000,
        source: 'manual',
      },
      {
        user_id: user.userId,
        client_uuid: randomUUID(),
        log_date: today,
        calories_snapshot: 500,
        source: 'manual',
      },
    ]);
    await serviceRoleClient.from('workout_logs').insert({
      user_id: user.userId,
      client_uuid: randomUUID(),
      log_date: today,
      duration_min: 30,
      calories_burned: 200,
    });
    await serviceRoleClient.from('weight_logs').insert({
      user_id: user.userId,
      log_date: today,
      weight_kg: 70.5,
    });

    const { data: raw, error } = await serviceRoleClient
      .rpc('recent_activity_summary', { p_user_id: user.userId })
      .single();
    expect(error).toBeNull();
    const data = raw as {
      avg_daily_calories: number | null;
      workout_days_last_14: number;
      latest_weight_kg: string | null;
    };
    expect(data.avg_daily_calories).toBe(1500); // summed same-day, not averaged per-row
    expect(data.workout_days_last_14).toBe(1);
    expect(Number(data.latest_weight_kg)).toBeCloseTo(70.5, 1);
  });

  it('returns nulls, not an error, for a user with no logged history', async () => {
    user = await createTestUser();
    const { data: raw, error } = await serviceRoleClient
      .rpc('recent_activity_summary', { p_user_id: user.userId })
      .single();
    expect(error).toBeNull();
    const data = raw as {
      avg_daily_calories: number | null;
      workout_days_last_14: number;
      latest_weight_kg: string | null;
    };
    expect(data.avg_daily_calories).toBeNull();
    expect(data.workout_days_last_14).toBe(0);
    expect(data.latest_weight_kg).toBeNull();
  });
});
