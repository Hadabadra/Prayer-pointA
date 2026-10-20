/* כיוון תפילה 2.6.0 — בתי כנסת קרובים (משימה 8) ושכבות במפה: מסילות, תחנות רכבת ושדות תעופה (משימה 10).
   נתונים: OpenStreetMap (ODbL). מקור: קובץ מדינה שהורד (kivun-tefila-data/layers/<ISO3>.json),
   ובלעדיו חיפוש דרך Overpass סביב המיקום, ששומר את התוצאה לשימוש בלי רשת. נשלחים החוצה רק קואורדינטות מעוגלות. */
(function () {
  const $ = id => document.getElementById(id), O = window.Otzaria;
  const BASE = "https://raw.githubusercontent.com/Hadabadra/Prayer-pointA/%D7%9B%D7%99%D7%95%D7%95%D7%9F-%D7%AA%D7%A4%D7%99%D7%9C%D7%94/kivun-tefila-data/";
  const dat = r => r && (r.data !== undefined ? r.data : r);
  const say = t => { const e = $("nsMsg"); if (e) e.textContent = t };
  async function save(name, s) { try { O ? await O.call("fs.writeFile", { path: name, content: s }) : localStorage.setItem("kivun-" + name, s) } catch (e) {} }
  async function read(name) { try { if (!O) return localStorage.getItem("kivun-" + name); const r = dat(await O.call("fs.readFile", { path: name })); return r && typeof r === "object" ? (r.content || r.text || null) : r } catch (e) { return null } }
  const KINDS = { syn: ["s", "בתי כנסת", 5], rw: ["t", "תחנות רכבת", 30], ap: ["a", "שדות תעופה", 200] };
  const LY = {};            /* ISO3 -> קובץ שכבות */
  let CACHE = { v: 1, q: {} };
  const isos = add => { let a = []; try { a = JSON.parse(localStorage.getItem("kivun-layers-isos") || "[]") } catch (e) {} if (add && !a.includes(add)) { a.push(add); try { localStorage.setItem("kivun-layers-isos", JSON.stringify(a)) } catch (e) {} } return a };
  const pref = () => { try { return localStorage.getItem("kivun-layers") === "1" } catch (e) { return false } };

  /* ---- בחירת סוג החיפוש ---- */
  const sel = $("nsKind");
  if (!sel) return;
  sel.insertAdjacentHTML("beforeend", '<option value="syn">בתי כנסת קרובים</option><option value="rw">תחנות רכבת</option><option value="ap">שדות תעופה</option>');
  const box = document.createElement("span"); box.id = "lyBox"; box.hidden = true;
  box.innerHTML = '<button id="lyDl" type="button">הורד שכבות המדינה</button>';
  $("nsMsg").before(box);
  const isMine = () => !!KINDS[sel.value];
  const sync = () => { box.hidden = !(isMine() && $("nsCountry").value && !LY[$("nsCountry").value]); if (isMine()) $("nsQ").placeholder = "שם (ריק = הקרובים)" };
  sel.addEventListener("change", sync); $("nsCountry").addEventListener("change", () => { load($("nsCountry").value).then(sync) });

  async function load(iso) {
    if (!iso || LY[iso]) return LY[iso] || null;
    const t = await read("layers-" + iso + ".json");
    try { if (t) { const j = typeof t === "string" ? JSON.parse(t) : t; if (j && j.v) return LY[iso] = j } } catch (e) {}
    return null;
  }
  $("lyDl").onclick = async () => {
    const c = $("nsCountry").value; if (!c) return; say("מוריד…");
    try { const j = await getJ(BASE + "layers/" + c + ".json"); if (!j || !j.v) throw 0; await save("layers-" + c + ".json", JSON.stringify(j)); LY[c] = j; isos(c); say("נשמר ✓ (בתי כנסת " + j.s.length + ", תחנות " + j.t.length + ", שדות תעופה " + j.a.length + ")"); sync(); if (typeof pos !== "undefined" && pos) map() }
    catch (e) { say("ההורדה עוד חסומה באוצריא: כתובת הקבצים טרם נוספה לרשימת הכתובות המאושרות של אוצריא (בקשה נשלחה). בינתיים: לחצו \"העתק קישור\", שמרו את הקובץ בדפדפן (Ctrl+S) ולחצו \"טען מקובץ\".") }
  };

  /* ---- חיפוש סביב המיקום דרך Overpass, עם שמירה מקומית ---- */
  async function live(kind, p) {
    const r = KINDS[kind][2] * 1000, at = `(around:${r},${p[0].toFixed(3)},${p[1].toFixed(3)})`;
    const f = kind === "syn" ? '["amenity"="place_of_worship"]["religion"="jewish"]' : kind === "rw" ? '["railway"="station"]' : '["aeroway"="aerodrome"]["iata"]';
    const key = kind + ":" + p[0].toFixed(2) + "," + p[1].toFixed(2);
    if (!CACHE.loaded) { try { const t = await read("layers-cache.json"); if (t) CACHE = JSON.parse(t) } catch (e) {} CACHE.loaded = 1 }
    const q = `[out:json][timeout:25];nwr${f}${at};out tags center 200;`;
    let j = null;
    for (const h of ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]) { try { j = await getJ(h + "?data=" + encodeURIComponent(q)); if (j) break } catch (e) {} }
    if (!j) { const c = CACHE.q[key]; if (c) return { list: c.l, d: c.d }; throw 0 }
    const list = (j.elements || []).map(e => { const t = e.tags || {}, c = e.center || e; return [t["name:he"] || t.name || t["name:en"] || "", +(+c.lat).toFixed(5), +(+c.lon).toFixed(5), t.iata || ""] }).filter(e => isFinite(e[1]));
    CACHE.q[key] = { l: list, d: new Date().toISOString().slice(0, 10) };
    const keys = Object.keys(CACHE.q); if (keys.length > 60) delete CACHE.q[keys[0]];
    const { loaded, ...keep } = CACHE; save("layers-cache.json", JSON.stringify(keep));
    return { list };
  }

  const norm = s => (s || "").toLowerCase().replace(/[׳'’"״.\-]/g, "").trim();
  async function go() {
    const kind = sel.value, q = norm($("nsQ").value), c = $("nsCountry").value, me = (typeof pos !== "undefined" && pos) ? pos : null;
    const res = $("nsRes"); res.innerHTML = ""; res.hidden = true;
    let list = null, note = "";
    const L = await load(c);
    if (L) list = L[KINDS[kind][0]].slice();
    else if (me) { say("מחפש סביב המיקום…"); try { const r = await live(kind, me); list = r.list; if (r.d) note = "מהשמירה המקומית (" + r.d.split("-").reverse().join(".") + "). " } catch (e) { say("החיפוש דרך האינטרנט לא זמין כרגע. אפשר לבחור מדינה ולהוריד את שכבות המדינה."); return } }
    else { say("בחר קודם מיקום, או בחר מדינה והורד את שכבותיה."); return }
    if (q) list = list.filter(e => norm(e[0]).includes(q) || norm(e[3]).includes(q));
    if (me) list.forEach(e => { e.d = dist(me, [e[1], e[2]]) }), list.sort((a, b) => a.d - b.d);
    say(note + (list.length ? "" : "לא נמצאו תוצאות" + (kind === "syn" ? " (ייתכן שבתי הכנסת באזור לא מופו ב-OpenStreetMap)." : ".")));
    list.slice(0, 30).forEach(e => {
      const li = document.createElement("li"), b = document.createElement("b"), sm = document.createElement("small");
      b.textContent = e[0] || (kind === "syn" ? "בית כנסת (ללא שם)" : "ללא שם"); sm.textContent = (e[3] ? " (" + e[3] + ")" : "") + " · " + KINDS[kind][1];
      const info = document.createElement("div"); info.style.fontSize = ".85em";
      const bj = bearing([e[1], e[2]], J);
      info.textContent = (e.d != null ? `${e.d < 10 ? e.d.toFixed(1) : Math.round(e.d)} ק"מ ממך. ` : "") + `כיוון ירושלים משם: ${Math.round(bj)}°.`;
      const set = document.createElement("button"); set.type = "button"; set.textContent = "קבע מיקום כאן";
      set.onclick = () => { window.HLP = { name: e[0], at: [e[1], e[2]] }; setPos([e[1], e[2]], e[0] || KINDS[kind][1], null, false); scrollTo(0, 0) };
      const sh = document.createElement("button"); sh.type = "button"; sh.textContent = "הצג במפה";
      sh.onclick = () => { window.HLP = { name: e[0], at: [e[1], e[2]] }; if (me) { map(); $("map").scrollIntoView({ block: "center" }) } };
      li.append(b, sm, info, set, sh); res.appendChild(li);
    });
    res.hidden = !res.children.length;
  }
  /* לוכדים לפני החיפוש של names.js (כבישים ונהרות) */
  $("plRow").addEventListener("click", e => { if (e.target.id === "nsGo" && isMine()) { e.stopImmediatePropagation(); e.preventDefault(); go() } }, true);
  $("plRow").addEventListener("keydown", e => { if (e.target.id === "nsQ" && e.key === "Enter" && isMine()) { e.stopImmediatePropagation(); e.preventDefault(); go() } }, true);

  /* ---- ציור השכבות במפה (נקרא מתוך map) ---- */
  window.LAYERS_SVG = function (P, x0, x1, y0, y1) {
    let h = "";
    const inb = (la, lo) => la > y0 && la < y1 && lo > x0 && lo < x1, tx = s => String(s || "").replace(/[<&>"]/g, "");
    if (pref()) {
      const small = (x1 - x0) < 4;
      for (const k in LY) {
        const L = LY[k];
        if (L.r) for (const l of L.r.split(";")) {
          const pts = l.split(" ").map(p => p.split(",").map(Number)); if (!pts.some(p => inb(p[0], p[1]))) continue;
          h += `<polyline points="${pts.map(P).join(" ")}" fill="none" stroke="var(--color-on-surface-dim)" stroke-width="1.6" stroke-dasharray="5 2" stroke-opacity=".8"/>`;
        }
        if (small) for (const t of L.t) if (inb(t[1], t[2])) { const q = P([t[1], t[2]]); h += `<rect x="${q[0] - 3}" y="${q[1] - 3}" width="6" height="6" fill="var(--color-on-surface-dim)"><title>${tx(t[0])}</title></rect>` }
        for (const a of L.a) if (inb(a[1], a[2])) { const q = P([a[1], a[2]]); h += `<text x="${q[0]}" y="${+q[1] + 4}" text-anchor="middle" font-size="12" fill="var(--color-on-surface)">✈<title>${tx(a[0])}</title></text>` }
        if ((x1 - x0) < 0.3) for (const s of L.s) if (inb(s[1], s[2])) { const q = P([s[1], s[2]]); h += `<circle cx="${q[0]}" cy="${q[1]}" r="3" fill="var(--color-primary)"><title>${tx(s[0] || "בית כנסת")}</title></circle>` }
      }
    }
    if (window.HLP && HLP.at && inb(HLP.at[0], HLP.at[1])) { const m = P(HLP.at); h += `<circle cx="${m[0]}" cy="${m[1]}" r="5" fill="var(--color-primary)"/><text x="${m[0]}" y="${+m[1] + 17}" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--color-primary)" stroke="var(--color-surface)" stroke-width="3" paint-order="stroke">${tx(HLP.name)}</text>` }
    return h;
  };

  /* ---- הגדרה: להציג שכבות במפה ---- */
  const set = $("set");
  if (set) {
    const p = document.createElement("p");
    p.innerHTML = '<label><input type="checkbox" id="lyOn"> שכבות במפה: מסילות רכבת, תחנות ושדות תעופה (מקובצי מדינה שהורדו)</label>';
    set.appendChild(p);
    $("lyOn").checked = pref();
    $("lyOn").onchange = () => { try { localStorage.setItem("kivun-layers", $("lyOn").checked ? "1" : "0") } catch (e) {} if (typeof pos !== "undefined" && pos) map() };
  }
  /* טעינת קובצי מדינה שכבר הורדו, כדי שהשכבות יופיעו מיד */
  (async () => { try { for (const c of isos()) await load(c); if (typeof pos !== "undefined" && pos) map() } catch (e) {} })();
})();
