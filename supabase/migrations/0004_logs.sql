-- Logging tables — user-generated, highest write volume in the system
-- (Blueprint §5.2). CHECK constraints mirror the zod enums already defined in
-- supabase/functions/_shared/validation/schema.ts — defense in depth beneath
-- the Edge Function/PostgREST validation layer (§6.3), not a substitute for it.
--
-- These are the one class of table where a client directly forging a value
-- carries no privilege-escalation risk (a user can already misreport what
-- they ate by choice), unlike garden_state or users.is_premium — so ordinary
-- own-row CRUD via RLS is the correct, and sufficient, access model.

CREATE TABLE food_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  food_id BIGINT REFERENCES foods (id),
  client_uuid UUID NOT NULL UNIQUE, -- idempotent sync (ADR-004)
  log_date DATE NOT NULL,
  meal_slot VARCHAR(20) CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  quantity DECIMAL(6, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  calories_snapshot INT NOT NULL, -- computed at log time; never re-derived later
  protein_g_snapshot DECIMAL(5, 2),
  sugar_flag_snapshot CHAR(1) CHECK (sugar_flag_snapshot IN ('Y', 'N')),
  source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'wearable', 'import')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_food_logs_user_date ON food_logs (user_id, log_date);

CREATE TABLE workout_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  exercise_id BIGINT REFERENCES exercises (id),
  client_uuid UUID NOT NULL UNIQUE,
  log_date DATE NOT NULL,
  duration_min DECIMAL(5, 2) NOT NULL CHECK (duration_min > 0),
  calories_burned DECIMAL(6, 2) NOT NULL, -- MET x weight x (duration/60), computed at log time
  source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'wearable', 'import')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_workout_logs_user_date ON workout_logs (user_id, log_date);

CREATE TABLE water_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  client_uuid UUID NOT NULL UNIQUE,
  log_date DATE NOT NULL,
  glasses_logged INT NOT NULL DEFAULT 1 CHECK (glasses_logged > 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_water_logs_user_date ON water_logs (user_id, log_date);

-- Reinstated per ADR-009 — committed MVP scope, not optional.
CREATE TABLE weight_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  weight_kg DECIMAL(5, 2) NOT NULL CHECK (weight_kg > 0),
  source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'wearable', 'import')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own food logs" ON food_logs
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users manage own workout logs" ON workout_logs
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users manage own water logs" ON water_logs
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users manage own weight logs" ON weight_logs
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
