#!/usr/bin/env python3
"""מוריד את תמונות המפות המקוריות (בלי סיומת מידה) לכל דף. פלט: raw/img/<slug>__<n>.<ext>"""
import json, re, os, subprocess, urllib.parse, sys
d = json.load(open("raw/index.json")); os.makedirs("raw/img", exist_ok=True)
for x in d:
    groups = {}
    for i in x["images"]:
        base = re.sub(r'-\d+x\d+(\.\w+)$', r'\1', i)
        groups.setdefault(base, []).append(i)
    x["sources"] = []
    for n, (base, vars_) in enumerate(groups.items()):
        ext = base.rsplit(".", 1)[1].lower()
        out = f"raw/img/{x['slug']}__{n}.{ext}"
        cands = [base] + sorted(vars_, key=lambda v: -int((re.search(r'-(\d+)x\d+\.', v) or [0, 0])[1]))
        for c in cands:
            r = subprocess.run(["curl", "-sSL", "-f", "--max-time", "120", "-o", out, c])
            if r.returncode == 0 and os.path.getsize(out) > 5000:
                x["sources"].append({"url": urllib.parse.unquote(c), "file": out}); break
        print(x["title"], n, os.path.getsize(out) if os.path.exists(out) else 0, file=sys.stderr)
json.dump(d, open("raw/index.json", "w"), ensure_ascii=False, indent=1)
