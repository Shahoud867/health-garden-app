-- AI plan retrieval-grounding (docs/adr/0027-ai-plan-retrieval-grounding.md).
--
-- Before this, ai-plan-generate sent Gemini five scalar fields and asked it
-- to invent "Pakistani foods" from its own training data -- plans could
-- reference dishes that don't exist in this database, which a user then
-- cannot log. Filtering candidates in plain SQL instead -- free,
-- deterministic, auditable, and a database-level guarantee rather than a
-- prompt hint for condition safety -- means the model can only ever pick
-- from real rows, so every suggested meal/exercise is loggable. At ~600
-- recipes and 8 exercises, tag matching plus numeric filters is both
-- sufficient and fast; no embeddings or vector store needed.
--
-- Two things verified against the actual content (not assumed):
--   - recipes.cost_pkr_per_serving is 0% populated in the current dataset
--     (data/recipes_clean.csv) -- the budget filter below is written
--     NULL-safe so an unset cost never silently zeroes out every candidate.
--   - recipes.condition_tags is 0% populated -- the condition-safety filter
--     is written to activate correctly (never permit-by-default on a
--     populated "unsafe" tag) the moment content work adds tags, but is a
--     structural no-op today. sugar_flag, by contrast, *is* populated, so
--     the diabetes/sugar clause is enforced now.
--
-- diet_type is deliberately not filtered anywhere in this file: recipes has
-- no vegetarian/diet classification to enforce it against yet (open
-- question O-1 in the source proposal), so v1 personalizes on allergies,
-- dislikes, and budget only, per the recorded decision.

CREATE OR REPLACE FUNCTION candidate_recipes_for_user(p_user_id UUID, p_limit INT DEFAULT 40)
RETURNS TABLE (
  id BIGINT,
  recipe_name VARCHAR,
  urdu_name VARCHAR,
  calories_per_serving INT,
  protein_g DECIMAL,
  cost_pkr_per_serving INT
) AS $$
DECLARE
  u RECORD;
BEGIN
  SELECT * INTO u FROM users WHERE id = p_user_id;

  RETURN QUERY
  SELECT r.id, r.recipe_name, r.urdu_name, r.calories_per_serving, r.protein_g, r.cost_pkr_per_serving
  FROM recipes r
  WHERE
    -- Condition safety, enforced not hinted -- see header note on current
    -- data coverage. The convention matches recipes.condition_tags' own
    -- documented format (migration 0002): an 'unsafe_<condition>' entry
    -- excludes; absence of tags never excludes.
    (u.conditions IS NULL OR NOT EXISTS (
       SELECT 1 FROM unnest(string_to_array(u.conditions, ',')) c
       WHERE r.condition_tags IS NOT NULL
         AND r.condition_tags LIKE '%unsafe_' || trim(c) || '%'
    ))
    -- Diabetics: no sugar-flagged recipes. Enforced today (sugar_flag is
    -- populated for all 619 current rows).
    AND (u.conditions IS NULL OR u.conditions NOT LIKE '%diabetes%' OR r.sugar_flag = 'N')
    -- Budget, NULL-safe on both sides: an unset user budget never filters,
    -- and an unset recipe cost is never treated as "exceeds budget".
    AND (
      u.daily_food_budget_pkr IS NULL
      OR r.cost_pkr_per_serving IS NULL
      OR r.cost_pkr_per_serving <= u.daily_food_budget_pkr / GREATEST(u.meals_per_day, 1)
    )
    -- Allergies and dislikes (ingredient/name text match).
    AND (u.food_allergies IS NULL OR NOT EXISTS (
       SELECT 1 FROM unnest(string_to_array(u.food_allergies, ',')) a
       WHERE r.ingredients ILIKE '%' || trim(a) || '%'
    ))
    AND (u.disliked_food_tags IS NULL OR NOT EXISTS (
       SELECT 1 FROM unnest(string_to_array(u.disliked_food_tags, ',')) d
       WHERE r.recipe_name ILIKE '%' || trim(d) || '%'
    ))
  -- Bias toward the user's per-meal calorie target, then vary the
  -- selection -- the random() tiebreak is deliberate: it makes regeneration
  -- produce a genuinely different candidate set without a second model call.
  ORDER BY
    abs(r.calories_per_serving - COALESCE(u.daily_calorie_target, 2000) / GREATEST(u.meals_per_day, 1)),
    random()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION candidate_recipes_for_user(UUID, INT) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION candidate_exercises_for_user(p_user_id UUID, p_limit INT DEFAULT 25)
