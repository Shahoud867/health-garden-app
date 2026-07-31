import urllib.request
import re
import csv
import os
import time

CHEF_URLS = [
    ("Shireen Anwar", "https://masala.tv/category/chef/shireen-anwar/"),
    ("Zubaida Tariq", "https://masala.tv/category/chef/zubaida-tariq/"),
    ("Zarnak Sidhwa", "https://masala.tv/category/chef/zarnak-sidhwa/"),
    ("Rida Aftab", "https://masala.tv/category/chef/rida-aftab/"),
    ("Mehboob Khan", "https://masala.tv/category/chef/mehboob-khan/"),
    ("Gulzar Hussain", "https://masala.tv/category/chef/gulzar-hussain/"),
    ("Tahir Chaudhry", "https://masala.tv/category/chef/tahir-chaudhry/"),
    ("Aisha Abrar", "https://masala.tv/category/chef/aisha-abrar/"),
    ("Kiran Khan", "https://masala.tv/category/chef/kiran-khan/"),
    ("A.R Jamali", "https://masala.tv/category/chef/a-r-jamali/"),
    ("Basim Akhund", "https://masala.tv/category/chef/basim-akhund/"),
    ("Hamza Azim", "https://masala.tv/category/chef/hamza-azim/"),
    ("Mahnoor Malik", "https://masala.tv/category/chef/mahnoor-malik/"),
    ("Saad Ahmed", "https://masala.tv/category/chef/saad-ahmed/"),
    ("Samina Jalil", "https://masala.tv/chef/samina-jalil/"),
    ("Abida Baloch", "https://masala.tv/chef/abida-baloch/"),
    ("Irfan Wasti", "https://masala.tv/chef/irfan-wasti/")
]

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return ""

chef_recipes = {}

for chef_name, url in CHEF_URLS:
    print(f"Scraping recipes for Chef {chef_name} from {url}...")
    html = fetch(url)
    if not html:
        # try without category or vice versa
        alt_url = url.replace("/category/chef/", "/chef/") if "/category/chef/" in url else url.replace("/chef/", "/category/chef/")
        html = fetch(alt_url)
    
    if html:
        # Extract recipe titles from entry titles or h2/h3 links
        # Patterns like: <h2 class="entry-title"><a href="...">Title</a></h2>
        recipe_matches = re.findall(r'<h[23][^>]*class=[\'"][^\'"]*entry-title[^\'"]*[\'"][^>]*>\s*<a[^>]*href=[\'"]([^\'"]+)[\'"][^>]*>([^<]+)</a>', html)
        if not recipe_matches:
            recipe_matches = re.findall(r'<a[^>]*href=[\'"](https?://masala\.tv/[^/]+/?)[\'"][^>]*rel=[\'"]bookmark[\'"][^>]*>([^<]+)</a>', html)
        if not recipe_matches:
            recipe_matches = re.findall(r'<a[^>]*href=[\'"](https?://masala\.tv/[a-z0-9\-]+-recipe[^/]*[\'"])[\'"][^>]*>([^<]+)</a>', html)
            
        print(f"  Found {len(recipe_matches)} recipes on main page for {chef_name}.")
        recipes = []
        for href, title in recipe_matches:
            clean_t = title.strip().replace('Recipe', '').replace('recipe', '').strip()
            if clean_t and len(clean_t) > 3 and clean_t not in recipes:
                recipes.append((clean_t, href))
        
        chef_recipes[chef_name] = recipes
    else:
        print(f"  Failed to fetch page for {chef_name}.")

print("\n--- SUMMARY OF DISCOVERED MASALA TV CHEF RECIPES ---")
total_found = 0
for chef, recs in chef_recipes.items():
    print(f"Chef {chef}: {len(recs)} recipes found")
    total_found += len(recs)
    for rtitle, rurl in recs[:5]:
        print(f"   - {rtitle}")

print(f"\nTotal recipes scraped: {total_found}")
