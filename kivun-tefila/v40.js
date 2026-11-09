/* כיוון תפילה 4.0.0 — גרסה יציבה לפני ההשהיה (עד ~מאי 2027).
   1. #44: מפת הרחובות — כפתור "יישר את הרחוב": הרחוב שנבחר עומד מאוזן, וכך ברור בכמה להסתובב ממנו (במחשב בלי מצפן).
      בהגדרות אפשר לבחור שהיישור ייעשה לבד בכל לחיצה על רחוב.
   2. דיווח תקלות: מתג בהגדרות ("להציע שליחת דיווח כשיש תקלה"); הצעה אחת בלבד בכל הפעלה (shared/report 1.1.0).
   3. אוצריא 0.9.98.3 — searchDialogItems: אחרי חיפוש בספרייה מופיע כפתור "הכיוון לירושלים מ..." (resultsAction).
   4. אוצריא — tools.biographies / tools.dictionary: סימון שם או ראשי תיבות בהלכות ובחלונות הכותל מציג
      "מי זה?" מתוך "תולדות גדולי ישראל" ופירוש ראשי התיבות של אוצריא, בלי אינטרנט.
   5. #30: רמז לגרירת המטוס על הכדור (הגרירה עצמה ב-v37.js). */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const O = window.Otzaria || null;
  const call = (m, p) => O ? O.call(m, p || {}).then(r => (r && r.data !== undefined ? r.data : r)) : Promise.reject(new Error("no host"));
  const ls = { get: k => { try { return localStorage.getItem(k) } catch (e) { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) {} } };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- 1. יישור הרחוב שנבחר (#44) ---------- */
  const AK = "kt.stAlign";
  function alignStreet() {
    try {
      if (typeof ST === "undefined" || !ST.sel || !ST.area) return false;
      const g = ST.area.w[ST.sel.i][2], k = ST.sel.k, s = bearing([g[k], g[k + 1]], [g[k + 2], g[k + 3]]);
      /* הרחוב מאוזן (90° או 270° על המסך) — מבין שתי האפשרויות, זו שבה החץ לירושלים קרוב יותר ללמעלה */
      const b = bear(), nz = x => ((x % 360) + 360) % 360, off = x => Math.abs(((nz(x) + 180) % 360) - 180);
      const r1 = nz(90 - s), r2 = nz(270 - s);
      ST.rot = off(b + r1) <= off(b + r2) ? r1 : r2;
      streetMap(); return true;
    } catch (e) { return false }
  }
  function addAlign() {
    const row = $("stRotRow"); if (!row || $("stAlign")) return;
    const b = document.createElement("button"); b.id = "stAlign"; b.type = "button"; b.textContent = "⇔ יישר את הרחוב";
    b.title = "הרחוב שבחרת יעמוד מאוזן, והחץ יראה בכמה להסתובב ממנו"; b.setAttribute("aria-label", b.title);
    b.onclick = () => { if (!alignStreet()) { const t = $("stTxt"); if (t) t.textContent = "קודם לחץ במפה על הרחוב שלידך, ואז על \"יישר את הרחוב\"." } };
    row.append(b);
    const svg = $("map");
    if (svg) svg.addEventListener("click", () => { if (ls.get(AK) === "1" && $("mapMode") && $("mapMode").value === "street") setTimeout(() => { if (ST && ST.sel) alignStreet() }, 0) });
  }

  /* ---------- 2. מתגים בהגדרות ---------- */
  function addSettings() {
    const set = $("set"); if (!set || $("v40set")) return;
    const d = document.createElement("div"); d.id = "v40set"; d.className = "setrow";
    d.innerHTML = '<label><input type="checkbox" id="v40align"> ביישור הרחובות: ליישר לבד כל רחוב שלוחצים עליו</label>'
      + '<label><input type="checkbox" id="v40crash"> להציע שליחת דיווח למפתח כשיש תקלה (פעם אחת בהפעלה, תמיד באישורך)</label>';
    set.append(d);
    const a = $("v40align"); a.checked = ls.get(AK) === "1"; a.onchange = () => ls.set(AK, a.checked ? "1" : "0");
    const c = $("v40crash"), CR = window.CrashReport;
    if (!CR || !CR.setEnabled) { c.closest("label").hidden = true; return }
    c.checked = true; (CR.ready ? CR.ready() : Promise.resolve(CR.isEnabled())).then(v => { c.checked = !!v }).catch(() => {});
    c.onchange = () => CR.setEnabled(c.checked);
  }

  /* ---------- 3. כפתור אחרי חיפוש בספרייה (searchDialogItems.resultsAction) ---------- */
  function hookSearch() {
    if (!O || !O.on) return;
    O.on("search.requested", p => {
      if (!p || (p.itemId && p.itemId !== "kivun-place")) return;
      const q = String((p.request && p.request.query) || "").replace(/["'״׳]/g, " ").trim(); if (!q) return;
      call("plugin.openSelf").catch(() => {});
      setTimeout(() => { if (window.__ktFromField) window.__ktFromField(q) }, 300);
    });
  }

  /* ---------- 4. "מי זה?" / ראשי תיבות בהלכות ---------- */
  const ZONE = ".kd,.kria,.kshort,.kvp,.kvsrc,.kfl,.kfq,details.sd,#set";
  let chip = null, pop = null;
  function css() {
    if ($("v40css")) return; const st = document.createElement("style"); st.id = "v40css";
    st.textContent = `.v40chip{position:fixed;z-index:9900;font:inherit;font-size:.85em;border:0;border-radius:2em;padding:.25em .8em;cursor:pointer;background:var(--color-primary);color:var(--color-on-primary);box-shadow:0 .2em .6em var(--color-shadow,rgba(0,0,0,.25))}
.v40pop{position:fixed;z-index:9901;max-width:min(30em,calc(100vw - 2em));max-height:60vh;overflow:auto;background:var(--color-surface-container-high,var(--color-surface));color:var(--color-on-surface);border:1px solid var(--color-outline-variant,var(--color-outline));border-radius:.8em;padding:.8em 1em;box-shadow:0 .3em 1.2em var(--color-shadow,rgba(0,0,0,.3));line-height:1.5}
.v40pop h4{margin:.2em 0}.v40pop small{opacity:.75}.v40pop .x{float:inline-end;border:0;background:none;font:inherit;cursor:pointer;color:inherit}.v40pop hr{border:0;border-top:1px solid var(--color-outline-variant,var(--color-outline));margin:.5em 0}`;
    document.head.append(st);
  }
  const hide = () => { if (chip) chip.remove(); chip = null };
  const closePop = () => { if (pop) pop.remove(); pop = null };
  async function lookup(q, r) {
    closePop(); css(); pop = document.createElement("div"); pop.className = "v40pop"; pop.setAttribute("role", "dialog");
    pop.innerHTML = '<button class="x" aria-label="סגור">✕</button><small>מחפש באוצריא…</small>';
    pop.style.top = Math.min(innerHeight - 40, r.bottom + 6) + "px"; pop.style.insetInlineStart = "1em";
    document.body.append(pop); pop.querySelector(".x").onclick = closePop;
    let h = "";
    try {
      const d = await call("tools.dictionary", { term: q });
      const ac = (d && d.acronyms) || []; if (ac.length) h += "<h4>ראשי תיבות</h4>" + ac.slice(0, 3).map(a => `<div><b>${esc(a.acronym)}</b> — ${esc((a.meanings || []).join("; "))}</div>`).join("");
    } catch (e) {}
    try {
      const b = await call("tools.biographies", { query: q, formatVersion: 2, limit: 3 }), rs = (b && b.results) || [];
      if (rs.length) {
        h += (h ? "<hr>" : "") + "<h4>תולדות גדולי ישראל</h4>" + rs.map(p => `<div><b>${esc(p.name)}</b>${p.honorific ? " " + esc(p.honorific) : ""}${p.eraLabel ? ` <small>(${esc(p.eraLabel)})</small>` : ""}`
          + `${p.birth || p.death ? `<br><small>${p.birth ? "נולד: " + esc(p.birth) : ""}${p.death ? " · נפטר: " + esc(p.death) : ""}</small>` : ""}${p.summary ? `<br>${esc(String(p.summary).slice(0, 400))}` : ""}`
          + `${(p.sources || []).length ? `<br><small>מקורות: ${p.sources.map(s => esc(s.title || s.credit)).join(", ")}</small>` : ""}</div>`).join("<hr>")
          + (b.attribution || rs[0].attribution ? `<p><small>${esc(b.attribution || rs[0].attribution)}</small></p>` : "");
      }
    } catch (e) {}
    if (pop) pop.innerHTML = '<button class="x" aria-label="סגור">✕</button>' + (h || `<small>לא נמצא באוצריא פירוש או ערך עבור "${esc(q)}".</small>`), pop && (pop.querySelector(".x").onclick = closePop);
  }
  function hookSelection() {
    if (!O) return;
    document.addEventListener("mouseup", e => {
      if (e.target.closest && e.target.closest(".v40chip,.v40pop")) return;
      setTimeout(() => {
        hide(); const s = getSelection(), t = s && String(s).trim();
        if (!t || t.length < 2 || t.length > 40 || /\n/.test(t)) return;
        const n = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement);
        if (!n || !n.closest(ZONE) || n.closest("input,textarea,select,button")) return;
        const r = s.getRangeAt(0).getBoundingClientRect(); css();
        chip = document.createElement("button"); chip.type = "button"; chip.className = "v40chip"; chip.textContent = "מי זה? / פירוש ר״ת";
        chip.style.top = Math.max(4, r.top - 34) + "px"; chip.style.left = Math.max(4, Math.min(innerWidth - 160, r.left)) + "px";
        chip.onmousedown = ev => ev.preventDefault(); chip.onclick = () => { hide(); lookup(t, r) };
        document.body.append(chip);
      }, 0);
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") { hide(); closePop() } });
  }

  /* ---------- 5. רמז לגרירת המטוס (#30) ---------- */
  function addFlyHint() {
    const out = $("flyOut"); if (!out || $("flyDragT")) return;
    const s = document.createElement("small"); s.id = "flyDragT"; s.setAttribute("aria-live", "polite");
    s.textContent = "טיפ: בתצוגת הכדור אפשר לגרור את המטוס לאורך המסלול, והשעה, היום והלילה מתעדכנים.";
    out.before(s);
  }

  function init() { addAlign(); addSettings(); addFlyHint(); hookSearch(); hookSelection() }
  if (document.readyState === "complete") init(); else addEventListener("load", init, { once: true });
})();
