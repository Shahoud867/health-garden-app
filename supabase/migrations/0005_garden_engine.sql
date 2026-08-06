-- The garden engine (Blueprint §5.3/§5.4, ADR-002) — the single most
-- safety-critical piece of logic in the system.
--
-- RLS deviation from the source roadmap (approved before writing this file):
-- Founder_B_Backend_Roadmap.md §4.8 grants `FOR ALL` on garden_state and
-- permanent_garden, which would let a client PATCH current_stage directly or
-- INSERT a fabricated permanent_garden row — defeating the derived-aggregate
-- guarantee (ADR-002) and the "insert-only, enforced at the database level"
-- guarantee (§5.4) respectively. Both tables are SELECT-only for the
-- authenticated role below; every write happens through a SECURITY DEFINER
-- function, never through a client's own INSERT/UPDATE/DELETE. See
-- docs/adr/0024-garden-write-protection.md.
--
-- ============================================================
-- v2 rewrite (docs/adr/0026-garden-mechanic-v2.md) — growth changed from
-- weekly (stage derived from days-succeeded-in-a-Monday-reset-week) to
-- cycle-based (stage derived from qualifying days since the plant's own
-- cycle_started_on, uncoupled from the calendar week). A plant now only ever
-- reaches permanent_garden by fully growing — never at a partial "stage 0
-- failure" the way the old weekly sweep recorded one. This file is edited in
-- place rather than layered with ALTER statements: the project has no
-- deployed production database yet (Blueprint status, pre-launch), so there
-- is no live schema to migrate against — the same reasoning already applied
-- to the push_tokens schema fix in migration 0009.
-- ============================================================

CREATE TABLE garden_state (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL
    CHECK (goal_type IN ('hydration', 'sugar_free', 'protein', 'movement', 'consistency')),
  plant_type VARCHAR(50) NOT NULL
    CHECK (plant_type IN ('mint', 'cactus', 'wheat_stalk', 'sapling', 'succulent')),
  -- The date this plant's current growth cycle began. Stage is always
  -- recomputed as "qualifying days since this date" (daily_goal_success,
  -- below) — never incremented directly — which is what keeps the
  -- recompute-from-source guarantee (ADR-002) intact under the new model.
  cycle_started_on DATE NOT NULL DEFAULT CURRENT_DATE,
  -- 0..2 in practice: reaching 3 qualifying days is a graduation event
  -- (sync_garden_state inserts into permanent_garden and starts a fresh
  -- cycle in the same call), so a stored value of 3 is never observed. The
  -- CHECK keeps 0..3 rather than 0..2 as a deliberate safety margin, not a
  -- claim that 3 is ever persisted.
  current_stage INT NOT NULL DEFAULT 0 CHECK (current_stage BETWEEN 0 AND 3),
  is_dormant_today BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  -- One row per goal per user — the 5-plant cap is a non-negotiable product
  -- rule (§11.11), and this is what makes seeding idempotent (ON CONFLICT).
  UNIQUE (user_id, goal_type)
);
CREATE INDEX idx_garden_state_user ON garden_state (user_id);

CREATE TABLE permanent_garden (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  plant_type VARCHAR(50) NOT NULL
    CHECK (plant_type IN ('mint', 'cactus', 'wheat_stalk', 'sapling', 'succulent')),
  -- Position on the 25-slot (5x5) board. Derivable from insert order for the
  -- n-th plant a user ever earns (board_number = n/25, slot_index = n%25),
  -- but stored explicitly rather than recomputed — safer, and survives any
  -- future "user rearranges their garden" feature. Filled back-to-front,
  -- contiguously, no gaps: sync_garden_state assigns the next index by
  -- counting this user's existing rows at insert time.
  board_number INT NOT NULL DEFAULT 0,
  slot_index INT NOT NULL CHECK (slot_index BETWEEN 0 AND 24),
  -- The calendar date the 3rd qualifying day fell on, i.e. the day the plant
  -- actually finished growing — not necessarily "today" if sync_garden_state
  -- is catching up a backlog in one call.
  completed_on DATE NOT NULL,
  planted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, board_number, slot_index)
);
CREATE INDEX idx_permanent_garden_user ON permanent_garden (user_id);

ALTER TABLE garden_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE permanent_garden ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own garden state" ON garden_state
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users read own permanent garden" ON permanent_garden
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================================
-- Derivation engine (§5.3) — recomputes from source logs, never increments.
-- Idempotent by construction: re-running with the same log data always
-- produces the same result, which is what makes it safe under offline sync,
-- retries, and out-of-order delivery (ADR-002).
--
-- One set-based table function replaces the old per-goal-type pair
-- (compute_days_succeeded / did_goal_succeed_on_date): consistency now
-- depends on the other four goals for the *same day*, so evaluating goals
-- one at a time no longer works, and a per-date PL/pgSQL loop calling
-- separate subqueries per goal would not perform acceptably inside a
-- trigger that fires on every log write. This returns one row per calendar
-- day in range with all five goals' pass/fail already computed, in a
-- handful of set-based joins.
-- ============================================================

