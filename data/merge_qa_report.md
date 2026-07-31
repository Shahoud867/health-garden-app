# Merge QA report

foods_clean.csv: 1302 rows

recipes_clean.csv: 619 rows

Excluded entirely: health  kagglwe/ folder (synthetic/fabricated data -- see prior analysis: randomly assigned ingredients/macros not tied to the actual dish)

---


## foods_master_data.csv

- 1001 rows carried over as-is (home-cooked dishes + raw ingredients)
- 207/210 previously-unsourced rows cross-validated (macro-consistency + category-peer comparison, 5 individually spot-checked against published nutrition sources) and restored to verified='Y' with a method note in source_1.
- 3 unsourced rows still failed the cross-check and remain verified='N': Jello (Gelatin Dessert) (70.0kcal/100g vs category median 269.2); Sorbet, Lemon (100.0kcal/100g vs category median 269.2); Mezze Platter (Mixed) (173.3kcal/100g vs category median 72.0)

## pakistan_packaged_foods_usable.csv

- 74/76 rows kept, all normalized to a per-100g basis

## pakistan_packaged_foods_usable.csv -- corrected

- Noms Popchips: fat=0g per 100g on a chip product is implausible (even baked/popped chips carry some fat); label calories (520, normal for the category) kept, fat nulled instead of guessed
- Lay's Sour Cream & Onion: 15g carbs & 10g fat per 100g is far too low for potato chips (real ~50g carbs, ~35g fat); label calories (571, normal for chips) kept, incomplete macros nulled
- Lay's wavy Texas BBQ Flavored Potato Chips: fat=0g per 100g on fried potato chips is implausible (real ~30-35g); label calories (545, normal for chips) kept, fat nulled instead of guessed
- Tsdt Tesco Everyday Value Spaghetti In Tomato Sauce 410G: label calories=8.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 20.0 from macros
- Milk pack: source calories_100g=2000.0 implausible; recomputed to 62.3 from macros
- Cheetos Puffs: 16g carbs & 7g fat per 100g is too low for a puffed cheese snack (real ~55g carbs, ~32g fat); label calories (517, normal for the category) kept, incomplete macros nulled

## pakistan_packaged_foods_usable.csv -- excluded

- Robinsons Mini Orange: calories=0.9kcal/100g with all macros 0 -- source row unusable
- Knorr choto chatpata noddles: 166kcal label vs 290kcal-from-macros -- can't tell if this is a dry or as-prepared basis

## openfoodfacts pull (new)

