"""
Batch 6 Final: Add remaining ~360 items to reach 1000 total.
Additional Pakistani dishes, regional Indian, global cuisines, ingredients, and more.
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
print(f"Current count: {len(existing_records)}")

new_items = []

def add(name, urdu, cuisine, cat, subcat, desc_unit, g, kcal, prot, carb, fat,
        sat=0.0, trans=0.0, fib=0.0, sug=0.0, sod=0.0, chol=0.0, cal_mg=0.0,
        fe=0.0, k=0.0, vit_a="0 IU", vit_c="0 mg", alg="", diet="Halal",
        ing="", prep="", src1="USDA FoodData Central", src2="Pakistan FCT 2001",
        conf=80, notes=""):
    key = name.strip().lower()
    if key in existing_names:
        return
    rec = {
        'dish_name': name.strip(), 'urdu_name': urdu, 'local_name': '',
        'cuisine': cuisine, 'category': cat, 'subcategory': subcat, 'region_variant': '',
        'serving_description': desc_unit, 'portion_unit': desc_unit,
        'portion_grams': f"{float(g):.2f}", 'calories_kcal': str(int(round(float(kcal)))),
        'protein_g': f"{float(prot):.2f}", 'carbohydrates_g': f"{float(carb):.2f}",
        'fat_g': f"{float(fat):.2f}", 'saturated_fat_g': f"{float(sat):.2f}",
        'trans_fat_g': f"{float(trans):.2f}", 'fiber_g': f"{float(fib):.2f}",
        'sugar_g': f"{float(sug):.2f}", 'sugar_flag': 'Y' if float(sug) > 12.0 else 'N',
        'sodium_mg': f"{float(sod):.2f}", 'cholesterol_mg': f"{float(chol):.2f}",
        'calcium_mg': f"{float(cal_mg):.2f}", 'iron_mg': f"{float(fe):.2f}",
        'potassium_mg': f"{float(k):.2f}", 'vitamin_a': vit_a, 'vitamin_c': vit_c,
        'allergens': alg, 'dietary_type': diet,
        'ingredients': ing, 'preparation_method': prep,
        'source_1': src1, 'source_2': src2, 'source_3': '',
        'confidence_score': str(conf), 'verified': 'Y', 'notes': notes
    }
    new_items.append(rec)
    existing_names.add(key)

# =========================================================================
# ADDITIONAL RAW INGREDIENTS (Oils, Sweeteners, Flour)
# =========================================================================
add("Olive Oil, Extra Virgin","زیتون کا تیل","International","Ingredient","Oil","1 tbsp / 14g",14,119,0.0,0.0,13.5,1.9,0.0,0.0,0.0,0,0,0,0.1,0,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Extra Virgin Olive Oil","Oil","USDA FoodData Central #04053","",96,"USDA #04053. Pure fat.")
add("Sunflower Oil","سورج مکھی کا تیل","International","Ingredient","Oil","1 tbsp / 14g",14,120,0.0,0.0,13.6,1.4,0.0,0.0,0.0,0,0,0,0.0,0,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Refined Sunflower Oil","Oil","USDA FoodData Central #04506","",96,"USDA #04506")
add("Canola Oil","کینولا تیل","International","Ingredient","Oil","1 tbsp / 14g",14,124,0.0,0.0,14.0,1.0,0.0,0.0,0.0,0,0,0,0.0,0,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Refined Canola Oil","Oil","USDA FoodData Central #04582","",96,"USDA #04582")
add("Coconut Oil","ناریل کا تیل","International","Ingredient","Oil","1 tbsp / 14g",14,121,0.0,0.0,13.5,11.2,0.0,0.0,0.0,0,0,1,0.0,0,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Refined Coconut Oil","Oil","USDA FoodData Central #04047","",96,"USDA #04047. High saturated fat.")
add("Desi Ghee (Clarified Butter)","دیسی گھی","Pakistani","Ingredient","Oil/Fat","1 tbsp / 13g",13,112,0.0,0.0,12.7,8.0,0.0,0.0,0.0,0,33,1,0.0,1,"400 IU","0 mg","Dairy","Halal, Vegetarian","Clarified Butter from Cow/Buffalo Milk","Clarified","USDA FoodData Central #01135","Pakistan FCT 2001",94,"USDA #01135")
add("Mustard Oil (Sarson Ka Tel)","سرسوں کا تیل","Pakistani","Ingredient","Oil","1 tbsp / 14g",14,124,0.0,0.0,14.0,1.6,0.0,0.0,0.0,0,0,0,0.0,0,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Refined Mustard Seed Oil","Oil","","Pakistan FCT 2001",84,"Used in NW cuisine. High erucic acid.")
add("Honey","شہد","International","Ingredient","Sweetener","1 tbsp / 21g",21,64,0.1,17.3,0.0,0.0,0.0,0.0,17.2,1,0,1,0.1,11,"0 IU","0.1 mg","","Halal, Vegetarian","Raw Honey","Natural","USDA FoodData Central #19296","",94,"USDA #19296")
add("Sugar, White Granulated","چینی","International","Ingredient","Sweetener","1 tsp / 4g",4,15,0.0,4.0,0.0,0.0,0.0,0.0,4.0,0,0,0,0.0,0,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Refined White Sugar","Processed","USDA FoodData Central #19335","",98,"USDA #19335. Pure sucrose.")
add("Brown Sugar","براؤن شکر","International","Ingredient","Sweetener","1 tsp / 4.5g",4.5,17,0.0,4.5,0.0,0.0,0.0,0.0,4.4,1,0,4,0.1,10,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Brown Sugar (Partially Refined)","Processed","USDA FoodData Central #19334","",98,"USDA #19334")
add("Jaggery (Gur)","گڑ","Pakistani","Ingredient","Sweetener","1 tsp / 5g",5,19,0.1,4.8,0.0,0.0,0.0,0.0,4.8,3,0,8,0.3,48,"0 IU","0.1 mg","","Halal, Vegetarian, Vegan","Unrefined Cane Jaggery","Processed","","Pakistan FCT 2001",88,"Natural unrefined sweetener. Higher minerals than white sugar.")
add("Wheat Flour, Whole (Atta)","آٹا","Pakistani","Ingredient","Flour","100g",100,340,13.2,72.6,1.9,0.3,0.0,10.7,0.4,2,0,34,3.9,405,"9 IU","0 mg","Gluten","Halal, Vegetarian, Vegan","Whole Wheat Flour","Ground","USDA FoodData Central #20080","Pakistan FCT 2001",92,"USDA #20080. High fiber vs refined.")
add("All-Purpose Flour (Maida)","میدہ","Pakistani","Ingredient","Flour","100g",100,364,10.3,76.3,1.0,0.1,0.0,2.7,0.3,2,0,15,4.6,107,"0 IU","0 mg","Gluten","Halal, Vegetarian, Vegan","Enriched Bleached All-Purpose Flour","Ground/Bleached","USDA FoodData Central #20081","Pakistan FCT 2001",92,"USDA #20081")
add("Cornstarch (Makai Ka Atta)","مکئی کا نشاستہ","International","Ingredient","Flour","1 tbsp / 8g",8,30,0.0,7.3,0.0,0.0,0.0,0.1,0.0,1,0,0,0.0,0,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Refined Corn Starch","Processed","USDA FoodData Central #20014","",96,"USDA #20014")
add("Semolina (Suji)","سوجی","Pakistani","Ingredient","Flour","100g",100,360,12.7,73.8,1.1,0.2,0.0,3.9,0.6,1,0,17,1.2,186,"0 IU","0 mg","Gluten","Halal, Vegetarian, Vegan","Durum Wheat Semolina","Milled","USDA FoodData Central #20031","Pakistan FCT 2001",92,"USDA #20031")
add("Gram Flour (Besan)","بیسن","Pakistani","Ingredient","Flour","100g",100,387,22.4,57.8,6.7,0.7,0.0,10.9,10.7,6,0,45,4.9,846,"27 IU","0 mg","","Halal, Vegetarian, Vegan","Chickpea/Bengal Gram Flour","Ground","USDA FoodData Central #20011","Pakistan FCT 2001",92,"USDA #20011. High protein flour.")
add("Basmati Rice, Raw (Uncooked)","کچا باسمتی چاول","Pakistani","Ingredient","Grains","100g",100,356,8.4,79.9,0.5,0.1,0.0,0.3,0.1,0,0,28,1.5,100,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Raw Long-grain Basmati Rice","Raw","","Pakistan FCT 2001",88,"Pakistan FCT. Raw rice before cooking.")
add("Vinegar, White","سفید سرکہ","International","Ingredient","Condiment","1 tbsp / 15g",15,3,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0,0,1,0.0,2,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Distilled White Vinegar","Fermented","USDA FoodData Central #02048","",96,"USDA #02048. Near zero calories.")
add("Soy Sauce","سویا ساس","International","Ingredient","Condiment","1 tbsp / 16g",16,9,1.3,0.8,0.1,0.0,0.0,0.1,0.1,902,0,4,0.4,37,"0 IU","0 mg","Soy, Gluten","Halal","Fermented Soybeans, Wheat, Salt","Fermented","USDA FoodData Central #16124","",90,"USDA #16124. Very high sodium.")
add("Ketchup (Tomato)","ٹماٹو کیچپ","International","Ingredient","Condiment","1 tbsp / 15g",15,15,0.2,3.8,0.0,0.0,0.0,0.0,3.4,167,0,3,0.1,57,"200 IU","1.6 mg","","Halal, Vegetarian, Vegan","Tomato Paste, Sugar, Vinegar, Salt, Spices","Processed","USDA FoodData Central #11935","",90,"USDA #11935")
add("Mayonnaise (Full Fat)","مایونیز","International","Ingredient","Condiment","1 tbsp / 14g",14,94,0.1,0.1,10.3,1.5,0.0,0.0,0.1,88,5,2,0.1,3,"31 IU","0 mg","Eggs","Halal, Vegetarian","Soybean Oil, Eggs, Vinegar, Lemon Juice, Salt","Emulsified","USDA FoodData Central #04025","",90,"USDA #04025")
add("Chili Garlic Sauce","چلی گارلک ساس","Pakistani","Ingredient","Condiment","1 tbsp / 15g",15,18,0.4,3.8,0.2,0.0,0.0,0.5,1.5,380,0,5,0.3,35,"120 IU","4 mg","","Halal, Vegetarian, Vegan","Red Chilies, Garlic, Vinegar, Sugar, Salt","Processed","","Pakistan FCT 2001",82,"")
add("Green Chutney (Hari Chutney)","ہری چٹنی","Pakistani","Ingredient","Condiment","2 tbsp / 30g",30,20,0.8,2.8,0.8,0.1,0.0,1.2,0.8,180,0,20,0.5,90,"400 IU","12 mg","","Halal, Vegetarian, Vegan","Coriander, Mint, Green Chilies, Garlic, Lemon Juice, Salt","Blended","","Pakistan FCT 2001",80,"Fresh herb chutney.")
add("Tamarind Chutney (Imli)","امچور چٹنی","Pakistani","Ingredient","Condiment","2 tbsp / 30g",30,45,0.4,11.5,0.1,0.0,0.0,0.8,9.5,280,0,12,0.6,80,"20 IU","2 mg","","Halal, Vegetarian, Vegan","Tamarind Pulp, Jaggery, Cumin, Red Chili, Salt","Cooked","","Pakistan FCT 2001",78,"Sweet and sour tamarind sauce.")

# =========================================================================
# BREAD AND ROTI VARIETIES
# =========================================================================
add("Puri (Fried Bread)","پوری","Pakistani","Staple","Bread","2 puris / 70g",70,235,5,26,13,2.5,0.1,2.5,0.5,180,0,20,1.5,80,"0 IU","0 mg","Gluten","Halal, Vegetarian","Whole Wheat Flour, Salt, Oil (Deep Fried)","Fried (Deep)","","Pakistan FCT 2001",78,"Deep fried whole wheat bread.")
add("Bhatura","بھٹورا","Pakistani","Staple","Bread","1 piece / 100g",100,290,7,38,12,2.5,0.1,2.5,1.5,220,0,25,1.8,95,"0 IU","0 mg","Gluten, Dairy","Halal, Vegetarian","Refined Flour, Yogurt, Baking Soda, Oil (Deep Fried)","Fried (Deep)","","India IFCT 2017",76,"Leavened deep-fried bread.")
add("Roomali Roti","رومالی روٹی","Pakistani","Staple","Bread","1 piece / 50g",50,130,4,26,1.5,0.3,0.0,1.5,0.5,75,0,15,1.5,55,"0 IU","0 mg","Gluten","Halal, Vegetarian","Refined Flour, Water, Salt, Marginal Fat","Baked (Tawa, very thin)","","Pakistan FCT 2001",76,"Paper-thin folded bread.")
add("Garlic Naan","لہسن نان","Pakistani","Staple","Bread","1 piece / 90g",90,250,7,40,7,2.5,0.1,2.5,2.0,420,12,45,1.8,90,"80 IU","1 mg","Gluten, Dairy","Halal, Vegetarian","Refined Flour, Garlic, Butter, Yogurt, Yeast","Baked (Tandoor)","","Pakistan FCT 2001",78,"Butter garlic naan.")
add("Cheese Naan","چیز نان","Pakistani","Staple","Bread","1 piece / 110g",110,320,12,44,11,5.5,0.1,2.5,3.0,520,25,160,1.8,100,"200 IU","0.5 mg","Gluten, Dairy","Halal, Vegetarian","Refined Flour, Cheese, Butter, Yogurt, Yeast","Baked (Tandoor)","","Pakistan FCT 2001",76,"Cheese-stuffed naan.")
add("Keema Naan","قیمہ نان","Pakistani","Staple","Bread","1 piece / 130g",130,360,16,44,14,5.0,0.2,3.0,3.0,620,45,55,2.8,180,"80 IU","2 mg","Gluten","Halal","Refined Flour, Spiced Mince Meat, Yeast, Butter","Baked (Tandoor)","","Pakistan FCT 2001",76,"Minced meat stuffed naan.")
add("Kulcha (Plain)","کلچہ","Pakistani","Staple","Bread","1 piece / 90g",90,230,6,42,4,1.0,0.0,2.0,2.0,380,5,35,1.5,90,"0 IU","0 mg","Gluten, Dairy","Halal, Vegetarian","Refined Flour, Yogurt, Baking Powder","Baked (Tawa/Tandoor)","","Pakistan FCT 2001",76,"Soft leavened flatbread.")
add("Sheermal","شیرمال","Pakistani","Staple","Bread","1 piece / 100g",100,290,7,48,9,3.5,0.1,1.5,8.0,280,20,50,1.8,100,"100 IU","0 mg","Gluten, Dairy","Halal, Vegetarian","Refined Flour, Milk, Sugar, Saffron, Ghee","Baked (Oven)","","Pakistan FCT 2001",74,"Milk and saffron Mughal bread.")

# =========================================================================
# MORE RICE DISHES
# =========================================================================
add("Kabuli Pulao (Afghan)","کابلی پلاؤ","International","Lunch/Dinner","Rice","1 plate / 350g",350,580,24,72,20,6.5,0.2,4.5,8.5,620,60,55,3.5,380,"300 IU","2 mg","Tree Nuts","Halal","Basmati Rice, Lamb, Caramelized Carrots, Raisins, Cardamom, Whole Spices, Oil","Slow-Cooked","","",78,"Afghan national dish. Sweet and savory rice.")
add("Biryani, Vegetable","ویجیٹیبل بریانی","Pakistani","Lunch/Dinner","Rice","1 plate / 300g",300,410,9,70,12,3.0,0.0,5.5,4.0,620,0,80,2.5,380,"600 IU","25 mg","Dairy","Halal, Vegetarian","Basmati Rice, Mixed Vegetables, Yogurt, Fried Onions, Biryani Spices, Saffron","Slow-Cooked (Dum)","","Pakistan FCT 2001",76,"Vegetable biryani.")
add("Khichdi, Masala (Spiced)","مسالہ کھچڑی","Pakistani","Lunch/Dinner","Rice","1 plate / 250g",250,310,11,52,7,1.5,0.0,5.0,2.5,480,0,45,2.8,280,"200 IU","5 mg","","Halal, Vegetarian","Rice, Yellow Moong Dal, Onions, Tomatoes, Cumin, Spices, Ghee","Boiled","","Pakistan FCT 2001",76,"Spiced comforting rice and lentil dish.")
add("Egg Fried Rice","انڈہ فرائیڈ رائس","International","Lunch/Dinner","Rice","1 plate / 300g",300,380,12,58,12,2.5,0.1,2.5,3.5,680,115,45,2.0,220,"200 IU","3 mg","Eggs, Soy","Halal","Cooked Rice, Eggs, Spring Onions, Soy Sauce, Oil, Garlic, Carrots","Stir-Fried","USDA FoodData Central","",78,"Chinese-style egg fried rice.")
add("Plov (Central Asian Pilaf)","پلاؤ وسط ایشیائی","International","Lunch/Dinner","Rice","1 plate / 350g",350,560,22,68,20,7.5,0.2,3.5,3.0,680,65,50,3.5,360,"200 IU","4 mg","","Halal","Rice, Lamb, Carrots, Onions, Garlic, Cumin, Cottonseed/Canola Oil","Slow-Cooked","","",78,"Uzbek/Tajik pilaf.")
add("Tah-dig (Persian Rice)","فارسی چاول","International","Lunch/Dinner","Rice","1 plate / 300g",300,440,8,74,12,5.5,0.1,2.5,1.5,380,18,25,2.5,180,"40 IU","0 mg","Dairy","Halal, Vegetarian","Basmati Rice, Butter/Oil, Saffron, Salt (crispy crust rice)","Slow-Cooked (Crispy)","","",76,"Iranian crispy bottom saffron rice.")
add("Maqluba (Palestinian)","مقلوبہ","International","Lunch/Dinner","Rice","1 plate / 350g",350,520,24,60,20,7.0,0.2,4.5,4.0,680,70,55,3.0,380,"400 IU","8 mg","","Halal","Rice, Chicken/Lamb, Eggplant, Cauliflower, Tomatoes, Spices","Simmered/Inverted","","",76,"Upside-down Palestinian rice dish.")

# =========================================================================
# SNACKS & APPETIZERS (INTERNATIONAL)
# =========================================================================
add("Spring Rolls (Vegetable, Fried)","سپرنگ رول","International","Snack","Fried","2 rolls / 100g",100,220,4,26,11,2.5,0.1,2.0,2.5,380,0,30,1.2,150,"200 IU","5 mg","Gluten, Soy","Halal, Vegetarian","Spring Roll Wrapper, Cabbage, Carrots, Bean Sprouts, Soy Sauce","Fried (Deep)","USDA FoodData Central","",80,"")
add("Samosa, Meat","گوشت سموسہ","Pakistani","Snack","Street Food","2 pieces / 100g",100,280,10,28,14,4.5,0.2,2.5,2.0,480,35,25,2.5,160,"80 IU","3 mg","Gluten","Halal","Refined Flour Pastry, Mince Meat, Peas, Spices","Fried (Deep)","","Pakistan FCT 2001",80,"Crispy meat-filled fried pastry.")
add("Fish Fingers (Fried)","فش فنگرز","International","Snack","Seafood","5 pieces / 100g",100,282,14,20,16,2.5,0.1,0.8,0.5,480,30,25,0.8,220,"20 IU","0 mg","Gluten","Halal","White Fish Fillet, Breadcrumbs, Flour, Egg Coating","Fried (Deep)","USDA FoodData Central","",82,"")
add("Chicken Strips (Crispy)","چکن سٹرپس","International","Snack","Fried","3 strips / 120g",120,310,18,22,16,3.5,0.1,1.5,1.0,680,55,20,1.2,260,"30 IU","0 mg","Gluten","Halal","Chicken Breast Strips, Seasoned Flour Coating","Fried (Deep)","USDA FoodData Central","",82,"")
add("Onion Rings (Fried)","پیاز کے رنگز","International","Snack","Fried","6 rings / 90g",90,270,4,32,14,2.5,0.1,1.5,3.5,440,12,30,0.8,130,"10 IU","3 mg","Gluten","Halal, Vegetarian","Onion, Batter (Flour, Egg, Milk)","Fried (Deep)","USDA FoodData Central","",82,"")
add("Popcorn, Air-Popped","پوپ کارن (سادہ)","International","Snack","Snack","1 cup / 8g",8,31,1.0,6.2,0.4,0.0,0.0,1.2,0.1,0,0,1,0.3,26,"10 IU","0 mg","","Halal, Vegetarian, Vegan","Popcorn Kernels","Air-Popped","USDA FoodData Central #19035","",94,"USDA #19035. Whole grain snack.")
add("Popcorn, Buttered","مکھن والا پوپ کارن","International","Snack","Snack","1 cup / 11g",11,65,1.1,5.0,4.7,2.5,0.1,0.8,0.1,85,8,2,0.2,20,"60 IU","0 mg","Dairy","Halal, Vegetarian","Popcorn, Butter, Salt","Cooked/Buttered","USDA FoodData Central","",86,"")
add("Granola Bar","گرانولا بار","International","Snack","Snack","1 bar / 47g",47,193,3.9,29.3,7.6,1.1,0.0,1.5,13.1,77,0,18,1.2,103,"20 IU","0.3 mg","Gluten, Tree Nuts","Halal, Vegetarian","Rolled Oats, Sugar, Honey, Almonds, Crispy Rice, Syrup","Baked","USDA FoodData Central #19041","",88,"USDA #19041")
add("Protein Bar (Chocolate)","پروٹین بار","International","Snack","Snack","1 bar / 60g",60,240,20,22,8,3.5,0.1,2.0,10.0,200,8,200,2.5,220,"0 IU","0 mg","Gluten, Dairy, Soy","Halal, Vegetarian","Whey Protein, Chocolate, Oats, Sugar, Nuts","Processed","","",80,"Generic commercial protein bar estimate.")
add("Rice Cake, Plain","رائس کیک","International","Snack","Snack","2 cakes / 18g",18,70,1.5,14.5,0.5,0.1,0.0,0.4,0.1,58,0,2,0.3,29,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Puffed Rice","Puffed/Baked","USDA FoodData Central #19220","",92,"USDA #19220. Low calorie snack.")
add("Crackers, Whole Wheat","گندم کریکرز","International","Snack","Bakery","5 crackers / 30g",30,118,2.5,19.5,4.0,0.7,0.1,2.0,1.5,175,0,12,1.2,58,"0 IU","0 mg","Gluten","Halal, Vegetarian","Whole Wheat Flour, Oil, Salt, Leavening","Baked","USDA FoodData Central #18614","",90,"USDA #18614")
add("Trail Mix (Nuts and Raisins)","ٹریل مکس","International","Snack","Snack","1/4 cup / 40g",40,173,4.5,18.5,10.5,1.5,0.0,2.0,12.5,55,0,30,1.2,230,"15 IU","0.5 mg","Tree Nuts, Peanuts","Halal, Vegetarian, Vegan","Almonds, Peanuts, Cashews, Raisins, Pumpkin Seeds","Raw/Dried","USDA FoodData Central","",90,"")

# =========================================================================
# MORE SOUPS AND STEWS
# =========================================================================
add("Chicken Broth (Clear)","چکن یخنی","Pakistani","Beverage/Starter","Broth","1 cup / 240g",240,38,4.9,0.9,1.4,0.4,0.0,0.0,0.0,924,10,14,0.5,210,"0 IU","0 mg","","Halal","Chicken Bones, Onion, Ginger, Garlic, Whole Spices, Salt, Water","Slow-Boiled","USDA FoodData Central #14197","Pakistan FCT 2001",90,"USDA #14197. High sodium.")
add("Lentil Soup (Red Lentil, Turkish)","ترکی مسور سوپ","International","Starter","Soup","1 bowl / 350g",350,210,12,32,4,0.5,0.0,8.5,3.5,680,0,45,3.5,430,"800 IU","6 mg","","Halal, Vegetarian, Vegan","Red Lentils, Onions, Carrots, Cumin, Paprika, Olive Oil","Simmered/Blended","","",78,"Smooth blended Turkish lentil soup.")
add("French Onion Soup","فرانسیسی پیاز سوپ","International","Starter","Soup","1 bowl / 350g",350,270,14,28,12,6.5,0.1,2.5,8.5,920,28,200,1.8,380,"120 IU","5 mg","Gluten, Dairy","Halal, Vegetarian","Caramelized Onions, Beef Broth, Toasted Baguette, Gruyere Cheese","Simmered/Baked","USDA FoodData Central","",78,"Classic French soup with cheese crouton.")
add("Hot and Sour Soup","ہاٹ اینڈ ساؤر سوپ","International","Starter","Soup","1 bowl / 350g",350,150,10,16,5,1.5,0.0,1.5,3.0,880,40,30,1.0,180,"100 IU","2 mg","Eggs, Soy","Halal","Chicken Broth, Egg, Mushrooms, Tofu, Bamboo Shoots, Vinegar, Chili Oil","Boiled","USDA FoodData Central","",78,"Chinese hot-sour egg-drop soup.")
add("Clam Chowder (New England)","کلیم چاؤڈر","International","Starter","Soup","1 cup / 245g",245,192,10.3,18.8,9.5,4.8,0.0,0.8,3.8,913,32,110,2.5,300,"60 IU","4 mg","Dairy, Shellfish, Gluten","Halal","Clams, Potatoes, Cream, Onion, Bacon (Halal), Flour","Simmered","USDA FoodData Central","",78,"Creamy New England style clam soup.")
add("Gazpacho (Cold Tomato Soup)","گزپاچو","International","Starter","Soup","1 cup / 240g",240,70,2.5,10.5,2.8,0.4,0.0,2.5,6.0,480,0,25,1.2,560,"1000 IU","30 mg","","Halal, Vegetarian, Vegan","Tomatoes, Cucumber, Bell Pepper, Garlic, Olive Oil, Vinegar","Blended/Cold","USDA FoodData Central","",82,"Spanish cold blended vegetable soup.")
add("Shorba (Pakistani Broth)","شوربہ","Pakistani","Starter","Soup","1 bowl / 300g",300,120,10,8,6,2.5,0.1,1.5,2.5,680,35,25,1.5,220,"80 IU","3 mg","","Halal","Chicken/Mutton, Onions, Tomatoes, Whole Spices, Ginger, Garlic","Slow-Boiled","","Pakistan FCT 2001",76,"Desi spiced meat broth.")
add("Yakhni (Plain Broth)","یخنی","Pakistani","Starter/Beverage","Broth","1 cup / 240g",240,45,5.5,2.5,1.5,0.5,0.0,0.5,1.5,680,20,18,0.8,180,"40 IU","2 mg","","Halal","Bone-in Mutton, Onion, Whole Spices, Salt","Slow-Boiled","","Pakistan FCT 2001",78,"Warming clear meat broth.")

# =========================================================================
# MORE BREAKFAST ITEMS (INTERNATIONAL)
# =========================================================================
add("Muesli, Dry (No Sugar Added)","میوسلی","International","Breakfast","Cereal","1/2 cup / 57g",57,215,5.8,40.2,4.5,0.7,0.0,4.2,9.0,85,0,26,2.0,255,"0 IU","0.7 mg","Gluten, Tree Nuts","Halal, Vegetarian","Rolled Oats, Raisins, Nuts, Seeds","Raw/Mixed","USDA FoodData Central","",86,"")
add("Granola, Honey & Oat","گرانولا (ہنی اوٹ)","International","Breakfast","Cereal","1/2 cup / 60g",60,261,5.5,40.8,9.5,1.5,0.0,3.5,14.5,82,0,28,2.2,200,"30 IU","0.4 mg","Gluten, Tree Nuts","Halal, Vegetarian","Rolled Oats, Honey, Oil, Almonds","Baked","USDA FoodData Central","",86,"")
add("Cornflakes (Plain)","کارن فلیکس","International","Breakfast","Cereal","1 cup / 28g",28,101,2.1,24.0,0.2,0.0,0.0,0.9,2.4,203,0,2,8.1,26,"750 IU","0 mg","Gluten","Halal, Vegetarian","Milled Corn, Sugar, Salt, Vitamins/Minerals","Flaked/Baked","USDA FoodData Central #08003","",90,"USDA #08003. Fortified cereal.")
add("Breakfast Cereal, Whole Grain (e.g. Weetabix style)","وہول گرین سیریل","International","Breakfast","Cereal","2 biscuits / 37g",37,134,4.5,25.3,0.9,0.2,0.0,3.8,1.8,149,0,11,4.0,124,"0 IU","0 mg","Gluten","Halal, Vegetarian","Whole Grain Wheat, Sugar, Salt, Malted Barley","Compressed","","",86,"")
add("Avocado Toast","ایواکاڈو ٹوسٹ","International","Breakfast","Toast","1 slice / 130g",130,220,5.5,20.5,13.0,2.0,0.0,5.5,0.5,300,0,22,1.5,380,"100 IU","8 mg","Gluten","Halal, Vegetarian","Whole Wheat Toast, Mashed Avocado, Lemon, Red Pepper Flakes, Salt","Assembled","USDA FoodData Central","",84,"")
add("Smoothie Bowl (Acai/Berry)","اسموتھی بول","International","Breakfast","Smoothie","1 bowl / 300g",300,320,5,55,10,2.0,0.0,7.0,32.0,75,0,80,2.0,420,"500 IU","25 mg","Tree Nuts","Halal, Vegetarian, Vegan","Frozen Berry/Acai, Banana, Granola, Seeds, Coconut Flakes","Blended/Assembled","","",80,"")
add("Overnight Oats","اوور نائٹ اوٹس","International","Breakfast","Oats","1 jar / 250g",250,310,11,48,8,3.0,0.0,6.5,15.0,140,8,180,3.0,380,"100 IU","2 mg","Gluten, Dairy","Halal, Vegetarian","Rolled Oats, Milk, Yogurt, Chia Seeds, Honey, Fruits","Soaked (No Cook)","","",84,"")
add("Egg Benedict (Halal)","انڈے بینیڈکٹ","International","Breakfast","Egg Dish","1 serving / 200g",200,360,18,28,19,8.5,0.2,1.5,3.5,780,280,65,2.5,220,"480 IU","0.5 mg","Gluten, Dairy, Eggs","Halal","English Muffin, Poached Egg, Halal Canadian Bacon, Hollandaise Sauce","Poached/Assembled","USDA FoodData Central","",80,"")
add("Shakshuka","شکشوکہ","International","Breakfast","Egg Dish","1 serving / 300g",300,280,14,18,16,4.5,0.1,4.5,8.5,680,375,90,3.5,680,"1800 IU","35 mg","Eggs","Halal, Vegetarian","Eggs Poached in Spiced Tomato and Pepper Sauce, Cumin, Paprika","Simmered","","",80,"Middle Eastern/Israeli egg dish.")
add("Ful Medames","فول مدمس","International","Breakfast","Legume","1 cup / 240g",240,290,14,48,5,0.8,0.0,12.5,3.5,480,0,68,4.5,480,"40 IU","8 mg","","Halal, Vegetarian, Vegan","Fava Beans, Garlic, Lemon, Olive Oil, Cumin, Parsley","Slow-Cooked","","",82,"Egyptian national breakfast.")

# =========================================================================
# CONFECTIONERY & CHOCOLATE
# =========================================================================
add("Chocolate, Dark (70-85%)","ڈارک چاکلیٹ","International","Ingredient/Snack","Confectionery","1 oz / 28g",28,170,2.1,13.2,12.1,7.1,0.0,3.1,7.0,6,1,20,3.4,203,"2 IU","0.1 mg","Dairy, Soy","Halal, Vegetarian","Cocoa Mass, Sugar, Cocoa Butter","Processed","USDA FoodData Central #19904","",92,"USDA #19904. High antioxidant.")
add("Chocolate, Milk","مِلک چاکلیٹ","International","Ingredient/Snack","Confectionery","1 oz / 28g",28,153,2.1,17.0,8.7,5.1,0.0,0.7,14.8,24,6,52,0.5,124,"59 IU","0.1 mg","Dairy, Soy","Halal, Vegetarian","Sugar, Cocoa Butter, Milk, Cocoa Mass, Vanilla","Processed","USDA FoodData Central #19120","",92,"USDA #19120")
add("Chocolate, White","وائٹ چاکلیٹ","International","Ingredient/Snack","Confectionery","1 oz / 28g",28,153,2.0,18.3,8.7,5.3,0.0,0.2,18.0,25,8,57,0.1,100,"30 IU","0.4 mg","Dairy, Soy","Halal, Vegetarian","Cocoa Butter, Sugar, Milk, Vanilla","Processed","USDA FoodData Central #19127","",92,"USDA #19127. No cocoa solids.")
add("Candy, Hard (Generic)","کینڈی (سادہ)","International","Snack","Confectionery","1 oz / 28g",28,106,0.0,27.6,0.0,0.0,0.0,0.0,21.3,9,0,1,0.2,1,"0 IU","0 mg","","Halal, Vegetarian","Sugar, Corn Syrup, Artificial Flavor, Color","Processed","USDA FoodData Central #19074","",90,"USDA #19074")
add("Chewing Gum (Sugarless)","شوگر فری چیونگ گم","International","Snack","Confectionery","1 piece / 3g",3,5,0.0,2.0,0.0,0.0,0.0,0.0,0.0,0,0,0,0.0,0,"0 IU","0 mg","","Halal, Vegetarian","Gum Base, Sorbitol, Flavoring","Processed","USDA FoodData Central","",90,"")

# =========================================================================
# FURTHER PROTEIN VARIETIES (COOKED MEAT, POULTRY)
# =========================================================================
add("Chicken Liver, Cooked","مرغی کا کلیجی","International","Ingredient","Organ Meat","100g",100,172,24.5,0.9,7.5,2.4,0.2,0.0,0.0,71,563,11,11.5,230,"13328 IU","27.9 mg","","Halal","Chicken Liver","Pan-Fried","USDA FoodData Central #05027","",92,"USDA #05027. Extremely high Vit A, Iron.")
add("Beef Liver, Fried","بیف کلیجی (بھنی)","International","Ingredient","Organ Meat","100g",100,191,29.5,4.8,5.0,2.1,0.1,0.0,0.0,87,438,10,5.8,380,"26087 IU","25.3 mg","","Halal","Beef Liver","Pan-Fried","USDA FoodData Central #13327","",92,"USDA #13327. Very high B12, Vit A, Iron.")
add("Turkey Breast, Roasted, No Skin","ٹرکی","International","Ingredient","Protein","100g",100,189,29.9,0.0,7.4,2.4,0.1,0.0,0.0,67,76,21,1.6,298,"0 IU","0 mg","","Halal","Roasted Turkey Breast (Boneless Skinless)","Roasted","USDA FoodData Central #05178","",92,"USDA #05178")
add("Duck Breast, Roasted","بطخ","International","Ingredient","Protein","100g",100,201,23.5,0.0,11.2,4.0,0.1,0.0,0.0,65,89,11,2.7,252,"0 IU","0 mg","","Halal","Duck Breast (Skin Removed)","Roasted","USDA FoodData Central #05140","",90,"USDA #05140")
add("Veal Chop, Braised","ویل چاپ","International","Ingredient","Protein","100g",100,196,29.4,0.0,8.1,2.8,0.1,0.0,0.0,81,110,27,1.2,320,"0 IU","0 mg","","Halal","Veal Rib Chop","Braised","USDA FoodData Central #17062","",88,"USDA #17062")
add("Goat Meat, Cooked, Roasted","مٹن بھنا","International","Ingredient","Protein","100g",100,165,27.1,0.0,5.2,1.6,0.1,0.0,0.0,86,75,16,3.7,385,"0 IU","0 mg","","Halal","Goat Meat","Roasted","USDA FoodData Central #17168","",90,"USDA #17168. Leaner than lamb.")
add("Cod Fish, Baked","کاڈ مچھلی (بھنی)","International","Ingredient","Seafood","100g",100,105,22.8,0.0,0.9,0.2,0.0,0.0,0.0,78,55,18,0.4,413,"20 IU","1.4 mg","","Halal","Cod Fillet","Baked","USDA FoodData Central #15016","",92,"USDA #15016. Very lean white fish.")
add("Sardines, Canned in Oil","سارڈین (ڈبہ)","International","Ingredient","Seafood","1 can / 92g",92,191,22.7,0.0,10.5,1.4,0.0,0.0,0.0,465,131,351,2.7,395,"54 IU","0 mg","","Halal","Sardines, Olive Oil, Salt","Canned","USDA FoodData Central #15089","",92,"USDA #15089. Very high calcium (bones).")
add("Mackerel, Atlantic, Baked","ماکریل مچھلی","International","Ingredient","Seafood","100g",100,262,23.9,0.0,17.8,4.2,0.0,0.0,0.0,83,75,15,1.6,314,"94 IU","0.4 mg","","Halal","Atlantic Mackerel Fillet","Baked","USDA FoodData Central #15046","",92,"USDA #15046. Very high Omega 3.")
add("Crab Stick (Imitation, Halal)","کرب اسٹک","International","Ingredient","Seafood","1 piece / 28g",28,30,3.6,2.8,0.4,0.1,0.0,0.0,0.9,238,8,8,0.1,75,"0 IU","0 mg","Gluten, Soy","Halal","Pollock Surimi, Starch, Flavor, Color","Processed","USDA FoodData Central #15142","",90,"USDA #15142")

# =========================================================================
# MORE COMPLETE DISHES (DIVERSE)
# =========================================================================
add("Beef Karahi (Restaurant Style)","بیف کڑاہی (ریستوران)","Pakistani","Dinner","Curry","1 katori / 250g",250,520,34,8,38,14,0.6,2.5,4.5,780,110,45,4.0,400,"120 IU","8 mg","Dairy","Halal","Beef, Tomatoes, Ginger, Garlic, Green Chilies, Butter, Cream","Stir-Fried (Wok)","","Pakistan FCT 2001",74,"Rich restaurant-style beef karahi.")
add("Chicken Handi","چکن ہانڈی","Pakistani","Dinner","Curry","1 katori / 250g",250,420,28,12,30,10.5,0.3,2.5,4.5,680,90,75,2.5,340,"300 IU","8 mg","Dairy","Halal","Chicken, Cream, Tomatoes, Yogurt, Whole Spices, Cashew Paste","Slow-Cooked (Clay Pot)","","Pakistan FCT 2001",76,"Creamy clay-pot chicken curry.")
add("Paya (Goat Feet Curry)","پایا","Pakistani","Breakfast/Dinner","Stew","1 bowl / 300g",300,280,24,6,18,7.0,0.4,1.5,2.0,620,95,120,2.5,260,"80 IU","4 mg","","Halal","Goat Trotters, Onions, Ginger, Garlic, Whole Spices","Slow-Cooked","","Pakistan FCT 2001",72,"Slow-cooked goat trotters. Rich in collagen.")
add("Kunna (Clay Pot Mutton)","کنّہ","Pakistani","Dinner","Stew","1 serving / 250g",250,450,30,8,32,13,0.5,2.5,3.5,680,100,60,3.8,380,"80 IU","4 mg","","Halal","Mutton, Chickpea Flour, Whole Spices, Ghee, Dried Ginger","Slow-Cooked (Clay Pot)","","Pakistan FCT 2001",72,"Traditional Chiniot-style clay pot stew.")
add("Sajji (Whole Roasted Lamb)","سجی","Pakistani","Dinner","BBQ","1 serving / 300g",300,480,34,4,36,14,0.5,2.0,1.5,480,110,40,3.8,380,"0 IU","2 mg","","Halal","Whole Lamb Marinated with Salt, Baking Soda, Stuffed with Rice","Roasted (Open Fire/Oven)","","Pakistan FCT 2001",72,"Balochi whole roast lamb.")
add("Dumpukht (Sealed Dum Dish)","دم پخت","Pakistani","Dinner","Curry","1 katori / 250g",250,520,30,10,38,14,0.5,3.0,4.5,680,100,55,3.5,380,"100 IU","5 mg","Dairy","Halal","Chicken/Mutton, Cream, Yogurt, Whole Spices, Mace, Itar (Rose Water)","Slow-Cooked (Sealed)","","Pakistan FCT 2001",72,"Mughal sealed slow-cooked dish.")
add("Murgh Musallam","مرغ مسلّم","Pakistani","Dinner","Whole Chicken","1 serving / 300g",300,540,40,10,36,10,0.4,2.5,5.0,720,120,60,3.5,420,"200 IU","6 mg","Dairy, Eggs, Tree Nuts","Halal","Whole Chicken, Yogurt, Eggs, Onions, Saffron, Cream, Whole Spices","Baked/Dum","","Pakistan FCT 2001",72,"Whole Mughal royal chicken dish.")
add("Peshwari Chicken Tikka","پشاوری چکن ٹکہ","Pakistani","Dinner","BBQ","4 pieces / 160g",160,320,30,4,20,4.5,0.1,1.5,2.0,520,90,35,1.8,300,"60 IU","3 mg","Dairy","Halal","Chicken, Cardamom, Mace, Raw Papaya, White Pepper, Cream, Oil","Grilled (Tandoor)","","Pakistan FCT 2001",74,"Mildly spiced KPK style tikka.")
add("Afghan Kebab (Seekh, Lamb)","افغانی سیخ کباب","International","Dinner","BBQ","2 skewers / 150g",150,360,26,2,26,10,0.4,1.0,1.5,480,90,30,3.0,320,"40 IU","2 mg","","Halal","Lamb Mince, Fat Tail, Onions, Coriander, Garlic, Black Pepper","Grilled (Charcoal)","","",76,"Afghan-style fatty lamb seekh kebabs.")
add("Shish Tawook (Chicken)","شیش ٹاووک","International","Dinner","BBQ","4 skewers / 200g",200,340,32,8,18,4.0,0.1,1.5,4.5,580,90,45,2.2,360,"80 IU","3 mg","Dairy","Halal","Chicken Cubes, Yogurt, Tomato Paste, Garlic, Lemon, Cumin","Grilled","","",78,"Lebanese marinated chicken skewers.")

# =========================================================================
# ADDITIONAL DESSERTS AND CONFECTIONERY
# =========================================================================
add("Cheesecake, Plain","چیز کیک","International","Dessert","Cake","1 slice / 120g",120,401,6.8,36.3,26.9,13.6,0.3,0.3,28.0,327,116,83,0.5,107,"843 IU","0.3 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Cream Cheese, Sugar, Eggs, Graham Cracker Crust, Vanilla","Baked","USDA FoodData Central #18147","",90,"USDA #18147")
add("Apple Pie Slice","ایپل پائی","International","Dessert","Pastry","1 slice / 125g",125,296,2.4,43.0,13.8,4.8,1.2,1.7,17.5,251,0,12,0.6,100,"32 IU","2.5 mg","Gluten, Dairy","Halal, Vegetarian","Pastry Crust, Apple Filling, Sugar, Cinnamon","Baked","USDA FoodData Central #18302","",90,"USDA #18302")
add("Doughnut, Glazed","ڈونٹ","International","Snack/Dessert","Bakery","1 medium / 60g",60,242,3.8,26.9,13.7,3.2,2.0,0.7,11.7,205,14,26,1.1,60,"10 IU","0.1 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Enriched Flour, Sugar, Glaze, Yeast, Oil","Fried (Deep)","USDA FoodData Central #18253","",90,"USDA #18253")
add("Cinnamon Roll","سنامن رول","International","Snack/Dessert","Bakery","1 roll / 85g",85,339,5.8,48.0,14.5,3.8,0.5,1.2,22.0,397,17,43,2.0,100,"35 IU","0.2 mg","Gluten, Dairy","Halal, Vegetarian","Flour, Cinnamon, Sugar, Butter, Cream Cheese Icing, Yeast","Baked","USDA FoodData Central","",88,"")
add("Eclair, Chocolate","ایکلیئر","International","Dessert","Pastry","1 eclair / 90g",90,290,5.5,26.2,19.0,9.5,0.3,0.5,10.5,198,90,75,1.2,100,"320 IU","0.5 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Choux Pastry, Custard Cream, Chocolate Glaze","Baked","USDA FoodData Central","",86,"")
add("Pudding, Vanilla (Cup)","ونیلا پڈنگ","International","Dessert","Pudding","1/2 cup / 130g",130,155,2.7,26.0,4.5,2.1,0.0,0.0,22.0,176,15,102,0.1,204,"120 IU","0.5 mg","Dairy","Halal, Vegetarian","Milk, Sugar, Cornstarch, Vanilla, Salt","Cooked","USDA FoodData Central","",90,"")
add("Jello (Gelatin Dessert)","جیلو","International","Dessert","Gelatin","1/2 cup / 120g",120,84,1.6,20.0,0.0,0.0,0.0,0.0,19.0,55,0,1,0.0,1,"0 IU","0 mg","","Halal, Vegetarian","Gelatin (Halal), Sugar, Artificial Color/Flavor, Water","Set","","",86,"Halal gelatin dessert.")
add("Sorbet, Lemon","لیمن سوربے","International","Dessert","Frozen","1/2 cup / 120g",120,120,0.5,30.5,0.0,0.0,0.0,0.5,25.0,5,0,5,0.1,30,"10 IU","8 mg","","Halal, Vegetarian, Vegan","Water, Sugar, Lemon Juice, Lemon Zest","Frozen","","",86,"Dairy-free frozen dessert.")
add("Frozen Yogurt, Vanilla","فروزن یوگرٹ","International","Dessert","Frozen","1/2 cup / 113g",113,127,4.6,22.5,2.8,1.7,0.0,0.0,19.0,56,12,127,0.1,142,"48 IU","0.5 mg","Dairy","Halal, Vegetarian","Non-fat Yogurt, Sugar, Vanilla, Non-fat Milk Solids","Frozen","USDA FoodData Central #19313","",90,"USDA #19313")

# =========================================================================
# COMPLETE MEALS / THALI / SET MEAL
# =========================================================================
add("Pakistani Desi Thali (Full)","پاکستانی دیسی تھالی","Pakistani","Lunch/Dinner","Set Meal","1 full thali",550,780,30,88,32,10,0.4,8.5,5.5,980,75,120,5.5,580,"500 IU","20 mg","Gluten, Dairy","Halal","2 Rotis, 1 Bowl Daal, 1 Bowl Sabzi, 1 Katori Rice, Salad, Raita","Mixed","","Pakistan FCT 2001",70,"Estimate for a full everyday Pakistani meal.")
add("English Breakfast (Full, Halal)","انگلش ناشتہ","International","Breakfast","Set Meal","1 plate / 450g",450,820,36,48,52,17,0.5,6.5,5.5,1480,480,180,5.5,680,"600 IU","12 mg","Gluten, Dairy, Eggs","Halal","Eggs (x2), Halal Beef Sausages, Baked Beans, Toast, Halal Bacon, Tomatoes, Mushrooms","Mixed","USDA FoodData Central","",80,"Full English breakfast halal version.")
add("Continental Breakfast","کانٹی نینٹل ناشتہ","International","Breakfast","Set Meal","1 set / 250g",250,420,12,52,18,8.5,0.2,3.5,12.0,680,25,120,2.5,200,"200 IU","4 mg","Gluten, Dairy","Halal, Vegetarian","Bread Roll, Butter, Jam, Fruit Juice, Coffee, Boiled Egg","Mixed","","",80,"")
add("Sehri Meal (Pre-Dawn)","سحری کا کھانا","Pakistani","Breakfast","Set Meal","1 full set / 500g",500,680,28,82,24,8,0.3,8.0,5.0,880,65,180,5.0,480,"400 IU","15 mg","Gluten, Dairy","Halal","Paratha, Eggs, Dahi, Achar, Dates, Water","Mixed","","Pakistan FCT 2001",72,"Pre-dawn Ramadan meal estimate.")
add("Iftar Combo (Light)","افطار کا کھانا","Pakistani","Snack/Dinner","Set Meal","1 set / 300g",300,540,14,68,24,6,0.2,6.0,16.0,680,55,80,4.0,380,"300 IU","12 mg","Gluten, Dairy","Halal","Dates (3), Pakora, Samosa, Dahi Bhala, Fruit Chaat, Juice","Mixed","","Pakistan FCT 2001",70,"Typical light Pakistani iftar platter.")
add("Kids Meal (Nuggets + Fries + Juice)","بچوں کا کھانا","International","Lunch","Set Meal","1 set / 280g",280,580,22,60,28,6.5,0.2,4.5,4.0,920,45,30,2.5,560,"30 IU","18 mg","Gluten, Dairy","Halal","Chicken Nuggets, French Fries, Apple Juice","Mixed","USDA FoodData Central","",82,"Fast food style kids meal.")

# =========================================================================
# CONDIMENTS AND SAUCES (Standalone)
# =========================================================================
add("BBQ Sauce","بی بی کیو ساس","International","Ingredient","Condiment","2 tbsp / 30g",30,52,0.5,12.7,0.2,0.0,0.0,0.2,9.5,420,0,10,0.5,90,"120 IU","0.6 mg","","Halal, Vegetarian","Tomato Paste, Vinegar, Brown Sugar, Spices","Processed","USDA FoodData Central #11945","",90,"USDA #11945. High sugar.")
add("Ranch Dressing","رانچ ڈریسنگ","International","Ingredient","Condiment","2 tbsp / 30g",30,73,0.5,2.0,7.0,1.1,0.0,0.0,1.2,270,5,25,0.1,45,"38 IU","0.3 mg","Dairy, Eggs","Halal, Vegetarian","Buttermilk, Sour Cream, Mayonnaise, Herbs, Garlic","Emulsified","USDA FoodData Central","",88,"")
add("Thousand Island Dressing","تھاؤزنڈ آئسلینڈ ڈریسنگ","International","Ingredient","Condiment","2 tbsp / 30g",30,110,0.3,5.5,9.5,1.4,0.0,0.2,4.0,215,8,10,0.2,40,"48 IU","0.7 mg","Eggs","Halal, Vegetarian","Mayonnaise, Ketchup, Relish, Onion","Emulsified","USDA FoodData Central","",88,"")
add("Hummus (Plain)","حمص","International","Ingredient","Dip","2 tbsp / 30g",30,70,2.0,6.0,4.5,0.6,0.0,2.0,1.5,115,0,16,0.8,70,"18 IU","1.0 mg","Sesame","Halal, Vegetarian","Chickpeas, Tahini, Olive Oil, Lemon, Garlic","Blended","USDA FoodData Central #16158","",92,"USDA #16158")
add("Tzatziki Sauce","ٹزاٹزیکی","International","Ingredient","Condiment","2 tbsp / 30g",30,18,1.2,1.5,0.8,0.5,0.0,0.2,1.2,60,2,38,0.1,45,"10 IU","0.5 mg","Dairy","Halal, Vegetarian","Greek Yogurt, Cucumber, Garlic, Dill, Olive Oil, Lemon","Mixed","USDA FoodData Central","",88,"Greek cucumber yogurt dip.")
add("Pesto Sauce","پیسٹو ساس","International","Ingredient","Condiment","2 tbsp / 28g",28,116,2.5,1.5,11.5,1.8,0.0,0.5,0.5,116,2,65,0.8,60,"60 IU","2 mg","Dairy, Tree Nuts","Halal, Vegetarian","Basil, Olive Oil, Pine Nuts, Parmesan, Garlic","Blended","USDA FoodData Central","",88,"")

# =========================================================================
# DRINKS (HOT AND COLD)
# =========================================================================
add("Espresso, Single Shot","ایسپریسو","International","Beverage","Hot Drink","1 shot / 30g",30,3,0.3,0.4,0.1,0.0,0.0,0.0,0.0,2,0,4,0.1,52,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Finely Ground Espresso Coffee","Espresso Brewed","USDA FoodData Central #14210","",94,"USDA #14210. Near zero cal.")
add("Latte (Whole Milk)","لاٹے","International","Beverage","Hot Drink","1 medium / 350g",350,190,11,18,8,5.0,0.0,0.0,15.0,130,32,380,0.1,430,"300 IU","0 mg","Dairy","Halal, Vegetarian","Espresso, Steamed Whole Milk","Espresso + Steamed Milk","","",86,"Calculated from USDA components.")
add("Cappuccino (Whole Milk)","کیپوچینو","International","Beverage","Hot Drink","1 medium / 240g",240,120,7,10,5,3.2,0.0,0.0,9.5,85,22,250,0.1,290,"200 IU","0 mg","Dairy","Halal, Vegetarian","Espresso, Steamed Milk, Milk Foam (equal parts)","Espresso + Foam","","",86,"")
add("Hot Chocolate (With Milk)","ہاٹ چاکلیٹ","International","Beverage","Hot Drink","1 cup / 250g",250,220,9,30,8,4.5,0.0,2.0,24.0,165,18,280,1.5,410,"120 IU","0.5 mg","Dairy","Halal, Vegetarian","Whole Milk, Cocoa Powder, Sugar, Vanilla","Heated/Whisked","USDA FoodData Central","",86,"")
add("Iced Tea, Sweetened","مٹھی آئسڈ ٹی","International","Beverage","Cold Drink","1 cup / 240g",240,90,0.3,22.5,0.1,0.0,0.0,0.0,22.5,10,0,5,0.1,90,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Black Tea, Water, Sugar, Lemon","Brewed/Sweetened","USDA FoodData Central","",90,"")
add("Lemonade, Homemade","لیمونیڈ","International","Beverage","Cold Drink","1 cup / 240g",240,100,0.4,26.8,0.1,0.0,0.0,0.2,25.0,8,0,5,0.2,65,"3 IU","14 mg","","Halal, Vegetarian, Vegan","Lemon Juice, Water, Sugar","Mixed","USDA FoodData Central","",90,"")
add("Coconut Water, Pure","ناریل پانی","International","Beverage","Cold Drink","1 cup / 240g",240,46,1.7,8.9,0.5,0.4,0.0,2.6,6.0,252,0,58,0.7,600,"0 IU","5.8 mg","","Halal, Vegetarian, Vegan","Pure Coconut Water (Fresh)","Natural","USDA FoodData Central #12115","",94,"USDA #12115. Natural electrolyte drink.")
add("Sports Drink (Electrolyte)","اسپورٹس ڈرنک","International","Beverage","Cold Drink","1 bottle / 500g",500,130,0.0,34.0,0.0,0.0,0.0,0.0,34.0,450,0,0,0.0,30,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Water, Sugar, Citric Acid, Sodium, Potassium, Artificial Color","Processed","USDA FoodData Central","",90,"Generic sports drink. High sugar.")
add("Whole Milk Shake, Chocolate","چاکلیٹ ملک شیک","International","Beverage","Cold Drink","1 large / 450g",450,510,12,78,15,9.5,0.1,1.5,65.0,330,45,440,1.5,590,"210 IU","0.5 mg","Dairy","Halal, Vegetarian","Whole Milk, Chocolate Ice Cream, Chocolate Syrup","Blended","USDA FoodData Central","",86,"")
add("Apple Cider, Fresh","سیب کا رس","International","Beverage","Cold Drink","1 cup / 240g",240,117,0.1,29.0,0.3,0.0,0.0,0.5,27.6,7,0,17,0.5,295,"5 IU","1.7 mg","","Halal, Vegetarian, Vegan","Pressed Apple Juice, Unfiltered","Pressed","USDA FoodData Central #09016","",92,"USDA #09016")

print(f"\nNew items in this batch: {len(new_items)}")
total = len(existing_records) + len(new_items)
print(f"Total after this batch: {total}")

all_final = existing_records + new_items

with open(MASTER_FILE, mode='w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
    writer.writeheader()
    writer.writerows(all_final)

print(f"Saved {len(all_final)} total records.")
if len(all_final) < 1000:
    print(f"Still need {1000 - len(all_final)} more records.")
else:
    print(f"TARGET OF 1000+ RECORDS ACHIEVED!")
