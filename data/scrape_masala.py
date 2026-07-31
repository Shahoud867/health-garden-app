import urllib.request
import re

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""

print("Fetching chefs list...")
html = fetch("https://masala.tv/chefs/")
if html:
    # Find all links on chefs page
    links = set(re.findall(r'href=[\'"](https?://masala\.tv/[^\'"]+)[\'"]', html))
    print(f"Found {len(links)} links on chefs page.")
    for l in sorted(list(links)):
        if '/chef' in l:
            print("  Chef URL:", l)

print("\nFetching Shireen Anwar chef page...")
html_shireen = fetch("https://masala.tv/chef/shireen-anwar/")
if html_shireen:
    # extract title tags or article titles or links
    titles = set(re.findall(r'<a[^>]*href=[\'"](https?://masala\.tv/[^\'"]+)[\'"][^>]*>([^<]+)</a>', html_shireen))
    print(f"Found {len(titles)} links with text on Shireen Anwar page:")
    for href, title in sorted(list(titles))[:25]:
        t = title.strip()
        if t and not t.startswith('Read') and len(t) > 3:
            print(f"  - {t} ({href})")
