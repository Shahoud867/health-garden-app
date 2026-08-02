import csv, os

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

new_items = []

def add(name, urdu, local, cuisine, cat, subcat, region, desc, unit, g, kcal, p, c, f,
        sat=0.0, trans=0.0, fib=0.0, sug=0.0, sod=0.0, chol=0.0, cal=0.0, fe=0.0, k=0.0,
        vit_a="0 IU", vit_c="0 mg", alg="", diet="Halal", ing="", prep="",
        s1="USDA FoodData Central", s2="", s3="", conf=90, ver="Y", notes="USDA lab data."):
    if name.strip().lower() in existing_names:
        return
    rec = {
        'dish_name': name.strip(), 'urdu_name': urdu, 'local_name': local or '',
        'cuisine': cuisine, 'category': cat, 'subcategory': subcat, 'region_variant': region or '',
        'serving_description': desc, 'portion_unit': unit,
        'portion_grams': f"{float(g):.2f}", 'calories_kcal': str(int(round(float(kcal)))),
        'protein_g': f"{float(p):.2f}", 'carbohydrates_g': f"{float(c):.2f}",
        'fat_g': f"{float(f):.2f}", 'saturated_fat_g': f"{float(sat):.2f}",
        'trans_fat_g': f"{float(trans):.2f}", 'fiber_g': f"{float(fib):.2f}",
        'sugar_g': f"{float(sug):.2f}", 'sugar_flag': 'Y' if float(sug) > 12.0 else 'N',
        'sodium_mg': f"{float(sod):.2f}", 'cholesterol_mg': f"{float(chol):.2f}",
        'calcium_mg': f"{float(cal):.2f}", 'iron_mg': f"{float(fe):.2f}",
        'potassium_mg': f"{float(k):.2f}", 'vitamin_a': vit_a, 'vitamin_c': vit_c,
        'allergens': alg, 'dietary_type': diet, 'ingredients': ing, 'preparation_method': prep,
        'source_1': s1, 'source_2': s2, 'source_3': s3 or '',
        'confidence_score': str(int(conf)), 'verified': ver, 'notes': notes
    }
    new_items.append(rec)
    existing_names.add(name.strip().lower())

