-- The `users` table — profile and goals captured at onboarding
-- (Founder_B_Backend_Roadmap.md §4.6). `is_premium` is documented here but
-- made trigger-derived (never independently writable) in migration 0006,
-- once `subscriptions` exists.

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ON DELETE CASCADE: deleting the auth.users row (account deletion) removes
  -- the profile and, transitively via every other table's own ON DELETE
  -- CASCADE on user_id, every row this person ever created. This is what
  -- makes §7.9's "right to erasure... implemented, not merely assumed" a
  -- single admin action rather than a manually-maintained deletion checklist.
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  age INT,
  sex VARCHAR(20),
  height_cm DECIMAL(5, 2),
  weight_kg DECIMAL(5, 2),
  activity_level VARCHAR(50),
  -- A closed set from launch: the garden's primary-goal plant (garden_state
  -- goal_type 'protein') branches its success rule on this value (migration
  -- 0005), so an unrecognised string here would silently fail that plant
  -- every day rather than error. NULL still passes this CHECK (Postgres
  -- evaluates `NULL IN (...)` to NULL, not FALSE) — goal stays unset until
  -- onboarding completes, same as the nullable columns below.
  goal VARCHAR(50)
    CHECK (goal IN ('lose_weight', 'maintain', 'gain_weight', 'build_muscle', 'general_health')),
  -- Comma-separated tag matching (e.g. 'diabetes,knee_pain'), same simple
  -- pattern as recipes.condition_tags / exercises.exclude_conditions (§5.1).
  conditions VARCHAR(255),
  daily_calorie_target INT,
  daily_protein_target_g DECIMAL(5, 2),
  -- Personalises the hydration plant (garden_state goal_type 'hydration');
  -- garden logic falls back to 8 glasses/day when this is unset (matches the
  -- old hardcoded default until onboarding computes a real one).
  daily_water_target_glasses INT CHECK (daily_water_target_glasses BETWEEN 1 AND 30),
  -- AI meal-plan personalization inputs (garden mechanic v2 / AI plan
  -- retrieval-grounding round). diet_type is deliberately NOT included yet —
  -- recipes has no vegetarian/diet classification to enforce it against;
  -- adding the column without enforcement would be a hint dressed up as a
  -- guarantee, which the content-safety design this schema follows rejects.
  food_allergies VARCHAR(255),      -- comma-separated, e.g. 'peanut,shellfish'
  disliked_food_tags VARCHAR(255),  -- comma-separated, matched against dish/recipe names
  daily_food_budget_pkr INT CHECK (daily_food_budget_pkr > 0),
  meals_per_day INT NOT NULL DEFAULT 3 CHECK (meals_per_day BETWEEN 2 AND 6),
  workout_days_per_week INT NOT NULL DEFAULT 3 CHECK (workout_days_per_week BETWEEN 1 AND 7),
  workout_session_minutes INT NOT NULL DEFAULT 30 CHECK (workout_session_minutes BETWEEN 10 AND 180),
  equipment_access VARCHAR(20) NOT NULL DEFAULT 'none'
    CHECK (equipment_access IN ('none', 'home_basic', 'gym')),
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  premium_started_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- SELECT/UPDATE only — no INSERT/DELETE policy for the authenticated role.
-- A row is created exactly once, atomically, by the handle_new_auth_user
-- trigger (migration 0005, SECURITY DEFINER) when a person signs up via
-- Supabase Auth. Letting a client INSERT its own `users` row directly would
-- open a window for a signed-up-but-profile-less auth user, or for a client
-- to attempt to link itself to an auth_id it does not own.
CREATE POLICY "Users read own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);
