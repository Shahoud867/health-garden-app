import csv
import json
import os

MASTER_FILE = r"c:\Users\shaho\OneDrive - FAST National University\Attachments\Work\Personal\Health-Tracker\health-garden-app\data\foods_master_data.csv"

# Load existing dishes
existing_records = []
existing_names = set()

if os.path.exists(MASTER_FILE):
    with open(MASTER_FILE, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing_records.append(row)
            existing_names.add(row['dish_name'].strip().lower())

print(f"Initial existing records: {len(existing_records)}")

new_items = []

def add(name, urdu, local, cuisine, cat, subcat, region, desc, unit, g, kcal, p, c, f,
        sat=0, trans=0, fib=0, sug=0, sod=0, chol=0, cal=0, fe=0, k=0, vit_a="0 IU", vit_c="0 mg",
        alg="", diet="Halal", ing="", prep="", s1="USDA FoodData Central", s2="Pakistan FCT 2001", s3="",
        conf=80, ver="Y", notes=""):
    
    if name.strip().lower() in existing_names:
        return
    
    sug_flag = 'Y' if float(sug) > 12.0 else 'N'
    
    rec = {
        'dish_name': name,
        'urdu_name': urdu,
        'local_name': local or '',
        'cuisine': cuisine,
        'category': cat,
        'subcategory': subcat,
        'region_variant': region or '',
        'serving_description': desc,
        'portion_unit': unit,
        'portion_grams': f"{float(g):.2f}",
        'calories_kcal': str(int(round(float(kcal)))),
        'protein_g': f"{float(p):.2f}",
        'carbohydrates_g': f"{float(c):.2f}",
        'fat_g': f"{float(f):.2f}",
        'saturated_fat_g': f"{float(sat):.2f}",
        'trans_fat_g': f"{float(trans):.2f}",
        'fiber_g': f"{float(fib):.2f}",
        'sugar_g': f"{float(sug):.2f}",
        'sugar_flag': sug_flag,
        'sodium_mg': f"{float(sod):.2f}",
        'cholesterol_mg': f"{float(chol):.2f}",
        'calcium_mg': f"{float(cal):.2f}",
        'iron_mg': f"{float(fe):.2f}",
        'potassium_mg': f"{float(k):.2f}",
        'vitamin_a': vit_a,
        'vitamin_c': vit_c,
        'allergens': alg,
        'dietary_type': diet,
        'ingredients': ing,
        'preparation_method': prep,
        'source_1': s1,
        'source_2': s2,
        'source_3': s3 or '',
        'confidence_score': str(int(conf)),
        'verified': ver,
        'notes': notes
    }
    
    new_items.append(rec)
    existing_names.add(name.strip().lower())

# ==============================================================================
# SECTION 1: RAW INGREDIENTS & COMMODITIES (FRUITS, VEGETABLES, LEGUMES, GRAINS)
# ==============================================================================

# Fruits
add("Chaunsa Mango", "چونسا آم", "", "Pakistani", "Ingredient", "Fruit", "Punjab", "1 medium fruit", "1 Fruit", 200, 120, 1.6, 30.0, 0.8, 0.1, 0.0, 3.2, 27.0, 20.0, 0.0, 22.0, 0.3, 336.0, "2100 IU", "72 mg", "", "Halal, Vegetarian, Vegan", "Chaunsa Mango", "Raw", "Pakistan FCT 2001", "USDA FoodData Central #169910", "", 90, "Y", "Sweetest Pakistani mango variety. High sugar.")
add("Sindhri Mango", "سندھڑی آم", "", "Pakistani", "Ingredient", "Fruit", "Sindh", "1 medium fruit", "1 Fruit", 250, 150, 2.0, 38.0, 0.9, 0.1, 0.0, 4.0, 34.0, 25.0, 0.0, 28.0, 0.4, 420.0, "2600 IU", "90 mg", "", "Halal, Vegetarian, Vegan", "Sindhri Mango", "Raw", "Pakistan FCT 2001", "USDA FoodData Central #169910", "", 90, "Y", "Large oval Pakistani mango variety from Sindh.")
add("Anwar Ratol Mango", "انور رٹول آم", "", "Pakistani", "Ingredient", "Fruit", "Punjab", "1 small fruit", "1 Fruit", 120, 78, 1.0, 19.5, 0.5, 0.1, 0.0, 2.0, 17.5, 12.0, 0.0, 14.0, 0.2, 200.0, "1300 IU", "43 mg", "", "Halal, Vegetarian, Vegan", "Anwar Ratol Mango", "Raw", "Pakistan FCT 2001", "USDA FoodData Central #169910", "", 88, "Y", "Small highly aromatic Pakistani mango.")
add("Guava (Amrood)", "امرود", "", "Pakistani", "Ingredient", "Fruit", "", "1 medium fruit", "1 Fruit", 100, 68, 2.6, 14.3, 1.0, 0.3, 0.0, 5.4, 8.9, 5.0, 0.0, 18.0, 0.3, 417.0, "624 IU", "228 mg", "", "Halal, Vegetarian, Vegan", "Guava", "Raw", "USDA FoodData Central #170044", "Pakistan FCT 2001", "", 95, "Y", "Extremely high in Vitamin C and fiber.")
add("Kinoo (Mandarin Orange)", "کنو", "", "Pakistani", "Ingredient", "Fruit", "Punjab", "1 medium fruit", "1 Fruit", 120, 53, 0.9, 13.3, 0.4, 0.0, 0.0, 2.2, 10.6, 2.0, 0.0, 44.0, 0.2, 200.0, "800 IU", "64 mg", "", "Halal, Vegetarian, Vegan", "Kinoo Mandarin", "Raw", "Pakistan FCT 2001", "USDA FoodData Central #169106", "", 92, "Y", "Pakistani hybrid citrus fruit. High Vitamin C.")
add("Falsa (Grewia asiatica)", "فالسہ", "", "Pakistani", "Ingredient", "Fruit", "", "1 cup", "1 Cup", 100, 72, 1.3, 14.7, 0.9, 0.1, 0.0, 4.2, 10.0, 4.0, 0.0, 129.0, 3.1, 350.0, "400 IU", "22 mg", "", "Halal, Vegetarian, Vegan", "Falsa Berry", "Raw", "Pakistan FCT 2001", "India IFCT 2017", "", 85, "Y", "Traditional South Asian summer berry. Rich in iron and calcium.")
add("Jamun (Black Plum)", "جامن", "", "Pakistani", "Ingredient", "Fruit", "", "1 cup", "1 Cup", 100, 60, 0.7, 14.0, 0.2, 0.0, 0.0, 0.9, 10.5, 14.0, 0.0, 15.0, 1.2, 55.0, "80 IU", "18 mg", "", "Halal, Vegetarian, Vegan", "Jamun Berry", "Raw", "Pakistan FCT 2001", "India IFCT 2017", "", 88, "Y", "Summer fruit known for blood sugar regulation benefits.")
add("Shahtoot (Black Mulberry)", "شاہتوت", "", "Pakistani", "Ingredient", "Fruit", "", "1 cup", "1 Cup", 140, 60, 2.0, 13.7, 0.5, 0.0, 0.0, 2.4, 11.3, 14.0, 0.0, 55.0, 2.6, 272.0, "35 IU", "51 mg", "", "Halal, Vegetarian, Vegan", "Black Mulberry", "Raw", "USDA FoodData Central #169918", "Pakistan FCT 2001", "", 90, "Y", "Sweet dark mulberry popular in Pakistan.")
add("Khabani (Dried Apricot)", "خوبانی", "", "Pakistani", "Ingredient", "Dried Fruit", "KPK/GB", "5 pieces", "5 Pieces", 35, 84, 1.2, 22.0, 0.2, 0.0, 0.0, 2.6, 18.7, 4.0, 0.0, 19.0, 0.9, 407.0, "756 IU", "1 mg", "", "Halal, Vegetarian, Vegan", "Dried Apricots", "Dried", "USDA FoodData Central #173941", "Pakistan FCT 2001", "", 92, "Y", "Northern Pakistan sun-dried apricots.")
add("Aloo Bukhara (Dried Plum)", "آلو بخارا", "", "Pakistani", "Ingredient", "Dried Fruit", "", "4 pieces", "4 Pieces", 38, 91, 0.8, 24.3, 0.1, 0.0, 0.0, 2.7, 14.5, 1.0, 0.0, 16.0, 0.4, 280.0, "750 IU", "1 mg", "", "Halal, Vegetarian, Vegan", "Dried Plums (Prunes)", "Dried", "USDA FoodData Central #168160", "Pakistan FCT 2001", "", 92, "Y", "Dried plums used in Biryani and chutneys.")
add("Chilgoza (Pine Nuts)", "چلغوزہ", "", "Pakistani", "Ingredient", "Nut", "KPK/Balochistan", "1 oz", "1 Oz", 28, 191, 3.9, 3.7, 19.4, 4.4, 0.0, 1.0, 1.0, 1.0, 0.0, 4.5, 1.6, 169.0, "8 IU", "0.2 mg", "Tree Nuts", "Halal, Vegetarian, Vegan", "Pine Nuts", "Raw", "USDA FoodData Central #170591", "Pakistan FCT 2001", "", 92, "Y", "High-value pine nuts harvested in Waziristan/Balochistan.")

# Vegetables & Herbs
add("Sarson (Mustard Greens)", "سرساں کا ساگ", "", "Pakistani", "Ingredient", "Vegetable", "Punjab", "1 cup chopped", "1 Cup", 56, 15, 1.6, 2.7, 0.2, 0.0, 0.0, 1.8, 0.8, 14.0, 0.0, 58.0, 1.2, 198.0, "5800 IU", "39 mg", "", "Halal, Vegetarian, Vegan", "Mustard Leaves", "Raw", "USDA FoodData Central #170061", "Pakistan FCT 2001", "", 92, "Y", "Key ingredient for Punjab Sarson ka Saag.")
add("Tori (Ridge Gourd)", "توری", "", "Pakistani", "Ingredient", "Vegetable", "", "1 cup cooked", "1 Cup", 150, 30, 1.2, 6.5, 0.3, 0.1, 0.0, 2.5, 3.0, 10.0, 0.0, 30.0, 0.8, 210.0, "250 IU", "12 mg", "", "Halal, Vegetarian, Vegan", "Ridge Gourd", "Boiled", "Pakistan FCT 2001", "India IFCT 2017", "", 88, "Y", "Light summer vegetable in Pakistani households.")
add("Bhindi (Okra/Ladyfinger)", "بھنڈی", "", "Pakistani", "Ingredient", "Vegetable", "", "1 cup raw", "1 Cup", 100, 33, 1.9, 7.5, 0.2, 0.0, 0.0, 3.2, 1.5, 7.0, 0.0, 82.0, 0.6, 299.0, "716 IU", "23 mg", "", "Halal, Vegetarian, Vegan", "Okra", "Raw", "USDA FoodData Central #169260", "Pakistan FCT 2001", "", 95, "Y", "Common Pakistani vegetable staple.")
add("Baingan (Eggplant/Aubergine)", "بینگن", "", "Pakistani", "Ingredient", "Vegetable", "", "1 medium", "1 Eggplant", 200, 50, 2.0, 11.6, 0.4, 0.1, 0.0, 6.0, 7.0, 4.0, 0.0, 18.0, 0.5, 460.0, "46 IU", "4.4 mg", "", "Halal, Vegetarian, Vegan", "Eggplant", "Raw", "USDA FoodData Central #169228", "Pakistan FCT 2001", "", 95, "Y", "Used in Baingan Bharta and stuffed Baingan.")
add("Karela (Bitter Gourd)", "کریلا", "", "Pakistani", "Ingredient", "Vegetable", "", "1 medium", "1 Piece", 100, 17, 1.0, 3.7, 0.2, 0.0, 0.0, 2.8, 1.0, 5.0, 0.0, 19.0, 0.4, 319.0, "471 IU", "84 mg", "", "Halal, Vegetarian, Vegan", "Bitter Gourd", "Raw", "USDA FoodData Central #168393", "Pakistan FCT 2001", "", 92, "Y", "Popular medicinal vegetable in Pakistan.")
add("Methi Leaves (Fresh Fenugreek)", "میتھی", "", "Pakistani", "Ingredient", "Herb", "", "1 cup", "1 Cup", 50, 25, 2.2, 3.0, 0.4, 0.1, 0.0, 1.1, 0.2, 33.0, 0.0, 197.0, 9.4, 250.0, "1200 IU", "26 mg", "", "Halal, Vegetarian, Vegan", "Fenugreek Leaves", "Raw", "Pakistan FCT 2001", "India IFCT 2017", "", 90, "Y", "Aromatic herb used in Aloo Methi and Methi Gosht.")
add("Kalonji (Nigella Seeds)", "کلونجی", "", "Pakistani", "Ingredient", "Spice", "", "1 tsp", "1 Tsp", 3, 10, 0.5, 1.2, 0.5, 0.1, 0.0, 0.8, 0.0, 1.0, 0.0, 15.0, 0.3, 20.0, "0 IU", "0 mg", "", "Halal, Vegetarian, Vegan", "Nigella Sativa Seeds", "Raw", "Pakistan FCT 2001", "USDA FoodData Central", "", 85, "Y", "Prophetic seed used in naan and pickles.")
add("Ajwain (Carom Seeds)", "اجوائن", "", "Pakistani", "Ingredient", "Spice", "", "1 tsp", "1 Tsp", 3, 9, 0.4, 1.3, 0.4, 0.1, 0.0, 0.7, 0.0, 1.0, 0.0, 45.0, 0.4, 35.0, "15 IU", "0 mg", "", "Halal, Vegetarian, Vegan", "Carom Seeds", "Raw", "Pakistan FCT 2001", "India IFCT 2017", "", 85, "Y", "Digestive spice used in pakora and puri batter.")

print(f"Added raw items. Total new queued: {len(new_items)}")
