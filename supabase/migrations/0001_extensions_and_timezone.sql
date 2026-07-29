-- Phase 3 (Database Layer) — Blueprint §5.10, closes G-16.
--
-- Must be the first statement of the first migration: every later trigger
-- and function in this schema calls CURRENT_DATE/now() to decide which
-- calendar day a log belongs to. Supabase's platform default is UTC, and
-- Pakistan Standard Time (UTC+5, no DST) means anything logged after 7pm
-- PKT would otherwise be recorded against the wrong day, corrupting the
-- garden engine's day-counting (ADR-002) before it ever runs.
ALTER DATABASE postgres SET timezone TO 'Asia/Karachi';

-- gen_random_uuid() ships in Postgres core since v13 (this project runs v17
-- per supabase/config.toml) — no pgcrypto/uuid-ossp extension needed for the
-- UUID primary keys and client_uuid columns used throughout this schema.

-- Baseline schema privileges (Blueprint §7.3/ADR-006): table-level grants are
-- deliberately wide open across all three PostgREST-facing roles, exactly
-- like Supabase's own project template — Row Level Security, not the SQL
-- GRANT system, is the actual authorization boundary everywhere in this
-- schema (ADR-006, ADR-0024). Declaring this explicitly here, first, rather
-- than assuming the platform already did it for tables this project's own
-- migrations create, means every CREATE TABLE from migration 0002 onward
-- inherits it automatically via ALTER DEFAULT PRIVILEGES, with no per-table
-- GRANT statement needed anywhere else in this migration set.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