# =========================================================================
# BATCH 4A: FRESH FRUITS (RAW)
# =========================================================================
fruits = [
    ("Apple, Raw with Skin", "سیب", "100g", 100, 52, 0.3, 13.8, 0.2, 0.0, 2.4, 10.4, 1, 0, 6, 0.1, 107, "54 IU", "4.6 mg", ""),
    ("Banana, Raw", "کیلا", "100g", 100, 89, 1.1, 22.8, 0.3, 0.1, 2.6, 12.2, 1, 0, 5, 0.3, 358, "64 IU", "8.7 mg", ""),
    ("Orange, Raw", "مالٹا", "100g", 100, 47, 0.9, 11.8, 0.1, 0.0, 2.4, 9.4, 0, 0, 40, 0.1, 181, "225 IU", "53.2 mg", ""),
    ("Mango, Raw", "آم", "100g", 100, 60, 0.8, 15.0, 0.4, 0.1, 1.6, 13.7, 1, 0, 11, 0.2, 168, "1082 IU", "36.4 mg", ""),
    ("Grapes, Red or Green (European type, such as Thompson seedless), raw", "انگور", "100g", 100, 69, 0.7, 18.1, 0.2, 0.1, 0.9, 15.5, 2, 0, 10, 0.4, 191, "66 IU", "3.2 mg", ""),
    ("Papaya, Raw", "پپیتا", "100g", 100, 43, 0.5, 10.8, 0.3, 0.1, 1.7, 7.8, 8, 0, 20, 0.3, 182, "950 IU", "60.9 mg", ""),
    ("Watermelon, Raw", "تربوز", "100g", 100, 30, 0.6, 7.6, 0.2, 0.0, 0.4, 6.2, 1, 0, 7, 0.2, 112, "569 IU", "8.1 mg", ""),
    ("Pomegranate, Raw", "انار", "100g", 100, 83, 1.7, 18.7, 1.2, 0.1, 4.0, 13.7, 3, 0, 10, 0.3, 236, "0 IU", "10.2 mg", ""),
    ("Guava, Common, Raw", "امرود", "100g", 100, 68, 2.6, 14.3, 1.0, 0.3, 5.4, 8.9, 2, 0, 18, 0.3, 417, "624 IU", "228.3 mg", ""),
    ("Pear, Raw", "ناشپاتی", "100g", 100, 57, 0.4, 15.2, 0.1, 0.0, 3.1, 9.7, 1, 0, 9, 0.2, 116, "25 IU", "4.3 mg", ""),
    ("Peach, Raw", "آڑو", "100g", 100, 39, 0.9, 9.5, 0.3, 0.0, 1.5, 8.4, 0, 0, 6, 0.3, 190, "326 IU", "6.6 mg", ""),
    ("Plum, Raw", "آلو بخارا", "100g", 100, 46, 0.7, 11.4, 0.3, 0.0, 1.4, 9.9, 0, 0, 6, 0.2, 157, "345 IU", "9.5 mg", ""),
    ("Apricot, Raw", "خوبانی", "100g", 100, 48, 1.4, 11.1, 0.4, 0.0, 2.0, 9.2, 1, 0, 13, 0.4, 259, "1926 IU", "10.0 mg", ""),
    ("Strawberry, Raw", "اسٹرابیری", "100g", 100, 32, 0.7, 7.7, 0.3, 0.0, 2.0, 4.9, 1, 0, 16, 0.4, 153, "12 IU", "58.8 mg", ""),
    ("Blueberry, Raw", "بلیو بیری", "100g", 100, 57, 0.7, 14.5, 0.3, 0.0, 2.4, 9.9, 1, 0, 6, 0.3, 77, "54 IU", "9.7 mg", ""),
    ("Kiwi, Raw", "کیوی", "100g", 100, 61, 1.1, 14.7, 0.5, 0.0, 3.0, 9.0, 3, 0, 34, 0.3, 312, "87 IU", "92.7 mg", ""),
    ("Pineapple, Raw", "انناس", "100g", 100, 50, 0.5, 13.1, 0.1, 0.0, 1.4, 9.9, 1, 0, 13, 0.3, 109, "58 IU", "47.8 mg", ""),
    ("Cherry, Sweet, Raw", "چیری", "100g", 100, 63, 1.1, 16.0, 0.2, 0.0, 2.1, 12.8, 0, 0, 13, 0.4, 222, "64 IU", "7.0 mg", ""),
    ("Fig, Raw", "انجیر (تازہ)", "100g", 100, 74, 0.8, 19.2, 0.3, 0.1, 2.9, 16.3, 1, 0, 35, 0.4, 232, "142 IU", "2.0 mg", ""),
    ("Lychee, Raw", "لیچی", "100g", 100, 66, 0.8, 16.5, 0.4, 0.1, 1.3, 15.2, 1, 0, 5, 0.3, 171, "0 IU", "71.5 mg", "")
]
for p in fruits:
    add(name=p[0], urdu=p[1], local="", cuisine="International", cat="Ingredient", subcat="Fruit", region="", desc=p[2], unit=p[2], g=p[3], kcal=p[4], p=p[5], c=p[6], f=p[7], sat=p[8], trans=p[9], fib=p[10], sug=p[11], sod=p[12], chol=p[13], cal=p[14], fe=p[15], k=p[16], vit_a=p[17], vit_c=p[18], alg="", diet="Halal, Vegetarian, Vegan", ing=p[0], prep="Raw")

