-- Background processing (Blueprint §4.6, §2.7) -- pg_cron for every
-- scheduled job, pg_net for the three that need to reach an Edge Function
-- (anything needing an external API).
--
-- A weekly garden-archival job originally lived here, calling
-- archive_and_reset_stale_garden_rows() directly (no Edge Function/pg_net
-- needed for a pure SQL call). Garden mechanic v2 (docs/adr/0026) replaced
-- weekly archival with event-driven planting inside sync_garden_state
-- (migration 0005) -- a plant is archived the moment it fully grows, not on
-- a Monday sweep -- so that function and this cron entry are both gone.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================================
-- invoke_edge_function(): the one place a cron job's call into an Edge
-- Function is assembled, so every job authenticates and targets the right
-- environment the same way.
--
-- The base URL is non-secret (app_config key 'edge_functions_base_url',
-- ADR-010 -- same config-driven pattern as any other runtime setting). The
-- service-role key is a genuine secret and lives in Supabase Vault instead
-- of a plain table -- the same reasoning as ADR-0024, applied here to the
-- one secret capable of bypassing every RLS policy in the schema at once if
-- it ever leaked via a table dump, logical replica, or backup.
--
-- Per-environment setup this migration deliberately does NOT do (migrations
-- are identical across local/staging/production; these two values are not,
-- and a service-role key must never be committed):
--   INSERT INTO app_config (key, value)
--     VALUES ('edge_functions_base_url', '"https://<project-ref>.supabase.co/functions/v1"');
--   SELECT vault.create_secret('<service-role-key>', 'service_role_key');
-- Local dev/CI seeds both with the well-known local-stack values (seed.sql).
-- ============================================================

CREATE OR REPLACE FUNCTION invoke_edge_function(
  p_function_name TEXT, p_payload JSONB DEFAULT '{}'::jsonb
) RETURNS BIGINT AS $$
DECLARE
  v_base_url TEXT;
  v_service_role_key TEXT;
  v_request_id BIGINT;
BEGIN
  SELECT value #>> '{}' INTO v_base_url FROM app_config WHERE key = 'edge_functions_base_url';
  SELECT decrypted_secret INTO v_service_role_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  IF v_base_url IS NULL OR v_service_role_key IS NULL THEN
    RAISE EXCEPTION
      'invoke_edge_function: app_config.edge_functions_base_url and vault secret service_role_key must both be set';
  END IF;

  SELECT net.http_post(
    url := v_base_url || '/' || p_function_name,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_service_role_key,
      'Content-Type', 'application/json'
    ),
    body := p_payload
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- A client that could call this directly would be able to trigger arbitrary
-- Edge Function invocations authenticated as service-role -- a privilege
-- escalation, not a convenience. Only this migration's own cron.schedule
-- calls below ever invoke it.
REVOKE EXECUTE ON FUNCTION invoke_edge_function(TEXT, JSONB) FROM PUBLIC, anon, authenticated;

-- ============================================================
-- Schedules. cron.schedule(job_name, ...) is the named-job overload --
-- calling it again with the same name updates that job in place rather than
-- creating a duplicate, which is what makes this migration safe to re-apply
-- (supabase db reset in local dev/CI).
--
-- All times are expressed in UTC with the Asia/Karachi equivalent noted in
-- each comment: PKT is UTC+5 with no DST, so the conversion is fixed and
-- exact. Scheduling in UTC directly, rather than depending on a pg_cron
-- timezone setting, is not something verifiable without a live instance to
-- test against.
-- ============================================================

-- Daily 18:00 PKT = 13:00 UTC.
SELECT cron.schedule(
  'engagement-nudge', '0 13 * * *',
  $$ SELECT invoke_edge_function('notify-inactive-users'); $$
);

-- Every 30 minutes -- no timezone sensitivity.
SELECT cron.schedule(
  'gemini-quota-watchdog', '*/30 * * * *',
  $$ SELECT invoke_edge_function('gemini-quota-watchdog'); $$
);

-- Daily, 09:00 PKT = 04:00 UTC -- no specific time given in the blueprint;
-- comfortably clear of the weekly-archival window.
SELECT cron.schedule(
  'payment-reconciliation', '0 4 * * *',
  $$ SELECT invoke_edge_function('payment-reconciliation'); $$
);
