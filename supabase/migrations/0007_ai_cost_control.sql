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

CREATE TABLE ai_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  week_start DATE NOT NULL,
  regenerations_used INT NOT NULL DEFAULT 0 CHECK (regenerations_used >= 0),
  plan_content JSONB NOT NULL,
  UNIQUE (user_id, week_start)
);

ALTER TABLE daily_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own AI usage" ON daily_ai_usage
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users read own AI plans" ON ai_plans
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