# =========================================================================
# BATCH 4B: ADDITIONAL FRESH VEGETABLES (RAW)
# =========================================================================
veg = [
    ("Tomato, Red, Ripe, Raw", "ٹماٹر", "100g", 100, 18, 0.9, 3.9, 0.2, 0.0, 1.2, 2.6, 5, 0, 10, 0.3, 237, "833 IU", "13.7 mg", ""),
    ("Onion, Raw", "پیاز", "100g", 100, 40, 1.1, 9.3, 0.1, 0.0, 1.7, 4.2, 4, 0, 23, 0.2, 146, "2 IU", "7.4 mg", ""),
    ("Potato, Raw, Skin-On", "آلو", "100g", 100, 77, 2.0, 17.5, 0.1, 0.0, 2.2, 0.8, 6, 0, 12, 0.8, 421, "2 IU", "19.7 mg", ""),
    ("Cucumber, Raw, With Peel", "کھیرا", "100g", 100, 15, 0.7, 3.6, 0.1, 0.0, 0.5, 1.7, 2, 0, 16, 0.3, 147, "105 IU", "2.8 mg", ""),
    ("Carrot, Raw", "گاجر", "100g", 100, 41, 0.9, 9.6, 0.2, 0.0, 2.8, 4.7, 69, 0, 33, 0.3, 320, "16706 IU", "5.9 mg", ""),
    ("Cabbage, Raw", "بند گوبھی", "100g", 100, 25, 1.3, 5.8, 0.1, 0.0, 2.5, 3.2, 18, 0, 40, 0.5, 170, "98 IU", "36.6 mg", ""),
    ("Cauliflower, Raw", "پھول گوبھی", "100g", 100, 25, 1.9, 5.0, 0.3, 0.0, 2.0, 1.9, 30, 0, 22, 0.4, 299, "0 IU", "48.2 mg", ""),
    ("Broccoli, Raw", "بروکلی", "100g", 100, 34, 2.8, 6.6, 0.4, 0.1, 2.6, 1.7, 33, 0, 47, 0.7, 316, "623 IU", "89.2 mg", ""),
    ("Lettuce, Romaine, Raw", "سلاد پتہ (رومین)", "100g", 100, 17, 1.2, 3.3, 0.3, 0.0, 2.1, 1.2, 8, 0, 33, 1.0, 247, "8710 IU", "4.0 mg", ""),
    ("Radish, Raw", "مولی", "100g", 100, 16, 0.7, 3.4, 0.1, 0.0, 1.6, 1.9, 39, 0, 25, 0.3, 233, "7 IU", "14.8 mg", ""),
    ("Green Bell Pepper, Raw", "شملہ مرچ", "100g", 100, 20, 0.9, 4.6, 0.2, 0.0, 1.7, 2.4, 3, 0, 10, 0.3, 175, "370 IU", "80.4 mg", ""),
    ("Mushroom, White, Raw", "مشروم", "100g", 100, 22, 3.1, 3.3, 0.3, 0.1, 1.0, 2.0, 5, 0, 3, 0.5, 318, "0 IU", "2.1 mg", ""),
    ("Zucchini, Raw", "زکینی", "100g", 100, 17, 1.2, 3.1, 0.3, 0.1, 1.0, 2.5, 8, 0, 16, 0.4, 261, "200 IU", "17.9 mg", ""),
    ("Pumpkin, Raw", "کدو (پمپکن)", "100g", 100, 26, 1.0, 6.5, 0.1, 0.1, 0.5, 1.4, 1, 0, 21, 0.8, 340, "8513 IU", "9.0 mg", ""),
    ("Celery, Raw", "اجوائن کے پتے/تنے", "100g", 100, 14, 0.7, 3.0, 0.2, 0.0, 1.6, 1.3, 80, 0, 40, 0.2, 260, "449 IU", "3.1 mg", ""),
    ("Green Beans, Raw", "سبز پھلیاں", "100g", 100, 31, 1.8, 7.0, 0.2, 0.0, 2.7, 3.3, 6, 0, 37, 1.0, 211, "690 IU", "12.2 mg", ""),
    ("Asparagus, Raw", "اسپراگس", "100g", 100, 20, 2.2, 3.9, 0.1, 0.0, 2.1, 1.9, 2, 0, 24, 2.1, 202, "756 IU", "5.6 mg", ""),
    ("Artichoke, Raw", "آرٹچوک", "100g", 100, 47, 3.3, 10.5, 0.2, 0.0, 5.4, 1.0, 94, 0, 44, 1.3, 370, "13 IU", "11.7 mg", "")
]
for p in veg:
    add(name=p[0], urdu=p[1], local="", cuisine="International", cat="Ingredient", subcat="Vegetable", region="", desc=p[2], unit=p[2], g=p[3], kcal=p[4], p=p[5], c=p[6], f=p[7], sat=p[8], trans=p[9], fib=p[10], sug=p[11], sod=p[12], chol=p[13], cal=p[14], fe=p[15], k=p[16], vit_a=p[17], vit_c=p[18], alg="", diet="Halal, Vegetarian, Vegan", ing=p[0], prep="Raw")