CREATE OR REPLACE FUNCTION daily_goal_success(
  p_user_id UUID, p_from_date DATE, p_to_date DATE
) RETURNS TABLE (
  log_date DATE,
  hydration_ok BOOLEAN,
  sugar_free_ok BOOLEAN,
  primary_goal_ok BOOLEAN,
  movement_ok BOOLEAN,
  consistency_ok BOOLEAN
) AS $$
DECLARE
  u RECORD;
BEGIN
  SELECT * INTO u FROM users WHERE id = p_user_id;

  RETURN QUERY
  WITH days AS (
    SELECT gs::DATE AS d FROM generate_series(p_from_date, p_to_date, INTERVAL '1 day') gs
  ),
  water AS (
    SELECT wl.log_date, SUM(wl.glasses_logged) AS glasses
    FROM water_logs wl
    WHERE wl.user_id = p_user_id AND wl.log_date BETWEEN p_from_date AND p_to_date
    GROUP BY wl.log_date
  ),
  food AS (
    SELECT
      fl.log_date,
      SUM(fl.calories_snapshot) AS calories,
      SUM(fl.protein_g_snapshot) AS protein,
      BOOL_OR(fl.sugar_flag_snapshot = 'Y') AS has_sugar,
      COUNT(*) AS n
    FROM food_logs fl
    WHERE fl.user_id = p_user_id AND fl.log_date BETWEEN p_from_date AND p_to_date
    GROUP BY fl.log_date
  ),
  workout AS (
    SELECT DISTINCT wo.log_date FROM workout_logs wo
    WHERE wo.user_id = p_user_id AND wo.log_date BETWEEN p_from_date AND p_to_date
  ),
  per_day AS (
    SELECT
      days.d AS log_date,
      COALESCE(water.glasses, 0) >= COALESCE(u.daily_water_target_glasses, 8) AS hydration_ok,
      COALESCE(food.n, 0) > 0 AND NOT COALESCE(food.has_sugar, FALSE) AS sugar_free_ok,
      -- The primary-goal plant (garden_state goal_type 'protein', plant_type
      -- 'wheat_stalk') branches on the user's own goal rather than always
      -- meaning "hit your protein target" (garden mechanic v2, §5.4). A goal
      -- with no matching target set never succeeds -- this mirrors the old
      -- code's behaviour for an unset daily_protein_target_g exactly (NULL
      -- comparisons are never true), rather than inventing a new "succeeds
      -- by default with no target" rule for the other three branches.
      COALESCE(food.n, 0) > 0 AND (
        CASE u.goal
          WHEN 'lose_weight' THEN
            u.daily_calorie_target IS NOT NULL AND food.calories <= u.daily_calorie_target
          WHEN 'gain_weight' THEN
            u.daily_calorie_target IS NOT NULL AND food.calories >= u.daily_calorie_target
          WHEN 'build_muscle' THEN
            u.daily_protein_target_g IS NOT NULL AND food.protein >= u.daily_protein_target_g
          ELSE
            -- 'maintain', 'general_health', or not yet set at onboarding:
            -- stay within a +-10% band of the calorie target.
            u.daily_calorie_target IS NOT NULL
            AND food.calories BETWEEN u.daily_calorie_target * 0.9 AND u.daily_calorie_target * 1.1
        END
      ) AS primary_goal_ok,
      EXISTS (SELECT 1 FROM workout WHERE workout.log_date = days.d) AS movement_ok
    FROM days
    LEFT JOIN water ON water.log_date = days.d
    LEFT JOIN food ON food.log_date = days.d
  )
  SELECT
    per_day.log_date,
    per_day.hydration_ok,
    per_day.sugar_free_ok,
    per_day.primary_goal_ok,
    per_day.movement_ok,
    -- Consistency redefined (garden mechanic v2): the other four goals all
    -- met on the same day, replacing the old "logged anything at all" rule.
    per_day.hydration_ok AND per_day.sugar_free_ok AND per_day.primary_goal_ok AND per_day.movement_ok
      AS consistency_ok
  FROM per_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- SECURITY DEFINER, not the SECURITY INVOKER default: garden_state has no
-- client-facing write policy (above), so this must run with the function
-- owner's privileges to write at all. Only this function may ever mutate
-- garden_state or permanent_garden — that invariant is what makes the RLS
-- deviation correct.
CREATE OR REPLACE FUNCTION sync_garden_state(p_user_id UUID) RETURNS VOID AS $$
DECLARE
  goal RECORD;
  v_qualifying INT;
  v_graduation_date DATE;
  v_next_index INT;
  v_today_ok BOOLEAN;