RETURNS TABLE (
  id BIGINT,
  exercise_name VARCHAR,
  urdu_name VARCHAR,
  category VARCHAR,
  met_value DECIMAL,
  intensity_level VARCHAR
) AS $$
DECLARE
  u RECORD;
BEGIN
  SELECT * INTO u FROM users WHERE id = p_user_id;

  RETURN QUERY
  SELECT e.id, e.exercise_name, e.urdu_name, e.category, e.met_value, e.intensity_level
  FROM exercises e
  WHERE
    -- exclude_conditions is the knee-safe/joint-safe filtering already
    -- curated and populated (seed.sql) -- this is what makes condition
    -- safety real for exercise selection, unlike the recipe side above.
    (u.conditions IS NULL OR NOT EXISTS (
       SELECT 1 FROM unnest(string_to_array(u.conditions, ',')) c
       WHERE e.exclude_conditions IS NOT NULL
         AND e.exclude_conditions ILIKE '%' || trim(c) || '%'
    ))
    -- Equipment access. Every exercise in the current 8-row seed set is
    -- bodyweight (categories Legs/Upper Body/Core/Cardio -- verified, not
    -- the lowercase 'bodyweight'/'cardio'/'stretching' values the source
    -- proposal assumed), so this is a structural no-op today regardless of
    -- a user's equipment_access. The excluded-category list is a
    -- placeholder for when gym-only content is added; revisit it then
    -- rather than trusting it's complete now.
    AND (u.equipment_access <> 'none' OR e.category NOT IN ('Gym', 'Equipment'))
  ORDER BY random()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION candidate_exercises_for_user(UUID, INT) FROM PUBLIC, anon, authenticated;

-- Turns a static plan template into one that responds to what the user
-- actually logged over the last two weeks -- the difference between a plan
-- that reads the same in week 1 and week 20 and one that adapts. Uses the
-- existing idx_food_logs_user_date / idx_workout_logs_user_date indexes.
CREATE OR REPLACE FUNCTION recent_activity_summary(p_user_id UUID)
RETURNS TABLE (avg_daily_calories INT, workout_days_last_14 INT, latest_weight_kg DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (
      SELECT round(avg(daily))::INT FROM (
        SELECT sum(calories_snapshot) AS daily FROM food_logs
        WHERE user_id = p_user_id AND log_date > CURRENT_DATE - 14
        GROUP BY log_date
      ) d
    ) AS avg_daily_calories,
    (
      SELECT count(DISTINCT log_date)::INT FROM workout_logs
      WHERE user_id = p_user_id AND log_date > CURRENT_DATE - 14
    ) AS workout_days_last_14,
    (
      SELECT weight_kg FROM weight_logs
      WHERE user_id = p_user_id ORDER BY log_date DESC LIMIT 1
    ) AS latest_weight_kg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Sends raw weight/calorie history to a third-party model (see
-- ai-plan-generate's prompt builder) -- a real change from the chat path's
-- documented "no raw health metrics leave this system" stance
-- (_shared/ai/provider.ts), made consciously here: a weight-goal plan cannot
-- be built without weight. Locked down the same as the other two functions
-- regardless -- it takes an arbitrary user_id and would otherwise leak
-- another user's logged behaviour to a direct RPC call.
REVOKE EXECUTE ON FUNCTION recent_activity_summary(UUID) FROM PUBLIC, anon, authenticated;
