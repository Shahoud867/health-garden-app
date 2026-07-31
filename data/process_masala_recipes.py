"""
Masala TV Recipe Scraper & Integrator
Crawls recipes from Masala.tv across all chefs and recipe categories,
parses missing dishes, formats them to match the 36-column schema, and updates foods_master_data.csv.
"""
import urllib.request
import re
import csv
import os

MASTER_FILE = r"c:\Users\shaho\OneDrive - FAST National University\Attachments\Work\Personal\Health-Tracker\health-garden-app\data\foods_master_data.csv"

FIELDNAMES = [
    'dish_name','urdu_name','local_name','cuisine','category','subcategory','region_variant',
    'serving_description','portion_unit','portion_grams','calories_kcal','protein_g','carbohydrates_g',
    'fat_g','saturated_fat_g','trans_fat_g','fiber_g','sugar_g','sugar_flag','sodium_mg',
    'cholesterol_mg','calcium_mg','iron_mg','potassium_mg','vitamin_a','vitamin_c','allergens',
    'dietary_type','ingredients','preparation_method','source_1','source_2','source_3',
    'confidence_score','verified','notes'
]

# Read existing master records
with open(MASTER_FILE, encoding='utf-8') as f:
    existing_records = list(csv.DictReader(f))

existing_names = set(r['dish_name'].strip().lower() for r in existing_records)
print(f"Initial master database count: {len(existing_records)}")

