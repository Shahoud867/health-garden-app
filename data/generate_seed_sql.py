import csv

def sql_escape(val):
    if val is None or val == '':
        return 'NULL'
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"

def sql_num(val):
    if val is None or val == '':
        return 'NULL'
    try:
        return f"{float(val):.2f}"
    except ValueError:
        return 'NULL'

def sql_int(val):
    if val is None or val == '':
        return 'NULL'
    try:
        return str(int(float(val)))
    except ValueError:
        return 'NULL'

csv_path = r"c:\Users\shaho\OneDrive - FAST National University\Attachments\Work\Personal\Health-Tracker\health-garden-app\data\foods_master_data.csv"
sql_path = r"c:\Users\shaho\OneDrive - FAST National University\Attachments\Work\Personal\Health-Tracker\health-garden-app\supabase\seed_foods.sql"

with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

cols = ['dish_name', 'urdu_name', 'local_name', 'cuisine', 'category', 'subcategory', 'region_variant',
        'serving_description', 'portion_unit', 'portion_grams', 'calories_kcal', 'protein_g', 'carbohydrates_g',
        'fat_g', 'saturated_fat_g', 'trans_fat_g', 'fiber_g', 'sugar_g', 'sugar_flag', 'sodium_mg',
        'cholesterol_mg', 'calcium_mg', 'iron_mg', 'potassium_mg', 'vitamin_a', 'vitamin_c', 'allergens',
        'dietary_type', 'ingredients', 'preparation_method', 'source_1', 'source_2', 'source_3',
        'confidence_score', 'verified', 'notes']

sql_lines = []
sql_lines.append("-- =============================================================================")
sql_lines.append(f"-- Seed Script: seed_foods.sql ({len(rows)} Verified Food Records)")
sql_lines.append("-- Auto-generated master seed for Supabase database")
sql_lines.append("-- =============================================================================\n")
sql_lines.append("BEGIN;\n")
sql_lines.append("TRUNCATE TABLE foods RESTART IDENTITY CASCADE;\n")

sql_lines.append(f"INSERT INTO foods ({', '.join(cols)}) VALUES")

value_rows = []
for r in rows:
    vals = [
        sql_escape(r['dish_name']),
        sql_escape(r['urdu_name']),
        sql_escape(r['local_name']),
        sql_escape(r['cuisine']),
        sql_escape(r['category']),
        sql_escape(r['subcategory']),
        sql_escape(r['region_variant']),
        sql_escape(r['serving_description']),
        sql_escape(r['portion_unit']),
        sql_num(r['portion_grams']),
        sql_int(r['calories_kcal']),
        sql_num(r['protein_g']),
        sql_num(r['carbohydrates_g']),
        sql_num(r['fat_g']),
        sql_num(r['saturated_fat_g']),
        sql_num(r['trans_fat_g']),
        sql_num(r['fiber_g']),
        sql_num(r['sugar_g']),
        sql_escape(r['sugar_flag']),
        sql_num(r['sodium_mg']),
        sql_num(r['cholesterol_mg']),
        sql_num(r['calcium_mg']),
        sql_num(r['iron_mg']),
        sql_num(r['potassium_mg']),
        sql_escape(r['vitamin_a']),
        sql_escape(r['vitamin_c']),
        sql_escape(r['allergens']),
        sql_escape(r['dietary_type']),
        sql_escape(r['ingredients']),
        sql_escape(r['preparation_method']),
        sql_escape(r['source_1']),
        sql_escape(r['source_2']),
        sql_escape(r['source_3']),
        sql_int(r['confidence_score']),
        sql_escape(r['verified']),
        sql_escape(r['notes'])
    ]
    value_rows.append("  (" + ", ".join(vals) + ")")

sql_lines.append(",\n".join(value_rows) + ";\n")
sql_lines.append("COMMIT;\n")

with open(sql_path, mode='w', encoding='utf-8') as sf:
    sf.write("\n".join(sql_lines))

print(f"supabase/seed_foods.sql generated successfully with {len(rows)} records!")
