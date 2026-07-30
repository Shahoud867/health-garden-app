# Data Dictionary — `foods` Table

> Master nutrition database for Health Garden.
> All nutritional values are **per standard serving** as defined by `portion_unit` and `portion_grams`.

---

## Identity Fields

| Column       | Type           | Nullable | Constraints                 | Description                                          | Example           |
| ------------ | -------------- | -------- | --------------------------- | ---------------------------------------------------- | ----------------- |
| `id`         | `BIGSERIAL`    | No       | PRIMARY KEY, auto-increment | Unique database identifier                           | `1`               |
| `dish_name`  | `VARCHAR(255)` | No       | NOT NULL                    | Official English name of the dish/food item          | `Chicken Biryani` |
| `urdu_name`  | `VARCHAR(255)` | Yes      | —                           | Proper Urdu name in Unicode script                   | `چکن بریانی`      |
| `local_name` | `VARCHAR(255)` | Yes      | —                           | Regional or local name if different from `dish_name` | `Sindhi Biryani`  |

## Classification Fields

| Column           | Type           | Nullable | Constraints         | Description               | Valid Values                                                                                                                                                                    |
| ---------------- | -------------- | -------- | ------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cuisine`        | `VARCHAR(100)` | No       | DEFAULT 'Pakistani' | Primary cuisine category  | `Pakistani`, `Continental`, `Chinese`, `Italian`, `Middle Eastern`, `Indian`, `Turkish`, `Mexican`, `Japanese`, `Korean`, `Thai`, `Mediterranean`, `Fast Food`, `International` |
| `category`       | `VARCHAR(100)` | Yes      | —                   | Meal category             | `Breakfast`, `Lunch`, `Dinner`, `Dessert`, `Snack`, `Beverage`, `Street Food`, `Bakery`, `Condiment`, `Side Dish`                                                               |
| `subcategory`    | `VARCHAR(100)` | Yes      | —                   | Dish type within category | `Curry`, `Bread`, `Rice`, `BBQ`, `Soup`, `Salad`, `Kebab`, `Stew`, `Fried`, `Sweet`, `Hot Beverage`, `Cold Beverage`                                                            |
| `region_variant` | `VARCHAR(100)` | Yes      | —                   | Geographic variant        | `Punjab`, `Sindh`, `KPK`, `Balochistan`, `Karachi`, `Lahore`, `Peshawar`, `Kashmir`, or country name for international                                                          |

## Serving Size Fields

| Column                | Type           | Nullable | Constraints | Description                              | Example                                                                |
| --------------------- | -------------- | -------- | ----------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| `serving_description` | `VARCHAR(255)` | Yes      | —           | Human-readable serving description       | `1 medium plate with curry`                                            |
| `portion_unit`        | `VARCHAR(50)`  | No       | NOT NULL    | Standard serving unit                    | `1 Roti`, `1 Katori`, `1 Cup`, `1 Plate`, `1 Piece`, `100g`, `1 Glass` |
| `portion_grams`       | `DECIMAL(6,2)` | Yes      | —           | Weight in grams for the standard serving | `250.00`                                                               |

## Macronutrient Fields (per serving)

| Column            | Type           | Nullable | Constraints | Description                                             | Unit       |
| ----------------- | -------------- | -------- | ----------- | ------------------------------------------------------- | ---------- |
| `calories_kcal`   | `INT`          | Yes      | —           | Total energy per serving                                | kcal       |
| `protein_g`       | `DECIMAL(5,2)` | Yes      | —           | Protein content                                         | grams      |
| `carbohydrates_g` | `DECIMAL(5,2)` | Yes      | —           | Total carbohydrates                                     | grams      |
| `fat_g`           | `DECIMAL(5,2)` | Yes      | —           | Total fat                                               | grams      |
| `saturated_fat_g` | `DECIMAL(5,2)` | Yes      | —           | Saturated fat                                           | grams      |
| `trans_fat_g`     | `DECIMAL(5,2)` | Yes      | —           | Trans fat                                               | grams      |
| `fiber_g`         | `DECIMAL(5,2)` | Yes      | —           | Dietary fiber                                           | grams      |
| `sugar_g`         | `DECIMAL(5,2)` | Yes      | —           | Total sugar (natural + added)                           | grams      |
| `sugar_flag`      | `CHAR(1)`      | Yes      | DEFAULT 'N' | High sugar indicator: `Y` if `sugar_g > 12` per serving | `Y` or `N` |

### Sugar Flag Rule

The `sugar_flag` uses a **per-serving threshold of 12g total sugar**. This threshold is chosen because:

- It aligns with common nutrition app thresholds for flagging high-sugar foods
- It is actionable for the garden mechanic's `sugar_free` goal (which checks `sugar_flag_snapshot` per food log entry)
- A per-serving threshold is more user-relevant than a per-100g threshold for tracking purposes

## Micronutrient Fields (per serving)

| Column           | Type           | Nullable | Constraints | Description                                                                                | Unit                       |
| ---------------- | -------------- | -------- | ----------- | ------------------------------------------------------------------------------------------ | -------------------------- |
| `sodium_mg`      | `DECIMAL(7,2)` | Yes      | —           | Sodium content                                                                             | milligrams                 |
| `cholesterol_mg` | `DECIMAL(6,2)` | Yes      | —           | Cholesterol content                                                                        | milligrams                 |
| `calcium_mg`     | `DECIMAL(6,2)` | Yes      | —           | Calcium content                                                                            | milligrams                 |
| `iron_mg`        | `DECIMAL(5,2)` | Yes      | —           | Iron content                                                                               | milligrams                 |
| `potassium_mg`   | `DECIMAL(7,2)` | Yes      | —           | Potassium content                                                                          | milligrams                 |
| `vitamin_a`      | `VARCHAR(50)`  | Yes      | —           | Vitamin A content. Stored as string to accommodate different units (IU, mcg RAE) and "N/A" | `"900 mcg RAE"` or `"N/A"` |
| `vitamin_c`      | `VARCHAR(50)`  | Yes      | —           | Vitamin C content in mg. Stored as string to allow "N/A"                                   | `"45 mg"` or `"N/A"`       |

> **Why `vitamin_a` and `vitamin_c` are VARCHAR, not DECIMAL:**
> Different sources report Vitamin A in different units (IU vs. mcg RAE). Rather than force a lossy conversion at import time, the string preserves the original unit. Application-layer display logic handles formatting. For records where the vitamin data is unavailable, `"N/A"` is stored rather than NULL — NULL means "field not applicable," while `"N/A"` means "applicable but data unavailable."

## Metadata Fields

| Column               | Type           | Nullable | Constraints | Description                                | Example                                                                                      |
| -------------------- | -------------- | -------- | ----------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `allergens`          | `VARCHAR(500)` | Yes      | —           | Known allergens, comma-separated           | `Gluten, Dairy, Nuts`                                                                        |
| `dietary_type`       | `VARCHAR(255)` | Yes      | —           | Dietary classification(s), comma-separated | `Halal`, `Halal, Vegetarian`, `Vegan, Gluten-Free`                                           |
| `ingredients`        | `TEXT`         | Yes      | —           | Major ingredients in the dish              | `Chicken, Basmati Rice, Yogurt, Onions, Tomatoes, Spices, Ghee`                              |
| `preparation_method` | `VARCHAR(100)` | Yes      | —           | Primary cooking method                     | `Fried`, `Boiled`, `Baked`, `Grilled`, `Steamed`, `Slow-Cooked`, `Raw`, `Roasted`, `Sautéed` |

## Provenance & Quality Fields

| Column             | Type           | Nullable | Constraints            | Description                                                       | Example                                                           |
| ------------------ | -------------- | -------- | ---------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| `source_1`         | `VARCHAR(255)` | Yes      | —                      | Primary data source reference                                     | `USDA FoodData Central #169761`                                   |
| `source_2`         | `VARCHAR(255)` | Yes      | —                      | Secondary verification source                                     | `Pakistan FCT 2001, p.42`                                         |
| `source_3`         | `VARCHAR(255)` | Yes      | —                      | Optional tertiary source                                          | `FAO/INFOODS`                                                     |
| `confidence_score` | `INT`          | Yes      | CHECK 0–100            | Confidence in nutritional accuracy                                | `90`                                                              |
| `verified`         | `CHAR(1)`      | Yes      | DEFAULT 'N', CHECK Y/N | Whether values were cross-verified against 2+ independent sources | `Y`                                                               |
| `notes`            | `TEXT`         | Yes      | —                      | Assumptions, caveats, methodology                                 | `Estimated from recipe calculation; ghee quantity varies by cook` |

### Confidence Score Rubric

| Score Range | Meaning                                                                               | Typical Source                                         |
| ----------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 90–100      | Directly measured, lab-analyzed value from authoritative database                     | USDA Foundation Foods, national FCTs with lab analysis |
| 80–89       | Authoritative database value, may involve minor conversion or serving size adjustment | USDA SR Legacy, USDA Survey Foods                      |
| 70–79       | Cross-verified between two authoritative sources with minor discrepancies             | USDA + Pakistan FCT agreement                          |
| 60–69       | Estimated from standardized recipe using ingredient-level USDA data + yield factors   | EuroFIR recipe calculation method                      |
| 50–59       | Single authoritative source, no cross-verification available                          | Pakistan FCT only, no USDA equivalent                  |
| 40–49       | Estimated from similar dish with ingredient adjustments                               | Adapted from related USDA entry                        |
| < 40        | Low confidence; flagged for manual review                                             | Limited data, significant assumptions                  |

## Timestamp Fields

| Column       | Type        | Nullable | Constraints   | Description               |
| ------------ | ----------- | -------- | ------------- | ------------------------- |
| `created_at` | `TIMESTAMP` | Yes      | DEFAULT NOW() | Record creation timestamp |
