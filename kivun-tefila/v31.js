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
  const ICON = { bSet: ["⚙", "הגדרות"], bDl: ["⬇", "הורדות"], bFb: ["ⓘ", "אודות והארות"], bPrint: ["", "הדפסת דף כיוון למקום הנוכחי"] };
  for (const id in ICON) { const b = $(id); if (!b) continue; b.textContent = ICON[id][0]; b.title = ICON[id][1]; b.setAttribute("aria-label", ICON[id][1]); b.classList.add("ico") }
  /* מדפסת: סמל קווי ברור (האימוג'י 🖨 לא ברור בכל מחשב) */
  if ($("bPrint")) $("bPrint").innerHTML = '<svg viewBox="0 0 24 24" width="1.2em" height="1.2em" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/><circle cx="17.5" cy="12" r=".6" fill="currentColor"/></svg>';

  /* הלכות → "תלפיות" (תל שכל פיות פונים אליו, ברכות ל ע"א); מניינים → סמל בית כנסת */
  if ($("bHal")) { $("bHal").textContent = "תלפיות"; $("bHal").title = "הלכות כיוון התפילה" }
  if ($("bMin")) { const m = $("bMin"); m.classList.add("ico"); m.title = "מניינים קרובים (קו טלפוני)"; m.setAttribute("aria-label", "מניינים קרובים");
    m.innerHTML = '<svg viewBox="0 0 24 24" width="1.25em" height="1.25em" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 21V10l9-6 9 6v11z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/><path d="M12 7.2l1.6 2.8h-3.2zM12 12.4l-1.6-2.8h3.2z"/></svg>' }

  /* ---------- 6. הביקורים בכותל — כפתור וחלונית משלהם ---------- */
  const ks = $("kvSum");
  if (ks && bar) {
    const vb = ks.parentNode, em = vb.nextElementSibling;
    const vp = document.createElement("div"); vp.id = "visits"; vp.className = "pop"; vp.hidden = true; ($("dlp") || set).after(vp);
    vp.appendChild(vb); if (em && /עינים למקרא/.test(em.textContent)) vp.appendChild(em);
    const bv = document.createElement("button"); bv.id = "bVis"; bv.type = "button"; bv.className = "sec ico"; bv.textContent = "🗓"; bv.title = "הביקורים שלי בכותל"; bv.setAttribute("aria-label", "הביקורים שלי בכותל"); bv.setAttribute("aria-expanded", "false");
    $("bKria").after(bv);
    if (typeof PANELS === "object") PANELS.visits = "bVis";
    bv.onclick = () => pop("bVis", "visits", $("visits").hidden);
    addEventListener("keydown", e => { if (e.key === "Escape" && !vp.hidden) pop("bVis", "visits", false) });
  }

  /* ---------- 4. הרחבת חלוניות צד ---------- */
  ["help", "set", "dlp", "visits", "fb", "hal", "fly", "minyan", "kotel"].forEach(id => {
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
    ["mapMode", "zIn", "zOut", "zReset", "zFull"].forEach(i => { const e = $(i); if (e) { tool.appendChild(e); if (e.__btn) tool.appendChild(e.__btn) } });
    wrap.append(tool, map); const rr = $("stRotRow"); if (rr) wrap.appendChild(rr);
  }
})();