BEGIN
  -- Serializes concurrent sync_garden_state calls for the same user (e.g. an
  -- offline client flushing several queued log writes at once, each firing
  -- its own trigger): without this, two calls could both read the same
  -- permanent_garden COUNT(*) before either commits and assign the same
  -- board slot twice. Mirrors the FOR UPDATE row-locking the old weekly
  -- archive function used for the same class of race.
  PERFORM 1 FROM users WHERE id = p_user_id FOR UPDATE;

  FOR goal IN
    SELECT id, goal_type, plant_type, cycle_started_on
    FROM garden_state WHERE user_id = p_user_id
    ORDER BY goal_type -- deterministic slot assignment when >1 plant graduates in the same call
  LOOP
    -- Catch up as many completed cycles as the log history now supports. A
    -- single log write ordinarily advances at most one day's worth of
    -- qualification, but a deleted log (retroactively making an old day
    -- newly qualify) or a bulk/import backlog can jump further — looping
    -- here keeps one call fully caught up rather than resolving over several
    -- future trigger firings. Terminates because each iteration either exits
    -- or strictly advances cycle_started_on past CURRENT_DATE eventually,
    -- at which point the date range is empty and v_qualifying is 0.
    LOOP
      SELECT COUNT(*) INTO v_qualifying
      FROM daily_goal_success(p_user_id, goal.cycle_started_on, CURRENT_DATE) d
      WHERE CASE goal.goal_type
        WHEN 'hydration' THEN d.hydration_ok
        WHEN 'sugar_free' THEN d.sugar_free_ok
        WHEN 'protein' THEN d.primary_goal_ok
        WHEN 'movement' THEN d.movement_ok
        WHEN 'consistency' THEN d.consistency_ok
      END;

      -- 3 qualifying days grows a plant from a fresh cycle to fully grown
      -- (docs/adr/0026-garden-mechanic-v2.md, decided over the 3-vs-4 open
      -- question the proposal raised).
      EXIT WHEN v_qualifying < 3;

      SELECT d.log_date INTO v_graduation_date
      FROM daily_goal_success(p_user_id, goal.cycle_started_on, CURRENT_DATE) d
      WHERE CASE goal.goal_type
        WHEN 'hydration' THEN d.hydration_ok
        WHEN 'sugar_free' THEN d.sugar_free_ok
        WHEN 'protein' THEN d.primary_goal_ok
        WHEN 'movement' THEN d.movement_ok
        WHEN 'consistency' THEN d.consistency_ok
      END
      ORDER BY d.log_date
      OFFSET 2 LIMIT 1; -- the 3rd qualifying day

      SELECT COUNT(*) INTO v_next_index FROM permanent_garden WHERE user_id = p_user_id;

      INSERT INTO permanent_garden (user_id, plant_type, board_number, slot_index, completed_on)
      VALUES (p_user_id, goal.plant_type, v_next_index / 25, v_next_index % 25, v_graduation_date);

      goal.cycle_started_on := v_graduation_date + 1;
      UPDATE garden_state SET cycle_started_on = goal.cycle_started_on WHERE id = goal.id;
    END LOOP;

    SELECT CASE goal.goal_type
      WHEN 'hydration' THEN d.hydration_ok
      WHEN 'sugar_free' THEN d.sugar_free_ok
      WHEN 'protein' THEN d.primary_goal_ok
      WHEN 'movement' THEN d.movement_ok
      WHEN 'consistency' THEN d.consistency_ok
    END INTO v_today_ok
    FROM daily_goal_success(p_user_id, CURRENT_DATE, CURRENT_DATE) d;

    UPDATE garden_state
      SET current_stage = v_qualifying, -- always < 3: the loop above only exits below that
          is_dormant_today = NOT COALESCE(v_today_ok, FALSE)
      WHERE id = goal.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- SECURITY DEFINER, not the SECURITY INVOKER default: EXECUTE privilege on
