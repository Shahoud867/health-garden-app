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
print(f"Current count: {len(existing_records)}")

new_items = []

def add(name, urdu, local, cuisine, cat, subcat, region, desc, unit, g, kcal, p, c, f,
        sat=0.0, trans=0.0, fib=0.0, sug=0.0, sod=0.0, chol=0.0, cal=0.0, fe=0.0, k=0.0,
        vit_a="0 IU", vit_c="0 mg", alg="", diet="Halal", ing="", prep="",
        s1="USDA FoodData Central", s2="Pakistan FCT 2001", s3="", conf=80, ver="Y", notes=""):
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
# BATCH 2A: MORE PAKISTANI CURRIES & MAIN DISHES
# =========================================================================
add("Chicken Keema Matar","چکن قیمہ مٹر","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",200,320,24,18,17,5.0,0.1,4.5,4.0,650,70,40,2.5,360,"200 IU","15 mg","","Halal","Chicken Mince, Green Peas, Onions, Tomatoes, Spices, Oil","Sautéed","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Minced chicken with green peas.")
add("Chicken Karahi (Dhaba Style)","چکن کڑاہی (ڈھابہ)","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,360,30,8,23,8.0,0.2,1.5,4.0,760,90,30,2.2,330,"100 IU","8 mg","","Halal","Chicken, Tomatoes, Ginger, Garlic, Green Chilies, Oil, Coal Smoke","Sautéed","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Roadside dhaba-style smoky karahi.")
add("Mutton Keema","مٹن قیمہ","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",200,350,24,8,25,10.0,0.3,1.5,3.5,680,80,25,3.0,280,"50 IU","4 mg","","Halal","Mutton Mince, Onions, Tomatoes, Ginger, Garlic, Spices, Oil","Sautéed","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Spiced ground mutton.")
add("Beef Paya","بیف پایہ","","Pakistani","Breakfast/Dinner","Stew","","1 bowl","1 Bowl",300,380,28,18,22,8.0,0.3,1.0,1.0,950,120,120,3.5,380,"30 IU","2 mg","Gluten","Halal","Beef Trotters, Onions, Ginger, Garlic, Whole Spices, Wheat","Slow-Cooked","USDA FoodData Central","Pakistan FCT 2001","",68,"N","Beef trotter stew. High collagen and sodium.")
add("Goat Paya","بکرا پایہ","","Pakistani","Breakfast/Dinner","Stew","","1 bowl","1 Bowl",250,340,26,16,20,7.5,0.3,1.0,1.0,880,110,110,3.2,350,"30 IU","2 mg","Gluten","Halal","Goat Trotters, Onions, Ginger, Garlic, Spices, Wheat","Slow-Cooked","USDA FoodData Central","Pakistan FCT 2001","",68,"N","Goat trotter stew.")
add("Chicken Siri Paya","چکن سری پایہ","","Pakistani","Breakfast","Stew","","1 bowl","1 Bowl",250,360,28,14,22,7.5,0.3,1.0,1.0,920,150,120,3.5,320,"20 IU","1 mg","Gluten","Halal","Chicken Head and Feet, Onions, Ginger, Garlic, Spices","Slow-Cooked","USDA FoodData Central","Pakistan FCT 2001","",65,"N","Chicken head and trotter stew. Traditional breakfast.")
add("Gosht Ka Korma","گوشت کا قورمہ","","Pakistani","Dinner","Curry","Punjab","1 katori","1 Katori",250,450,27,14,32,13.0,0.4,1.5,4.5,720,105,55,3.0,330,"100 IU","3 mg","Dairy, Tree Nuts","Halal","Mutton/Beef, Fried Onions, Yogurt, Nuts Paste, Whole Spices, Ghee","Slow-Cooked","USDA FoodData Central","Pakistan FCT 2001","",70,"Y","Classic meat korma. Wedding dish.")
add("Chicken Qorma (Punjabi)","چکن قورمہ (پنجابی)","","Pakistani","Lunch/Dinner","Curry","Punjab","1 katori","1 Katori",250,400,28,14,26,9.5,0.3,1.5,5.0,700,95,65,2.0,320,"120 IU","3 mg","Dairy, Tree Nuts","Halal","Chicken, Fried Onions, Yogurt, Cashew Paste, Whole Spices, Ghee","Slow-Cooked","USDA FoodData Central","Pakistan FCT 2001","",70,"Y","Rich Punjabi chicken korma.")
add("Desi Mutton Raan","دیسی مٹن ران","","Pakistani","Dinner","BBQ","","1 serving","1 Serving",300,520,40,6,38,15.0,0.5,0.5,1.5,780,130,35,4.0,490,"50 IU","2 mg","Dairy","Halal","Whole Lamb Leg, Papaya, Yogurt, Ginger, Garlic, Spices, Ghee","Slow-Roasted","USDA FoodData Central","Pakistan FCT 2001","",70,"Y","Slow-roasted whole lamb leg.")
add("Chicken Changezi","چکن چنگیزی","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,420,30,10,30,11.0,0.3,1.5,5.0,750,100,65,2.0,320,"200 IU","4 mg","Dairy","Halal","Chicken, Cream, Tomatoes, Spices, Whole Wheat Tandoori Dough on Rim","Simmered","USDA FoodData Central","Pakistan FCT 2001","",68,"N","Mughal-style cream chicken. Named after Genghis Khan.")

# =========================================================================
# BATCH 2B: MORE RICE AND BIRYANI
# =========================================================================
add("Hyderabadi Biryani","حیدرآبادی بریانی","","Pakistani","Lunch/Dinner","Rice","","1 plate","1 Plate",350,540,28,56,21,8.0,0.2,2.2,4.5,880,88,48,3.0,360,"150 IU","3 mg","Gluten, Dairy","Halal","Basmati Rice, Mutton, Fried Onions, Fried Potatoes, Saffron, Yogurt, Biryani Spices","Slow-Cooked (Dum)","USDA FoodData Central","India IFCT 2017","",72,"Y","Traditional Hyderabadi biryani with potato.")
add("Kolachi Biryani","کولاچی بریانی","","Pakistani","Lunch/Dinner","Rice","Karachi","1 plate","1 Plate",350,500,27,54,20,7.0,0.2,2.0,4.0,820,82,44,2.8,340,"130 IU","3 mg","Gluten, Dairy","Halal","Basmati Rice, Chicken, Potatoes, Tomatoes, Fried Onions, Spices, Oil","Slow-Cooked (Dum)","USDA FoodData Central","Pakistan FCT 2001","",70,"Y","Karachi's famous spicy biryani.")
add("Aloo Gosht Biryani","آلو گوشت بریانی","","Pakistani","Lunch/Dinner","Rice","","1 plate","1 Plate",350,555,28,54,22,8.5,0.3,2.2,4.0,850,88,45,3.0,360,"100 IU","3 mg","Gluten, Dairy","Halal","Basmati Rice, Mutton, Potatoes, Onions, Tomatoes, Yogurt, Spices, Ghee","Slow-Cooked (Dum)","USDA FoodData Central","Pakistan FCT 2001","",70,"Y","Biryani with potato and meat.")
add("Makhni Biryani","مکھنی بریانی","","Pakistani","Lunch/Dinner","Rice","","1 plate","1 Plate",350,580,30,56,25,10.0,0.3,2.0,5.0,800,92,60,2.8,350,"250 IU","4 mg","Dairy","Halal","Basmati Rice, Chicken, Butter Masala Sauce, Cream, Spices, Ghee","Slow-Cooked","USDA FoodData Central","Pakistan FCT 2001","",70,"Y","Butter masala biryani.")
add("Ghee Rice (Makhni Chawal)","گھی چاول","","Pakistani","Lunch/Dinner","Rice","","1 plate","1 Plate",250,380,6,56,14,7.5,0.2,1.5,1.0,20,10,18,1.0,120,"60 IU","0 mg","Dairy","Halal, Vegetarian","Basmati Rice, Ghee, Fried Onions, Whole Spices, Salt","Steamed","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Plain ghee-flavored white rice.")
add("Peas Pulao (Matar Pulao)","مٹر پلاؤ","","Pakistani","Lunch/Dinner","Rice","","1 plate","1 Plate",250,360,8,58,10,3.5,0.1,4.5,2.0,480,0,25,2.0,220,"150 IU","6 mg","Dairy","Halal, Vegetarian","Basmati Rice, Green Peas, Whole Spices, Ghee, Fried Onions","Steamed","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Green peas rice pilaf.")
add("Chicken Biryani (Brown Rice)","چکن بریانی (براؤن رائس)","","Pakistani","Lunch/Dinner","Rice","","1 plate","1 Plate",350,480,28,54,17,5.5,0.1,4.5,3.5,800,85,52,3.5,350,"120 IU","3 mg","Dairy","Halal","Brown Basmati Rice, Chicken, Yogurt, Onions, Tomatoes, Spices, Ghee","Slow-Cooked (Dum)","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Healthier brown rice version of biryani.")
add("Sindhi Biryani (Mutton)","سندھی بریانی (مٹن)","","Pakistani","Lunch/Dinner","Rice","Sindh","1 plate","1 Plate",350,560,28,54,22,8.5,0.3,2.5,5.0,920,92,50,3.2,360,"180 IU","5 mg","Gluten, Dairy","Halal","Basmati Rice, Mutton, Potatoes, Dried Plums, Yogurt, Onions, Spices, Whole Chilies","Slow-Cooked (Dum)","USDA FoodData Central","Pakistan FCT 2001","",70,"Y","Authentic Sindhi mutton biryani.")
add("Shadi Wali Biryani","شادی والی بریانی","","Pakistani","Lunch/Dinner","Rice","","1 plate","1 Plate",400,610,34,58,26,9.5,0.3,2.2,5.0,900,100,52,3.5,390,"140 IU","3 mg","Dairy","Halal","Basmati Rice, Mutton, Fried Onions, Saffron, Kewra Water, Yogurt, Ghee, Spices","Slow-Cooked (Dum)","USDA FoodData Central","Pakistan FCT 2001","",70,"Y","Large-portion festive wedding biryani.")
add("Kofta Pulao","کوفتہ پلاؤ","","Pakistani","Lunch/Dinner","Rice","","1 plate","1 Plate",300,450,22,52,16,5.5,0.1,2.0,2.5,680,65,35,2.5,290,"60 IU","2 mg","Dairy","Halal","Basmati Rice, Minced Meat Balls (Kofta), Whole Spices, Ghee","Steamed","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Rice with spiced meatballs.")

# =========================================================================
# BATCH 2C: SEAFOOD DISHES
# =========================================================================
add("Grilled Pomfret","گرلڈ پمفریٹ","","Pakistani","Lunch/Dinner","Seafood","Karachi","1 medium fish","1 Fish",250,300,38,2,16,4.5,0.1,0.0,0.5,580,120,60,1.8,520,"50 IU","4 mg","","Halal","Silver Pomfret, Lemon, Garlic, Green Chili, Spices, Oil","Grilled","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Whole grilled silver pomfret.")
add("Masala Rohu Fish","مصالحہ روہو مچھلی","","Pakistani","Lunch/Dinner","Seafood","","1 serving","1 Katori",200,260,24,10,14,3.5,0.1,1.5,3.0,620,55,30,1.5,360,"40 IU","4 mg","","Halal","Rohu Fish, Tomatoes, Onions, Spices, Lemon, Oil","Sautéed","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Spiced Rohu fish curry.")
add("Tawa Machli","توا مچھلی","","Pakistani","Lunch/Dinner","Seafood","Punjab/Lahore","2 pieces","2 Pieces",200,340,28,14,20,5.0,0.1,1.0,2.0,580,60,30,1.8,350,"30 IU","4 mg","Gluten","Halal","Fish Pieces, Chickpea Flour Coating, Spices, Tawa Cooked","Pan-Fried","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Griddle-fried fish. Lahori style.")
add("Karachi Prawn Curry","کراچی پراون کری","","Pakistani","Lunch/Dinner","Seafood","Karachi","1 katori","1 Katori",200,240,22,9,13,3.0,0.1,1.5,3.5,620,180,80,1.8,290,"80 IU","4 mg","Shellfish","Halal","Prawns, Tomatoes, Onions, Coconut Milk, Spices, Oil","Sautéed","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Coastal Pakistani prawn curry.")
add("Prawn Tikka","پراون ٹکہ","","Pakistani","Lunch/Dinner","Seafood","","6 pieces","6 Pieces",150,190,22,4,9,2.5,0.1,0.5,1.5,490,175,80,1.5,250,"80 IU","3 mg","Dairy, Shellfish","Halal","Prawns, Yogurt Marinade, Spices, Lemon, Oil","Grilled","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Grilled marinated prawns.")
add("Butter Garlic Prawns","بٹر گارلک پراونز","","Continental","Lunch/Dinner","Seafood","","1 serving","1 Serving",150,240,20,4,16,8.0,0.1,0.5,1.0,480,200,70,1.2,220,"100 IU","2 mg","Dairy, Shellfish","Halal","Large Prawns, Butter, Garlic, Lemon, Herbs","Pan-Fried","USDA FoodData Central","","",78,"Y","Restaurant-style butter garlic prawns.")
add("Fish and Chips","فش اینڈ چپس","","Continental","Lunch/Dinner","Fried","","1 plate","1 Plate",350,680,28,62,35,8.0,0.5,5.0,2.5,880,80,80,2.5,620,"30 IU","10 mg","Gluten, Eggs","Halal","Beer-Battered Fish, Deep Fried Potato Chips, Tartar Sauce, Lemon","Fried (Deep)","USDA FoodData Central","","",80,"Y","Classic British fish and chips.")
add("Calamari Rings","کالامری رنگز","","Continental","Starter","Fried","","1 plate","1 Plate",150,290,16,22,15,3.5,0.2,1.5,1.0,680,245,60,1.8,320,"60 IU","4 mg","Gluten, Shellfish","Halal","Squid Rings, Breadcrumb Coating, Lemon, Tartar Sauce","Fried (Deep)","USDA FoodData Central","","",78,"Y","Crispy battered squid rings.")
add("Grilled Sea Bass","گرلڈ سی باس","","Continental","Lunch/Dinner","Seafood","","1 fillet","1 Fillet",200,260,34,0,13,3.5,0.1,0.0,0.0,260,90,18,0.6,480,"80 IU","0 mg","","Halal","Sea Bass Fillet, Olive Oil, Garlic, Herbs, Lemon","Grilled","USDA FoodData Central","","",88,"Y","Clean grilled white fish fillet.")
add("Shrimp Scampi","شریمپ اسکامپی","","Italian","Lunch/Dinner","Seafood","","1 plate","1 Plate",250,520,26,44,24,8.0,0.1,3.0,3.0,780,215,80,2.0,380,"200 IU","4 mg","Gluten, Dairy, Shellfish","Halal","Shrimp, Linguine, White Wine Substitute, Garlic, Butter, Lemon, Parsley","Sautéed/Boiled","USDA FoodData Central","","",78,"Y","Italian pasta with garlic butter shrimp.")

# =========================================================================
# BATCH 2D: SALADS, WRAPS & SANDWICHES
# =========================================================================
add("Chicken Tikka Sandwich","چکن ٹکہ سینڈوچ","","Pakistani","Lunch","Sandwich","","1 sandwich","1 Sandwich",200,380,22,34,16,5.0,0.1,3.5,4.5,680,60,55,2.5,290,"100 IU","6 mg","Gluten, Dairy, Eggs","Halal","Bread, Chicken Tikka Slices, Chutney, Lettuce, Tomato, Mayo","Assembled","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Chicken tikka bread sandwich.")
add("Beef Shawarma Sub","بیف شاورما سب","","Middle Eastern","Lunch","Sandwich","","1 sandwich","1 Sandwich",250,540,28,46,26,8.0,0.2,3.0,5.0,920,75,80,3.0,360,"120 IU","5 mg","Gluten, Dairy","Halal","Sub Roll, Beef Shawarma, Garlic Sauce, Pickles, Salad","Assembled","USDA FoodData Central","","",78,"Y","Beef shawarma in long bread roll.")
add("Tuna Wrap","ٹونا ریپ","","Continental","Lunch","Wrap","","1 wrap","1 Wrap",200,350,24,34,15,3.0,0.1,4.0,4.5,720,45,80,2.5,380,"200 IU","8 mg","Gluten, Eggs","Halal","Tortilla, Canned Tuna, Mayo, Cucumber, Tomato, Lettuce","Assembled","USDA FoodData Central","","",80,"Y","Tuna mayo wrap sandwich.")
add("Egg Salad Sandwich","انڈہ سلاد سینڈوچ","","Continental","Lunch","Sandwich","","1 sandwich","1 Sandwich",180,340,14,28,18,4.0,0.1,3.0,5.0,580,270,70,2.0,200,"200 IU","2 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","White Bread, Hard-Boiled Eggs, Mayo, Mustard, Celery","Assembled","USDA FoodData Central","","",80,"Y","Classic egg salad sandwich.")
add("Chicken Pesto Wrap","چکن پیسٹو ریپ","","Italian","Lunch","Wrap","","1 wrap","1 Wrap",220,440,26,38,20,5.0,0.1,3.5,4.0,680,55,120,2.5,360,"250 IU","8 mg","Gluten, Dairy, Tree Nuts","Halal","Flour Tortilla, Grilled Chicken, Basil Pesto, Mozzarella, Tomato","Assembled","USDA FoodData Central","","",78,"Y","Italian pesto grilled chicken wrap.")
add("Waldorf Salad","والڈورف سلاد","","Continental","Starter","Salad","","1 bowl","1 Bowl",200,220,4,24,14,2.5,0.0,3.5,18.0,280,8,40,0.8,280,"100 IU","10 mg","Tree Nuts, Eggs","Halal, Vegetarian","Apples, Walnuts, Celery, Grapes, Mayonnaise, Lemon","Mixed","USDA FoodData Central","","",80,"Y","Classic American apple walnut salad.")
add("Chicken Nicoise Salad","چکن نیکواز سلاد","","Continental","Lunch","Salad","","1 bowl","1 Bowl",300,380,28,24,20,4.0,0.1,6.0,6.0,580,120,80,3.5,520,"800 IU","25 mg","Eggs","Halal","Chicken, Eggs, Green Beans, Tomatoes, Olives, Potatoes, Vinaigrette","Assembled","USDA FoodData Central","","",80,"Y","French-style composed salad.")
add("Pasta Salad","پاستا سلاد","","Continental","Lunch","Salad","","1 bowl","1 Bowl",250,380,10,44,18,4.0,0.0,4.0,6.0,480,8,60,2.5,320,"300 IU","12 mg","Gluten, Eggs","Halal, Vegetarian","Penne, Cherry Tomatoes, Olives, Feta, Basil Pesto, Olive Oil","Mixed","USDA FoodData Central","","",78,"Y","Cold Mediterranean pasta salad.")
add("Mango Salad (Thai)","تھائی آم سلاد","","Thai","Starter","Salad","","1 bowl","1 Bowl",200,140,3,28,4,0.8,0.0,3.0,22.0,380,0,25,0.8,280,"1200 IU","30 mg","Peanuts","Halal, Vegetarian","Julienned Green Mango, Peanuts, Chili, Lime Juice, Fish Sauce, Mint","Raw/Mixed","USDA FoodData Central","","",78,"Y","Tangy Thai shredded mango salad.")
add("Tabouleh","تبولہ","","Middle Eastern","Starter","Salad","","1 bowl","1 Bowl",200,150,4,22,6,1.0,0.0,5.0,3.5,350,0,55,3.5,380,"1000 IU","25 mg","Gluten","Halal, Vegetarian","Bulgur Wheat, Parsley, Tomatoes, Mint, Lemon Juice, Olive Oil","Mixed","USDA FoodData Central","","",82,"Y","Lebanese parsley and bulgur salad.")

# =========================================================================
# BATCH 2E: DESSERTS & BAKED GOODS
# =========================================================================
add("Kunafa","کنافہ","","Middle Eastern","Dessert","Sweet","","1 slice","1 Slice",120,380,8,48,18,9.0,0.2,1.5,28.0,180,30,120,1.0,90,"120 IU","0 mg","Gluten, Dairy, Tree Nuts","Halal, Vegetarian","Shredded Pastry (Kataifi), Akkawi Cheese, Sugar Syrup, Rose Water, Pistachios","Baked","USDA FoodData Central","","",76,"Y","Middle Eastern shredded pastry cheese dessert.")
add("Baklava","بقلاوہ","","Middle Eastern","Dessert","Sweet","","3 pieces","3 Pieces",80,300,4,34,18,5.0,0.1,1.5,22.0,100,0,20,1.2,80,"20 IU","0 mg","Gluten, Tree Nuts","Halal, Vegetarian","Phyllo Pastry, Pistachios/Walnuts, Honey Syrup, Butter","Baked","USDA FoodData Central","","",80,"Y","Flaky layered pastry with nuts and honey.")
add("Chocolate Mousse","چاکلیٹ موس","","Continental","Dessert","Sweet","","1 cup","1 Cup",120,310,5,24,22,12.5,0.2,1.5,20.0,60,95,45,2.5,180,"150 IU","0 mg","Dairy, Eggs","Halal, Vegetarian","Dark Chocolate, Whipped Cream, Eggs, Sugar, Vanilla","Whipped/Chilled","USDA FoodData Central","","",80,"Y","Airy chocolate mousse dessert.")
add("Creme Brulee","کریم بریلی","","Continental","Dessert","Sweet","","1 ramekin","1 Piece",120,290,5,22,20,11.5,0.2,0.0,18.0,55,165,85,0.2,130,"250 IU","0 mg","Dairy, Eggs","Halal, Vegetarian","Heavy Cream, Egg Yolks, Sugar, Vanilla, Caramelized Sugar Crust","Baked/Torched","USDA FoodData Central","","",80,"Y","Classic French caramelized custard.")
add("Tiramisu","تیرامیسو","","Italian","Dessert","Sweet","","1 slice","1 Slice",120,380,6,36,24,12.0,0.2,0.5,24.0,80,100,80,1.2,110,"200 IU","0 mg","Dairy, Gluten, Eggs","Halal, Vegetarian","Ladyfinger Cookies, Mascarpone Cheese, Coffee, Cocoa, Cream, Sugar","Assembled/Chilled","USDA FoodData Central","","",78,"Y","Italian coffee-flavored layered dessert.")
add("New York Cheesecake","نیویارک چیز کیک","","Continental","Dessert","Sweet","","1 slice","1 Slice",130,440,8,38,28,15.0,0.5,0.5,26.0,380,115,90,0.8,110,"250 IU","0 mg","Dairy, Gluten, Eggs","Halal, Vegetarian","Cream Cheese, Graham Crust, Eggs, Sugar, Sour Cream, Vanilla","Baked","USDA FoodData Central","","",82,"Y","Dense New York style cheesecake.")
add("Apple Pie","ایپل پائی","","Continental","Dessert","Sweet","","1 slice","1 Slice",125,320,3,46,14,5.0,0.2,2.5,22.0,290,10,15,1.0,110,"40 IU","4 mg","Gluten, Dairy","Halal, Vegetarian","Pie Crust, Cinnamon Apples, Sugar, Butter","Baked","USDA FoodData Central","","",82,"Y","Classic American cinnamon apple pie.")
add("Tres Leches Cake","تریس لیچیس کیک","","Continental","Dessert","Sweet","","1 slice","1 Slice",130,380,8,48,18,10.0,0.2,0.5,34.0,180,55,150,0.8,180,"250 IU","0 mg","Dairy, Gluten, Eggs","Halal, Vegetarian","Sponge Cake, Evaporated Milk, Condensed Milk, Whole Milk, Whipped Cream","Baked/Soaked","USDA FoodData Central","","",80,"Y","Three-milk soaked sponge cake.")
add("Lemon Tart","لیمن ٹارٹ","","Continental","Dessert","Sweet","","1 slice","1 Slice",100,340,5,40,18,9.0,0.2,1.0,22.0,180,120,25,0.8,70,"160 IU","15 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Pastry Shell, Lemon Curd (Lemon Juice, Eggs, Butter, Sugar), Whipped Cream","Baked","USDA FoodData Central","","",80,"Y","Tangy lemon curd in buttery tart shell.")
add("Red Velvet Cake","ریڈ ویلویٹ کیک","","Continental","Dessert","Sweet","","1 slice","1 Slice",110,380,5,48,20,9.0,0.2,1.5,34.0,380,55,55,2.5,130,"80 IU","0 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Red Food Color Sponge, Cream Cheese Frosting, Cocoa, Vanilla","Baked","USDA FoodData Central","","",80,"Y","Classic red velvet with cream cheese frosting.")

# =========================================================================
# BATCH 2F: COLD BEVERAGES, JUICES & SMOOTHIES
# =========================================================================
add("Mango Smoothie","آم اسموتھی","","Pakistani","Beverage","Cold Beverage","","1 glass","1 Glass",300,220,5,48,3,1.5,0.0,2.5,42.0,80,8,120,0.8,480,"1800 IU","40 mg","Dairy","Halal, Vegetarian","Fresh Mango, Yogurt/Milk, Honey, Ice","Blended","USDA FoodData Central","Pakistan FCT 2001","",80,"Y","Fresh mango yogurt smoothie.")
add("Strawberry Banana Smoothie","اسٹرابیری بنانا اسموتھی","","Continental","Beverage","Cold Beverage","","1 glass","1 Glass",300,230,6,48,3,1.5,0.0,4.0,36.0,75,8,150,1.0,560,"120 IU","55 mg","Dairy","Halal, Vegetarian","Strawberries, Banana, Milk, Honey, Ice","Blended","USDA FoodData Central","","",82,"Y","Classic fruit smoothie.")
add("Green Detox Smoothie","گرین ڈیٹاکس اسموتھی","","Continental","Beverage","Cold Beverage","","1 glass","1 Glass",300,150,5,32,2,0.5,0.0,4.5,20.0,90,0,80,2.5,600,"3000 IU","60 mg","","Halal, Vegetarian, Vegan","Spinach, Cucumber, Apple, Lemon, Ginger, Water","Blended","USDA FoodData Central","","",82,"Y","Detox green vegetable smoothie.")
add("Protein Shake (Whey Vanilla)","پروٹین شیک","","Continental","Beverage","Cold Beverage","","1 shake","1 Shake",350,280,30,28,5,1.5,0.0,2.5,8.0,180,35,220,2.5,450,"80 IU","0 mg","Dairy","Halal","Whey Protein, Milk, Banana, Almond Butter, Vanilla","Blended","USDA FoodData Central","","",82,"Y","Post-workout whey protein shake.")
add("Matcha Latte","ماچا لٹے","","Japanese","Beverage","Hot Beverage","","1 cup","1 Cup",240,150,6,18,5,2.5,0.0,1.0,12.0,80,12,180,0.8,250,"40 IU","0 mg","Dairy","Halal, Vegetarian","Matcha Green Tea Powder, Steamed Milk, Honey","Steamed/Mixed","USDA FoodData Central","","",80,"Y","Creamy Japanese green tea latte.")
add("Cold Brew Coffee","کولڈ بریو کافی","","Continental","Beverage","Cold Beverage","","1 glass","1 Glass",300,15,0.3,3,0.0,0.0,0.0,0.0,0.0,10,0,12,0.2,160,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Cold Brewed Coffee, Water, Ice","Cold Brewed","USDA FoodData Central","","",90,"Y","Pure cold brew coffee. No calories without milk.")
add("Lychee Juice","لیچی جوس","","Pakistani","Beverage","Cold Beverage","","1 glass","1 Glass",250,110,0.5,28,0.2,0.0,0.0,0.5,26.0,8,0,8,0.2,168,"0 IU","55 mg","","Halal, Vegetarian","Lychee Fruit, Water, Sugar","Blended/Strained","USDA FoodData Central","Pakistan FCT 2001","",78,"Y","Fresh lychee juice. High vitamin C.")
add("Guava Juice","امرود کا رس","","Pakistani","Beverage","Cold Beverage","","1 glass","1 Glass",250,120,1.5,28,0.6,0.2,0.0,3.5,22.0,10,0,25,0.5,350,"400 IU","170 mg","","Halal, Vegetarian","Fresh Guava, Water, Sugar","Blended/Strained","USDA FoodData Central","Pakistan FCT 2001","",80,"Y","Fresh guava juice. Very high vitamin C.")
add("Orange Juice (Fresh)","تازہ نارنجی کا رس","","Pakistani","Beverage","Cold Beverage","","1 glass","1 Glass",250,110,1.5,26,0.3,0.0,0.0,0.5,21.0,2,0,22,0.4,490,"247 IU","124 mg","","Halal, Vegetarian, Vegan","Fresh Oranges","Pressed","USDA FoodData Central #169098","","",92,"Y","Freshly squeezed orange juice. USDA lab data.")
add("Apple Juice (Fresh)","تازہ سیب کا رس","","Pakistani","Beverage","Cold Beverage","","1 glass","1 Glass",250,115,0.2,28,0.2,0.0,0.0,0.2,24.0,5,0,10,0.2,250,"0 IU","2 mg","","Halal, Vegetarian, Vegan","Fresh Apples","Pressed","USDA FoodData Central #168869","","",90,"Y","Freshly pressed apple juice.")

# =========================================================================
# BATCH 2G: ADDITIONAL BREAKFAST & HEALTHY ITEMS
# =========================================================================
add("Avocado Toast","ایوکاڈو ٹوسٹ","","Continental","Breakfast","Bread","","1 slice","1 Slice",120,220,6,20,14,2.5,0.0,5.5,1.5,320,0,20,2.0,380,"60 IU","8 mg","Gluten","Halal, Vegetarian","Sourdough Toast, Mashed Avocado, Lemon, Salt, Chili Flakes, Sesame Seeds","Assembled","USDA FoodData Central","","",84,"Y","Trendy healthy avocado toast.")
add("Overnight Oats","اوورنایٹ اوٹس","","Continental","Breakfast","Cereal","","1 jar","1 Jar",300,380,12,58,10,2.5,0.0,7.5,18.0,120,8,220,4.0,460,"200 IU","4 mg","Gluten, Dairy","Halal, Vegetarian","Rolled Oats, Milk, Chia Seeds, Honey, Berries, Banana","Mixed/Chilled","USDA FoodData Central","","",82,"Y","Make-ahead healthy breakfast oats.")
add("Chia Pudding","چیا پڈنگ","","Continental","Breakfast","Cereal","","1 cup","1 Cup",250,280,8,32,14,3.0,0.0,12.0,14.0,80,12,350,3.5,320,"100 IU","2 mg","Dairy","Halal, Vegetarian","Chia Seeds, Almond Milk, Honey, Vanilla, Berries","Mixed/Chilled","USDA FoodData Central","","",84,"Y","Healthy chia seed pudding. High in omega-3.")
add("Granola with Yogurt","گرانولا یوگرٹ","","Continental","Breakfast","Cereal","","1 bowl","1 Bowl",250,360,12,52,12,2.5,0.0,5.0,22.0,120,8,160,2.5,340,"80 IU","2 mg","Gluten, Dairy, Tree Nuts","Halal, Vegetarian","Granola, Whole Milk Yogurt, Honey, Fresh Berries","Mixed","USDA FoodData Central","","",82,"Y","Crunchy granola with creamy yogurt.")
add("Egg White Omelette","انڈے کی سفیدی آملیٹ","","Continental","Breakfast","Egg Dish","","1 omelette","1 Omelette",120,120,18,2,4,1.0,0.0,0.5,1.5,320,0,15,0.2,200,"0 IU","0 mg","Eggs","Halal, Vegetarian","Egg Whites, Spinach, Mushrooms, Salt, Pepper, Olive Oil","Pan-Fried","USDA FoodData Central","","",84,"Y","Low-calorie high-protein egg white omelette.")
add("Greek Yogurt Bowl","گریک یوگرٹ باؤل","","Continental","Breakfast","Dairy","","1 cup","1 Cup",200,180,15,18,4,2.5,0.0,0.5,16.0,65,8,180,0.5,280,"40 IU","4 mg","Dairy","Halal, Vegetarian","Greek Yogurt, Honey, Mixed Berries, Granola, Almonds","Mixed","USDA FoodData Central","","",84,"Y","Protein-rich Greek yogurt parfait.")
add("Smoothie Bowl (Acai)","اکائی اسموتھی باؤل","","Continental","Breakfast","Cereal","","1 bowl","1 Bowl",300,320,8,58,8,2.0,0.0,8.0,38.0,80,0,80,2.5,560,"200 IU","20 mg","Tree Nuts","Halal, Vegetarian","Acai Puree, Banana, Berries, Granola, Coconut Flakes, Honey","Blended/Assembled","USDA FoodData Central","","",80,"Y","Thick blended acai smoothie bowl with toppings.")
add("Shakshuka","شکشوکہ","","Middle Eastern","Breakfast","Egg Dish","","1 serving","1 Serving",250,240,14,18,14,3.5,0.0,4.5,8.0,680,370,60,3.5,620,"2000 IU","40 mg","Eggs","Halal, Vegetarian","Eggs Poached in Tomato Sauce, Onions, Capsicum, Spices","Simmered","USDA FoodData Central","","",82,"Y","Middle Eastern eggs in spicy tomato sauce.")
add("French Crepes","فرنچ کریپس","","Continental","Breakfast","Savory Pancake","","2 crepes","2 Pieces",100,180,6,22,8,4.0,0.1,1.0,6.0,160,80,60,1.2,100,"180 IU","0 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Flour, Eggs, Milk, Butter, Vanilla (thin pancakes)","Pan-Fried","USDA FoodData Central","","",82,"Y","Thin French pancakes.")
add("Belgian Waffles with Berries","بیلجیئن وافلز","","Continental","Breakfast","Sweet","","1 waffle","1 Waffle",120,340,7,48,14,6.0,0.2,2.5,14.0,420,65,90,2.5,190,"80 IU","10 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Waffle Batter, Whipped Cream, Fresh Berries, Maple Syrup","Baked (Waffle Iron)","USDA FoodData Central","","",80,"Y","Fluffy Belgian waffle with cream and berries.")

# =========================================================================
# BATCH 2H: MORE SNACKS, STREET FOOD, CONDIMENTS
# =========================================================================
add("Chicken Hot Wings","چکن ہاٹ ونگز","","Continental","Snack","Fried","","6 pieces","6 Pieces",150,380,24,10,28,8.0,0.3,0.5,2.0,820,90,20,1.5,260,"200 IU","2 mg","Gluten, Dairy","Halal","Chicken Wings, Hot Sauce, Butter, Garlic","Fried (Deep)/Tossed","USDA FoodData Central","","",80,"Y","Spicy deep fried chicken wings.")
add("Onion Rings","انیون رنگز","","Continental","Snack","Fried","","8 rings","8 Pieces",90,260,4,32,13,3.0,0.1,2.0,4.0,480,0,30,1.2,130,"0 IU","3 mg","Gluten, Dairy","Halal, Vegetarian","Onion Rings, Beer Batter, Breadcrumbs, Oil","Fried (Deep)","USDA FoodData Central","","",78,"Y","Crispy battered onion rings.")
add("Loaded Nachos","لوڈڈ ناچوز","","Continental","Snack","Shared","","1 plate","1 Plate",200,540,18,50,30,12.0,0.3,5.0,6.0,980,45,280,3.0,380,"400 IU","8 mg","Gluten, Dairy","Halal, Vegetarian","Tortilla Chips, Cheddar Cheese, Salsa, Sour Cream, Guacamole, Jalapenos","Baked","USDA FoodData Central","","",78,"Y","Fully loaded cheese nachos.")
add("Corn Dog","کارن ڈاگ","","Continental","Snack","Fried","","1 piece","1 Piece",90,240,8,24,12,3.5,0.2,1.5,4.0,640,30,40,1.8,120,"20 IU","0 mg","Gluten, Dairy","Halal","Halal Beef Frank, Cornmeal Batter","Fried (Deep)","USDA FoodData Central","","",78,"Y","Halal beef sausage in cornmeal batter.")
add("Fish Taco","فش ٹیکو","","Mexican","Snack/Lunch","Wrap","","2 tacos","2 Tacos",200,380,18,38,18,4.0,0.1,4.5,5.0,620,45,80,2.5,320,"200 IU","10 mg","Gluten, Dairy","Halal","Corn Tortilla, Grilled Fish, Cabbage Slaw, Lime Crema, Salsa","Assembled","USDA FoodData Central","","",78,"Y","Mexican-style fish tacos.")
add("Bean Burrito","بین بریٹو","","Mexican","Lunch","Wrap","","1 burrito","1 Burrito",250,480,18,66,16,6.0,0.1,10.0,4.0,880,20,200,4.5,560,"300 IU","8 mg","Gluten, Dairy","Halal, Vegetarian","Flour Tortilla, Refried Beans, Rice, Cheese, Salsa, Sour Cream","Assembled","USDA FoodData Central","","",78,"Y","Classic Mexican bean and cheese burrito.")
add("Chicken Tacos","چکن ٹیکو","","Mexican","Snack/Lunch","Wrap","","2 tacos","2 Tacos",180,360,20,38,15,4.5,0.1,4.5,4.0,680,55,80,2.5,350,"200 IU","8 mg","Gluten, Dairy","Halal","Corn Tortillas, Grilled Chicken, Onion, Cilantro, Salsa, Lime","Assembled","USDA FoodData Central","","",78,"Y","Street-style chicken tacos.")
add("Churros","چرو","","Mexican","Snack/Dessert","Fried","","3 pieces","3 Pieces",90,290,4,40,14,3.0,0.1,1.5,14.0,220,10,25,1.5,75,"20 IU","0 mg","Gluten, Dairy","Halal, Vegetarian","Choux Dough, Sugar, Cinnamon, Oil, Chocolate Dipping Sauce","Fried (Deep)","USDA FoodData Central","","",78,"Y","Crispy cinnamon sugar fried dough. Served with chocolate.")
add("Sushi Roll (California)","سوشی رول","","Japanese","Snack/Lunch","Sushi","","8 pieces","8 Pieces",200,320,10,44,12,2.5,0.0,2.5,4.0,780,25,40,1.5,180,"20 IU","2 mg","Soy, Shellfish, Sesame","Halal","Sushi Rice, Halal Crab Stick, Avocado, Cucumber, Nori, Sesame","Rolled","USDA FoodData Central","","",76,"Y","California roll sushi with avocado.")
add("Edamame","ادامامے","","Japanese","Snack","Legume","","1 cup","1 Cup",155,189,17,14,8,1.0,0.0,8.0,3.5,9,0,98,3.5,676,"14 IU","9 mg","Soy","Halal, Vegetarian, Vegan","Boiled Green Soybeans, Sea Salt","Boiled","USDA FoodData Central #168411","","",90,"Y","USDA lab data. Boiled soybeans in pod.")

# =========================================================================
# BATCH 2I: MORE INTERNATIONAL & CONTINENTAL MAINS
# =========================================================================
add("Chicken Shawarma (Platter)","شاورما پلیٹ","","Middle Eastern","Lunch/Dinner","Set Meal","","1 platter","1 Plate",400,620,34,52,28,7.5,0.2,4.0,5.0,920,80,90,3.2,420,"200 IU","8 mg","Gluten, Dairy, Sesame","Halal","Chicken Shawarma, Garlic Sauce, Pickles, Salad, Pita, Hummus","Assembled","USDA FoodData Central","","",78,"Y","Complete shawarma meal platter.")
add("Lamb Rack (Grilled)","گرلڈ لیمب ریک","","Continental","Dinner","Protein","","3 ribs","3 Ribs",210,480,32,0,38,16.0,0.5,0.0,0.0,380,115,25,3.0,480,"30 IU","0 mg","","Halal","Lamb Rib Rack, Rosemary, Garlic, Olive Oil, Dijon Mustard","Grilled","USDA FoodData Central","","",84,"Y","French-trimmed lamb rack roasted to perfection.")
add("Beef Tenderloin Steak","بیف ٹینڈرلوئن","","Continental","Dinner","Protein","","1 fillet 6oz","1 Fillet",170,340,34,0,22,8.0,0.6,0.0,0.0,260,100,25,2.8,460,"0 IU","0 mg","","Halal","Beef Tenderloin, Sea Salt, Black Pepper, Butter, Herbs","Pan-Fried/Oven","USDA FoodData Central","","",88,"Y","Most tender beef cut. Lean and rich.")
add("Pasta Primavera","پاستا پریماویرا","","Italian","Lunch/Dinner","Pasta","","1 plate","1 Plate",300,420,14,64,12,3.0,0.0,6.0,8.0,420,8,80,3.0,480,"1500 IU","45 mg","Gluten, Dairy","Halal, Vegetarian","Pasta, Mixed Spring Vegetables, Olive Oil, Garlic, Parmesan, Herbs","Boiled/Sautéed","USDA FoodData Central","","",80,"Y","Spring vegetable pasta toss.")
add("Vegetarian Lasagna","ویجیٹیرین لازانیا","","Italian","Lunch/Dinner","Pasta","","1 serving","1 Serving",280,380,18,44,15,7.5,0.1,5.5,8.0,680,30,280,3.0,480,"1200 IU","20 mg","Gluten, Dairy","Halal, Vegetarian","Lasagna Sheets, Ricotta, Spinach, Tomato Sauce, Mozzarella, Vegetables","Baked","USDA FoodData Central","","",80,"Y","Vegetable ricotta lasagna.")
add("Moussaka","موساکا","","Mediterranean","Dinner","Baked","","1 serving","1 Serving",280,420,20,28,26,10.0,0.2,4.0,8.0,680,65,80,2.5,520,"400 IU","8 mg","Dairy, Eggs","Halal","Eggplant, Ground Beef, Bechamel Sauce, Tomatoes, Cinnamon, Allspice","Baked","USDA FoodData Central","","",78,"Y","Greek baked eggplant and meat dish.")
add("Chicken Marsala","چکن مارسالا","","Italian","Dinner","Protein","","1 serving","1 Serving",200,360,30,14,20,8.0,0.1,1.5,4.0,580,90,30,2.0,480,"80 IU","2 mg","Dairy, Gluten","Halal","Chicken Breast, Marsala Wine Reduction (non-alcoholic), Mushrooms, Butter","Pan-Fried","USDA FoodData Central","","",78,"Y","Chicken in Marsala mushroom sauce.")
add("Beef Stroganoff","بیف اسٹروگانوف","","Russian","Dinner","Pasta","","1 plate","1 Plate",300,520,28,44,24,10.0,0.2,3.0,5.0,780,85,80,3.5,480,"200 IU","4 mg","Gluten, Dairy","Halal","Beef Strips, Sour Cream, Mushrooms, Onions, Egg Noodles, Mustard","Sautéed","USDA FoodData Central","","",78,"Y","Russian beef in creamy mushroom sauce.")
add("Chicken Pot Pie","چکن پاٹ پائی","","Continental","Dinner","Baked","","1 serving","1 Serving",280,480,22,44,24,9.0,0.2,3.5,6.0,780,55,80,2.5,380,"400 IU","6 mg","Gluten, Dairy","Halal","Chicken, Mixed Vegetables, Creamy Sauce, Flaky Pastry Crust","Baked","USDA FoodData Central","","",78,"Y","Savory pastry-topped chicken pot pie.")
add("Shepherd's Pie","شیفرڈ پائی","","Continental","Dinner","Baked","","1 serving","1 Serving",300,420,22,42,18,8.0,0.2,5.0,6.0,720,65,50,3.0,580,"400 IU","12 mg","Dairy","Halal","Ground Lamb, Mixed Vegetables, Mashed Potato Topping, Gravy","Baked","USDA FoodData Central","","",78,"Y","British minced lamb pie with mashed potato top.")

total = len(existing_records) + len(new_items)
print(f"New items in this batch: {len(new_items)}")
print(f"Total after this batch: {total}")

all_final = existing_records + new_items

with open(MASTER_FILE, mode='w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
    writer.writeheader()
    writer.writerows(all_final)

print(f"Saved {len(all_final)} total records.")
