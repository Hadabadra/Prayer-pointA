/* 3.4.0 — עיצוב מחדש של חלוניות ההגדרות וההורדות: סעיפים עם כותרת, כרטיסים, שורות הגדרה עם מתג בצד,
   כרטיס הורדה עם סמל, כפתור ראשי ופעולות משניות. הקוד רק מזיז אלמנטים קיימים (המאזינים נשמרים). */
(function init() {
  if (document.readyState !== "complete") return addEventListener("load", init, { once: true });
  const $ = i => document.getElementById(i);
  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e };
  const ICON = {
    dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    road: '<path d="M8 3 5 21M16 3l3 18M12 5v2M12 11v2M12 17v2"/>', water: '<path d="M3 10c3-2 6 2 9 0s6-2 9 0M3 16c3-2 6 2 9 0s6-2 9 0"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', link: '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', book: '<path d="M4 19V6a2 2 0 0 1 2-2h12v15H6a2 2 0 0 0-2 2z"/>'
  };
  const svg = k => '<svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[k] || ICON.dl) + '</svg>';
  function sec(p, title, id) {
    let s = id && $(id); if (s) return s.querySelector(".ks-card");
    s = el("section", "ks-sec"); if (id) s.id = id;
    s.append(el("h3", "ks-h", title)); const c = el("div", "ks-card"); s.append(c); p.append(s); return c;
  }
  /* שורת הגדרה: טקסט + תיאור, ופקד בצד */
  function row(card, ctrl, title, desc) {
    const r = el("div", "ks-row"); const t = el("div", "ks-txt");
    t.append(el("div", "ks-tt", title)); if (desc) t.append(el("div", "ks-ds", desc));
    const c = el("div", "ks-ctl"); c.append(ctrl); r.append(t, c); card.append(r); return r;
  }
  const clean = s => (s || "").replace(/\s+/g, " ").trim();

  function doSet() {
    const p = $("set"); if (!p || p.dataset.ks) return;
    const chk = [["splashShow"], ["prayShow"], ["lyOn"]].map(([i]) => $(i)).filter(Boolean);
    if (chk.length < 2) return; // עוד לא נבנה
    p.dataset.ks = "1";
    const disp = sec(p, "תצוגה", "ksDisp");
    chk.forEach(inp => {
      const box = inp.closest(".setrow") || inp.closest("p") || inp.parentElement;
      const sm = box.querySelector("small"); const desc = sm ? clean(sm.textContent) : "";
      const lab = inp.closest("label"); let tt = clean((lab || box).textContent); if (desc) tt = clean(tt.replace(desc, ""));
      row(disp, inp, tt, desc); box.remove();
    });
    const st = $("stList");
    if (st) { const c = sec(p, "אזורי רחובות שהורדו", "ksAreas"); const prev = st.previousElementSibling; if (prev && /אזורים שהורדת/.test(prev.textContent)) prev.remove(); c.append(st); st.classList.add("ks-list") }
    const more = el("details", "ks-more"); more.append(el("summary", "", "טיפים, מיקודים וזכויות"));
    [...p.children].forEach(c => { if (c.tagName === "P" || (c.classList.contains("row") && !c.children.length)) more.append(c) });
    if (more.children.length > 1) { const s = el("section", "ks-sec"); s.append(more); p.append(s) }
  }

  function doDl() {
    const p = $("dlp"), d = $("dls"); if (!p || !d || p.dataset.ks) return;
    p.dataset.ks = "1";
    const hd = p.querySelector(".pnlHd"), wb = p.querySelector(":scope>.wideb");
    const items = [...d.querySelectorAll(":scope>.dlitem")];
    const tip = d.querySelector(":scope>p");
    const rc = $("rcClear") && $("rcClear").closest(".setrow");
    const help = [...p.querySelectorAll(":scope>details.sd")].filter(x => x !== d && x.id !== "stEmbBox");
    const sets = [$("stRad"), $("stLang")].map(x => x && x.closest(".setrow")).filter(Boolean);
    const emb = $("stEmbBox");
    const data = sec(p, "נתונים להורדה", "ksData"), links = el("div");
    const ic = t => /רחוב/.test(t) ? "map" : /מדינה/.test(t) ? "globe" : /נהרות/.test(t) ? "water" : /כבישים/.test(t) ? "road" : /דף ההורדה|קבצי הנתונים/.test(t) ? "folder" : /סידורון/.test(t) ? "book" : "dl";
    items.forEach(it => {
      const b = it.querySelector(":scope>b"), sm = it.querySelector(":scope>small");
      const t = b ? clean(b.textContent) : "", ds = sm ? clean(sm.textContent) : "";
      const isLink = /דף ההורדה|קבצי הנתונים/.test(t);
      const card = el("div", "ks-dl"); if (it.hidden) card.hidden = true;
      const ico = el("div", "ks-ico"); ico.innerHTML = svg(ic(t));
      const body = el("div", "ks-body"); body.append(el("div", "ks-tt", t));
      const mb = ds.match(/כ-?\s?[\d.]+\s?MB/); if (mb) { const ch = el("span", "ks-chip", mb[0].replace(/^כ-?\s?/, "")); body.firstChild.append(" ", ch) }
      if (ds) body.append(el("div", "ks-ds", clean(ds.replace(/^כ-?\s?[\d.]+\s?MB\.?\s*/, ""))));
      it.querySelectorAll(":scope>.row,:scope>select,:scope>.sfxb").forEach(r => {
        r.classList.add("ks-acts");
        let first = true;
        r.querySelectorAll("button:not(.sfxb)").forEach(bt => { bt.classList.add(first && !isLink ? "ks-pri" : "ks-sec-b"); if (isLink) bt.classList.add("ks-pri"); first = false });
        body.append(r);
      });
      card.append(ico, body); (isLink ? links : data).append(card); it.remove();
    });
    if (sets.length || rc) {
      const c = sec(p, "הגדרות הורדה", "ksDlSet");
      sets.forEach(s => { const sel = s.querySelector("select"), btn = s.querySelector(".sfxb"); const lab = s.querySelector("label"); const tt = clean([...lab.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join("")).replace(/:$/, ""); const w = el("div"); w.append(sel); if (btn) w.append(btn); row(c, w, tt); s.remove() });
      if (rc) { const sp = rc.querySelector("span"); const w = rc.querySelector(".row"); row(c, w, "זיכרון כבישים מהאינטרנט", sp ? clean(sp.textContent) : ""); rc.remove() }
    }
    if (emb) { const s = el("section", "ks-sec"); s.append(emb); emb.classList.add("ks-more"); p.append(s) }
    if (links.children.length) { const c = sec(p, "קישורים", "ksLinks"); [...links.children].forEach(x => c.append(x)) }
    const hs = el("section", "ks-sec"); help.forEach(h => { h.classList.add("ks-more"); hs.append(h) });
    if (tip) { const h = el("details", "ks-more"); h.append(el("summary", "", "במחשב בלי אינטרנט"), tip); hs.append(h) }
    if (hs.children.length) p.append(hs);
    d.remove();
    if (hd) p.prepend(hd); if (wb && hd) hd.after(wb);
  }
  const run = () => { try { doSet() } catch (e) {} try { doDl() } catch (e) {} };
  run();
  ["set", "dlp"].forEach(i => { const p = $(i); if (p) new MutationObserver(run).observe(p, { attributes: true, attributeFilter: ["hidden"], childList: true }) });
})();
