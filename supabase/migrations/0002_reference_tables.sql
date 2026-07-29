-- Reference data — foods, recipes, exercises.
--
-- Schema is unchanged from Founder_B_Backend_Roadmap.md §4.3-4.5 (Blueprint
-- §5.2: "as specified... and unchanged"), plus one additive column on
-- `foods` from §11.11 (condition-specific programs, schema-ready-not-active).
--
-- Public reference data, same for every user — no auth required to read.

CREATE TABLE foods (
  id BIGSERIAL PRIMARY KEY,
  dish_name VARCHAR(255) NOT NULL,
  urdu_name VARCHAR(255),
  region_variant VARCHAR(100),
  portion_unit VARCHAR(50) NOT NULL,
  portion_grams DECIMAL(6, 2),
  calories INT,
  protein_g DECIMAL(5, 2),
  carbs_g DECIMAL(5, 2),
  fat_g DECIMAL(5, 2),
  sugar_flag CHAR(1) NOT NULL DEFAULT 'N' CHECK (sugar_flag IN ('Y', 'N')),
  source_1 VARCHAR(150),
  source_2 VARCHAR(150),
  verified CHAR(1) NOT NULL DEFAULT 'Y' CHECK (verified IN ('Y', 'N')),
  -- §11.11 (diabetes program) — additive, nullable until the program activates.
  glycemic_index_category VARCHAR(10) CHECK (glycemic_index_category IN ('low', 'medium', 'high')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_foods_dish_name ON foods (dish_name);
CREATE INDEX idx_foods_urdu_name ON foods (urdu_name);

CREATE TABLE recipes (
  id BIGSERIAL PRIMARY KEY,
  recipe_name VARCHAR(255) NOT NULL,
  urdu_name VARCHAR(255),
  description TEXT,
  ingredients TEXT NOT NULL,
  steps TEXT NOT NULL,
  calories_per_serving INT,
  protein_g DECIMAL(5, 2),
  carbs_g DECIMAL(5, 2),
  fat_g DECIMAL(5, 2),
  sugar_flag CHAR(1) NOT NULL DEFAULT 'N' CHECK (sugar_flag IN ('Y', 'N')),
  cost_pkr_per_serving INT,
  -- Comma-separated tag matching (e.g. 'diabetic_safe,high_protein'), deliberately
  -- simple at current scale (§5.1) — revisit trigger is documented there, not here.
  condition_tags VARCHAR(255),
  source_recipe VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recipes_condition_tags ON recipes (condition_tags);

CREATE TABLE exercises (
  id BIGSERIAL PRIMARY KEY,
  exercise_name VARCHAR(255) NOT NULL,
  urdu_name VARCHAR(255),
  category VARCHAR(50),
  intensity_level VARCHAR(50),
  met_value DECIMAL(4, 2) NOT NULL,
  -- Same comma-separated tag-matching pattern as recipes.condition_tags (§5.1).
  exclude_conditions VARCHAR(255),
  duration_assumption_min INT NOT NULL DEFAULT 1,
  source VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exercises_category ON exercises (category);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Public read access (Blueprint §4.8 / roadmap §4.8) — no write policy for any
-- table here at all: content is authored by the founders via the service-role
-- client, never by an app client.
CREATE POLICY "Public read access" ON foods FOR SELECT USING (true);
CREATE POLICY "Public read access" ON recipes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON exercises FOR SELECT USING (true);