# =========================================================================
# BATCH 4C: DAIRY, EGGS, AND BASIC PROTEINS (RAW/UNCOOKED)
# =========================================================================
dairy = [
    ("Milk, Whole, 3.25% Milkfat", "خالص دودھ", "1 cup (244g)", 244, 149, 7.7, 11.7, 8.0, 4.6, 0.0, 12.3, 105, 24, 276, 0.1, 322, "395 IU", "0 mg", "Dairy"),
    ("Milk, Reduced Fat, 2% Milkfat", "کم چکنائی والا دودھ", "1 cup (244g)", 244, 122, 8.1, 11.9, 4.8, 3.1, 0.0, 12.4, 115, 20, 293, 0.1, 366, "459 IU", "0 mg", "Dairy"),
    ("Yogurt, Plain, Whole Milk", "دہی", "1 cup (245g)", 245, 149, 8.5, 11.4, 8.0, 5.1, 0.0, 11.4, 113, 32, 296, 0.1, 380, "243 IU", "1.2 mg", "Dairy"),
    ("Yogurt, Greek, Plain, Whole Milk", "گریک یوگرٹ", "1 cup (245g)", 245, 238, 22.0, 9.7, 12.2, 7.8, 0.0, 8.5, 83, 37, 245, 0.2, 345, "343 IU", "0 mg", "Dairy"),
    ("Cheese, Cheddar", "چیڈر چیز", "1 oz (28g)", 28, 114, 7.1, 0.4, 9.4, 6.0, 0.0, 0.1, 185, 28, 204, 0.2, 28, "284 IU", "0 mg", "Dairy"),
    ("Cheese, Mozzarella, Whole Milk", "موزاریلا چیز", "1 oz (28g)", 28, 85, 6.3, 0.6, 6.3, 3.7, 0.0, 0.3, 138, 22, 143, 0.1, 22, "192 IU", "0 mg", "Dairy"),
    ("Cheese, Parmesan, Grated", "پرمیسن چیز", "1 tbsp (5g)", 5, 22, 1.9, 0.7, 1.4, 0.9, 0.0, 0.0, 86, 4, 55, 0.0, 5, "43 IU", "0 mg", "Dairy"),
    ("Butter, Unsalted", "مکھن (بغیر نمک)", "1 tbsp (14g)", 14, 102, 0.1, 0.0, 11.5, 7.3, 0.0, 0.0, 2, 31, 3, 0.0, 3, "355 IU", "0 mg", "Dairy"),
    ("Ghee (Clarified Butter)", "دیسی گھی", "1 tbsp (13g)", 13, 112, 0.0, 0.0, 12.7, 8.0, 0.0, 0.0, 0, 33, 1, 0.0, 1, "400 IU", "0 mg", "Dairy"),
    ("Cream, Heavy Liquid", "ہیوی کریم", "1 tbsp (15g)", 15, 51, 0.4, 0.4, 5.4, 3.5, 0.0, 0.4, 5, 20, 10, 0.0, 14, "221 IU", "0.1 mg", "Dairy"),
    ("Egg, Whole, Raw", "انڈہ (کچا)", "1 large (50g)", 50, 72, 6.3, 0.4, 4.8, 1.6, 0.0, 0.2, 71, 186, 28, 0.9, 69, "270 IU", "0 mg", "Eggs"),
    ("Tofu, Firm, Prepared with Calcium Sulfate", "ٹوفو", "1/2 cup (126g)", 126, 181, 21.8, 3.5, 11.0, 1.6, 3.0, 0.8, 17, 0, 861, 3.4, 299, "0 IU", "0 mg", "Soy")
]
for p in dairy:
    add(name=p[0], urdu=p[1], local="", cuisine="International", cat="Ingredient", subcat="Dairy/Protein", region="", desc=p[2], unit=p[2], g=p[3], kcal=p[4], p=p[5], c=p[6], f=p[7], sat=p[8], trans=p[9], fib=0.0, sug=p[10], sod=p[11], chol=p[12], cal=p[13], fe=p[14], k=p[15], vit_a=p[16], vit_c=p[17], alg=p[18], diet="Halal, Vegetarian" if p[18] != "Eggs" else "Halal", ing=p[0], prep="Raw")

