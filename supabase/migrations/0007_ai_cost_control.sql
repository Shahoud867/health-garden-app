-- AI cost control (§5.2). Gemini's free tier is shared across the whole app,
-- not per-user (Founder_B_Backend_Roadmap.md §7.1) — these two tables are
-- the hard cap ADR-003 depends on, so neither is client-writable: a user who
-- could reset their own daily_ai_usage count, or insert a fake ai_plans row,
-- would defeat the entire cost-control design. Writes happen exclusively via
-- the service-role client inside ai-chat / ai-plan-generate (§6.2), after a
-- successful, already-paid-for call — never before, and never by the client.

CREATE TABLE daily_ai_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  message_count INT NOT NULL DEFAULT 0 CHECK (message_count >= 0),
  UNIQUE (user_id, usage_date)
);

-- plan_type/period_kind/period_start (AI plan retrieval-grounding round):
-- one weekly diet plan and one monthly workout plan need to coexist for the
-- same user, which a bare UNIQUE (user_id, week_start) could never express.
-- week_start is dropped outright rather than kept alongside period_start —
-- no client reads it yet (no web app exists), so there is nothing to keep it
-- for.
CREATE TABLE ai_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  plan_type VARCHAR(20) NOT NULL DEFAULT 'diet' CHECK (plan_type IN ('diet', 'workout')),
  -- The Monday of the ISO week (diet plans) or the 1st of the month
  -- (workout plans) this plan covers -- always a real calendar anchor, never
  -- "today", so regeneration replaces the same period's plan rather than
  -- creating a new one.
  period_start DATE NOT NULL,
  period_kind VARCHAR(10) NOT NULL DEFAULT 'week' CHECK (period_kind IN ('week', 'month')),
  regenerations_used INT NOT NULL DEFAULT 0 CHECK (regenerations_used >= 0),
  plan_content JSONB NOT NULL,
  UNIQUE (user_id, plan_type, period_start)
);

ALTER TABLE daily_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own AI usage" ON daily_ai_usage
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users read own AI plans" ON ai_plans
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
