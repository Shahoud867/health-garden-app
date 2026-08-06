-- AI cost control support (§4.3/§12.5, ADR-003): the cap check must be
-- atomic with the increment, not a separate SELECT-then-UPDATE — two
-- concurrent chat requests each reading "14, still under the 15 cap" before
-- either writes back would both proceed to call Gemini, breaching the cap
-- by exactly as many requests as were in flight at that instant. Combining
-- read-check-write into one statement closes that window; this is a
-- robustness strengthening of §4.3's literal two-step description, not a
-- behavior change -- the cap check still happens strictly before the
-- Gemini call either way.
CREATE OR REPLACE FUNCTION increment_daily_ai_usage(p_user_id UUID) RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO daily_ai_usage (user_id, usage_date, message_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET message_count = daily_ai_usage.message_count + 1
  RETURNING message_count INTO v_count;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- daily_ai_usage is SELECT-only for the authenticated role (migration 0007) --
-- a client that could call this directly would still only inflate its own
-- counter (no privilege escalation), but locking it down keeps the pattern
-- uniform with every other internal helper (ADR-0024) and keeps the only
-- caller the ai-chat Edge Function's own service-role client.
REVOKE EXECUTE ON FUNCTION increment_daily_ai_usage(UUID) FROM PUBLIC, anon, authenticated;

-- The canonical "what week/month is it" used wherever a calendar period
-- boundary matters (ai_plans.period_start) -- an Edge Function must ask
-- Postgres rather than recompute this in JS, or a client-side
-- timezone/DST assumption could silently drift from the Asia/Karachi
-- boundary the rest of the schema is pinned to (§5.10, G-16). Read-only and
-- non-sensitive (it reveals nothing but the calendar), so neither carries a
-- REVOKE unlike the functions above.
CREATE OR REPLACE FUNCTION current_week_start() RETURNS DATE AS $$
  SELECT date_trunc('week', CURRENT_DATE)::DATE;
$$ LANGUAGE sql STABLE;

-- Diet plans are weekly (current_week_start); workout plans are monthly
-- (AI plan retrieval-grounding round) -- one call/user/month is cheap enough
-- on the request-per-day-bound free tier that a full calendar month, not a
-- rolling 30 days, is the simpler and more predictable period.
CREATE OR REPLACE FUNCTION current_month_start() RETURNS DATE AS $$
  SELECT date_trunc('month', CURRENT_DATE)::DATE;
$$ LANGUAGE sql STABLE;
