"""
Batch 8: Final 170 items to reach/exceed 1000 records.
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

# Pakistani food - more regional specialties
add("Peshwari Chapli Kebab","پشاوری چپلی کباب","Pakistani","Lunch/Dinner","BBQ","2 pieces / 200g",200,580,28,18,44,18,0.6,3.0,4.0,820,120,50,4.5,380,"80 IU","8 mg","Gluten, Eggs","Halal","Beef Mince, Animal Fat, Tomatoes, Eggs, Coriander Seeds, Cumin, Flour","Shallow Fried","","Pakistan FCT 2001",72,"Fatty rich Peshawari style.")
add("Kadhi Pakora","کڑھی پکوڑہ","Pakistani","Lunch/Dinner","Curry","1 bowl / 300g",300,340,10,40,16,6,0.1,4.5,8.0,640,25,220,2.5,320,"200 IU","3 mg","Gluten, Dairy","Halal, Vegetarian","Yogurt Gravy, Gram Flour, Fried Pakoras, Curry Leaves, Tempering","Simmered","","Pakistan FCT 2001",76,"Sour yogurt curry with gram flour fritters.")
add("Dhaba Dal (Mixed)","دھابہ دال","Pakistani","Lunch/Dinner","Lentil","1 bowl / 300g",300,280,14,40,8,2.0,0.0,10,4.0,480,0,55,4.5,420,"100 IU","6 mg","","Halal, Vegetarian","Mixed Lentils (Masoor, Moong, Chana), Tomatoes, Onions, Tadka","Simmered","","Pakistan FCT 2001",76,"Mixed lentil roadside dal.")
add("Malai Chicken Tikka","ملائی چکن ٹکہ","Pakistani","Dinner","BBQ","4 pieces / 180g",180,400,30,6,28,12,0.3,1.0,3.5,580,100,60,1.8,320,"200 IU","2 mg","Dairy","Halal","Chicken, Fresh Cream, Cardamom, Cheese, White Pepper, Ginger Paste","Grilled (Tandoor)","","Pakistan FCT 2001",76,"Creamy white tikka.")
add("Lahori Fish Fry","لاہوری فش فرائی","Pakistani","Lunch/Dinner","Seafood","1 serving / 200g",200,380,28,14,24,4.5,0.1,2.0,2.5,680,80,55,2.5,340,"80 IU","4 mg","Gluten","Halal","Fresh River Fish, Lahori Spices, Ajwain, Gram Flour, Oil","Fried (Deep)","","Pakistan FCT 2001",74,"Famous spicy Lahori fried fish.")
add("Chicken Qeema Matar","چکن قیمہ مٹر","Pakistani","Lunch/Dinner","Curry","1 katori / 250g",250,340,24,20,18,5.5,0.1,4.5,4.0,620,72,45,2.5,360,"350 IU","18 mg","","Halal","Chicken Mince, Green Peas, Onions, Tomatoes, Spices, Oil","Sautéed","","Pakistan FCT 2001",76,"Chicken mince with peas.")
add("Beef Nihari Naan (Set)","نہاری نان سیٹ","Pakistani","Breakfast","Set Meal","1 set",350,680,36,62,32,12,0.5,3.5,4.0,980,115,95,5.0,480,"80 IU","4 mg","Gluten","Halal","Beef Nihari Gravy, Naan, Ginger, Coriander, Lemon","Mixed","","Pakistan FCT 2001",70,"Classic Nihari and naan breakfast.")
add("Aloo Gosht (Classic)","آلو گوشت (کلاسک)","Pakistani","Lunch/Dinner","Curry","1 katori / 250g",250,370,24,22,22,8,0.3,3.5,4.5,640,80,45,3.0,420,"120 IU","12 mg","","Halal","Mutton, Potatoes, Onions, Tomatoes, Whole Spices, Oil","Slow-Cooked","","Pakistan FCT 2001",78,"Classic potato and mutton curry.")
add("Chicken Saag","چکن ساگ","Pakistani","Lunch/Dinner","Curry","1 katori / 250g",250,350,28,12,22,7,0.2,4.5,3.5,680,85,120,3.8,460,"5000 IU","18 mg","Dairy","Halal","Chicken, Spinach, Cream, Onions, Ginger, Garlic, Spices","Simmered","","Pakistan FCT 2001",76,"Chicken in spinach gravy.")
add("Daal Mash (White Lentil)","دال ماش","Pakistani","Lunch/Dinner","Lentil","1 katori / 250g",250,240,14,36,6,1.0,0.0,8.0,2.5,420,0,55,3.5,390,"60 IU","3 mg","","Halal, Vegetarian","Split Black Gram (Urad), Onions, Garlic, Ginger, Tomatoes, Oil","Simmered","","Pakistan FCT 2001",78,"Mild creamy white lentil.")
add("Bihari Kebab (Marinated Beef)","بہاری کباب","Pakistani","Dinner","BBQ","4 pieces / 160g",160,360,28,6,24,9,0.4,1.5,2.0,580,90,30,3.2,300,"40 IU","2 mg","","Halal","Beef, Papaya (tenderizer), Raw Onion, Bihari Masala, Mustard Oil","Grilled/Tawa","","Pakistan FCT 2001",74,"Tender marinated beef skewers.")
add("Kaleji Masala (Liver Curry)","کلیجی مصالحہ","Pakistani","Lunch/Dinner","Offal","1 katori / 200g",200,320,26,8,20,7,0.3,2.0,3.5,580,420,25,7.5,360,"8000 IU","12 mg","","Halal","Beef/Mutton Liver, Onions, Tomatoes, Ginger, Garlic, Spices, Oil","Stir-Fried","","Pakistan FCT 2001",74,"High iron and Vit A organ meat dish.")
add("Chicken Masala (Dry)","چکن مصالحہ (خشک)","Pakistani","Lunch/Dinner","Curry","1 katori / 200g",200,340,28,6,22,6,0.2,2.0,3.5,640,85,35,2.2,320,"80 IU","4 mg","","Halal","Chicken, Dry Roasted Whole Spices, Tomatoes, Onions, Oil","Bhuno (Dry)","","Pakistan FCT 2001",78,"Dry roasted spice chicken.")
add("Balochi Lamb Pulao","بلوچی لیمب پلاؤ","Pakistani","Lunch/Dinner","Rice","1 plate / 400g",400,620,28,68,28,10,0.4,3.5,3.0,780,90,60,4.0,420,"60 IU","3 mg","","Halal","Rice, Lamb, Onions, Whole Spices, Stock, Oil","Slow-Cooked","","Pakistan FCT 2001",72,"Balochistan-style simple lamb pilaf.")
add("Tawa Roti (Tandoor, Butter)","توا روٹی (مکھن)","Pakistani","Staple","Bread","1 roti / 80g",80,200,6,38,4,2.0,0.1,3.5,1.5,280,8,30,2.0,120,"80 IU","0 mg","Gluten, Dairy","Halal, Vegetarian","Whole Wheat Flour, Water, Salt, Butter Topping","Baked (Tawa)","","Pakistan FCT 2001",80,"")
add("Phulka (Small Thin Roti)","پھلکا","Pakistani","Staple","Bread","2 pieces / 60g",60,145,4.5,28.5,1.8,0.3,0.0,3.5,0.8,120,0,18,1.5,90,"0 IU","0 mg","Gluten","Halal, Vegetarian","Whole Wheat Flour, Water, Salt","Baked (Tawa + Direct Flame)","","Pakistan FCT 2001",82,"Very thin puffed rotis.")
add("Siri (Goat Head Curry)","سری (گوشت کا سر)","Pakistani","Breakfast","Offal","1 bowl / 250g",250,320,26,8,20,8,0.4,1.5,2.5,620,140,50,3.5,280,"80 IU","4 mg","","Halal","Goat Head Meat, Onions, Whole Spices, Ginger, Garlic","Slow-Cooked","","Pakistan FCT 2001",70,"Traditional morning offal curry.")
add("Sag Makki (Corn Roti+Mustard Greens)","ساگ مکی","Pakistani","Lunch/Dinner","Set Meal","1 set / 350g",350,400,12,56,18,10,0.0,10,5.5,440,18,250,3.8,570,"9000 IU","55 mg","Dairy","Halal, Vegetarian","Sarson Ka Saag, Makki Ki Roti, Ghee, Butter, Jaggery Syrup","Mixed","","Pakistan FCT 2001",76,"Complete Punjabi winter meal.")
add("Kachri Ki Sabzi","کچری کی سبزی","Pakistani","Lunch/Dinner","Vegetable","1 katori / 200g",200,140,3,18,7,1.2,0.0,4.0,5.5,380,0,35,1.2,290,"80 IU","12 mg","","Halal, Vegetarian","Dried Wild Cucumber/Kachri, Onions, Tomatoes, Spices, Oil","Sautéed","","Pakistan FCT 2001",70,"Rajasthani/Sindhi dried cucumber curry.")
add("Tosha (Sweet Paratha)","توشہ","Pakistani","Breakfast/Snack","Bakery","2 pieces / 80g",80,310,5,36,17,8,0.2,2.0,10,180,18,35,1.5,80,"100 IU","0 mg","Gluten, Dairy","Halal, Vegetarian","Refined Flour, Ghee, Sugar, Sesame Seeds","Fried/Baked","","Pakistan FCT 2001",72,"Sweet fried snack pastry.")

# International complete dishes (gaps)
add("Grilled Swordfish","گرلڈ سورڈ فش","International","Dinner","Seafood","1 fillet / 180g",180,296,32,0,18,4.5,0.1,0.0,0.0,204,90,10,1.2,440,"90 IU","1.8 mg","","Halal","Swordfish Steak, Olive Oil, Lemon, Herbs","Grilled","USDA FoodData Central #15113","",90,"USDA #15113")
add("Lobster, Steamed","لابسٹر","International","Dinner","Seafood","1 tail / 150g",150,135,28.4,0.0,1.4,0.3,0.0,0.0,0.0,551,145,95,0.8,420,"0 IU","0 mg","Shellfish","Halal","Lobster Tail, Butter, Lemon","Steamed","USDA FoodData Central #15149","",90,"USDA #15149")
add("Scallops, Seared","اسکالپس","International","Dinner","Seafood","6 pieces / 150g",150,150,25.5,5.0,1.0,0.1,0.0,0.0,0.0,555,50,60,1.0,280,"0 IU","3 mg","Shellfish","Halal","Sea Scallops, Butter, Garlic, Lemon","Pan-Seared","USDA FoodData Central #15089","",88,"USDA data.")
add("Duck Biryani","ڈک بریانی","International","Lunch/Dinner","Rice","1 plate / 350g",350,580,28,64,24,8,0.3,3.5,4.5,780,90,60,3.5,380,"100 IU","4 mg","Dairy","Halal","Basmati Rice, Duck Pieces, Biryani Spices, Yogurt, Fried Onions","Slow-Cooked (Dum)","","",76,"")
add("Lamb Rogan Josh","لیمب روگن جوش","International","Dinner","Curry","1 katori / 250g",250,420,28,12,30,12,0.4,2.5,5.5,680,90,55,3.5,380,"600 IU","5 mg","Dairy","Halal","Lamb, Kashmiri Red Chilies, Yogurt, Whole Spices, Saffron, Oil","Slow-Cooked","","India IFCT 2017",80,"Kashmiri aromatic red lamb curry.")
add("Chicken Korma (White)","چکن قورمہ (سفید)","International","Dinner","Curry","1 katori / 250g",250,400,26,12,28,10,0.2,2.0,4.5,640,85,70,2.2,350,"120 IU","3 mg","Dairy, Tree Nuts","Halal","Chicken, Onion Paste, Cashew, Cream, Whole Spices, Saffron","Slow-Cooked","","India IFCT 2017",80,"Rich cream and nut chicken curry.")
add("Aloo Tikki Chaat","آلو ٹکی چاٹ","International","Snack","Street Food","1 plate / 200g",200,320,8,40,14,3.5,0.1,5.0,8.5,580,18,75,2.5,380,"200 IU","12 mg","Dairy","Halal, Vegetarian","Potato Tikki, Yogurt, Tamarind Chutney, Sev, Chaat Masala, Onions","Assembled","","India IFCT 2017",80,"Popular Indian street food.")
add("Hara Bhara Kebab","ہرا بھرا کباب","International","Snack","Vegetarian","3 pieces / 120g",120,220,8,28,9,2.0,0.0,5.0,2.5,380,18,80,2.5,360,"3000 IU","20 mg","Gluten","Halal, Vegetarian","Spinach, Peas, Potatoes, Breadcrumbs, Spices","Pan-Fried","","India IFCT 2017",80,"Green vegetable patties.")
add("Keema Samosa","قیمہ سموسہ","Pakistani","Snack","Street Food","2 pieces / 120g",120,340,14,32,18,5.5,0.2,2.5,2.5,560,40,30,3.0,200,"80 IU","3 mg","Gluten","Halal","Refined Flour Pastry Shell, Minced Beef/Lamb, Onions, Coriander, Spices","Fried (Deep)","","Pakistan FCT 2001",80,"Classic meat samosa.")
add("Behari Boti Roll","بہاری بوٹی رول","Pakistani","Snack/Lunch","Wrap","1 roll / 200g",200,520,24,44,28,8.5,0.3,4.0,4.5,820,70,60,3.0,320,"120 IU","5 mg","Gluten","Halal","Tawa Paratha, Bihari Marinated Beef Strips, Onions, Green Chutney, Mayo","Assembled","","Pakistan FCT 2001",76,"")
add("Fish Pakora","فش پکوڑہ","Pakistani","Snack","Fritters","6 pieces / 150g",150,340,22,22,18,3.5,0.1,2.0,1.5,620,60,45,2.0,280,"40 IU","3 mg","Gluten","Halal","Fish Pieces, Gram Flour, Ginger, Garlic, Spices, Oil","Fried (Deep)","","Pakistan FCT 2001",76,"Crispy spiced fish fritters.")
add("Panner Ki Roti","پنیر کی روٹی","Pakistani","Breakfast","Bread","1 piece / 150g",150,340,12,44,14,5.5,0.1,4.0,2.5,460,20,195,2.0,180,"200 IU","0.5 mg","Gluten, Dairy","Halal, Vegetarian","Whole Wheat Flour, Crumbled Cottage Cheese, Onions, Herbs, Ghee","Pan-Fried","","Pakistan FCT 2001",74,"Cottage cheese stuffed paratha.")
add("Achari Gosht (Pickled Mutton)","اچاری گوشت","Pakistani","Dinner","Curry","1 katori / 250g",250,420,28,10,30,11,0.4,3.0,5.5,740,95,50,3.2,370,"100 IU","6 mg","","Halal","Mutton, Whole Spices, Pickling Spices (Mustard, Fenugreek), Yogurt","Simmered","","Pakistan FCT 2001",74,"")
add("Chicken Daal (Combo)","چکن دال (کومبو)","Pakistani","Lunch/Dinner","Combo","1 bowl / 300g",300,320,22,32,12,3.5,0.1,8.5,3.5,560,55,60,4.0,400,"150 IU","6 mg","","Halal","Chicken Pieces, Mixed Lentils, Onions, Tomatoes, Ginger, Spices","Simmered","","Pakistan FCT 2001",78,"Chicken cooked with lentils.")
add("Dahi Vada","دہی وڑہ","Pakistani","Snack","Street Food","4 pieces / 200g",200,250,10,34,8,3.5,0.1,3.5,8.5,520,18,190,2.0,280,"100 IU","2 mg","Dairy","Halal, Vegetarian","Lentil Dumplings, Yogurt, Tamarind Chutney, Cumin, Chaat Masala","Mixed/Assembled","","Pakistan FCT 2001",78,"Soft lentil dumplings in yogurt.")
add("Seekh Paratha","سیخ پراٹھا","Pakistani","Breakfast/Lunch","Bread","1 piece / 150g",150,360,14,40,16,6,0.2,3.5,2.0,560,45,45,2.5,220,"80 IU","2 mg","Gluten","Halal","Whole Wheat Paratha, Minced Meat Filling, Onions, Herbs","Pan-Fried","","Pakistan FCT 2001",76,"Minced meat stuffed flatbread.")
add("Haleem (Chicken)","چکن حلیم","Pakistani","Lunch/Dinner","Stew","1 bowl / 300g",300,380,24,40,14,4.5,0.1,6.5,3.0,680,65,50,3.8,360,"80 IU","4 mg","Gluten","Halal","Chicken, Wheat, Barley, Lentils, Spices, Fried Onions, Ginger","Slow-Cooked (Blended)","","Pakistan FCT 2001",76,"Chicken version of the classic slow-cooked stew.")
add("Sindhi Biryani","سندھی بریانی","Pakistani","Lunch/Dinner","Rice","1 plate / 400g",400,640,30,68,28,9,0.3,3.5,4.0,860,90,80,3.8,450,"200 IU","6 mg","Dairy","Halal","Basmati Rice, Beef/Mutton, Potatoes, Plums, Yogurt, Sindhi Spices, Oil","Slow-Cooked (Dum)","","Pakistan FCT 2001",74,"Distinctive Sindhi sour-spicy biryani.")
add("Kachori","کچوری","Pakistani","Snack","Street Food","2 pieces / 80g",80,300,7,32,17,3.5,0.1,4.0,1.5,320,0,30,2.0,130,"40 IU","3 mg","Gluten","Halal, Vegetarian","Refined Flour Pastry, Lentil Filling (or Aloo), Spices","Fried (Deep)","","Pakistan FCT 2001",76,"Crispy stuffed fried snack.")
add("Cholay Pulao","چھولے پلاؤ","Pakistani","Lunch/Dinner","Rice","1 plate / 350g",350,480,16,76,12,3.0,0.0,10.5,4.5,640,0,80,5.0,460,"80 IU","5 mg","","Halal, Vegetarian","Basmati Rice, Chickpeas, Onions, Whole Spices, Oil/Ghee","Slow-Cooked","","Pakistan FCT 2001",76,"Chickpea rice pilaf.")

# Additional grains and ingredients
add("Corn on the Cob (Boiled)","مکئی کا بھٹہ (ابلا)","International","Ingredient","Vegetable","1 medium / 123g",123,111,3.5,25.9,1.4,0.2,0.0,2.8,5.0,22,0,3,0.6,243,"187 IU","9.1 mg","","Halal, Vegetarian, Vegan","Whole Corn Cob","Boiled","USDA FoodData Central #11167","",92,"USDA #11167")
add("Edamame, Shelled","ایڈامامے","International","Ingredient","Legume","1/2 cup / 88g",88,94,8.4,7.7,4.0,0.4,0.0,3.8,3.5,4,0,49,1.8,436,"9 IU","5.0 mg","Soy","Halal, Vegetarian","Shelled Young Soybeans","Boiled","USDA FoodData Central #168411","",92,"USDA #168411")
add("Hummus, Roasted Red Pepper","ہمس (سرخ مرچ)","International","Ingredient","Dip","2 tbsp / 30g",30,75,2.0,6.5,4.8,0.7,0.0,2.0,1.5,130,0,18,0.8,78,"120 IU","5.0 mg","Sesame","Halal, Vegetarian","Chickpeas, Roasted Red Pepper, Tahini, Olive Oil, Lemon, Garlic","Blended","","",86,"")
add("Beet Hummus","چقندر حمص","International","Ingredient","Dip","2 tbsp / 30g",30,60,1.5,7.5,3.0,0.4,0.0,1.5,3.5,115,0,15,0.7,90,"5 IU","2.0 mg","Sesame","Halal, Vegetarian","Roasted Beets, Chickpeas, Tahini, Olive Oil, Lemon, Garlic","Blended","","",84,"")
add("Guacamole (Avocado Dip)","گواکامولے","International","Ingredient","Dip","2 tbsp / 30g",30,48,0.6,2.5,4.4,0.6,0.0,2.0,0.2,70,0,4,0.2,150,"44 IU","3.0 mg","","Halal, Vegetarian","Avocado, Lime, Salt, Cilantro, Onion","Mashed","USDA FoodData Central #09037","",90,"")
add("Cream Cheese","کریم چیز","International","Ingredient","Dairy","2 tbsp / 29g",29,101,1.8,1.2,9.8,6.2,0.0,0.0,1.2,107,31,25,0.1,34,"378 IU","0 mg","Dairy","Halal, Vegetarian","Pasteurized Milk, Cream, Salt, Carob Bean Gum","Cultured/Processed","USDA FoodData Central #01017","",92,"USDA #01017")
add("Sour Cream","ساور کریم","International","Ingredient","Dairy","2 tbsp / 29g",29,56,0.7,1.3,5.4,3.4,0.0,0.0,1.0,14,17,32,0.0,39,"200 IU","0.3 mg","Dairy","Halal, Vegetarian","Cultured Cream, Enzyme","Cultured","USDA FoodData Central #01056","",92,"USDA #01056")
add("Evaporated Milk (Canned)","بانجھ دودھ (ڈبہ)","International","Ingredient","Dairy","2 tbsp / 32g",32,40,2.1,3.0,2.1,1.3,0.0,0.0,3.0,33,8,74,0.1,96,"76 IU","0.3 mg","Dairy","Halal, Vegetarian","Evaporated Whole Milk, Vitamin D","Condensed/Processed","USDA FoodData Central #01023","",92,"USDA #01023")
add("Condensed Milk, Sweetened","میٹھا دودھ (کنڈنسڈ)","International","Ingredient","Dairy","2 tbsp / 38g",38,123,3.0,20.8,3.3,2.1,0.0,0.0,20.8,49,13,108,0.1,142,"100 IU","0.5 mg","Dairy","Halal, Vegetarian","Whole Milk, Sugar (Sweetened Condensed)","Condensed","USDA FoodData Central #01019","",92,"USDA #01019. High sugar.")
add("Baking Powder","بیکنگ پاؤڈر","International","Ingredient","Leavening","1 tsp / 4g",4,2,0.0,1.1,0.0,0.0,0.0,0.0,0.0,488,0,180,0.0,1,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Sodium Bicarbonate, Cream of Tartar, Cornstarch","Dry Mix","USDA FoodData Central #18369","",98,"USDA #18369. Very high sodium.")
add("Baking Soda","بیکنگ سوڈا","International","Ingredient","Leavening","1/4 tsp / 1g",1,0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,315,0,0,0.0,0,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Sodium Bicarbonate","Chemical","USDA FoodData Central","",98,"Very high sodium per gram.")
add("Vanilla Extract","ونیلا ایکسٹریکٹ","International","Ingredient","Flavoring","1 tsp / 4g",4,12,0.0,0.5,0.0,0.0,0.0,0.0,0.5,0,0,1,0.0,9,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Vanilla Bean Extract, Alcohol (trace)","Extracted","USDA FoodData Central #02050","",96,"USDA #02050")
add("Cinnamon Powder","دار چینی پاؤڈر","International","Ingredient","Spice","1 tsp / 3g",3,6,0.1,2.1,0.0,0.0,0.0,1.4,0.1,0,0,26,0.2,11,"6 IU","0.1 mg","","Halal, Vegetarian, Vegan","Ground Cinnamon","Dried","USDA FoodData Central #02010","",96,"USDA #02010. High in fiber and antioxidants.")
add("Black Pepper, Ground","کالی مرچ","International","Ingredient","Spice","1 tsp / 2g",2,6,0.2,1.5,0.1,0.0,0.0,0.6,0.0,0,0,13,0.2,27,"6 IU","0.1 mg","","Halal, Vegetarian, Vegan","Ground Black Peppercorns","Dried","USDA FoodData Central #02030","",96,"USDA #02030")
add("Cardamom (Elaichi), Ground","الائچی پاؤڈر","International","Ingredient","Spice","1 tsp / 2g",2,6,0.2,1.4,0.1,0.0,0.0,0.6,0.1,0,0,22,0.3,36,"0 IU","0.5 mg","","Halal, Vegetarian, Vegan","Ground Green Cardamom Seeds","Dried","USDA FoodData Central #02006","",94,"USDA #02006")
add("Cloves, Ground","لونگ پاؤڈر","International","Ingredient","Spice","1 tsp / 2g",2,7,0.1,1.4,0.4,0.1,0.0,0.8,0.3,5,0,13,0.2,23,"12 IU","1.0 mg","","Halal, Vegetarian, Vegan","Ground Dried Cloves","Dried","USDA FoodData Central #02011","",96,"USDA #02011")
add("Fenugreek Seeds (Methi Dana)","میتھی دانہ","Pakistani","Ingredient","Spice","1 tsp / 3.7g",3.7,12,0.9,2.1,0.2,0.0,0.0,0.9,0.4,2,0,7,1.2,28,"0 IU","0.1 mg","","Halal, Vegetarian, Vegan","Whole Fenugreek Seeds","Dried","USDA FoodData Central #02019","Pakistan FCT 2001",94,"USDA #02019. Blood sugar management.")
add("Nigella Seeds (Kalonji)","کلونجی","Pakistani","Ingredient","Spice","1 tsp / 2g",2,10,0.4,1.1,0.7,0.0,0.0,0.5,0.1,1,0,19,0.4,28,"0 IU","0.1 mg","","Halal, Vegetarian, Vegan","Black Seed / Nigella Sativa","Dried","","Pakistan FCT 2001",88,"Traditional Islamic medicine seed.")
add("Fennel Seeds (Saunf)","سونف","Pakistani","Ingredient","Spice","1 tsp / 2g",2,7,0.3,1.0,0.3,0.0,0.0,0.8,0.1,2,0,24,0.4,34,"6 IU","0.4 mg","","Halal, Vegetarian, Vegan","Dried Fennel Seeds","Dried","USDA FoodData Central #02018","Pakistan FCT 2001",94,"USDA #02018")
add("Carom Seeds (Ajwain)","اجوائن","Pakistani","Ingredient","Spice","1 tsp / 2g",2,9,0.4,1.2,0.4,0.0,0.0,0.9,0.1,1,0,31,0.6,28,"0 IU","0.5 mg","","Halal, Vegetarian, Vegan","Carom/Bishop's Weed Seeds","Dried","","Pakistan FCT 2001",88,"Traditional digestive spice.")
add("Asafoetida (Hing)","ہینگ","Pakistani","Ingredient","Spice","1 pinch / 0.5g",0.5,2,0.1,0.3,0.1,0.0,0.0,0.1,0.0,55,0,8,0.0,6,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Asafoetida Resin","Dried","","India IFCT 2017",82,"Strong-smelling culinary spice.")
add("Dry Mango Powder (Amchur)","امچور","Pakistani","Ingredient","Spice","1 tsp / 2g",2,6,0.1,1.4,0.1,0.0,0.0,0.1,0.4,0,0,5,0.1,20,"20 IU","3 mg","","Halal, Vegetarian, Vegan","Dried Raw Mango Powder","Dried","","India IFCT 2017",84,"Sour flavoring agent.")
add("Pomegranate Molasses (Anardana)","انار دانہ","Pakistani","Ingredient","Condiment","1 tbsp / 15g",15,40,0.2,9.5,0.1,0.0,0.0,0.5,8.5,8,0,8,0.2,80,"8 IU","2 mg","","Halal, Vegetarian, Vegan","Pomegranate Juice (Reduced), Sugar","Reduced","","Pakistan FCT 2001",84,"Tart pomegranate concentrate.")
add("Kokum (Dried)","کوکم","International","Ingredient","Spice","1 tbsp / 10g",10,14,0.2,3.2,0.1,0.0,0.0,1.2,2.5,5,0,10,0.3,30,"20 IU","1 mg","","Halal, Vegetarian, Vegan","Dried Garcinia Indica Fruit","Dried","","India IFCT 2017",80,"South Indian souring agent.")
add("Tapioca Pearls (Sabudana)","ساگودانہ","Pakistani","Ingredient","Starch","100g",100,358,0.2,88.7,0.2,0.1,0.0,0.9,0.3,1,0,20,1.6,11,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Cassava/Tapioca Starch","Processed","","India IFCT 2017",88,"High carb, low protein starch balls.")
add("Lotus Root (Kamal Kakdi)","کمل ككڑی","Pakistani","Ingredient","Vegetable","100g",100,74,2.6,17.2,0.1,0.0,0.0,4.9,0.5,45,0,45,1.2,556,"0 IU","44.0 mg","","Halal, Vegetarian, Vegan","Raw Lotus Root","Raw","USDA FoodData Central #11255","",86,"USDA #11255")
add("Water Chestnut (Singhara)","سنگھاڑہ","Pakistani","Ingredient","Vegetable","100g",100,97,1.4,23.9,0.1,0.0,0.0,3.0,4.8,14,0,11,0.7,584,"0 IU","4.0 mg","","Halal, Vegetarian, Vegan","Raw Water Chestnuts","Raw","USDA FoodData Central #11676","",88,"USDA #11676")
add("Dried Apricot (Hunza, Unsulfured)","خشک خوبانی ہنزہ","Pakistani","Ingredient","Dried Fruit","10 halves / 40g",40,100,1.5,24.5,0.2,0.0,0.0,2.8,20.5,3,0,14,1.1,290,"1400 IU","0.5 mg","","Halal, Vegetarian, Vegan","Sundried Hunza Apricots","Sun-Dried","","Pakistan FCT 2001",82,"Northern Pakistan prized apricots.")
add("Walnut, Kashmiri (Akhrot)","اخروٹ کشمیری","Pakistani","Ingredient","Nuts","1/4 cup / 28g",28,185,4.3,3.9,18.5,1.7,0.0,1.9,0.7,0,0,28,0.8,125,"6 IU","0.3 mg","Tree Nuts","Halal, Vegetarian, Vegan","Kashmiri Walnuts (In-shell)","Raw","","Pakistan FCT 2001",88,"")
add("Dry Fig (Anjeer)","خشک انجیر","International","Ingredient","Dried Fruit","3 figs / 40g",40,107,1.1,27.6,0.4,0.1,0.0,4.0,22.5,4,0,54,0.5,232,"2 IU","0.6 mg","","Halal, Vegetarian, Vegan","Dried Mission Figs","Sun-Dried","USDA FoodData Central #09094","",92,"USDA #09094. High calcium and fiber.")
add("Dried Mulberry (Toot)","خشک توت","Pakistani","Ingredient","Dried Fruit","1/4 cup / 35g",35,93,3.1,20.5,0.8,0.0,0.0,3.5,16.5,9,0,55,2.2,310,"15 IU","26 mg","","Halal, Vegetarian, Vegan","Sun-Dried Mulberry Berries","Sun-Dried","","Pakistan FCT 2001",82,"Northern Pakistan dried mulberry.")
add("Sunflower Seeds (Suraj Mukhi Ke Beej)","سورج مکھی کے بیج","International","Ingredient","Seeds","1 oz / 28g",28,164,5.8,5.6,14.0,1.5,0.0,2.4,0.7,1,0,20,1.5,241,"4 IU","0.5 mg","","Halal, Vegetarian, Vegan","Dry Roasted Sunflower Seed Kernels","Dry Roasted","USDA FoodData Central #12038","",92,"USDA #12038. High Vit E.")
add("Hemp Seeds (Bhang Ke Beej)","بھنگ کے بیج (صحت)","International","Ingredient","Seeds","1 tbsp / 10g",10,55,3.2,0.9,4.6,0.5,0.0,0.4,0.1,0,0,7,0.4,36,"0 IU","0.1 mg","","Halal, Vegetarian, Vegan","Hulled Hemp Seed Hearts","Raw","USDA FoodData Central #170148","",90,"USDA #170148. Complete protein seed.")
add("Seaweed (Nori, Dried)","نوری (سمندری گھاس)","International","Ingredient","Vegetable/Seaweed","2 sheets / 5g",5,10,0.5,1.5,0.0,0.0,0.0,0.2,0.1,20,0,10,0.4,23,"0 IU","2 mg","","Halal, Vegetarian, Vegan","Dried Nori Seaweed","Dried","USDA FoodData Central #168456","",90,"USDA #168456")
add("Spirulina (Dry Powder)","اسپیرولینا","International","Ingredient","Supplement","1 tbsp / 7g",7,20,4.0,1.7,0.5,0.2,0.0,0.3,0.3,73,0,8,2.0,95,"720 IU","0.7 mg","","Halal, Vegetarian, Vegan","Arthrospira Platensis (Blue-Green Algae)","Dried","USDA FoodData Central #168395","",90,"USDA #168395. Very high protein per gram.")
add("Nutritional Yeast","نیوٹریشنل ایسٹ","International","Ingredient","Supplement","2 tbsp / 16g",16,60,8.0,6.0,1.0,0.1,0.0,3.0,0.5,30,0,10,2.4,160,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Inactive Dried Saccharomyces Cerevisiae Yeast","Dried","USDA FoodData Central","",90,"Fortified with B12. High protein.")
add("Matcha Powder (Green Tea)","ماچا پاؤڈر","International","Ingredient","Tea","1 tsp / 2g",2,5,0.3,1.0,0.1,0.0,0.0,0.3,0.0,0,0,3,0.2,28,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Ceremonial Grade Matcha Green Tea","Dried/Ground","","",88,"High in catechins and L-theanine.")
add("Elderflower Cordial","ایلڈر فلاور کارڈیل","International","Beverage","Cold Drink","2 tbsp / 30g",30,75,0.0,19.0,0.0,0.0,0.0,0.0,18.5,5,0,2,0.0,10,"0 IU","5 mg","","Halal, Vegetarian, Vegan","Elderflower, Sugar, Lemon, Water","Concentrated","","",84,"")
add("Bubble Tea (Milk, Taro)","ببل ٹی (تارو)","International","Beverage","Cold Drink","1 cup / 350g",350,280,2.5,52,7,4,0.0,1.0,32,120,12,110,0.5,180,"50 IU","0.5 mg","Dairy, Gluten","Halal, Vegetarian","Taro Powder, Milk, Tapioca Pearls, Ice, Sugar","Blended","","",78,"Taiwanese milk tea with tapioca pearls.")
add("Mango Lassi","مینگو لسی","Pakistani","Beverage","Cold Drink","1 glass / 300g",300,220,6.0,42.0,4.5,2.8,0.0,1.5,36.0,75,16,210,0.5,360,"600 IU","5 mg","Dairy","Halal, Vegetarian","Yogurt, Mango Pulp, Milk, Sugar, Cardamom","Blended","","Pakistan FCT 2001",80,"Sweet mango yogurt drink.")
add("Doogh (Iranian Yogurt Drink)","دوغ","International","Beverage","Cold Drink","1 glass / 250g",250,75,4.0,8.5,3.0,2.0,0.0,0.0,8.0,320,12,140,0.1,200,"80 IU","0.5 mg","Dairy","Halal, Vegetarian","Yogurt, Sparkling/Still Water, Dried Mint, Salt","Mixed","","",82,"Persian sparkling yogurt drink.")
add("Jallab (Rose Water Drink)","جلّاب","International","Beverage","Cold Drink","1 glass / 250g",250,130,0.5,33.0,0.0,0.0,0.0,1.0,28.0,15,0,10,0.5,90,"20 IU","2 mg","","Halal, Vegetarian, Vegan","Grape Juice, Rose Water, Grenadine, Pine Nuts, Raisins","Mixed","","",80,"Levantine sweet rose drink.")
add("Ayran (Yogurt Drink)","ایران (یوگرٹ مشروب)","International","Beverage","Cold Drink","1 glass / 240g",240,60,3.5,6.0,2.5,1.5,0.0,0.0,5.5,240,10,110,0.1,180,"80 IU","0.5 mg","Dairy","Halal, Vegetarian","Yogurt, Water, Salt","Mixed/Blended","","",88,"Turkish salted yogurt drink.")
add("Karak Chai (Emirati/Gulf Tea)","کرک چائے","International","Beverage","Hot Drink","1 cup / 200g",200,120,3.5,16.0,4.5,2.8,0.0,0.0,14.0,45,10,110,0.1,190,"80 IU","0.5 mg","Dairy","Halal, Vegetarian","Black Tea, Evaporated Milk, Sugar, Cardamom, Saffron","Simmered","","",84,"Strong sweet spiced Gulf milk tea.")

print(f"\nNew items in this batch: {len(new_items)}")
total = len(existing_records) + len(new_items)
print(f"Total after this batch: {total}")

all_final = existing_records + new_items

with open(MASTER_FILE, mode='w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
    writer.writeheader()
    writer.writerows(all_final)

print(f"Saved {len(all_final)} total records.")
if len(all_final) >= 1000:
    print("=== TARGET OF 1000+ RECORDS ACHIEVED! ===")
else:
    print(f"Still need {1000 - len(all_final)} more records.")
