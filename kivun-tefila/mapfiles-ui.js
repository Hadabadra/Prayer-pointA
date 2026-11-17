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
