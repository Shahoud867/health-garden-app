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
  goal VARCHAR(50),
  -- Comma-separated tag matching (e.g. 'diabetes,knee_pain'), same simple
  -- pattern as recipes.condition_tags / exercises.exclude_conditions (§5.1).
  conditions VARCHAR(255),
  daily_calorie_target INT,
  daily_protein_target_g DECIMAL(5, 2),
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
