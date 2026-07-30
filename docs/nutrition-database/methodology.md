# Methodology — Health Garden Nutrition Database

> Document version: 1.0 | Date: 2026-07-29
> Covers the data collection, verification, normalization, and quality assurance processes
> used to build the Health Garden master nutrition database.

---

## 1. Data Collection Process

### 1.1 Source Hierarchy

Every food record follows a strict source-priority hierarchy. Higher-priority sources are always consulted first; lower sources are used only when higher ones lack data for a specific dish.

| Priority | Source                                         | Type                           | Coverage                                                                                   |
| -------- | ---------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| 1        | USDA FoodData Central                          | Government database (USA)      | ~400,000+ foods; strong coverage of raw ingredients, branded foods, and some ethnic dishes |
| 2        | Pakistan Food Composition Table (Revised 2001) | Government database (Pakistan) | ~400 raw/basic Pakistani foods; limited composite dish coverage                            |
| 3        | India IFCT 2017                                | Government database (India)    | ~700 Indian foods; useful for dishes shared between Pakistani and Indian cuisine           |
| 4        | FAO/INFOODS databases                          | International organization     | Global coverage; regional databases for specific food systems                              |
| 5        | Manufacturer data                              | Industry                       | Packaged/branded foods only (e.g., Rooh Afza by Hamdard)                                   |

### 1.2 Search Strategy

For each food item, the following search process was executed:

1. **Direct search in USDA FoodData Central** using the dish name and common variants
2. **If not found as a composite dish**: search for the primary ingredients individually
3. **Cross-reference with Pakistan FCT 2001** for Pakistani-specific items
4. **Cross-reference with India IFCT 2017** for shared South Asian dishes
5. **For branded items**: check manufacturer nutritional labels

### 1.3 Data Not Found Protocol

When no authoritative source exists for a specific dish (common for traditional composite Pakistani dishes):

1. **Identify a standardized recipe** from authoritative Pakistani cooking references
2. **Break down into individual ingredients** with gram weights
3. **Source each ingredient's nutrition** from USDA FoodData Central
4. **Apply cooking yield and retention factors** (see §2.2)
5. **Sum and divide by number of servings**
6. **Label the result** as `"Estimated from recipe calculation"` in the notes field
7. **Assign confidence score** 60–75% (see §3)

---

## 2. Recipe Calculation Methodology

### 2.1 EuroFIR Recipe Calculation Method

For composite dishes not found in any authoritative database, the EuroFIR (European Food Information Resource) recipe calculation method is applied:

```
Nutrient_per_serving = Σ (ingredient_weight_g × nutrient_per_100g / 100 × retention_factor) / number_of_servings
```

### 2.2 Cooking Yield and Retention Factors

The following standard factors are applied based on preparation method:

| Preparation Method       | Weight Yield Factor          | Protein Retention | Fat Change               | Vitamin C Retention |
| ------------------------ | ---------------------------- | ----------------- | ------------------------ | ------------------- |
| Boiling (vegetables)     | 0.90                         | 1.00              | 1.00                     | 0.50                |
| Boiling (grains/legumes) | 2.00–2.50 (water absorption) | 1.00              | 1.00                     | 0.70                |
| Frying (deep)            | 0.80–0.85                    | 0.95              | +oil absorption (10–15%) | 0.30                |
| Frying (shallow)         | 0.85–0.90                    | 0.98              | +oil absorption (5–10%)  | 0.40                |
| Grilling                 | 0.75–0.80                    | 0.98              | -fat drip (5–15%)        | 0.50                |
| Baking                   | 0.85–0.90                    | 0.98              | 0.95                     | 0.60                |
| Steaming                 | 0.95                         | 1.00              | 1.00                     | 0.70                |
| Slow-cooking             | 0.85                         | 0.95              | 0.95                     | 0.40                |
| Raw                      | 1.00                         | 1.00              | 1.00                     | 1.00                |

_Sources: USDA Table of Nutrient Retention Factors (Release 6, 2007); EuroFIR compilation procedures._

### 2.3 Standardized Recipe Sources

For Pakistani dishes requiring recipe calculation, the following recipe references were prioritized:

1. Published Pakistani cookbooks with measured ingredient lists
2. University of Punjab/NUST nutrition research publications
3. Standardized recipes from Pakistani nutrition research papers (e.g., Progress in Nutrition journal)
4. Consensus recipes from multiple authoritative sources

### 2.4 Limitations of Recipe Calculation

- **Oil/ghee variability**: Pakistani cooking uses widely varying amounts of oil/ghee. Values represent a "moderate" preparation unless noted otherwise.
- **Ingredient quality**: Nutrient content of the same ingredient can vary by region, season, and variety (e.g., buffalo milk vs. cow milk).
- **Home vs. restaurant**: Restaurant preparations typically use 30–50% more oil/ghee than home cooking.
- **Spice nutrients**: Micronutrient contributions from spices are included only when quantity is significant (>5g per serving).

---

## 3. Confidence Scoring Rubric

Each record receives a confidence score (0–100) based on data provenance:

