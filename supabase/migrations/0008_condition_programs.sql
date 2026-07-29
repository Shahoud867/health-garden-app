-- Condition-specific programs — diabetes, PCOS, joint pain (§11.11).
-- Schema-ready now, activation gated behind real post-launch demand
-- (condition_programs.is_active starts FALSE for every program) — the same
-- config-driven pattern already used for organizations/organization_members
-- (§11.4, ADR-010), not new scope creep into MVP.

CREATE TABLE condition_programs (
  program_key VARCHAR(30) PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  display_name_urdu VARCHAR(100),
  -- Matches the tag stored in users.conditions (§5.1's comma-separated
  -- tag-matching pattern).
  maps_to_condition_tag VARCHAR(30) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Templated, bilingual, non-AI guidance content — authored/reviewed once,
-- served free (§11.11's clinical-caveat note: review before any is_active flip).
CREATE TABLE condition_program_content (
  id BIGSERIAL PRIMARY KEY,
  program_key VARCHAR(30) NOT NULL REFERENCES condition_programs (program_key) ON DELETE CASCADE,
  content_type VARCHAR(30) NOT NULL
    CHECK (content_type IN ('tip', 'meal_timing_guide', 'myth_bust', 'disclaimer')),
  title VARCHAR(255) NOT NULL,
  title_urdu VARCHAR(255),
  body TEXT NOT NULL,
  body_urdu TEXT,
  source_reference VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Optional, opt-in self-monitoring for PCOS/joint-pain programs, deliberately
-- not gamified (kept separate from the garden engine — §11.11's "no new
-- garden plant" rule) and more sensitive than anything else this app
-- collects (§7.9 export/delete rights apply identically).
CREATE TABLE symptom_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  program_key VARCHAR(30) NOT NULL REFERENCES condition_programs (program_key),
  log_date DATE NOT NULL,
  severity_scale INT NOT NULL CHECK (severity_scale BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, program_key, log_date)
);

ALTER TABLE condition_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_program_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;

-- Public read, same as foods/recipes/exercises — is_active is a UI/business
-- gate ("should the app surface this"), not a confidentiality boundary, so
-- inactive-program content is not hidden, just unused until activated.
CREATE POLICY "Public read access" ON condition_programs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON condition_program_content FOR SELECT USING (true);

-- Purely self-reported, no privilege implication — same own-row CRUD model
-- as weight_logs.
CREATE POLICY "Users manage own symptom logs" ON symptom_logs
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
