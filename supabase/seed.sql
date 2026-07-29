-- Bootstrap/dev seed data, applied automatically after migrations by
-- `supabase db reset` / `supabase start` (§5.9). Three categories:
--
-- 1. app_config — real values the system needs to function from a clean DB.
-- 2. condition_programs — the §11.11 registry, all is_active = FALSE.
-- 3. Reference-data placeholders — verbatim from
--    Founder_B_Backend_Roadmap.md §5.1/§5.2, so local dev/CI has something
--    to log against. Food rows are explicitly labeled PLACEHOLDER in
--    source_1 and verified = 'N', exactly per that source's own stated
--    reason: "impossible to accidentally ship fake test data to real users."
--    condition_program_content is deliberately left empty — that content is
--    health guidance that needs a clinician/dietitian review pass (§11.11)
--    before it exists at all, which is not something to fabricate here.

INSERT INTO app_config (key, value) VALUES
  ('garden_stage_thresholds', '[0, 2, 4, 6]'),
  ('ai_chat_enabled', 'true'),
  ('ai_daily_cap', '15');

INSERT INTO condition_programs (program_key, display_name, display_name_urdu, maps_to_condition_tag, is_active) VALUES
  ('diabetes_management', 'Diabetes Management', 'ذیابیطس کا انتظام', 'diabetes', FALSE),
  ('pcos_support', 'PCOS Support', 'پی سی او ایس سپورٹ', 'pcos', FALSE),
  ('joint_friendly', 'Joint-Friendly', 'جوڑوں کے موافق', 'knee_pain', FALSE);

INSERT INTO exercises (exercise_name, urdu_name, category, intensity_level, met_value, exclude_conditions, duration_assumption_min, source) VALUES
('Squats (bodyweight)', 'اسکواٹ', 'Legs', 'Moderate', 3.8, 'knee_pain', 1, 'ACSM Compendium'),
('Push-ups (standard)', 'پش اپ', 'Upper Body', 'Moderate', 3.8, '', 1, 'ACSM Compendium'),
('Lunges (walking)', 'لنجز', 'Legs', 'Moderate', 3.5, 'knee_pain', 1, 'ACSM Compendium'),
('Plank hold (static)', 'پلینک', 'Core', 'Light', 2.8, '', 1, 'ACSM Compendium'),
('Jumping jacks', 'جمپنگ جیکس', 'Cardio', 'Moderate', 3.5, 'knee_pain', 1, 'ACSM Compendium'),
('Walking, 3 mph', 'چلنا', 'Cardio', 'Light', 2.8, '', 1, 'ACSM Compendium'),
('Walking, 4.5 mph', 'چلنا (تیز)', 'Cardio', 'Moderate', 4.0, '', 1, 'ACSM Compendium'),
('Wall sit', 'وال سٹ', 'Legs', 'Moderate', 4.0, 'knee_pain', 1, 'ACSM Compendium'),
('Glute bridges', 'گلوٹ برج', 'Legs', 'Light', 3.0, '', 1, 'ACSM Compendium'),
('Bicycle crunches', 'سائیکل کرنچ', 'Core', 'Light', 2.8, '', 1, 'ACSM Compendium'),
('Yoga (Hatha)', 'یوگا', 'Flexibility', 'Light', 2.5, '', 1, 'ACSM Compendium'),
('Stretching (light)', 'سٹریچنگ', 'Flexibility', 'Light', 1.3, '', 1, 'ACSM Compendium'),
('Swimming (leisure)', 'تیراکی', 'Cardio', 'Light', 4.0, '', 1, 'ACSM Compendium'),
('Cycling stationary (light)', 'سائیکل', 'Cardio', 'Light', 3.5, 'knee_pain', 1, 'ACSM Compendium'),
('Dumbbell curl (light)', 'ڈمبل کرل', 'Upper Body', 'Light', 2.5, '', 1, 'ACSM Compendium'),
('Tricep dips', 'ٹرائیسیپ ڈپس', 'Upper Body', 'Moderate', 3.8, '', 1, 'ACSM Compendium'),
('High knees', 'ہائی نیز', 'Cardio', 'Vigorous', 6.0, 'knee_pain', 1, 'ACSM Compendium'),
('Leg raises', 'لیگ ریزز', 'Core', 'Light', 2.8, '', 1, 'ACSM Compendium'),
('Dancing (social, moderate)', 'ڈانسنگ', 'Cardio', 'Moderate', 3.5, '', 1, 'ACSM Compendium'),
('Pilates', 'پلیٹس', 'Core', 'Moderate', 3.0, '', 1, 'ACSM Compendium');

INSERT INTO foods (dish_name, urdu_name, portion_unit, portion_grams, calories, protein_g, carbs_g, fat_g, sugar_flag, source_1, verified) VALUES
('Roti (plain wheat)', 'روٹی', '1 roti', 65, 172, 4.2, 28, 1.2, 'N', 'PLACEHOLDER - Founder A will replace', 'N'),
('Daal masoor', 'دال مسور', '1 katori', 180, 195, 12, 30, 2, 'N', 'PLACEHOLDER - Founder A will replace', 'N'),
('Chicken karahi', 'چکن کڑاہی', '1 serving', 300, 420, 35, 8, 22, 'N', 'PLACEHOLDER - Founder A will replace', 'N'),
('Boiled egg', 'ابلا انڈا', '1 large', 50, 78, 6, 0.6, 5, 'N', 'PLACEHOLDER - Founder A will replace', 'N'),
('Lassi (plain)', 'لسی', '1 glass', 250, 150, 6, 12, 8, 'N', 'PLACEHOLDER - Founder A will replace', 'N');
