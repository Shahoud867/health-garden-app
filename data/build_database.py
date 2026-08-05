import csv
import json
import os

# Script to build complete master database of 1000 food items for Health Garden

DATA_FILE = r"c:\Users\shaho\OneDrive - FAST National University\Attachments\Work\Personal\Health-Tracker\health-garden-app\data\foods_master_data.csv"

# Load existing dishes to avoid duplicates
existing_items = []
existing_names = set()

if os.path.exists(DATA_FILE):
    with open(DATA_FILE, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing_items.append(row)
            existing_names.add(row['dish_name'].strip().lower())

print(f"Loaded {len(existing_items)} existing items.")

# We will define categories and items systematically
# Required fields:
# dish_name, urdu_name, local_name, cuisine, category, subcategory, region_variant,
# serving_description, portion_unit, portion_grams, calories_kcal, protein_g, carbohydrates_g,
# fat_g, saturated_fat_g, trans_fat_g, fiber_g, sugar_g, sugar_flag, sodium_mg, cholesterol_mg,
# calcium_mg, iron_mg, potassium_mg, vitamin_a, vitamin_c, allergens, dietary_type,
# ingredients, preparation_method, source_1, source_2, source_3, confidence_score, verified, notes

new_records = []

def add_food(dish_name, urdu_name, local_name, cuisine, category, subcategory, region_variant,
             serving_desc, portion_unit, portion_grams, calories, protein, carbs, fat,
             sat_fat=0.0, trans_fat=0.0, fiber=0.0, sugar=0.0, sodium=0.0, chol=0.0,
             calc=0.0, iron=0.0, pot=0.0, vit_a="0 IU", vit_c="0 mg", allergens="",
             dietary="Halal", ingredients="", prep="", s1="USDA FoodData Central",
             s2="Pakistan FCT 2001", s3="", conf=80, verified="Y", notes=""):
    
    if dish_name.strip().lower() in existing_names:
        return
    
    sugar_flag = 'Y' if float(sugar) > 12.0 else 'N'
    
    record = {
        'dish_name': dish_name,
        'urdu_name': urdu_name,
        'local_name': local_name or '',
        'cuisine': cuisine,
        'category': category,
        'subcategory': subcategory,
        'region_variant': region_variant or '',
        'serving_description': serving_desc,
        'portion_unit': portion_unit,
        'portion_grams': f"{float(portion_grams):.2f}",
        'calories_kcal': str(int(round(float(calories)))),
        'protein_g': f"{float(protein):.2f}",
        'carbohydrates_g': f"{float(carbs):.2f}",
        'fat_g': f"{float(fat):.2f}",
        'saturated_fat_g': f"{float(sat_fat):.2f}",
        'trans_fat_g': f"{float(trans_fat):.2f}",
        'fiber_g': f"{float(fiber):.2f}",
        'sugar_g': f"{float(sugar):.2f}",
        'sugar_flag': sugar_flag,
        'sodium_mg': f"{float(sodium):.2f}",
        'cholesterol_mg': f"{float(chol):.2f}",
        'calcium_mg': f"{float(calc):.2f}",
        'iron_mg': f"{float(iron):.2f}",
        'potassium_mg': f"{float(pot):.2f}",
        'vitamin_a': vit_a,
        'vitamin_c': vit_c,
        'allergens': allergens,
        'dietary_type': dietary,
        'ingredients': ingredients,
        'preparation_method': prep,
        'source_1': s1,
        'source_2': s2,
        'source_3': s3 or '',
        'confidence_score': str(int(conf)),
        'verified': verified,
        'notes': notes
    }
    
    new_records.append(record)
    existing_names.add(dish_name.strip().lower())

print("Helper ready. Now building full dataset dictionary...")
