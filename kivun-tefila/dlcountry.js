/* כיוון תפילה 3.0.7 — קבצים לפי מדינה גם בחלון ההורדות (כבישים ושכבות: בתי כנסת, רכבות, שדות תעופה).
   משתמש בכפתורים הקיימים שליד חיפוש המיקום (names.js, layers.js), כדי שיהיה מקום אחד להורדות. */
(function () {
  const $ = id => document.getElementById(id);
  const anchor = $("geoDl") && $("geoDl").closest(".dlitem"), src = $("nsCountry");
  if (!anchor || !src) return;
  const it = document.createElement("div"); it.className = "dlitem";
  it.innerHTML = '<b>קבצים לפי מדינה</b> <small>כבישים, ובתי כנסת, תחנות רכבת ושדות תעופה</small>'
    + '<div class="row"><select id="dcC" aria-label="מדינה"></select></div>'
    + '<div class="row"><span>כבישים:</span><button id="dcRd" type="button">הורד</button><button id="dcRdImp" type="button">טען מקובץ</button><button id="dcRdLink" type="button">העתק קישור</button></div>'
    + '<div class="row"><span>שכבות:</span><button id="dcLy" type="button">הורד</button><button id="dcLyImp" type="button">טען מקובץ</button><button id="dcLyLink" type="button">העתק קישור</button></div>'
    + '<small id="dcMsg" aria-live="polite"></small>';
  anchor.after(it);
  const fill = () => { const v = $("dcC").value; $("dcC").innerHTML = [...src.options].filter(o => o.value).map(o => `<option value="${o.value}">${o.textContent}</option>`).join(""); if (v) $("dcC").value = v; else if ($("dcC").querySelector('option[value="ISR"]')) $("dcC").value = "ISR" };
  fill(); new MutationObserver(fill).observe(src, { childList: true });
  /* הודעות הכפתורים המקוריים מופיעות גם כאן */
  const m = $("nsMsg"); if (m) new MutationObserver(() => { $("dcMsg").textContent = m.textContent }).observe(m, { childList: true, characterData: true, subtree: true });
  const run = id => () => { const c = $("dcC").value; if (!c) return; src.value = c; src.dispatchEvent(new Event("change", { bubbles: true })); const b = $(id); if (b) b.click(); else $("dcMsg").textContent = "לא זמין לגרסה זו." };
  $("dcRd").onclick = run("rdDl"); $("dcRdImp").onclick = run("rdImp"); $("dcRdLink").onclick = run("rdLink");
  $("dcLy").onclick = run("lyDl"); $("dcLyImp").onclick = run("lyImp"); $("dcLyLink").onclick = run("lyLink");
  /* "כל קבצי הנתונים" — לדף שמוריד ישירות */
  const dl = $("dataLink"); if (dl) { const u = "https://github.com/Hadabadra/Prayer-pointA/releases/tag/kivun-tefila-data";
    dl.textContent = "פתח את דף ההורדות"; dl.onclick = e => { e.stopImmediatePropagation(); let w = null; try { w = window.open(u, "_blank", "noopener") } catch (x) {} if (!w && window.Otzaria) window.Otzaria.call("app.openUrl", { url: u }).catch(() => {}) } }
})();
