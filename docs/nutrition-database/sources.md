# Sources Registry — Health Garden Nutrition Database

> All sources consulted during the construction of the master nutrition database,
> organized by type and with access information.

---

## Government Databases

| Source                                             | Country       | URL / Access                                                               | Usage in this Database                                                                                                                                                               |
| -------------------------------------------------- | ------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **USDA FoodData Central**                          | USA           | https://fdc.nal.usda.gov/                                                  | **Primary source** for ~70% of records. Provides lab-analyzed data for raw ingredients and many prepared foods. Used for both direct entries and recipe-calculation ingredient data. |
| **Pakistan Food Composition Table (Revised 2001)** | Pakistan      | Available via FAO/INFOODS directory; PDF copies on ResearchGate and Scribd | **Secondary/verification source** for Pakistani dishes. Provides per-100g data for ~400 basic Pakistani food items. Limited coverage of composite dishes.                            |
| **India Food Composition Table (IFCT 2017)**       | India         | National Institute of Nutrition, Hyderabad                                 | **Supplementary source** for South Asian dishes shared between Pakistan and India (e.g., biryani, butter chicken, paneer dishes).                                                    |
| **FAO/INFOODS**                                    | International | https://www.fao.org/infoods/infoods/en/                                    | **Reference framework** for methodology (food description, nutrient identification) and access to regional food composition tables.                                                  |

## Scientific & Academic Sources

| Source                                                           | Institution                                          | Usage                                                                                |
| ---------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| USDA Table of Nutrient Retention Factors (Release 6, 2007)       | USDA Agricultural Research Service                   | Cooking yield and retention factors used in recipe calculations                      |
| EuroFIR Recipe Calculation Procedures                            | European Food Information Resource Network           | Standardized methodology for calculating composite dish nutrition from ingredients   |
| "Nutritional assessment of commonly consumed dishes in Pakistan" | University of Punjab / Progress in Nutrition journal | Reference for standardized recipes and portion sizes of traditional Pakistani dishes |
| "Development of food exchange lists for Pakistani adults"        | Mattioli 1885 Journals                               | Exchange list methodology for Pakistani meal planning                                |

## Manufacturer Data

| Manufacturer                        | Product(s)      | Usage                                                                 |
| ----------------------------------- | --------------- | --------------------------------------------------------------------- |
| **Hamdard Laboratories (Pakistan)** | Rooh Afza Syrup | Nutritional label data for Rooh Afza (with water / with milk) entries |

## Nutrition Reference Organizations

| Organization                        | Usage                                                                 |
| ----------------------------------- | --------------------------------------------------------------------- |
| **WHO (World Health Organization)** | Sugar intake guidelines informing the sugar_flag threshold discussion |
| **British Nutrition Foundation**    | Reference framework for portion size guidance                         |
| **Health Canada**                   | Cross-reference for nutritional data validation                       |

## Cross-Reference & Validation Tools

| Tool / Database    | URL                             | Usage                                                  |
| ------------------ | ------------------------------- | ------------------------------------------------------ |
| NutritionValue.org | https://www.nutritionvalue.org/ | Secondary validation cross-reference (uses USDA data)  |
| MyFoodData.com     | https://www.myfooddata.com/     | Secondary validation cross-reference (uses USDA data)  |
| FoodStruct.com     | https://www.foodstruct.com/     | Comparative nutritional analysis between similar foods |

---

## Source Quality Assessment

| Source Tier                                  | Sources                                                       | Reliability | Notes                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| **Tier 1 — Lab-analyzed government data**    | USDA FoodData Central (Foundation Foods, SR Legacy)           | Highest     | Lab-analyzed with documented methodology. Gold standard.                                |
| **Tier 2 — Government compiled data**        | Pakistan FCT 2001, India IFCT 2017, USDA Survey/Branded Foods | High        | Government-compiled but may include industry-submitted data (Branded Foods).            |
| **Tier 3 — International organization data** | FAO/INFOODS databases                                         | High        | Compiled from national submissions; quality varies by contributing country.             |
| **Tier 4 — Manufacturer data**               | Product labels (e.g., Hamdard)                                | Medium-High | Legally required accuracy but may round values; limited to that specific product.       |
| **Tier 5 — Calculated from ingredients**     | This database's recipe calculations                           | Medium      | Dependent on recipe accuracy, yield factors, and oil/ghee assumptions. Clearly labeled. |

---

## Sources NOT Used (and Why)

| Source                                  | Reason for Exclusion                                                  |
| --------------------------------------- | --------------------------------------------------------------------- |
| MyFitnessPal / user-generated databases | Crowdsourced; no quality control; frequent errors and inconsistencies |
| Wikipedia nutritional tables            | Not a primary source; references may be outdated or incorrect         |
| Social media nutrition claims           | No verification process; often misleading or context-free             |
| Unverified mobile app databases         | Unknown data provenance; may mix measured and guessed values          |

> **Policy**: When community/crowdsourced sources are used to _identify_ dishes that should be in the database, nutritional values are still sourced exclusively from Tier 1–4 sources or calculated using the documented recipe methodology.
