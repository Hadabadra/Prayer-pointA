/* כיוון תפילה 3.1.0 — משוב 21.10.2026:
   1. מקומות שמורים בתוך "מה לחפש" (ליד עיר ורחוב / כבישים / נהרות), כל מקום כפתור עם סמל פח; מעבר בין מקומות שמורים תמיד עובד.
   2. הגדרות לחוד, הורדות בחלונית משלהן, "הארות" → "אודות" (מה חדש, היכולות, אודות, שליחת הארה).
   3. כפתורי הגדרות/הורדות/אודות/הדפסה כסמלים (עם תיאור במעבר העכבר).
   4. כפתור הרחבה לכל חלונית צד.
   5. כפתורי המפה צפים בתוך המפה גם בתצוגה הרגילה. */
(function () {
  const $ = id => document.getElementById(id);

  /* ---------- 1. מקומות שמורים ---------- */
  const kind = $("nsKind"), pl = $("pl");
  if (kind && pl) {
    const o = new Option("מקומות שמורים", "pl"); kind.insertBefore(o, kind.options[1] || null);
    const chips = document.createElement("span"); chips.id = "plChips"; chips.hidden = true;
    const row = $("plRow"); row.insertBefore(chips, $("plName"));
    let cur = null;
    const near = (p, q) => p && q && Math.abs(p[0] - q.lat) < 2e-5 && Math.abs(p[1] - q.lon) < 2e-5;
    function go(i) { pl.value = String(i); cur = i; pl.onchange && pl.onchange(); draw() }
    function draw() {
      chips.replaceChildren();
      if (cur != null && !(places[cur] && near(typeof pos !== "undefined" ? pos : null, places[cur]))) cur = null;
      if (!places.length) { const s = document.createElement("small"); s.textContent = "אין עדיין מקומות שמורים. בחר מיקום, תן לו שם ולחץ \"שמור מיקום זה\"."; chips.appendChild(s) }
      places.forEach((p, i) => {
        const w = document.createElement("span"); w.className = "plc" + (i === cur ? " on" : "");
        const b = document.createElement("button"); b.type = "button"; b.textContent = p.n; b.title = "עבור אל " + p.n; b.onclick = () => go(i);
        const d = document.createElement("button"); d.type = "button"; d.className = "plx"; d.textContent = "🗑"; d.title = "מחק את " + p.n; d.setAttribute("aria-label", "מחק את " + p.n);
        d.onclick = () => { if (!confirm("למחוק את \"" + p.n + "\" מהמקומות השמורים?")) return; places.splice(i, 1); plStore(); if (cur === i) cur = null; else if (cur > i) cur--; pl.value = ""; plFill() };
        w.append(b, d); chips.appendChild(w);
      });
    }
    const pf = plFill; plFill = function () { pf.apply(this, arguments); draw() };
    const sp = setPos; setPos = function () { const r = sp.apply(this, arguments); if (cur != null && !near(pos, places[cur])) { cur = null; pl.value = ""; draw() } return r };
    const ps = $("plSave").onclick; $("plSave").onclick = function () { ps.apply(this, arguments); cur = places.length - 1; draw() };
    function mode() {
      const on = kind.value === "pl";
      chips.hidden = !on; $("plName").hidden = !on; $("plSave").hidden = !on; if (on && $("nsMsg")) $("nsMsg").textContent = "";
      if (on) ["city", "stQ", "stGo", "nsCountry", "nsQ", "nsGo", "rdBox", "nsRes"].forEach(i => { const e = $(i); if (e) { if (i === "city" || i === "stQ" || i === "stGo") e.style.display = "none"; else e.hidden = true } });
    }
    kind.addEventListener("change", mode); mode(); draw();
  }

  /* ---------- 2. הגדרות / הורדות / אודות ---------- */
  const bar = $("bar"), set = $("set"), fb = $("fb");
  if (bar && set && fb) {
    const bDl = document.createElement("button"); bDl.id = "bDl"; bDl.type = "button"; bDl.setAttribute("aria-expanded", "false"); bDl.setAttribute("aria-controls", "dlp"); bDl.classList.add("sec");
    $("bSet").before(bDl);
    const dlp = document.createElement("div"); dlp.id = "dlp"; dlp.className = "pop"; dlp.hidden = true; set.after(dlp);
    const h = document.createElement("h3"); h.textContent = "הורדות"; h.className = "ph"; dlp.appendChild(h);
    /* כל מה שקשור להורדת נתונים עובר לחלונית ההורדות */
    const dls = $("dls"); if (dls) { dls.open = true; dlp.appendChild(dls) }
    [...set.querySelectorAll(":scope > details.sd > summary")].forEach(s => { if (/מפת רחובות/.test(s.textContent)) dlp.appendChild(s.parentNode) });
    ["stRad", "stLang"].forEach(i => { const e = $(i); const r = e && e.closest(".setrow"); if (r) dlp.appendChild(r) });
    const emb = $("stEmbBox"); if (emb) dlp.appendChild(emb);
    [...set.querySelectorAll(":scope > details.sd > summary")].forEach(s => { if (/מוכנים בתוסף|אזורים מובנים/.test(s.textContent)) dlp.appendChild(s.parentNode) });
    if (typeof PANELS === "object") PANELS.dlp = "bDl";
    bDl.onclick = () => { const o = dlp.hidden; pop("bDl", "dlp", o) };
    /* אודות = מה חדש, כל היכולות, מתוכנן, אודות וכלים, ושליחת הארה */
    const ah = document.createElement("h3"); ah.className = "ph"; ah.textContent = "שליחת הארה למפתח"; fb.prepend(ah);
    const box = document.createElement("div"); box.id = "aboutBox"; fb.prepend(box);
    const t = document.createElement("h3"); t.className = "ph"; t.textContent = "אודות כיוון תפילה"; box.appendChild(t);
    [...set.querySelectorAll(":scope > details")].forEach(d => { const s = d.querySelector("summary"); if (s && /מה חדש|כל היכולות|מתוכנן|אודות/.test(s.textContent)) box.appendChild(d) });
    const ag = $("newsAgain"); if (ag) box.appendChild(ag.closest("p") && ag.closest("p").parentNode === set ? ag.closest("p") : ag);
    const sf = $("setFb"); if (sf) sf.hidden = true;
    $("bFb").onclick = () => { const o = fb.hidden; pop("bFb", "fb", o) };
    addEventListener("keydown", e => { if (e.key === "Escape" && !dlp.hidden) pop("bDl", "dlp", false) });
  }

  /* ---------- 3. סמלים בסרגל ---------- */
  const ICON = { bSet: ["⚙", "הגדרות"], bDl: ["⬇", "הורדות"], bFb: ["ⓘ", "אודות והארות"], bPrint: ["🖨", "הדפסת דף כיוון למקום הנוכחי"] };
  for (const id in ICON) { const b = $(id); if (!b) continue; b.textContent = ICON[id][0]; b.title = ICON[id][1]; b.setAttribute("aria-label", ICON[id][1]); b.classList.add("ico") }

  /* ---------- 4. הרחבת חלוניות צד ---------- */
  ["help", "set", "dlp", "fb", "hal", "fly", "minyan", "kotel"].forEach(id => {
    const p = $(id); if (!p) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "wideb"; b.textContent = "⇔"; b.title = "הרחב / צמצם את החלונית"; b.setAttribute("aria-label", "הרחב את החלונית");
    b.onclick = () => { const w = p.classList.toggle("wide"); b.setAttribute("aria-label", w ? "צמצם את החלונית" : "הרחב את החלונית"); document.body.classList.toggle("sidewide", w) };
    p.prepend(b);
  });

  /* ---------- 5. כפתורי המפה בתוך המפה ---------- */
  const map = $("map");
  if (map) {
    const wrap = document.createElement("div"); wrap.id = "mapWrap"; map.before(wrap);
    const tool = document.createElement("div"); tool.id = "mapTool";
    ["mapMode", "zIn", "zOut", "zReset", "zFull"].forEach(i => { const e = $(i); if (e) tool.appendChild(e) });
    wrap.append(tool, map); const rr = $("stRotRow"); if (rr) wrap.appendChild(rr);
  }
})();