| Score  | Classification          | Criteria                                                                                            |
| ------ | ----------------------- | --------------------------------------------------------------------------------------------------- |
| 90–100 | Lab-analyzed            | Directly from USDA Foundation Foods or national FCTs with documented lab analysis                   |
| 85–89  | Authoritative direct    | USDA SR Legacy, USDA Survey Foods, or equivalent national database entry for the specific food item |
| 80–84  | Authoritative adapted   | Authoritative source for a closely related food, with minor serving size or preparation adjustment  |
| 75–79  | Cross-verified estimate | Two independent authoritative sources agree within ±10% for key macronutrients                      |
| 70–74  | Single-source estimate  | One authoritative source, or recipe calculation cross-verified against a secondary source           |
| 65–69  | Recipe-calculated       | Estimated from standardized recipe using USDA ingredient data + yield factors                       |
| 60–64  | Adapted estimate        | Based on a similar dish with ingredient-level adjustments                                           |
| 50–59  | Low-confidence          | Limited data; significant assumptions made; flagged for manual review                               |
| <50    | Review required         | Insufficient data; record should not be used without verification                                   |

---

## 4. Verification and Cross-Referencing Process

### 4.1 Cross-Verification Criteria

A record is marked `verified = 'Y'` when:

- **Two or more independent authoritative sources** agree on key macronutrients (calories, protein, carbs, fat) within ±15%
- OR the food has a **direct USDA FoodData Central entry** with lab-analyzed values

### 4.2 Discrepancy Resolution

When multiple authoritative sources disagree:

1. **Document the discrepancy** in the `notes` field
2. **Prefer lab-analyzed data** over calculated/estimated data
3. **Prefer the more recent source** if both are lab-analyzed
4. **Use the median value** if three or more sources are available
5. **When in doubt, use the more conservative (higher calorie) estimate** — erring on the side of caution for health tracking

---

## 5. Normalization and Standardization Rules

### 5.1 Serving Size Standardization

- **Pakistani dishes**: Portions based on common Pakistani serving ware (katori ≈ 150–200g, plate ≈ 250–350g)
- **Breads**: Per piece (1 roti, 1 naan, 1 paratha) at standard size
- **Beverages**: Per cup (200ml) for hot drinks, per glass (250ml) for cold drinks
- **Snacks**: Per typical serving (number of pieces at standard size)
- **Fruits**: Per medium whole fruit or per cup
- **International dishes**: Per standard restaurant serving

### 5.2 Unit Consistency

| Measure                                 | Unit                                     | Precision          |
| --------------------------------------- | ---------------------------------------- | ------------------ |
| Energy                                  | kcal                                     | Integer            |
| Macronutrients                          | grams (g)                                | 2 decimal places   |
| Sodium, Cholesterol, Calcium, Potassium | milligrams (mg)                          | 2 decimal places   |
| Iron                                    | milligrams (mg)                          | 2 decimal places   |
| Vitamin A                               | IU (as string, preserving original unit) | Original precision |
| Vitamin C                               | mg (as string)                           | Original precision |
| Serving weight                          | grams                                    | 2 decimal places   |

### 5.3 Sugar Flag Rule

`sugar_flag = 'Y'` when `sugar_g > 12` per the standard serving.

Rationale: 12g per serving is a commonly used threshold in nutrition tracking applications. It aligns with the Health Garden app's `sugar_free` garden goal, which checks `sugar_flag_snapshot` per food log entry.

### 5.4 Naming Conventions

- **dish_name**: Official English name, Title Case, most commonly recognized form
- **urdu_name**: Unicode Urdu script (right-to-left)
- **cuisine**: Singular form (e.g., "Pakistani" not "Pakistani/South Asian")
- **category**: Meal time or food type
- **subcategory**: Dish type or preparation category
- **allergens**: Comma-separated, Title Case
- **dietary_type**: Comma-separated, Title Case

---

## 6. Quality Assurance Checks

### 6.1 Automated Checks (Built into seed script)

1. **Caloric consistency**: `|calories_kcal - (protein_g × 4 + carbohydrates_g × 4 + fat_g × 9)| < 20%`
2. **No negative values** for any nutritional field
3. **No null required fields** (dish_name, portion_unit, calories_kcal, protein_g, carbohydrates_g, fat_g)
4. **Duplicate detection**: No two records with identical dish_name + region_variant
5. **Sugar flag consistency**: sugar_flag matches sugar_g > 12 rule
6. **Confidence score range**: All scores between 0 and 100

### 6.2 Manual Checks

1. **Serving size plausibility**: 1 roti ≈ 40–60g, 1 naan ≈ 80–100g, 1 katori ≈ 150–200g
2. **Urdu name correctness**: Verified against common usage
3. **Allergen completeness**: Cross-checked against ingredient list
4. **Dietary type accuracy**: Verified (e.g., all meat dishes marked Halal, no dairy in Vegan items)

---

## 7. Known Limitations

1. **Pakistan FCT 2001 is dated**: The most recent comprehensive Pakistani food composition table is from 2001. Newer data exists only for specific studies.
2. **Composite dish variability**: Traditional dishes like biryani, karahi, and nihari have no standardized recipe. Values represent a "typical home-cooked" preparation.
3. **Oil/ghee amounts**: This is the single largest source of variability in Pakistani cuisine. Restaurant versions may have 2–3x more fat than home-cooked versions.
4. **Micronutrient gaps**: Some traditional dishes lack micronutrient data (Vitamin A, Vitamin C, potassium). These are marked with "N/A" when unavailable.
5. **Buffalo vs. cow milk**: Pakistani cuisine predominantly uses buffalo milk, which is higher in fat than cow milk. USDA data is based on cow milk. Adjustments are noted where applicable.
6. **Regional variation**: A "Chicken Karahi" in Lahore may differ from one in Karachi. Where significant nutritional differences exist, separate records are created.
