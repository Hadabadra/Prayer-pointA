/* כיוון תפילה 3.9.0 (05.11.2026, kivun-tefila-docs/PLAN-3.9.md)
   1. "מפה מאוחדת" — המפה המשותפת (Hadabadra/Mikvaot shared/map-core, PLAN-3.0 שלב 6) במסך מלא,
      עם jerusalem:true (קו וחץ לירושלים, גם בכדור) ומיקום המשתמש. כל המפות, המצבים והכפתורים הקיימים נשארים.
      הרחובות המובנים של כיוון תפילה (st-NN.js) נטענים גם בה, בלי אינטרנט.
   2. אוצריא 0.9.98.3: כפתור "כיוון לירושלים" בשדות החיפוש של אוצריא (מוצג רק כשיש טקסט) — עיר או רחוב מהשדה.
   3. plugin.setRestoreState: כרטיסייה שאוצריא פינתה או טענה מחדש חוזרת לאותה תצוגה (ולמפה המאוחדת אם הייתה פתוחה). */
(function () {
  const $ = id => document.getElementById(id), O = window.Otzaria, SELF = "com.shiachrina.kivuntefila";
  const REPO = "https://github.com/Hadabadra/Prayer-pointA";
  const call = (m, p) => O ? O.call(m, p) : Promise.resolve({ success: false });
  const openUrl = u => { if (O) O.call("app.openUrl", { url: u }).catch(() => {}); else try { open(u, "_blank", "noopener") } catch (e) {} };
  const getPos = () => { try { return typeof pos !== "undefined" && pos ? pos : null } catch (e) { return null } };
  let online = navigator.onLine !== false;
  if (O) call("app.getConnectivity").then(r => { const d = r && (r.data || r); if (d && d.isOfflineMode != null) online = d.isOfflineMode !== true }).catch(() => {});

  /* ---------- 1. רחובות מובנים למפה המאוחדת ---------- */
  /* map-ui (builtinStreets) מחפש את העיר הקרובה ב-STREET_CITIES ואת הנתונים ב-STREETS[slug].
     כאן ה-slug הוא מפתח האזור של כיוון תפילה, והנתונים נטענים מקובצי st-NN.js הקיימים — בלי עותק נוסף. */
  function streetsBridge() {
    if (window.__ktStreets || typeof EMB === "undefined" || !Array.isArray(EMB)) return;
    window.__ktStreets = 1;
    const cities = {};
    for (const e of EMB) cities[e.name] = { slug: e.k, lat: e.lat, lon: e.lon };
    window.STREET_CITIES = Object.assign({}, window.STREET_CITIES || {}, cities);
    const loading = {};
    window.STREETS = new Proxy({}, {
      get(t, k) {
        if (typeof k !== "string") return undefined;
        if (typeof EMB_DATA !== "undefined" && EMB_DATA[k]) return EMB_DATA[k];
        const e = EMB.find(a => a.k === k);
        if (e && !loading[k] && typeof stLoadEmb === "function") { loading[k] = 1; stLoadEmb(e).then(() => { const v = window.__ktMap; if (v && v.refresh) v.refresh() }) }
        return undefined;
      },
      set() { return true }
    });
  }

  /* ---------- 1. המפה המאוחדת ---------- */
  let box = null;
  let baseP = null;   /* 4.0.0 (#38): טעינה אחת בלבד — לחיצה כפולה טענה את world-basemap.js פעמיים ("NE_DATA has already been declared") */
  function loadBase() {
    return baseP || (baseP = new Promise(res => {
      if (window.NE_DATA) return res();
      const s = document.createElement("script"); s.src = "world-basemap.js"; s.onload = () => res(); s.onerror = () => res(); document.head.append(s);
    }));
  }
  async function openUnified() {
    if (!window.MapUI || !MapUI.mount) return;
    streetsBridge();
    await loadBase();
    if (!box) {
      box = document.createElement("div"); box.id = "ktUnified"; document.body.append(box);
      /* סגירת המסך המלא (כפתור או Esc) סוגרת את המפה המאוחדת וחוזרים לכיוון תפילה */
      new MutationObserver(() => { if (!box.hidden && !box.classList.contains("mu-full")) { box.hidden = true; saveView() } }).observe(box, { attributes: true, attributeFilter: ["class"] });
    }
    const me = getPos();
    box.hidden = false;
    window.__ktMap = MapUI.mount(box, {
      self: SELF, call, openLink: openUrl, online, jerusalem: true, me: me ? [me[0], me[1]] : null,
      center: me ? [me[0], me[1]] : null, zoom: 2, builtinStreets: true, points: [], layerName: "כיוון תפילה", glyph: "✡",
      repo: REPO, issueUrl: REPO + "/issues/new?title=" + encodeURIComponent("מפה מאוחדת: "),
      guide: [{ t: "המפה המאוחדת בכיוון תפילה", d: "אותה מפה של מקוואות, גבולות עירוב ועינים למקרא, עם הקו לירושלים מהמיקום שלכם. מצבים: מפה · סביבה קרובה · רחובות · כדור. סגירת המסך המלא מחזירה לכיוון תפילה — שם כל המפות והכפתורים הרגילים נשארו כמו שהיו." }]
    });
    box.classList.add("mu-full");
    const fb = box.querySelector("#mu-fullb"); if (fb) { fb.setAttribute("aria-pressed", "true"); fb.title = "סגירת המפה המאוחדת"; fb.setAttribute("aria-label", fb.title) }
    /* הקו לירושלים מוצג מיד */
    const jb = box.querySelector("#mu-jer"); if (jb && me && jb.getAttribute("aria-pressed") !== "true") jb.click();
    saveView();
  }
  window.ktOpenUnifiedMap = openUnified;

  function addButton() {
    const tool = $("mapTool"); if (!tool || $("ktUniBtn")) return;
    const w = document.createElement("span"); w.className = "ktLayers";
    w.innerHTML = '<button type="button" class="mu-ib" id="ktUniBtn" title="מפה מאוחדת — המפה המשותפת לכל התוספים, עם הכיוון לירושלים" aria-label="מפה מאוחדת">'
      + '<svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.5 3.9 5.5 3.9 9s-1.3 6.5-3.9 9M12 3C9.4 5.5 8.1 8.5 8.1 12s1.3 6.5 3.9 9"/></svg>'
      + '<span class="bl">מפה מאוחדת</span></button>';
    const lay = $("mlLayers"); lay ? lay.after(w) : tool.append(w);
    $("ktUniBtn").onclick = openUnified;
  }

  /* ---------- 3. שחזור תצוגה (plugin.setRestoreState) ---------- */
  function saveView() {
    if (!O) return;
    const mm = $("mapMode");
    O.call("plugin.setRestoreState", { state: { v: 1, mapMode: mm ? mm.value : null, unified: !!(box && !box.hidden) } }).catch(() => {});
  }
  function restore(p) {
    const st = p && p.restore && p.restore.state; if (!st || st.v !== 1) return;
    const mm = $("mapMode");
    if (st.mapMode && mm && mm.value !== st.mapMode && [...mm.options].some(o => o.value === st.mapMode)) { mm.value = st.mapMode; mm.dispatchEvent(new Event("change")) }
    if (st.unified) setTimeout(openUnified, 600);
  }

  /* ---------- 2. כפתור בשדות החיפוש של אוצריא ---------- */
  const norm = s => String(s || "").replace(/[֑-ׇ"'״׳\-–]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  function fromField(t) {
    const s = $("splash"); if (s) s.hidden = true;
    const sel = $("city"), n = norm(t);
    if (sel && typeof C !== "undefined" && Array.isArray(C)) {
      const i = C.findIndex(c => norm(c[0]) === n);
      if (i >= 0) { sel.value = String(i); if (sel.onchange) sel.onchange(); return }
    }
    const q = $("stQ"); if (q) { q.value = t; if (typeof stFind === "function") stFind() }
  }

  window.__ktFromField = t => fromField(t);   /* 4.0.0: לשימוש searchDialogItems (v40.js) */
  function init() {
    addButton();
    const mm = $("mapMode"); if (mm) mm.addEventListener("change", saveView);
    if (O) {
      O.on("plugin.boot", p => { addButton(); restore(p) });
      O.on("search.fieldAction.invoked", p => {
        if (!p || p.actionId !== "kivun-from-field") return;
        const t = String(p.selectionEnd > p.selectionStart ? p.text.slice(p.selectionStart, p.selectionEnd) : p.text || "").trim();
        call("search.endFieldSession", { sessionId: p.sessionId }).catch(() => {});
        if (!t) return;
        call("plugin.openSelf").catch(() => {});
        setTimeout(() => fromField(t), 300);
      });
    }
  }
  if (document.readyState === "complete") init(); else addEventListener("load", init, { once: true });
})();
