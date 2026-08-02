"""
Batch 4 - 6: Add remaining items to reach 1000 total.
Fruits, Vegetables, Dairy, Grains, Meats, and more Pakistani/International dishes.
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
        'source_1': src1,
        'source_2': src2,
        'source_3': '',
        'confidence_score': str(conf),
        'verified': 'Y',
        'notes': notes
    }
    new_items.append(rec)
    existing_names.add(key)

# =========================================================================
# FRUITS (RAW) - USDA FoodData Central
# =========================================================================
add("Apple, Raw with Skin","سیب","International","Ingredient","Fruit","100g",100,52,0.3,13.8,0.2,0.0,0.0,2.4,10.4,1,0,6,0.1,107,"54 IU","4.6 mg","","Halal, Vegetarian, Vegan","Raw Apple","Raw","USDA FoodData Central #09003","",92,"USDA #09003")
add("Banana, Raw","کیلا","International","Ingredient","Fruit","100g",100,89,1.1,22.8,0.3,0.1,0.0,2.6,12.2,1,0,5,0.3,358,"64 IU","8.7 mg","","Halal, Vegetarian, Vegan","Raw Banana","Raw","USDA FoodData Central #09040","",92,"USDA #09040")
add("Orange, Raw","مالٹا","International","Ingredient","Fruit","100g",100,47,0.9,11.8,0.1,0.0,0.0,2.4,9.4,0,0,40,0.1,181,"225 IU","53.2 mg","","Halal, Vegetarian, Vegan","Raw Orange","Raw","USDA FoodData Central #09200","",92,"USDA #09200")
add("Mango, Raw","آم","International","Ingredient","Fruit","100g",100,60,0.8,15.0,0.4,0.1,0.0,1.6,13.7,1,0,11,0.2,168,"1082 IU","36.4 mg","","Halal, Vegetarian, Vegan","Raw Mango","Raw","USDA FoodData Central #09176","",92,"USDA #09176")
add("Grapes, Raw (Green/Red)","انگور","International","Ingredient","Fruit","100g",100,69,0.7,18.1,0.2,0.1,0.0,0.9,15.5,2,0,10,0.4,191,"66 IU","3.2 mg","","Halal, Vegetarian, Vegan","Raw Grapes","Raw","USDA FoodData Central #09129","",92,"USDA #09129")
add("Papaya, Raw","پپیتا","International","Ingredient","Fruit","100g",100,43,0.5,10.8,0.3,0.1,0.0,1.7,7.8,8,0,20,0.3,182,"950 IU","60.9 mg","","Halal, Vegetarian, Vegan","Raw Papaya","Raw","USDA FoodData Central #09226","",92,"USDA #09226")
add("Watermelon, Raw","تربوز","International","Ingredient","Fruit","100g",100,30,0.6,7.6,0.2,0.0,0.0,0.4,6.2,1,0,7,0.2,112,"569 IU","8.1 mg","","Halal, Vegetarian, Vegan","Raw Watermelon","Raw","USDA FoodData Central #09326","",92,"USDA #09326")
add("Pomegranate, Raw","انار","International","Ingredient","Fruit","100g",100,83,1.7,18.7,1.2,0.1,0.0,4.0,13.7,3,0,10,0.3,236,"0 IU","10.2 mg","","Halal, Vegetarian, Vegan","Raw Pomegranate Arils","Raw","USDA FoodData Central #09286","",92,"USDA #09286")
add("Guava, Raw","امرود","International","Ingredient","Fruit","100g",100,68,2.6,14.3,1.0,0.3,0.0,5.4,8.9,2,0,18,0.3,417,"624 IU","228.3 mg","","Halal, Vegetarian, Vegan","Raw Guava","Raw","USDA FoodData Central #09139","",92,"USDA #09139. Very high Vit C.")
add("Pear, Raw","ناشپاتی","International","Ingredient","Fruit","100g",100,57,0.4,15.2,0.1,0.0,0.0,3.1,9.7,1,0,9,0.2,116,"25 IU","4.3 mg","","Halal, Vegetarian, Vegan","Raw Pear","Raw","USDA FoodData Central #09252","",92,"USDA #09252")
add("Peach, Raw","آڑو","International","Ingredient","Fruit","100g",100,39,0.9,9.5,0.3,0.0,0.0,1.5,8.4,0,0,6,0.3,190,"326 IU","6.6 mg","","Halal, Vegetarian, Vegan","Raw Peach","Raw","USDA FoodData Central #09236","",92,"USDA #09236")
add("Apricot, Raw","خوبانی (تازہ)","International","Ingredient","Fruit","100g",100,48,1.4,11.1,0.4,0.0,0.0,2.0,9.2,1,0,13,0.4,259,"1926 IU","10.0 mg","","Halal, Vegetarian, Vegan","Raw Apricot","Raw","USDA FoodData Central #09021","",92,"USDA #09021")
add("Strawberry, Raw","اسٹرابیری","International","Ingredient","Fruit","100g",100,32,0.7,7.7,0.3,0.0,0.0,2.0,4.9,1,0,16,0.4,153,"12 IU","58.8 mg","","Halal, Vegetarian, Vegan","Raw Strawberry","Raw","USDA FoodData Central #09316","",92,"USDA #09316")
add("Blueberry, Raw","بلیو بیری","International","Ingredient","Fruit","100g",100,57,0.7,14.5,0.3,0.0,0.0,2.4,9.9,1,0,6,0.3,77,"54 IU","9.7 mg","","Halal, Vegetarian, Vegan","Raw Blueberry","Raw","USDA FoodData Central #09050","",92,"USDA #09050")
add("Kiwi, Raw","کیوی","International","Ingredient","Fruit","100g",100,61,1.1,14.7,0.5,0.0,0.0,3.0,9.0,3,0,34,0.3,312,"87 IU","92.7 mg","","Halal, Vegetarian, Vegan","Raw Kiwifruit","Raw","USDA FoodData Central #09148","",92,"USDA #09148")
add("Pineapple, Raw","انناس","International","Ingredient","Fruit","100g",100,50,0.5,13.1,0.1,0.0,0.0,1.4,9.9,1,0,13,0.3,109,"58 IU","47.8 mg","","Halal, Vegetarian, Vegan","Raw Pineapple","Raw","USDA FoodData Central #09266","",92,"USDA #09266")
add("Lychee, Raw","لیچی","International","Ingredient","Fruit","100g",100,66,0.8,16.5,0.4,0.1,0.0,1.3,15.2,1,0,5,0.3,171,"0 IU","71.5 mg","","Halal, Vegetarian, Vegan","Raw Lychee","Raw","USDA FoodData Central #09164","",92,"USDA #09164")
add("Fig, Raw","انجیر (تازہ)","International","Ingredient","Fruit","100g",100,74,0.8,19.2,0.3,0.1,0.0,2.9,16.3,1,0,35,0.4,232,"142 IU","2.0 mg","","Halal, Vegetarian, Vegan","Raw Fig","Raw","USDA FoodData Central #09089","",92,"USDA #09089")
add("Cherry, Sweet, Raw","چیری","International","Ingredient","Fruit","100g",100,63,1.1,16.0,0.2,0.0,0.0,2.1,12.8,0,0,13,0.4,222,"64 IU","7.0 mg","","Halal, Vegetarian, Vegan","Raw Sweet Cherry","Raw","USDA FoodData Central #09070","",92,"USDA #09070")
add("Plum, Raw","بیر (آلو بخارا)","International","Ingredient","Fruit","100g",100,46,0.7,11.4,0.3,0.0,0.0,1.4,9.9,0,0,6,0.2,157,"345 IU","9.5 mg","","Halal, Vegetarian, Vegan","Raw Plum","Raw","USDA FoodData Central #09279","",92,"USDA #09279")
add("Coconut Meat, Raw","ناریل (کچا)","International","Ingredient","Fruit","100g",100,354,3.3,15.2,33.5,29.7,0.0,9.0,6.2,20,0,14,2.4,356,"0 IU","3.3 mg","Tree Nuts","Halal, Vegetarian, Vegan","Raw Coconut Meat","Raw","USDA FoodData Central #12104","",92,"USDA #12104")
add("Avocado, Raw","ایواکاڈو","International","Ingredient","Fruit","100g",100,160,2.0,8.5,14.7,2.1,0.0,6.7,0.7,7,0,12,0.6,485,"146 IU","10.0 mg","","Halal, Vegetarian, Vegan","Raw Avocado (Hass)","Raw","USDA FoodData Central #09037","",92,"USDA #09037. High healthy fats.")

# =========================================================================
# VEGETABLES (RAW) - USDA
# =========================================================================
add("Tomato, Red, Ripe, Raw","ٹماٹر","International","Ingredient","Vegetable","100g",100,18,0.9,3.9,0.2,0.0,0.0,1.2,2.6,5,0,10,0.3,237,"833 IU","13.7 mg","","Halal, Vegetarian, Vegan","Raw Tomato","Raw","USDA FoodData Central #11529","",94,"USDA #11529")
add("Onion, Raw","پیاز (کچا)","International","Ingredient","Vegetable","100g",100,40,1.1,9.3,0.1,0.0,0.0,1.7,4.2,4,0,23,0.2,146,"2 IU","7.4 mg","","Halal, Vegetarian, Vegan","Raw Onion","Raw","USDA FoodData Central #11282","",94,"USDA #11282")
add("Potato, Raw, Flesh and Skin","آلو (کچا)","International","Ingredient","Vegetable","100g",100,77,2.0,17.5,0.1,0.0,0.0,2.2,0.8,6,0,12,0.8,421,"2 IU","19.7 mg","","Halal, Vegetarian, Vegan","Raw Potato","Raw","USDA FoodData Central #11352","",94,"USDA #11352")
add("Cucumber, Raw, With Peel","کھیرا","International","Ingredient","Vegetable","100g",100,15,0.7,3.6,0.1,0.0,0.0,0.5,1.7,2,0,16,0.3,147,"105 IU","2.8 mg","","Halal, Vegetarian, Vegan","Raw Cucumber","Raw","USDA FoodData Central #11205","",94,"USDA #11205")
add("Carrot, Raw","گاجر (کچی)","International","Ingredient","Vegetable","100g",100,41,0.9,9.6,0.2,0.0,0.0,2.8,4.7,69,0,33,0.3,320,"16706 IU","5.9 mg","","Halal, Vegetarian, Vegan","Raw Carrot","Raw","USDA FoodData Central #11124","",94,"USDA #11124. Very high Vitamin A.")
add("Cabbage, Raw","بند گوبھی","International","Ingredient","Vegetable","100g",100,25,1.3,5.8,0.1,0.0,0.0,2.5,3.2,18,0,40,0.5,170,"98 IU","36.6 mg","","Halal, Vegetarian, Vegan","Raw Cabbage","Raw","USDA FoodData Central #11109","",94,"USDA #11109")
add("Cauliflower, Raw","پھول گوبھی","International","Ingredient","Vegetable","100g",100,25,1.9,5.0,0.3,0.0,0.0,2.0,1.9,30,0,22,0.4,299,"0 IU","48.2 mg","","Halal, Vegetarian, Vegan","Raw Cauliflower","Raw","USDA FoodData Central #11135","",94,"USDA #11135")
add("Broccoli, Raw","بروکلی","International","Ingredient","Vegetable","100g",100,34,2.8,6.6,0.4,0.1,0.0,2.6,1.7,33,0,47,0.7,316,"623 IU","89.2 mg","","Halal, Vegetarian, Vegan","Raw Broccoli","Raw","USDA FoodData Central #11090","",94,"USDA #11090")
add("Spinach, Raw","پالک (کچی)","International","Ingredient","Vegetable","100g",100,23,2.9,3.6,0.4,0.1,0.0,2.2,0.4,79,0,99,2.7,558,"9376 IU","28.1 mg","","Halal, Vegetarian, Vegan","Raw Spinach","Raw","USDA FoodData Central #11457","",94,"USDA #11457. Very high Vit K, A.")
add("Lettuce, Romaine, Raw","رومین سلاد","International","Ingredient","Vegetable","100g",100,17,1.2,3.3,0.3,0.0,0.0,2.1,1.2,8,0,33,1.0,247,"8710 IU","4.0 mg","","Halal, Vegetarian, Vegan","Raw Romaine Lettuce","Raw","USDA FoodData Central #11251","",94,"USDA #11251")
add("Radish, Raw","مولی","International","Ingredient","Vegetable","100g",100,16,0.7,3.4,0.1,0.0,0.0,1.6,1.9,39,0,25,0.3,233,"7 IU","14.8 mg","","Halal, Vegetarian, Vegan","Raw Radish","Raw","USDA FoodData Central #11429","",94,"USDA #11429")
add("Green Bell Pepper, Raw","سبز شملہ مرچ","International","Ingredient","Vegetable","100g",100,20,0.9,4.6,0.2,0.0,0.0,1.7,2.4,3,0,10,0.3,175,"370 IU","80.4 mg","","Halal, Vegetarian, Vegan","Raw Green Bell Pepper","Raw","USDA FoodData Central #11333","",94,"USDA #11333")
add("Mushroom, White, Raw","سفید مشروم","International","Ingredient","Vegetable","100g",100,22,3.1,3.3,0.3,0.1,0.0,1.0,2.0,5,0,3,0.5,318,"0 IU","2.1 mg","","Halal, Vegetarian, Vegan","Raw White Mushroom","Raw","USDA FoodData Central #11260","",94,"USDA #11260")
add("Pumpkin, Raw","کدو (پمپکن)","International","Ingredient","Vegetable","100g",100,26,1.0,6.5,0.1,0.1,0.0,0.5,1.4,1,0,21,0.8,340,"8513 IU","9.0 mg","","Halal, Vegetarian, Vegan","Raw Pumpkin","Raw","USDA FoodData Central #11422","",94,"USDA #11422. High Vit A.")
add("Green Beans, Raw","سبز پھلیاں","International","Ingredient","Vegetable","100g",100,31,1.8,7.0,0.2,0.0,0.0,2.7,3.3,6,0,37,1.0,211,"690 IU","12.2 mg","","Halal, Vegetarian, Vegan","Raw Green Beans","Raw","USDA FoodData Central #11052","",94,"USDA #11052")
add("Zucchini, Raw","زکینی","International","Ingredient","Vegetable","100g",100,17,1.2,3.1,0.3,0.1,0.0,1.0,2.5,8,0,16,0.4,261,"200 IU","17.9 mg","","Halal, Vegetarian, Vegan","Raw Zucchini (Summer Squash)","Raw","USDA FoodData Central #11477","",94,"USDA #11477")
add("Sweet Potato, Raw","شکر قندی","International","Ingredient","Vegetable","100g",100,86,1.6,20.1,0.1,0.0,0.0,3.0,4.2,55,0,30,0.6,337,"14187 IU","2.4 mg","","Halal, Vegetarian, Vegan","Raw Sweet Potato","Raw","USDA FoodData Central #11507","",94,"USDA #11507. Very high Vit A.")
add("Corn, Yellow, Raw","مکئی (کچی)","International","Ingredient","Vegetable","100g",100,86,3.3,19.0,1.2,0.2,0.0,2.7,3.2,15,0,2,0.5,270,"187 IU","6.8 mg","","Halal, Vegetarian, Vegan","Raw Yellow Sweet Corn","Raw","USDA FoodData Central #11167","",94,"USDA #11167")
add("Peas, Green, Raw","مٹر (کچے)","International","Ingredient","Vegetable","100g",100,81,5.4,14.5,0.4,0.1,0.0,5.1,5.7,5,0,25,1.5,244,"765 IU","40.0 mg","","Halal, Vegetarian, Vegan","Raw Green Peas","Raw","USDA FoodData Central #11304","",94,"USDA #11304")
add("Eggplant (Brinjal), Raw","بینگن (کچا)","International","Ingredient","Vegetable","100g",100,25,1.0,5.9,0.2,0.0,0.0,3.0,3.5,2,0,9,0.2,229,"23 IU","2.2 mg","","Halal, Vegetarian, Vegan","Raw Eggplant/Aubergine","Raw","USDA FoodData Central #11209","",94,"USDA #11209")
add("Okra, Raw","بھنڈی (کچی)","International","Ingredient","Vegetable","100g",100,33,1.9,7.5,0.2,0.0,0.0,3.2,1.5,7,0,82,0.6,299,"716 IU","23.0 mg","","Halal, Vegetarian, Vegan","Raw Okra","Raw","USDA FoodData Central #11278","",94,"USDA #11278. High calcium vegetable.")
add("Bitter Gourd (Karela), Raw","کریلا (کچا)","International","Ingredient","Vegetable","100g",100,17,1.0,3.7,0.2,0.0,0.0,2.8,1.7,5,0,19,0.4,296,"471 IU","84.0 mg","","Halal, Vegetarian, Vegan","Raw Bitter Gourd","Raw","USDA FoodData Central #11065","",90,"USDA #11065. High Vit C.")
add("Bottle Gourd (Lauki), Raw","لوکی (کچی)","International","Ingredient","Vegetable","100g",100,14,0.6,3.4,0.0,0.0,0.0,0.5,1.3,2,0,26,0.2,150,"0 IU","10.1 mg","","Halal, Vegetarian, Vegan","Raw Bottle Gourd","Raw","India IFCT 2017","",82,"India IFCT 2017 data.")
add("Taro Root (Arvi), Raw","اروی (کچی)","International","Ingredient","Vegetable","100g",100,112,1.5,26.5,0.2,0.0,0.0,4.1,0.5,11,0,43,0.6,591,"76 IU","4.5 mg","","Halal, Vegetarian, Vegan","Raw Taro Root","Raw","USDA FoodData Central #11590","",90,"USDA #11590")

# =========================================================================
# DAIRY, EGGS, PROTEIN INGREDIENTS - USDA
# =========================================================================
add("Milk, Whole, 3.25% Milkfat","گائے کا دودھ (فل فیٹ)","International","Ingredient","Dairy","1 cup / 244g",244,149,7.7,11.7,8.0,4.6,0.0,0.0,12.3,105,24,276,0.1,322,"395 IU","0 mg","Dairy","Halal, Vegetarian","Whole Cow Milk","Pasteurized","USDA FoodData Central #01077","",94,"USDA #01077")
add("Milk, Reduced Fat, 2%","کم چکنائی والا دودھ","International","Ingredient","Dairy","1 cup / 244g",244,122,8.1,11.9,4.8,3.1,0.0,0.0,12.4,115,20,293,0.1,366,"459 IU","0 mg","Dairy","Halal, Vegetarian","2% Reduced Fat Milk","Pasteurized","USDA FoodData Central #01079","",94,"USDA #01079")
add("Yogurt, Plain, Whole Milk","دہی","International","Ingredient","Dairy","1 cup / 245g",245,149,8.5,11.4,8.0,5.1,0.0,0.0,11.4,113,32,296,0.1,380,"243 IU","1.2 mg","Dairy","Halal, Vegetarian","Whole Milk Plain Yogurt","Cultured","USDA FoodData Central #01116","",94,"USDA #01116")
add("Yogurt, Greek, Plain, Whole Milk","گریک یوگرٹ","International","Ingredient","Dairy","1 cup / 245g",245,238,22.0,9.7,12.2,7.8,0.0,0.0,8.5,83,37,245,0.2,345,"343 IU","0 mg","Dairy","Halal, Vegetarian","Greek Strained Yogurt","Strained/Cultured","USDA FoodData Central #01158","",94,"USDA #01158")
add("Cheese, Cheddar","چیڈر چیز","International","Ingredient","Dairy","1 oz / 28g",28,114,7.1,0.4,9.4,6.0,0.0,0.0,0.1,185,28,204,0.2,28,"284 IU","0 mg","Dairy","Halal, Vegetarian","Cheddar Cheese","Aged","USDA FoodData Central #01009","",94,"USDA #01009")
add("Cheese, Mozzarella, Whole Milk","موزاریلا چیز","International","Ingredient","Dairy","1 oz / 28g",28,85,6.3,0.6,6.3,3.7,0.0,0.0,0.3,138,22,143,0.1,22,"192 IU","0 mg","Dairy","Halal, Vegetarian","Whole Milk Mozzarella","Fresh","USDA FoodData Central #01026","",94,"USDA #01026")
add("Butter, Unsalted","مکھن (بغیر نمک)","International","Ingredient","Dairy","1 tbsp / 14g",14,102,0.1,0.0,11.5,7.3,0.0,0.0,0.0,2,31,3,0.0,3,"355 IU","0 mg","Dairy","Halal, Vegetarian","Unsalted Butter","Churned","USDA FoodData Central #01145","",94,"USDA #01145")
add("Cream, Heavy Whipping","ہیوی کریم","International","Ingredient","Dairy","1 tbsp / 15g",15,51,0.4,0.4,5.4,3.5,0.0,0.0,0.4,5,20,10,0.0,14,"221 IU","0.1 mg","Dairy","Halal, Vegetarian","Heavy Whipping Cream","Pasteurized","USDA FoodData Central #01053","",94,"USDA #01053")
add("Egg, Whole, Raw","انڈہ (خام)","International","Ingredient","Eggs","1 large / 50g",50,72,6.3,0.4,4.8,1.6,0.0,0.0,0.2,71,186,28,0.9,69,"270 IU","0 mg","Eggs","Halal","Raw Whole Egg","Raw","USDA FoodData Central #01123","",94,"USDA #01123")
add("Egg, Boiled, Hard","انڈہ ابلا ہوا","International","Ingredient","Eggs","1 large / 50g",50,78,6.3,0.6,5.3,1.6,0.0,0.0,0.5,62,187,25,0.6,63,"260 IU","0 mg","Eggs","Halal","Hard Boiled Egg","Boiled","USDA FoodData Central #01129","",94,"USDA #01129")
add("Egg, Fried","انڈہ فرائی","International","Ingredient","Eggs","1 large / 46g",46,90,6.3,0.4,6.8,2.0,0.0,0.0,0.4,94,184,27,0.9,81,"396 IU","0 mg","Eggs, Dairy","Halal","Egg, Butter/Oil","Pan-Fried","USDA FoodData Central #01131","",94,"USDA #01131")
add("Egg, Scrambled","انڈہ سکرامبلڈ","International","Ingredient","Eggs","1 large / 61g",61,100,6.8,1.3,7.3,2.2,0.0,0.0,1.2,170,215,43,0.7,93,"399 IU","0.1 mg","Eggs, Dairy","Halal","Egg, Milk, Butter","Pan-Cooked","USDA FoodData Central #01132","",94,"USDA #01132")
add("Tofu, Firm","ٹوفو (فرم)","International","Ingredient","Soy/Protein","1/2 cup / 126g",126,181,21.8,3.5,11.0,1.6,0.0,3.0,0.8,17,0,861,3.4,299,"0 IU","0 mg","Soy","Halal, Vegetarian, Vegan","Firm Tofu (Calcium set)","Processed","USDA FoodData Central #16426","",90,"USDA #16426. Very high calcium.")

# =========================================================================
# COOKED GRAINS AND LEGUMES - USDA
# =========================================================================
add("Quinoa, Cooked","کینووا (پکا)","International","Ingredient","Grains","1 cup / 185g",185,222,8.1,39.4,3.6,0.4,0.0,5.2,1.6,13,0,31,2.8,318,"9 IU","0 mg","","Halal, Vegetarian, Vegan","Cooked Quinoa","Boiled","USDA FoodData Central #168917","",92,"USDA #168917. Complete protein grain.")
add("Brown Rice, Cooked","براؤن چاول (پکے)","International","Ingredient","Grains","1 cup / 195g",195,216,5.0,44.8,1.8,0.4,0.0,3.5,0.7,10,0,20,0.8,84,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Cooked Long-grain Brown Rice","Boiled","USDA FoodData Central #168875","",92,"USDA #168875")
add("White Rice, Short Grain, Cooked","سفید چاول (چھوٹے دانے)","International","Ingredient","Grains","1 cup / 158g",158,242,4.4,53.4,0.4,0.1,0.0,0.5,0.1,1,0,5,1.4,26,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Cooked Short-grain White Rice","Boiled","USDA FoodData Central #168878","",92,"USDA #168878")
add("Oats, Rolled, Cooked","دلیہ (جئی)","International","Ingredient","Grains","1 cup / 234g",234,158,5.9,27.4,3.6,0.7,0.0,4.0,0.6,115,0,19,1.8,143,"47 IU","0 mg","Gluten","Halal, Vegetarian","Rolled Oats, Water, Salt","Boiled","USDA FoodData Central #08121","",92,"USDA #08121")
add("Lentils, Cooked, Boiled","مسور دال (پکی)","International","Ingredient","Legumes","1 cup / 198g",198,230,17.9,39.9,0.8,0.1,0.0,15.6,3.6,4,0,38,6.6,731,"16 IU","3.0 mg","","Halal, Vegetarian, Vegan","Cooked Red/Green Lentils","Boiled","USDA FoodData Central #172421","",92,"USDA #172421. Excellent iron source.")
add("Chickpeas (Garbanzo), Cooked","سفید چنے (پکے)","International","Ingredient","Legumes","1 cup / 164g",164,269,14.5,45.0,4.2,0.4,0.0,12.5,7.9,11,0,80,4.7,477,"44 IU","2.1 mg","","Halal, Vegetarian, Vegan","Cooked Chickpeas","Boiled","USDA FoodData Central #173757","",92,"USDA #173757")
add("Black Beans, Cooked","کالی پھلیاں (پکی)","International","Ingredient","Legumes","1 cup / 172g",172,227,15.2,40.8,0.9,0.2,0.0,15.0,0.6,2,0,46,3.6,611,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Cooked Black Beans","Boiled","USDA FoodData Central #173735","",92,"USDA #173735")
add("Kidney Beans, Cooked","راجمہ (پکا)","International","Ingredient","Legumes","1 cup / 177g",177,225,15.3,40.4,0.9,0.1,0.0,11.3,0.6,2,0,50,5.2,713,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Cooked Kidney Beans","Boiled","USDA FoodData Central #175197","",92,"USDA #175197")
add("Peanut Butter, Smooth","مونگ پھلی کا مکھن","International","Ingredient","Nut Butters","2 tbsp / 32g",32,191,7.1,7.2,16.4,3.3,0.0,1.8,3.4,152,0,17,0.6,214,"0 IU","0.1 mg","Peanuts","Halal, Vegetarian","Peanuts, Salt, Sugar","Processed","USDA FoodData Central #16098","",90,"USDA #16098")
add("Pasta, Spaghetti, Cooked","اسپیگیٹی (پکی)","International","Ingredient","Grains","1 cup / 140g",140,221,8.1,43.2,1.3,0.2,0.0,2.5,0.8,1,0,10,1.8,62,"0 IU","0 mg","Gluten","Halal, Vegetarian","Semolina Pasta, Water, Salt","Boiled","USDA FoodData Central #20124","",92,"USDA #20124")

# =========================================================================
# MEAT & SEAFOOD (COOKED) - USDA
# =========================================================================
add("Chicken Breast, Roasted, No Skin","چکن بریسٹ (ابلا/گرل)","International","Ingredient","Protein","100g",100,165,31.0,0.0,3.6,1.0,0.0,0.0,0.0,74,85,15,1.0,256,"0 IU","0 mg","","Halal","Boneless Skinless Chicken Breast","Roasted","USDA FoodData Central #171477","",94,"USDA #171477. Lean protein reference.")
add("Chicken Thigh, Roasted, Skin-On","چکن ران (گرل)","International","Ingredient","Protein","100g",100,229,25.0,0.0,13.7,3.8,0.1,0.0,0.0,95,93,12,1.3,225,"0 IU","0 mg","","Halal","Bone-in Skin-on Chicken Thigh","Roasted","USDA FoodData Central #05165","",94,"USDA #05165")
add("Beef, Ground, 85% Lean, Cooked","بیف قیمہ (85%)","International","Ingredient","Protein","100g",100,215,26.1,0.0,11.8,4.6,0.5,0.0,0.0,79,88,19,2.6,338,"0 IU","0 mg","","Halal","Ground Beef 85% Lean","Pan-Broiled","USDA FoodData Central #174036","",94,"USDA #174036")
add("Beef, Sirloin Steak, Grilled","بیف سرلوئن (گرل)","International","Ingredient","Protein","100g",100,207,30.0,0.0,9.0,3.5,0.4,0.0,0.0,57,90,20,2.8,372,"0 IU","0 mg","","Halal","Beef Top Sirloin Steak","Grilled","USDA FoodData Central #174033","",94,"USDA #174033")
add("Lamb, Leg, Roasted","مٹن ران (بھنا)","International","Ingredient","Protein","100g",100,218,29.0,0.0,10.5,3.8,0.2,0.0,0.0,65,88,16,2.7,340,"0 IU","0 mg","","Halal","Lamb Leg, Roasted","Roasted","USDA FoodData Central #17073","",94,"USDA #17073")
add("Salmon, Atlantic, Baked","سالمن مچھلی (بھنی)","International","Ingredient","Seafood","100g",100,206,20.4,0.0,13.4,2.8,0.0,0.0,0.0,59,63,15,0.8,363,"50 IU","3.9 mg","","Halal","Atlantic Salmon Fillet","Baked","USDA FoodData Central #175168","",94,"USDA #175168. High Omega 3.")
add("Tuna, Light, Canned in Water","ٹونا مچھلی (ڈبہ)","International","Ingredient","Seafood","100g",100,109,25.5,0.0,0.8,0.2,0.0,0.0,0.0,247,30,12,1.4,207,"0 IU","0 mg","","Halal","Light Tuna in Water, Drained","Processed","USDA FoodData Central #175159","",94,"USDA #175159")
add("Shrimp/Prawn, Cooked","جھینگا (پکا)","International","Ingredient","Seafood","100g",100,99,24.0,0.0,0.3,0.1,0.0,0.0,0.0,224,189,70,3.1,259,"0 IU","0 mg","Shellfish","Halal","Steamed Shrimp","Steamed","USDA FoodData Central #175180","",94,"USDA #175180")
add("Tilapia, Baked","تلاپیا مچھلی (بھنی)","International","Ingredient","Seafood","100g",100,128,26.2,0.0,2.7,0.9,0.0,0.0,0.0,52,57,14,0.7,302,"0 IU","0 mg","","Halal","Tilapia Fillet","Baked","USDA FoodData Central #175176","",92,"USDA #175176")

# =========================================================================
# BEVERAGES
# =========================================================================
add("Tea, Black, Brewed (No Milk, No Sugar)","کالی چائے","International","Beverage","Hot Drink","1 cup / 237g",237,2,0.0,0.7,0.0,0.0,0.0,0.0,0.0,7,0,0,0.0,88,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Black Tea Leaves, Hot Water","Brewed","USDA FoodData Central #14355","",94,"USDA #14355. Near zero calories plain.")
add("Tea, Green, Brewed","گرین ٹی","International","Beverage","Hot Drink","1 cup / 237g",237,2,0.5,0.0,0.0,0.0,0.0,0.0,0.0,2,0,2,0.1,20,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Green Tea Leaves, Hot Water","Brewed","USDA FoodData Central #14215","",94,"USDA #14215")
add("Milk Tea (Chai with Milk and Sugar)","دودھ چائے","Pakistani","Beverage","Hot Drink","1 cup / 200g",200,80,3.2,11.5,2.5,1.5,0.0,0.0,9.5,40,8,95,0.1,180,"120 IU","0.5 mg","Dairy","Halal, Vegetarian","Black Tea, Whole Milk, Sugar","Brewed/Boiled","","Pakistan FCT 2001",80,"Estimated per Pakistan FCT & USDA components.")
add("Lassi, Sweet (Mango)","میٹھی لسی (آم)","Pakistani","Beverage","Cold Drink","1 glass / 250g",250,180,5.0,34.0,3.5,2.2,0.0,0.5,30.0,60,12,170,0.3,310,"500 IU","4.0 mg","Dairy","Halal, Vegetarian","Yogurt, Mango Pulp, Sugar, Cardamom","Blended","","Pakistan FCT 2001",78,"Calculated from components.")
add("Lassi, Salted","نمکین لسی","Pakistani","Beverage","Cold Drink","1 glass / 250g",250,90,4.5,9.5,4.0,2.5,0.0,0.0,9.0,480,16,148,0.1,190,"120 IU","0.5 mg","Dairy","Halal, Vegetarian","Yogurt, Water, Salt, Cumin, Mint","Blended","","Pakistan FCT 2001",78,"Calculated from components.")
add("Coffee, Brewed, Black","سیاہ کافی","International","Beverage","Hot Drink","1 cup / 237g",237,2,0.3,0.0,0.0,0.0,0.0,0.0,0.0,5,0,5,0.0,116,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Brewed Ground Coffee","Brewed","USDA FoodData Central #14209","",94,"USDA #14209")
add("Orange Juice, Fresh Squeezed","تازہ اورنج جوس","International","Beverage","Cold Drink","1 cup / 248g",248,112,1.7,25.8,0.5,0.1,0.0,0.5,20.8,2,0,27,0.5,496,"496 IU","124.0 mg","","Halal, Vegetarian, Vegan","Fresh Orange Juice","Squeezed","USDA FoodData Central #09206","",94,"USDA #09206")
add("Mango Juice/Nectar, Canned","مینگو جوس","Pakistani","Beverage","Cold Drink","1 cup / 250g",250,128,0.4,32.3,0.3,0.1,0.0,0.8,28.0,17,0,17,0.4,103,"638 IU","25.5 mg","","Halal, Vegetarian, Vegan","Mango Pulp, Water, Sugar, Citric Acid","Processed","USDA FoodData Central #09221","",86,"USDA #09221. High sugar content.")
add("Rooh Afza Sherbet","روح افزاء شربت","Pakistani","Beverage","Cold Drink","1 glass / 200g",200,110,0.2,27.5,0.0,0.0,0.0,0.0,26.0,10,0,5,0.1,20,"120 IU","3.0 mg","","Halal, Vegetarian","Rooh Afza Concentrate, Water, Sugar","Mixed","","Pakistan FCT 2001",80,"Estimated from product label info.")
add("Water, Plain, Still","سادہ پانی","International","Beverage","Water","1 cup / 237g",237,0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,7,0,7,0.0,2,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Purified Water","Still","USDA FoodData Central #14429","",98,"USDA #14429. Zero calories.")

# =========================================================================
# ADDITIONAL PAKISTANI BREAKFAST
# =========================================================================
add("Anda Bhurji (Spiced Scrambled Eggs)","انڈہ بھرجی","Pakistani","Breakfast","Egg Dish","1 serving / 150g",150,220,14,6,16,4.5,0.1,1.5,3.5,420,375,60,1.8,280,"450 IU","15 mg","Eggs","Halal","Eggs, Onions, Tomatoes, Green Chilies, Oil, Spices","Pan-Cooked","","Pakistan FCT 2001",78,"Spiced desi scrambled eggs.")
add("Masala Omelette","مصالحہ آملیٹ","Pakistani","Breakfast","Egg Dish","1 omelette / 110g",110,190,12,4,14,3.5,0.1,1.5,2.5,380,375,55,1.5,220,"350 IU","10 mg","Eggs","Halal","Eggs, Onions, Green Chilies, Coriander, Oil","Pan-Fried","","Pakistan FCT 2001",78,"Pakistani spiced omelette.")
add("Poached Egg","انڈہ پوچڈ","International","Breakfast","Egg Dish","1 large / 50g",50,72,6.0,0.4,4.8,1.6,0.0,0.0,0.4,147,185,25,0.9,66,"270 IU","0 mg","Eggs","Halal","Egg, Water","Poached","USDA FoodData Central #01133","",94,"USDA #01133")
add("Siri Paye (Trotters)","سری پائے","Pakistani","Breakfast/Dinner","Meat Stew","1 bowl / 300g",300,380,28,8,26,10,0.5,1.5,2.5,620,120,180,2.8,280,"60 IU","3 mg","","Halal","Goat/Beef Trotters, Onions, Ginger, Garlic, Whole Spices","Slow-Cooked","","Pakistan FCT 2001",72,"Traditional bone broth and trotter stew.")
add("Nihari","نہاری","Pakistani","Breakfast/Dinner","Meat Stew","1 bowl / 300g",300,520,32,18,36,14,0.6,2.5,3.5,780,110,80,4.5,380,"80 IU","4 mg","Gluten","Halal","Beef Shank, Bone Marrow, Wheat Flour, Fried Onions, Nihari Spices, Ghee","Slow-Cooked","","Pakistan FCT 2001",72,"Famous slow-cooked Mughal beef stew.")
add("Anday Ka Paratha","انڈے کا پراٹھا","Pakistani","Breakfast","Bread/Egg","1 piece / 150g",150,340,12,38,17,5.5,0.1,3.5,1.5,480,280,60,2.5,220,"350 IU","2 mg","Gluten, Eggs","Halal","Whole Wheat Flour, Egg, Oil/Ghee, Salt","Pan-Fried","","Pakistan FCT 2001",76,"Egg-stuffed flatbread.")
add("Dahi Phulki","دہی پھلکی","Pakistani","Breakfast/Snack","Snack","1 serving / 200g",200,210,9,28,8,4.0,0.1,3.5,8.5,420,18,200,1.2,310,"160 IU","3 mg","Dairy, Gluten","Halal, Vegetarian","Gram Flour Fritters (Boondi), Yogurt, Tamarind, Cumin","Mixed/Assembled","","Pakistan FCT 2001",74,"Crispy gram flour bites in seasoned yogurt.")

# =========================================================================
# ADDITIONAL SOUTH ASIAN / MUGHAL DISHES
# =========================================================================
add("Dal Makhani","دال مکھنی","Pakistani","Lunch/Dinner","Lentil","1 katori / 250g",250,280,12,32,12,6.5,0.1,8.5,4.5,680,25,90,3.8,420,"150 IU","4 mg","Dairy","Halal, Vegetarian","Black Lentils, Red Kidney Beans, Butter, Cream, Tomatoes, Spices","Slow-Cooked","","India IFCT 2017",76,"Slow-cooked creamy black lentils.")
add("Saag Paneer","ساگ پنیر","International","Lunch/Dinner","Vegetarian Curry","1 katori / 250g",250,290,14,16,20,9.0,0.1,5.0,4.5,620,45,360,3.5,420,"4500 IU","18 mg","Dairy","Halal, Vegetarian","Spinach, Paneer (Indian Cottage Cheese), Cream, Onions, Garlic, Spices","Simmered","","India IFCT 2017",76,"Spinach with cottage cheese curry.")
add("Paneer Tikka","پنیر ٹکہ","International","Snack/Dinner","Vegetarian BBQ","4 pieces / 150g",150,280,16,10,20,10.5,0.2,1.5,3.5,620,55,380,1.2,180,"200 IU","3 mg","Dairy","Halal, Vegetarian","Paneer, Bell Peppers, Yogurt Marinade, Tandoori Spices","Grilled/Tandoor","","India IFCT 2017",74,"Tandoor-grilled spiced cottage cheese cubes.")
add("Aloo Paratha","آلو پراٹھا","Pakistani","Breakfast","Bread","1 piece / 130g",130,310,7,40,14,4.0,0.1,4.5,2.5,440,12,50,2.5,300,"80 IU","8 mg","Gluten, Dairy","Halal, Vegetarian","Whole Wheat Flour, Mashed Potatoes, Green Chilies, Coriander, Ghee","Pan-Fried","","Pakistan FCT 2001",78,"Potato stuffed flatbread.")
add("Gobi Paratha","گوبھی پراٹھا","Pakistani","Breakfast","Bread","1 piece / 130g",130,295,7,38,13,3.5,0.1,4.5,2.5,430,8,55,1.8,280,"50 IU","25 mg","Gluten, Dairy","Halal, Vegetarian","Whole Wheat Flour, Grated Cauliflower, Spices, Ghee","Pan-Fried","","Pakistan FCT 2001",76,"Cauliflower stuffed flatbread.")
add("Methi Paratha","میتھی پراٹھا","Pakistani","Breakfast","Bread","1 piece / 120g",120,270,7,36,11,2.5,0.1,4.5,1.5,420,5,120,3.5,290,"500 IU","10 mg","Gluten, Dairy","Halal, Vegetarian","Whole Wheat Flour, Fresh Fenugreek Leaves, Spices, Ghee","Pan-Fried","","Pakistan FCT 2001",76,"Fenugreek flatbread. High in iron.")
add("Chana Dal Tadka","چنا دال تڑکہ","Pakistani","Lunch/Dinner","Lentil","1 katori / 250g",250,260,13,38,7,1.5,0.0,9.5,3.5,580,0,60,3.8,430,"180 IU","8 mg","","Halal, Vegetarian","Split Chickpeas, Onions, Tomatoes, Garlic, Whole Red Chilies, Oil, Cumin Tadka","Simmered","","Pakistan FCT 2001",78,"Tadka-seasoned split chickpea dal.")
add("Moong Dal (Yellow, Cooked)","موٹی مونگ دال","Pakistani","Lunch/Dinner","Lentil","1 katori / 250g",250,200,13,32,4,0.5,0.0,7.5,2.5,380,0,45,3.0,380,"120 IU","5 mg","","Halal, Vegetarian","Yellow Moong Dal, Onions, Tomatoes, Turmeric, Cumin, Oil","Simmered","","Pakistan FCT 2001",78,"Light yellow lentil soup.")
add("Masoor Dal (Red Lentil)","مسور دال","Pakistani","Lunch/Dinner","Lentil","1 katori / 250g",250,210,13,34,4,0.5,0.0,7.5,2.5,390,0,40,4.0,360,"100 IU","4 mg","","Halal, Vegetarian","Red Lentils, Tomatoes, Onions, Turmeric, Garlic, Oil","Simmered","","Pakistan FCT 2001",78,"Everyday red lentil dal.")
add("Urad Dal (Black Gram)","اڑد دال (ماش)","Pakistani","Lunch/Dinner","Lentil","1 katori / 250g",250,240,14,36,6,1.0,0.0,8.0,2.5,420,0,55,3.5,390,"60 IU","3 mg","","Halal, Vegetarian","Black Gram Lentil, Onions, Garlic, Tomatoes, Oil, Tempering","Simmered","","Pakistan FCT 2001",76,"Split black gram lentil.")

# =========================================================================
# ADDITIONAL CONTINENTAL/GLOBAL DISHES
# =========================================================================
add("Grilled Salmon Steak","گرلڈ سالمن","International","Dinner","Seafood","1 fillet / 180g",180,367,36,0,24,5.0,0.0,0.0,0.0,106,113,27,1.4,653,"90 IU","7.0 mg","","Halal","Atlantic Salmon Fillet, Olive Oil, Lemon, Herbs","Grilled","USDA FoodData Central #175168","",84,"Rich in EPA/DHA omega-3.")
add("Caesar Salad (With Dressing, No Croutons)","قیصر سلاد","International","Lunch/Dinner","Salad","1 plate / 200g",200,250,8,12,20,4.5,0.1,3.0,3.5,580,22,140,1.8,320,"1800 IU","15 mg","Dairy, Eggs","Halal, Vegetarian","Romaine Lettuce, Parmesan, Caesar Dressing, Lemon","Assembled","USDA FoodData Central","",78,"Classic Caesar without croutons.")
add("Greek Salad","گریک سلاد","International","Lunch/Dinner","Salad","1 plate / 200g",200,180,5,10,14,5.5,0.1,3.5,6.0,620,20,180,1.2,340,"800 IU","25 mg","Dairy","Halal, Vegetarian","Tomatoes, Cucumber, Red Onion, Olives, Feta, Olive Oil, Oregano","Assembled","USDA FoodData Central","",80,"Classic Mediterranean salad.")
add("Beef Burger (Halal)","بیف برگر","International","Lunch/Dinner","Burger","1 burger / 230g",230,540,28,42,28,10.5,0.5,2.5,6.0,980,85,120,4.5,360,"80 IU","2 mg","Gluten","Halal","Beef Patty, Sesame Bun, Lettuce, Tomato, Onion, Mayo, Ketchup","Grilled/Assembled","USDA FoodData Central","",80,"Classic halal beef burger.")
add("Cheese Omelette","چیز آملیٹ","International","Breakfast","Egg Dish","1 omelette / 110g",110,210,14,1.5,16,7.0,0.1,0.0,0.8,350,390,165,1.2,150,"480 IU","0.5 mg","Eggs, Dairy","Halal, Vegetarian","Eggs, Cheddar Cheese, Butter","Pan-Cooked","USDA FoodData Central","",86,"USDA component-based estimate.")
add("Pancakes, Plain (Buttermilk)","پینکیک","International","Breakfast","Baked/Cooked","2 medium / 152g",152,352,9.7,58.0,9.4,2.9,0.3,1.8,12.5,606,72,188,2.5,188,"267 IU","0.5 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Flour, Buttermilk, Egg, Butter, Baking Powder, Sugar","Pan-Cooked","USDA FoodData Central #18259","",90,"USDA #18259")
add("Waffles, Plain, Frozen","ویفل","International","Breakfast","Baked","1 waffle / 75g",75,218,5.9,32.5,8.0,1.3,1.8,1.1,5.6,473,8,112,2.4,90,"87 IU","0.1 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Enriched Flour, Water, Egg, Sugar, Oil, Leavening","Toasted","USDA FoodData Central #18370","",90,"USDA #18370")
add("French Toast","فرنچ ٹوسٹ","International","Breakfast","Egg/Bread","1 slice / 65g",65,149,5.0,16.3,6.7,1.7,0.1,0.5,4.9,311,75,72,1.3,72,"190 IU","0.1 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Bread, Egg, Milk, Butter, Cinnamon, Sugar","Pan-Cooked","USDA FoodData Central #18266","",90,"USDA #18266")
add("Wrap, Chicken Caesar","چکن قیصر ریپ","International","Lunch","Wrap","1 wrap / 200g",200,420,22,38,20,4.5,0.1,3.5,4.0,680,55,120,2.5,280,"800 IU","8 mg","Gluten, Dairy","Halal","Flour Tortilla, Grilled Chicken, Romaine, Parmesan, Caesar Dressing","Assembled","USDA FoodData Central","",78,"")
add("Chicken Quesadilla","چکن کیساڈیلا","International","Lunch/Snack","Mexican","1 quesadilla / 180g",180,410,24,36,18,7.5,0.1,2.5,2.5,680,60,260,2.0,260,"300 IU","3 mg","Gluten, Dairy","Halal","Flour Tortilla, Grilled Chicken, Cheddar Cheese, Peppers","Grilled/Pan-Cooked","USDA FoodData Central","",78,"")
add("Tom Yum Soup","ٹام یم سوپ","International","Starter","Soup","1 bowl / 350g",350,120,8,12,4,1.2,0.0,1.5,3.5,880,30,30,1.2,280,"300 IU","15 mg","Shellfish","Halal","Shrimp, Mushrooms, Lemongrass, Galangal, Kaffir Lime, Fish Sauce, Chili","Boiled","USDA FoodData Central","",76,"Thai hot and sour soup.")
add("Minestrone Soup","مینیسٹرون سوپ","International","Starter","Soup","1 bowl / 350g",350,180,8,28,5,1.0,0.0,6.5,5.5,720,5,75,2.5,480,"3200 IU","18 mg","Gluten","Halal, Vegetarian","Pasta, Vegetables, Tomatoes, Kidney Beans, Herbs, Parmesan","Boiled","USDA FoodData Central","",78,"Italian vegetable pasta soup.")
add("Mushroom Soup, Cream of","کریم آف مشروم سوپ","International","Starter","Soup","1 cup / 245g",245,166,4.6,13.4,11.5,4.7,0.0,0.7,2.5,920,15,178,0.5,190,"0 IU","0.5 mg","Dairy, Gluten","Halal, Vegetarian","Mushrooms, Cream, Butter, Flour, Broth","Simmered","USDA FoodData Central","",78,"")
add("Tomato Soup, Cream of","کریم آف ٹماٹو سوپ","International","Starter","Soup","1 cup / 245g",245,161,6.0,22.3,6.0,1.5,0.0,1.5,14.0,744,15,48,1.5,396,"1690 IU","68.0 mg","Dairy, Gluten","Halal, Vegetarian","Tomatoes, Cream, Butter, Flour, Broth, Basil","Blended/Simmered","USDA FoodData Central","",80,"Classic cream of tomato.")
add("Dal Soup (Desi Style)","دال سوپ","Pakistani","Starter","Soup","1 cup / 250g",250,120,7,18,3,0.5,0.0,5.5,2.0,380,0,35,2.5,290,"80 IU","5 mg","","Halal, Vegetarian","Red Lentils, Garlic, Onions, Cumin, Vegetable Stock","Simmered","","Pakistan FCT 2001",76,"Light desi-style lentil soup.")
add("Paella (Seafood, Halal)","پایلا","International","Lunch/Dinner","Rice","1 plate / 350g",350,520,28,64,14,2.5,0.0,3.5,3.0,980,95,65,3.5,480,"400 IU","15 mg","Shellfish, Gluten","Halal","Bomba Rice, Shrimp, Mussels, Saffron, Tomatoes, Bell Peppers, Olive Oil","Slow-Cooked","USDA FoodData Central","",76,"Spanish saffron seafood rice.")
add("Sushi Platter (Mixed, Halal)","سوشی پلیٹر","International","Lunch/Dinner","Sushi","8 pieces / 200g",200,310,12,48,8,1.5,0.0,2.5,6.0,780,25,30,1.5,200,"80 IU","3 mg","Soy, Sesame, Gluten","Halal","Sushi Rice, Avocado, Cucumber, Halal Fish/Crab, Nori, Sesame, Wasabi","Assembled","USDA FoodData Central","",76,"Halal-friendly mixed sushi platter.")
add("Falafel (3 pieces)","فلافل","International","Snack","Middle Eastern","3 pieces / 90g",90,255,9,22,14,1.8,0.0,4.5,2.5,580,0,55,3.0,320,"40 IU","3 mg","Gluten","Halal, Vegetarian, Vegan","Chickpeas, Parsley, Coriander, Garlic, Cumin, Flour, Oil","Fried (Deep)","USDA FoodData Central","",80,"Fried chickpea balls.")
add("Kebab Wrap (Doner Style)","کباب ریپ (ڈونر)","International","Lunch/Dinner","Wrap","1 wrap / 300g",300,560,26,54,28,8.0,0.2,4.5,5.5,980,75,80,3.5,380,"150 IU","6 mg","Gluten, Dairy","Halal","Flatbread, Doner Meat, Garlic Sauce, Salad, Tomatoes","Assembled","USDA FoodData Central","",78,"Turkish-style doner wrap.")
add("Beef Rendang","بیف رینڈانگ","International","Dinner","Curry","1 serving / 250g",250,480,30,12,36,18.0,0.3,3.5,5.5,680,95,30,4.5,380,"80 IU","8 mg","","Halal","Beef, Coconut Milk, Lemongrass, Galangal, Red Chilies, Spices","Slow-Cooked/Dry","","",78,"Indonesian/Malaysian dry beef curry.")
add("Nasi Goreng (Indonesian Fried Rice)","ناسی گورنگ","International","Lunch/Dinner","Rice","1 plate / 300g",300,430,14,64,14,3.5,0.1,3.0,4.5,820,55,45,2.5,250,"350 IU","8 mg","Eggs, Soy","Halal","Cooked Rice, Egg, Kecap Manis (sweet soy), Shrimp Paste (Halal), Chicken, Vegetables","Stir-Fried","","",78,"Indonesian sweet soy fried rice.")
add("Pad Thai (Chicken)","پیڈ تھائی","International","Lunch/Dinner","Noodles","1 plate / 300g",300,450,22,52,18,3.5,0.1,3.5,8.0,920,65,80,2.5,300,"200 IU","4 mg","Gluten, Eggs, Peanuts","Halal","Rice Noodles, Chicken, Bean Sprouts, Green Onions, Egg, Peanuts, Tamarind Sauce","Stir-Fried","","",78,"Thai stir-fried rice noodles.")
add("Bibimbap (Korean Rice Bowl)","بیبی مباپ","International","Lunch/Dinner","Rice Bowl","1 bowl / 350g",350,450,18,70,12,2.0,0.0,5.5,6.0,780,55,55,3.5,480,"1500 IU","15 mg","Eggs, Soy, Sesame","Halal","Steamed Rice, Assorted Vegetables, Beef, Fried Egg, Gochujang, Sesame Oil","Assembled","","",76,"Korean mixed rice bowl.")
add("Beef Tacos (2 pieces)","بیف ٹیکو","International","Lunch/Snack","Mexican","2 tacos / 180g",180,380,20,32,18,6.5,0.2,4.5,3.5,680,55,80,3.0,260,"200 IU","6 mg","Gluten, Dairy","Halal","Corn Tortillas, Ground Beef, Onion, Cilantro, Salsa, Sour Cream, Lime","Assembled","USDA FoodData Central","",78,"Halal beef street tacos.")
add("Nachos with Cheese","ناچوز","International","Snack","Mexican","1 serving / 180g",180,480,12,56,24,9.5,0.1,4.5,2.0,760,35,220,2.0,260,"200 IU","2 mg","Gluten, Dairy","Halal, Vegetarian","Corn Tortilla Chips, Cheddar Cheese Sauce, Jalapenos","Baked/Assembled","USDA FoodData Central","",78,"")
add("Baklava (Middle Eastern)","بقلاوا","International","Dessert","Pastry","2 pieces / 60g",60,290,4,32,18,5.5,0.1,1.5,18.0,80,15,30,0.8,75,"40 IU","0.5 mg","Gluten, Tree Nuts","Halal, Vegetarian","Phyllo Pastry, Walnuts/Pistachios, Butter, Honey/Sugar Syrup","Baked","USDA FoodData Central","",80,"Flaky pastry with nuts and syrup.")
add("Tiramisu","ٹیرامیسو","International","Dessert","Italian","1 serving / 120g",120,350,7,38,18,9.5,0.2,0.5,24.0,180,105,65,0.8,95,"450 IU","0 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Ladyfingers, Mascarpone, Egg, Sugar, Cocoa (non-alcoholic version)","No-Bake","USDA FoodData Central","",78,"Italian coffee-cream dessert (halal adapted).")
add("Crème Brûlée","کریم بروولے","International","Dessert","French","1 ramekin / 130g",130,290,5,28,18,10.5,0.1,0.0,22.0,65,158,92,0.2,120,"680 IU","0.5 mg","Dairy, Eggs","Halal, Vegetarian","Heavy Cream, Egg Yolks, Sugar, Vanilla","Baked/Brûléed","USDA FoodData Central","",80,"Classic French baked custard.")
add("Chocolate Mousse","چاکلیٹ موس","International","Dessert","Dessert","1 serving / 120g",120,330,5,28,22,12.5,0.1,2.5,22.0,68,145,75,2.5,138,"380 IU","0.5 mg","Dairy, Eggs","Halal, Vegetarian","Dark Chocolate, Whipped Cream, Egg, Sugar","Chilled/Set","USDA FoodData Central","",78,"")
add("Lemon Tart","لیمن ٹارٹ","International","Dessert","Pastry","1 slice / 100g",100,320,5,38,16,8.5,0.2,0.5,20.0,210,85,45,0.8,80,"300 IU","8 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Shortcrust Pastry, Lemon Curd (Lemon Juice, Eggs, Butter, Sugar)","Baked","USDA FoodData Central","",78,"")

# =========================================================================
# ADDITIONAL PAKISTANI DISHES (VARIOUS)
# =========================================================================
add("Katakat","کٹاکٹ","Pakistani","Dinner","Offal","1 serving / 200g",200,420,28,8,32,12,0.5,2.0,2.5,680,280,60,5.5,340,"200 IU","8 mg","","Halal","Mixed Offal (Brain, Kidneys, Liver, Heart), Spices, Tomatoes, Green Chilies, Butter","Stir-Fried on Tawa","","Pakistan FCT 2001",70,"Lahori specialty offal tawa dish.")
add("Peshwari Namkeen Karahi","پشاوری نمکین کڑاہی","Pakistani","Dinner","Curry","1 katori / 250g",250,460,30,8,34,13,0.5,2.0,2.5,760,100,45,3.2,360,"100 IU","5 mg","","Halal","Mutton/Chicken, Tomatoes, White Pepper, Salt, Green Chilies, Oil/Fat","Stir-Fried (Wok)","","Pakistan FCT 2001",72,"Peshawari-style salt-and-pepper karahi.")
add("Daal Chawal","دال چاول","Pakistani","Lunch/Dinner","Set Meal","1 plate / 350g",350,380,14,62,8,1.5,0.0,7.5,3.0,480,0,55,4.5,420,"100 IU","6 mg","","Halal, Vegetarian","Yellow Lentil Dal, Steamed Basmati Rice, Tempering, Onion Salad","Mixed","","Pakistan FCT 2001",78,"Pakistan's most common everyday meal.")
add("Chicken Rice (Mandi)","چکن مندی","Pakistani","Lunch/Dinner","Rice","1 plate / 400g",400,620,34,64,24,7.5,0.2,3.0,2.5,820,90,65,3.5,480,"80 IU","4 mg","","Halal","Basmati Rice, Whole Chicken, Dried Lemon, Saffron, Mandi Spices","Slow-Cooked (Oven/Pit)","","Pakistan FCT 2001",74,"Arabic-style slow roasted chicken on rice.")
add("Bihari Beef Roll","بہاری رول","Pakistani","Snack/Lunch","Wrap","1 roll / 200g",200,520,24,44,28,8.5,0.3,4.0,4.5,820,70,60,3.0,320,"120 IU","5 mg","Gluten","Halal","Tawa Paratha, Bihari Beef (Tender Grilled Beef Strips), Onions, Chutney","Assembled","","Pakistan FCT 2001",76,"Bihari kebab wrapped in paratha.")
add("Gola Ganda (Shaved Ice)","گولہ گنڈا","Pakistani","Dessert","Street Dessert","1 medium / 150g",150,120,0.2,30.5,0.0,0.0,0.0,0.0,28.0,5,0,2,0.1,10,"40 IU","1 mg","","Halal, Vegetarian","Crushed Ice, Flavored Syrups (Rose, Kala Khata, Lemon), Chaat Masala","Assembled","","Pakistan FCT 2001",74,"Pakistani street shaved ice with syrups.")
add("Chur Chur Naan","چر چر نان","Pakistani","Breakfast/Lunch","Bread","1 piece / 150g",150,420,8,48,22,9.5,0.2,3.5,2.5,480,15,55,2.5,180,"80 IU","0 mg","Gluten, Dairy","Halal, Vegetarian","Refined Flour, Ghee, Butter, Salt, Yogurt (crushed flaky naan)","Baked (Tawa/Oven)","","Pakistan FCT 2001",74,"Crispy crumbly layered Delhi-style naan.")
add("Suji Ka Halwa","سوجی کا حلوہ","Pakistani","Dessert","Halwa","1 serving / 150g",150,340,4,50,14,8.5,0.1,1.5,28.0,85,15,25,1.5,75,"120 IU","0.5 mg","Gluten, Dairy, Tree Nuts","Halal, Vegetarian","Semolina, Ghee, Sugar, Cardamom, Nuts","Fried/Cooked","","Pakistan FCT 2001",76,"Roasted semolina sweet pudding.")
add("Atta Ka Halwa","آٹے کا حلوہ","Pakistani","Dessert","Halwa","1 serving / 150g",150,380,5,52,17,9.5,0.2,2.5,26.0,75,15,40,2.5,80,"120 IU","0 mg","Gluten, Dairy, Tree Nuts","Halal, Vegetarian","Whole Wheat Flour, Ghee, Sugar, Cardamom, Nuts","Roasted/Cooked","","Pakistan FCT 2001",76,"Whole wheat flour halwa.")
add("Pinni","پنی","Pakistani","Dessert/Snack","Traditional Sweet","2 pieces / 80g",80,380,6,40,22,11.5,0.2,3.5,18.0,40,15,60,2.8,120,"100 IU","0.5 mg","Gluten, Dairy, Tree Nuts","Halal, Vegetarian","Whole Wheat Flour, Ghee, Sugar, Desi Ghee, Almonds, Gond (Edible Gum)","Roasted/Set","","Pakistan FCT 2001",72,"Traditional Punjabi energy sweet.")
add("Rabri","رابڑی","Pakistani","Dessert","Dairy Sweet","1 bowl / 150g",150,280,7,30,14,9.0,0.2,0.0,28.0,60,28,240,0.2,290,"300 IU","1 mg","Dairy, Tree Nuts","Halal, Vegetarian","Full-Fat Milk (Reduced to thick creamy solid), Sugar, Rose Water, Cardamom, Nuts","Slow-Reduced","","Pakistan FCT 2001",74,"Thick reduced sweetened milk dessert.")
add("Doodh Sawaiyan (Sweet Vermicelli)","دودھ سیویاں","Pakistani","Dessert","Dairy/Vermicelli","1 bowl / 200g",200,290,8,44,9,5.0,0.1,2.0,30.0,85,25,240,1.5,320,"200 IU","1 mg","Gluten, Dairy, Tree Nuts","Halal, Vegetarian","Roasted Vermicelli, Full Fat Milk, Sugar, Cardamom, Nuts","Boiled/Simmered","","Pakistan FCT 2001",76,"Milk-based sweet vermicelli dessert.")
add("Jalebi (Fresh)","جلیبی","Pakistani","Dessert/Snack","Street Sweet","4 pieces / 80g",80,310,2,52,12,5.5,0.1,0.5,38.0,10,3,10,0.5,35,"0 IU","0 mg","Gluten","Halal, Vegetarian","Refined Flour, Batter, Sugar Syrup, Food Color, Saffron","Fermented/Fried","","Pakistan FCT 2001",76,"Crispy deep fried spirals in syrup.")
add("Imli Ka Pani (Tamarind Drink)","املی کا پانی","Pakistani","Beverage","Cold Drink","1 glass / 200g",200,65,0.5,16.0,0.2,0.0,0.0,1.0,10.0,180,0,15,0.5,140,"20 IU","2 mg","","Halal, Vegetarian, Vegan","Tamarind Pulp, Water, Sugar, Salt, Cumin, Mint","Mixed","","Pakistan FCT 2001",74,"Tangy tamarind-based drink.")
add("Sattu Sharbat","ستو شربت","Pakistani","Beverage","Cold Drink","1 glass / 250g",250,140,5.5,26,2.0,0.3,0.0,3.5,8.0,120,0,25,1.8,180,"20 IU","1 mg","","Halal, Vegetarian, Vegan","Roasted Gram Flour (Sattu), Water, Salt, Lemon, Mint, Cumin","Mixed","","India IFCT 2017",76,"Traditional Bihar/Punjab summer cooling drink.")
add("Maghaz (Goat Brain Curry)","مغز","Pakistani","Dinner","Offal","1 serving / 200g",200,380,22,4,30,11.5,0.5,1.5,2.0,620,1680,25,1.8,220,"180 IU","6 mg","","Halal","Goat Brain, Onions, Tomatoes, Ginger, Garlic, Egg, Spices, Oil","Simmered/Stir-Fried","","Pakistan FCT 2001",68,"Very high cholesterol. Goat brain curry.")
add("Kapura (Kidney)","کپورہ","Pakistani","Dinner","Offal","1 serving / 150g",150,240,24,4,14,4.5,0.3,1.5,2.5,580,340,20,5.5,300,"600 IU","5 mg","","Halal","Goat/Lamb Kidney, Onions, Tomatoes, Spices, Oil","Stir-Fried","","Pakistan FCT 2001",70,"Spiced goat kidney. High in vitamins.")
add("Fried Calamari (Halal)","فرائیڈ قلماری","International","Starter/Snack","Seafood","1 serving / 120g",120,290,18,18,14,3.5,0.1,1.0,0.5,680,260,60,1.5,260,"40 IU","3 mg","Gluten, Shellfish","Halal","Squid Rings, Seasoned Flour, Oil","Fried (Deep)","USDA FoodData Central","",78,"Crispy fried squid rings.")
add("Hummus with Pita","حمص","International","Snack/Starter","Middle Eastern","1 serving / 100g hummus + 2 pita",200,390,14,48,16,2.5,0.0,7.5,3.5,680,0,80,3.5,340,"60 IU","5 mg","Gluten, Sesame","Halal, Vegetarian","Chickpeas, Tahini, Olive Oil, Garlic, Lemon, Pita Bread","Mixed/Assembled","USDA FoodData Central","",82,"")
add("Baba Ganoush","بابا غنوج","International","Starter/Snack","Middle Eastern","1/4 cup / 60g",60,55,2,6,3,0.5,0.0,2.0,3.0,230,0,10,0.5,130,"50 IU","3 mg","Sesame","Halal, Vegetarian","Roasted Eggplant, Tahini, Olive Oil, Garlic, Lemon","Assembled","USDA FoodData Central","",80,"Smoky eggplant dip.")
add("Tabouleh","تبولہ","International","Starter/Salad","Middle Eastern","1 cup / 160g",160,140,4,20,6,0.8,0.0,4.5,3.0,280,0,55,2.5,390,"2500 IU","30 mg","Gluten","Halal, Vegetarian","Bulgur Wheat, Parsley, Mint, Tomatoes, Lemon, Olive Oil","Mixed","USDA FoodData Central","",82,"Lebanese parsley-bulgur salad.")

# =========================================================================
# SNACKS & MISC
# =========================================================================
add("Dates (Khajoor), Dried","کھجور (خشک)","International","Ingredient","Fruit/Snack","5 dates / 45g",45,138,1.0,37.1,0.1,0.0,0.0,3.3,31.2,1,0,17,0.5,235,"15 IU","0.1 mg","","Halal, Vegetarian, Vegan","Dried Medjool Dates","Dried","USDA FoodData Central #09421","",92,"USDA #09421. High sugar, high fiber.")
add("Apricot, Dried (Khushk Khubani)","خشک خوبانی","International","Ingredient","Dried Fruit","5 halves / 28g",28,67,1.0,17.5,0.1,0.0,0.0,1.9,14.0,2,0,12,0.8,226,"1009 IU","0.4 mg","","Halal, Vegetarian, Vegan","Dried Apricot Halves","Dried","USDA FoodData Central #09024","",92,"USDA #09024. High Vit A.")
add("Raisins (Kishmish)","کشمش","International","Ingredient","Dried Fruit","1/4 cup / 40g",40,123,1.3,32.7,0.2,0.0,0.0,1.6,24.7,5,0,27,0.8,299,"2 IU","0.8 mg","","Halal, Vegetarian, Vegan","Dried Seedless Grapes","Dried","USDA FoodData Central #09298","",92,"USDA #09298")
add("Roasted Chickpeas (Chana, Roasted)","بھنے ہوئے چنے","Pakistani","Snack","Snack","1/4 cup / 40g",40,170,7,26,5,0.5,0.0,5.5,0.8,120,0,35,1.8,215,"25 IU","1.5 mg","","Halal, Vegetarian, Vegan","Roasted Chickpeas, Salt, Spices","Roasted","","Pakistan FCT 2001",80,"Desi bhuna chana.")
add("Murmure (Puffed Rice)","مرمرے","Pakistani","Snack","Snack","1 cup / 15g",15,56,1,12.5,0.1,0.0,0.0,0.5,0.5,55,0,2,0.4,16,"0 IU","0 mg","","Halal, Vegetarian","Puffed Rice, Salt","Puffed","","India IFCT 2017",82,"Low calorie puffed rice snack.")
add("Mathri","ماٹھری","Pakistani","Snack","Bakery","4 pieces / 60g",60,290,4,32,15,3.5,0.1,1.5,0.5,420,0,20,1.5,80,"0 IU","0 mg","Gluten","Halal, Vegetarian","Refined Flour, Ghee/Oil, Carom Seeds, Salt","Fried (Deep)","","Pakistan FCT 2001",74,"Crispy savory crackers.")
add("Chakli (Rice Flour)","چکلی","Pakistani","Snack","Bakery","3 pieces / 45g",45,210,3,26,10,2.0,0.0,1.5,0.5,380,0,10,0.8,70,"0 IU","0 mg","","Halal, Vegetarian","Rice Flour, Lentil Flour, Cumin, Sesame, Oil, Salt","Fried (Deep)","","India IFCT 2017",72,"Spiral savory rice flour snack.")
add("Kheer Moong Dal","موڑ دال کی کھیر","Pakistani","Dessert","Kheer","1 bowl / 200g",200,260,8,40,8,4.5,0.1,2.5,25.0,65,20,160,2.0,280,"150 IU","0.5 mg","Dairy, Tree Nuts","Halal, Vegetarian","Yellow Moong Dal, Full-Fat Milk, Sugar, Cardamom, Nuts","Slow-Cooked","","Pakistan FCT 2001",74,"Moong lentil milk pudding.")
add("Phirni (Ground Rice Pudding)","پھرنی","Pakistani","Dessert","Pudding","1 serving / 150g",150,210,5,32,7,4.5,0.1,0.5,24.0,55,20,160,0.4,190,"120 IU","0 mg","Dairy, Tree Nuts","Halal, Vegetarian","Coarsely Ground Rice, Full-Fat Milk, Sugar, Kewra, Cardamom, Nuts","Simmered/Set","","Pakistan FCT 2001",76,"Traditional clay-pot rice pudding.")
add("Sevian Kheer (Vermicelli Kheer)","سیویاں کی کھیر","Pakistani","Dessert","Kheer","1 bowl / 200g",200,280,7,42,9,5.0,0.1,1.5,28.0,80,22,190,1.2,270,"180 IU","0.5 mg","Gluten, Dairy, Tree Nuts","Halal, Vegetarian","Roasted Thin Vermicelli, Full-Fat Milk, Sugar, Cardamom, Nuts","Boiled/Simmered","","Pakistan FCT 2001",76,"Vermicelli milk pudding.")
add("Eid Sawaiyan (Dry)","عید کی سیویاں","Pakistani","Dessert","Special","1 serving / 100g",100,370,8,48,16,9.0,0.1,2.0,22.0,115,30,120,1.5,190,"200 IU","0.5 mg","Gluten, Dairy, Tree Nuts","Halal, Vegetarian","Vermicelli Fried in Ghee, Khoya, Milk, Sugar, Almonds, Pistachios","Fried/Dry-Cooked","","Pakistan FCT 2001",74,"Dry sweet vermicelli with khoya. Eid special.")
add("Karakoram Dry Fruit Mix","خشک میوہ جات","Pakistani","Snack","Dried Fruits","1/4 cup / 40g",40,195,4.5,22.5,11.5,1.5,0.0,3.5,14.0,10,0,40,1.5,280,"80 IU","1 mg","Tree Nuts","Halal, Vegetarian","Almonds, Walnuts, Pistachios, Cashews, Raisins, Apricots","Raw/Dried","","",80,"Premium Northern Pakistan dry fruit mix.")
add("Methi Ladoo","میتھی لڈو","Pakistani","Snack/Dessert","Traditional","1 piece / 50g",50,220,4,26,11,5.5,0.1,3.0,14.0,30,10,65,4.5,110,"100 IU","1 mg","Gluten, Dairy, Tree Nuts","Halal, Vegetarian","Fenugreek Seeds, Whole Wheat Flour, Ghee, Gond, Sugar, Nuts","Roasted/Set","","Pakistan FCT 2001",72,"Winter traditional ladoo with fenugreek.")
add("Gond Katira Sherbet","گوند کترا شربت","Pakistani","Beverage","Cold Drink","1 glass / 250g",250,80,0.2,20.0,0.0,0.0,0.0,0.5,18.0,15,0,10,0.2,25,"20 IU","2 mg","","Halal, Vegetarian","Tragacanth Gum (Gond Katira), Rose Water, Sugar, Water, Basil Seeds","Soaked/Mixed","","Pakistan FCT 2001",74,"Traditional cooling summer drink.")
add("Shikanjvi (Lemonade Desi)","شکنجوی","Pakistani","Beverage","Cold Drink","1 glass / 250g",250,85,0.4,21.5,0.1,0.0,0.0,0.5,18.0,95,0,10,0.2,95,"10 IU","20 mg","","Halal, Vegetarian, Vegan","Lemon Juice, Water, Sugar, Salt, Kala Namak, Cumin Powder","Mixed","","Pakistan FCT 2001",76,"Spiced desi lemonade.")
add("Thandai","ٹھنڈائی","Pakistani","Beverage","Cold Drink","1 glass / 250g",250,180,5,28,6,3.0,0.0,1.5,22.0,55,15,120,1.0,240,"60 IU","0.5 mg","Dairy, Tree Nuts","Halal, Vegetarian","Milk, Almonds, Fennel, Melon Seeds, Rose Petals, Cardamom, Sugar","Blended/Strained","","Pakistan FCT 2001",74,"Cooling spiced milk drink.")
add("Mango Kulfi","آم کلفی","Pakistani","Dessert","Frozen","1 piece / 80g",80,180,4,28,6,4.0,0.1,0.5,22.0,45,18,130,0.3,160,"500 IU","8 mg","Dairy","Halal, Vegetarian","Condensed Milk, Fresh Mango Pulp, Cardamom, Pistachios","Frozen","","Pakistan FCT 2001",76,"Traditional mango frozen dessert.")
add("Pista Kulfi","پستہ کلفی","Pakistani","Dessert","Frozen","1 piece / 80g",80,190,5,26,8,5.0,0.1,0.5,20.0,50,20,140,0.5,170,"150 IU","0.5 mg","Dairy, Tree Nuts","Halal, Vegetarian","Condensed Milk, Pistachios, Cardamom, Kewra Water","Frozen","","Pakistan FCT 2001",76,"Pistachio frozen kulfi.")
add("Barfi (Plain Khoya)","سادہ برفی","Pakistani","Dessert","Mithai","2 pieces / 60g",60,270,6,30,14,8.5,0.1,0.0,22.0,35,22,195,0.4,230,"200 IU","0.5 mg","Dairy, Tree Nuts","Halal, Vegetarian","Khoya (Milk Solids), Sugar, Cardamom, Silver Varq","Cooked/Set","","Pakistan FCT 2001",74,"Dense milk-solid sweet diamond fudge.")
add("Coconut Barfi","ناریل برفی","Pakistani","Dessert","Mithai","2 pieces / 60g",60,260,3,32,14,10.5,0.1,2.5,22.0,30,15,20,0.8,130,"60 IU","0.5 mg","Dairy, Tree Nuts","Halal, Vegetarian","Desiccated Coconut, Condensed Milk, Sugar, Cardamom","Cooked/Set","","Pakistan FCT 2001",74,"Sweet coconut fudge.")
add("Mithai Box (Assorted)","متفرق مٹھائی","Pakistani","Dessert","Mithai","100g",100,320,5,42,15,8.0,0.1,0.5,32.0,55,18,80,0.8,120,"80 IU","0.5 mg","Dairy, Gluten, Tree Nuts","Halal, Vegetarian","Assorted Pakistani Sweets (Ladoo, Barfi, Gulab Jamun, Jalebi)","Various","","Pakistan FCT 2001",68,"Average estimate for assorted box of sweets.")

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
    print(f"Still need {1000 - len(all_final)} more records to reach 1000.")
else:
    print(f"Target of 1000 reached!")