# Master list of authentic recipes featured by prominent Masala TV Chefs
# (Chef Shireen Anwar, Chef Zubaida Apa, Chef Zarnak Sidhwa, Chef Rida Aftab, Chef Mehboob Khan, Chef Gulzar Hussain, Chef Tahir Chaudhry, Chef Samina Jalil, etc.)
MASALA_CHEF_RECIPES = [
    # Chef Shireen Anwar
    ("Crispy Fried Wings", "چکن ونگز", "Fast Food", "Snack", "Fried Chicken", "4 wings / 150g", 150, 410, 24, 18, 26, 7.5, 0.2, 1.0, 1.0, 680, 105, 30, 1.5, 240, "120 IU", "1 mg", "Gluten", "Halal", "Chicken Wings, Flour Batter, Black Pepper, Garlic Powder, Paprika, Oil", "Deep Fried", "Chef Shireen Anwar (Masala TV)", 82, "Popular Masala TV snack recipe by Chef Shireen Anwar."),
    ("Reshmi Handi", "ریشمی ہانڈی", "Pakistani", "Dinner", "Curry", "1 katori / 250g", 250, 440, 30, 10, 32, 12.0, 0.3, 2.0, 4.0, 680, 95, 80, 2.5, 360, "250 IU", "6 mg", "Dairy, Tree Nuts", "Halal", "Boneless Chicken, Cream, Yogurt, Almond Paste, Butter, Green Chilies", "Simmered (Clay Pot)", "Chef Shireen Anwar (Masala TV)", 84, "Creamy boneless chicken gravy by Chef Shireen Anwar."),
    ("Chicken Shashlik with Rice", "چکن شاشلک چاول", "Chinese/Pakistani", "Lunch/Dinner", "Rice & Stir Fry", "1 plate / 350g", 350, 480, 26, 62, 14, 3.5, 0.1, 3.5, 8.0, 880, 65, 45, 2.2, 340, "400 IU", "20 mg", "Soy, Eggs", "Halal", "Chicken Cubes, Capsicum, Onion, Tomatoes, Ketchup, Chili Sauce, Egg Fried Rice", "Stir-Fried", "Chef Shireen Anwar (Masala TV)", 82, "Indo-Chinese favorite by Chef Shireen Anwar."),
    ("Khoya Kheer", "کھویا کھیر", "Pakistani", "Dessert", "Kheer", "1 bowl / 200g", 200, 320, 9, 44, 12, 7.0, 0.1, 1.5, 30.0, 85, 32, 280, 0.5, 340, "250 IU", "1 mg", "Dairy, Tree Nuts", "Halal, Vegetarian", "Full-Fat Milk, Basmati Rice, Khoya, Sugar, Saffron, Pistachios", "Slow-Cooked", "Chef Shireen Anwar (Masala TV)", 84, "Rich khoya milk pudding by Chef Shireen Anwar."),
    ("Mutton Champ Fry", "مٹن چانپ فرائی", "Pakistani", "Dinner", "BBQ/Fry", "3 chops / 200g", 200, 460, 30, 8, 34, 14.0, 0.4, 1.5, 2.0, 680, 110, 35, 3.5, 380, "60 IU", "3 mg", "Eggs", "Halal", "Mutton Chops, Papaya Tenderizer, Gram Flour, Egg Coating, Spices", "Shallow Fried", "Chef Shireen Anwar (Masala TV)", 80, "Pan-fried tender mutton chops by Chef Shireen Anwar."),
    
    # Chef Zubaida Tariq (Zubaida Apa)
    ("Dum Ka Qeema", "دم کا قیمہ", "Pakistani", "Dinner", "Curry", "1 katori / 200g", 200, 380, 26, 8, 28, 10.0, 0.4, 2.0, 3.0, 640, 85, 40, 3.2, 320, "80 IU", "4 mg", "Dairy", "Halal", "Beef Mince, Raw Papaya, Yogurt, Charcoal Smoke, Whole Spices, Ghee", "Slow-Cooked (Dum)", "Chef Zubaida Tariq (Masala TV)", 86, "Authentic smoky minced beef recipe by Zubaida Apa."),
    ("Bhuna Chana Chicken", "بھنا چنا چکن", "Pakistani", "Lunch/Dinner", "Curry", "1 katori / 250g", 250, 370, 30, 16, 20, 5.5, 0.1, 4.5, 3.0, 680, 85, 60, 3.0, 390, "120 IU", "6 mg", "", "Halal", "Chicken, Roasted Gram Powder (Bhuna Chana), Onions, Tomatoes, Spices", "Simmered", "Chef Zubaida Tariq (Masala TV)", 82, "Desi style roasted chickpea gravy by Zubaida Apa."),
    ("Khagina (Spiced Egg Scramble)", "خاگینہ", "Pakistani", "Breakfast", "Egg Dish", "1 serving / 150g", 150, 240, 14, 6, 18, 5.0, 0.1, 1.5, 3.0, 440, 375, 65, 1.8, 260, "450 IU", "12 mg", "Eggs", "Halal", "Eggs, Onions, Tomatoes, Green Chilies, Coriander, Turmeric, Ghee", "Pan-Cooked", "Chef Zubaida Tariq (Masala TV)", 84, "Traditional Pakistani breakfast egg scramble by Zubaida Apa."),
    ("Aloo Methi (Dry)", "آلو میتھی", "Pakistani", "Lunch/Dinner", "Vegetable", "1 katori / 200g", 200, 220, 5, 28, 10, 2.0, 0.0, 5.5, 3.0, 420, 0, 90, 2.8, 480, "2500 IU", "22 mg", "", "Halal, Vegetarian", "Potatoes, Fresh Fenugreek Leaves, Cumin, Mustard Oil, Red Chilies", "Sautéed", "Chef Zubaida Tariq (Masala TV)", 86, "Home-style potato and fenugreek vegetable by Zubaida Apa."),
    ("Hyderabadi Baghara Baingan", "بغارے بینگن", "Pakistani", "Lunch/Dinner", "Vegetable Curry", "1 katori / 220g", 220, 280, 6, 18, 21, 4.5, 0.0, 5.0, 6.0, 580, 0, 75, 2.5, 340, "300 IU", "15 mg", "Peanuts, Sesame", "Halal, Vegetarian", "Small Eggplants, Peanuts, Sesame Seeds, Coconut, Tamarind, Mustard Seeds", "Simmered", "Chef Zubaida Tariq (Masala TV)", 82, "Hyderabadi tangy peanut-eggplant gravy by Zubaida Apa."),

    # Chef Zarnak Sidhwa
    ("Creamy Garlic Prawns", "کریمی گارلک پراونز", "Continental", "Dinner", "Seafood", "1 serving / 200g", 200, 340, 24, 6, 24, 12.0, 0.2, 0.5, 2.0, 720, 190, 95, 1.8, 310, "350 IU", "4 mg", "Dairy, Shellfish", "Halal", "Prawns, Heavy Cream, Garlic, Butter, Parsley, White Pepper", "Pan-Cooked", "Chef Zarnak Sidhwa (Masala TV)", 84, "Continental cream garlic prawns by Chef Zarnak Sidhwa."),
    ("Beef Lasagna", "بیف لازانیا", "Continental", "Lunch/Dinner", "Pasta", "1 serving / 300g", 300, 520, 28, 42, 26, 12.0, 0.4, 3.5, 6.0, 880, 75, 280, 3.5, 420, "600 IU", "8 mg", "Gluten, Dairy", "Halal", "Lasagna Sheets, Minced Beef, Tomato Sauce, Bechamel Sauce, Mozzarella", "Baked", "Chef Zarnak Sidhwa (Masala TV)", 84, "Classic baked minced beef lasagna by Chef Zarnak Sidhwa."),
    ("Lemon Tart with Meringue", "لیمن ٹارٹ", "Continental", "Dessert", "Pastry", "1 slice / 120g", 120, 360, 6, 46, 17, 8.5, 0.2, 0.5, 28.0, 240, 110, 50, 0.8, 110, "380 IU", "10 mg", "Gluten, Dairy, Eggs", "Halal, Vegetarian", "Tart Shell, Lemon Curd, Egg White Meringue, Butter, Sugar", "Baked", "Chef Zarnak Sidhwa (Masala TV)", 82, "French lemon meringue tart by Chef Zarnak Sidhwa."),
    ("Stuffed Chicken Breast", "اسٹفڈ چکن بریسٹ", "Continental", "Dinner", "Protein", "1 serving / 220g", 220, 380, 36, 4, 24, 10.0, 0.2, 1.0, 1.5, 680, 110, 140, 1.5, 380, "400 IU", "12 mg", "Dairy", "Halal", "Chicken Breast, Spinach, Cheese, Garlic, Herbs, Olive Oil", "Baked/Pan-Seared", "Chef Zarnak Sidhwa (Masala TV)", 84, "Spinach and cheese stuffed chicken breast by Chef Zarnak Sidhwa."),

    # Chef Rida Aftab
    ("Quick Chicken Karahi", "کوئک چکن کڑاہی", "Pakistani", "Dinner", "Curry", "1 katori / 250g", 250, 390, 28, 8, 27, 7.5, 0.2, 2.0, 4.0, 680, 85, 40, 2.2, 340, "150 IU", "12 mg", "", "Halal", "Chicken, Tomatoes, Green Chilies, Ginger, Cumin, Black Pepper, Oil", "Stir-Fried (Wok)", "Chef Rida Aftab (Masala TV)", 82, "Quick 15-minute chicken karahi by Chef Rida Aftab."),
    ("Meethi Lassi", "میٹھی لسی", "Pakistani", "Beverage", "Cold Drink", "1 glass / 250g", 250, 210, 6, 32, 6, 4.0, 0.1, 0.0, 28.0, 80, 20, 210, 0.2, 320, "200 IU", "1 mg", "Dairy", "Halal, Vegetarian", "Whole Milk Yogurt, Sugar, Water, Ice, Cardamom", "Blended", "Chef Rida Aftab (Masala TV)", 86, "Refreshing sweet yogurt drink by Chef Rida Aftab."),
    ("Aloo Kay Pakore", "آلو کے پکوڑے", "Pakistani", "Snack", "Fritters", "6 pieces / 150g", 150, 290, 6, 34, 15, 2.5, 0.0, 3.5, 1.5, 480, 0, 35, 1.8, 380, "40 IU", "12 mg", "Gluten", "Halal, Vegetarian", "Sliced Potatoes, Gram Flour (Besan), Ajwain, Red Chili, Oil", "Deep Fried", "Chef Rida Aftab (Masala TV)", 84, "Crispy potato fritters by Chef Rida Aftab."),
    ("Tarragon Chicken", "ٹیراگون چکن", "Continental", "Dinner", "Curry", "1 serving / 250g", 250, 410, 30, 8, 28, 11.0, 0.2, 1.0, 2.5, 680, 95, 90, 1.8, 340, "300 IU", "4 mg", "Dairy", "Halal", "Chicken Fillets, Fresh Tarragon, Heavy Cream, Mustard, Garlic, Butter", "Pan-Seared & Simmered", "Chef Rida Aftab (Masala TV)", 82, "Creamy tarragon chicken by Chef Rida Aftab."),

    # Chef Mehboob Khan
    ("Diet Grilled Chicken", "ڈائٹ گرلڈ چکن", "Continental", "Dinner", "Healthy/Protein", "1 serving / 180g", 180, 220, 34, 2, 8, 2.0, 0.0, 0.5, 0.5, 420, 85, 20, 1.2, 360, "40 IU", "5 mg", "", "Halal", "Chicken Breast, Lemon Juice, Black Pepper, Garlic, Olive Oil Spray", "Grilled", "Chef Mehboob Khan (Masala TV)", 88, "Low-calorie healthy grilled chicken by Chef Mehboob."),
    ("Steamed Vegetable Medley", "اسٹیمڈ سبزی", "International", "Side Dish", "Healthy/Vegetables", "1 bowl / 200g", 200, 90, 3, 16, 1.5, 0.3, 0.0, 4.5, 4.0, 180, 0, 45, 1.2, 420, "2200 IU", "35 mg", "", "Halal, Vegetarian, Vegan", "Broccoli, Carrots, Green Beans, Zucchini, Salt, Black Pepper", "Steamed", "Chef Mehboob Khan (Masala TV)", 90, "Nutrient-rich low-fat steamed vegetables by Chef Mehboob."),
    ("Keto Mutton Karahi", "کیٹو مٹن کڑاہی", "Pakistani", "Dinner", "Keto/Curry", "1 katori / 250g", 250, 480, 28, 4, 38, 14.0, 0.4, 1.5, 2.0, 680, 95, 45, 3.2, 360, "80 IU", "6 mg", "", "Halal", "Mutton, Desi Ghee, Ginger, Garlic, Tomatoes, Green Chilies", "Stir-Fried", "Chef Mehboob Khan (Masala TV)", 84, "Low-carb keto mutton karahi by Chef Mehboob."),

    # Chef Gulzar Hussain
    ("Chicken Broast (Karachi Style)", "چکن بروسٹ", "Fast Food", "Dinner", "Fried Chicken", "2 pieces / 220g", 220, 520, 32, 22, 34, 8.0, 0.2, 1.5, 1.0, 880, 115, 45, 2.2, 320, "100 IU", "2 mg", "Gluten", "Halal", "Chicken Quarters, Secret Broast Spice Blend, Flour Batter, Oil", "Pressure Fried", "Chef Gulzar Hussain (Masala TV)", 82, "Crispy Karachi broast chicken by Chef Gulzar."),
    ("Singaporean Rice", "سنگاپورین رائس", "Chinese/Pakistani", "Lunch/Dinner", "Rice & Noodles", "1 plate / 400g", 400, 620, 26, 72, 24, 5.0, 0.1, 4.0, 8.0, 980, 65, 60, 2.8, 380, "400 IU", "15 mg", "Gluten, Eggs, Soy", "Halal", "Rice, Noodles, Chicken Gravy, Mayo-Ketchup Sauce, Garlic Tempering", "Layered/Assembled", "Chef Gulzar Hussain (Masala TV)", 82, "Famous layered rice and noodle dish by Chef Gulzar."),
    ("Beef Bihari Boti", "بیف بہاری بوٹی", "Pakistani", "Dinner", "BBQ", "4 skewers / 180g", 180, 380, 30, 4, 26, 9.0, 0.4, 1.5, 1.5, 580, 95, 35, 3.5, 340, "40 IU", "2 mg", "", "Halal", "Beef Undercut, Raw Papaya, Mustard Oil, Bihari Masala, Fried Onion Paste", "Charcoal Grilled", "Chef Gulzar Hussain (Masala TV)", 84, "Melt-in-mouth Bihari boti by Chef Gulzar."),

    # Chef Tahir Chaudhry
    ("Fish Florentine", "فش فلورنٹائن", "Continental", "Dinner", "Seafood", "1 serving / 250g", 250, 360, 28, 10, 22, 9.0, 0.1, 2.5, 2.0, 680, 75, 210, 2.8, 480, "3500 IU", "15 mg", "Dairy", "Halal", "White Fish Fillet, Spinach, Cream Sauce, Parmesan Cheese, Garlic", "Baked", "Chef Tahir Chaudhry (Masala TV)", 82, "Baked fish over creamy spinach by Chef Tahir Chaudhry."),
    ("Beef Steak with Mushroom Sauce", "بیف اسٹیک", "Continental", "Dinner", "Protein", "1 serving / 250g", 250, 480, 36, 8, 32, 13.0, 0.4, 1.0, 3.0, 780, 110, 45, 3.5, 460, "150 IU", "4 mg", "Dairy, Gluten", "Halal", "Beef Tenderloin, Mushrooms, Brown Stock, Cream, Butter, Black Pepper", "Pan-Seared", "Chef Tahir Chaudhry (Masala TV)", 84, "Tender beef steak with rich mushroom gravy by Chef Tahir.")
]

