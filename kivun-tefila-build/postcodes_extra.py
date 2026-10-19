#!/usr/bin/env python3
"""כיוון תפילה — איסוף מיקודים שנשלחו על ידי משתמשים (issues "[מיקוד] ...") ל-kivun-tefila-data/postcodes-extra.json.
מיקוד נכנס רק כשיש לו לפחות שני דיווחים קרובים (עד 3 ק"מ), או issue עם התווית "מיקוד-מאושר".
קלט: JSON של issues מ-gh (stdin). פלט: {"d": תאריך, "f": {מיקוד: [lat, lon]}}."""
import json, math, re, sys, datetime, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kivun-tefila-data", "postcodes-extra.json")
issues = json.load(sys.stdin)
rep = {}
for i in issues:
    m = re.search(r"מיקוד:\s*([0-9A-Z]{5,8})", i.get("body") or "")
    g = re.search(r"מיקום:\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)", i.get("body") or "")
    if not m or not g: continue
    ok = any(l.get("name") == "מיקוד-מאושר" for l in i.get("labels", []))
    rep.setdefault(m.group(1), []).append((float(g.group(1)), float(g.group(2)), ok))


def km(a, b):
    k = math.cos(math.radians(a[0]))
    return 111 * math.hypot(a[0] - b[0], (a[1] - b[1]) * k)


f = {}
for z, L in rep.items():
    good = [p for p in L if p[2]] or [p for p in L if sum(km(p, q) < 3 for q in L) >= 2]
    if good:
        f[z] = [round(sum(p[0] for p in good) / len(good), 4), round(sum(p[1] for p in good) / len(good), 4)]
json.dump({"d": datetime.date.today().isoformat(), "f": dict(sorted(f.items()))}, open(OUT, "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
print(f"מיקודים: {len(f)} מתוך {len(rep)} שדווחו")
