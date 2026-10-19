/* כיוון תפילה 2.4.0 — חיפוש כבישים ראשיים ונהרות, בחירת מדינה, וטעינת קבצים מהגדרות.
   נתונים: Natural Earth (נחלת הכלל). נהרות בעלי שם בכל העולם; כבישים בעלי שם בצפון אמריקה.
   כבישים במדינות אחרות: חיפוש דרך Overpass (OpenStreetMap) כשיש אינטרנט. נשלחים החוצה רק טקסט החיפוש ושם המדינה. */
(function () {
  const $ = id => document.getElementById(id), O = window.Otzaria;
  const BASE = "https://raw.githubusercontent.com/e0548433917-gif/otzaria/%D7%9B%D7%99%D7%95%D7%95%D7%9F-%D7%AA%D7%A4%D7%99%D7%9C%D7%94/kivun-tefila-data/";
  const PAGE = "https://github.com/e0548433917-gif/otzaria/raw/%D7%9B%D7%99%D7%95%D7%95%D7%9F-%D7%AA%D7%A4%D7%99%D7%9C%D7%94/kivun-tefila-data/";
  const dat = r => r && (r.data !== undefined ? r.data : r);
  const say = (id, t) => { const e = $(id); if (e) e.textContent = t };
  const BASIC = [["ISR", "ישראל", "Israel"], ["USA", "ארצות הברית", "United States of America"], ["CAN", "קנדה", "Canada"], ["MEX", "מקסיקו", "Mexico"], ["GBR", "בריטניה", "United Kingdom"], ["FRA", "צרפת", "France"], ["DEU", "גרמניה", "Germany"], ["BEL", "בלגיה", "Belgium"], ["NLD", "הולנד", "Netherlands"], ["CHE", "שווייץ", "Switzerland"], ["AUT", "אוסטריה", "Austria"], ["ITA", "איטליה", "Italy"], ["ESP", "ספרד", "Spain"], ["UKR", "אוקראינה", "Ukraine"], ["RUS", "רוסיה", "Russia"], ["POL", "פולין", "Poland"], ["HUN", "הונגריה", "Hungary"], ["ARG", "ארגנטינה", "Argentina"], ["BRA", "ברזיל", "Brazil"], ["AUS", "אוסטרליה", "Australia"], ["ZAF", "דרום אפריקה", "South Africa"], ["MAR", "מרוקו", "Morocco"], ["JOR", "ירדן", "Jordan"], ["EGY", "מצרים", "Egypt"], ["TUR", "טורקיה", "Turkey"]];

  /* קבצי טקסט: אוצריא (בחירת קובץ) או דפדפן */
  async function pickText(title) {
    if (O) { const r = dat(await O.call("fs.pickUserFile", { title })); if (!r || r.cancelled) return null; return dat(await O.call("fs.readTextFile", { token: r.token })) }
    return new Promise(res => { const f = document.createElement("input"); f.type = "file"; f.accept = ".json,application/json"; f.onchange = () => f.files[0] ? f.files[0].text().then(res) : res(null); f.click() });
  }
  async function saveFile(name, s) { try { O ? await O.call("fs.writeFile", { path: name, content: s }) : localStorage.setItem("kivun-" + name, s) } catch (e) {} }
  async function readFile(name) { try { return O ? dat(await O.call("fs.readFile", { path: name })) : localStorage.getItem("kivun-" + name) } catch (e) { return null } }
  const openUrl = u => { let w = null; try { w = window.open(u, "_blank", "noopener") } catch (e) {} if (!w && O) O.call("app.openUrl", { url: u }).catch(() => {}) };
  function link(btn, msg, url, what) {
    $(btn).onclick = () => { copyText(url).then(ok => { say(msg, ok ? "הקישור הועתק. פתח אותו במחשב עם אינטרנט ושמור את הקובץ (Ctrl+S)." : "העתקה אוטומטית נכשלה: " + url); openUrl(url) }) };
  }

  /* ---- שמות נהרות וכבישים ---- */
  let N = null;
  function setNames(j) { N = j; say("namesMsg", "נטען ✓"); fillCountries() }
  async function namesLoad() { const t = await readFile("geo-names.json"); try { if (t) setNames(typeof t === "string" ? JSON.parse(t) : t) } catch (e) {} }
  $("namesDl").onclick = async () => {
    say("namesMsg", "מוריד…");
    try { const j = await getJ(BASE + "geo-names.json"); if (!j || !j.e) throw 0; await saveFile("geo-names.json", JSON.stringify(j)); setNames(j) }
    catch (e) { say("namesMsg", "ההורדה נכשלה (אין חיבור, או שהכתובת עוד לא אושרה באוצריא). לחץ \"העתק קישור\", הורד במחשב אחר ולחץ \"טען מקובץ\".") }
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

  /* ---- ממשק החיפוש ---- */
  const row = document.createElement("div");
  row.className = "row"; row.id = "nsRow";
  row.innerHTML = '<select id="nsKind" aria-label="מה לחפש"><option value="st">עיר ורחוב</option><option value="rd">כבישים ראשיים (בין-עירוניים)</option><option value="rv">נהרות</option></select>'
    + '<select id="nsCountry" aria-label="מדינה"></select>'
    + '<input id="nsQ" placeholder="שם או מספר" aria-label="שם הכביש או הנהר" style="width:11em" hidden><button id="nsGo" hidden>חפש</button> <small id="nsMsg" aria-live="polite"></small>';
  const res = document.createElement("ul"); res.id = "nsRes"; res.hidden = true;
  const pl = $("plRow"); pl.parentNode.insertBefore(row, pl.nextSibling); row.parentNode.insertBefore(res, row.nextSibling);
  function fillCountries() {
    const cur = $("nsCountry").value, m = new Map(BASIC.map(c => [c[0], [c[1], c[2]]]));
    if (N && N.c) for (const k in N.c) if (!m.has(k)) m.set(k, N.c[k]);
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
  $("nsKind").onchange = mode; mode();

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
  const DIRS = ["צפון", "צפון-מזרח", "מזרח", "דרום-מזרח", "דרום", "דרום-מערב", "מערב", "צפון-מערב"];
  const dirName = h => DIRS[Math.round(h / 45) % 8];

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
      const b = document.createElement("button"); b.type = "button"; b.textContent = "קבע מיקום על הנקודה הזו";
      b.onclick = () => { setPos([+n.q[0].toFixed(5), +n.q[1].toFixed(5)], "על " + (e[1] || ""), null, false); scrollTo(0, 0) };
      li.append(info, b); res.appendChild(li);
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

  async function go() {
    const k = $("nsKind").value, q = $("nsQ").value.trim(), c = $("nsCountry").value, en = $("nsCountry").selectedOptions[0] && $("nsCountry").selectedOptions[0].dataset.en;
    if (!q) { say("nsMsg", "הקלד שם או מספר."); return }
    say("nsMsg", "מחפש…"); res.hidden = true;
    const t = k === "rv" ? "w" : "r", nq = norm(q);
    let out = [];
    if (N) out = N.e.filter(e => e[0] === t && (!c || (e[3] || []).includes(c)) && (norm(e[1]).includes(nq) || norm(e[2]).includes(nq)))
      .sort((a, b) => (norm(b[1]).startsWith(nq) || norm(b[2]).startsWith(nq)) - (norm(a[1]).startsWith(nq) || norm(a[2]).startsWith(nq)));
    if (!out.length && k === "rd") {
      try { out = await overpass(c ? en : "", q); say("nsMsg", out.length ? "נמצא דרך האינטרנט (OpenStreetMap)." : "לא נמצאו כבישים. נסה שם אחר או מספר בלבד.") }
      catch (e) { say("nsMsg", "אין תוצאות בקובץ השמות, והחיפוש דרך האינטרנט לא זמין כרגע.") }
    } else say("nsMsg", out.length ? "" : (N ? "לא נמצאו תוצאות." : "קובץ השמות לא הורד. הורד אותו בהגדרות."));
    show(out);
  }
  $("nsGo").onclick = go; $("nsQ").addEventListener("keydown", e => { if (e.key === "Enter") go() });
  namesLoad();
})();
