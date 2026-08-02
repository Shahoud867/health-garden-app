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
# BATCH 3A: ADDITIONAL DESI CURRIES & MAINS
# =========================================================================
add("Pasanda","پسندہ","","Pakistani","Dinner","Curry","","1 katori","1 Katori",250,420,32,10,26,10.0,0.4,1.5,4.0,720,110,60,3.5,380,"120 IU","4 mg","Dairy","Halal","Beef Steaks, Yogurt, Raw Papaya, Fried Onions, Spices, Ghee","Slow-Cooked","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Mughlai beef steak curry.")
add("Kofta Curry (Meatball)","کوفتہ کری","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,380,26,14,24,9.0,0.3,2.5,4.0,680,85,60,3.2,350,"80 IU","6 mg","Dairy","Halal","Beef/Mutton Mince, Gram Flour, Yogurt, Onions, Spices, Oil","Simmered","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Spiced meatballs in yogurt-tomato gravy.")
add("Nargisi Kofta","نرگسی کوفتہ","","Pakistani","Dinner","Curry","","1 serving","1 Serving",300,450,30,16,28,10.5,0.3,2.5,5.0,750,280,80,4.0,390,"200 IU","6 mg","Dairy, Eggs","Halal","Boiled Eggs, Minced Meat Coating, Yogurt Gravy, Spices","Simmered","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Scotch egg style meatballs in gravy.")
add("Aloo Keema","آلو قیمہ","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,340,22,22,18,6.5,0.2,3.5,4.0,620,70,40,3.0,420,"250 IU","15 mg","","Halal","Mince Meat, Potatoes, Onions, Tomatoes, Spices, Oil","Sautéed","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Classic everyday potato and mince curry.")
add("Matar Keema","مٹر قیمہ","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,350,24,20,18,6.5,0.2,4.5,4.5,610,70,45,3.2,390,"350 IU","20 mg","","Halal","Mince Meat, Green Peas, Onions, Tomatoes, Spices, Oil","Sautéed","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Mince with green peas.")
add("Shimla Mirch Keema","شملہ مرچ قیمہ","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,330,22,18,18,6.5,0.2,3.5,5.0,590,70,35,3.0,380,"1200 IU","60 mg","","Halal","Mince Meat, Bell Peppers, Onions, Tomatoes, Spices, Oil","Sautéed","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Capsicum and mince meat.")
add("Bhindi Gosht","بھنڈی گوشت","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,360,24,14,24,8.5,0.3,4.5,4.0,650,80,75,3.5,410,"600 IU","15 mg","","Halal","Mutton/Beef, Okra, Onions, Tomatoes, Spices, Oil","Slow-Cooked/Sautéed","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Okra with meat.")
add("Karela Gosht","کریلا گوشت","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,340,24,12,22,8.0,0.3,3.5,4.0,640,80,55,3.2,420,"400 IU","40 mg","","Halal","Mutton, Bitter Gourd, Onions, Tomatoes, Spices, Oil","Sautéed","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Bitter gourd with meat.")
add("Gobi Gosht","گوبھی گوشت","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,350,24,16,22,8.0,0.3,4.5,4.5,660,80,65,3.2,430,"100 IU","35 mg","","Halal","Mutton, Cauliflower, Onions, Tomatoes, Ginger, Spices, Oil","Slow-Cooked","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Cauliflower with meat.")
add("Tinda Gosht","ٹنڈا گوشت","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,320,24,14,18,6.5,0.2,3.5,4.0,580,75,45,2.8,380,"150 IU","12 mg","","Halal","Mutton, Apple Gourd, Onions, Tomatoes, Spices, Oil","Simmered","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Apple gourd with meat.")
add("Arvi Gosht","اروی گوشت","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,380,24,24,20,7.5,0.2,4.0,3.5,620,80,50,3.0,460,"80 IU","8 mg","","Halal","Mutton, Taro Root, Onions, Tomatoes, Spices, Oil","Simmered","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Taro root and meat stew.")
add("Lauki Gosht","لوکی گوشت","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,310,24,12,18,6.5,0.2,3.0,4.0,590,75,45,2.5,390,"60 IU","10 mg","","Halal","Mutton, Bottle Gourd, Onions, Tomatoes, Spices, Oil","Simmered","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Bottle gourd with meat.")
add("Shalgam Gosht","شلجم گوشت","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,330,24,14,18,6.5,0.2,3.5,4.5,610,75,55,2.8,380,"80 IU","15 mg","","Halal","Mutton, Turnips, Onions, Tomatoes, Spices, Oil","Simmered","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Turnip with meat.")
add("Palak Gosht","پالک گوشت","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,360,26,12,24,8.5,0.3,4.5,3.0,680,85,120,4.5,480,"6000 IU","20 mg","Dairy","Halal","Mutton, Spinach, Onions, Tomatoes, Cream, Spices, Oil","Simmered","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Spinach and meat curry.")
add("Aloo Anday (Potato & Egg)","آلو انڈے","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,280,12,24,16,3.5,0.1,3.5,4.0,520,380,50,2.5,390,"450 IU","12 mg","Eggs","Halal, Vegetarian","Hard Boiled Eggs, Potatoes, Onions, Tomatoes, Spices, Oil","Simmered","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Egg and potato curry.")
add("Chicken Jalfrezi","چکن جل فریزی","","Pakistani","Lunch/Dinner","Curry","","1 katori","1 Katori",250,320,28,16,16,3.5,0.1,3.0,6.0,720,85,45,2.5,380,"600 IU","45 mg","Eggs","Halal","Chicken, Capsicum, Onions, Tomatoes, Eggs, Ketchup, Spices","Stir-Fried","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Stir-fried chicken with bell peppers and egg.")

# =========================================================================
# BATCH 3B: ADDITIONAL RICE DISHES
# =========================================================================
add("Mutanjan (Meat)","متنجن گوشت","","Pakistani","Lunch/Dinner","Rice","","1 plate","1 Plate",350,580,28,62,24,9.0,0.3,3.0,18.0,650,85,60,3.5,390,"120 IU","3 mg","Dairy, Tree Nuts","Halal","Rice, Mutton, Sugar, Saffron, Nuts, Whole Spices, Ghee","Slow-Cooked","USDA FoodData Central","Pakistan FCT 2001","",68,"N","Sweet and savory meat rice (old Mughal recipe).")
add("Prawn Biryani","پراون بریانی","","Pakistani","Lunch/Dinner","Rice","Karachi","1 plate","1 Plate",350,510,24,60,18,6.0,0.1,2.5,4.0,780,140,75,2.5,340,"100 IU","5 mg","Dairy, Shellfish","Halal","Basmati Rice, Prawns, Tomatoes, Onions, Yogurt, Biryani Spices","Slow-Cooked (Dum)","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Spicy prawn biryani.")
add("Fish Biryani","فش بریانی","","Pakistani","Lunch/Dinner","Rice","Karachi","1 plate","1 Plate",350,490,26,58,16,5.0,0.1,2.5,4.0,720,70,60,2.5,350,"80 IU","4 mg","Dairy","Halal","Basmati Rice, Fried Fish Pieces, Tomatoes, Yogurt, Biryani Spices","Slow-Cooked (Dum)","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Fish biryani, coastal style.")
add("Bannu Beef Pulao","بنوں بیف پلاؤ","","Pakistani","Lunch/Dinner","Rice","KPK","1 plate","1 Plate",400,680,32,64,32,12.0,0.5,3.0,2.0,850,110,50,4.0,420,"50 IU","2 mg","","Halal","Rice, Beef Shank, Beef Bone Marrow, Black Pepper, Whole Spices, Ghee","Slow-Cooked","USDA FoodData Central","Pakistan FCT 2001","",70,"Y","Famous Bannu fatty beef pulao.")
add("Meethe Chawal (Gur Wale)","گڑ والے چاول","","Pakistani","Dessert","Sweet Rice","Punjab","1 plate","1 Plate",250,380,5,72,8,4.5,0.1,1.5,35.0,30,15,40,2.5,180,"50 IU","0 mg","Dairy, Tree Nuts","Halal, Vegetarian","Basmati Rice, Jaggery (Gur), Ghee, Fennel, Nuts","Steamed","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Jaggery sweetened rice. Rustic Punjabi dessert.")
add("Khichdi (Moong Dal, Plain)","کھچڑی (سادہ)","","Pakistani","Lunch/Dinner","Rice","","1 plate","1 Plate",250,260,8,45,4,1.5,0.0,3.5,1.5,320,0,30,1.8,180,"20 IU","1 mg","","Halal, Vegetarian","Rice, Yellow Moong Dal, Salt, Turmeric, Mild Oil","Boiled","USDA FoodData Central","Pakistan FCT 2001","",78,"Y","Plain khichdi for invalid/sick diet.")

# =========================================================================
# BATCH 3C: BARBECUE & FAST FOOD
# =========================================================================
add("Afghani Boti","افغانی بوٹی","","Pakistani","Dinner","BBQ","","4 pieces","4 Pieces",150,280,26,2,18,7.0,0.2,0.5,0.5,450,85,30,1.8,260,"40 IU","1 mg","","Halal","Mutton/Beef, Black Pepper, Salt, Fat, Green Papaya","Grilled","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Mildly spiced fatty meat skewers.")
add("Chapli Kebab (Mutton)","چپلی کباب (مٹن)","","Pakistani","Lunch/Dinner","BBQ","KPK","1 large kebab","1 Kebab",180,480,28,12,35,14.0,0.5,2.5,3.0,780,105,45,3.5,420,"100 IU","8 mg","Gluten, Eggs","Halal","Mutton Mince, Tomatoes, Onions, Coriander Seeds, Corn Flour, Animal Fat","Pan-Fried (Shallow)","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Peshawari flat mutton kebab.")
add("Tikka Boti (Beef)","بیف ٹکہ بوٹی","","Pakistani","Dinner","BBQ","","4 pieces","4 Pieces",150,320,32,2,18,7.5,0.3,0.5,0.5,580,95,25,3.5,340,"30 IU","1 mg","","Halal","Beef Cubes, Raw Papaya, Tikka Spices, Oil/Fat","Grilled","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Spicy beef skewers.")
add("Seekh Kebab (Chicken)","چکن سیخ کباب","","Pakistani","Lunch/Dinner","BBQ","","2 skewers","2 Skewers",120,220,22,4,12,3.5,0.1,1.0,1.5,550,75,35,1.5,240,"120 IU","2 mg","","Halal","Chicken Mince, Onions, Green Chilies, Spices, Oil","Grilled","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Leaner chicken seekh kebabs.")
add("Zinger Burger","زنگر برگر","","Fast Food","Lunch/Dinner","Burger","","1 burger","1 Burger",250,560,26,52,28,6.0,0.2,2.5,6.0,980,65,110,2.5,290,"150 IU","2 mg","Gluten, Dairy, Eggs","Halal","Fried Chicken Breast, Bun, Mayo, Lettuce","Fried (Deep)/Assembled","USDA FoodData Central","","",78,"Y","Crispy fried chicken burger.")
add("Club Sandwich","کلب سینڈوچ","","Fast Food","Lunch","Sandwich","","1 sandwich","1 Sandwich",250,480,24,42,24,6.5,0.1,3.5,5.0,850,210,120,2.8,320,"300 IU","6 mg","Gluten, Dairy, Eggs","Halal","3 Bread Slices, Chicken, Egg, Cheese, Lettuce, Tomato, Mayo","Assembled","USDA FoodData Central","","",78,"Y","Classic triple-decker club sandwich.")
add("Broast Chicken (Quarter)","چکن بروسٹ","","Fast Food","Lunch/Dinner","Fried","Karachi","1 quarter","1 Piece",200,490,32,18,32,8.0,0.3,1.5,1.0,880,110,40,2.0,280,"80 IU","1 mg","Gluten","Halal","Skin-on Chicken, Flour Batter, Spices, Oil","Fried (Pressure)","USDA FoodData Central","","",76,"Y","Pressure-fried crispy chicken (Karachi style).")
add("Loaded Fries","لوڈڈ فرائز","","Fast Food","Snack","Potato","","1 plate","1 Plate",250,620,14,64,34,12.0,0.2,4.5,4.0,920,45,210,1.8,680,"250 IU","15 mg","Dairy","Halal, Vegetarian","French Fries, Cheddar Cheese Sauce, Jalapenos, Mayo/Garlic Sauce","Fried/Baked","USDA FoodData Central","","",76,"Y","French fries topped with cheese and sauces.")

# =========================================================================
# BATCH 3D: VEGETABLES & SIDES
# =========================================================================
add("Sarson Ka Saag (Cooked)","سرساں کا ساگ","","Pakistani","Lunch/Dinner","Vegetable","Punjab","1 katori","1 Katori",250,180,6,18,10,4.5,0.0,6.0,3.5,420,15,160,2.5,450,"6000 IU","45 mg","Dairy","Halal, Vegetarian","Mustard Greens, Spinach, Bathua, Maize Flour, Ghee, Garlic, Green Chilies","Simmered","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Rich Punjabi mustard greens cooked with ghee.")
add("Makki Ki Roti","مکئی کی روٹی","","Pakistani","Staple","Bread","Punjab","1 roti","1 Roti",100,220,5,44,3,0.5,0.0,4.5,1.0,20,0,15,1.2,120,"150 IU","0 mg","","Halal, Vegetarian","Maize Flour, Warm Water, Salt","Baked (Tawa)","USDA FoodData Central","Pakistan FCT 2001","",78,"Y","Cornmeal flatbread. Paired with Saag.")
add("Aloo Gajar Matar","آلو گاجر مٹر","","Pakistani","Lunch/Dinner","Vegetable","","1 katori","1 Katori",200,165,4,24,7,1.2,0.0,5.5,6.5,380,0,45,1.5,410,"6000 IU","20 mg","","Halal, Vegetarian","Potatoes, Carrots, Green Peas, Onions, Tomatoes, Spices, Oil","Sautéed","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Winter mix vegetable curry.")
add("Mix Sabzi (Mixed Veg)","مکس سبزی","","Pakistani","Lunch/Dinner","Vegetable","","1 katori","1 Katori",200,180,4,22,9,1.5,0.0,5.0,5.5,410,0,50,1.6,390,"4500 IU","25 mg","","Halal, Vegetarian","Potatoes, Carrots, Peas, Beans, Cauliflower, Spices, Oil","Sautéed","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Mixed vegetables in spiced base.")
add("Gia Tori (Sponge Gourd)","توری","","Pakistani","Lunch/Dinner","Vegetable","","1 katori","1 Katori",200,120,2,14,7,1.0,0.0,2.5,4.0,380,0,35,0.8,280,"120 IU","10 mg","","Halal, Vegetarian","Sponge Gourd, Onions, Tomatoes, Green Chilies, Spices, Oil","Sautéed","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Light sponge gourd curry.")
add("Karele Ki Sabzi (Dry)","کریلے کی سبزی","","Pakistani","Lunch/Dinner","Vegetable","","1 katori","1 Katori",200,190,4,16,13,2.0,0.0,4.5,3.0,420,0,40,1.8,380,"500 IU","55 mg","","Halal, Vegetarian","Bitter Gourd, Onions, Amchur, Spices, Oil (Fried slightly)","Pan-Fried","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Dry bitter gourd with onions.")
add("Baingan Ka Bharta","بینگن کا بھرتہ","","Pakistani","Lunch/Dinner","Vegetable","","1 katori","1 Katori",200,160,3,18,9,1.5,0.0,5.0,6.0,410,0,45,1.2,340,"300 IU","15 mg","","Halal, Vegetarian","Roasted Fire-Smoked Eggplant, Onions, Tomatoes, Garlic, Mustard Oil/Ghee","Sautéed","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Smoked mashed eggplant curry.")
add("Lauki Chana Dal","لوکی چنا دال","","Pakistani","Lunch/Dinner","Lentil/Veg","","1 katori","1 Katori",200,180,8,26,5,1.0,0.0,6.5,3.0,460,0,45,2.5,310,"80 IU","12 mg","","Halal, Vegetarian","Bottle Gourd, Split Chickpeas, Onions, Tomatoes, Spices, Oil","Simmered","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Bottle gourd cooked with lentils. Very healthy.")
add("Shalgam Chana Dal","شلجم چنا دال","","Pakistani","Lunch/Dinner","Lentil/Veg","","1 katori","1 Katori",200,190,8,28,5,1.0,0.0,7.0,4.0,480,0,50,2.8,320,"60 IU","15 mg","","Halal, Vegetarian","Turnips, Split Chickpeas, Onions, Spices, Oil","Simmered","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Turnip and chickpea lentil.")
add("Mooli Ki Roti","مولی کی روٹی","","Pakistani","Breakfast/Staple","Bread","","1 piece","1 Paratha",140,280,6,44,9,2.5,0.1,4.5,2.5,420,5,40,1.8,290,"40 IU","15 mg","Gluten, Dairy","Halal, Vegetarian","Whole Wheat Flour, Grated Radish, Spices, Ghee (Shallow Fried)","Pan-Fried (Shallow)","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Radish stuffed flatbread.")
add("Besan Ki Roti (Missi Roti)","بیسن کی روٹی","","Pakistani","Staple","Bread","","1 piece","1 Roti",100,260,10,40,7,1.0,0.0,6.5,2.0,380,0,45,2.8,310,"60 IU","0 mg","Gluten","Halal, Vegetarian","Gram Flour, Whole Wheat Flour, Onions, Green Chilies, Spices, Oil","Baked (Tawa)","USDA FoodData Central","Pakistan FCT 2001","",78,"Y","High protein gram flour bread.")

# =========================================================================
# BATCH 3E: STREET FOOD, CHAT & SAVORY SNACKS
# =========================================================================
add("Golgappe (Pani Puri)","گول گپے","","Pakistani","Snack","Street Food","","6 pieces","6 Pieces",150,180,4,30,5,1.0,0.0,2.5,2.0,680,0,30,1.5,180,"40 IU","5 mg","Gluten","Halal, Vegetarian","Semolina Puris, Chickpeas, Potatoes, Tamarind Water, Mint Water","Mixed","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Crispy hollow spheres with spicy tangy water.")
add("Chaat (Fruit Chaat)","فروٹ چاٹ","","Pakistani","Snack/Dessert","Fruit","","1 bowl","1 Bowl",200,120,1.5,30,0.5,0.0,0.0,4.5,22.0,180,0,25,0.8,350,"400 IU","45 mg","","Halal, Vegetarian, Vegan","Apples, Bananas, Guava, Grapes, Chaat Masala, Orange Juice/Sugar","Mixed","USDA FoodData Central","Pakistan FCT 2001","",78,"Y","Mixed fruit salad with spicy tangy chaat masala.")
add("Chana Chaat","چنا چاٹ","","Pakistani","Snack","Street Food","","1 plate","1 Plate",200,240,9,40,5,1.0,0.0,8.5,4.0,580,0,55,3.2,380,"120 IU","12 mg","","Halal, Vegetarian","Chickpeas, Potatoes, Onions, Tomatoes, Tamarind, Chaat Masala","Mixed","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Spicy chickpea snack.")
add("Aloo Tikki","آلو ٹکی","","Pakistani","Snack","Street Food","","2 pieces","2 Pieces",120,260,4,32,13,2.5,0.0,3.5,2.0,460,0,25,1.5,320,"40 IU","8 mg","","Halal, Vegetarian","Mashed Potatoes, Coriander, Green Chilies, Cumin, Oil","Fried (Shallow)","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Spiced potato patties.")
add("Bun Kebab (Daal/Aloo)","بن کباب","","Pakistani","Snack","Street Food","Karachi","1 burger","1 Burger",200,320,10,48,10,2.5,0.1,5.0,5.0,620,110,65,3.0,310,"120 IU","8 mg","Gluten, Eggs","Halal, Vegetarian","Burger Bun, Lentil/Potato Patty, Egg Wash, Chutney, Onions","Fried (Shallow)/Assembled","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Karachi's famous street burger.")
add("Shami Kebab (Beef)","شامی کباب","","Pakistani","Snack/Side","Kebab","","2 pieces","2 Pieces",100,240,16,14,13,4.0,0.2,2.5,1.5,480,85,35,3.2,280,"60 IU","2 mg","Eggs","Halal","Beef Mince, Chana Dal, Whole Spices, Egg, Oil","Fried (Shallow)","USDA FoodData Central","Pakistan FCT 2001","",78,"Y","Beef and lentil patties.")
add("Shami Kebab (Chicken)","چکن شامی کباب","","Pakistani","Snack/Side","Kebab","","2 pieces","2 Pieces",100,210,16,14,10,2.5,0.1,2.5,1.5,450,75,30,2.2,250,"40 IU","2 mg","Eggs","Halal","Chicken Mince, Chana Dal, Whole Spices, Egg, Oil","Fried (Shallow)","USDA FoodData Central","Pakistan FCT 2001","",78,"Y","Chicken and lentil patties.")
add("Chicken Roll (Paratha Roll)","چکن پراٹھا رول","","Pakistani","Snack/Lunch","Wrap","","1 roll","1 Roll",220,520,22,48,26,7.5,0.2,3.5,4.0,850,65,70,2.5,290,"180 IU","6 mg","Gluten, Dairy","Halal","Fried Paratha, Chicken Tikka, Onions, Tamarind Chutney, Mayo","Assembled","USDA FoodData Central","","",76,"Y","Chicken tikka wrapped in fried paratha.")
add("Beef Roll (Paratha Roll)","بیف پراٹھا رول","","Pakistani","Snack/Lunch","Wrap","","1 roll","1 Roll",220,560,24,46,30,9.0,0.3,3.5,4.0,880,75,65,3.2,320,"150 IU","5 mg","Gluten, Dairy","Halal","Fried Paratha, Beef Boti/Bihari, Onions, Chutney","Assembled","USDA FoodData Central","","",76,"Y","Beef wrapped in fried paratha.")
add("Namak Pare","نمک پارے","","Pakistani","Snack","Bakery","","1/2 cup","1/2 Cup",50,260,4,28,15,3.0,0.1,1.5,0.5,420,0,15,1.0,80,"0 IU","0 mg","Gluten","Halal, Vegetarian","Refined Flour, Carom Seeds, Cumin, Ghee/Oil, Salt","Fried (Deep)","USDA FoodData Central","Pakistan FCT 2001","",74,"Y","Crispy savory diamond-shaped pastry.")

# =========================================================================
# BATCH 3F: SWEETS, DESSERTS & TEA SNACKS
# =========================================================================
add("Rasgulla","رسگلہ","","Pakistani","Dessert","Sweet","","2 pieces","2 Pieces",100,240,6,42,5,3.0,0.1,0.5,38.0,40,15,140,0.3,120,"80 IU","0 mg","Dairy","Halal, Vegetarian","Chenna (Cottage Cheese), Sugar Syrup, Rose Water","Boiled","USDA FoodData Central","India IFCT 2017","",76,"Y","Spongy cheese balls in syrup.")
add("Ras Malai","رس ملائی","","Pakistani","Dessert","Sweet","","2 pieces + milk","1 Bowl",150,310,9,35,14,8.5,0.2,0.8,28.0,75,35,210,0.5,240,"200 IU","1 mg","Dairy, Tree Nuts","Halal, Vegetarian","Flattened Chenna Balls, Sweetened Thickened Milk, Pistachios, Saffron","Simmered","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Cottage cheese discs in sweet creamy milk.")
add("Gajrela (Carrot Kheer)","گجریلا","","Pakistani","Dessert","Sweet","","1 bowl","1 Bowl",200,240,6,38,7,4.0,0.1,2.0,28.0,85,22,190,0.8,310,"9000 IU","4 mg","Dairy, Tree Nuts","Halal, Vegetarian","Grated Carrots, Milk, Rice, Sugar, Cardamom, Nuts","Slow-Cooked","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Carrot and milk pudding (runnier than halwa).")
add("Sheer Khurma","شیر خرمہ","","Pakistani","Dessert","Sweet","","1 bowl","1 Bowl",200,290,8,44,9,5.0,0.1,2.5,32.0,95,25,220,1.2,340,"180 IU","1 mg","Dairy, Gluten, Tree Nuts","Halal, Vegetarian","Vermicelli, Full Fat Milk, Dates, Sugar, Almonds, Pistachios, Ghee","Simmered","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Eid special sweet vermicelli with dates and milk.")
add("Firni (Phiri)","پھرنی","","Pakistani","Dessert","Sweet","","1 bowl (clay pot)","1 Bowl",150,210,5,32,7,4.5,0.1,0.5,24.0,55,20,160,0.4,190,"120 IU","0 mg","Dairy, Tree Nuts","Halal, Vegetarian","Ground Rice, Milk, Sugar, Kewra Water, Almonds/Pistachios","Simmered/Set","USDA FoodData Central","Pakistan FCT 2001","",76,"Y","Ground rice pudding set in clay pots.")
add("Zarda (Mutanjan)","زردہ دیگی","","Pakistani","Dessert","Sweet","","1 plate","1 Plate",200,380,5,66,11,6.0,0.2,1.5,35.0,40,15,40,1.2,120,"80 IU","0 mg","Dairy, Tree Nuts","Halal, Vegetarian","Basmati Rice, Sugar, Ghee, Food Colors, Ashrafi (Candied Fruit), Nuts","Steamed","USDA FoodData Central","Pakistan FCT 2001","",72,"Y","Traditional wedding sweet rice.")
add("Khoya (Unsweetened)","کھویا (پھیکا)","","Pakistani","Ingredient","Dairy","","100g","100g",100,360,18,12,26,16.0,0.8,0.0,12.0,120,90,650,1.0,420,"800 IU","2 mg","Dairy","Halal, Vegetarian","Whole Milk (Slow reduced until solid)","Slow-Boiled","India IFCT 2017","Pakistan FCT 2001","",78,"Y","Reduced milk solids used in mithai.")
add("Soan Papdi","سون پاپڑی","","Pakistani","Dessert","Sweet","","2 pieces","2 Pieces",50,250,3,34,12,6.0,0.1,1.0,22.0,20,10,30,1.2,110,"60 IU","0 mg","Gluten, Dairy, Tree Nuts","Halal, Vegetarian","Gram Flour, Flour, Ghee, Sugar, Cardamom, Pistachio","Pulled/Flaky","USDA FoodData Central","","",74,"Y","Flaky spun sugar and gram flour sweet.")
add("Patisa","پتیسہ","","Pakistani","Dessert","Sweet","","2 pieces","2 Pieces",60,290,4,36,15,8.0,0.2,1.5,24.0,25,12,40,1.4,130,"80 IU","0 mg","Gluten, Dairy, Tree Nuts","Halal, Vegetarian","Gram Flour, Ghee, Sugar, Cardamom (Dense version of Soan Papdi)","Cooked/Set","USDA FoodData Central","","",74,"Y","Denser cousin of Soan Papdi.")
add("Fruit Cake (Bakery)","فروٹ کیک","","Pakistani","Dessert","Bakery","","1 slice","1 Slice",80,310,4,42,14,6.0,0.2,1.5,26.0,240,45,60,1.2,90,"120 IU","1 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Flour, Sugar, Butter/Oil, Eggs, Candied Fruit Peel (Ashrafi), Vanilla","Baked","USDA FoodData Central","","",76,"Y","Standard Pakistani bakery tea cake.")
add("Cake Rusk","کیک رسک","","Pakistani","Snack","Bakery","","2 pieces","2 Pieces",60,260,4,36,11,4.5,0.1,1.0,16.0,180,30,45,1.0,75,"80 IU","0 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Double-baked sponge cake","Baked","USDA FoodData Central","","",78,"Y","Crispy double baked cake. Dipped in tea.")
add("Baqarkhani (Sweet)","میٹھی باقر خانی","","Pakistani","Snack","Bakery","","1 piece","1 Piece",80,340,5,44,16,8.0,0.2,1.5,12.0,290,20,35,1.4,85,"100 IU","0 mg","Gluten, Dairy","Halal, Vegetarian","Layered Flour Pastry, Ghee, Sugar","Baked","USDA FoodData Central","","",74,"Y","Sweet layered bakery pastry.")
add("Zeera Biscuit (Cumin)","زیرہ بسکٹ","","Pakistani","Snack","Bakery","","4 pieces","4 Pieces",50,240,4,30,12,5.5,0.1,1.5,6.0,260,15,30,1.5,70,"60 IU","0 mg","Gluten, Dairy","Halal, Vegetarian","Flour, Butter/Ghee, Sugar, Cumin Seeds, Salt","Baked","USDA FoodData Central","","",76,"Y","Salty-sweet cumin biscuits.")

# =========================================================================
# BATCH 3G: RAW INGREDIENTS (NUTS, SEEDS, SPICES, OTHERS)
# =========================================================================
add("Almonds (Badam Raw)","بادام (کچا)","","International","Ingredient","Nuts","","1/4 cup (1 oz)","28g",28,164,6,6,14,1.1,0.0,3.5,1.2,1,0,76,1.0,208,"0 IU","0 mg","Tree Nuts","Halal, Vegetarian, Vegan","Raw Almonds","Raw","USDA FoodData Central #170567","","",92,"Y","USDA lab data.")
add("Walnuts (Akhrot Raw)","اخروٹ (کچا)","","International","Ingredient","Nuts","","1/4 cup (1 oz)","28g",28,185,4.3,3.9,18.5,1.7,0.0,1.9,0.7,0,0,28,0.8,125,"6 IU","0.3 mg","Tree Nuts","Halal, Vegetarian, Vegan","Raw Walnuts","Raw","USDA FoodData Central #170187","","",92,"Y","USDA lab data.")
add("Pistachios (Pista Raw)","پستہ (کچا)","","International","Ingredient","Nuts","","1/4 cup (1 oz)","28g",28,159,5.7,7.7,12.9,1.5,0.0,3.0,2.2,0,0,30,1.1,291,"116 IU","1.6 mg","Tree Nuts","Halal, Vegetarian, Vegan","Raw Pistachios","Raw","USDA FoodData Central #170184","","",92,"Y","USDA lab data.")
add("Cashews (Kaju Raw)","کاجو (کچا)","","International","Ingredient","Nuts","","1/4 cup (1 oz)","28g",28,157,5.2,8.6,12.4,2.2,0.0,0.9,1.7,3,0,10,1.9,187,"0 IU","0.1 mg","Tree Nuts","Halal, Vegetarian, Vegan","Raw Cashews","Raw","USDA FoodData Central #170162","","",92,"Y","USDA lab data.")
add("Peanuts (Mungfali Raw)","مونگ پھلی (کچی)","","International","Ingredient","Legume/Nut","","1/4 cup (1 oz)","28g",28,161,7.3,4.5,14.0,1.9,0.0,2.4,1.3,5,0,26,1.3,197,"0 IU","0 mg","Peanuts","Halal, Vegetarian, Vegan","Raw Peanuts","Raw","USDA FoodData Central #172430","","",92,"Y","USDA lab data. Actually a legume.")
add("Pine Nuts (Chilgoza)","چلغوزہ","","International","Ingredient","Nuts","","1 oz","28g",28,191,3.9,3.7,19.1,1.4,0.0,1.1,1.0,1,0,4.5,1.6,169,"8 IU","0.2 mg","Tree Nuts","Halal, Vegetarian, Vegan","Raw Pine Nuts","Raw","USDA FoodData Central #170183","","",92,"Y","USDA lab data. Premium nut from northern Pakistan.")
add("Flax Seeds (Alsi)","السی کے بیج","","International","Ingredient","Seeds","","1 tablespoon","10g",10,53,1.8,2.9,4.2,0.4,0.0,2.7,0.2,3,0,25,0.6,81,"0 IU","0.1 mg","","Halal, Vegetarian, Vegan","Whole Flax Seeds","Raw","USDA FoodData Central #169414","","",92,"Y","High in ALA Omega 3.")
add("Chia Seeds (Tukhm-e-Balanga)","تخم بالنگا","","International","Ingredient","Seeds","","1 tablespoon","10g",10,49,1.7,4.2,3.1,0.3,0.0,3.4,0.0,2,0,63,0.8,41,"5 IU","0.2 mg","","Halal, Vegetarian, Vegan","Chia Seeds/Basil Seeds","Raw","USDA FoodData Central #170554","","",92,"Y","Very high fiber and omega 3.")
add("Pumpkin Seeds (Kaddu Ke Beej)","کدو کے بیج","","International","Ingredient","Seeds","","1 oz","28g",28,158,8.5,4.2,13.9,2.4,0.0,1.8,0.4,2,0,12,2.5,226,"11 IU","0.5 mg","","Halal, Vegetarian, Vegan","Dried Pumpkin Seeds Kernel","Raw","USDA FoodData Central #170188","","",92,"Y","High magnesium and zinc.")
add("Sesame Seeds (Til)","تل","","International","Ingredient","Seeds","","1 tablespoon","9g",9,52,1.6,2.1,4.5,0.6,0.0,1.1,0.0,1,0,88,1.3,42,"1 IU","0 mg","Sesame","Halal, Vegetarian, Vegan","Whole Dried Sesame Seeds","Raw","USDA FoodData Central #170150","","",92,"Y","USDA lab data. Very high calcium.")
add("Garlic (Lehsan Raw)","لہسن (کچا)","","International","Ingredient","Herb","","1 clove","3g",3,4,0.2,1.0,0.0,0.0,0.0,0.1,0.0,1,0,5,0.1,12,"0 IU","0.9 mg","","Halal, Vegetarian, Vegan","Raw Garlic Clove","Raw","USDA FoodData Central #169230","","",94,"Y","USDA lab data.")
add("Ginger (Adrak Raw)","ادرک (کچی)","","International","Ingredient","Herb","","1 slice (approx)","11g",11,9,0.2,2.0,0.1,0.0,0.0,0.2,0.2,1,0,2,0.1,46,"0 IU","0.6 mg","","Halal, Vegetarian, Vegan","Raw Ginger Root","Raw","USDA FoodData Central #169231","","",94,"Y","USDA lab data.")
add("Turmeric Powder (Haldi)","ہلدی پاؤڈر","","International","Ingredient","Spice","","1 teaspoon","3g",3,9,0.2,2.0,0.1,0.0,0.0,0.6,0.1,1,0,5,1.2,76,"0 IU","0.8 mg","","Halal, Vegetarian, Vegan","Ground Turmeric","Dried","USDA FoodData Central #172231","","",94,"Y","USDA lab data. High iron content for a spice.")
add("Cumin Seeds (Zeera)","سفید زیرہ","","International","Ingredient","Spice","","1 teaspoon","2g",2,8,0.4,0.9,0.5,0.0,0.0,0.2,0.0,3,0,19,1.4,36,"25 IU","0.2 mg","","Halal, Vegetarian, Vegan","Whole Cumin Seeds","Dried","USDA FoodData Central #170920","","",94,"Y","USDA lab data.")
add("Coriander Seeds (Dhania)","سوکھا دھنیا","","International","Ingredient","Spice","","1 teaspoon","2g",2,5,0.2,1.0,0.3,0.0,0.0,0.8,0.0,1,0,13,0.3,22,"0 IU","0.4 mg","","Halal, Vegetarian, Vegan","Whole Coriander Seeds","Dried","USDA FoodData Central #170919","","",94,"Y","USDA lab data.")
add("Garam Masala","گرم مصالحہ","","Pakistani","Ingredient","Spice Blend","","1 teaspoon","2g",2,7,0.3,1.2,0.3,0.0,0.0,0.6,0.0,1,0,18,0.7,30,"10 IU","0.1 mg","","Halal, Vegetarian, Vegan","Mixed Ground Spices (Cinnamon, Cumin, Cardamom, Cloves, Pepper)","Mixed","USDA FoodData Central #172242","","",90,"Y","Standard subcontinental spice blend.")
add("Red Chili Powder (Lal Mirch)","لال مرچ پاؤڈر","","Pakistani","Ingredient","Spice","","1 teaspoon","3g",3,8,0.4,1.4,0.4,0.1,0.0,1.0,0.3,1,0,9,0.5,58,"885 IU","2.1 mg","","Halal, Vegetarian, Vegan","Ground Red Chili Peppers","Dried","USDA FoodData Central #170933","","",94,"Y","High Vitamin A content.")
add("Salt (Namak)","نمک","","International","Ingredient","Condiment","","1 teaspoon","6g",6,0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,2325,0,1,0.0,0,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Table Salt, Iodized","Processed","USDA FoodData Central #172778","","",98,"Y","Pure table salt. ~2300mg sodium per tsp.")

# =========================================================================
# BATCH 3H: CHINESE & FAST FOOD - CONTINUED
# =========================================================================
add("Chicken Corn Soup","چکن کارن سوپ","","Chinese","Starter","Soup","","1 bowl","1 Bowl",250,180,12,22,5,1.5,0.0,2.0,4.0,780,45,25,1.2,220,"120 IU","4 mg","Eggs, Soy","Halal","Chicken Broth, Shredded Chicken, Sweet Corn, Egg Drop, Cornstarch","Boiled","USDA FoodData Central","","",78,"Y","Classic Indo-Chinese thick soup.")
add("Hakka Noodles","ہکا نوڈلز","","Chinese","Lunch/Dinner","Noodles","","1 plate","1 Plate",300,420,12,68,14,2.5,0.1,4.5,5.0,850,0,50,2.5,280,"400 IU","25 mg","Gluten, Soy","Halal, Vegetarian","Wheat Noodles, Cabbage, Carrots, Capsicum, Soy Sauce, Vinegar, Oil","Stir-Fried","USDA FoodData Central","","",76,"Y","Vegetable stir-fried noodles.")
add("Beef Chili Dry","بیف چلی ڈرائی","","Chinese","Lunch/Dinner","Stir-Fry","","1 serving","1 Katori",220,380,26,14,24,8.0,0.2,1.5,3.0,920,70,30,3.0,380,"180 IU","35 mg","Gluten, Soy","Halal","Beef Strips, Green Chilies, Ginger, Soy Sauce, Oyster Sauce (Halal), Oil","Stir-Fried","USDA FoodData Central","","",76,"Y","Spicy Indo-Chinese beef stir-fry.")
add("Kung Pao Chicken","کنگ پاؤ چکن","","Chinese","Lunch/Dinner","Curry","","1 serving","1 Katori",250,410,24,22,25,4.5,0.1,3.5,6.0,880,55,40,2.0,350,"250 IU","15 mg","Gluten, Soy, Peanuts","Halal","Chicken, Peanuts, Dried Red Chilies, Soy Sauce, Vinegar, Sugar, Oil","Stir-Fried","USDA FoodData Central","","",76,"Y","Spicy and sweet peanut chicken.")
add("Margarita Pizza Slice","مارگریٹا سلائس","","Italian","Lunch/Dinner","Pizza","","1 slice (large)","1 Slice",130,280,12,32,11,5.5,0.1,2.0,3.0,580,25,180,1.8,160,"250 IU","2 mg","Gluten, Dairy","Halal, Vegetarian","Pizza Dough, Tomato Sauce, Mozzarella, Basil, Olive Oil","Baked","USDA FoodData Central","","",80,"Y","Simple cheese pizza slice.")
add("Pepperoni Pizza (Halal Beef)","بیف پیپرونی پیزا","","Italian","Lunch/Dinner","Pizza","","1 slice (large)","1 Slice",140,340,16,34,16,7.5,0.2,2.0,3.0,820,40,210,2.2,190,"300 IU","2 mg","Gluten, Dairy","Halal","Pizza Dough, Tomato Sauce, Mozzarella, Halal Beef Pepperoni","Baked","USDA FoodData Central","","",78,"Y","Halal beef pepperoni slice.")

total = len(existing_records) + len(new_items)
print(f"New items in this batch: {len(new_items)}")
print(f"Total after this batch: {total}")

all_final = existing_records + new_items

with open(MASTER_FILE, mode='w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
    writer.writeheader()
    writer.writerows(all_final)

print(f"Saved {len(all_final)} total records.")
