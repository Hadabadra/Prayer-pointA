#!/usr/bin/env python3
"""כיוון תפילה — שכבות לכל מדינה (משימות 8 ו-10): בתי כנסת, תחנות רכבת, מסילות ושדות תעופה.

רץ בשרתי GitHub (.github/workflows/build-layers.yml), באותו מנגנון של build_roads.py.
פלט: kivun-tefila-data/layers/<ISO3>.json ו-layers/index.json.
מבנה: {"v":1,"iso":..,"s":[[שם,lat,lon],...] בתי כנסת, "t":[[שם,lat,lon]] תחנות,
       "a":[[שם,lat,lon,IATA]] שדות תעופה, "r":"lat,lon lat,lon;..." מסילות ראשיות}
נתונים: © OpenStreetMap contributors, ODbL. משתני סביבה: COUNTRIES, MAX_MINUTES, MAX_AGE_DAYS, COMMIT_EVERY.
"""
import json, os, sys, time, datetime, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_roads import overpass, countries, dp, join  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kivun-tefila-data", "layers")
TOL = 0.004
MAX_BYTES = 700_000


def name(t):
    return t.get("name:he") or t.get("name") or t.get("name:en") or ""


def center(el):
    if "lat" in el: return el["lat"], el["lon"]
    c = el.get("center")
    return (c["lat"], c["lon"]) if c else (None, None)


def build(iso, rails=True):
    a = f'[out:json][timeout:900][maxsize:1073741824];area["ISO3166-1:alpha3"="{iso}"]["admin_level"="2"]->.a;'
    q = (a + 'nwr(area.a)["amenity"="place_of_worship"]["religion"="jewish"];out tags center;'
         'nwr(area.a)["railway"="station"];out tags center;'
         'nwr(area.a)["aeroway"="aerodrome"]["iata"];out tags center;')
    s, t, ap = [], [], []
    for el in overpass(q).get("elements", []):
        tg = el.get("tags", {}); lat, lon = center(el)
        if lat is None: continue
        row = [name(tg), round(lat, 5), round(lon, 5)]
        if tg.get("religion") == "jewish": s.append(row)
        elif tg.get("railway") == "station":
            if row[0]: t.append(row)
        elif tg.get("aeroway") == "aerodrome": ap.append(row + [tg.get("iata", "")])
    r = ""
    if rails:
        lines = []
        for w in overpass(a + 'way(area.a)["railway"="rail"]["usage"="main"];out geom;').get("elements", []):
            g = w.get("geometry")
            if g: lines.append([(round(p["lat"], 4), round(p["lon"], 4)) for p in g])
        ls = [[(round(x, 3), round(y, 3)) for x, y in dp(l, TOL)] for l in join(lines)]
        r = ";".join(" ".join(f"{x:g},{y:g}" for x, y in l) for l in ls if len(set(l)) > 1)
    key = lambda e: (e[0] or "~", e[1])
    return {"v": 1, "iso": iso, "s": sorted(s, key=key), "t": sorted(t, key=key), "a": sorted(ap, key=key), "r": r}


def main():
    os.makedirs(OUT, exist_ok=True)
    idx_path = os.path.join(OUT, "index.json")
    idx = json.load(open(idx_path, encoding="utf8")) if os.path.exists(idx_path) else {"v": 1, "c": {}}
    allc = countries()
    want = [c.strip().upper() for c in os.environ.get("COUNTRIES", "").split(",") if c.strip()] or sorted(allc)
    budget = time.time() + 60 * float(os.environ.get("MAX_MINUTES", "300"))
    max_age = float(os.environ.get("MAX_AGE_DAYS", "25"))
    every = int(os.environ.get("COMMIT_EVERY", "0") or 0); built = 0
    today = datetime.date.today()
    for iso in want:
        if time.time() > budget:
            print("התקציב נגמר; שאר המדינות בריצה הבאה."); break
        old = idx["c"].get(iso)
        if old and (today - datetime.date.fromisoformat(old["d"])).days < max_age: continue
        print("בונה", iso, allc.get(iso, [iso])[0], flush=True)
        try:
            j = build(iso); body = json.dumps(j, ensure_ascii=False, separators=(",", ":"))
            if len(body.encode()) > MAX_BYTES:
                j = build(iso, rails=False); body = json.dumps(j, ensure_ascii=False, separators=(",", ":"))
        except Exception as ex:
            print("  נכשל:", iso, ex, file=sys.stderr); continue
        if not (j["s"] or j["t"] or j["a"] or j["r"]):
            print("  אין נתונים"); continue
        open(os.path.join(OUT, iso + ".json"), "w", encoding="utf8").write(body)
        nm = allc.get(iso, [iso, iso])
        idx["c"][iso] = {"he": nm[0], "en": nm[1], "s": len(j["s"]), "t": len(j["t"]), "a": len(j["a"]), "b": len(body.encode()), "d": today.isoformat()}
        json.dump(idx, open(idx_path, "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"), sort_keys=True)
        print(f"  בתי כנסת {len(j['s'])}, תחנות {len(j['t'])}, שדות תעופה {len(j['a'])}, {len(body.encode())//1024}KB", flush=True)
        built += 1
        if every and built % every == 0:
            subprocess.run(["bash", os.path.join(os.path.dirname(os.path.abspath(__file__)), "commit_data.sh"), OUT, "שכבות"])
        time.sleep(5)


if __name__ == "__main__":
    main()
