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
