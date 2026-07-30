-- Read-only query helpers backing the Phase 6 background jobs (§4.6).
--
-- Support for the engagement-nudge job (§4.6, §2.8): finds users who have a
-- push subscription but have not logged anything today. Returns other
-- users' push subscription keys, so this must never be reachable by any
-- client role directly (ADR-0024's pattern) -- only notify-inactive-users'
-- own service-role client ever calls it.
CREATE OR REPLACE FUNCTION find_inactive_users_for_nudge()
RETURNS TABLE (user_id UUID, endpoint TEXT, p256dh TEXT, auth TEXT) AS $$
  SELECT pt.user_id, pt.endpoint, pt.p256dh, pt.auth
  FROM push_tokens pt
  WHERE NOT EXISTS (
    SELECT 1 FROM food_logs f WHERE f.user_id = pt.user_id AND f.log_date = CURRENT_DATE
    UNION ALL
    SELECT 1 FROM workout_logs w WHERE w.user_id = pt.user_id AND w.log_date = CURRENT_DATE
    UNION ALL
    SELECT 1 FROM water_logs wa WHERE wa.user_id = pt.user_id AND wa.log_date = CURRENT_DATE
  );
$$ LANGUAGE sql STABLE;

REVOKE EXECUTE ON FUNCTION find_inactive_users_for_nudge() FROM PUBLIC, anon, authenticated;

-- Support for the Gemini quota watchdog (§4.6): Gemini's free tier is
-- shared project-wide, ~1,500 requests/day (Founder_B_Backend_Roadmap.md
-- §7.1) -- an actual SUM aggregate, not fetching individual rows and adding
-- them up in the Edge Function, which would silently truncate at
-- config.toml's max_rows=1000 once more than 1,000 distinct users had used
-- AI on a given day.
CREATE OR REPLACE FUNCTION sum_todays_ai_usage() RETURNS INT AS $$
  SELECT COALESCE(SUM(message_count), 0)::INT FROM daily_ai_usage WHERE usage_date = CURRENT_DATE;
$$ LANGUAGE sql STABLE;

REVOKE EXECUTE ON FUNCTION sum_todays_ai_usage() FROM PUBLIC, anon, authenticated;
