#!/usr/bin/env python3
"""כיוון תפילה — בניית קובצי כבישים ראשיים לכל מדינה (OpenStreetMap דרך Overpass).

רץ בשרתי GitHub (.github/workflows/build-roads.yml).
פלט: kivun-tefila-data/roads/<ISO3>.json ו-roads/index.json.
רשומה: ["r", שם/מספר, שם נוסף, [ISO3], "lat,lon lat,lon;..."] (כמו geo-names.json).
שמות: name:he לפני name. נתונים: © OpenStreetMap contributors, ODbL.
משתני סביבה: COUNTRIES (ISO3 בפסיקים, ריק=הכול), MAX_MINUTES (300), MAX_AGE_DAYS (25).
"""
import json, os, sys, time, urllib.parse, urllib.request, datetime

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kivun-tefila-data", "roads")
EP = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]
UA = "kivun-tefila-build/1.0 (github.com/e0548433917-gif/otzaria)"
TOL = 0.0025
MAX_BYTES = 600_000


def overpass(q, timeout=900):
    last = None
    for attempt in range(4):
        for ep in EP:
            try:
                req = urllib.request.Request(ep, data=urllib.parse.urlencode({"data": q}).encode(), headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=timeout) as r:
                    return json.loads(r.read().decode("utf8"))
            except Exception as e:
                last = e
                print("  ניסיון נכשל:", ep, e, file=sys.stderr)
                time.sleep(20 * (attempt + 1))
    raise RuntimeError(last)


def countries():
    j = overpass('[out:json][timeout:300];relation["admin_level"="2"]["boundary"="administrative"]["ISO3166-1:alpha3"];out tags;')
    m = {}
    for el in j.get("elements", []):
        t = el.get("tags", {})
        iso = t.get("ISO3166-1:alpha3")
        if iso and len(iso) == 3 and iso not in m:
            m[iso] = [t.get("name:he") or t.get("name:en") or t.get("name", iso), t.get("name:en") or t.get("name", iso)]
    return m


def dp(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    st = [(0, len(pts) - 1)]
    while st:
        a, b = st.pop()
        ax, ay, bx, by = pts[a][1], pts[a][0], pts[b][1], pts[b][0]
        dx, dy = bx - ax, by - ay; L = dx * dx + dy * dy
        best, bi = -1, -1
        for i in range(a + 1, b):
            px, py = pts[i][1], pts[i][0]
            t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L)) if L else 0
            d = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2
            if d > best: best, bi = d, i
        if best > tol * tol:
            keep[bi] = True; st += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]


def join(lines):
    lines = [l for l in lines if len(l) > 1]; out = []
    while lines:
        cur = lines.pop(); grew = True
        while grew:
            grew = False
            for i, l in enumerate(lines):
                if l[0] == cur[-1]: cur = cur + l[1:]
                elif l[-1] == cur[0]: cur = l + cur[1:]
                elif l[-1] == cur[-1]: cur = cur + l[::-1][1:]
                elif l[0] == cur[0]: cur = l[::-1] + cur[1:]
                else: continue
                lines.pop(i); grew = True; break
        out.append(cur)
    return out


def build(iso, kinds):
    q = (f'[out:json][timeout:900][maxsize:1073741824];area["ISO3166-1:alpha3"="{iso}"]["admin_level"="2"]->.a;'
         f'way(area.a)["highway"~"^({kinds})$"]["ref"];out tags geom;'
         f'way(area.a)["highway"~"^({kinds})$"]["name"][!"ref"];out tags geom;')
    groups = {}
    for w in overpass(q).get("elements", []):
        g = w.get("geometry")
        if not g: continue
        t = w.get("tags", {})
        ref = (t.get("ref") or "").split(";")[0].strip()
        nm = t.get("name:he") or t.get("name") or ""
        key = ref or nm
        if not key: continue
        e = groups.setdefault(key, {"ref": ref, "names": {}, "lines": []})
        if nm: e["names"][nm] = e["names"].get(nm, 0) + 1
        e["lines"].append([(round(p["lat"], 5), round(p["lon"], 5)) for p in g])
    ents = []
    for key in sorted(groups):
        e = groups[key]
        lines = [[(round(a, 3), round(b, 3)) for a, b in dp(l, TOL)] for l in join(e["lines"])]
        lines = [l for l in lines if len(set(l)) > 1]
        if not lines: continue
        nm = max(e["names"], key=e["names"].get) if e["names"] else ""
        first, second = (e["ref"], nm) if e["ref"] else (nm, "")
        ents.append(["r", first, second, [iso], ";".join(" ".join(f"{a:g},{b:g}" for a, b in l) for l in lines)])
    return ents


def dump(iso, kinds, ents):
    return json.dumps({"v": 1, "iso": iso, "k": kinds, "e": ents}, ensure_ascii=False, separators=(",", ":"))


def main():
    os.makedirs(OUT, exist_ok=True)
    idx_path = os.path.join(OUT, "index.json")
    idx = json.load(open(idx_path, encoding="utf8")) if os.path.exists(idx_path) else {"v": 1, "c": {}}
    allc = countries()
    want = [c.strip().upper() for c in os.environ.get("COUNTRIES", "").split(",") if c.strip()] or sorted(allc)
    budget = time.time() + 60 * float(os.environ.get("MAX_MINUTES", "300"))
    max_age = float(os.environ.get("MAX_AGE_DAYS", "25"))
    today = datetime.date.today()
    for iso in want:
        if time.time() > budget:
            print("התקציב נגמר; שאר המדינות בריצה הבאה."); break
        old = idx["c"].get(iso)
        if old and (today - datetime.date.fromisoformat(old["d"])).days < max_age: continue
        print("בונה", iso, allc.get(iso, [iso])[0], flush=True)
        try:
            kinds = "motorway|trunk|primary"; ents = build(iso, kinds); body = dump(iso, kinds, ents)
            if len(body.encode()) > MAX_BYTES:
                kinds = "motorway|trunk"; ents = build(iso, kinds); body = dump(iso, kinds, ents)
        except Exception as ex:
            print("  נכשל:", iso, ex, file=sys.stderr); continue
        if not ents:
            print("  אין כבישים בעלי שם או מספר"); continue
        open(os.path.join(OUT, iso + ".json"), "w", encoding="utf8").write(body)
        nm = allc.get(iso, [iso, iso])
        idx["c"][iso] = {"he": nm[0], "en": nm[1], "n": len(ents), "b": len(body.encode()), "k": kinds, "d": today.isoformat()}
        json.dump(idx, open(idx_path, "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"), sort_keys=True)
        print(f"  {len(ents)} כבישים, {len(body.encode())//1024}KB ({kinds})", flush=True)
        time.sleep(5)


if __name__ == "__main__":
    main()