- 998 products fetched (countries_tags_en=Pakistan, 10 pages -- deep pagination past page 10 was blocked by OFF's rate limiter/WAF; 998/1638 total Pakistan-tagged products retrieved)
- 704 skipped: no product_name or no nutrition data (barcode-only stub entries, common in OFF)
- 41 skipped: barcode already covered by the existing 76-row file
- 237 new products kept, normalized to per-100g basis

## openfoodfacts pull (new) -- corrected

- Olper's Full Cream Milk: label said 267kcal/100ml for full cream milk (real ~60-65); macros (63.9 calc) matched real milk -- corrected
- National Chilli Garlic Sauce: label said 420kcal/100g for a near-fat-free (0.3g) sauce; macros imply 108, consistent with a sugar/chilli based sauce -- corrected
- Benz Mango Fruit Drink 250 ML: protein=29.33g per 100ml is implausible for a fruit drink (protein-shake level); label calories (33, normal for a juice drink) kept, bad protein nulled
- Lay's Lays Chips Barbecue Wavy: label calories=30.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 345.6 from macros
- Refresh Mango: label calories=41.108986 is less than a single macro's own energy content (mathematically impossible); recomputed to 130.8 from macros
- Gold blend: label calories=1.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 2.0 from macros
- Dayfresh Flavored Milk (Chocolate): protein=20g & carbs=45g per 100ml is implausible for flavored milk (real ~3-4g protein); label calories (80, normal for chocolate milk) kept, bad macros nulled
- Big Bird Chicken Gola Kabab: label calories=0.166666666666667 is less than a single macro's own energy content (mathematically impossible); recomputed to 159.2 from macros
- Big Bird Classic Burger Patties: label calories=0.216666666666667 is less than a single macro's own energy content (mathematically impossible); recomputed to 203.3 from macros
- Big Bird Cheesy Chicken Croquettes: label calories=0.221212121212121 is less than a single macro's own energy content (mathematically impossible); recomputed to 192.4 from macros
- Big Bird Magic Chicken Nuggers: label calories=0.182051282051282 is less than a single macro's own energy content (mathematically impossible); recomputed to 178.2 from macros
- Big Bird Juicy chicken Tenders: label calories=0.185185185185185 is less than a single macro's own energy content (mathematically impossible); recomputed to 170.4 from macros
- Big Bird Chicken Kofta: label calories=0.160714285714286 is less than a single macro's own energy content (mathematically impossible); recomputed to 209.5 from macros
- Big Bird Vegetable Samosa: label calories=0.197222222222222 is less than a single macro's own energy content (mathematically impossible); recomputed to 200.1 from macros
- Big Bird Chicken Chips: label calories=0.145 is less than a single macro's own energy content (mathematically impossible); recomputed to 139.0 from macros
- Big Bird Oriental Chicken Pops: label calories=0.184615384615385 is less than a single macro's own energy content (mathematically impossible); recomputed to 167.7 from macros
- dawn foods Chicken Crispy Fillet: source calories_100g=995.652173913043 implausible; recomputed to 203.5 from macros
- dawn foods chicken shots: label calories=159.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 341.0 from macros
- Wrigley's Extra White Bubblemint Sugarfree Chewing Gum Bottle: label calories=146.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 243.2 from macros
- Mehran Chilli Sauce: label calories=24.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 32.0 from macros
- Mari Biscuit: label calories=74.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 452.0 from macros
- Lay's Lays chip Classic: label calories=10.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 525.0 from macros
- now: label calories=213.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 507.6 from macros
- KISAN: label calories=3.6 is less than a single macro's own energy content (mathematically impossible); recomputed to 370.0 from macros
- Bigg lychee: label calories=3.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 52.8 from macros
- Gluco: label calories=72.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 488.0 from macros
- Nando's Nando’s peri-peri hot sauce: label calories=43.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 94.0 from macros
- GINGER ALE: label calories=32.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 36.0 from macros
- Cadbury Dairy milk: label calories=22.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 521.0 from macros
- Peanut pik: label calories=61.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 266.7 from macros
- swad chat patta: label calories=35.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 40.0 from macros
- Pink Strawberry Lemonade 7up: label calories=43.0 is less than a single macro's own energy content (mathematically impossible); recomputed to 251.8 from macros
- Fruiticana Guava Fruit Drink: label calories=52.43 is less than a single macro's own energy content (mathematically impossible); recomputed to 58.5 from macros
- 7up Strawberry Lemonade: label calories=10.253 is less than a single macro's own energy content (mathematically impossible); recomputed to 44.8 from macros

## openfoodfacts pull (new) -- excluded

- Gourmet Cola: calories=100.0kcal/100g vs 41.2kcal from macros (>40% mismatch) -- can't determine which field is wrong
- uni lever dalda: calories=0.0kcal/100g with all macros 0 -- source row unusable
- Murre brewery bigglychee: 5kcal vs 34kcal-from-macros mismatch on an unidentifiable product name -- can't tell which field is wrong
- Nature home brand: macros sum to 176.7g per 100g of product -- physically impossible, and the product itself can't be identified from the name
- Choco Bliss by Young's Crave: calories=510.0kcal/100g vs 220.0kcal from macros (>40% mismatch) -- can't determine which field is wrong
- dawn foods Vegetable Samosa: macros sum to only 1.8g per 100g -- far too little mass for a fried pastry (real samosas are ~15g protein/40g carb/15g fat per 100g); neither field is trustworthy
- shan shoop: 400kcal label vs 95kcal-from-macros on an unclear product (dry mix vs prepared basis can't be determined)
- Grenade carb killa bites: calories=149.0kcal/100g vs 350.0kcal from macros (>40% mismatch) -- can't determine which field is wrong
- Mango: 98kcal label vs 312kcal-from-macros -- can't tell if this is fresh or dried mango, which have very different real values
- National Chaat Masala: calories=533.33333333333kcal/100g vs 133.3kcal from macros (>40% mismatch) -- can't determine which field is wrong
- National fish recipe mix: calories=795.0kcal/100g vs 176.0kcal from macros (>40% mismatch) -- can't determine which field is wrong
- Milk Pak: calories=63.0kcal/100g vs 35.8kcal from macros (>40% mismatch) -- can't determine which field is wrong
- chilli garlic sauce: calories=133.0kcal/100g vs 213.2kcal from macros (>40% mismatch) -- can't determine which field is wrong
- LU Nankhatai: macros sum to 102.9g per 100g -- physically impossible
- Fff: calories=555.0kcal/100g with all macros 0 -- source row unusable
- Tapal Family mixture: calories=0.0kcal/100g with all macros 0 -- source row unusable

## foods (combined)

- 10 exact duplicate (dish_name, portion_unit) pairs removed

## recipes.csv + nutrition_results.csv

- 619 recipes carried over, 0 removed
- 53 recipes had a blank 'servings' field in the source (breaks the scraper's per-serving math). All 53 had usable ingredients + a real total-calorie figure, so none were removed -- instead, a serving count was estimated from the dish type (see SERVINGS_BUCKETS) and per-serving macros recomputed from the (unaffected) total. Each gets a note appended to its description flagging the estimate for manual verification. Detail: Turkish Coffee (With Ibrik and Saucepan Instructions) -> 2 servings (cups of a hot drink), 6 kcal/serving; Pakistani Chinese Beef Chilli Dry -> 6 servings (main course, family-size), 215 kcal/serving; Walnut Crumb Cake -> 10 servings (whole cake/pie, sliced), 350 kcal/serving; Kid Friendly Instant Pot Pulled Beef for EVERYTHING -> 6 servings (no keyword match, generic main-dish default), 207 kcal/serving; 15 Minute Shrimp and Coconut Curry -> 6 servings (main course, family-size), 49 kcal/serving; A Crunchier Lahori Fried Fish -> 6 servings (main course, family-size), 194 kcal/serving; Pineapple Upside Down Cake -> 10 servings (whole cake/pie, sliced), 247 kcal/serving; Kurkuri Bhindi - 3-Ingredient Crunchy Okra -> 4 servings (side dish/snack), 5 kcal/serving; Spicy Whole Roasted Cauliflower -> 4 servings (side dish/snack), 95 kcal/serving; Aaloo Gajar ki Sabzi - Spicy Potatoes & Carrots -> 4 servings (side dish/snack), 71 kcal/serving; Pakistani Soya Aloo ki Sabzi -> 4 servings (side dish/snack), 88 kcal/serving; Maple Pecan Cake -> 10 servings (whole cake/pie, sliced), 287 kcal/serving; Box Patties with Chicken and White Sauce -> 6 servings (main course, family-size), 328 kcal/serving; Bhindi ki Sabzi -> 4 servings (side dish/snack), 47 kcal/serving; Pakora Mix & How to Make Pakoras -> 6 servings (main course, family-size), 332 kcal/serving; Donna Hays Chocolate Meringue Cake -> 10 servings (whole cake/pie, sliced), 473 kcal/serving; Kharay Masalay ka Gosht -> 6 servings (main course, family-size), 247 kcal/serving; No Churn Caramel Crunch Ice Cream -> 6 servings (churn batch), 465 kcal/serving; No Churn Coffee Toffee Ice Cream -> 6 servings (churn batch), 354 kcal/serving; Vegetable Noodle Spring Rolls -> 6 servings (main course, family-size), 565 kcal/serving; Chawal ki Kheer - Pakistani Rice Pudding -> 6 servings (dessert/snack bowls), 217 kcal/serving; Chicken Karahi Qeema -> 6 servings (main course, family-size), 183 kcal/serving; Cream Cheese Cucumber Rounds -> 6 servings (no keyword match, generic main-dish default), 165 kcal/serving; Garlicky Spinach and Potato Croquettes -> 6 servings (main course, family-size), 278 kcal/serving; Desi Roast Turkey with Lahori Chargha Masala and Green Chutney -> 12 servings (whole roast, gathering-size), 864 kcal/serving; No Tomato Highway Chicken Karhai -> 6 servings (no keyword match, generic main-dish default), 187 kcal/serving; Tandoori Oven Roasted Brussel Sprouts -> 6 servings (main course, family-size), 41 kcal/serving; Shallots with Coconut and Tamarind -> 4 servings (side dish/snack), 174 kcal/serving; Spicy Chicken Enchiladas with Our Favourite Enchilada Sauce -> 6 servings (main course, family-size), 564 kcal/serving; Instant Pot Tandoori Roast Chicken -> 6 servings (main course, family-size), 102 kcal/serving; Prairie Girl Classic Vanilla Bean Buttercream -> 18 servings (cake-frosting component, tbsp-size use), 331 kcal/serving; Sweet and Spicy Roasted Cashews w Ginger and Honey -> 4 servings (side dish/snack), 470 kcal/serving; Ghar ki Maash ki Daal or Daal Mash -> 4 servings (side dish/snack), 159 kcal/serving; Sweet and Salty Peanut Butter Cookies -> 16 servings (batch of individual pieces), 242 kcal/serving; Ferrero Rocher Brownies -> 16 servings (batch of individual pieces), 401 kcal/serving; Peanut Butter Blondies -> 16 servings (batch of individual pieces), 335 kcal/serving; Turkey Sandwiches Three Ways -> 12 servings (whole roast, gathering-size), 164 kcal/serving; Soft Dahi Baray -> 16 servings (batch of individual pieces), 11 kcal/serving; Nihari -> 6 servings (main course, family-size), 763 kcal/serving; No Oil Lemon Pickle - Khattay Leemoo -> 20 servings (condiment, tbsp-size servings), 3 kcal/serving; Soft Dahi Baray -> 16 servings (batch of individual pieces), 11 kcal/serving; Thai Red Curry Beef w Mae Ploy -> 6 servings (main course, family-size), 219 kcal/serving; Pakistani Chicken Kababs - Pan Fried -> 6 servings (main course, family-size), 193 kcal/serving; Pakora Mix & How to Make Pakoras -> 6 servings (main course, family-size), 332 kcal/serving; Quick Strawberry Nutella Hand Pies -> 4 servings (batch of mini hand pies), 21 kcal/serving; Best Basic No Bake Oreo Cheesecake -> 10 servings (whole cake/pie, sliced), 347 kcal/serving; Phitti Hui Coffee - a Pakistani Latte -> 2 servings (cups of a hot drink), 155 kcal/serving; Chicken and Cheese Casserole -> 6 servings (main course, family-size), 398 kcal/serving; Apple Puff Pastry Tart -> 10 servings (whole cake/pie, sliced), 46 kcal/serving; Dum ka Keema -> 6 servings (main course, family-size), 512 kcal/serving; Yakhni Pulao Recipe (Beef/Mutton) -> 6 servings (main course, family-size), 614 kcal/serving; Pakistani Punjabi Biryani -> 6 servings (main course, family-size), 588 kcal/serving; Kid Friendly Chicken Pulao / Chicken Pilaf -> 6 servings (main course, family-size), 502 kcal/serving
- 25 recipes kept with calories_per_serving > 1200 (plausible for ghee/oil/meat-rich dishes like korma, biryani, haleem with correct serving counts -- flagged for a spot-check, not excluded): Pakistani Lamb Pulao (1261 kcal, servings=4); Aghani Kabuli Pulao (Easy Recipe) (1212 kcal, servings=5); Karela Gosht (1280 kcal, servings=3); Plum Chutney - Aloo Bukhara Ki Chatni (1308 kcal, servings=1 large jar); Homemade Peri Peri Chicken Recipe (with Sauce) (2022 kcal, servings=4 servings); Easier Slow Cooker Haleem (Pakistani Beef and Lentil Stew) – Gluten-Free (1205 kcal, servings=4 servings); Bone-in Chicken Thigh Recipe (Stovetop) (1860 kcal, servings=4); Pakistani Chicken Pulao (Yakhni Pulao) (1593 kcal, servings=4 servings); Palak Chicken (Chicken Saag) (1297 kcal, servings=4); Authentic Chicken Curry (Easy Chicken Salan) (1366 kcal, servings=6 servings); The BEST Authentic Chicken Korma (1513 kcal, servings=6 servings); 30+ Indian & Pakistani Dinner Recipes, Including Authentic Chicken Curry (1272 kcal, servings=6 servings); 10+ Winter Recipes (Indian & Pakistani), Including Chicken Korma (1492 kcal, servings=6 servings); 15+ Pakistani and Indian Chicken Recipes, including this simple Bone-in Chicken Chicken Thighs (Stovetop) (1860 kcal, servings=4); Charsi Chicken Karahi (1213 kcal, servings=4 servings); Haleem (2638 kcal, servings=4 servings); Nihari (1427 kcal, servings=4 servings); Gajarbhat (1344 kcal, servings=4 servings); Biryani (1253 kcal, servings=8 servings); Sheer Khurma (1422 kcal, servings=1 servings); Zarda (2053 kcal, servings=4 servings); Sindhi Biryani (1615 kcal, servings=5 servings); Bhindi Gosht (2163 kcal, servings=6 servings); Badami Korma (1659 kcal, servings=4 servings); Naan (1328 kcal, servings=4 servings)
