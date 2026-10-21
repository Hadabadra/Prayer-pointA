#!/usr/bin/env python3
"""אריזה דטרמיניסטית של תוסף אוצריא: שמות ממוינים, תאריך קבוע, הרשאות קבועות.
שימוש: python3 pack.py <תיקיית-מקור> <קובץ-פלט.otzplugin>
אותם קבצים תמיד נותנים קובץ זהה בייט-לבייט."""
import os, sys, zipfile
src, out = sys.argv[1], sys.argv[2]
exclude = set(sys.argv[3:])  # נתיבים יחסיים שלא נכנסים לחבילה, למשל README.md
files = []
for root, dirs, names in os.walk(src):
    dirs[:] = sorted(d for d in dirs if not d.startswith("."))
    for n in names:
        if n.startswith(".") or n.endswith((".otzplugin", ".diff", ".orig")): continue
        if os.path.relpath(os.path.join(root, n), src).replace(os.sep, "/") in exclude: continue
        files.append(os.path.relpath(os.path.join(root, n), src).replace(os.sep, "/"))
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for f in sorted(files):
        zi = zipfile.ZipInfo(f, (2026, 1, 1, 0, 0, 0)); zi.external_attr = 0o644 << 16; zi.compress_type = zipfile.ZIP_DEFLATED
        z.writestr(zi, open(os.path.join(src, f), "rb").read(), compresslevel=9)
print(out, len(files), "files", os.path.getsize(out), "bytes")
