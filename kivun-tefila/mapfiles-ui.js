/* כיוון תפילה 5.0.0 — קובץ מפות מהמחשב (shared/map-files): כפתור על המפה שפותח מפה מלאה עם הקובץ,
   המיקום שלי והקו לירושלים. כל הסוגים: MBTiles, PMTiles, sqlitedb, ZIP, GeoJSON, KML/KMZ, GPX, CSV. */
(function init() {
  if (document.readyState !== "complete") return addEventListener("load", init, { once: true });
  const tool = document.getElementById("mapTool"), O = window.Otzaria;
  if (!tool || !window.MapUI || !window.MapFiles || document.getElementById("mfBtn")) return;
  const call = (m, p) => O ? O.call(m, p) : Promise.resolve({ success: false });
  const b = document.createElement("button"); b.type = "button"; b.id = "mfBtn"; b.className = "mu-ib";
  b.title = "קובץ מפות מהמחשב (MBTiles, PMTiles, KML, GPX ועוד)"; b.setAttribute("aria-label", b.title); b.textContent = "▦";
  tool.appendChild(b);
  b.onclick = () => {
    let me = null; try { if (typeof pos !== "undefined" && pos) me = pos; } catch (e) {}
    const ov = document.createElement("div"); ov.className = "mfOverlay";
    ov.innerHTML = '<div class="mfBar"><b>מפה מקובץ</b><button type="button" class="mu" data-mf="load">קובץ מפות…</button><button type="button" class="mu" data-mf="close">סגירה</button></div><div class="mfMap"></div>';
    document.body.appendChild(ov);
    const ui = MapUI.mount(ov.querySelector(".mfMap"), { self: "com.shiachrina.kivuntefila", call, me, center: me || [31.7767, 35.2345], jerusalem: true, online: navigator.onLine !== false,
      openLink: u => call("app.openUrl", { url: u }) });
    ov.addEventListener("click", e => { const a = e.target.closest("[data-mf]"); if (!a) return; if (a.dataset.mf === "close") ov.remove(); else ui.loadMap(); });
    if (ui && ui.loadMap) setTimeout(() => ui.loadMap(), 50);
  };
  const st = document.createElement("style");
  st.textContent = ".mfOverlay{position:fixed;inset:0;z-index:9000;background:var(--color-surface);display:flex;flex-direction:column}.mfBar{display:flex;gap:.6em;align-items:center;padding:.5em .8em}.mfBar b{flex:1}.mfMap{flex:1;min-height:0}.mfMap .mapui .mu-view svg{max-height:none;height:100%}";
  document.head.appendChild(st);
})();
// קישורים ב"מה חדש" (data-url) נפתחים בדפדפן
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest("a[data-url]"); if (!a || a.closest(".hbf-box,.hbf-card")) return; e.preventDefault(); const u = a.getAttribute("data-url"); if (window.Otzaria) Otzaria.call("app.openUrl", { url: u }).catch(() => {}); else try { open(u, "_blank", "noopener"); } catch (er) {} });
/* 5.1: ניווט צדדי בתוך התפילה */
(function () {
  const st = document.createElement("style");
  st.textContent = ".pr-wrap{display:flex;gap:1em;align-items:flex-start}.pr-nav{position:sticky;top:0;flex:0 0 11em;max-height:70vh;overflow:auto;display:flex;flex-direction:column;gap:.15em;border-inline-end:.06em solid var(--color-outline-variant,var(--color-outline));padding-inline-end:.5em}.pr-nav button{font:inherit;font-size:.85em;text-align:start;background:none;border:0;border-radius:.5em;padding:.3em .5em;color:var(--color-on-surface);cursor:pointer}.pr-nav button:hover,.pr-nav button.on{background:var(--color-secondary-container,var(--color-surface-container-high));color:var(--color-on-secondary-container,var(--color-on-surface))}.pr-body{flex:1;min-width:0}.pr-body h4{color:var(--color-primary);margin:1em 0 .3em}.pr-t{white-space:pre-wrap;line-height:1.8}@media (max-width:40em){.pr-wrap{flex-direction:column}.pr-nav{position:static;flex-direction:row;flex-wrap:wrap;max-height:none;border:0}}";
  document.head.appendChild(st);
})();
/* 5.1: כרטיס אודות — גרסה, "מה חדש" (חלון הערכה), "כל היכולות" */
(function init() {
  if (document.readyState !== "complete") return addEventListener("load", init, { once: true });
  const v = document.getElementById("abtVer"); if (v) v.textContent = (window.HB_FINAL_DATA && HB_FINAL_DATA.version) || "";
  const n = document.getElementById("abtNews"); if (n) n.onclick = () => { if (window.HBFinal) HBFinal.showWhatsNew(null) };
  const f = document.getElementById("abtFeat"), d = document.getElementById("abtFeatD");
  if (f && d) { d.hidden = true; f.onclick = () => { d.hidden = !d.hidden; d.open = !d.hidden; if (!d.hidden) d.scrollIntoView({ block: "nearest" }) } }
  /* כלים מ"אודות וכלים" הישן (קיצור דרך, ייצוא PDF) עוברים לכרטיס; הכותרות הכפולות יוצאות */
  setTimeout(() => {
    const card = document.querySelector(".abt"), bb = card && card.querySelector(".abt-b"), old = document.getElementById("about");
    if (bb && old) { ["bShortcut", "bPdf"].forEach(id => { const b = document.getElementById(id); if (b) bb.appendChild(b) }); const m = document.getElementById("aboutMsg"); if (m) bb.after(m); old.remove() }
    const box = document.getElementById("aboutBox"); if (box) { const h = box.querySelector("h3.ph"); if (h) h.remove(); if (card) box.before(card) }
    const t = document.querySelector(".abt-t"); if (t) t.remove();
  }, 300);
})();
