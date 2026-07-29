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

CREATE TABLE garden_state (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL
    CHECK (goal_type IN ('hydration', 'sugar_free', 'protein', 'movement', 'consistency')),
  plant_type VARCHAR(50) NOT NULL
    CHECK (plant_type IN ('mint', 'cactus', 'wheat_stalk', 'sapling', 'succulent')),
  current_week_start DATE NOT NULL,
  days_succeeded_this_week INT NOT NULL DEFAULT 0 CHECK (days_succeeded_this_week BETWEEN 0 AND 7),
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
  week_completed DATE NOT NULL,
  final_stage_reached INT NOT NULL CHECK (final_stage_reached BETWEEN 0 AND 3),
  planted_at TIMESTAMP NOT NULL DEFAULT NOW()
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
-- ============================================================

CREATE OR REPLACE FUNCTION compute_days_succeeded(
  p_user_id UUID, p_goal_type VARCHAR, p_week_start DATE
) RETURNS INT AS $$
DECLARE
  v_count INT;
  v_protein_target DECIMAL;
BEGIN
  SELECT daily_protein_target_g INTO v_protein_target FROM users WHERE id = p_user_id;

  IF p_goal_type = 'protein' THEN
    SELECT COUNT(*) INTO v_count FROM (
      SELECT log_date FROM food_logs
      WHERE user_id = p_user_id AND log_date BETWEEN p_week_start AND p_week_start + 6
      GROUP BY log_date HAVING SUM(protein_g_snapshot) >= v_protein_target
    ) d;

  ELSIF p_goal_type = 'sugar_free' THEN
    SELECT COUNT(*) INTO v_count FROM (
      SELECT DISTINCT log_date FROM food_logs f1
      WHERE user_id = p_user_id AND log_date BETWEEN p_week_start AND p_week_start + 6
        AND NOT EXISTS (
          SELECT 1 FROM food_logs f2
          WHERE f2.user_id = f1.user_id AND f2.log_date = f1.log_date
            AND f2.sugar_flag_snapshot = 'Y'
        )
    ) d;

  ELSIF p_goal_type = 'hydration' THEN
    SELECT COUNT(*) INTO v_count FROM (
      SELECT log_date FROM water_logs
      WHERE user_id = p_user_id AND log_date BETWEEN p_week_start AND p_week_start + 6
      GROUP BY log_date HAVING SUM(glasses_logged) >= 8
    ) d;

  ELSIF p_goal_type = 'movement' THEN
    SELECT COUNT(DISTINCT log_date) INTO v_count FROM workout_logs
    WHERE user_id = p_user_id AND log_date BETWEEN p_week_start AND p_week_start + 6;

  ELSIF p_goal_type = 'consistency' THEN
    SELECT COUNT(DISTINCT log_date) INTO v_count FROM (
      SELECT log_date FROM food_logs WHERE user_id = p_user_id
      UNION SELECT log_date FROM workout_logs WHERE user_id = p_user_id
      UNION SELECT log_date FROM water_logs WHERE user_id = p_user_id
    ) all_logs
    WHERE log_date BETWEEN p_week_start AND p_week_start + 6;
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Single-day version of the same per-goal-type logic, backing the "no dying
-- plants" rule (roadmap §6.5): a plant rests (is_dormant_today) rather than
-- decays when today has not yet met the goal. Not specified in the blueprint
-- as SQL — the blueprint only names this requirement narratively — so this
-- mirrors compute_days_succeeded's exact per-goal thresholds, scoped to one
-- date, rather than introducing a different rule for the same goal.
CREATE OR REPLACE FUNCTION did_goal_succeed_on_date(
  p_user_id UUID, p_goal_type VARCHAR, p_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
  v_succeeded BOOLEAN;
  v_protein_target DECIMAL;
BEGIN
  SELECT daily_protein_target_g INTO v_protein_target FROM users WHERE id = p_user_id;

  IF p_goal_type = 'protein' THEN
    SELECT COALESCE(SUM(protein_g_snapshot), 0) >= v_protein_target INTO v_succeeded
      FROM food_logs WHERE user_id = p_user_id AND log_date = p_date;

  ELSIF p_goal_type = 'sugar_free' THEN
    SELECT EXISTS (SELECT 1 FROM food_logs WHERE user_id = p_user_id AND log_date = p_date)
      AND NOT EXISTS (
        SELECT 1 FROM food_logs
        WHERE user_id = p_user_id AND log_date = p_date AND sugar_flag_snapshot = 'Y'
      ) INTO v_succeeded;

  ELSIF p_goal_type = 'hydration' THEN
    SELECT COALESCE(SUM(glasses_logged), 0) >= 8 INTO v_succeeded
      FROM water_logs WHERE user_id = p_user_id AND log_date = p_date;

  ELSIF p_goal_type = 'movement' THEN
    SELECT EXISTS (SELECT 1 FROM workout_logs WHERE user_id = p_user_id AND log_date = p_date)
      INTO v_succeeded;

  ELSIF p_goal_type = 'consistency' THEN
    SELECT EXISTS (
      SELECT 1 FROM food_logs WHERE user_id = p_user_id AND log_date = p_date
      UNION SELECT 1 FROM workout_logs WHERE user_id = p_user_id AND log_date = p_date
      UNION SELECT 1 FROM water_logs WHERE user_id = p_user_id AND log_date = p_date
    ) INTO v_succeeded;
  END IF;

  RETURN COALESCE(v_succeeded, FALSE);
END;
$$ LANGUAGE plpgsql;

-- SECURITY DEFINER: garden_state has no client-facing write policy (above),
-- so this must run with the function owner's privileges to write at all.
-- Only this function (and the two below it) may ever mutate garden_state or
-- permanent_garden — that invariant is what makes the RLS deviation correct.
CREATE OR REPLACE FUNCTION sync_garden_state(p_user_id UUID) RETURNS VOID AS $$
DECLARE
  goal RECORD;
  v_days INT;
  v_stage INT;
BEGIN
  FOR goal IN SELECT goal_type, current_week_start FROM garden_state WHERE user_id = p_user_id LOOP
    v_days := compute_days_succeeded(p_user_id, goal.goal_type, goal.current_week_start);
    v_stage := CASE WHEN v_days >= 6 THEN 3 WHEN v_days >= 4 THEN 2
                     WHEN v_days >= 2 THEN 1 ELSE 0 END;
    UPDATE garden_state
      SET days_succeeded_this_week = v_days,
          current_stage = v_stage,
          is_dormant_today = NOT did_goal_succeed_on_date(p_user_id, goal.goal_type, CURRENT_DATE)
      WHERE user_id = p_user_id AND goal_type = goal.goal_type;
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
-- New-user seeding and the weekly archive/reset (roadmap §4.6/§6.4). Named
-- by the blueprint (§5.10) as living "in §5.3" but never actually given a
-- SQL body there — this fills that gap, following the roadmap's narrative
-- spec and the same idempotent/derived philosophy as the rest of this file.
-- ============================================================

CREATE OR REPLACE FUNCTION seed_garden_state_for_new_user(p_user_id UUID) RETURNS VOID AS $$
DECLARE
  -- Postgres's date_trunc('week', ...) starts on Monday, matching the
  -- roadmap's "every Monday" reset cadence (§6.4).
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
BEGIN
  INSERT INTO garden_state (user_id, goal_type, plant_type, current_week_start)
  VALUES
    (p_user_id, 'hydration',   'mint',        v_week_start),
    (p_user_id, 'sugar_free',  'cactus',      v_week_start),
    (p_user_id, 'protein',     'wheat_stalk', v_week_start),
    (p_user_id, 'movement',    'sapling',     v_week_start),
    (p_user_id, 'consistency', 'succulent',   v_week_start)
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

-- The weekly reset (roadmap §6.4): "the most important function in the
-- whole app" per that source, because it's the only code path allowed to
-- write permanent_garden. Walks forward one week at a time per stale row so
-- a long gap (the scheduler missed several cycles, or a user hasn't opened
-- the app in a month) still produces one permanent_garden row per missed
-- week rather than silently collapsing history — the same "never loses
-- data, no matter what else goes wrong" guarantee §5.4 already holds this
-- table to. FOR UPDATE locks each row for the duration of its own
-- processing, so a concurrent invocation (e.g. a lazy per-user check racing
-- a scheduled sweep) cannot double-archive the same week.
--
-- Scheduling (pg_cron) is out of scope here — this is Background Processing
-- (Phase 6 of this implementation round), not the Database Layer. This
-- function is written to be safe to call from a cron job, an Edge Function,
-- or ad hoc, and to be a no-op when nothing is stale.
CREATE OR REPLACE FUNCTION archive_and_reset_stale_garden_rows() RETURNS INT AS $$
DECLARE
  stale_row RECORD;
  v_cursor_week DATE;
  v_cursor_stage INT;
  v_archived_count INT := 0;
BEGIN
  FOR stale_row IN
    SELECT id, user_id, plant_type, current_week_start, current_stage
    FROM garden_state
    WHERE current_week_start + 7 <= CURRENT_DATE
    FOR UPDATE
  LOOP
    v_cursor_week := stale_row.current_week_start;
    v_cursor_stage := stale_row.current_stage;

    WHILE v_cursor_week + 7 <= CURRENT_DATE LOOP
      INSERT INTO permanent_garden (user_id, plant_type, week_completed, final_stage_reached)
      VALUES (stale_row.user_id, stale_row.plant_type, v_cursor_week, v_cursor_stage);

      v_cursor_week := v_cursor_week + 7;
      v_cursor_stage := 0; -- weeks after the first missed week have no activity data
      v_archived_count := v_archived_count + 1;
    END LOOP;

    UPDATE garden_state
      SET current_week_start = v_cursor_week,
          days_succeeded_this_week = 0,
          current_stage = 0,
          is_dormant_today = FALSE
      WHERE id = stale_row.id;
  END LOOP;

  RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- Privilege lockdown: PostgREST exposes every function in the `public`
-- schema as an RPC endpoint by default, and Supabase's project template
-- runs `ALTER DEFAULT PRIVILEGES ... GRANT ALL ON FUNCTIONS TO anon,
-- authenticated` so newly created functions are reachable without a manual
-- grant each time — convenient in general, wrong for these five, which are
-- internal helpers invoked only via triggers or from within another
-- SECURITY DEFINER function's already-elevated context. Left ungranted, a
-- client could otherwise call rpc/seed_garden_state_for_new_user with an
-- arbitrary user_id, or force rpc/archive_and_reset_stale_garden_rows to
-- run on demand. Revoking from PUBLIC as well as the two named roles covers
-- both the implicit-PUBLIC-inheritance case and Supabase's explicit
-- per-role default grant. (Trigger functions such as on_log_change and
-- handle_new_auth_user need no equivalent revocation — Postgres already
-- refuses to call a TRIGGER-returning function outside trigger context.)
-- ============================================================
REVOKE EXECUTE ON FUNCTION compute_days_succeeded(UUID, VARCHAR, DATE) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION did_goal_succeed_on_date(UUID, VARCHAR, DATE) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION sync_garden_state(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION seed_garden_state_for_new_user(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION archive_and_reset_stale_garden_rows() FROM PUBLIC, anon, authenticated;
