#!/usr/bin/env python3
"""סורק את אתר מוקד העירוב (באישורם): רשימת המפות השכונתיות, תמונת המפה של כל דף, ודף האחראים.
פלט: raw/index.json + raw/pages/*.html"""
import re, json, os, sys, html, urllib.parse, subprocess
BASE = "http://hiruv.com"
OUT = sys.argv[1] if len(sys.argv) > 1 else "raw"
os.makedirs(OUT + "/pages", exist_ok=True)
def get(url):
    return subprocess.run(["curl", "-sSL", "--max-time", "60", url], capture_output=True).stdout.decode("utf-8", "replace")
idx = get(BASE + "/%d7%9e%d7%a4%d7%95%d7%aa-%d7%a9%d7%9b%d7%95%d7%a0%d7%aa%d7%99%d7%95%d7%aa/")
items = []
for m in re.finditer(r'<h3[^>]*>\s*<a href="([^"]+)"[^>]*>(.*?)</a>', idx, re.S):
    url, title = m.group(1), html.unescape(re.sub("<[^>]+>", "", m.group(2))).strip()
    if url.startswith(BASE) and title: items.append({"url": url, "title": title})
seen = set(); res = []
for it in items:
    if it["url"] in seen: continue
    seen.add(it["url"])
    slug = urllib.parse.unquote(it["url"].rstrip("/").split("/")[-1])
    page = get(it["url"])
    open(f"{OUT}/pages/{slug}.html", "w").write(page)
    imgs = re.findall(r'http://hiruv\.com/wp-content/uploads/[^ "\',]+?\.(?:jpe?g|png|webp|pdf)', page)
    imgs = [i for i in dict.fromkeys(imgs) if "לוגו" not in urllib.parse.unquote(i)]
    # להעדיף את המקור בלי סיומת מידה
    full = [i for i in imgs if not re.search(r'-\d+x\d+\.', i)]
    pdfs = re.findall(r'href="([^"]+\.pdf)"', page)
    body = re.search(r'elementor-widget-theme-post-content.*?<div class="elementor-widget-container">(.*?)</div>\s*</div>', page, re.S)
    text = html.unescape(re.sub(r"<[^>]+>", " ", body.group(1))).strip() if body else ""
    res.append({**it, "slug": slug, "images": full or imgs, "pdfs": pdfs, "text": re.sub(r"\s+", " ", text)})
    print(it["title"], len(full or imgs), file=sys.stderr)
resp = get(BASE + "/%d7%a8%d7%a9%d7%99%d7%9e%d7%aa-%d7%90%d7%97%d7%a8%d7%90%d7%99%d7%9d-%d7%91%d7%a2%d7%99%d7%a8%d7%95%d7%91%d7%99%d7%9d-%d7%a9%d7%9b%d7%95%d7%a0%d7%aa%d7%99%d7%99%d7%9d/")
open(f"{OUT}/responsible.html", "w").write(resp)
json.dump(res, open(f"{OUT}/index.json", "w"), ensure_ascii=False, indent=1)
