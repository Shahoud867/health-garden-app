-- Platform — config, notifications, audit, multi-tenancy hook (§5.2).

-- e.g. ('garden_stage_thresholds','[0,2,4,6]'), ('ai_chat_enabled','true'),
-- ('ai_daily_cap','15') — seeded in supabase/seed.sql.
CREATE TABLE app_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE push_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expo_push_token VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_push_tokens_user ON push_tokens (user_id);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- subscription_activated, payment_intent_approved, etc.
  event_payload JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_log_user ON audit_log (user_id);

-- B2B multi-tenancy hook (§11.4) — schema-ready, not activated at MVP.
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  seat_limit INT NOT NULL CHECK (seat_limit > 0),
  billing_contact_email VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE organization_members (
  organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  PRIMARY KEY (organization_id, user_id)
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- app_config: deliberately zero policies. RLS-default-deny (§7.10) applies
-- to every role including `authenticated` — feature flags and cost-control
-- thresholds must never be directly readable or writable by any client; an
-- Edge Function reads this with the service-role client, server-side only.

-- push_tokens: registering/unregistering a device token carries no
-- privilege-escalation risk — ordinary own-row CRUD.
CREATE POLICY "Users manage own push tokens" ON push_tokens
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- audit_log: a user may see the history of actions taken on their own
-- account (transparency), but can never write it themselves — a
-- client-forgeable audit trail is not an audit trail. Writes are
-- service-role only, from the Edge Functions/triggers that generate events.
CREATE POLICY "Users read own audit log" ON audit_log
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- organizations / organization_members: read-only for members at MVP.
-- Org creation/management is an admin (Retool/service-role) operation until
-- the B2B tier is actually activated (§11.4) — no client INSERT/UPDATE/DELETE.
CREATE POLICY "Members read their organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Members read their own membership" ON organization_members
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
