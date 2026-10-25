"""כיוון תפילה — אריזה לדפדפן (3.3.0).

שימוש: python3 kivun-tefila-build/web.py kivun-tefila OUT_DIR
יוצר:
  OUT_DIR/kivun-tefila-<ver>.html          — קובץ HTML אחד שנפתח בכל דפדפן, בלי אינטרנט
  OUT_DIR/kivun-tefila-<ver>-browser.zip   — תוסף לכרום/אדג' (Manifest V3): "טען תוסף לא ארוז" מהתיקייה, או גרירה
הקוד עצמו לא משתנה: בלי אוצריא (אין O) התוסף כבר עובד במצב דפדפן.
"""
import base64, json, os, re, sys, zipfile

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
man = json.load(open(os.path.join(SRC, "manifest.json"), encoding="utf-8"))
VER = man["version"]
html = open(os.path.join(SRC, "index.html"), encoding="utf-8").read()


def rd(n):
    return open(os.path.join(SRC, n), encoding="utf-8").read()


def safe(js):
    return js.replace("</script", "<\\/script")


# ---------- 1. קובץ HTML יחיד ----------
static = set(re.findall(r'<script src="([^"]+)"></script>', html))
lazy = sorted(n for n in os.listdir(SRC) if n.endswith(".js") and n not in static)
shim = (
    "<script>/* web: קבצים שנטענים בעת הצורך מוטמעים בדף */(function(){"
    "var d=Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype,'src');"
    "Object.defineProperty(HTMLScriptElement.prototype,'src',{configurable:true,get:function(){return d.get.call(this)},"
    "set:function(v){var e=document.querySelector('script[type=\"text/x-kf\"][data-n=\"'+String(v).split('/').pop()+'\"]');"
    "if(e){if(!e._u)e._u=URL.createObjectURL(new Blob([e.textContent],{type:'text/javascript'}));v=e._u}d.set.call(this,v)}})})();</script>\n"
)
one = html
one = re.sub(r'<link rel="stylesheet" href="([^"]+)">', lambda m: "<style>\n" + rd(m.group(1)) + "\n</style>", one)
one = re.sub(r'<script src="([^"]+)"></script>', lambda m: "<script>\n" + safe(rd(m.group(1))) + "\n</script>", one)
icon = "data:image/png;base64," + base64.b64encode(open(os.path.join(SRC, "icon.png"), "rb").read()).decode()
one = one.replace('src="icon.png"', 'src="' + icon + '"').replace('href="icon.png"', 'href="' + icon + '"')
emb = "".join('<script type="text/x-kf" data-n="%s">%s</script>\n' % (n, safe(rd(n))) for n in lazy)
one = one.replace("<head>", "<head>\n" + shim + emb + '<link rel="icon" href="' + icon + '">', 1)

hp = os.path.join(OUT, "kivun-tefila-%s.html" % VER)
open(hp, "w", encoding="utf-8").write(one)

# ---------- 2. תוסף דפדפן (MV3) ----------
# MV3 אוסר סקריפטים בתוך הדף: מוציאים כל <script>...</script> לקובץ inline-N.js
ext = html
n = [0]
files = {}


def out_inline(m):
    n[0] += 1
    name = "inline-%d.js" % n[0]
    files[name] = m.group(1)
    return '<script src="%s"></script>' % name


ext = re.sub(r"<script>(.*?)</script>", out_inline, ext, flags=re.S)
if re.search(r"\son[a-z]+=\"", ext):
    print("אזהרה: יש מאזיני on...= בתוך ה-HTML — חסומים ב-MV3")
mf = {
    "manifest_version": 3,
    "name": "כיוון תפילה",
    "version": VER,
    "description": man["description"][:132],
    "author": man.get("author", ""),
    "icons": {"128": "icon.png"},
    "action": {"default_title": "כיוון תפילה", "default_icon": "icon.png"},
    "background": {"service_worker": "bg.js"},
    "homepage_url": "https://github.com/Hadabadra/Prayer-pointA/tree/%D7%9B%D7%99%D7%95%D7%95%D7%9F-%D7%AA%D7%A4%D7%99%D7%9C%D7%94",
}
files["bg.js"] = 'chrome.action.onClicked.addListener(()=>chrome.tabs.create({url:chrome.runtime.getURL("index.html")}));\n'
zp = os.path.join(OUT, "kivun-tefila-%s-browser.zip" % VER)
with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(os.listdir(SRC)):
        if f in ("manifest.json", "index.html"):
            continue
        z.write(os.path.join(SRC, f), f)
    z.writestr("index.html", ext)
    z.writestr("manifest.json", json.dumps(mf, ensure_ascii=False, indent=2))
    for k, v in files.items():
        z.writestr(k, v)
print(hp, os.path.getsize(hp) // 1024, "KB")
print(zp, os.path.getsize(zp) // 1024, "KB")