# =========================================================================
# BATCH 4D: COOKED/BOILED LEGUMES & GRAINS (Base items often used)
# =========================================================================
cooked_grains = [
    ("Quinoa, Cooked", "کینووا (پکا ہوا)", "1 cup (185g)", 185, 222, 8.1, 39.4, 3.6, 0.4, 5.2, 1.6, 13, 0, 31, 2.8, 318, "9 IU", "0 mg", ""),
    ("Brown Rice, Cooked", "براؤن چاول (پکا ہوا)", "1 cup (195g)", 195, 216, 5.0, 44.8, 1.8, 0.4, 3.5, 0.7, 10, 0, 20, 0.8, 84, "0 IU", "0 mg", ""),
    ("White Rice, Cooked", "سفید چاول (پکا ہوا)", "1 cup (158g)", 158, 205, 4.3, 44.5, 0.4, 0.1, 0.6, 0.1, 2, 0, 16, 1.9, 55, "0 IU", "0 mg", ""),
    ("Lentils, Cooked, Boiled", "دال مسور (پکی ہوئی)", "1 cup (198g)", 198, 230, 17.9, 39.9, 0.8, 0.1, 15.6, 3.6, 4, 0, 38, 6.6, 731, "16 IU", "3.0 mg", ""),
    ("Chickpeas (Garbanzo Beans), Cooked", "سفید چنے (پکے ہوئے)", "1 cup (164g)", 164, 269, 14.5, 45.0, 4.2, 0.4, 12.5, 7.9, 11, 0, 80, 4.7, 477, "44 IU", "2.1 mg", ""),
    ("Black Beans, Cooked", "کالی پھلیاں (پکی ہوئی)", "1 cup (172g)", 172, 227, 15.2, 40.8, 0.9, 0.2, 15.0, 0.6, 2, 0, 46, 3.6, 611, "0 IU", "0 mg", ""),
    ("Kidney Beans, Cooked", "راجمہ (پکا ہوا)", "1 cup (177g)", 177, 225, 15.3, 40.4, 0.9, 0.1, 11.3, 0.6, 2, 0, 50, 5.2, 713, "0 IU", "0 mg", ""),
    ("Pasta, Spaghetti, Cooked, Unenriched", "اسپیگیٹی (پکی ہوئی)", "1 cup (140g)", 140, 221, 8.1, 43.2, 1.3, 0.2, 2.5, 0.8, 1, 0, 10, 1.8, 62, "0 IU", "0 mg", "Gluten")
]
for p in cooked_grains:
    add(name=p[0], urdu=p[1], local="", cuisine="International", cat="Ingredient", subcat="Grains/Legumes", region="", desc=p[2], unit=p[2], g=p[3], kcal=p[4], p=p[5], c=p[6], f=p[7], sat=p[8], trans=p[9], fib=p[10], sug=p[11], sod=p[12], chol=p[13], cal=p[14], fe=p[15], k=p[16], vit_a=p[17], vit_c=p[18], alg=p[19], diet="Halal, Vegetarian, Vegan", ing=p[0], prep="Cooked")

# =========================================================================
# BATCH 4E: COMMON FAST FOOD ITEMS & SNACKS
# =========================================================================
fast_food = [
    ("French Fries, Deep Fried", "فرنچ فرائیز", "1 medium order (117g)", 117, 365, 4.0, 48.3, 17.1, 3.1, 3.9, 0.4, 246, 0, 18, 0.9, 683, "0 IU", "12.3 mg", ""),
    ("Chicken Nuggets, Fast Food", "چکن نگٹس", "6 pieces (96g)", 96, 285, 14.1, 15.2, 18.5, 3.3, 0.9, 0.3, 538, 38, 13, 0.9, 219, "29 IU", "0 mg", "Gluten, Dairy"),
    ("Hamburger, Fast Food (Single Patty)", "ہیمبرگر", "1 burger (110g)", 110, 295, 14.2, 29.5, 13.0, 4.7, 1.2, 5.1, 477, 31, 62, 2.4, 183, "66 IU", "0.6 mg", "Gluten"),
    ("Pizza, Cheese, Regular Crust", "چیز پیزا", "1 slice (107g)", 107, 285, 12.2, 35.7, 10.4, 4.8, 2.5, 3.8, 640, 18, 199, 2.4, 172, "281 IU", "0 mg", "Gluten, Dairy"),
    ("Hot Dog, Plain (Beef/Halal)", "ہاٹ ڈاگ", "1 hot dog (98g)", 98, 242, 9.9, 18.1, 14.2, 5.2, 0.9, 2.3, 555, 27, 43, 1.4, 157, "0 IU", "0.1 mg", "Gluten"),
    ("Potato Chips, Plain", "آلو کے چپس", "1 oz (28g)", 28, 152, 2.0, 15.0, 9.8, 1.0, 1.3, 0.1, 136, 0, 15, 0.4, 336, "0 IU", "8.9 mg", ""),
    ("Pretzels, Hard, Plain", "پریٹزل", "1 oz (28g)", 28, 108, 2.9, 22.5, 0.7, 0.1, 0.8, 0.6, 359, 0, 10, 1.2, 109, "0 IU", "0 mg", "Gluten")
]
for p in fast_food:
    add(name=p[0], urdu=p[1], local="", cuisine="Fast Food", cat="Snack/Lunch", subcat="Fast Food", region="", desc=p[2], unit=p[2], g=p[3], kcal=p[4], p=p[5], c=p[6], f=p[7], sat=p[8], trans=p[9], fib=p[10], sug=p[11], sod=p[12], chol=p[13], cal=p[14], fe=p[15], k=p[16], vit_a=p[17], vit_c=p[18], alg=p[19], diet="Halal" if p[19] else "Halal, Vegetarian", ing=p[0], prep="Cooked/Processed")

