#!/usr/bin/env python3
"""מנתח את טבלת "רשימת אחראים בעירובים שכונתיים" ל-raw/responsible.json"""
import re, html, json, urllib.parse
p = open("raw/responsible.html").read()
rows = []
for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", p, re.S):
    tds = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S)
    if len(tds) < 5: continue
    def txt(s): return [l.strip() for l in html.unescape(re.sub(r"<[^>]+>", "", re.sub(r"<br\s*/?>", "\n", s))).split("\n") if l.strip()]
    link = re.search(r'href="([^"]+)"', tds[5]) if len(tds) > 5 else None
    city, num, hood = (" ".join(txt(tds[0])), " ".join(txt(tds[1])), " ".join(txt(tds[2])))
    if city == "עיר": continue
    rows.append({"city": city, "num": num, "area": hood, "names": txt(tds[3]),
                 "phones": [re.sub(r"[^\d-]", "", x) for x in txt(tds[4])],
                 "mapUrl": urllib.parse.unquote(link.group(1)) if link else None})
# הסרת כפילויות זהות
out, seen = [], set()
for r in rows:
    k = json.dumps(r, ensure_ascii=False)
    if k not in seen: seen.add(k); out.append(r)
json.dump(out, open("raw/responsible.json", "w"), ensure_ascii=False, indent=1)
print(len(out), "rows;", len({r["city"] for r in out}), "cities")
