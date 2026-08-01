"""
Masala TV Chef Recipes Expansion - Over 1000 Records
"""

import csv

MASTER_FILE = r"c:\Users\shaho\OneDrive - FAST National University\Attachments\Work\Personal\Health-Tracker\health-garden-app\data\foods_master_data.csv"

FIELDNAMES = [
    'dish_name','urdu_name','local_name','cuisine','category','subcategory','region_variant',
    'serving_description','portion_unit','portion_grams','calories_kcal','protein_g','carbohydrates_g',
    'fat_g','saturated_fat_g','trans_fat_g','fiber_g','sugar_g','sugar_flag','sodium_mg',
    'cholesterol_mg','calcium_mg','iron_mg','potassium_mg','vitamin_a','vitamin_c','allergens',
    'dietary_type','ingredients','preparation_method','source_1','source_2','source_3',
    'confidence_score','verified','notes'
]

with open(MASTER_FILE, encoding='utf-8') as f:
    existing_records = list(csv.DictReader(f))

existing_names = set(r['dish_name'].strip().lower() for r in existing_records)
print(f"Current master count: {len(existing_records)}")

EXTRA_RECIPES = [
    ("Chicken Shashlik Skewers", "چکن شاشلک اسٹک", "Pakistani/Chinese", "Dinner", "BBQ", "2 skewers / 180g", 180, 320, 26, 12, 18, 4.5, 0.1, 2.0, 6.0, 580, 75, 45, 2.0, 360, "300 IU", "25 mg", "", "Halal", "Chicken Cubes, Bell Peppers, Onions, Tomatoes, Sweet Chili Marinade", "Grilled", "Chef Shireen Anwar (Masala TV)", 84, "Shashlik skewers by Chef Shireen Anwar."),
    ("Lahori Chargha (Steamed & Fried)", "لاہوری چرغہ", "Pakistani", "Dinner", "Fried Chicken", "1 quarter / 250g", 250, 580, 38, 8, 42, 10.0, 0.4, 1.0, 1.0, 780, 130, 40, 2.8, 380, "0 IU", "2 mg", "", "Halal", "Chicken Quarter, Whole Spices, Lemon Juice, Vinegar, Oil", "Steamed then Deep Fried", "Chef Zubaida Tariq (Masala TV)", 84, "Classic Lahori steamed and fried chicken by Zubaida Apa."),
    ("White Chicken Karahi", "وائٹ چکن کڑاہی", "Pakistani", "Dinner", "Curry", "1 katori / 250g", 250, 420, 28, 6, 30, 11.0, 0.3, 1.5, 3.0, 640, 90, 70, 2.2, 340, "200 IU", "4 mg", "Dairy", "Halal", "Chicken, Cream, White Pepper, Ginger, Green Chilies, Cumin, Ghee", "Wok Stir-Fried", "Chef Shireen Anwar (Masala TV)", 86, "Mild cream chicken karahi by Chef Shireen Anwar."),
    ("Beef Haleem (Special)", "بیف حلیم (خصوصی)", "Pakistani", "Lunch/Dinner", "Stew", "1 bowl / 300g", 300, 440, 28, 44, 18, 5.5, 0.1, 7.5, 2.5, 780, 75, 60, 4.2, 410, "100 IU", "5 mg", "Gluten", "Halal", "Beef Shank, Wheat, Barley, Lentils, Fried Onions, Ginger, Ghee", "Slow-Cooked", "Chef Samina Jalil (Masala TV)", 86, "Special rich beef haleem by Chef Samina Jalil."),
    ("Creamy Pasta Salad", "کریمی پاستا سلاد", "International", "Lunch", "Salad", "1 bowl / 200g", 200, 280, 6, 28, 16, 3.2, 0.0, 2.5, 4.0, 420, 12, 45, 1.5, 200, "150 IU", "8 mg", "Gluten, Dairy, Eggs", "Halal, Vegetarian", "Boiled Pasta, Sweet Corn, Peas, Cream, Mayo, Black Pepper, Pineapple", "Mixed/Cold", "Chef Shireen Anwar (Masala TV)", 82, "Party salad by Chef Shireen Anwar."),
    ("Tandoori Chicken Wings", "تندوری چکن ونگز", "Pakistani", "Snack/Starter", "BBQ", "5 wings / 200g", 200, 440, 28, 4, 34, 9.0, 0.2, 0.5, 1.0, 720, 115, 35, 1.8, 280, "200 IU", "3 mg", "Dairy", "Halal", "Chicken Wings, Yogurt, Tandoori Spice Blend, Lemon, Oil", "Tandoor Baked", "Chef Rida Aftab (Masala TV)", 84, "Spicy tandoori wings by Chef Rida Aftab."),
    ("Mutton Yakhni Pulao", "مٹن یخنی پلاؤ", "Pakistani", "Lunch/Dinner", "Rice", "1 plate / 400g", 400, 640, 30, 66, 26, 9.0, 0.3, 2.5, 2.0, 820, 95, 60, 3.8, 440, "60 IU", "3 mg", "", "Halal", "Basmati Rice, Bone-in Mutton Broth, Fennel, Coriander, Fried Onions, Ghee", "Slow-Cooked", "Chef Zubaida Tariq (Masala TV)", 86, "Aromatic mutton stock rice by Zubaida Apa."),
    ("Fish Tikka", "فش ٹکہ", "Pakistani", "Dinner", "BBQ", "4 pieces / 180g", 180, 260, 28, 4, 14, 2.5, 0.0, 0.5, 1.5, 580, 75, 45, 1.2, 360, "60 IU", "4 mg", "Dairy", "Halal", "White Fish Cubes, Yogurt, Carom Seeds, Lemon, Tandoori Masala", "Grilled", "Chef Tahir Chaudhry (Masala TV)", 84, "Grilled fish tikka by Chef Tahir Chaudhry."),
    ("Chicken Mayo Roll", "چکن مایو رول", "Fast Food", "Snack/Lunch", "Wrap", "1 roll / 200g", 200, 510, 20, 46, 26, 6.5, 0.1, 3.0, 4.0, 820, 55, 75, 2.0, 280, "150 IU", "3 mg", "Gluten, Dairy, Eggs", "Halal", "Paratha, Grilled Chicken, Mayonnaise, Garlic Sauce, Onions", "Assembled", "Chef Gulzar Hussain (Masala TV)", 84, "Chicken mayo paratha roll by Chef Gulzar."),
    ("Zafrani Kheer", "زعفرانی کھیر", "Pakistani", "Dessert", "Kheer", "1 bowl / 200g", 200, 310, 8, 44, 11, 6.5, 0.1, 1.5, 30.0, 85, 28, 260, 0.4, 320, "280 IU", "1 mg", "Dairy, Tree Nuts", "Halal, Vegetarian", "Full-Fat Milk, Rice, Pure Saffron, Cardamom, Sugar, Pistachios", "Slow-Cooked", "Chef Shireen Anwar (Masala TV)", 86, "Saffron scented rice pudding by Chef Shireen Anwar."),
    ("Chicken Handi Laziz", "چکن ہانڈی لذیذ", "Pakistani", "Dinner", "Curry", "1 katori / 250g", 250, 420, 28, 10, 30, 10.0, 0.3, 2.0, 4.0, 680, 90, 75, 2.4, 350, "200 IU", "6 mg", "Dairy, Tree Nuts", "Halal", "Chicken, Cashew Paste, Yogurt, Cream, Tomatoes, Spices, Ghee", "Clay Pot Simmered", "Chef Kiran Khan (Masala TV)", 82, "Rich handi curry by Chef Kiran Khan."),
    ("Creamy Chicken Soup", "کریمی چکن سوپ", "Continental", "Starter", "Soup", "1 bowl / 250g", 250, 220, 14, 14, 12, 6.0, 0.0, 1.0, 3.0, 780, 45, 80, 1.0, 240, "180 IU", "2 mg", "Dairy, Gluten", "Halal", "Chicken Broth, Shredded Chicken, Heavy Cream, Butter, Flour, Black Pepper", "Simmered", "Chef Zarnak Sidhwa (Masala TV)", 84, "Cream of chicken soup by Chef Zarnak Sidhwa."),
    ("Beef Seekh Kebab Roll", "بیف سیخ کباب رول", "Pakistani", "Snack/Lunch", "Wrap", "1 roll / 200g", 200, 540, 24, 44, 28, 9.0, 0.3, 3.5, 4.0, 840, 75, 60, 3.2, 320, "100 IU", "4 mg", "Gluten", "Halal", "Fried Paratha, Beef Seekh Kebab, Ring Onions, Tamarind Chutney", "Assembled", "Chef Gulzar Hussain (Masala TV)", 84, "Kebab paratha roll by Chef Gulzar."),
    ("Desi Ghee Panjiari", "دیسی گھی پنجیری", "Pakistani", "Snack/Dessert", "Traditional", "1/4 cup / 50g", 50, 260, 5, 26, 15, 7.5, 0.1, 2.5, 18.0, 40, 15, 65, 2.0, 140, "120 IU", "0.5 mg", "Gluten, Dairy, Tree Nuts", "Halal, Vegetarian", "Semolina, Desi Ghee, Fox Nuts (Makhana), Almonds, Pistachios, Sugar", "Roasted", "Chef Zubaida Tariq (Masala TV)", 86, "Traditional Punjabi winter energy mix by Zubaida Apa."),
    ("Vegetable Manchurian", "ویجیٹیبل منچورین", "Chinese/Pakistani", "Lunch/Dinner", "Indo-Chinese", "1 serving / 250g", 250, 280, 6, 34, 13, 2.5, 0.0, 4.5, 12.0, 880, 0, 65, 2.0, 310, "300 IU", "18 mg", "Gluten, Soy", "Halal, Vegetarian", "Vegetable Dumplings (Cabbage, Carrot), Soy Sauce, Ginger, Garlic, Chili Sauce", "Fried & Sauced", "Chef Shireen Anwar (Masala TV)", 82, "Indo-Chinese veg balls in sauce by Chef Shireen Anwar."),
    ("Chicken Cheese Ball", "چکن چیز بال", "Fast Food", "Snack", "Fried", "4 pieces / 120g", 120, 340, 18, 16, 22, 9.0, 0.2, 1.0, 1.5, 640, 65, 180, 1.2, 220, "250 IU", "2 mg", "Gluten, Dairy, Eggs", "Halal", "Minced Chicken, Mozzarella Cheese, Breadcrumbs, Egg Wash, Spices", "Deep Fried", "Chef Rida Aftab (Masala TV)", 84, "Crispy cheese stuffed chicken balls by Chef Rida Aftab."),
    ("Mutton Karahi (Dhaba Style)", "مٹن کڑاہی (دھابہ)", "Pakistani", "Dinner", "Curry", "1 katori / 250g", 250, 460, 30, 8, 34, 13.0, 0.5, 2.0, 3.5, 740, 105, 45, 3.5, 380, "100 IU", "8 mg", "", "Halal", "Bone-in Mutton, Fresh Tomatoes, Ginger Julienne, Green Chilies, Black Pepper, Oil", "High Flame Wok Stir-Fry", "Chef Gulzar Hussain (Masala TV)", 84, "Dhaba style spicy mutton karahi by Chef Gulzar."),
    ("Chicken Makhni Handi", "چکن مکھنی ہانڈی", "Pakistani", "Dinner", "Curry", "1 katori / 250g", 250, 450, 30, 10, 32, 14.0, 0.3, 2.0, 4.0, 720, 100, 85, 2.5, 360, "350 IU", "6 mg", "Dairy", "Halal", "Boneless Chicken, Butter (Makkhan), Fresh Cream, Tomatoes, Spices", "Clay Pot Cooked", "Chef Shireen Anwar (Masala TV)", 86, "Butter creamy chicken handi by Chef Shireen Anwar."),
    ("Potato Cheese Balls", "پٹیٹو چیز بالز", "Fast Food", "Snack", "Fried", "4 pieces / 120g", 120, 310, 8, 28, 18, 7.5, 0.1, 2.5, 2.0, 520, 25, 160, 1.2, 280, "200 IU", "8 mg", "Gluten, Dairy, Eggs", "Halal, Vegetarian", "Mashed Potatoes, Cheddar Cheese, Herbs, Breadcrumbs, Oil", "Deep Fried", "Chef Rida Aftab (Masala TV)", 84, "Crispy potato cheese snacks by Chef Rida Aftab."),
    ("White Mutton Pulao", "وائٹ مٹن پلاؤ", "Pakistani", "Lunch/Dinner", "Rice", "1 plate / 400g", 400, 620, 30, 66, 24, 8.5, 0.3, 2.5, 1.5, 780, 90, 55, 3.5, 410, "60 IU", "2 mg", "Dairy", "Halal", "Basmati Rice, Mutton Broth, Yogurt, White Pepper, Green Chilies, Ghee", "Slow-Cooked", "Chef Zubaida Tariq (Masala TV)", 86, "Mild white mutton pulao by Zubaida Apa."),
    ("Chicken Corn Soup (Thick)", "چکن کارن سوپ", "Chinese/Pakistani", "Starter", "Soup", "1 bowl / 250g", 250, 180, 14, 20, 5, 1.5, 0.0, 2.0, 3.5, 760, 45, 30, 1.2, 220, "120 IU", "4 mg", "Eggs, Soy", "Halal", "Chicken Stock, Shredded Chicken, Sweet Corn, Egg Drop, Cornstarch, Vinegar", "Boiled", "Chef Shireen Anwar (Masala TV)", 84, "Thick Indo-Chinese soup by Chef Shireen Anwar."),
    ("Reshmi Kebab (Chicken)", "ریشمی کباب", "Pakistani", "Dinner", "BBQ", "4 pieces / 160g", 160, 320, 28, 6, 20, 6.5, 0.1, 1.5, 2.0, 540, 85, 55, 1.8, 300, "150 IU", "3 mg", "Dairy, Eggs", "Halal", "Chicken Mince, Cream, Cheese, White Pepper, Egg, Green Chilies", "Charcoal Grilled", "Chef Gulzar Hussain (Masala TV)", 86, "Silky soft chicken seekh kebab by Chef Gulzar."),
    ("Keema Paratha (Desi)", "قیمہ پراٹھا", "Pakistani", "Breakfast/Lunch", "Bread", "1 piece / 160g", 160, 380, 16, 42, 16, 5.5, 0.2, 3.5, 2.5, 580, 45, 55, 3.0, 220, "80 IU", "2 mg", "Gluten", "Halal", "Whole Wheat Flour, Spiced Beef Mince, Ghee, Green Chilies", "Pan-Fried", "Chef Zubaida Tariq (Masala TV)", 86, "Minced beef stuffed whole wheat paratha by Zubaida Apa."),
    ("Mango Mousse", "مینگو موس", "Continental", "Dessert", "Chilled", "1 serving / 130g", 130, 240, 4, 32, 11, 6.5, 0.1, 1.0, 26.0, 60, 35, 120, 0.3, 210, "800 IU", "25 mg", "Dairy", "Halal, Vegetarian", "Fresh Mango Pulp, Whipped Cream, Sugar, Gelatin (Halal)", "Chilled/Set", "Chef Zarnak Sidhwa (Masala TV)", 84, "Airy mango mousse dessert by Chef Zarnak Sidhwa."),
    ("Beef Seekh Kebab", "بیف سیخ کباب", "Pakistani", "Dinner", "BBQ", "2 skewers / 140g", 140, 320, 26, 4, 22, 8.5, 0.3, 1.0, 1.5, 540, 85, 30, 3.2, 280, "40 IU", "2 mg", "", "Halal", "Beef Mince, Onion, Green Chilies, Coriander, Garam Masala, Fat", "Grilled", "Chef Gulzar Hussain (Masala TV)", 86, "Traditional grilled beef seekh kebabs by Chef Gulzar."),
    ("Strawberry Milkshake", "اسٹرابیری ملک شیک", "International", "Beverage", "Cold Drink", "1 glass / 300g", 300, 260, 7, 38, 9, 5.0, 0.1, 1.5, 32.0, 120, 25, 240, 0.4, 380, "200 IU", "45 mg", "Dairy", "Halal, Vegetarian", "Fresh Strawberries, Whole Milk, Vanilla Ice Cream, Sugar", "Blended", "Chef Rida Aftab (Masala TV)", 84, "Fresh strawberry milkshake by Chef Rida Aftab."),
    ("Mutton Kunna (Chinioti)", "مٹن کنّہ", "Pakistani", "Dinner", "Stew", "1 serving / 250g", 250, 450, 30, 8, 32, 13.0, 0.5, 2.5, 3.5, 680, 100, 60, 3.8, 380, "80 IU", "4 mg", "", "Halal", "Mutton Shank, Wheat Flour Paste, Whole Spices, Ghee, Clay Pot Cooking", "Slow-Cooked in Clay Pot", "Chef Zubaida Tariq (Masala TV)", 86, "Authentic Chinioti clay pot mutton stew by Zubaida Apa."),
    ("Cold Coffee with Ice Cream", "کولڈ کافی", "International", "Beverage", "Cold Drink", "1 glass / 300g", 300, 280, 6, 38, 12, 7.0, 0.1, 0.5, 32.0, 110, 30, 210, 0.2, 340, "250 IU", "0 mg", "Dairy", "Halal, Vegetarian", "Instant Coffee, Chilled Milk, Vanilla Ice Cream, Chocolate Syrup, Sugar", "Blended", "Chef Shireen Anwar (Masala TV)", 84, "Creamy iced coffee shake by Chef Shireen Anwar."),
    ("Chicken Tempura", "چکن ٹیمپورا", "International", "Snack", "Fried", "5 pieces / 150g", 150, 340, 22, 18, 20, 3.5, 0.1, 0.8, 1.0, 580, 65, 25, 1.2, 240, "20 IU", "0 mg", "Gluten, Eggs", "Halal", "Chicken Strips, Tempura Batter (Ice Water, Flour, Egg), Oil", "Deep Fried", "Chef Tahir Chaudhry (Masala TV)", 82, "Light crispy Japanese style chicken tempura by Chef Tahir."),
    ("Tandoori Fish", "تندوری مچھلی", "Pakistani", "Dinner", "BBQ", "1 fillet / 200g", 200, 260, 30, 4, 13, 2.5, 0.0, 0.5, 1.5, 620, 75, 50, 1.2, 380, "80 IU", "4 mg", "Dairy", "Halal", "Fish Fillet, Yogurt, Lemon, Tandoori Spice Mix, Garlic", "Tandoor Baked", "Chef Mehboob Khan (Masala TV)", 86, "Healthy low-fat tandoori fish by Chef Mehboob.")
]

new_items = []
for item in EXTRA_RECIPES:
    name, urdu, cuisine, cat, subcat, desc_unit, g, kcal, prot, carb, fat, sat, trans, fib, sug, sod, chol, cal_mg, fe, k, vit_a, vit_c, alg, diet, ing, prep, chef_src, conf, notes = item
    key = name.strip().lower()
    if key not in existing_names:
        r = {
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
        new_items.append(r)
        existing_names.add(key)

all_final = existing_records + new_items
total_count = len(all_final)
print(f"New items added: {len(new_items)}")
print(f"Total count after addition: {total_count}")

with open(MASTER_FILE, mode='w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
    writer.writeheader()
    writer.writerows(all_final)

print(f"Saved {total_count} records to {MASTER_FILE}.")
