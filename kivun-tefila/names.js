/* כיוון תפילה 2.5.0 — חיפוש כבישים ראשיים ונהרות, בחירת מדינה, וטעינת קבצים מהגדרות.
   נתונים: Natural Earth (נחלת הכלל). נהרות בעלי שם בכל העולם; כבישים בעלי שם בצפון אמריקה.
   כבישים במדינות אחרות: חיפוש דרך Overpass (OpenStreetMap) כשיש אינטרנט. נשלחים החוצה רק טקסט החיפוש ושם המדינה. */
(function () {
  const $ = id => document.getElementById(id), O = window.Otzaria;
  const BASE = "https://raw.githubusercontent.com/Hadabadra/Prayer-pointA/%D7%9B%D7%99%D7%95%D7%95%D7%9F-%D7%AA%D7%A4%D7%99%D7%9C%D7%94/kivun-tefila-data/";
  const PAGE = "https://github.com/Hadabadra/Prayer-pointA/releases/download/kivun-tefila-data/"; /* 3.0.5: קבצים מצורפים — הדפדפן מוריד ישירות */
  const dat = r => r && (r.data !== undefined ? r.data : r);
  const say = (id, t) => { const e = $(id); if (e) e.textContent = t };
  const BASIC = [["ISR", "ישראל", "Israel"], ["USA", "ארצות הברית", "United States of America"], ["CAN", "קנדה", "Canada"], ["MEX", "מקסיקו", "Mexico"], ["GBR", "בריטניה", "United Kingdom"], ["FRA", "צרפת", "France"], ["DEU", "גרמניה", "Germany"], ["BEL", "בלגיה", "Belgium"], ["NLD", "הולנד", "Netherlands"], ["CHE", "שווייץ", "Switzerland"], ["AUT", "אוסטריה", "Austria"], ["ITA", "איטליה", "Italy"], ["ESP", "ספרד", "Spain"], ["UKR", "אוקראינה", "Ukraine"], ["RUS", "רוסיה", "Russia"], ["POL", "פולין", "Poland"], ["HUN", "הונגריה", "Hungary"], ["ARG", "ארגנטינה", "Argentina"], ["BRA", "ברזיל", "Brazil"], ["AUS", "אוסטרליה", "Australia"], ["ZAF", "דרום אפריקה", "South Africa"], ["MAR", "מרוקו", "Morocco"], ["JOR", "ירדן", "Jordan"], ["EGY", "מצרים", "Egypt"], ["TUR", "טורקיה", "Turkey"]];

  /* קבצי טקסט: אוצריא (בחירת קובץ) או דפדפן */
  window.ktPickText = (t) => pickText(t);
  async function pickText(title) {
    if (O) { const r = dat(await O.call("fs.pickUserFile", { title })); if (!r || r.cancelled) return null; const x = dat(await O.call("fs.readTextFile", { token: r.token })); return x && typeof x === "object" ? (x.content != null ? x.content : x.text != null ? x.text : JSON.stringify(x)) : x }
    return new Promise(res => { const f = document.createElement("input"); f.type = "file"; f.accept = ".json,application/json"; f.onchange = () => f.files[0] ? f.files[0].text().then(res) : res(null); f.click() });
  }
  async function saveFile(name, s) { try { O ? await O.call("fs.writeFile", { path: name, content: s }) : localStorage.setItem("kivun-" + name, s) } catch (e) {} }
  async function readFile(name) { try { if (!O) return localStorage.getItem("kivun-" + name); const r = dat(await O.call("fs.readFile", { path: name })); return r && typeof r === "object" ? (r.content != null ? r.content : null) : r } catch (e) { return null } }
  const openUrl = u => { let w = null; try { w = window.open(u, "_blank", "noopener") } catch (e) {} if (!w && O) O.call("app.openUrl", { url: u }).catch(() => {}) };
  function link(btn, msg, url, what) {
    $(btn).onclick = () => { copyText(url).then(ok => { say(msg, ok ? "הקישור הועתק. פתח אותו במחשב עם אינטרנט והקובץ יורד מעצמו לתיקיית ההורדות; אחר כך לחצו \"טען מקובץ\"." : "העתקה אוטומטית נכשלה: " + url); openUrl(url) }) };
  }

  /* ---- שמות נהרות וכבישים ---- */
  let N = null;
  function setNames(j) { N = j; const nr = j.e.filter(e => e[0] === "w").length; say("namesMsg", "נטען ✓ (" + nr + " נהרות, " + (j.e.length - nr) + " כבישים). לחיפוש: בשורת המיקום בחרו \"נהרות\" או \"כבישים ראשיים\"."); fillCountries(); try { mode() } catch (e) {} }
  async function namesLoad() { const t = await readFile("geo-names.json"); try { if (t) setNames(typeof t === "string" ? JSON.parse(t) : t) } catch (e) {} }
  $("namesDl").onclick = async () => {
    say("namesMsg", "מוריד…");
    try { const j = await getJ(BASE + "geo-names.json"); if (!j || !j.e) throw 0; await saveFile("geo-names.json", JSON.stringify(j)); setNames(j) }
    catch (e) { say("namesMsg", "ההורדה עוד חסומה באוצריא: כתובת הקבצים טרם נוספה לרשימת הכתובות המאושרות של אוצריא (בקשה נשלחה). בינתיים: לחצו \"העתק קישור\", הקובץ יורד בדפדפן ולחצו \"טען מקובץ\".") }
  };
  $("namesImp").onclick = async () => {
    try { const t = await pickText("בחר את הקובץ geo-names.json"); if (t == null) return; const j = JSON.parse(t); if (!j || !j.e) throw 0; await saveFile("geo-names.json", t); setNames(j) }
    catch (e) { say("namesMsg", "הקובץ אינו קובץ שמות תקין.") }
  };
  link("namesLink", "namesMsg", PAGE + "geo-names.json");

  /* ---- נהרות ואגמים מפורטים למפה (globe.js) ---- */
  $("geoImp").onclick = async () => {
    try { const t = await pickText("בחר את הקובץ geo-extra.json"); if (t == null) return; const j = JSON.parse(t); if (!j || !j.r) throw 0; await saveFile("geo-extra.json", t); GEOX = j; say("geoMsg", "נטען ✓"); if (pos) map() }
    catch (e) { say("geoMsg", "הקובץ אינו קובץ נהרות תקין.") }
  };
  link("geoLink", "geoMsg", PAGE + "geo-extra.json");

  /* ---- כבישים ראשיים לפי מדינה (kivun-tefila-data/roads/<ISO3>.json, נבנה ב-GitHub Actions מ-OpenStreetMap) ---- */
  const RD = {};
  let RIDX = null;
  async function ridxLoad() {
    try { const t = await readFile("roads-index.json"); if (t) { const j = JSON.parse(t); if (j && j.c) RIDX = j.c } } catch (e) {}
    try { const j = await getJ(BASE + "roads/index.json"); if (j && j.c) { RIDX = j.c; saveFile("roads-index.json", JSON.stringify(j)) } } catch (e) {}
    fillCountries();
  }
  async function roadsLocal(iso) {
    if (RD[iso]) return RD[iso];
    if (iso === "ISR" && typeof KT_ISR_ROADS !== "undefined" && KT_ISR_ROADS.e) return RD[iso] = KT_ISR_ROADS.e;
    const t = await readFile("roads-" + iso + ".json");
    try { if (t) { const j = typeof t === "string" ? JSON.parse(t) : t; if (j && j.e) return RD[iso] = j.e } } catch (e) {}
    return null;
  }
  async function roadsSet(iso, s) { const j = JSON.parse(s); if (!j || !j.e || (j.iso && j.iso !== iso)) throw 0; await saveFile("roads-" + iso + ".json", s); RD[iso] = j.e; return j.e }
  const cName = () => { const o = $("nsCountry").selectedOptions[0]; return o ? o.textContent : "" };

  /* ---- ממשק החיפוש ---- */
  const row = document.createElement("span");
  row.id = "nsRow"; row.style.display = "contents";
  const kindSel = document.createElement("span"); kindSel.style.display = "contents";
  kindSel.innerHTML = '<select id="nsKind" aria-label="מה לחפש"><option value="st">עיר ורחוב</option><option value="rd">כבישים ראשיים</option><option value="rv">נהרות</option></select>';
  row.innerHTML = '<select id="nsCountry" aria-label="מדינה"></select>'
    + '<input id="nsQ" placeholder="שם או מספר" aria-label="שם הכביש או הנהר" style="width:11em" hidden><button id="nsGo" hidden>חפש</button><span id="rdBox" hidden><button id="rdDl" type="button">הורד כבישי המדינה</button><button id="rdImp" type="button">טען מקובץ</button><button id="rdLink" type="button">העתק קישור</button></span> <small id="nsMsg" aria-live="polite"></small>';
  const res = document.createElement("ul"); res.id = "nsRes"; res.hidden = true;
  /* בשורה אחת: [מה לחפש] [עיר] [רחוב] [מצא] או [מה לחפש] [מדינה] [שם] [חפש] */
  const pl = $("plRow"); pl.insertBefore(kindSel, $("city")); pl.appendChild(row); pl.parentNode.insertBefore(res, pl.nextSibling);
  function fillCountries() {
    const cur = $("nsCountry").value, m = new Map(BASIC.map(c => [c[0], [c[1], c[2]]]));
    if (N && N.c) for (const k in N.c) if (!m.has(k)) m.set(k, N.c[k]);
    if (RIDX) for (const k in RIDX) if (!m.has(k)) m.set(k, [RIDX[k].he || k, RIDX[k].en || k]);
    const arr = [...m].sort((a, b) => a[1][0].localeCompare(b[1][0], "he"));
    $("nsCountry").innerHTML = '<option value="">כל המדינות</option>' + arr.map(([k, v]) => `<option value="${k}" data-en="${v[1]}">${v[0]}</option>`).join("");
    if (cur) $("nsCountry").value = cur;
  }
  fillCountries();
  const st = [$("city"), $("stQ"), $("stGo")];
  function mode() {
    const k = $("nsKind").value, s = k === "st";
    st.forEach(e => { if (e) e.style.display = s ? "" : "none" });
    $("nsCountry").hidden = s; $("nsQ").hidden = s; $("nsGo").hidden = s; res.hidden = s || !res.children.length;
    say("nsMsg", s ? "" : (N ? "" : "קובץ השמות לא הורד: נהרות וכבישים בצפון אמריקה דורשים הורדה בהגדרות. כבישים במדינות אחרות יחפשו דרך האינטרנט."));
  }
  async function rdBox() { const k = $("nsKind").value, c = $("nsCountry").value; $("rdBox").hidden = !(k === "rd" && c) || !!(await roadsLocal(c)) }
  $("nsKind").onchange = () => { mode(); rdBox() }; $("nsCountry").onchange = rdBox; mode();
  $("rdDl").onclick = async () => {
    const c = $("nsCountry").value; if (!c) return; say("nsMsg", "מוריד את כבישי " + cName() + "…");
    try { const j = await getJ(BASE + "roads/" + c + ".json"); if (!j || !j.e) throw 0; await roadsSet(c, JSON.stringify(j)); say("nsMsg", "כבישי " + cName() + " נשמרו ✓ (" + j.e.length + ")"); rdBox() }
    catch (e) { say("nsMsg", "ההורדה עוד חסומה באוצריא: כתובת הקבצים טרם נוספה לרשימת הכתובות המאושרות של אוצריא (בקשה נשלחה). בינתיים: לחצו \"העתק קישור\", הקובץ יורד בדפדפן ולחצו \"טען מקובץ\".") }
  };
  $("rdImp").onclick = async () => {
    const c = $("nsCountry").value; if (!c) return;
    try { const t = await pickText("בחר את הקובץ " + c + ".json"); if (t == null) return; const e = await roadsSet(c, t); say("nsMsg", "נטען ✓ (" + e.length + ")"); rdBox() }
    catch (e) { say("nsMsg", "הקובץ אינו קובץ כבישים תקין של המדינה שנבחרה.") }
  };
  $("rdLink").onclick = () => { const c = $("nsCountry").value; if (!c) return; const u = PAGE + "roads-" + c + ".json"; copyText(u).then(ok => { say("nsMsg", ok ? "הקישור הועתק. פתח אותו במחשב עם אינטרנט, הקובץ יורד מעצמו לתיקיית ההורדות; אחר כך לחצו \"טען מקובץ\" ולחץ \"טען מקובץ\"." : "העתקה אוטומטית נכשלה: " + u); openUrl(u) }) };

  /* ---- חישוב קרבה לקו ---- */
  const parse = s => s.split(";").map(l => l.split(" ").map(p => p.split(",").map(Number)));
  function nearest(lines, p) {
    let best = null; const k = Math.cos(p[0] * Math.PI / 180);
    for (const l of lines) for (let i = 0; i + 1 < l.length; i++) {
      const a = l[i], b = l[i + 1], ax = (a[1] - p[1]) * k, ay = a[0] - p[0], bx = (b[1] - p[1]) * k, by = b[0] - p[0];
      const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy; let t = L ? -(ax * dx + ay * dy) / L : 0; t = Math.max(0, Math.min(1, t));
      const q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], d = dist(p, q);
      if (!best || d < best.d) best = { d, q, h: bearing(a, b) };
    }
    return best;
  }
  const norm = s => (s || "").toLowerCase().replace(/[׳'’"״.\-]/g, "").trim();
  /* 2.8.7: התאמה לפי צליל בין עברית לאנגלית — בקובץ רוב השמות באנגלית בלבד (ירדן ↔ Jordan, נילוס ↔ Nile, דנובה ↔ Danube) */
  const HEB = { "ב": "b", "ג": "g", "ד": "d", "ז": "z", "ח": "k", "ט": "t", "כ": "k", "ך": "k", "ל": "l", "מ": "m", "ם": "m", "נ": "n", "ן": "n", "ס": "s", "פ": "p", "ף": "p", "צ": "s", "ץ": "s", "ק": "k", "ר": "r", "ש": "s", "ת": "t" };
  function skel(s) {
    s = (s || "").toLowerCase().replace(/[׳'’"״.\-]/g, "");
    if (/[\u05d0-\u05ea]/.test(s)) return s.split(/\s+/).map(w => [...w].map((ch, i) => ch === "י" && i === 0 ? "y" : ch === "ו" && i === 0 ? "b" : (HEB[ch] || "")).join("")).join(" ").replace(/(.)\1+/g, "$1").trim();
    return s.replace(/sch|sh|ch(?=[ei])/g, "s").replace(/ch|kh|ck|q|c(?![ei])|x/g, "k").replace(/c/g, "s").replace(/ph|f|v|w/g, m => m === "w" ? "b" : m === "v" ? "b" : "p").replace(/th/g, "t").replace(/j|dj|dzh/g, "y")
      .replace(/g(?=[ei])/g, "g").replace(/z/g, "z").replace(/h/g, "").replace(/(?!^)y|[aeiou]/g, "").replace(/(^|\s)[aeiou]+/g, "$1").replace(/[^a-z ]/g, "").replace(/(.)\1+/g, "$1").trim();
  }
  const HEBN = {"ירדן":"Jordan","נילוס":"Nile","נילוס הלבן":"White Nile","נילוס הכחול":"Blue Nile","דנובה":"Danube","ריין":"Rhine","הדסון":"Hudson","מיסיסיפי":"Mississippi","אמזונס":"Amazonas","אמזונה":"Amazonas","וולגה":"Volga","פרת":"Euphrates","חידקל":"Tigris","טמזה":"Thames","לואר":"Loire","אלבה":"Elbe","ויסלה":"Vistula","דניסטר":"Dniester","דנייסטר":"Dniester","דנייפר":"Dnieper","דון":"Don","אודר":"Oder","פו":"Po","טיבר":"Tiber","מיזורי":"Missouri","אוהיו":"Ohio","סנט לורנס":"St. Lawrence","יאנגצה":"Yangtze","גנגס":"Ganges","גאנגס":"Ganges","אינדוס":"Indus","מקונג":"Mekong","זמבזי":"Zambezi","קונגו":"Congo","ניז'ר":"Niger","ניגר":"Niger","ליטני":"Litani","רון":"Rhône","בוג":"Bug","פוטומק":"Potomac","דלאוור":"Delaware","קולורדו":"Colorado","יוקון":"Yukon","פרנה":"Paraná","אורינוקו":"Orinoco","לנה":"Lena","אמור":"Amur","פריפיאט":"Pripyat","אברו":"Ebro","טאחו":"Tagus","גרון":"Garonne","מיין":"Main","אין":"Inn","סאווה":"Sava","פרוט":"Prut"};
  function soundLike(name, sq) { if (!name || sq.length < 2) return false; const n = skel(name); return n.length >= 2 && (n.includes(sq) || (sq.startsWith(n) && n.length >= sq.length - 1)) }
  const DIRS = ["צפון", "צפון-מזרח", "מזרח", "דרום-מזרח", "דרום", "דרום-מערב", "מערב", "צפון-מערב"];
  const dirName = h => DIRS[Math.round(h / 45) % 8];

  /* 2.9.0: ערים לאורך הקו (cities.js, Natural Earth) — כדי להתמצא: "עובר ליד חרטום, קהיר…" */
  function alongCities(lines, maxKm) {
    const C = typeof KT_CITIES !== "undefined" ? KT_CITIES : null; if (!C) return [];
    let a = 90, b = -90, c = 180, d = -180; for (const l of lines) for (const p of l) { if (p[0] < a) a = p[0]; if (p[0] > b) b = p[0]; if (p[1] < c) c = p[1]; if (p[1] > d) d = p[1] }
    const m = maxKm / 100; const out = [];
    for (const ct of C) {
      if (ct[1] < a - m || ct[1] > b + m || ct[2] < c - m * 1.5 || ct[2] > d + m * 1.5) continue;
      let best = 1e9, at = 0, k = 0;
      for (const l of lines) for (let i = 0; i + 1 < l.length; i++, k++) {
        const A = l[i], B = l[i + 1], cs = Math.cos(ct[1] * Math.PI / 180), ax = (A[1] - ct[2]) * cs, ay = A[0] - ct[1], bx = (B[1] - ct[2]) * cs, by = B[0] - ct[1];
        const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy; let t = L ? -(ax * dx + ay * dy) / L : 0; t = Math.max(0, Math.min(1, t));
        const ex = ax + dx * t, ey = ay + dy * t, dd = Math.sqrt(ex * ex + ey * ey) * 111.2; if (dd < best) { best = dd; at = k + t }
      }
      if (best <= maxKm) out.push({ n: ct[0], p: [ct[1], ct[2]], pop: ct[3], d: best, at });
    }
    return out.sort((x, y) => y.pop - x.pop).slice(0, 8).sort((x, y) => x.at - y.at);
  }

  function show(list) {
    res.innerHTML = ""; res.hidden = !list.length;
    list.slice(0, 30).forEach(e => {
      const lines = typeof e[4] === "string" ? parse(e[4]) : e[4], li = document.createElement("li");
      const kind = e[0] === "w" ? "נהר" : "כביש", nm = e[2] ? e[2] + " (" + e[1] + ")" : e[1];
      const cn = (e[3] || []).map(c => (N && N.c && N.c[c] ? N.c[c][0] : (BASIC.find(b => b[0] === c) || [])[1] || c)).join(", ");
      let h = "<b></b> <small></small>";
      li.innerHTML = h; li.firstChild.textContent = nm; li.lastChild.textContent = " · " + kind + (cn ? " · " + cn : "");
      const info = document.createElement("div"); info.style.fontSize = ".85em";
      const ref = (typeof pos !== "undefined" && pos) ? pos : null;
      let n = ref ? nearest(lines, ref) : null;
      if (!n) { const l = lines[0], i = Math.floor(l.length / 2); n = { d: null, q: l[i], h: bearing(l[Math.max(0, i - 1)], l[Math.min(l.length - 1, i + 1)] || l[i]) } }
      const bj = bearing(n.q, J);
      if (n.d != null) info.textContent = `הנקודה הקרובה: ${n.d < 10 ? n.d.toFixed(1) : Math.round(n.d)} ק"מ ממך. `;
      else info.textContent = "נקודה באמצע הקו. ";
      let rel = (bj - n.h + 360) % 360; if (rel > 180) rel -= 360;
      info.textContent += `כיוון הקו שם בקירוב ${dirName(n.h)}, וירושלים ${Math.abs(Math.round(rel))}° ${rel >= 0 ? "מימין" : "משמאל"} לכיוון הקו (${dirName(bj)} מהנקודה).`;
      const cities = alongCities(lines, e[0] === "w" ? 25 : 12);
      const cdiv = document.createElement("div"); cdiv.className = "nsCities"; cdiv.style.cssText = "font-size:.85em;margin:.15rem 0";
      if (cities.length) {
        cdiv.append(e[0] === "w" ? "זורם ליד: " : "עובר ליד: ");
        cities.forEach((ct, i) => { const cb = document.createElement("button"); cb.type = "button"; cb.className = "chip"; cb.textContent = ct.n; cb.title = "קבע מיקום ב" + ct.n + " (" + Math.round(ct.d) + " ק\"מ מה" + (e[0] === "w" ? "נהר" : "כביש") + ")";
          cb.onclick = () => { hl(); setPos(ct.p, ct.n, null, false); mode2("near"); map(); scrollTo(0, 0) }; if (i) cdiv.append(" · "); cdiv.appendChild(cb) });
        if (ref) { const me = cities.reduce((x, y) => dist(ref, x.p) < dist(ref, y.p) ? x : y); const dm = dist(ref, me.p); if (dm < 300) { const pm = document.createElement("div"); pm.textContent = `העיר הקרובה אליך מביניהן: ${me.n} (${dm < 10 ? dm.toFixed(1) : Math.round(dm)} ק"מ).`; cdiv.appendChild(pm) } }
      }
      const b = document.createElement("button"); b.type = "button"; b.textContent = "קבע מיקום על הנקודה הזו";
      const hl = () => { window.HL = { name: e[2] || e[1] || "", w: e[0] === "w", lines, at: n.q, cities: cities.map(c => ({ n: c.n, p: c.p })) } };
      const mode2 = w => { const mm = $("mapMode"); if (mm && mm.value !== w) { mm.value = w; mm.dispatchEvent(new Event("change")) } };
      b.onclick = () => { hl(); setPos([+n.q[0].toFixed(5), +n.q[1].toFixed(5)], "על " + (e[1] || ""), null, false); mode2("near"); map(); scrollTo(0, 0) };
      const sh = document.createElement("button"); sh.type = "button"; sh.textContent = "הצג במפה";
      sh.onclick = () => { hl(); if (typeof pos !== "undefined" && pos) { mode2(n.d != null && n.d < 120 ? "near" : "far"); map(); $("map").scrollIntoView({ block: "center" }) } else say("nsMsg", "בחר קודם מיקום, כדי שהמפה תוצג.") };
      const cl = document.createElement("button"); cl.type = "button"; cl.textContent = "הסר מהמפה";
      cl.onclick = () => { window.HL = null; if (typeof pos !== "undefined" && pos) map() };
      li.append(info, cdiv, b, sh, cl); res.appendChild(li);
    });
  }

  async function overpass(en, q) {
    const esc = s => s.replace(/[\\"]/g, "");
    const area = en ? `area["boundary"="administrative"]["admin_level"="2"]["name:en"="${esc(en)}"]->.a;` : "";
    const sc = en ? "(area.a)" : "";
    const re = esc(q).replace(/[.*+?^${}()|[\]]/g, "\\$&");
    const data = `[out:json][timeout:25];${area}(way${sc}["highway"~"^(motorway|trunk|primary)$"]["ref"~"(^|;|[^0-9])${re}($|;|[^0-9])"];way${sc}["highway"~"^(motorway|trunk|primary)$"]["name"~"${re}",i];way${sc}["highway"~"^(motorway|trunk|primary)$"]["name:he"~"${re}",i];);out geom 60;`;
    let j = null;
    for (const h of ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]) { try { j = await getJ(h + "?data=" + encodeURIComponent(data)); if (j) break } catch (e) {} }
    if (!j) throw 0;
    const g = new Map();
    (j.elements || []).forEach(w => { if (!w.geometry) return; const t = w.tags || {}, key = t.ref || t.name || ("#" + w.id); const nm = t["name:he"] || t.name || t.ref;
      const e = g.get(key) || ["r", t.ref && t.name ? t.ref + " " + (t["name:he"] || t.name) : (nm || key), "", [], []]; e[4].push(w.geometry.map(p => [p.lat, p.lon])); g.set(key, e) });
    return [...g.values()];
  }

  /* ---- שמירה מקומית של כבישים שנמצאו דרך האינטרנט (roads-cache.json), כדי שיעבדו אחר כך בלי רשת ---- */
  let CACHE = null; const CMAX = 1500000;
  async function cacheLoad() {
    if (CACHE) return CACHE;
    try { const t = await readFile("roads-cache.json"); if (t) CACHE = JSON.parse(t) } catch (e) {}
    if (!CACHE || !CACHE.q) CACHE = { v: 1, q: {} };
    return CACHE;
  }
  function simp(l, tol) {
    if (l.length < 3) return l;
    const keep = new Uint8Array(l.length); keep[0] = keep[l.length - 1] = 1; const st = [[0, l.length - 1]];
    while (st.length) {
      const [a, b] = st.pop(), A = l[a], B = l[b], dx = B[1] - A[1], dy = B[0] - A[0], L = dx * dx + dy * dy; let bd = -1, bi = -1;
      for (let i = a + 1; i < b; i++) { const P = l[i]; let u = L ? ((P[1] - A[1]) * dx + (P[0] - A[0]) * dy) / L : 0; u = Math.max(0, Math.min(1, u));
        const ex = P[1] - A[1] - u * dx, ey = P[0] - A[0] - u * dy, d = ex * ex + ey * ey; if (d > bd) { bd = d; bi = i } }
      if (bd > tol * tol) { keep[bi] = 1; st.push([a, bi], [bi, b]) }
    }
    return l.filter((p, i) => keep[i]);
  }
  async function cachePut(c, nq, ents) {
    const C = await cacheLoad();
    C.q[(c || "*") + "|" + nq] = { d: new Date().toISOString().slice(0, 10), e: ents.map(e => [e[0], e[1], e[2], c ? [c] : (e[3] || []), e[4].map(l => simp(l, .0008).map(p => [+(+p[0]).toFixed(4), +(+p[1]).toFixed(4)]))]) };
    let s = JSON.stringify(C);
    while (s.length > CMAX && Object.keys(C.q).length > 1) { const old = Object.keys(C.q).sort((a, b) => C.q[a].d.localeCompare(C.q[b].d))[0]; delete C.q[old]; s = JSON.stringify(C) }
    await saveFile("roads-cache.json", s);
  }
  async function cacheFind(c, nq) {
    const C = await cacheLoad(), seen = new Set(), out = []; let d = "";
    for (const k in C.q) {
      const it = C.q[k], kc = k.split("|")[0];
      if (c && kc !== c && kc !== "*") continue;
      for (const e of it.e) {
        if (!(norm(e[1]).includes(nq) || norm(e[2]).includes(nq))) continue;
        if (c && kc === "*" && e[3] && e[3].length && !e[3].includes(c)) continue;
        const id = e[1] + "|" + (e[3] || []).join(","); if (seen.has(id)) continue; seen.add(id); out.push(e); if (it.d > d) d = it.d;
      }
    }
    return { out, d };
  }
  if ($("rcClear")) $("rcClear").onclick = async () => { CACHE = { v: 1, q: {} }; await saveFile("roads-cache.json", JSON.stringify(CACHE)); say("rcMsg", "נוקה ✓") };

  async function go() {
    const k = $("nsKind").value, q = $("nsQ").value.trim(), c = $("nsCountry").value, en = $("nsCountry").selectedOptions[0] && $("nsCountry").selectedOptions[0].dataset.en;
    if (!q) { say("nsMsg", "הקלד שם או מספר."); return }
    say("nsMsg", "מחפש…"); res.hidden = true;
    const t = k === "rv" ? "w" : "r", nq = norm(k === "rd" ? q.replace(/^(כביש|דרך|road|route|hwy|highway)\s*/i, "") || q : q);
    let out = [];
    if (N) out = N.e.filter(e => e[0] === t && (!c || (e[3] || []).includes(c)) && (norm(e[1]).includes(nq) || norm(e[2]).includes(nq)))
      .sort((a, b) => (norm(b[1]).startsWith(nq) || norm(b[2]).startsWith(nq)) - (norm(a[1]).startsWith(nq) || norm(a[2]).startsWith(nq)));
    if (N && !out.length && t === "w" && HEBN[q.replace(/^נהר\s+/, "")]) { const en = HEBN[q.replace(/^נהר\s+/, "")]; out = N.e.filter(e => e[0] === "w" && e[1] === en && (!c || (e[3] || []).includes(c))) }
    if (N && !out.length) { const sq = skel(q.replace(/^(נהר|כביש|דרך|שדרות|רחוב)\s+/, "")); if (sq.replace(/ /g, "").length >= 2) out = N.e.filter(e => e[0] === t && (!c || (e[3] || []).includes(c)) && soundLike(e[1], sq))
      .map(e => [e, skel(e[1])]).sort((a, b) => (b[1] === sq) - (a[1] === sq) || b[1].startsWith(sq) - a[1].startsWith(sq) || a[1].length - b[1].length).map(x => x[0]); if (out.length) setTimeout(() => say("nsMsg", "תוצאות לפי צליל השם (רוב השמות בקובץ באנגלית)."), 0) }
    /* 2.9.2: בלי מדינה נבחרת — גם כבישי ישראל המובנים (מספר כביש: "6", "כביש 90") */
    const cc = k === "rd" && !c ? "ISR" : c;
    if (k === "rd" && cc) {
      const ce = await roadsLocal(cc);
      if (ce) out = (c ? out : []).concat(ce.filter(e => norm(e[1]).includes(nq) || norm(e[2]).includes(nq))
        .sort((a, b) => (norm(b[1]) === nq || norm(b[2]) === nq) - (norm(a[1]) === nq || norm(a[2]) === nq) || norm(b[1]).startsWith(nq) - norm(a[1]).startsWith(nq)));
      if (!c) out = out.concat(N ? N.e.filter(e => e[0] === "r" && (norm(e[1]).includes(nq) || norm(e[2]).includes(nq))).filter(e => !/^\d+$/.test(nq) || String(e[1]).split(/[;\s]/).includes(nq)) : []);
      if (/^\d+$/.test(nq)) { const ex = out.filter(e => String(e[1]).split(/[;\s]/).includes(nq)); if (ex.length) out = ex }
      /* 2.9.2: כבישים בעברית — התאמה לפי צליל מול השם באנגלית ("שדרות ברודווי" ↔ Broadway) */
      if (ce && !out.length && /[\u05d0-\u05ea]/.test(q)) { const sq = skel(q.replace(/^(כביש|דרך|שדרות|שדרה|רחוב|כביש מהיר)\s+/, "")); if (sq.replace(/ /g, "").length >= 2) {
        out = ce.filter(e => soundLike(e[1], sq)).map(e => [e, skel(e[1])]).sort((a, b) => (b[1] === sq) - (a[1] === sq) || b[1].startsWith(sq) - a[1].startsWith(sq) || a[1].length - b[1].length).map(x => x[0]).slice(0, 30);
        if (out.length) setTimeout(() => say("nsMsg", "תוצאות לפי צליל השם (שמות הכבישים בקובץ באנגלית)."), 0) } }
    }
    if (!out.length && k === "rd") {
      const hit = await cacheFind(c, nq);
      if (hit.out.length) { out = hit.out; say("nsMsg", "נמצא בשמירה המקומית, מחיפוש קודם דרך האינטרנט (" + hit.d.split("-").reverse().join(".") + ").") }
      else try {
        out = await overpass(c ? en : "", q);
        say("nsMsg", out.length ? "נמצא דרך האינטרנט (OpenStreetMap), ונשמר לשימוש בלי רשת." : "לא נמצאו כבישים. נסה שם אחר או מספר בלבד.");
        if (out.length) cachePut(c, nq, out).catch(() => {});
      } catch (e) { say("nsMsg", c && !(await roadsLocal(c)) ? "אין תוצאות. אפשר להוריד את כבישי המדינה (הכפתור ליד החיפוש), כדי לחפש בלי אינטרנט." : "אין תוצאות בקבצים, והחיפוש דרך האינטרנט לא זמין כרגע.") }
    } else say("nsMsg", out.length ? "" : (N ? "לא נמצאו תוצאות." : "קובץ השמות לא הורד. הורד אותו בהגדרות."));
    show(out);
  }
  $("nsGo").onclick = go; $("nsQ").addEventListener("keydown", e => { if (e.key === "Enter") go() });
  namesLoad(); setTimeout(ridxLoad, 2500);
})();