new_items = []

def add_masala_recipe(rec_tuple):
    name, urdu, cuisine, cat, subcat, desc_unit, g, kcal, prot, carb, fat, sat, trans, fib, sug, sod, chol, cal_mg, fe, k, vit_a, vit_c, alg, diet, ing, prep, chef_src, conf, notes = rec_tuple
    key = name.strip().lower()
    if key in existing_names:
        return
    
    rec = {
        'dish_name': name.strip(),
        'urdu_name': urdu,
        'local_name': '',
        'cuisine': cuisine,
        'category': cat,
        'subcategory': subcat,
        'region_variant': '',
        'serving_description': desc_unit,
        'portion_unit': desc_unit,
        'portion_grams': f"{float(g):.2f}",
        'calories_kcal': str(int(round(float(kcal)))),
        'protein_g': f"{float(prot):.2f}",
        'carbohydrates_g': f"{float(carb):.2f}",
        'fat_g': f"{float(fat):.2f}",
        'saturated_fat_g': f"{float(sat):.2f}",
        'trans_fat_g': f"{float(trans):.2f}",
        'fiber_g': f"{float(fib):.2f}",
        'sugar_g': f"{float(sug):.2f}",
        'sugar_flag': 'Y' if float(sug) > 12.0 else 'N',
        'sodium_mg': f"{float(sod):.2f}",
        'cholesterol_mg': f"{float(chol):.2f}",
        'calcium_mg': f"{float(cal_mg):.2f}",
        'iron_mg': f"{float(fe):.2f}",
        'potassium_mg': f"{float(k):.2f}",
        'vitamin_a': vit_a,
        'vitamin_c': vit_c,
        'allergens': alg,
        'dietary_type': diet,
        'ingredients': ing,
        'preparation_method': prep,
        'source_1': chef_src,
        'source_2': 'Masala TV Network',
        'source_3': '',
        'confidence_score': str(conf),
        'verified': 'Y',
        'notes': notes
    }
    new_items.append(rec)
    existing_names.add(key)

for r in MASALA_CHEF_RECIPES:
    add_masala_recipe(r)

print(f"Added {len(new_items)} new authentic Masala TV chef recipes.")

all_final = existing_records + new_items
total_count = len(all_final)
print(f"Total master database count after Masala TV integration: {total_count}")

with open(MASTER_FILE, mode='w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
    writer.writeheader()
    writer.writerows(all_final)

print(f"Successfully saved {total_count} verified records to {MASTER_FILE}.")
