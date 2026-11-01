/* כיוון תפילה 3.5.4 — מפה משותפת (Prayer-pointA#11): כפתורי שכבות לתוספים האחרים עם מפה.
   לחיצה פותחת את התוסף ההוא באותו מקום (plugin.openOther, param.type = "open-map"); אם אינו מותקן — קישור לחנות.
   ובכיוון ההפוך: תוסף אחר שפותח את כיוון תפילה עם open-map מציב את המיקום שהתקבל.
   רשימת התוספים זהה ל-MapUI.PLUGINS שב-Hadabadra/Mikvaot/shared/map-core/map-ui.js — לעדכן יחד. */
(function () {
  const O = window.Otzaria, map = document.getElementById("map");
  if (!map) return;
  const SELF = "com.shiachrina.kivuntefila";
  const PLUGINS = [
    { id: "com.hadabadra.mikvaot", name: "מקוואות", store: "https://otzaria.org/plugins/6ad9c9c92917198d739939b7" },
    { id: "com.hadabadra.gvulot-eruv", name: "גבולות עירוב", store: "https://otzaria.org/plugins/6ad93b5d2917198d73992a9d" }
  ].filter(p => p.id !== SELF);
  const row = document.createElement("div");
  row.className = "row tight"; row.id = "mlRow";
  row.innerHTML = '<span style="opacity:.8">שכבות:</span>' + PLUGINS.map(p => '<button type="button" data-ml="' + p.id + '" title="פתיחת התוסף ' + p.name + ' באותו מקום במפה">↗ ' + p.name + '</button>').join("") + '<span id="mlMsg" style="font-size:.9em"></span>';
  map.after(row);
  const msg = document.getElementById("mlMsg");
  row.addEventListener("click", e => {
    const b = e.target.closest("[data-ml]"); if (!b) return;
    const p = PLUGINS.find(x => x.id === b.dataset.ml); if (!p) return;
    let here = null; try { here = typeof pos !== "undefined" && pos ? pos : null } catch (err) {}
    const fail = () => {
      msg.textContent = ' התוסף "' + p.name + '" לא נפתח. אם אינו מותקן — אפשר להתקין מחנות התוספים. ';
      const s = document.createElement("button"); s.type = "button"; s.textContent = "לחנות";
      s.onclick = () => { if (O) O.call("app.openUrl", { url: p.store }).catch(() => {}); else open(p.store) }; msg.appendChild(s);
    };
    if (!O) return fail();
    msg.textContent = "";
    O.call("plugin.openOther", { pluginId: p.id, param: { type: "open-map", lat: here ? here[0] : null, lon: here ? here[1] : null, from: SELF } })
      .then(r => { if (r && r.success === false) fail() }).catch(fail);
  });
  if (O && O.on) O.on("plugin.page_opened", e => {
    const p = e && (e.param || (e.data && e.data.param));
    if (!(p && typeof p === "object" && p.type === "open-map")) return;
    const la = +p.lat, lo = +p.lon;
    if (!isFinite(la) || !isFinite(lo) || (!la && !lo)) return;
    const s = document.getElementById("splash"); if (s) { s.hidden = true }
    try { setPos([la, lo], "מיקום מהמפה של תוסף אחר", null, false) } catch (err) {}
  });
})();
