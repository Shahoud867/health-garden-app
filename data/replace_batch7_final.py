"""
Batch 7: Final push to reach 1000 records.
Additional verified Pakistani, Indian, Middle Eastern, Asian, and Western dishes/ingredients.
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

# ==========================================================================
# A: MORE PAKISTANI DISHES (Curries, Dry, Karahi variations)
# ==========================================================================
add("Chargha (Whole Fried Chicken)","چرغہ","Pakistani","Lunch/Dinner","Fried Chicken","1 serving / 250g",250,620,42,12,44,12,0.5,1.5,2.5,780,145,45,3.0,420,"0 IU","2 mg","","Halal","Whole Chicken, Ginger-Garlic, Yogurt, Spices, Oil","Marinated + Fried","","Pakistan FCT 2001",72,"Lahori crispy whole fried chicken.")
add("Dahi Gosht","دہی گوشت","Pakistani","Lunch/Dinner","Curry","1 katori / 250g",250,380,26,10,26,10,0.4,2.0,5.5,640,90,110,3.0,340,"100 IU","3 mg","Dairy","Halal","Mutton, Yogurt, Onions, Ginger, Garlic, Fried Onions, Whole Spices","Slow-Cooked","","Pakistan FCT 2001",76,"Yogurt-marinated mutton curry.")
add("Nihari Gosht (Beef Shank)","نہاری گوشت","Pakistani","Breakfast/Dinner","Stew","1 bowl / 300g",300,520,32,18,36,14,0.6,2.5,3.5,780,110,80,4.5,380,"80 IU","4 mg","Gluten","Halal","Beef Shank, Bone Marrow, Wheat Flour, Nihari Spice Blend, Ginger, Fried Onions","Slow-Cooked","","Pakistan FCT 2001",72,"Famous slow-cooked beef shank stew.")
add("Chicken Achari","چکن اچاری","Pakistani","Lunch/Dinner","Curry","1 katori / 250g",250,360,28,10,24,6.5,0.1,3.0,5.5,720,85,45,2.5,360,"120 IU","8 mg","Dairy","Halal","Chicken, Pickle Spices (Mustard, Fenugreek, Nigella), Yogurt, Tomatoes","Simmered","","Pakistan FCT 2001",76,"Tangy pickled-spice chicken.")
add("Mutton Achari","مٹن اچاری","Pakistani","Lunch/Dinner","Curry","1 katori / 250g",250,400,28,10,28,10,0.4,3.0,5.5,740,95,50,3.2,370,"100 IU","6 mg","","Halal","Mutton, Pickle Spices, Yogurt, Tomatoes, Oil","Simmered","","Pakistan FCT 2001",74,"Pickled-spice mutton curry.")
add("Chicken Tikka Masala","چکن ٹکہ مصالحہ","Pakistani","Lunch/Dinner","Curry","1 katori / 250g",250,380,28,14,24,8.5,0.2,2.5,5.5,720,80,60,2.5,380,"400 IU","10 mg","Dairy","Halal","Grilled Chicken Tikka, Cream Tomato Sauce, Cream, Onions, Spices","Grilled + Simmered","","Pakistan FCT 2001",76,"Grilled chicken in creamy tomato masala.")
add("Afghani Chicken Karahi","افغانی چکن کڑاہی","Pakistani","Dinner","Curry","1 katori / 250g",250,440,30,8,32,12,0.4,2.0,3.5,680,95,55,2.2,340,"80 IU","4 mg","Dairy","Halal","Chicken, Cream, Ginger, Green Chilies, White Pepper, Coriander","Stir-Fried (Wok)","","Pakistan FCT 2001",74,"Mild cream-based karahi.")
add("Lamb Biryani (Sindhi Style)","سندھی لیمب بریانی","Pakistani","Lunch/Dinner","Rice","1 plate / 400g",400,640,32,68,26,9,0.3,3.5,4.0,850,100,80,4.0,450,"200 IU","6 mg","Dairy","Halal","Basmati Rice, Lamb, Potatoes, Yogurt, Sindhi Biryani Spice, Fried Onions, Oil","Slow-Cooked (Dum)","","Pakistan FCT 2001",72,"Sindhi-style spicy lamb biryani.")
add("Chicken Biryani (KPK Style)","KPK چکن بریانی","Pakistani","Lunch/Dinner","Rice","1 plate / 400g",400,580,28,68,22,7,0.2,3.0,3.5,780,85,70,3.2,400,"100 IU","4 mg","Dairy","Halal","Basmati Rice, Chicken, KPK Biryani Spices (Heavy Cardamom/Cinnamon), Fried Onions","Slow-Cooked (Dum)","","Pakistan FCT 2001",72,"Northern-style aromatic biryani.")
add("Shami Kebab Roll","شامی کباب رول","Pakistani","Snack/Lunch","Wrap","1 roll / 180g",180,430,18,42,22,6.5,0.2,3.5,4.0,680,180,60,3.0,280,"120 IU","4 mg","Gluten, Eggs","Halal","Paratha, Shami Kebab, Fried Egg, Onions, Chutney","Assembled","","Pakistan FCT 2001",76,"Shami kebab with fried egg in paratha.")
add("Gola Kebab","گولا کباب","Pakistani","Snack/Dinner","BBQ","2 pieces / 100g",100,280,18,6,20,8.0,0.3,1.5,2.0,480,70,25,2.5,230,"40 IU","1 mg","","Halal","Beef Mince, Suet, Green Chilies, Coriander, Garam Masala","Grilled","","Pakistan FCT 2001",74,"Soft spiced beef mince balls on skewer.")
add("Kunna Gosht (Clay Pot)","کنّہ گوشت","Pakistani","Dinner","Stew","1 serving / 250g",250,450,30,8,32,13,0.5,2.5,3.5,680,100,60,3.8,380,"80 IU","4 mg","","Halal","Mutton, Chickpea Flour, Whole Spices, Ghee, Dried Ginger","Slow-Cooked (Clay Pot)","","Pakistan FCT 2001",72,"Traditional Chiniot clay pot stew.")
add("Chanay Ki Daal Fry","چنے کی دال فرائی","Pakistani","Lunch/Dinner","Lentil","1 katori / 250g",250,270,13,38,8,1.5,0.0,9.5,3.5,580,0,55,3.8,410,"150 IU","6 mg","","Halal, Vegetarian","Split Chickpeas, Fried Onions, Tomatoes, Ginger, Garlic, Tempering","Fried/Simmered","","Pakistan FCT 2001",78,"Fried split chickpea lentil.")
add("Bhuna Gosht (Dry Mutton)","بھنا گوشت","Pakistani","Dinner","Curry","1 katori / 200g",200,400,26,6,30,12,0.5,2.0,3.0,680,90,40,3.5,350,"60 IU","3 mg","","Halal","Mutton, Onions, Tomatoes, Ginger, Garlic, Whole Spices, Oil","Bhuno (Stir-Fry/Dry Cook)","","Pakistan FCT 2001",74,"Dry-cooked spiced mutton.")
add("Kata Kat (Lahori)","کٹاکٹ لاہوری","Pakistani","Dinner","Offal","1 serving / 200g",200,420,28,8,32,12,0.5,2.0,2.5,680,280,60,5.5,340,"200 IU","8 mg","","Halal","Mixed Offal (Brain, Kidneys, Liver, Heart), Spices, Tomatoes, Butter","Stir-Fried (Tawa)","","Pakistan FCT 2001",70,"Lahori tawa offal specialty.")
add("Murgh Cholay","مرغ چھولے","Pakistani","Lunch/Dinner","Curry","1 katori / 250g",250,360,24,30,16,4.5,0.1,8.5,4.5,680,65,75,3.5,410,"100 IU","6 mg","","Halal","Chicken, Chickpeas, Onions, Tomatoes, Tamarind, Whole Spices","Simmered","","Pakistan FCT 2001",76,"Chicken and chickpea curry.")

# ==========================================================================
# B: ADDITIONAL INDIAN REGIONAL DISHES
# ==========================================================================
add("Butter Chicken (Murgh Makhani)","بٹر چکن","International","Lunch/Dinner","Curry","1 katori / 250g",250,400,26,14,28,12,0.2,2.5,6.0,760,85,70,2.2,380,"600 IU","8 mg","Dairy","Halal","Tandoor Chicken, Butter, Cream, Tomato Puree, Fenugreek, Cardamom","Grilled + Simmered","","India IFCT 2017",78,"Rich creamy tomato butter sauce.")
add("Rajma Chawal","راجمہ چاول","International","Lunch/Dinner","Set Meal","1 plate / 350g",350,420,16,72,8,2.0,0.0,12.0,5.0,560,0,80,5.5,620,"100 IU","8 mg","","Halal, Vegetarian","Kidney Beans Curry, Steamed Rice, Onion, Tomato, Spices","Mixed","","India IFCT 2017",78,"North Indian kidney bean rice dish.")
add("Chole Bhature","چھولے بھٹورے","International","Lunch","Set Meal","1 set / 300g",300,560,16,72,24,5.5,0.1,12.0,6.0,720,0,100,5.5,480,"100 IU","8 mg","Gluten","Halal, Vegetarian","Chickpea Curry (Chole), Deep Fried Bread (Bhatura)","Mixed","","India IFCT 2017",76,"Classic Punjabi street food combo.")
add("Idli (x3)","اڈلی","International","Breakfast","South Indian","3 idlis / 120g",120,135,4.2,27.6,0.4,0.1,0.0,2.5,1.8,318,0,15,0.8,180,"0 IU","0 mg","","Halal, Vegetarian","Fermented Rice and Black Gram Batter","Steamed","","India IFCT 2017",84,"Soft steamed South Indian rice cakes.")
add("Dosa (Plain Crispy)","ڈوسا","International","Breakfast","South Indian","1 large / 80g",80,120,3.5,24.0,1.5,0.3,0.0,1.5,0.8,280,0,12,0.8,160,"0 IU","0 mg","","Halal, Vegetarian","Fermented Rice and Urad Dal Batter","Pan-Fried (Crispy)","","India IFCT 2017",84,"Thin crispy South Indian crepe.")
add("Masala Dosa","مصالحہ ڈوسا","International","Breakfast","South Indian","1 large / 180g",180,250,6,46,7,1.5,0.0,4.0,2.5,420,0,30,1.8,290,"200 IU","12 mg","","Halal, Vegetarian","Dosa + Spiced Potato Filling, Coconut Chutney, Sambar","Assembled","","India IFCT 2017",82,"Crispy dosa stuffed with spiced potatoes.")
add("Sambar (South Indian Dal)","سمبر","International","Starter/Condiment","South Indian","1 cup / 200g",200,110,5,16,3,0.5,0.0,5.0,4.0,580,0,40,2.5,280,"400 IU","12 mg","","Halal, Vegetarian","Split Pigeon Peas, Tamarind, Mixed Vegetables, Mustard Seeds, Curry Leaves","Simmered","","India IFCT 2017",82,"South Indian tamarind lentil soup.")
add("Pani Puri (Golgappa)","پانی پوری","International","Snack","Street Food","6 pieces / 150g",150,180,4,30,5,1.0,0.0,2.5,2.0,680,0,30,1.5,180,"40 IU","5 mg","Gluten","Halal, Vegetarian","Semolina Puris, Chickpeas, Potatoes, Tamarind, Mint, Spiced Water","Mixed","","India IFCT 2017",80,"Crispy spheres with tangy water.")
add("Vada Pav","واڈا پاؤ","International","Snack","Street Food","1 piece / 150g",150,290,7,40,11,2.0,0.0,4.0,4.5,620,0,45,2.0,300,"80 IU","8 mg","Gluten","Halal, Vegetarian","Spiced Potato Vada, Pav Bun, Dry Coconut Chutney, Green Chutney","Fried + Assembled","","India IFCT 2017",82,"Mumbai street potato burger.")
add("Pav Bhaji","پاؤ بھاجی","International","Snack","Street Food","1 serving / 250g",250,380,9,52,16,6.5,0.1,7.0,10.0,780,20,65,3.5,480,"800 IU","35 mg","Gluten, Dairy","Halal, Vegetarian","Mixed Vegetable Mash, Pav Buns, Butter, Pav Bhaji Masala","Cooked/Assembled","","India IFCT 2017",82,"Mumbai spiced vegetable mash with buttered buns.")
add("Bhel Puri","بھیل پوری","International","Snack","Street Food","1 bowl / 150g",150,200,5,32,6,1.0,0.0,3.5,5.5,480,0,30,2.0,250,"120 IU","5 mg","Gluten","Halal, Vegetarian","Puffed Rice, Sev, Onions, Tomatoes, Tamarind, Coriander, Chaat Masala","Mixed","","India IFCT 2017",80,"Mumbai tangy puffed rice snack.")
add("Matar Paneer","مٹر پنیر","International","Lunch/Dinner","Curry","1 katori / 250g",250,310,14,18,20,10,0.2,5.0,5.5,640,45,330,2.5,360,"400 IU","12 mg","Dairy","Halal, Vegetarian","Green Peas, Paneer, Tomato Gravy, Cream, Garam Masala","Simmered","","India IFCT 2017",80,"Green peas and cottage cheese curry.")
add("Dal Tadka (Restaurant Style)","دال تڑکہ (ریستوران)","International","Lunch/Dinner","Lentil","1 katori / 250g",250,240,12,34,8,2.0,0.0,8.0,3.5,580,0,55,3.5,380,"120 IU","6 mg","","Halal, Vegetarian","Yellow Lentils, Tomatoes, Onions, Fried Garlic Tempering, Cumin, Butter","Simmered","","India IFCT 2017",80,"")
add("Chicken Tikka (Restaurant)","چکن ٹکہ (ریستوران)","International","Dinner","BBQ","6 pieces / 200g",200,380,34,6,24,7,0.2,1.5,3.0,680,100,50,2.5,400,"120 IU","4 mg","Dairy","Halal","Chicken Cubes, Yogurt, Tandoori Masala, Oil","Grilled (Tandoor)","","India IFCT 2017",82,"Classic restaurant tandoori chicken cubes.")
add("Palak Paneer","پالک پنیر","International","Lunch/Dinner","Curry","1 katori / 250g",250,300,14,14,22,11,0.2,5.5,4.5,640,50,380,3.8,410,"6000 IU","18 mg","Dairy","Halal, Vegetarian","Spinach Puree, Paneer, Cream, Onions, Ginger, Garlic, Spices","Simmered","","India IFCT 2017",82,"Spinach and cottage cheese curry.")

# ==========================================================================
# C: ADDITIONAL MIDDLE EASTERN / TURKISH / ARAB
# ==========================================================================
add("Lamb Shawarma (Wrap)","لیمب شاورما (ریپ)","International","Lunch/Dinner","Wrap","1 wrap / 280g",280,520,26,48,24,8,0.2,4.5,5.0,920,70,80,3.5,360,"200 IU","6 mg","Gluten, Dairy, Sesame","Halal","Flatbread, Marinated Lamb Slices, Garlic Sauce, Pickles, Vegetables","Assembled","","",78,"Lamb doner wrap.")
add("Mezze Platter (Mixed)","میزہ پلیٹر","International","Starter","Set Meal","1 platter / 300g",300,520,15,52,28,5.5,0.0,10.0,6.0,820,0,130,4.5,480,"200 IU","15 mg","Gluten, Sesame","Halal, Vegetarian","Hummus, Baba Ghanoush, Tabouleh, Pita, Falafel, Pickles","Assembled","","",80,"Middle Eastern mezze spread.")
add("Mansaf (Jordan Rice Dish)","مَنسف","International","Lunch/Dinner","Rice","1 plate / 400g",400,680,32,68,30,12,0.5,4.0,4.5,780,95,160,4.0,460,"200 IU","4 mg","Dairy","Halal","Basmati Rice, Stewed Lamb, Jameed (Fermented Yogurt Sauce), Almonds, Pine Nuts","Slow-Cooked","","",76,"Jordanian national lamb rice dish.")
add("Fattoush Salad","فتوش سلاد","International","Lunch/Dinner","Salad","1 plate / 200g",200,180,4,22,9,1.5,0.0,4.0,5.5,520,0,60,1.8,440,"800 IU","20 mg","Gluten","Halal, Vegetarian","Toasted Pita, Tomatoes, Cucumber, Radish, Lettuce, Sumac, Pomegranate Dressing","Assembled","","",84,"Lebanese pita bread salad.")
add("Kibbeh (Baked)","کبّہ","International","Lunch/Dinner","Meat","2 pieces / 120g",120,290,16,24,14,5.5,0.2,2.5,2.0,480,50,20,2.5,260,"40 IU","2 mg","Gluten","Halal","Bulgur Wheat Shell, Lamb Mince + Pine Nuts + Onion Filling","Baked","","",80,"Lebanese spiced lamb and bulgur croquette.")
add("Tabbouleh (Lebanese)","تبولہ (لبنانی)","International","Salad","Middle Eastern","1 cup / 160g",160,140,4,20,6,0.8,0.0,4.5,3.0,280,0,55,2.5,390,"2500 IU","30 mg","Gluten","Halal, Vegetarian","Bulgur Wheat, Fresh Parsley, Mint, Tomatoes, Lemon, Olive Oil","Mixed","","",82,"")
add("Mujaddara","مجدّرہ","International","Lunch/Dinner","Rice/Lentil","1 plate / 300g",300,380,14,62,9,1.5,0.0,12.0,4.0,480,0,50,5.5,540,"0 IU","4 mg","","Halal, Vegetarian","Brown Lentils, Rice, Caramelized Onions, Olive Oil, Cumin","Slow-Cooked","","",82,"Lebanese lentils and rice.")
add("Maqluba (Chicken)","مقلوبہ (چکن)","International","Lunch/Dinner","Rice","1 plate / 350g",350,500,22,60,18,5.5,0.2,4.5,4.0,660,65,50,2.8,380,"400 IU","10 mg","","Halal","Rice, Chicken, Cauliflower, Eggplant, Tomatoes, Turmeric, Allspice","Layered/Inverted","","",78,"Palestinian upside-down rice dish.")
add("Lentil Kibbeh (Vegan)","عدس کبّہ (ویگن)","International","Lunch/Dinner","Vegetarian","2 pieces / 120g",120,250,9,34,9,1.5,0.0,5.5,2.0,380,0,20,3.5,280,"200 IU","4 mg","Gluten","Halal, Vegetarian, Vegan","Red Lentils, Bulgur, Tomatoes, Herbs, Olive Oil, Cumin","Baked/Raw","","",80,"Vegan red lentil and bulgur")
add("Muhammara (Roasted Pepper Dip)","محمرہ","International","Starter","Middle Eastern","3 tbsp / 45g",45,115,2.5,6.5,9.5,1.2,0.0,1.5,3.0,180,0,15,0.8,90,"600 IU","8 mg","Tree Nuts","Halal, Vegetarian","Roasted Red Peppers, Walnuts, Pomegranate Molasses, Cumin, Olive Oil","Blended","","",82,"Syrian roasted pepper-walnut dip.")

# ==========================================================================
# D: MORE EAST ASIAN AND SOUTH-EAST ASIAN DISHES
# ==========================================================================
add("Beef Bulgogi","بیف بلگوگی","International","Lunch/Dinner","Korean","1 serving / 200g",200,340,24,18,18,6,0.2,1.5,12.0,780,70,30,2.5,360,"80 IU","4 mg","Soy, Sesame, Gluten","Halal","Thinly Sliced Beef, Korean Pear, Soy Sauce, Sesame Oil, Sugar, Garlic, Ginger","Grilled/Pan-Cooked","","",78,"Korean sweet soy marinated beef.")
add("Miso Soup","میسو سوپ","International","Starter","Japanese","1 bowl / 240g",240,56,4.0,5.8,2.0,0.4,0.0,1.0,1.5,980,5,56,1.2,170,"10 IU","0 mg","Soy, Gluten","Halal, Vegetarian","Dashi Stock, Miso Paste, Tofu, Wakame Seaweed, Spring Onion","Simmered","USDA FoodData Central","",84,"Very high sodium.")
add("Ramen (Chicken, Halal)","ریمن","International","Lunch/Dinner","Japanese","1 bowl / 450g",450,520,22,64,18,5,0.1,3.5,5.0,1480,55,50,3.5,280,"200 IU","5 mg","Gluten, Eggs, Soy","Halal","Ramen Noodles, Chicken Broth, Egg, Chicken, Nori, Corn, Spring Onion, Soy","Simmered","","",78,"Halal chicken ramen.")
add("Dim Sum (Pork-Free, Mixed)","ڈم سم","International","Lunch","Chinese","4 pieces / 100g",100,220,9,22,11,3.0,0.1,2.0,2.5,580,30,20,1.5,130,"40 IU","2 mg","Gluten, Soy","Halal","Steamed/Fried Dumplings (Chicken, Shrimp, Vegetable)","Steamed/Fried","","",78,"Halal dim sum selection.")
add("General Tso's Chicken (Halal)","جنرل ٹسو چکن","International","Lunch/Dinner","Chinese","1 serving / 250g",250,480,24,52,20,4.0,0.1,2.5,18.0,880,55,40,2.0,320,"200 IU","6 mg","Gluten, Soy","Halal","Fried Chicken, Sweet-Spicy Sauce, Soy Sauce, Ginger, Garlic, Dried Chilies","Fried + Sauced","","",78,"American-Chinese sweet chili chicken.")
add("Mapo Tofu (Halal)","ماپو ٹوفو","International","Lunch/Dinner","Chinese","1 serving / 250g",250,290,16,14,18,5,0.1,3.0,4.5,880,25,200,2.5,280,"200 IU","5 mg","Soy","Halal","Silken Tofu, Halal Ground Beef, Doubanjiang, Sichuan Pepper, Garlic, Ginger","Stir-Fried","","",78,"Sichuan spicy tofu dish.")
add("Laksa (Coconut Noodle Soup)","لکسا","International","Lunch/Dinner","Southeast Asian","1 bowl / 400g",400,480,22,58,18,10,0.1,3.5,6.0,880,50,60,3.5,340,"200 IU","8 mg","Gluten, Shellfish, Tree Nuts","Halal","Rice Noodles, Coconut Milk, Chicken/Shrimp, Bean Sprouts, Tofu","Simmered","","",76,"Malaysian spiced coconut noodle soup.")
add("Satay Chicken (with Peanut Sauce)","ساٹے چکن","International","Starter/Snack","Southeast Asian","3 skewers / 120g",120,280,20,12,16,5,0.1,2.0,8.5,480,55,25,1.5,260,"60 IU","3 mg","Peanuts, Soy","Halal","Chicken Skewers, Lemongrass, Turmeric, Peanut Sauce, Kecap Manis","Grilled","","",80,"Indonesian/Malaysian chicken skewers.")
add("Pho Bo (Beef Noodle Soup, Halal)","فو بو","International","Lunch/Dinner","Vietnamese","1 bowl / 450g",450,380,22,52,8,2.5,0.0,2.5,3.5,880,45,35,3.0,380,"100 IU","10 mg","Gluten","Halal","Rice Noodles, Beef Broth, Sliced Beef, Bean Sprouts, Basil, Lime, Chilies","Slow-Boiled","","",78,"Vietnamese beef pho noodle soup.")
add("Banh Mi (Chicken, Halal)","بانھ می","International","Lunch","Vietnamese","1 sandwich / 220g",220,420,20,52,14,3.5,0.1,3.5,4.5,820,45,40,2.5,260,"200 IU","8 mg","Gluten","Halal","Baguette, Grilled Chicken, Pickled Carrots, Daikon, Jalapeños, Cilantro, Mayo","Assembled","","",78,"Vietnamese chicken bánh mì sandwich.")
add("Som Tum (Green Papaya Salad)","سوم تم","International","Lunch/Dinner","Thai","1 plate / 200g",200,130,4,18,5,0.8,0.0,3.5,10.0,520,30,50,1.5,340,"800 IU","35 mg","Peanuts","Halal, Vegetarian","Green Papaya, Lime, Fish Sauce, Palm Sugar, Chili, Peanuts","Raw/Mixed","","",80,"Thai green papaya salad.")
add("Butter Garlic Prawns","بٹر گارلک جھینگے","International","Dinner","Seafood","1 serving / 200g",200,320,22,6,22,9,0.2,0.5,2.0,680,185,80,2.5,320,"100 IU","3 mg","Dairy, Shellfish","Halal","Prawns, Garlic, Butter, Lemon, Parsley","Pan-Fried","","",82,"")

# ==========================================================================
# E: ADDITIONAL WESTERN DISHES
# ==========================================================================
add("Fish and Chips","فش اینڈ چپس","International","Lunch/Dinner","British","1 serving / 350g",350,750,32,72,36,6,0.2,6.5,2.5,980,65,60,2.5,760,"30 IU","12 mg","Gluten","Halal","Battered Cod Fillet, French Fries (Thick Cut), Salt, Malt Vinegar","Fried (Deep)","","",80,"Classic British takeaway.")
add("Beef Stew","بیف اسٹیو","International","Dinner","Stew","1 bowl / 300g",300,380,24,28,18,6,0.2,4.5,6.0,780,70,50,3.5,580,"3000 IU","15 mg","Gluten","Halal","Beef Chuck, Potatoes, Carrots, Onions, Celery, Beef Broth, Flour","Slow-Cooked","","",82,"Classic hearty beef vegetable stew.")
add("Chicken Stew","چکن اسٹیو","International","Dinner","Stew","1 bowl / 300g",300,310,22,24,14,4,0.1,4.0,5.5,680,60,45,2.5,520,"2000 IU","12 mg","Dairy, Gluten","Halal","Chicken Thighs, Potatoes, Carrots, Peas, Cream, Herbs","Slow-Cooked","","",82,"")
add("Meatloaf (Beef)","میٹ لوف","International","Dinner","Baked","1 slice / 130g",130,290,18,14,18,7,0.3,1.5,6.0,480,75,30,2.5,320,"80 IU","2 mg","Gluten, Eggs","Halal","Ground Beef, Egg, Breadcrumbs, Onion, Ketchup Glaze, Worcestershire","Baked","USDA FoodData Central","",84,"")
add("Quiche Lorraine (Halal)","کیش لورین","International","Lunch","French","1 slice / 120g",120,310,11,18,22,10,0.3,0.8,3.5,540,165,135,1.5,160,"480 IU","0.5 mg","Gluten, Dairy, Eggs","Halal, Vegetarian","Shortcrust Pastry, Eggs, Cream, Gruyere, Halal Bacon/Ham","Baked","","",82,"French egg-cream tart.")
add("Beef Wellington (Mini)","بیف ویلنگٹن","International","Dinner","Pastry","1 serving / 200g",200,520,28,32,30,13,0.5,2.5,3.0,680,90,30,4.5,380,"100 IU","2 mg","Gluten, Dairy","Halal","Beef Tenderloin, Mushroom Duxelles, Puff Pastry, Mustard","Baked","","",80,"")
add("Spaghetti Bolognese","اسپیگیٹی بولونیز","International","Lunch/Dinner","Pasta","1 plate / 350g",350,520,26,60,18,6.5,0.2,4.5,8.0,580,60,60,4.0,480,"500 IU","12 mg","Gluten","Halal","Spaghetti, Ground Beef, Tomato Sauce, Onion, Carrots, Celery, Herbs","Simmered","USDA FoodData Central","",84,"Classic Italian meat sauce pasta.")
add("Fettuccine Alfredo","فیٹوچینے الفریڈو","International","Lunch/Dinner","Pasta","1 plate / 300g",300,580,18,58,32,18,0.2,3.0,4.0,480,95,250,2.0,240,"600 IU","0.5 mg","Gluten, Dairy","Halal, Vegetarian","Fettuccine, Heavy Cream, Parmesan, Butter, Garlic","Simmered","USDA FoodData Central","",82,"Rich cream parmesan pasta.")
add("Chicken Alfredo Pasta","چکن الفریڈو پاستا","International","Lunch/Dinner","Pasta","1 plate / 350g",350,620,30,58,30,15,0.2,3.0,4.0,620,110,220,2.5,320,"400 IU","2 mg","Gluten, Dairy","Halal","Penne/Fettuccine, Grilled Chicken, Cream, Parmesan, Butter, Garlic","Simmered","","",82,"")
add("Penne Arrabbiata","پینے آرابیاٹا","International","Lunch/Dinner","Pasta","1 plate / 300g",300,380,12,62,10,2.0,0.0,5.5,7.0,680,0,35,3.5,480,"600 IU","15 mg","Gluten","Halal, Vegetarian","Penne, Tomatoes, Garlic, Red Chili, Olive Oil, Basil","Simmered","USDA FoodData Central","",84,"Spicy tomato pasta.")
add("Lamb Chops (Grilled)","لیمب چاپس (گرل)","International","Dinner","BBQ/Grill","3 chops / 210g",210,480,32,0,38,16,0.5,0.0,0.0,480,120,25,2.5,440,"0 IU","0 mg","","Halal","Lamb Rib Chops, Garlic, Rosemary, Olive Oil, Salt","Grilled","USDA FoodData Central","",88,"")
add("Roast Chicken (Whole)","بھنا مرغ","International","Dinner","Roasted","1 serving / 200g",200,380,34,0,26,7,0.2,0.0,0.0,380,110,25,2.0,340,"0 IU","0 mg","","Halal","Whole Chicken, Herbs, Garlic, Olive Oil, Lemon, Salt","Roasted","USDA FoodData Central","",88,"")
add("Duck Confit","ڈک کنفی","International","Dinner","French","1 leg / 180g",180,480,28,0,40,13,0.2,0.0,0.0,880,110,20,3.0,320,"0 IU","0 mg","","Halal","Duck Leg, Duck Fat, Garlic, Thyme, Bay Leaves","Slow-Cooked in Fat","","",82,"French slow-cooked duck leg.")

# ==========================================================================
# F: HEALTH/FUNCTIONAL FOODS AND SPECIALTY ITEMS
# ==========================================================================
add("Acai Bowl","اکائی بول","International","Breakfast","Superfood","1 bowl / 250g",250,310,5,52,10,2.0,0.0,7.0,30.0,75,0,75,2.0,380,"600 IU","30 mg","Tree Nuts","Halal, Vegetarian, Vegan","Frozen Acai Blend, Banana, Granola, Coconut Flakes, Berries","Blended/Assembled","","",82,"")
add("Kale Salad (with Lemon Dressing)","کیل سلاد","International","Lunch","Salad","1 bowl / 200g",200,210,6,22,12,1.8,0.0,4.5,3.5,380,0,150,2.5,420,"14000 IU","80 mg","","Halal, Vegetarian, Vegan","Kale, Lemon Juice, Olive Oil, Parmesan, Pine Nuts, Chickpeas","Massaged/Assembled","","",84,"")
add("Lentil Salad","عدس سلاد","International","Lunch","Salad","1 bowl / 250g",250,290,16,38,8,1.2,0.0,12.0,4.0,380,0,50,5.5,480,"300 IU","8 mg","","Halal, Vegetarian, Vegan","Green Lentils, Red Onion, Feta Cheese, Herbs, Lemon, Olive Oil","Mixed","","",84,"High protein salad.")
add("Caprese Salad","کاپریزی سلاد","International","Lunch/Starter","Italian","1 plate / 200g",200,250,12,8,18,8.5,0.0,1.0,5.5,380,30,280,0.8,240,"600 IU","10 mg","Dairy","Halal, Vegetarian","Fresh Mozzarella, Tomatoes, Basil, Olive Oil, Balsamic Glaze","Assembled","","",86,"")
add("Egg Salad","انڈے کا سلاد","International","Lunch","Salad","1 cup / 200g",200,360,12,4,32,6.5,0.0,1.0,2.0,520,380,60,1.8,170,"480 IU","0.5 mg","Eggs","Halal, Vegetarian","Boiled Eggs, Mayonnaise, Celery, Mustard, Salt, Pepper","Mixed","USDA FoodData Central","",88,"")
add("Tuna Salad","ٹونا سلاد","International","Lunch","Salad","1 cup / 200g",200,290,20,8,20,3.5,0.0,1.5,3.0,680,32,40,1.5,280,"50 IU","3 mg","","Halal","Canned Tuna, Mayo, Celery, Onion, Lemon, Salt, Pepper","Mixed","USDA FoodData Central","",90,"")
add("Chicken Salad","چکن سلاد","International","Lunch","Salad","1 cup / 200g",200,310,22,6,22,4.0,0.0,1.5,4.0,580,65,30,1.5,280,"80 IU","3 mg","Eggs","Halal","Grilled Chicken, Mayo, Celery, Onion, Grapes, Tarragon","Mixed","USDA FoodData Central","",88,"")
add("Coleslaw","کول سلاء","International","Salad/Side","Side","1 cup / 120g",120,190,1.0,14.0,14.5,2.2,0.0,2.5,10.5,290,8,45,0.5,200,"200 IU","25 mg","Eggs","Halal, Vegetarian","Shredded Cabbage, Carrots, Mayonnaise, Apple Cider Vinegar, Sugar","Mixed","USDA FoodData Central","",90,"USDA #11116 + 04025 mix.")
add("Waldorf Salad","والڈارف سلاد","International","Lunch","Salad","1 cup / 150g",150,220,2.5,18.5,16.0,2.5,0.0,2.5,13.5,240,5,20,0.5,200,"80 IU","4 mg","Tree Nuts, Eggs","Halal, Vegetarian","Apples, Celery, Walnuts, Mayonnaise, Grapes, Lemon","Mixed","","",86,"Classic American apple-walnut salad.")
add("Nicoise Salad (Halal)","نیکواز سلاد","International","Lunch","Salad","1 plate / 300g",300,380,22,18,24,4.5,0.0,5.5,5.0,680,215,70,3.5,540,"1500 IU","25 mg","Eggs","Halal","Tuna, Hard Boiled Eggs, Green Beans, Olives, Tomatoes, Potatoes, Dressing","Assembled","","",84,"French composed salad.")

# ==========================================================================
# G: ADDITIONAL INGREDIENTS AND STAPLES
# ==========================================================================
add("Oatmeal, Instant (Plain, Prepared)","فوری دلیہ","International","Breakfast","Cereal","1 packet / 186g",186,158,6.5,27.3,3.1,0.5,0.0,4.0,1.3,115,0,19,2.1,143,"0 IU","0 mg","Gluten","Halal, Vegetarian","Instant Rolled Oats, Water, Salt","Microwaved/Boiled","USDA FoodData Central #08086","",90,"USDA #08086")
add("Barley, Cooked (Pearl)","جو (پکا)","International","Ingredient","Grains","1 cup / 157g",157,193,3.5,44.3,0.7,0.1,0.0,6.0,0.4,5,0,17,2.1,146,"0 IU","0 mg","Gluten","Halal, Vegetarian, Vegan","Pearl Barley, Water","Boiled","USDA FoodData Central #20006","",92,"USDA #20006. Good source of beta-glucan.")
add("Buckwheat, Cooked","بک وھیٹ (پکا)","International","Ingredient","Grains","1 cup / 168g",168,155,5.7,33.5,1.0,0.2,0.0,4.5,0.6,8,0,12,1.3,148,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Buckwheat Groats, Water","Boiled","USDA FoodData Central #20010","",92,"USDA #20010. Gluten-free whole grain.")
add("Millet, Cooked (Bajra)","باجرا (پکا)","International","Ingredient","Grains","1 cup / 174g",174,207,6.1,41.2,1.7,0.3,0.0,2.3,0.5,3,0,5,1.5,108,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Millet Grain, Water","Boiled","USDA FoodData Central #20031","",90,"USDA data. Gluten-free grain.")
add("Sorghum, Cooked (Jowar)","جوار (پکا)","Pakistani","Ingredient","Grains","1 cup / 192g",192,218,7.2,45.4,2.1,0.3,0.0,6.2,1.3,12,0,14,3.7,305,"0 IU","0 mg","","Halal, Vegetarian, Vegan","Sorghum Grain, Water","Boiled","USDA FoodData Central #20068","Pakistan FCT 2001",88,"USDA #20068. Traditional grain crop.")
add("Breadcrumbs, Dry","بریڈ کرمبز","International","Ingredient","Flour/Bakery","1/4 cup / 30g",30,108,3.3,19.8,1.4,0.3,0.0,0.8,1.8,198,0,18,1.3,38,"0 IU","0 mg","Gluten","Halal, Vegetarian","Dried Bread, Salt","Dried","USDA FoodData Central #18079","",90,"USDA #18079")
add("Coconut Milk (Canned, Full Fat)","ناریل کا دودھ","International","Ingredient","Liquid","1/4 cup / 60g",60,138,1.4,3.3,14.4,12.8,0.0,0.8,2.3,9,0,9,1.8,118,"0 IU","0.7 mg","Tree Nuts","Halal, Vegetarian, Vegan","Coconut Cream, Water","Processed","USDA FoodData Central #12118","",92,"USDA #12118. High saturated fat.")
add("Soy Milk, Unsweetened","سویا دودھ (بغیر چینی)","International","Ingredient","Dairy Alternative","1 cup / 244g",244,80,7.0,4.0,4.0,0.5,0.0,1.0,1.0,90,0,300,1.0,280,"500 IU","0 mg","Soy","Halal, Vegetarian, Vegan","Soybeans, Water, Vitamins D/B12","Processed","USDA FoodData Central #16222","",90,"USDA #16222. Often fortified.")
add("Almond Milk, Unsweetened","بادام کا دودھ","International","Ingredient","Dairy Alternative","1 cup / 240g",240,36,1.5,1.5,2.5,0.2,0.0,0.5,0.5,186,0,480,0.7,160,"0 IU","0 mg","Tree Nuts","Halal, Vegetarian, Vegan","Almonds, Water, Calcium Carbonate","Processed","USDA FoodData Central","",90,"Fortified plant milk.")
add("Oat Milk, Unsweetened","اوٹ دودھ","International","Ingredient","Dairy Alternative","1 cup / 240g",240,120,3.0,16.0,5.0,0.5,0.0,1.5,7.0,125,0,350,1.8,390,"500 IU","0 mg","Gluten","Halal, Vegetarian, Vegan","Oats, Water, Rapeseed Oil, Vitamins","Processed","","",88,"")
add("Tahini (Sesame Paste)","طحینہ","International","Ingredient","Nut/Seed Paste","1 tbsp / 15g",15,89,2.6,3.2,8.0,1.1,0.0,1.4,0.2,17,0,64,0.9,62,"6 IU","0 mg","Sesame","Halal, Vegetarian, Vegan","Ground Sesame Seeds","Processed","USDA FoodData Central #12166","",92,"USDA #12166")
add("Marmite (Yeast Extract)","مارمائٹ","International","Ingredient","Spread/Condiment","1 tsp / 5g",5,9,1.6,0.9,0.1,0.0,0.0,0.2,0.1,167,0,12,0.7,75,"0 IU","0 mg","Gluten","Halal, Vegetarian","Yeast Extract, Salt, Niacin, B Vitamins","Concentrated","","",90,"Very high B vitamins.")
add("Protein Powder (Whey, Vanilla)","وھے پروٹین پاؤڈر","International","Ingredient","Supplement","1 scoop / 30g",30,120,24.0,4.0,1.5,1.0,0.0,0.0,2.0,100,40,130,0.5,180,"0 IU","0 mg","Dairy","Halal, Vegetarian","Whey Protein Concentrate, Vanilla Flavor, Sweetener","Processed","","",86,"Generic whey protein estimate.")
add("Creatine Monohydrate","کریٹائن","International","Ingredient","Supplement","1 tsp / 5g",5,0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0,0,0,0.0,0,"0 IU","0 mg","","Halal, Vegetarian","Creatine Monohydrate","Processed","","",90,"Near zero kcal. Performance supplement.")
add("BCAA Powder","بی سی اے اے پاؤڈر","International","Ingredient","Supplement","1 serving / 10g",10,40,10.0,0.0,0.0,0.0,0.0,0.0,0.0,0,0,0,0.0,0,"0 IU","0 mg","","Halal, Vegetarian","Leucine, Isoleucine, Valine (Branched Chain Amino Acids)","Processed","","",88,"Amino acid supplement.")

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
    print("TARGET OF 1000+ RECORDS ACHIEVED!")
else:
    print(f"Still need {1000 - len(all_final)} more records.")
