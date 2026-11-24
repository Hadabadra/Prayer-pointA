/* שיח רינה — קורא PDF מוטמע לאוצריא. הקובץ המקורי נטען כמו שהוא (data/book.js), בלי שינוי. */
(function () {
  "use strict";
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const O = window.Otzaria, B = window.SR_BOOK, TXT = window.SR_TEXT || [];
  const VERSION = "3.1.0";
  const call = async (m, p) => { try { return O ? await O.call(m, p || {}) : { success: false }; } catch (e) { return { success: false, error: e }; } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const deb = (f, t) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => f(...a), t); }; };

  /* ---------- מספרים עבריים ---------- */
  function heb(n) {
    if (n <= 0) return String(n);
    const L = [[400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"], [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"], [50, "נ"], [40, "מ"], [30, "ל"], [20, "כ"], [10, "י"], [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"], [5, "ה"], [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"]];
    let s = "";
    for (const [v, c] of L) while (n >= v) { if (n === 15) { s += "טו"; n = 0; break; } if (n === 16) { s += "טז"; n = 0; break; } s += c; n -= v; }
    return s;
  }
  function parseHeb(s) {
    s = String(s || "").trim().replace(/[׳״'"]/g, "");
    if (/^\d+$/.test(s)) return +s;
    const V = { א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9, י: 10, כ: 20, ך: 20, ל: 30, מ: 40, ם: 40, נ: 50, ן: 50, ס: 60, ע: 70, פ: 80, ף: 80, צ: 90, ץ: 90, ק: 100, ר: 200, ש: 300, ת: 400 };
    let n = 0; for (const c of s) { if (!V[c]) return NaN; n += V[c]; } return n || NaN;
  }

  /* ---------- הגדרות ---------- */
  let ST = { page: 1, mode: "scroll", fit: "width", zoom: 1, night: false, skip: false, marks: [], notes: {}, side: false, tab: "short", seenVer: "", diaspora: false, night2: false, crashRep: true, dn: "otzaria" };
  const save = deb(() => { call("storage.set", { key: "settings", value: ST }); try { localStorage.setItem("sr", JSON.stringify(ST)); } catch (e) { } }, 400);
  async function load() {
    const r = await call("storage.get", { key: "settings" });
    let v = r && r.success && r.data; if (!v) { try { v = JSON.parse(localStorage.getItem("sr") || "null"); } catch (e) { } }
    if (v && typeof v === "object") ST = Object.assign(ST, v);
  }

  /* ---------- ערכת צבעים של אוצריא ---------- */
  const TOK = { primary: "primary", onPrimary: "on-primary", surface: "surface", onSurface: "on-surface", onSurfaceVariant: "on-surface-variant",
    surfaceContainerLow: "surface-container-low", surfaceContainer: "surface-container", surfaceContainerHigh: "surface-container-high",
    surfaceContainerHighest: "surface-container-highest", outline: "outline", outlineVariant: "outline-variant" };
  function theme(t) {
    const c = t && (t.colorScheme || t); if (!c || typeof c !== "object") return; const st = document.documentElement.style;
    for (const [k, v] of Object.entries(TOK)) if (typeof c[k] === "string" && c[k]) st.setProperty("--color-" + v, c[k]);
    if (c.primary) st.setProperty("--color-primary-subtle", "color-mix(in srgb, " + c.primary + " 13%, transparent)");
    const ty = t.typography || {};
    if (ty.fontFamily) st.setProperty("--font-main", `'${ty.fontFamily}', 'FrankRuhlCLM', 'David', serif`);
    if (ty.uiFontFamily) st.setProperty("--font-ui", `'${ty.uiFontFamily}', 'Rubik', system-ui, sans-serif`);
  }

  /* ---------- PDF ---------- */
  let pdf = null, N = 97, RATIO = 842 / 595, cur = 1, pageEls = [], rendered = new Map(), hlTerms = [];
  pdfjsLib.GlobalWorkerOptions.workerSrc = "./vendor/pdf.worker.min.js";
  /* הגופנים המובנים של PDF.js מוטמעים (data/fonts.js) — טעינת קבצים ב-file:// נחסמת. disableFontFace: ציור הגופנים העבריים של הקובץ כצורות, במדויק. */
  class FontFactory { constructor() { } async fetch({ filename }) { const b = (window.SR_FONTS || {})[filename]; if (!b) throw new Error("font " + filename); const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; } }
  function bytes() { const b = atob(window.SR_PDF), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  /* 1.1.0 מהירות: פתיחת המסמך מתחילה מיד בטעינת הסקריפט, במקביל לעמוד הכניסה */
  const docP = (async () => { await new Promise(r => setTimeout(r, 0)); return pdfjsLib.getDocument({ data: bytes(), isEvalSupported: false, disableFontFace: true, useWorkerFetch: false,
      standardFontDataUrl: "./vendor/standard_fonts/", StandardFontDataFactory: FontFactory }).promise; })();
  async function openPdf() {
    pdf = await docP;
    N = pdf.numPages; const p1 = await pdf.getPage(1), vp = p1.getViewport({ scale: 1 }); RATIO = vp.height / vp.width;
    $("#pgOf").textContent = "מתוך " + heb(N);
    buildPages(); layout(); markNotes(); go(ST.page || 1, true); setTimeout(() => pageEls.forEach(el => io.observe(el)), 300);
  }

  const view = () => $("#view");
  function pageSize() {
    const v = view(), W = v.clientWidth - 24, H = v.clientHeight - 40;
    const two = ST.mode === "spread";
    let w;
    if (ST.fit === "page" || (ST.mode !== "scroll" && ST.fit !== "width")) w = Math.min(H / RATIO, two ? W / 2 : W);
    else w = two ? W / 2 : Math.min(W, 1100);
    if (ST.fit === "zoom") w = 600 * ST.zoom;
    w = Math.max(200, Math.floor(w));
    return { w, h: Math.floor(w * RATIO) };
  }
  function buildPages() {
    const box = $("#pages"); box.innerHTML = ""; pageEls = [];
    for (let i = 1; i <= N; i++) {
      const d = document.createElement("div"); d.className = "pg"; d.dataset.p = i;
      d.innerHTML = '<canvas></canvas><div class="tl"></div><div class="pnum">' + heb(i) + "</div>";
      box.appendChild(d); pageEls.push(d);
    }
    if (!$(".navz")) view().insertAdjacentHTML("beforeend", '<div class="navz nr" title="עמוד קודם"></div><div class="navz nl" title="עמוד הבא"></div>');
    $(".navz.nr").onclick = () => step(-1); $(".navz.nl").onclick = () => step(1);
    io = new IntersectionObserver(es => es.forEach(e => { const n = +e.target.dataset.p; if (e.isIntersecting) { near.add(n); render(n); } else near.delete(n); }), { root: view(), rootMargin: "500px 0px" });
  }
  let io = null, sizeKey = "";
  function layout() {
    const app = $("#app"); app.classList.toggle("flip", ST.mode !== "scroll"); app.classList.toggle("spread", ST.mode === "spread"); app.classList.toggle("night", !!ST.night);
    const { w, h } = pageSize(), k = w + "x" + h;
    if (k !== sizeKey) { sizeKey = k; rendered.clear(); pageEls.forEach(el => { el.style.width = w + "px"; el.style.height = h + "px"; el.dataset.r = ""; }); }
    $("#zLbl").textContent = Math.round(w / 6) + "%";
    $$("#menuView [data-mode]").forEach(b => b.classList.toggle("on", b.dataset.mode === ST.mode));
    $$("#menuView [data-fit]").forEach(b => b.classList.toggle("on", b.dataset.fit === ST.fit));
    $("#bNight span").textContent = ST.night ? "מצב יום" : "מצב לילה";
  }
  /* תור רינדור: העמודים המוצגים קודם, עד שני רינדורים במקביל; שכבת הטקסט (לחיפוש ולסימון) — אחר כך, בזמן פנוי */
  const near = new Set(), queue = []; let busy = 0;
  function render(n, urgent) {
    const el = pageEls[n - 1]; if (!el || !pdf || el.dataset.r === sizeKey) return;
    const i = queue.indexOf(n); if (i >= 0) queue.splice(i, 1);
    urgent ? queue.unshift(n) : queue.push(n); pump();
  }
  function pump() {
    while (busy < 2 && queue.length) {
      const n = queue.shift(), el = pageEls[n - 1];
      if (!el || el.dataset.r === sizeKey) continue;
      if (ST.mode === "scroll" && !near.has(n) && Math.abs(n - cur) > 2) continue;
      busy++; draw(n, el).finally(() => { busy--; pump(); });
    }
  }
  async function draw(n, el) {
    const key = sizeKey; el.dataset.r = key;
    const page = await pdf.getPage(n), w = parseFloat(el.style.width), base = page.getViewport({ scale: 1 });
    const scale = w / base.width, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const vp = page.getViewport({ scale }), off = document.createElement("canvas");
    off.width = Math.floor(vp.width * dpr); off.height = Math.floor(vp.height * dpr);
    const ctx = off.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    try { await page.render({ canvasContext: ctx, viewport: vp }).promise; } catch (e) { el.dataset.r = ""; return; }
    /* 2.1.0: מסכת שמות הקודש לפי ההגדרה */
    if (window.SRDivine && SRDivine.active()) { try { SRDivine.mask(ctx, await page.getTextContent(), vp, pdfjsLib.Util, dpr); } catch (e) { } }
    if (key !== sizeKey) return;
    const c = el.querySelector("canvas"); c.replaceWith(off); rendered.set(n, true);
    const idle = window.requestIdleCallback || (f => setTimeout(f, 120));
    idle(async () => {
      if (key !== sizeKey) return;
      const tl = el.querySelector(".tl"); tl.innerHTML = ""; tl.style.setProperty("--scale-factor", scale);
      try { const tc = await page.getTextContent(); await pdfjsLib.renderTextLayer({ textContentSource: tc, container: tl, viewport: vp, textDivs: [] }).promise; highlight(el); } catch (e) { }
    });
  }
  const normT = s => String(s || "").replace(/[֑-ׇ]/g, "").replace(/[״“”]/g, '"').replace(/[׳‘’]/g, "'").replace(/\s+/g, "");
  function highlight(el) {
    const spans = el.querySelectorAll(".tl span"); spans.forEach(s => s.classList.remove("hl"));
    if (!hlTerms.length) return;
    spans.forEach(s => { const t = normT(s.textContent); if (t.length > 1 && hlTerms.some(q => t.includes(q) || (t.length >= 3 && q.includes(t)))) s.classList.add("hl"); });
  }

  /* ---------- ניווט ---------- */
  function visible() {
    if (ST.mode === "single") return [cur];
    if (ST.mode === "spread") { if (cur === 1) return [1]; const a = cur % 2 === 0 ? cur : cur - 1; return [a, a + 1].filter(x => x <= N); }
    return [cur];
  }
  function go(n, instant, back) {
    n = Math.max(1, Math.min(N, Math.round(n) || 1)); const prev = cur; cur = n;
    if (ST.mode === "scroll") { const el = pageEls[n - 1]; render(n, true); if (n < N) render(n + 1); if (el) view().scrollTo({ top: el.offsetTop - 12, behavior: instant ? "auto" : "smooth" }); }
    else {
      const vis = visible(); $("#app").classList.toggle("back", back === undefined ? n < prev : back);
      pageEls.forEach(el => { const p = +el.dataset.p, s = vis.includes(p); el.classList.toggle("show", s); el.classList.toggle("r", s && vis.length > 1 && p === vis[0]); el.classList.toggle("l", s && vis.length > 1 && p === vis[1]); });
      vis.forEach(n => render(n, true)); if (vis[vis.length - 1] < N) render(vis[vis.length - 1] + 1); if (vis[0] > 1) render(vis[0] - 1);
      view().scrollTop = 0;
    }
    onPage();
  }
  /* 1.3.3: דפדוף שני עמודים — הפיכת עלה תלת-ממדית כמו ספר אמיתי (בדומה לתוסף "שני טורים") */
  let turning = null;
  function endTurn() { if (turning) { clearTimeout(turning.t); clearInterval(turning.iv); turning.el.remove(); turning = null; } }
  function copyCv(dst, n) {
    const el = pageEls[n - 1], src = el && el.querySelector("canvas"); if (!src || !rendered.get(n) || el.dataset.r !== sizeKey) return false;
    dst.width = src.width; dst.height = src.height; dst.getContext("2d").drawImage(src, 0, 0); return true;
  }
  function flipTurn(d) {
    const v = visible(); if (v.length !== 2) return false;
    const t = d > 0 ? v[1] + 1 : v[0] - 2; if (t < 2 || t + 1 > N) return false;
    endTurn();
    const rR = pageEls[v[0] - 1].getBoundingClientRect(), rL = pageEls[v[1] - 1].getBoundingClientRect();
    if (!rR.width || !rL.width) return false;
    const frontN = d < 0 ? v[0] : v[1], coverN = d < 0 ? v[1] : v[0], backN = d < 0 ? t + 1 : t; /* ספר עברי: הקדימה = העמוד השמאלי מתהפך ימינה */
    const mk = (cls, n, r) => { const e = document.createElement("div"); e.className = cls; e.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`; const c = document.createElement("canvas"); e.appendChild(c); return { e, c }; };
    const lr = d < 0 ? rR : rL, cr = d < 0 ? rL : rR;
    const cov = mk("tpg tcov", coverN, cr), leaf = mk("tleaf", 0, lr), f = document.createElement("div"), b = document.createElement("div");
    leaf.e.innerHTML = ""; f.className = "tpg tf"; b.className = "tpg tb";
    const fc = document.createElement("canvas"), bc = document.createElement("canvas");
    f.append(fc, Object.assign(document.createElement("i"), { className: "tsh" })); b.append(bc, Object.assign(document.createElement("i"), { className: "tsh" }));
    leaf.e.append(f, b); leaf.e.style.transformOrigin = d < 0 ? "left center" : "right center";
    copyCv(cov.c, coverN); copyCv(fc, frontN);
    const ov = document.createElement("div"); ov.className = "tov"; ov.style.perspectiveOrigin = (d < 0 ? rR.left : rL.right) + "px 50%";
    ov.append(cov.e, leaf.e);
    go(t, false, d < 0);
    $("#app").appendChild(ov);
    const fill = () => copyCv(bc, backN); const iv = setInterval(() => { if (fill()) clearInterval(iv); }, 60); fill();
    void leaf.e.offsetWidth; leaf.e.style.transform = `rotateY(${d < 0 ? -180 : 180}deg)`;
    turning = { el: ov, iv, t: setTimeout(endTurn, 1050) };
    return true;
  }
  function step(d) {
    if (ST.mode === "spread" && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) { try { if (flipTurn(d)) return; } catch (e) { endTurn(); } }
    if (ST.mode === "spread") { const v = visible(); go(d > 0 ? v[v.length - 1] + 1 : (v[0] === 2 ? 1 : v[0] - 2), false, d < 0); }
    else if (ST.mode === "single") go(cur + d, false, d < 0);
    else go(cur + d);
  }
  function section(p) { let s = null; for (const e of B.full) if (e[1] <= p) s = e; return s; }
  function onPage() {
    $("#pg").value = heb(cur); ST.page = cur; save(); call("plugin.setRestoreState", { state: { page: cur, mode: ST.mode } });
    const on = ST.marks.some(m => m.p === cur); const mb = $("#bMark"); mb.classList.toggle("on", on); mb.innerHTML = SRIcon(on ? "markon" : "mark"); mb.title = on ? "הסרת הסימניה" : "סימניה לעמוד זה";
    const nb = $("#bNote"); if (nb) { const hn = !!(ST.notes || {})[cur]; nb.classList.toggle("on", hn); nb.title = hn ? "ההערה שלי לעמוד זה" : "הוספת הערה לעמוד זה"; }
    $$("#sList .ti").forEach(b => b.classList.remove("cur"));
    if (ST.tab === "short" || ST.tab === "full") { const list = ST.tab === "short" ? B.short : B.full; let best = -1; list.forEach((e, i) => { if (e[1] <= cur) best = i; }); const el = $$("#sList .ti")[best]; if (el) el.classList.add("cur"); }
  }
  const onScroll = deb(() => {
    if (ST.mode !== "scroll") return; const v = view(), mid = v.scrollTop + v.clientHeight * 0.35;
    let best = 1; for (const el of pageEls) { if (el.offsetTop <= mid) best = +el.dataset.p; else break; }
    if (best !== cur) { cur = best; onPage(); }
  }, 80);

  /* ---------- צד: תוכן / סימניות / חיפוש ---------- */
  function side(open, tab) {
    if (open === undefined) open = $("#side").classList.contains("hid");
    $("#side").classList.toggle("hid", !open); ST.side = open; if (tab) ST.tab = tab;
    $("#bToc").classList.toggle("on", open && ST.tab !== "find"); $("#bSearch").classList.toggle("on", open && ST.tab === "find");
    if (open) showTab(); save(); setTimeout(() => { sizeKey = ""; layout(); go(cur, true); }, 30);
  }
  function showTab() {
    $$("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.t === ST.tab));
    $("#findBox").classList.toggle("hid", ST.tab !== "find"); const L = $("#sList");
    if (ST.tab === "short" || ST.tab === "full") {
      const list = ST.tab === "short" ? B.short : B.full;
      L.innerHTML = list.map(e => `<button class="ti l${ST.tab === "short" ? 0 : e[2]}" data-p="${e[1]}"><span>${esc(e[0])}</span><span class="pn">${heb(e[1])}</span></button>`).join("");
    } else if (ST.tab === "marks") {
      const notes = Object.entries(ST.notes || {}).map(([p, t]) => ({ p: +p, t })).sort((a, b) => a.p - b.p);
      L.innerHTML = (ST.marks.length ? '<div class="sh">סימניות</div>' + ST.marks.slice().sort((a, b) => a.p - b.p).map(m => `<div class="mk"><button class="ti" data-p="${m.p}"><span>${esc(m.t)}</span><span class="pn">${heb(m.p)}</span></button><button class="ib" data-del="${m.p}" title="מחיקה">${SRIcon("trash")}</button></div>`).join("") : "")
        + (notes.length ? '<div class="sh">הערות שלי</div>' + notes.map(n => `<div class="mk"><button class="ti" data-p="${n.p}"><span class="nt">${esc(n.t.length > 80 ? n.t.slice(0, 80) + "…" : n.t)}</span><span class="pn">${heb(n.p)}</span></button><button class="ib" data-note="${n.p}" title="עריכה">${SRIcon("note")}</button></div>`).join("") : "")
        || '<p class="empty">אין עדיין סימניות או הערות.<br>סמל הסימניה וסמל ההערה בסרגל — לעמוד הנוכחי.</p>';
    } else { $("#q").focus(); runFind($("#q").value); }
    SRIcons(L); onPage();
  }
  function toggleMark() {
    const i = ST.marks.findIndex(m => m.p === cur);
    if (i >= 0) { ST.marks.splice(i, 1); toast("הסימניה הוסרה"); }
    else { const s = section(cur); ST.marks.push({ p: cur, t: (s ? s[0] : "עמוד") + " · עמ' " + heb(cur) }); toast("נוספה סימניה לעמוד " + heb(cur)); }
    save(); onPage(); if (ST.side && ST.tab === "marks") showTab();
  }

  /* ---------- חיפוש בספר ---------- */
  const NT = TXT.map(t => { const s = String(t || ""); const map = []; let c = ""; for (let i = 0; i < s.length; i++) { const ch = s[i]; if (/\s/.test(ch)) continue; c += ch.replace(/[״“”]/g, '"').replace(/[׳‘’]/g, "'"); map.push(i); } return { s, c, map }; });
  function search(q) {
    const words = String(q || "").replace(/[֑-ׇ]/g, "").split(/\s+/).map(normT).filter(Boolean);
    if (!words.length) return { words, hits: [] };
    const phrase = words.join(""), hits = [];
    NT.forEach((t, i) => {
      let pos = [], k = -1; while ((k = t.c.indexOf(phrase, k + 1)) >= 0) pos.push([k, phrase.length]);
      if (!pos.length && words.length > 1 && words.every(w => t.c.includes(w))) words.forEach(w => { const j = t.c.indexOf(w); pos.push([j, w.length]); });
      if (pos.length) {
        const [a, len] = pos[0], s0 = t.map[a], s1 = t.map[Math.min(a + len - 1, t.map.length - 1)] + 1;
        const from = Math.max(0, s0 - 60), to = Math.min(t.s.length, s1 + 60);
        const dv = x => window.SRDivine && SRDivine.active() ? SRDivine.text(x) : x;   // השם כמו שנבחר בהגדרות
        hits.push({ p: i + 1, n: pos.length, html: (from ? "…" : "") + esc(dv(t.s.slice(from, s0))) + "<mark>" + esc(dv(t.s.slice(s0, s1))) + "</mark>" + esc(dv(t.s.slice(s1, to))) + (to < t.s.length ? "…" : "") });
      }
    });
    return { words, hits };
  }
  function runFind(q) {
    const L = $("#sList"), info = $("#qInfo");
    if (!String(q || "").trim()) { hlTerms = []; L.innerHTML = '<p class="empty">הקלידו מילה או ביטוי — החיפוש מתעלם מניקוד ומרווחים.</p>'; info.textContent = ""; refreshHL(); return; }
    const { words, hits } = search(q); hlTerms = words.length > 1 ? [words.join("")].concat(words) : words;
    const total = hits.reduce((a, h) => a + h.n, 0);
    info.textContent = hits.length ? `${total} מופעים ב-${hits.length} עמודים` : "לא נמצא";
    L.innerHTML = hits.map(h => { const s = section(h.p); return `<button class="hit" data-p="${h.p}"><b class="pn">עמ' ${heb(h.p)}${s ? " · " + esc(s[0]) : ""}</b><span>${h.html}</span></button>`; }).join("") || '<p class="empty">לא נמצאו תוצאות.</p>';
    refreshHL();
  }
  function refreshHL() { pageEls.forEach(el => { if (el.dataset.r) highlight(el); }); }

  /* ---------- תפריטים וחלונות ---------- */
  function menu(id, btn) {
    const m = $(id), open = m.classList.contains("hid"); $$(".menu").forEach(x => x.classList.add("hid")); if (!open) return;
    m.classList.remove("hid"); const r = btn.getBoundingClientRect();
    m.style.top = (r.bottom + 4) + "px"; m.style.left = Math.max(6, Math.min(r.left, innerWidth - m.offsetWidth - 6)) + "px";
  }
  function dlg(html) { $("#dBody").innerHTML = html; SRIcons($("#dBody")); $("#dlg").classList.remove("hid"); }
  const closeDlg = () => { $("#dlg").classList.add("hid"); document.body.classList.remove("printing"); $("#printArea").innerHTML = ""; };
  let tt; function toast(t) { const e = $("#toast"); e.textContent = t; e.classList.remove("hid"); clearTimeout(tt); tt = setTimeout(() => e.classList.add("hid"), 2600); }
  async function copy(t) {
    try { await navigator.clipboard.writeText(t); toast("הועתק"); return; } catch (e) { }
    const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); toast("הועתק"); } catch (e) { toast("ההעתקה לא הצליחה"); } a.remove();
  }
  const ref = p => { const s = section(p); return `${B.title}${s ? ", " + s[0] : ""}, עמ' ${heb(p)}`; };
  /* const LINKS = () => `להורדת התוסף "ברכת המזון – שיח רינה" לאוצריא: GitHub — ${B.links.github} · חנות התוספים של אוצריא — ${B.links.store}`; */
  const LINKS = () => `להורדת התוסף "ברכת המזון – שיח רינה" לאוצריא: חנות התוספים של אוצריא — ${B.links.store}`;

  function contact(prefill) {
    dlg(`<img class="dlogo" src="img/makhon.png" alt=""><h2>המחבר ויצירת קשר</h2>
      <p>${esc(B.publisher)} · ${esc(B.author)}<br><span class="small">${esc(B.dedication)}</span></p>
      <p class="small">המכון ישמח לקבל תיקונים, הערות והוספות.</p>
      <div class="crow">${SRIcon("phone")}<b>${esc(B.phone)}</b><span class="sp"></span><button data-copy="${esc(B.phone)}">העתקה</button></div>
      <div class="crow">${SRIcon("mail")}<b>${esc(B.email)}</b><span class="sp"></span><button data-copy="${esc(B.email)}">העתקה</button><button id="cMailto">פתיחה בתוכנת הדואר</button></div>
      <h3>שליחת הודעה למכון</h3>
      <div class="seg" id="cType"><label><input type="radio" name="ct" value="תיקון" checked>תיקון</label><label><input type="radio" name="ct" value="הערה">הערה</label><label><input type="radio" name="ct" value="הוספה">הוספה</label><label><input type="radio" name="ct" value="שאלה">שאלה</label><label><input type="radio" name="ct" value="אחר">אחר</label></div>
      <label for="cName">שם (רשות)</label><input type="text" id="cName">
      <label for="cFrom">מייל לחזרה (רשות)</label><input type="email" id="cFrom" dir="ltr">
      <label for="cMsg">ההודעה</label><textarea id="cMsg">${esc(prefill || "")}</textarea>
      <label style="display:flex;gap:.4em;align-items:center"><input type="checkbox" id="cRef" checked> לצרף את מראה המקום: ${esc(ref(cur))}</label>
      <div class="acts"><button class="btn" id="cCancel">ביטול</button><button class="btn pri" id="cSend">${SRIcon("send")}שליחה</button></div>`);
    $("#cCancel").onclick = closeDlg;
    $("#cMailto").onclick = () => call("app.openUrl", { url: "mailto:" + B.email + "?subject=" + encodeURIComponent("שיח רינה — פנייה") });
    $("#cSend").onclick = async () => {
      const msg = $("#cMsg").value.trim(); if (!msg) { $("#cMsg").focus(); return toast("נא לכתוב הודעה"); }
      const type = (document.querySelector('input[name=ct]:checked') || {}).value || "פנייה";
      const name = $("#cName").value.trim(), from = $("#cFrom").value.trim();
      const body = [msg, "", "———", "סוג: " + type, $("#cRef").checked ? "מקום בספר: " + ref(cur) : "", name ? "שם: " + name : "", from ? "מייל לחזרה: " + from : "", "", "נשלח מתוסף \"שיח רינה\" " + VERSION + " לאוצריא"].filter(x => x !== "").join("\n");
      const b = $("#cSend"); b.disabled = true;
      const r = await call("feedback.sendEmail", { to: B.email, subject: "שיח רינה — " + type + ($("#cRef").checked ? " (עמ' " + heb(cur) + ")" : ""), body, includeSystemInfo: false });
      if (r && r.success !== false && r.data !== false) { closeDlg(); toast("ההודעה נשלחה למכון. תודה!"); }
      else { b.disabled = false; toast("השליחה לא הצליחה — ההודעה הועתקה; אפשר לשלוח אותה במייל"); copy(body); }
    };
  }

  /* דיווח קריסה (אוצריא 0.9.98.3): פעם אחת בהפעלה, רק באישור המשתמש; מתג בחלון "אודות" */
  let CRASHED = false;
  async function onCrash(msg, stack) {
    if (CRASHED || ST.crashRep === false) return; CRASHED = true;
    const c = await call("ui.showConfirm", { title: "ברכת המזון – אירעה שגיאה", content: "לשלוח למפתחת דיווח קריסה (הודעת השגיאה והגרסה, בלי מידע אישי)? אפשר לכבות הצעה זו בחלון \"אודות\"." });
    if (!(c && c.success && c.data && c.data.confirmed) && !(c && c.confirmed)) return;
    call("feedback.report", { reportType: "crash", details: (String(msg) + "\n" + String(stack || "") + "\nגרסה " + VERSION).slice(0, 5000) });
  }
  addEventListener("error", e => onCrash(e.message || e, e.error && e.error.stack));
  addEventListener("unhandledrejection", e => { const r = e.reason; onCrash(r && r.message || r, r && r.stack); });
  function about() {
    dlg(`<img class="dlogo" src="img/makhon.png" alt=""><h2>${esc(B.title)}</h2>
      <p>${esc(B.edition)}<br>${esc(B.publisher)} · ${esc(B.author)}</p>
      <h3>התוסף</h3>
      <p>גרסה ${VERSION}. הספר מוצג כקובץ ה-PDF המקורי, בלי שום שינוי. החיפוש נעשה על שכבת טקסט נפרדת שהופקה מהקובץ.</p>
      <p class="small">טביעת האצבע (SHA-256) של הקובץ שבתוסף: <code id="aSha">${esc(window.SR_PDF_SHA || "")}</code> <span id="aShaOk"></span></p>
      <p><label style="display:flex;gap:.4em;align-items:center;flex-wrap:wrap">שמות הקודש בדף: <select id="aDn">${[["otzaria","לפי הגדרות אוצריא"],["asIs","ככתבם (כמו במקור)"],["hehApostrophe","ה'"],["kufKuf","יקוק"],["doubleYod","יי"],["daletDalet","ידוד"]].map(([v, t]) => `<option value="${v}" ${ST.dn === v ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label><small>הספר מוצג כ-PDF מקורי, ולכן השם מוסתר במסכה על הדף (מיקום מקורב). חל גם בהדפסה.</small></p>
      <div id="aBtnsCard"></div>
      <p><label style="display:flex;gap:.4em;align-items:center"><input type="checkbox" id="aCrash" ${ST.crashRep !== false ? "checked" : ""}> הצעה לשלוח דיווח קריסה באישורי</label></p>
      <h3>מה חדש</h3>
      <ul><li style="background:var(--color-primary-subtle);border-radius:.4em;padding:.2em .5em"><b>3.1.0</b> — הסתרת "אלקינו" בכל מקום ובלי ריבוע שחור; בחיפוש השם מוצג כפי שנבחר.</li><li><b>3.0.0</b> — <b>בוחרים אילו כפתורים יופיעו באוצריא:</b> כרטיס עם מתג גלולה לכל כפתור (כאן למעלה). אפשר לאשר את ההרשאות ולהשאיר רק חלק מהכפתורים.</li><li><b>2.1.0</b> — הסתרת שמות הקודש בדף (לפי הגדרות אוצריא או לפי בחירה כאן) במסכה, גם בהדפסה; הדפסה בלי דף סיום כפול; הדפסה, מראה מקום ואודות ככפתורים נפרדים בסרגל; סרגל צפוף יותר; "מה חדש" אחרי עדכון והסתרת כפתורים באוצריא. הפיתוח מושהה עד כמאי 2027.</li><li style="background:var(--color-primary-subtle);border-radius:.4em;padding:.2em .5em"><b>2.0.0</b> — גרסה יציבה. פועל במלואו ללא אינטרנט. נוסף דיווח קריסה של אוצריא (רק באישורך, פעם אחת בהפעלה, עם מתג כאן). הפיתוח מושהה עד כמאי 2027.</li><li style="background:var(--color-primary-subtle);border-radius:.4em;padding:.2em .5em"><b>1.3.3</b> — דפדוף שני עמודים (כיוון הפיכה כמו בספר עברי): הפיכת עלה תלת-ממדית כמו ספר אמיתי, עם צל ואנימציה מלאה.</li><li style="background:var(--color-primary-subtle);border-radius:.4em;padding:.2em .5em"><b>1.3.2</b> — קישור החנות לחיץ; קישור GitHub הוסר; "ברכה במסך מלא" הועבר לסרגל (ליד "שכחתי").</li><li style="background:var(--color-primary-subtle);border-radius:.4em;padding:.2em .5em"><b>1.3.1</b> — הדפסה/שמירה כ-PDF מוגבלת ל-${MAXP} עמודים בכל פעם (נוסף: הספר המלא בחנות התוספים); בתחילת כל מסמך מיוצא מופיעים קישור לחנות, סמל המכון ופרטי יצירת קשר; קישור החנות עודכן בדף האודות.</li><li><b>1.3.0</b> — שם התוסף הוחלף ל"ברכת המזון" (שיהיה ברור מה הוא); מותאם לאוצריא 0.9.98.3: כפתור "פתח בברכת המזון" בטאב החיפוש אחרי כל חיפוש, תיבת החיפוש בדיאלוג חד-פעמית (לא נשארת מסומנת), כפתור סינון "ספרי התוסף בלבד / ספרי הספרייה בלבד" באיתור הספרים, וחזרה לאותו עמוד כשאוצריא טוענת מחדש את הלשונית.</li><li><b>1.2.0</b> — כפתור "שכחתי" בסרגל; עיצוב חדש: סרגל שקוף מעט עם קבוצות כפתורים, אייקונים חדשים, אנימציות עדינות ומעברים חלקים.</li><li><b>1.1.0</b> — "ברכת המזון היום" לפי הלוח העברי (שבת, ראש חודש, חגים, חנוכה ופורים) עם קפיצה לתוספות; סעודת ברית ושבע ברכות; "שכחתי…"; ברכה במסך מלא; הערות אישיות לעמוד; טקסט מסומן — חיפוש בספריית אוצריא או העתקה עם מראה מקום; טעינה מהירה בהרבה.</li><li><b>1.0.0</b> — מהדורה ראשונה: עמוד כניסה, תוכן עניינים מקוצר ומורחב, כפתורים מהירים, חיפוש בספר ומתוך מסך החיפוש של אוצריא, הספר באיתור הספרים בספרייה, דפדוף כספר (דף בודד או שני עמודים), מצב לילה, סימניות, זכירת המקום, הדפסה ושמירה כ-PDF, העתקת מראה מקום ושליחת הודעה למכון.</li></ul>
      <h3>הורדה ועדכונים</h3>
      <!-- 1.3.2: קישור GitHub הוסר -->
      <div class="crow"><b>חנות התוספים של אוצריא</b><span class="sp"></span><button data-copy="${esc(B.links.store)}">העתקת קישור</button></div>
      <p class="small" dir="ltr" style="text-align:left"><a href="${esc(B.links.store)}" data-url="${esc(B.links.store)}">${esc(B.links.store)}</a></p>
      <p class="small">הקורא מבוסס על PDF.js (Mozilla, רישיון Apache 2.0).</p>`);
    try {
      if (window.HBFinal) HBFinal.mount("#aBtnsCard");
      { const ac = $("#aCrash"); if (ac) ac.onchange = () => { ST.crashRep = ac.checked; save(); }; }
      { const dn = $("#aDn"); if (dn) dn.onchange = async () => { ST.dn = dn.value; save(); if (window.SRDivine) await SRDivine.load(ST.dn); pageEls.forEach(e => { if (e) e.dataset.r = ""; }); render(cur, true); render(cur + 1); render(cur - 1); toast("ההגדרה תחול על כל הדפים"); }; }
      crypto.subtle.digest("SHA-256", bytes()).then(h => { const x = Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, "0")).join(""); const e = $("#aShaOk"); if (e) e.textContent = x === window.SR_PDF_SHA ? "✓ תואם למקור" : "✗ לא תואם"; });
    } catch (e) { }
  }

  /* ---------- הדפסה ושמירה ---------- */
  const MAXP = 10; /* 1.3.1: מקסימום עמודים בכל ייצוא */
  function printDlg() {
    const v = visible();
    dlg(`<h2>הדפסה / שמירה כ-PDF</h2>
      <div class="seg" style="flex-direction:column;gap:.5em">
        <label><input type="radio" name="pr" value="cur" checked> העמוד הנוכחי (${heb(cur)})</label>
        ${v.length > 1 ? `<label><input type="radio" name="pr" value="vis"> שני העמודים המוצגים (${v.map(heb).join("–")})</label>` : ""}
        <label><input type="radio" name="pr" value="sec"> הפרק הנוכחי${section(cur) ? " — " + esc(section(cur)[0]) : ""}</label>
        <label><input type="radio" name="pr" value="bentch"> סדר ברכת המזון בלבד (עמ' כד–לב)</label>
        <label><input type="radio" name="pr" value="rng"> טווח: מעמוד <input type="text" id="pA" value="${heb(cur)}" style="width:3.5em"> עד <input type="text" id="pB" value="${heb(cur)}" style="width:3.5em"></label>
        <!-- 1.3.1: ייצוא כל הספר הוסר
        <label><input type="radio" name="pr" value="all"> כל הספר (${N} עמודים)</label>
        -->
      </div>
      <p class="small" id="prInfo">אפשר להדפיס או לשמור עד ${MAXP} עמודים בכל פעם. בתחילת המסמך יופיעו קישור לחנות התוספים, סמל המכון ופרטי יצירת קשר.</p>
      <div class="acts"><button class="btn" id="prCancel">ביטול</button><button class="btn pri" id="prGo">הכנה</button></div>`);
    $("#prCancel").onclick = closeDlg;
    $("#prGo").onclick = async () => {
      const k = (document.querySelector("input[name=pr]:checked") || {}).value; let a = cur, b = cur;
      if (k === "vis") { a = v[0]; b = v[v.length - 1]; }
      else if (k === "sec") { const i = B.full.indexOf(section(cur)); a = section(cur) ? section(cur)[1] : cur; const nx = B.full.slice(i + 1).find(e => e[1] > a); b = nx ? nx[1] - 1 : N; }
      else if (k === "bentch") { a = 24; b = 32; }
      else if (k === "rng") { a = parseHeb($("#pA").value); b = parseHeb($("#pB").value); if (!(a >= 1 && b >= a && b <= N)) return toast("טווח עמודים לא תקין"); }
      // else if (k === "all") { a = 1; b = N; }  /* 1.3.1: הוסר */
      if (b - a + 1 > MAXP) {
        if (k === "rng") return toast("אפשר לייצא עד " + heb(MAXP) + " עמודים בכל פעם. את הספר המלא אפשר להוריד מחנות התוספים של אוצריא");
        b = a + MAXP - 1; toast("הוכנו " + heb(MAXP) + " עמודים ראשונים בלבד (מגבלת ייצוא)");
      }
      const btn = $("#prGo"); btn.disabled = true; const area = $("#printArea"); area.innerHTML = "";
      /* 1.3.1: דף פתיחה בתחילת המסמך — קישור לחנות, סמל המכון, יצירת קשר */
      area.insertAdjacentHTML("beforeend", `<div class="phead"><img src="img/makhon.png" alt=""><h1>${esc(B.title)}</h1><p>${esc(B.publisher)} · ${esc(B.author)}</p>
        <p class="pl">להורדת התוסף "ברכת המזון – שיח רינה" וקבלת הספר המלא:<br><b dir="ltr">${esc(B.links.store)}</b></p>
        <p class="pc">יצירת קשר עם המכון: טלפון <b dir="ltr">${esc(B.phone)}</b> · דוא"ל <b dir="ltr">${esc(B.email)}</b></p>
        <p class="pc">${esc(ref(a))}${b > a ? " – " + heb(b) : ""} · קוד המקור: <b dir="ltr">https://github.com/Hadabadra/Prayer-pointA/tree/ברכת-המזון</b></p></div>`);
      try { await area.querySelector(".phead img").decode(); } catch (e) { }
      for (let p = a; p <= b; p++) {
        $("#prInfo").textContent = `מכין עמוד ${heb(p)} (${p - a + 1}/${b - a + 1})…`;
        const page = await pdf.getPage(p), vp = page.getViewport({ scale: 2 }), c = document.createElement("canvas");
        c.width = vp.width; c.height = vp.height; await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
        if (window.SRDivine && SRDivine.active()) { try { SRDivine.mask(c.getContext("2d"), await page.getTextContent(), vp, pdfjsLib.Util, 1); } catch (e) { } }
        const im = new Image(); im.src = c.toDataURL("image/jpeg", 0.9); area.appendChild(im);
      }
      /* 2.1.0: בלי דף סיום — הפרטים כבר בדף הפתיחה */
      $("#prInfo").textContent = `מוכן: ${b - a + 1} עמודים. בחרו פעולה:`;
      const acts = btn.parentNode; acts.innerHTML = `<button class="btn" id="prCancel2">ביטול</button><button class="btn" id="prPdf">${SRIcon("copy")}שמירה כ-PDF</button><button class="btn pri" id="prPrint">${SRIcon("print")}הדפסה</button>`;
      $("#prCancel2").onclick = closeDlg;
      const run = async m => { document.body.classList.add("printing"); const r = await call(m, { fileName: "שיח רינה " + heb(a) + (b > a ? "-" + heb(b) : ""), pageSize: "a4", marginMm: 0 }); if (!r || r.success === false) { try { window.print(); } catch (e) { } } closeDlg(); };
      $("#prPrint").onclick = () => run("ui.print"); $("#prPdf").onclick = () => run("ui.exportPdf");
    };
  }


  /* ---------- 1.1.0: ברכת המזון היום, סעודה מיוחדת, שכחתי ---------- */
  function dayInfo() { const d = new Date(); return SRDay(ST.night2 ? new Date(d.getTime() + 864e5) : d, !!ST.diaspora); }
  const P = { clean: 24, nisimC: 26, retzeiC: 28, nisim: 44, retzei: 48, yaaleh: 49, forgot: 50, forgotNisim: 60, rachamanShabbat: 59, brit: 36, britR: 58, sheva: 38, shevaB: 62, guest: 54 };
  function heDate(i) { const m = i.heb.match(/^(\d+) ב(.*)$/); return m ? heb(+m[1]).replace(/(.)$/, (x) => x) + " ב" + m[2] : i.heb; }
  function todayLine(i) {
    const add = [i.retzei && "רצה והחליצנו", i.yaaleh && "יעלה ויבוא", i.nisim && "על הניסים"].filter(Boolean);
    return add.length ? "מוסיפים בברכת המזון: " + add.join(" · ") : "יום רגיל — בלי תוספות";
  }
  function todayDlg() {
    const i = dayInfo(), j = (p, t, sub) => `<button class="tj" data-go="${p}"><b>${esc(t)}</b><span>${esc(sub || "")} עמ' ${heb(p)}</span></button>`;
    dlg(`<h2>ברכת המזון היום</h2>
      <p class="today"><b>${esc(heDate(i))}</b>${i.names.length ? " · " + esc(i.names.join(" · ")) : ""}<br>${esc(todayLine(i))}</p>
      <div class="seg"><label><input type="checkbox" id="tNight" ${ST.night2 ? "checked" : ""}> כבר אחרי צאת הכוכבים (התאריך של מחר)</label>
      <label><input type="checkbox" id="tDias" ${ST.diaspora ? "checked" : ""}> חוץ לארץ</label></div>
      <div class="tgrid">
        ${j(P.clean, "לסדר ברכת המזון", "ללא הערות ·")}
        ${i.nisim ? j(P.nisimC, "על הניסים", "בסדר ·") : ""}${(i.retzei || i.yaaleh) ? j(P.retzeiC, (i.retzei ? "רצה" : "") + (i.retzei && i.yaaleh ? " ו" : "") + (i.yaaleh ? "יעלה ויבוא" : ""), "בסדר ·") : ""}
        ${i.nisim ? j(P.nisim, "על הניסים", "עם הערות ·") : ""}${i.retzei ? j(P.retzei, "רצה והחליצנו", "עם הערות ·") : ""}${i.yaaleh ? j(P.yaaleh, "יעלה ויבוא", "עם הערות ·") : ""}
        ${(i.retzei || i.yaaleh) ? j(P.rachamanShabbat, "הרחמן לשבת ומועדים", "") : ""}
      </div>
      <h3>סעודה מיוחדת</h3>
      <div class="tgrid">${j(P.brit, "זימון לסעודת ברית מילה", "")}${j(P.britR, "הרחמן לברית מילה", "")}${j(P.sheva, "זימון לשבע ברכות", "")}${j(P.shevaB, "ברכות נישואין", "")}${j(P.guest, "ברכת האורח", "")}</div>
      <h3>שכחתי…</h3>
      <div class="tgrid">${j(P.forgot, "שכחתי רצה / יעלה ויבוא", "הדינים והברכות ·")}${j(P.forgotNisim, "שכחתי על הניסים", "הרחמן לשוכח ·")}</div>
      <p class="small">התאריך מחושב לפי לוח המחשב. הדינים מפורטים בספר; בכל ספק — שאלו רב.</p>
      `);  /* 1.3.2: כפתור "ברכה במסך מלא" הועבר לסרגל */
    $("#tNight").onchange = e => { ST.night2 = e.target.checked; save(); todayDlg(); paintToday(); };
    $("#tDias").onchange = e => { ST.diaspora = e.target.checked; save(); todayDlg(); paintToday(); };
    // $("#tFocus").onclick = () => { closeDlg(); focusMode(true); };
  }
  function paintToday() {
    const i = dayInfo(), t = (i.names.length ? i.names.join(" · ") + " — " : "") + todayLine(i);
    const w = $("#wToday"); if (w) { w.innerHTML = `${SRIcon("cal")}<span><b>${esc(heDate(i))}</b> · ${esc(t)}</span>`; }
    const b = $("#bToday"); if (b) { b.classList.toggle("on", !i.plain); b.title = "ברכת המזון היום — " + heDate(i) + (i.plain ? "" : " · " + t); }
  }

  /* ---------- מסך מלא לברכה ---------- */
  let preFocus = null;
  function focusMode(on) {
    if (on) {
      if (!preFocus) preFocus = { mode: ST.mode, fit: ST.fit, side: ST.side };
      welcome(false); $("#side").classList.add("hid"); document.body.classList.add("focus");
      ST.mode = "single"; ST.fit = "page"; try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => { }); } catch (e) { }
      sizeKey = ""; layout(); go(cur >= 23 && cur <= 32 ? cur : P.clean, true);
    } else {
      document.body.classList.remove("focus"); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { }
      if (preFocus) { ST.mode = preFocus.mode; ST.fit = preFocus.fit; if (preFocus.side) $("#side").classList.remove("hid"); preFocus = null; }
      save(); sizeKey = ""; layout(); go(cur, true);
    }
  }

  /* ---------- הערות לעמוד ---------- */
  function noteDlg(p) {
    p = p || cur; const v = (ST.notes || {})[p] || "";
    dlg(`<h2>הערה לעמוד ${heb(p)}</h2><p class="small">${esc(ref(p))}</p>
      <textarea id="nTxt" placeholder="כתבו כאן הערה, חידוש או תזכורת…">${esc(v)}</textarea>
      <div class="acts">${v ? `<button class="btn" id="nDel">${SRIcon("trash")}מחיקה</button>` : ""}<button class="btn" id="nCancel">ביטול</button><button class="btn pri" id="nSave">שמירה</button></div>`);
    setTimeout(() => $("#nTxt").focus(), 50);
    $("#nCancel").onclick = closeDlg;
    if ($("#nDel")) $("#nDel").onclick = () => { delete ST.notes[p]; save(); closeDlg(); onPage(); markNotes(); if (ST.side && ST.tab === "marks") showTab(); toast("ההערה נמחקה"); };
    $("#nSave").onclick = () => { const t = $("#nTxt").value.trim(); ST.notes = ST.notes || {}; if (t) ST.notes[p] = t; else delete ST.notes[p]; save(); closeDlg(); onPage(); markNotes(); if (ST.side && ST.tab === "marks") showTab(); toast(t ? "ההערה נשמרה" : "ההערה נמחקה"); };
  }
  function markNotes() { pageEls.forEach(el => { const p = +el.dataset.p, has = !!(ST.notes || {})[p]; let b = el.querySelector(".nb"); if (has && !b) { el.insertAdjacentHTML("beforeend", `<button class="nb" title="הערה שלי">${SRIcon("note")}</button>`); b = el.querySelector(".nb"); b.onclick = () => noteDlg(p); } else if (!has && b) b.remove(); if (b) b.title = ST.notes[p]; }); }

  /* ---------- טקסט מסומן: חיפוש בספריית אוצריא / העתקה ---------- */
  function selTool() {
    const t = $("#selTool"), s = window.getSelection(), txt = s ? String(s).replace(/\s+/g, " ").trim() : "";
    if (!txt || txt.length < 2 || !s.anchorNode || !$("#pages").contains(s.anchorNode)) { t.classList.add("hid"); return; }
    const r = s.getRangeAt(0).getBoundingClientRect(); t.dataset.q = txt.slice(0, 200);
    t.classList.remove("hid"); t.style.top = Math.max(4, r.top - t.offsetHeight - 8) + "px"; t.style.left = Math.max(4, Math.min(innerWidth - t.offsetWidth - 4, r.left + r.width / 2 - t.offsetWidth / 2)) + "px";
  }

  /* ---------- עמוד כניסה ---------- */
  function welcome(show) {
    $("#welcome").classList.toggle("hid", !show); $("#app").classList.toggle("hid", !!show);
    if (show) {
      $("#wEdition").textContent = B.edition; $("#wSkip").checked = !!ST.skip;
      paintToday(); const r = $("#wResume"); r.classList.toggle("hid", !(ST.page > 1)); r.querySelector("span").textContent = "המשך מעמוד " + heb(ST.page || 1);
    } else setTimeout(() => { sizeKey = ""; layout(); go(cur, true); }, 20);
  }
  const enter = (p, tab) => { welcome(false); if (tab) side(true, tab); if (p) setTimeout(() => go(p, true), 60); };

  /* ---------- אוצריא: ספרייה וחיפוש ---------- */
  function external(q) { welcome(false); side(true, "find"); $("#q").value = q; runFind(q); const h = search(q).hits[0]; if (h) setTimeout(() => go(h.p, true), 80); }
  async function registerLibrary() {
    if (ST.libv === VERSION) return;
    const r = await call("library.setProviderBooks", { provider: "siach-rina", books: [{ id: 1, title: "שיח רינה — סדר ברכת המזון", author: B.author, categoryPath: "/הלכה/ברכת המזון" }] });
    if (r && r.success !== false) { ST.libv = VERSION; save(); }
  }

  /* ---------- חיווט ---------- */
  function wire() {
    $("#wStart").onclick = () => enter(ST.page > 1 ? null : 1);
    $("#wResume").onclick = () => enter(ST.page);
    $("#wBentch").onclick = () => enter(24);
    $("#wToc").onclick = () => enter(null, "full");
    $("#wSkip").onchange = e => { ST.skip = e.target.checked; save(); };
    $("#wContact").onclick = () => contact(); $("#wAbout").onclick = about;
    $("#bHome").onclick = () => welcome(true);
    $("#bToday").onclick = todayDlg; $("#wToday").onclick = todayDlg;
    $("#bFocus2").onclick = () => focusMode(true);
    if ($("#bFocus")) $("#bFocus").onclick = () => focusMode(!document.body.classList.contains("focus"));
    $("#fExit").onclick = () => focusMode(false); $("#fPrev").onclick = () => step(-1); $("#fNext").onclick = () => step(1);
    $("#bNote").onclick = () => noteDlg();
    document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && document.body.classList.contains("focus")) focusMode(false); });
    document.addEventListener("selectionchange", deb(selTool, 250));
    $("#selTool").onclick = e => { const b = e.target.closest("button"), q = $("#selTool").dataset.q; if (!b || !q) return;
      if (b.dataset.a === "lib") call("reader.openSearchTab", { query: q.replace(/[\u0591-\u05C7]/g, "").replace(/מהדורת\s*PDF|PDF/g, "").replace(/\s+/g, " ").trim() }).then(r => { if (!r || r.success === false) toast("לא ניתן לפתוח חיפוש באוצריא"); });
      else copy("\u201C" + q + "\u201D (" + ref(cur) + ")"); $("#selTool").classList.add("hid"); };
    $("#bToc").onclick = () => side(!(ST.side && ST.tab !== "find") ? true : false, ST.tab === "find" ? "short" : ST.tab);
    $("#bSearch").onclick = () => side(!(ST.side && ST.tab === "find"), "find");
    $("#sClose").onclick = () => side(false);
    $("#tabs").onclick = e => { const b = e.target.closest("button"); if (b) { ST.tab = b.dataset.t; showTab(); save(); side(true); } };
    $("#sList").onclick = e => {
      const d = e.target.closest("[data-del]"); if (d) { ST.marks = ST.marks.filter(m => m.p !== +d.dataset.del); save(); showTab(); return; }
      const ne = e.target.closest("[data-note]"); if (ne) { noteDlg(+ne.dataset.note); return; }
      const b = e.target.closest("[data-p]"); if (b) { go(+b.dataset.p); if (innerWidth < 700) side(false); }
    };
    $("#q").oninput = deb(e => runFind(e.target.value), 220);
    $("#quick").innerHTML = B.quick.map(q => `<button data-p="${q[1]}" title="${esc(q[2])} — עמ' ${heb(q[1])}">${esc(q[0])}</button>`).join("");
    $("#quick").onclick = e => { const b = e.target.closest("[data-p]"); if (b) go(+b.dataset.p); };
    $("#bPrev").onclick = () => step(-1); $("#bNext").onclick = () => step(1);
    $("#pg").onchange = e => { const n = parseHeb(e.target.value); if (n >= 1 && n <= N) go(n); else { toast("עמוד לא קיים"); onPage(); } };
    $("#pg").onfocus = e => e.target.select();
    $("#bMark").onclick = toggleMark;
    $("#bView").onclick = e => menu("#menuView", e.currentTarget);
    $("#bForgot").onclick = e => menu("#menuForgot", e.currentTarget);
    $("#menuForgot").onclick = e => { const b = e.target.closest("[data-go]"); if (b) { $$(".menu").forEach(x => x.classList.add("hid")); go(+b.dataset.go); } };
    $("#bContact").onclick = () => contact();
    $("#menuView").onclick = e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.mode) { ST.mode = b.dataset.mode; if (ST.mode !== "scroll" && ST.fit === "width") ST.fit = "page"; if (ST.mode === "scroll" && ST.fit === "page") ST.fit = "width"; }
      else if (b.dataset.fit) ST.fit = b.dataset.fit;
      else if (b.id === "zIn" || b.id === "zOut") { const w = pageSize().w; ST.fit = "zoom"; ST.zoom = Math.max(.4, Math.min(4, (w / 600) * (b.id === "zIn" ? 1.15 : 1 / 1.15))); }
      else if (b.id === "bNight") ST.night = !ST.night;
      if (b.dataset.mode || b.dataset.fit || b.id === "bNight") $$(".menu").forEach(x => x.classList.add("hid"));
      save(); const p = cur; sizeKey = ""; layout(); go(p, true);
    };
    $("#bPrint").onclick = () => { $$(".menu").forEach(x => x.classList.add("hid")); printDlg(); };
    $("#bCopyRef").onclick = () => { $$(".menu").forEach(x => x.classList.add("hid")); copy(ref(cur)); };
    $("#bAbout").onclick = () => { $$(".menu").forEach(x => x.classList.add("hid")); about(); };
    $("#dX").onclick = closeDlg; $("#dlg").onclick = e => { if (e.target.id === "dlg") closeDlg(); };
    $("#dBody").addEventListener("click", e => { const gj = e.target.closest("[data-go]"); if (gj) { closeDlg(); if ($("#app").classList.contains("hid")) welcome(false); go(+gj.dataset.go, true); return; } const c = e.target.closest("[data-copy]"); if (c) copy(c.dataset.copy); const u = e.target.closest("[data-url]"); if (u) e.preventDefault(); if (u) call("app.openUrl", { url: u.dataset.url }); });
    document.addEventListener("click", e => { if (!e.target.closest(".menu") && !e.target.closest("#bView,#bForgot")) $$(".menu").forEach(x => x.classList.add("hid")); });
    view().addEventListener("scroll", onScroll, { passive: true });
    let wl = 0; view().addEventListener("wheel", e => {
      if (e.ctrlKey) { e.preventDefault(); const w = pageSize().w; ST.fit = "zoom"; ST.zoom = Math.max(.4, Math.min(4, (w / 600) * (e.deltaY < 0 ? 1.1 : 1 / 1.1))); sizeKey = ""; layout(); go(cur, true); save(); return; }
      if (ST.mode === "scroll") return; const v = view(); if (v.scrollHeight > v.clientHeight + 4 && !((e.deltaY > 0 && v.scrollTop + v.clientHeight >= v.scrollHeight - 2) || (e.deltaY < 0 && v.scrollTop <= 0))) return;
      e.preventDefault(); const t = Date.now(); if (t - wl < 350) return; wl = t; step(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });
    let tx = null; view().addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
    view().addEventListener("touchend", e => { if (tx === null || ST.mode === "scroll") return; const dx = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(dx) > 60) step(dx > 0 ? 1 : -1); }, { passive: true });
    document.addEventListener("keydown", e => {
      if (!$("#dlg").classList.contains("hid")) { if (e.key === "Escape") closeDlg(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") { e.preventDefault(); if ($("#app").classList.contains("hid")) welcome(false); side(true, "find"); return; }
      if (e.key === "Escape") { if (document.body.classList.contains("focus")) focusMode(false); $$(".menu").forEach(x => x.classList.add("hid")); return; }
      if (/INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName) || $("#app").classList.contains("hid")) return;
      if (e.key === "ArrowLeft" || e.key === "PageDown" || (e.key === " " && ST.mode !== "scroll")) { e.preventDefault(); step(1); }
      else if (e.key === "ArrowRight" || e.key === "PageUp") { e.preventDefault(); step(-1); }
      else if (e.key === "Home") { e.preventDefault(); go(1); } else if (e.key === "End") { e.preventDefault(); go(N); }
    });
    addEventListener("resize", deb(() => { const p = cur; sizeKey = ""; layout(); go(p, true); }, 150));
  }

  /* ---------- אתחול ---------- */
  let booted = false, pendingQ = null, pendingP = null, pendingOpen = false;
  function handleParam(p) { const prm = p && (p.param || p.params); if (prm && prm.page) { pendingP = +prm.page; if (booted) enter(pendingP); } }
  async function boot() {
    if (booted) return; await load(); wire(); SRIcons();
    if (window.SRDivine) { try { await SRDivine.load(ST.dn); } catch (e) { } }
    try { await openPdf(); } catch (e) { $("#pages").innerHTML = '<p class="empty" style="color:var(--color-on-primary)">לא ניתן היה לפתוח את הספר. נסו לסגור ולפתוח את התוסף.</p>'; }
    booted = true;
    if (ST.side) { $("#side").classList.remove("hid"); showTab(); $("#bToc").classList.toggle("on", ST.tab !== "find"); }
    if (pendingQ) external(pendingQ); else if (pendingP) enter(pendingP); else if (pendingOpen) enter(ST.page || 1); else welcome(!ST.skip);
    registerLibrary();
  }
  if (O) {
    O.on("plugin.boot", p => { if (p && p.theme) theme(p.theme); const rs = p && p.restore && p.restore.state; if (rs && rs.page) { if (rs.mode) ST.mode = rs.mode; pendingP = +rs.page; } handleParam(p); boot(); });
    O.on("theme.changed", theme);
    O.on("plugin.page_opened", handleParam);
    O.on("search.requested", d => { const q = String((d && d.request && d.request.query) || (d && d.query) || "").trim(); if (!q) return; if (booted) external(q); else pendingQ = q; });
    O.on("library.providerBook.openRequested", () => { if (booted) enter(ST.page || 1); else pendingOpen = true; });
    setTimeout(boot, 1500); /* גיבוי אם plugin.boot לא הגיע */
  } else document.addEventListener("DOMContentLoaded", boot);
})();