-- sync_garden_state is checked against whoever is actually calling it, not
-- against whatever elevation sync_garden_state's own body carries. A plain
-- SECURITY INVOKER trigger function here would run as the authenticated
-- user who performed the log write -- exactly the role the privilege
-- lockdown below revokes EXECUTE on sync_garden_state from -- so every log
-- insert would fail with "permission denied for function sync_garden_state"
-- and roll back the entire statement. Marking this SECURITY DEFINER costs
-- nothing in exposed surface: it is a trigger function (returns TRIGGER),
-- which Postgres already refuses to call outside trigger context regardless
-- of any grant, so this cannot be reached as a client-facing RPC either way.
CREATE OR REPLACE FUNCTION on_log_change() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM sync_garden_state(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM sync_garden_state(NEW.user_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- AFTER INSERT OR UPDATE OR DELETE (extended from the blueprint's
-- AFTER-INSERT-only sketch in §5.3): compute_days_succeeded/
-- did_goal_succeed_on_date recompute fully from source data every time, so
-- an edited or deleted log must also trigger a recompute — otherwise a
-- deleted log would leave garden_state showing a stage the user no longer
-- qualifies for until an unrelated future log happened to fire the trigger.
CREATE TRIGGER trg_food_log_garden
  AFTER INSERT OR UPDATE OR DELETE ON food_logs
  FOR EACH ROW EXECUTE FUNCTION on_log_change();
CREATE TRIGGER trg_workout_log_garden
  AFTER INSERT OR UPDATE OR DELETE ON workout_logs
  FOR EACH ROW EXECUTE FUNCTION on_log_change();
CREATE TRIGGER trg_water_log_garden
  AFTER INSERT OR UPDATE OR DELETE ON water_logs
  FOR EACH ROW EXECUTE FUNCTION on_log_change();

-- ============================================================
-- Structural guarantee for permanent_garden (§5.4) — the database refuses
-- the mutation, not just code review convention.
--
-- Idempotency stance (docs/adr/0026-garden-mechanic-v2.md): under the v2
-- model this table is written live, mid-cycle, by a trigger — not only by a
-- settled weekly cron job as before. A user can graduate a plant and then
-- delete the food log that made the final qualifying day count; recomputing
-- from source would say the plant should not have graduated, but this
-- table's insert-only guarantee means it stays planted. That is accepted
-- behaviour, not a bug: once earned, never taken away, matching the
-- product's non-punitive philosophy, and the "distinct days since
-- cycle_started_on" design already prevents farming the same day twice. The
-- recompute-from-source guarantee (ADR-002) now applies to garden_state
-- only; permanent_garden is an append-only ledger of earned events.
-- ============================================================

CREATE OR REPLACE FUNCTION reject_permanent_garden_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'permanent_garden is insert-only; % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_update_permanent_garden
BEFORE UPDATE OR DELETE ON permanent_garden
FOR EACH ROW EXECUTE FUNCTION reject_permanent_garden_mutation();

-- ============================================================
-- New-user seeding (roadmap §4.6). Named by the blueprint (§5.10) as living
-- "in §5.3" but never actually given a SQL body there — this fills that gap.
-- ============================================================

CREATE OR REPLACE FUNCTION seed_garden_state_for_new_user(p_user_id UUID) RETURNS VOID AS $$
BEGIN
  INSERT INTO garden_state (user_id, goal_type, plant_type, cycle_started_on)
  VALUES
    (p_user_id, 'hydration',   'mint',        CURRENT_DATE),
    (p_user_id, 'sugar_free',  'cactus',      CURRENT_DATE),
    (p_user_id, 'protein',     'wheat_stalk', CURRENT_DATE),
    (p_user_id, 'movement',    'sapling',     CURRENT_DATE),
    (p_user_id, 'consistency', 'succulent',   CURRENT_DATE)
  ON CONFLICT (user_id, goal_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION handle_new_auth_user() RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO public.users (auth_id) VALUES (NEW.id) RETURNING id INTO v_user_id;
  PERFORM seed_garden_state_for_new_user(v_user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ============================================================
-- Privilege lockdown: PostgREST exposes every function in the `public`
-- schema as an RPC endpoint by default, and Supabase's project template
-- runs `ALTER DEFAULT PRIVILEGES ... GRANT ALL ON FUNCTIONS TO anon,
-- authenticated` so newly created functions are reachable without a manual
-- grant each time — convenient in general, wrong for these four, which are
-- internal helpers invoked only via triggers, from within another SECURITY
-- DEFINER function's already-elevated context, or (daily_goal_success) take
-- an arbitrary user_id and would leak another user's logged-behaviour
-- pattern if left callable directly. Left ungranted, a client could
-- otherwise call rpc/seed_garden_state_for_new_user with an arbitrary
-- user_id, or rpc/daily_goal_success for a user_id they do not own.
-- Revoking from PUBLIC as well as the two named roles covers both the
-- implicit-PUBLIC-inheritance case and Supabase's explicit per-role default
-- grant. (Trigger functions such as on_log_change and handle_new_auth_user
-- need no equivalent revocation — Postgres already refuses to call a
-- TRIGGER-returning function outside trigger context.)
-- ============================================================
REVOKE EXECUTE ON FUNCTION daily_goal_success(UUID, DATE, DATE) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION sync_garden_state(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION seed_garden_state_for_new_user(UUID) FROM PUBLIC, anon, authenticated;