# =========================================================================
# BATCH 4F: DESSERTS AND BAKED GOODS (Generic Standards)
# =========================================================================
baked = [
    ("Bread, White, Commercially Prepared", "سفید ڈبل روٹی", "1 slice (25g)", 25, 66, 2.2, 12.6, 0.8, 0.2, 0.7, 1.4, 170, 0, 36, 0.9, 29, "0 IU", "0 mg", "Gluten"),
    ("Bread, Whole Wheat, Commercially Prepared", "براؤن ڈبل روٹی", "1 slice (28g)", 28, 70, 3.6, 11.6, 1.2, 0.2, 2.0, 1.6, 131, 0, 45, 0.7, 72, "0 IU", "0 mg", "Gluten"),
    ("Croissant, Butter", "کروئسانٹ", "1 large (67g)", 67, 272, 5.5, 31.0, 14.1, 7.8, 1.7, 4.5, 313, 31, 25, 1.4, 79, "286 IU", "0.1 mg", "Gluten, Dairy"),
    ("Muffin, Blueberry, Commercially Prepared", "بلیو بیری مفن", "1 medium (113g)", 113, 426, 5.5, 68.8, 14.9, 2.5, 1.5, 37.6, 329, 25, 78, 1.5, 136, "35 IU", "0.2 mg", "Gluten, Dairy, Eggs"),
    ("Cookie, Chocolate Chip, Commercially Prepared", "چاکلیٹ چپ کوکی", "1 cookie (16g)", 16, 78, 0.9, 10.6, 3.8, 1.2, 0.4, 5.1, 75, 4, 9, 0.4, 30, "9 IU", "0 mg", "Gluten, Dairy, Eggs"),
    ("Brownie, Chocolate, Commercially Prepared", "براؤنی", "1 brownie (56g)", 56, 227, 2.6, 36.1, 9.0, 2.1, 1.6, 25.3, 141, 18, 14, 1.2, 85, "34 IU", "0.1 mg", "Gluten, Dairy, Eggs"),
    ("Ice Cream, Vanilla", "ونیلا آئس کریم", "1/2 cup (66g)", 66, 137, 2.3, 15.6, 7.3, 4.5, 0.5, 14.0, 53, 29, 84, 0.1, 131, "278 IU", "0.4 mg", "Dairy")
]
for p in baked:
    add(name=p[0], urdu=p[1], local="", cuisine="Continental", cat="Dessert/Bakery", subcat="Baked Goods", region="", desc=p[2], unit=p[2], g=p[3], kcal=p[4], p=p[5], c=p[6], f=p[7], sat=p[8], trans=p[9], fib=p[10], sug=p[11], sod=p[12], chol=p[13], cal=p[14], fe=p[15], k=p[16], vit_a=p[17], vit_c=p[18], alg=p[19], diet="Halal, Vegetarian", ing=p[0], prep="Baked/Processed")

total = len(existing_records) + len(new_items)
print(f"New items in this batch: {len(new_items)}")
print(f"Total after this batch: {total}")

all_final = existing_records + new_items

with open(MASTER_FILE, mode='w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
    writer.writeheader()
    writer.writerows(all_final)

print(f"Saved {len(all_final)} total records.")
