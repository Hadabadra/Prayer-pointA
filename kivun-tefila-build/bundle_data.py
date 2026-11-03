"""כיוון תפילה 3.8.0 — קובץ אחד עם כל קובצי הנתונים (kivun-tefila-all-data.json).
מבנה: {"kivunTefilaData": 1, "files": {"geo-names.json": "<תוכן>", "roads-AUS.json": "...", "layers-ISR.json": "..."}}
השמות בתוך files הם שמות השמירה בתוסף (fs.writeFile), וכפתור "טען את כל הנתונים מקובץ" כותב כל אחד מהם."""
import json, os, sys
src, out = sys.argv[1], sys.argv[2]
files = {}
for n in ("geo-names.json", "geo-extra.json"):
    files[n] = open(os.path.join(src, n), encoding="utf-8").read()
for sub in ("roads", "layers"):
    for n in sorted(os.listdir(os.path.join(src, sub))):
        if n.endswith(".json"):
            files[f"{sub}-{n}"] = open(os.path.join(src, sub, n), encoding="utf-8").read()
json.dump({"kivunTefilaData": 1, "files": files}, open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(out, len(files), "files", os.path.getsize(out), "bytes")
