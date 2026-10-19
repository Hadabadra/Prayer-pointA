# בונה את geo-names.json: שמות נהרות (עולם) וכבישים בעלי שם, מנתוני Natural Earth 1:10m (נחלת הכלל)
import json, sys, math
D = sys.argv[1]; OUT = sys.argv[2]
rv = json.load(open(D + '/ne_10m_rivers_lake_centerlines.geojson'))['features']
ro = json.load(open(D + '/ne_10m_roads.geojson'))['features']
ct = json.load(open(D + '/ne_10m_admin_0_countries.geojson'))['features']

def rings(g):
    if g['type'] == 'Polygon': return [g['coordinates']]
    return g['coordinates']
C = []
for f in ct:
    p = f['properties']; iso = p.get('ISO_A3') if p.get('ISO_A3') not in (None, '-99') else p.get('ADM0_A3')
    polys = rings(f['geometry']); xs = [x for pl in polys for x, y in pl[0]]; ys = [y for pl in polys for x, y in pl[0]]
    C.append((iso, p.get('NAME_HE') or p.get('NAME'), p.get('NAME'), polys, (min(xs), min(ys), max(xs), max(ys)), p.get('ADM0_A3'), p.get('SOV_A3')))
def inring(x, y, r):
    c = False; n = len(r); j = n - 1
    for i in range(n):
        xi, yi = r[i]; xj, yj = r[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi: c = not c
        j = i
    return c
def country(x, y):
    for iso, he, en, polys, b, a, s in C:
        if b[0] <= x <= b[2] and b[1] <= y <= b[3]:
            for pl in polys:
                if inring(x, y, pl[0]): return iso
    return None
def rdp(pts, e):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy); mi = 0; md = -1
    for i in range(1, len(pts) - 1):
        p = pts[i]
        d = math.hypot(p[0] - a[0], p[1] - a[1]) if L == 0 else abs(dx * (a[1] - p[1]) - (a[0] - p[0]) * dy) / L
        if d > md: md, mi = d, i
    if md > e: return rdp(pts[:mi + 1], e)[:-1] + rdp(pts[mi:], e)
    return [a, b]
def lines(g): return g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
def enc(ls):  # "lat,lon lat,lon;..." (שתי ספרות אחרי הנקודה)
    return ';'.join(' '.join('%.2f,%.2f' % (y, x) for x, y in l) for l in ls)

HE = {'Jordan': 'ירדן', 'Nile': 'נילוס', 'Euphrates': 'פרת', 'Tigris': 'חידקל', 'Danube': 'דנובה', 'Rhine': 'הריין', 'Thames': 'התמזה', 'Hudson': 'הדסון', 'Volga': 'וולגה', 'Amazon': 'אמזונס', 'Mississippi': 'מיסיסיפי', 'Dnieper': 'דנייפר', 'Dniester': 'דניסטר', 'Seine': 'סן', 'Elbe': 'אלבה', 'Vistula': 'ויסלה', 'Don': 'דון', 'Ural': 'אורל', 'Yangtze': 'יאנגצה', 'Ganges': 'גנגס', 'Indus': 'אינדוס', 'Congo': 'קונגו', 'Niger': 'ניז׳ר', 'Zambezi': 'זמבזי', 'Rhône': 'רון', 'Rhone': 'רון', 'Po': 'פו', 'Tiber': 'טיבר', 'Loire': 'לואר', 'Tagus': 'טז׳ו', 'Ebro': 'אברו', 'Orontes': 'אורונטס', 'Oder': 'אודר', 'Neman': 'נימן', 'Dvina': 'דווינה', 'Oder': 'אודר', 'Mekong': 'מקונג', 'Yellow': 'הנהר הצהוב', 'Orange': 'אורנג׳', 'Limpopo': 'לימפופו', 'Colorado': 'קולורדו', 'Rio Grande': 'ריו גראנדה', 'Columbia': 'קולומביה', 'St. Lawrence': 'סנט לורנס', 'Missouri': 'מיזורי', 'Ohio': 'אוהיו', 'Yukon': 'יוקון', 'Tennessee': 'טנסי', 'Murray': 'מארי', 'Brahmaputra': 'ברהמפוטרה', 'Irrawaddy': 'אירוואדי', 'Amur': 'אמור', 'Ob': 'אוב', 'Lena': 'לנה', 'Yenisey': 'ינייסיי', 'Syr Darya': 'סיר דריה', 'Amu Darya': 'אמו דריה', 'Prut': 'פרוט', 'Maritsa': 'מריצה', 'Vltava': 'וולטבה', 'Garonne': 'גארון', 'Shannon': 'שנון', 'Douro': 'דורו', 'Guadalquivir': 'גוואדלקוויר', 'Kuban': 'קובאן', 'Sava': 'סאווה', 'Drava': 'דראווה', 'Tisza': 'טיסה', 'Mosel': 'מוזל', 'Moselle': 'מוזל', 'Main': 'מיין', 'Inn': 'אין', 'Meuse': 'מז', 'Scheldt': 'שלד'}
E = []; seen = {}
for f in rv:
    p = f['properties']; n = (p.get('name_en') or p.get('name') or '').strip()
    if not n or n.lower().endswith('delta'): continue
    ls = [rdp([(x, y) for x, y in l], 0.03) for l in lines(f['geometry'])]
    if n in seen:
        seen[n][4].extend(ls); continue
    e = ['w', n, HE.get(n, ''), [], ls]; seen[n] = e; E.append(e)
for e in E:
    s = set()
    for l in e[4]:
        for i in range(0, len(l), max(1, len(l) // 6)):
            c = country(*l[i])
            if c: s.add(c)
    e[3] = sorted(s)
rg = {}
for f in ro:
    p = f['properties']
    if p['type'] not in ('Major Highway', 'Secondary Highway', 'Beltway', 'Bypass', 'Road'): continue
    n = (p.get('label') or p.get('name') or '').strip()
    if not n: continue
    x, y = lines(f['geometry'])[0][0]; c = country(x, y) or p.get('sov_a3')
    k = (n, c)
    rg.setdefault(k, []).extend(rdp([(x, y) for x, y in l], 0.03) for l in lines(f['geometry']))
for (n, c), ls in rg.items(): E.append(['r', n, '', [c] if c else [], ls])
used = set(c for e in E for c in e[3])
CL = {iso: [he, en] for iso, he, en, *_ in C if iso in used}
out = {'v': 1, 'c': CL, 'e': [[k, n, h, cs, enc(ls)] for k, n, h, cs, ls in E]}
json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(E), 'שמות', len(CL), 'מדינות')
