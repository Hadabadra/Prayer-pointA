/* כיוון תפילה 3.8.0 (בקשות 03.11.2026, kivun-tefila-docs/REQUESTS-2026-11-03.md)
   1. מצב טיסה: מסלול משוער (ב-fly.js — flyPath/flyS), והמטוס עליו.
   2. צבעים: "צבעוני" חל גם על המפות (הסביבה הקרובה / עד ירושלים), ובכדור היבשה ממולאת בירוק-חום.
   3. תפילה: בלי סידורון תואם — הנוסח נטען אוטומטית מספריית אוצריא; בסרגל החלון: "מאוצריא", בחירת סידור ותפילה, הקודמת/הבאה.
   4. המלצה על "אחת שאלתי" (רכיב משותף shared/promo, מקור: Hadabadra/KLI-MULON).
   5. הגדרה: כיתוב מתחת לסמלים; בלעדיה — כל הכפתורים בסרגל כסמלים (גם מיקום משוער, חיפוש, מפה/כדור).
   6. כל הנתונים בקובץ אחד: הורדה וטעינה.
   7. דיווח קריסה: הרכיב המשותף shared/report (feedback.report, סוג crash; אוצריא תמיד מבקשת אישור). */
(function () {
  const $ = id => document.getElementById(id), O = window.Otzaria;
  const VER = "3.8.0";
  const dat = r => r && typeof r === "object" && "data" in r ? r.data : r;
  const ls = { get: k => { try { return localStorage.getItem(k) } catch (e) { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) {} } };
  const sget = async k => { const l = ls.get(k); if (!O) return l; try { const r = await O.call("storage.get", { key: k }); const v = r && (r.value ?? (r.data && (r.data.value ?? r.data))); return typeof v === "string" ? v : l } catch (e) { return l } };
  const sset = (k, v) => { ls.set(k, v); if (O) O.call("storage.set", { key: k, value: v }).catch(() => {}) };
  const setPanel = $("set");
  const addSetRow = (html, id) => { if (!setPanel || $(id)) return null; const d = document.createElement("div"); d.className = "setrow"; d.innerHTML = html; const ref = setPanel.querySelector(".setrow"); ref ? ref.parentNode.insertBefore(d, ref) : setPanel.appendChild(d); return d };

  /* ---------- 2. צבעים במפה ---------- */
  {
    const sel = $("globeColor");
    if (sel) {
      const lb = sel.closest("label"); if (lb && lb.firstChild && lb.firstChild.nodeType === 3) lb.firstChild.textContent = "צבעי המפה והכדור: ";
      sel.options[0].textContent = "חום-לבן (רגיל)"; sel.options[1].textContent = "צבעוני: ים כחול, יבשה ירוקה-חומה";
      const apply = () => { const m = $("map"); if (m) m.classList.toggle("kcolor", sel.value === "color" && $("mapMode").value !== "street") };
      sel.addEventListener("change", () => { apply(); if (typeof pos !== "undefined" && pos && typeof map === "function") map() });
      $("mapMode").addEventListener("change", apply);
      new MutationObserver(apply).observe(sel, { attributes: true, childList: true }); setInterval(apply, 1500); apply();
    }
    /* כדור צבעוני: יבשה ממולאת (טבעות היבשה, נקודות בצד הנסתר מוצמדות לקו האופק) */
    if (typeof globeMap === "function") {
      const orig = globeMap;
      globeMap = function () {
        orig();
        const sel2 = $("globeColor"); if (!sel2 || sel2.value !== "color" || typeof flyRings !== "function") return;
        const svg = $("map"), vb = svg.viewBox.baseVal, W = vb && vb.width || 400, Hh = vb && vb.height || 320, cx = (vb ? vb.x : 0) + W / 2, cy = (vb ? vb.y : 0) + Hh / 2;
        const m = gc(pos, J, .5), c0 = Math.max(-89, Math.min(89, m[0] + GL.dla)) * R, l0 = (m[1] + GL.dlo) * R, r = Math.min(W, Hh) * .45 * (typeof zoom === "number" ? zoom : 1);
        const pr = q => { const f = q[0] * R, l = q[1] * R - l0; let x = r * Math.cos(f) * Math.sin(l), y = -r * (Math.cos(c0) * Math.sin(f) - Math.sin(c0) * Math.cos(f) * Math.cos(l)); const z = Math.sin(c0) * Math.sin(f) + Math.cos(c0) * Math.cos(f) * Math.cos(l);
          if (z < 0) { const k = r / (Math.hypot(x, y) || 1); x *= k; y *= k } return [cx + x, cy + y, z] };
        let d = "";
        for (const g of flyRings()) { const P = g.map(pr); if (!P.some(p => p[2] > 0)) continue; d += "M" + P.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L") + "Z" }
        const kids = svg.children; if (kids.length < 3) return;
        kids[2].insertAdjacentHTML("beforebegin", `<path d="${d}" fill="#a9c47f" stroke="none" pointer-events="none"/>`);
      };
    }
  }

  /* ---------- 3. תפילה ---------- */
  {
    const tb = $("bTfila"), SID = "com.moshenahari.siduron";
    if (tb) { tb.title = "סידור: התפילה על רקע הכותל (מסידורון, או מסידור שבספריית אוצריא)"; }
    let sidOK = null;
    async function hasSid() {
      if (!O) return false; if (sidOK != null) return sidOK;
      try { const l = dat(await O.call("plugin.listInstalled")) || []; const s = l.find(x => (x.pluginId || x.id) === SID); sidOK = !!(s && !/^3\.[0-6]\./.test(s.version || "") && s.version !== "3.7.0" && s.version !== "3.7.1") } catch (e) { sidOK = false }
      return sidOK;
    }
    const L = () => window.ktLib;
    async function fromLib(pi) {
      const lib = L(), ov = $("tfila"); if (!lib) return;
      ov.hidden = false; const x = $("tfText"), bs = $("tfBook"), ps = $("tfPr");
      if (pi != null) ps.value = String(pi);
      const books = await lib.findSiddurs(); fillBooks(books);
      if (!books.length) { $("tfTitle").textContent = "תפילה"; x.innerHTML = "<p>לא נמצא סידור בספריית אוצריא. אפשר להוריד סידור לספרייה, או להתקין את סידורון.</p>"; return }
      const b = books[+bs.value] || books[0]; lib.pref = b.title;
      x.innerHTML = "<p>קורא את " + esc(lib.PRAY[+ps.value][0]) + " מתוך " + esc(b.title) + "…</p>";
      try { const r = await lib.readPrayer(b, +ps.value); if (!r.text) throw 0; $("tfTitle").textContent = r.title; x.textContent = r.text; x.scrollTop = 0 }
      catch (e) { x.innerHTML = "<p>לא נמצאה התפילה בסידור הזה. בחרו סידור אחר ברשימה למעלה.</p>" }
    }
    function fillBooks(books) {
      const bs = $("tfBook"); if (!bs || bs.dataset.n == books.length) return; bs.dataset.n = books.length;
      bs.innerHTML = books.length ? books.map((b, i) => `<option value="${i}">${esc(b.title)}</option>`).join("") : "<option>אין סידור בספרייה</option>";
      const i = books.findIndex(b => b.title === L().pref); if (i >= 0) bs.value = String(i);
    }
    function bar() {
      const row = $("tfBox") && $("tfBox").querySelector(".row"); if (!row || $("tfLib") || !O || !L()) return;
      const lib = L();
      row.insertAdjacentHTML("beforeend", `<span class="tfnav"><button id="tfLib" type="button" title="הנוסח מסידור שבספריית אוצריא">📚 מאוצריא</button>`
        + `<select id="tfBook" aria-label="סידור"><option>סידור…</option></select><select id="tfPr" aria-label="תפילה">${lib.PRAY.map((p, i) => `<option value="${i}">${p[0]}</option>`).join("")}</select>`
        + `<button id="tfPrev" type="button" title="התפילה הקודמת" aria-label="התפילה הקודמת">›</button><button id="tfNext" type="button" title="התפילה הבאה" aria-label="התפילה הבאה">‹</button></span>`);
      $("tfPr").value = String(lib.which());
      $("tfLib").onclick = () => fromLib();
      $("tfBook").onchange = () => fromLib(); $("tfPr").onchange = () => fromLib();
      $("tfPrev").onclick = () => fromLib((+$("tfPr").value + lib.PRAY.length - 1) % lib.PRAY.length);
      $("tfNext").onclick = () => fromLib((+$("tfPr").value + 1) % lib.PRAY.length);
      const sb = $("tfSid"); if (sb) sb.textContent = "📖 סידורון";
    }
    setTimeout(bar, 0);
    if (tb && O) {
      const orig = tb.onclick;
      tb.onclick = async e => { bar(); if (await hasSid()) return orig && orig.call(tb, e); fromLib() };
      /* סידורון לא החזיר תפילה (ההודעה "כדי להציג כאן תפילה") → מיד מהספרייה */
      const t = $("tfText"); let auto = 0;
      if (t) new MutationObserver(() => { if (/כדי להציג כאן תפילה/.test(t.textContent) && Date.now() - auto > 4000) { auto = Date.now(); fromLib() } }).observe(t, { childList: true });
    }
  }

  /* ---------- 4. המלצה על "אחת שאלתי" ---------- */
  if (window.AchatPromo && O) {
    try {
      const call = (m, p) => O.call(m, p).then(r => r && typeof r === "object" && "success" in r ? r : { success: true, data: r }, () => ({ success: false }));
      AchatPromo.init({ call, plugin: "כיוון תפילה", links: { gh: "https://github.com/Hadabadra/Prayer-pointA/releases/latest", store: "https://otzaria.org/plugins/6ac80057bd083fcc18562fa0" } });
      const r = addSetRow(AchatPromo.settingsHtml(), "ap-sw"); if (r) AchatPromo.bind(r);
      const fb = $("fb"); if (fb && !fb.querySelector("[data-ap-about]")) { fb.insertAdjacentHTML("beforeend", AchatPromo.aboutHtml()); AchatPromo.bind(fb) }
      setTimeout(() => { if (!$("splash") || $("splash").hidden || getComputedStyle($("splash")).display === "none") AchatPromo.maybeShow(); else setTimeout(() => AchatPromo.maybeShow(), 15000) }, 4000);
    } catch (e) {}
  }

  /* ---------- 5. כיתוב מתחת לסמלים ---------- */
  {
    const K = "kivun-labels";
    const row = addSetRow('<label class="lbsw"><input type="checkbox" id="lblSw"> כיתוב מתחת לסמלים בסרגל העליון <small>(בלי הסימון: סמלים בלבד, והשם מופיע במעבר העכבר)</small></label>', "lblSw");
    const apply = on => { document.body.classList.toggle("klabels", on); document.body.classList.toggle("kicons", !on); const c = $("lblSw"); if (c) c.checked = on };
    apply(ls.get(K) === "1");
    sget(K).then(v => apply(v === "1"));
    if (row) $("lblSw").onchange = e => { sset(K, e.target.checked ? "1" : "0"); apply(e.target.checked) };
    /* מיקום משוער, חיפוש ומפה/כדור — גם הם עם title, כדי שבמצב סמלים יופיע השם */
    for (const id of ["bOn", "bManT", "bFind", "methBtn"]) { const b = $(id); if (b && !b.title) b.title = b.textContent.trim() }
  }

  /* ---------- 6. כל הנתונים בקובץ אחד ---------- */
  {
    const U = "https://github.com/Hadabadra/Prayer-pointA/releases/download/kivun-tefila-data/kivun-tefila-all-data.json";
    const host = $("dataLink") && $("dataLink").closest(".dlitem");
    if (host && !$("allDl")) {
      host.insertAdjacentHTML("beforebegin", `<div class="dlitem"><b>כל הנתונים בקובץ אחד</b> <small>kivun-tefila-all-data.json, כ-6MB: שמות, נהרות, כבישים ושכבות לכל המדינות. כל קובץ של התוסף מתחיל ב-kivun-tefila-</small>
        <div class="row"><button id="allDl" type="button">הורד</button><button id="allImp" type="button">טען את כל הנתונים מקובץ</button><button id="allLink" type="button">העתק קישור</button> <small id="allMsg"></small></div></div>`);
      const say = t => { $("allMsg").textContent = t };
      $("allDl").onclick = () => { if (O) O.call("app.openUrl", { url: U }).then(r => { if (r && r.success === false) throw 0; say("נפתח בדפדפן. אחרי ההורדה: \"טען את כל הנתונים מקובץ\"") }).catch(() => { navigator.clipboard && navigator.clipboard.writeText(U); say("הקישור הועתק") }); else window.open(U) };
      $("allLink").onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(U) : Promise.reject()).then(() => say("הקישור הועתק. פתחו אותו במחשב עם אינטרנט, שמרו, והעבירו לכאן."), () => say(U)) };
      $("allImp").onclick = async () => {
        try {
          const t = window.ktPickText ? await window.ktPickText("בחר את הקובץ kivun-tefila-all-data.json") : null; if (t == null) return;
          const j = JSON.parse(t); if (!j || !j.kivunTefilaData || !j.files) throw 0;
          let n = 0; const isos = [];
          for (const [name, s] of Object.entries(j.files)) {
            if (!/^(geo-names|geo-extra|roads-[A-Za-z]+|layers-[A-Za-z]+|roads-index|layers-index)\.json$/.test(name)) continue;
            say("שומר " + (++n) + "…");
            if (O) await O.call("fs.writeFile", { path: name, content: s }); else ls.set("kivun-" + name, s);
            const m = name.match(/^layers-([A-Z]{3})\.json$/); if (m) isos.push(m[1]);
          }
          try { const a = JSON.parse(ls.get("kivun-layers-isos") || "[]"); for (const c of isos) if (!a.includes(c)) a.push(c); ls.set("kivun-layers-isos", JSON.stringify(a)) } catch (e) {}
          say("נשמרו " + n + " קבצים ✓ — טוען מחדש…"); setTimeout(() => location.reload(), 1200);
        } catch (e) { say("הקובץ אינו קובץ \"כל הנתונים\" של כיוון תפילה.") }
      };
    }
  }

  /* ---------- 7. דיווח קריסה — הרכיב המשותף shared/report/crash-report.js (מקור: Hadabadra/Mikvaot/shared/report) ---------- */
  if (window.CrashReport && O) {
    try { CrashReport.init({ call: (m, p) => O.call(m, p), plugin: "כיוון תפילה", version: VER }) } catch (e) {}
  }
})();
